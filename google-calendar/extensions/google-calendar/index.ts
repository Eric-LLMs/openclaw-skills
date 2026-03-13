import type { OpenClawPluginApi } from "openclaw/plugin-sdk"

// ── OAuth: refresh_token → access_token ──────────────────────────────────────
async function getAccessToken(cfg: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<string> {
  const clientId     = (cfg.clientId     ?? "").trim()
  const clientSecret = (cfg.clientSecret ?? "").trim()
  const refreshToken = (cfg.refreshToken ?? "").trim()
  if (!clientId || !clientSecret || !refreshToken) {
    throw new Error("Missing OAuth config: clientId, clientSecret, or refreshToken is empty")
  }

  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      refresh_token: refreshToken,
      grant_type:    "refresh_token",
    }),
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  }
  return data.access_token as string
}

// ── 辅助：补全时间字符串 ───────────────────────────────────────────────────────
function finalizeTime(raw: string | undefined | null, isEnd: boolean): string {
  if (!raw) {
    const today = new Date().toISOString().slice(0, 10)
    return isEnd ? `${today}T23:59:59Z` : `${today}T00:00:00Z`
  }

  let str = String(raw).trim()

  // 已经是完整 ISO（含 Z 或 +offset）
  if (/Z$|[+-]\d{2}:\d{2}$/.test(str)) return str

  const currentYear = new Date().getFullYear()

  // MM-DD → 补年份
  if (/^\d{2}-\d{2}$/.test(str)) {
    str = `${currentYear}-${str}`
  }

  // M/D 或 MM/DD → YYYY-MM-DD
  if (/^\d{1,2}\/\d{1,2}$/.test(str)) {
    const [m, d] = str.split("/")
    str = `${currentYear}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`
  }

  // YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}$/.test(str)) {
    return isEnd ? `${str}T23:59:59+08:00` : `${str}T00:00:00+08:00`
  }

  // YYYY-MM-DDTHH
  if (/^\d{4}-\d{2}-\d{2}T\d{2}$/.test(str)) {
    return isEnd ? `${str}:59:59+08:00` : `${str}:00:00+08:00`
  }

  // YYYY-MM-DDTHH:MM
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(str)) {
    return isEnd ? `${str}:59+08:00` : `${str}:00+08:00`
  }

  // YYYY-MM-DDTHH:MM:SS（无时区）
  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}$/.test(str)) {
    return `${str}+08:00`
  }

  return str
}

// ── 辅助：格式化事件列表 ────────────────────────────────────────────────────────
function formatEvents(items: any[]): string {
  if (!items.length) return "No events found."
  return JSON.stringify(
    items.map((e: any) => ({
      id:             e.id,
      title:          e.summary          ?? "(No title)",
      start:          e.start?.dateTime  ?? e.start?.date,
      end:            e.end?.dateTime    ?? e.end?.date,
      location:       e.location         ?? null,
      attendees:      (e.attendees ?? []).map((a: any) => a.email),
      conferenceLink: e.conferenceData?.entryPoints?.[0]?.uri ?? null,
      link:           e.htmlLink,
    })),
    null,
    2
  )
}

