import type { OpenClawPluginApi } from "openclaw/plugin-sdk"

// ── OAuth: refresh_token → access_token ──────────────────────────────────────
async function getAccessToken(cfg: {
  clientId: string
  clientSecret: string
  refreshToken: string
}): Promise<string> {
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      client_id:     cfg.clientId,
      client_secret: cfg.clientSecret,
      refresh_token: cfg.refreshToken,
      grant_type:    "refresh_token",
    }),
  })
  const data = (await res.json()) as Record<string, unknown>
  if (!data.access_token) {
    throw new Error(`Token refresh failed: ${JSON.stringify(data)}`)
  }
  return data.access_token as string
}

// ── 辅助：格式化事件列表 ────────────────────────────────────────────────────────
function formatEvents(items: any[]): string {
  if (!items.length) return "No events found."
  return JSON.stringify(
    items.map((e: any) => ({
      id:        e.id,
      title:     e.summary      ?? "(No title)",
      start:     e.start?.dateTime ?? e.start?.date,
      end:       e.end?.dateTime   ?? e.end?.date,
      location:  e.location     ?? null,
      attendees: (e.attendees ?? []).map((a: any) => a.email),
      link:      e.htmlLink,
    })),
    null,
    2
  )
}

// ── 插件注册入口 ─────────────────────────────────────────────────────────────────
export function register(api: OpenClawPluginApi) {
  const cfg = api.config as {
    clientId:     string
    clientSecret: string
    refreshToken: string
    calendarId?:  string
  }

  const calId = () => encodeURIComponent(cfg.calendarId ?? "primary")

  // ── Tool 1: 今天的事件（快捷工具）──────────────────────────────────────────
  api.registerTool({
    name:        "calendar_today",
    description: "Get all Google Calendar events for today. Use when user asks: today schedule, what do I have today, today meetings.",
    parameters: {
      type:       "object",
      properties: {},
      required:   [],
    },
    async execute({ signal }: { signal: AbortSignal }) {
      const token = await getAccessToken(cfg)
      const now   = new Date()
      const start = new Date(now.getFullYear(), now.getMonth(), now.getDate(),  0,  0,  0)
      const end   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59)
      const url   = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId()}/events`)
      url.searchParams.set("timeMin",      start.toISOString())
      url.searchParams.set("timeMax",      end.toISOString())
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
    name:        "calendar_list_events",
    description: "Query Google Calendar events for a date range. Use for: this week, next week, tomorrow, specific dates.",
    parameters: {
      type: "object",
      properties: {
        timeMin: {
          type:        "string",
          description: "Start datetime ISO8601, e.g. 2026-03-07T00:00:00Z",
        },
        timeMax: {
          type:        "string",
          description: "End datetime ISO8601, e.g. 2026-03-14T23:59:59Z",
        },
        maxResults: {
          type:        "number",
          description: "Max number of events to return (default: 10)",
        },
        query: {
          type:        "string",
          description: "Optional keyword search within event titles and descriptions",
        },
      },
      required: ["timeMin", "timeMax"],
    },
    async execute({ params, signal }: { params: any; signal: AbortSignal }) {
      const token = await getAccessToken(cfg)
      const url   = new URL(`https://www.googleapis.com/calendar/v3/calendars/${calId()}/events`)
      url.searchParams.set("timeMin",      params.timeMin)
      url.searchParams.set("timeMax",      params.timeMax)
      url.searchParams.set("maxResults",   String(params.maxResults ?? 10))
      url.searchParams.set("singleEvents", "true")
      url.searchParams.set("orderBy",      "startTime")
      if (params.query) url.searchParams.set("q", params.query)
      const r    = await fetch(url.toString(), { headers: { Authorization: `Bearer ${token}` }, signal })
      const data = (await r.json()) as any
      if (!r.ok) throw new Error(`Calendar API error ${r.status}: ${JSON.stringify(data)}`)
      return formatEvents(data.items ?? [])
    },
  })

  // ── Tool 3: 查询单个事件完整详情 ───────────────────────────────────────────
  api.registerTool({
    name:        "calendar_get_event",
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
    async execute({ params, signal }: { params: any; signal: AbortSignal }) {
      const token = await getAccessToken(cfg)
      const r     = await fetch(
        `https://www.googleapis.com/calendar/v3/calendars/${calId()}/events/${params.eventId}`,
        { headers: { Authorization: `Bearer ${token}` }, signal }
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
        recurrence:     data.recurrence       ?? null,
        status:         data.status,
        link:           data.htmlLink,
      }, null, 2)
    },
  })

  console.log(`[google-calendar] Loaded. calendarId="${cfg.calendarId ?? "primary"}"`)
}