// ── 插件注册入口 ─────────────────────────────────────────────────────────────────
export function register(api: OpenClawPluginApi) {
  const rawConfig = api.config as any
  const pluginConfig = rawConfig?.plugins?.entries?.["google-calendar"]?.config ?? rawConfig
  const cfg = pluginConfig as {
     clientId:     string
     clientSecret: string
     refreshToken: string
     calendarId?:  string
  }

  console.log(`[google-calendar] cfg.clientId=`, cfg?.clientId?.slice(0, 20))

  const calId = () => encodeURIComponent(((cfg.calendarId ?? "primary") + "").trim())

  // ── Tool 1: 今天的事件 ──────────────────────────────────────────────────────
  api.registerTool({
    name: "calendar_today",
    description: "Get all Google Calendar events for today. Use when user asks: today schedule, what do I have today, today meetings.",
    parameters: {
      type:       "object",
      properties: {},
      required:   [],
    },
    async execute({ signal }: { signal: AbortSignal }) {
      const token   = await getAccessToken(cfg)
      const today   = new Date().toISOString().slice(0, 10)
      const timeMin = `${today}T00:00:00Z`
      const timeMax = `${today}T23:59:59Z`

      console.log(`[google-calendar] calendar_today: ${timeMin} ~ ${timeMax}`)

      const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId()}/events`)
      url.searchParams.set("timeMin",      timeMin)
      url.searchParams.set("timeMax",      timeMax)
      url.searchParams.set("singleEvents", "true")
      url.searchParams.set("orderBy",      "startTime")
      url.searchParams.set("maxResults",   "20")

      const r    = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal })
      const data = (await r.json()) as any
      if (!r.ok) throw new Error(`Calendar API error ${r.status}: ${JSON.stringify(data)}`)
      return formatEvents(data.items ?? [])
    },
  })

  // ── Tool 2: 按时间范围查询事件 ─────────────────────────────────────────────
  api.registerTool({
    name: "calendar_list_events",
    description: `Query Google Calendar events for a date range. Current year is ${new Date().getFullYear()}. If user does not specify a year, always use ${new Date().getFullYear()}. Supports partial dates like "03-11" or "3/11".`,
    parameters: {
      type: "object",
      properties: {
        timeMin: {
          type:        "string",
          description: `Start datetime. Default year is ${new Date().getFullYear()} if not specified. Formats: YYYY-MM-DD, MM-DD, YYYY-MM-DDTHH, YYYY-MM-DDTHH:MM, YYYY-MM-DDTHH:MM:SS, YYYY-MM-DDTHH:MM:SSZ`,
        },
        timeMax: {
          type:        "string",
          description: `End datetime. Default year is ${new Date().getFullYear()} if not specified. Same formats as timeMin.`,
        },
        maxResults: {
          type:        "number",
          description: "Max number of events to return (default: 20)",
        },
        query: {
          type:        "string",
          description: "Optional keyword search within event titles and descriptions",
        },
      },
      required: ["timeMin", "timeMax"],
    },
    // async execute({ params, signal }: { params: any; signal: AbortSignal }) {
    //   const token   = await getAccessToken(cfg)
    //   const timeMin = finalizeTime(params?.timeMin, false)
    //   const timeMax = finalizeTime(params?.timeMax, true)
    //
    //   console.log(`[google-calendar] calendar_list_events: ${timeMin} ~ ${timeMax}`)
    //
    //   const url = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId()}/events`)
    //   url.searchParams.set("timeMin",      timeMin)
    //   url.searchParams.set("timeMax",      timeMax)
    //   url.searchParams.set("maxResults",   String(params?.maxResults ?? 20))
    //   url.searchParams.set("singleEvents", "true")
    //   url.searchParams.set("orderBy",      "startTime")
    //   if (params?.query) url.searchParams.set("q", params.query)
    //
    //   const r    = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal })
    //   const data = (await r.json()) as any
    //   if (!r.ok) throw new Error(`Calendar API error ${r.status}: ${JSON.stringify(data)}`)
    //   return formatEvents(data.items ?? [])
    // },
    async execute(...argsArray: any[]) {
      // 1. 打印被拦截到的所有参数数组，你会看到参数原来藏在 argsArray[1] 里！
      console.log("==== 🧐 框架拦截到的参数数组 ====");
      console.log(JSON.stringify(argsArray, (key, value) => {
        if (key === 'signal') return '[AbortSignal]';
        return value;
      }, 2));
      console.log("===================================");

      // 2. 暴力搜查器：遍历所有传进来的参数，不管是第几个，找出带有 timeMin 的那个！
      let payload: any = {};
      let actualSignal: AbortSignal | undefined;

      for (const arg of argsArray) {
        if (!arg) continue;

        if (typeof arg === "object") {
          // 找到了真正的业务参数对象！
          if (arg.timeMin || arg.timeMax) {
            payload = arg;
          } else if (arg.params && (arg.params.timeMin || arg.params.timeMax)) {
            payload = arg.params;
          }
          // 顺便把控制请求超时的 signal 也捞出来
          if (arg.signal) {
            actualSignal = arg.signal;
          }
        } else if (typeof arg === "string" && arg.startsWith("{")) {
          // 如果被搞成了 JSON 字符串，也给它扒出来
          try {
            const parsed = JSON.parse(arg);
            if (parsed.timeMin) payload = parsed;
          } catch(e) {}
        }
      }

      // 3. 时间补齐机制
      let rawMin = payload.timeMin || new Date().toISOString().split('T')[0];
      let rawMax = payload.timeMax;

      const finalizeTime = (str: string, isEnd: boolean) => {
        if (str.includes('T')) return str;
        return isEnd ? `${str}T23:59:59+08:00` : `${str}T00:00:00+08:00`;
      };

      let timeMin = finalizeTime(rawMin, false);
      let timeMax = rawMax ? finalizeTime(rawMax, true) : finalizeTime(rawMin, true);

      console.log(`[google-calendar] 实际执行查询: ${timeMin} ~ ${timeMax}`);

      // 4. 发起真实请求
      const token = await getAccessToken(cfg);
      const url   = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId()}/events`);

      url.searchParams.set("timeMin",      timeMin);
      url.searchParams.set("timeMax",      timeMax);
      url.searchParams.set("maxResults",   String(payload.maxResults ?? 50));
      url.searchParams.set("singleEvents", "true");
      url.searchParams.set("orderBy",      "startTime");
      if (payload.query) url.searchParams.set("q", payload.query);

      const r    = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal: actualSignal });
      const data = (await r.json()) as any;
      if (!r.ok) throw new Error(`Calendar API error ${r.status}: ${JSON.stringify(data)}`);

      // 🔍 诊断：打印 Google API 返回的原始事件数量和第一个事件
      console.log(`[google-calendar] API returned ${(data.items ?? []).length} items, timeZone=${data.timeZone}`);
      if (data.items?.length > 0) console.log(`[google-calendar] first item: ${JSON.stringify(data.items[0].start)}`);

      return formatEvents(data.items ?? []);
    },
  })

  // ── Tool 3: 查询单个事件完整详情 ───────────────────────────────────────────
  api.registerTool({
    name: "calendar_get_event",
    description: "Get full details of a specific Google Calendar event by event ID. Use after calendar_list_events to get description, conference link, attendee status.",
    parameters: {
      type: "object",
      properties: {
        eventId: {
          type:        "string",
          description: "The event ID returned from calendar_today or calendar_list_events",
        },
      },
      required: ["eventId"],
    },
    // async execute({ params, signal }: { params: any; signal: AbortSignal }) {
    //   const token = await getAccessToken(cfg)
    //   const r     = await fetch(
    //     `https://www.googleapis.com/calendar/v3/calendars/${calId()}/events/${params.eventId}`,
    //     { headers: { Authorization: `Bearer ${token}` }, signal }
    //   )
    //   const data = (await r.json()) as any
    //   if (!r.ok) throw new Error(`Calendar API error ${r.status}: ${JSON.stringify(data)}`)
    //   return JSON.stringify({
    //     id:             data.id,
    //     title:          data.summary,
    //     start:          data.start?.dateTime  ?? data.start?.date,
    //     end:            data.end?.dateTime    ?? data.end?.date,
    //     location:       data.location         ?? null,
    //     description:    data.description      ?? null,
    //     organizer:      data.organizer?.email ?? null,
    //     attendees:      (data.attendees ?? []).map((a: any) => ({
    //       email:          a.email,
    //       responseStatus: a.responseStatus,
    //     })),
    //     conferenceLink: data.conferenceData?.entryPoints?.[0]?.uri ?? null,
    //     recurrence:     data.recurrence       ?? null,
    //     status:         data.status,
    //     link:           data.htmlLink,
    //   }, null, 2)
    // },
    async execute(...argsArray: any[]) {
      // 暴力搜查器：找出带有 eventId 的对象
      let payload: any = {};
      let actualSignal: AbortSignal | undefined;

      for (const arg of argsArray) {
        if (!arg) continue;
        if (typeof arg === "object") {
          if (arg.eventId) payload = arg;
          else if (arg.params && arg.params.eventId) payload = arg.params;

          if (arg.signal) actualSignal = arg.signal;
        }
      }

      if (!payload.eventId) {
        throw new Error("System Error: Missing eventId. AI, please provide the eventId.");
      }

      const token = await getAccessToken(cfg)
      const r     = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId()}/events/${payload.eventId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal: actualSignal }
      )
      const data = (await r.json()) as any
      if (!r.ok) throw new Error(`Calendar API error ${r.status}: ${JSON.stringify(data)}`)

      return JSON.stringify({
        id:             data.id,
        title:          data.summary,
        start:          data.start?.dateTime  ?? data.start?.date,
        end:            data.end?.dateTime    ?? data.end?.date,
        location:       data.location         ?? null,
        description:    data.description      ?? null,
        organizer:      data.organizer?.email ?? null,
        attendees:      (data.attendees ?? []).map((a: any) => ({
          email:          a.email,
          responseStatus: a.responseStatus,
        })),
        conferenceLink: data.conferenceData?.entryPoints?.[0]?.uri ?? null,
        status:         data.status,
        link:           data.htmlLink,
      }, null, 2)
    },
  })

  console.log(`[google-calendar] Loaded. calendarId="${cfg.calendarId ?? "primary"}"`)
}
