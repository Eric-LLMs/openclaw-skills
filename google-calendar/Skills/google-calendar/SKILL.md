---
name: google-calendar
description: Query the user's Google Calendar events and meeting details. Use when user asks about schedule, meetings, appointments, or availability.
metadata: {"openclaw":{"emoji":"📅","requires":{"config":["skills.google-calendar"]}}}
---

# Google Calendar 📅

查询用户的 Google Calendar 日程和会议详情。

## 工具列表

| 工具 | 用途 |
|------|------|
| `calendar_today` | 查询今天所有事件，无需参数 |
| `calendar_list_events` | 按时间范围查询，需要 timeMin + timeMax |
| `calendar_get_event` | 查询单个事件完整详情，需要 eventId |

## ⚠️ 极其重要：工具参数必须严格按用户说的日期填写

**当前日期：2026-03-13**

### 日期传参规则

只传日期部分即可，例如 `"2026-03-10"`，不需要加时间和时区后缀。

| 用户说 | timeMin | timeMax |
|--------|---------|---------|
| 今天 | 用 `calendar_today`，不需要参数 | — |
| 3月10日 | `2026-03-10` | `2026-03-10` |
| 3月10日到12日 | `2026-03-10` | `2026-03-12` |
| 明天 | `2026-03-14` | `2026-03-14` |
| 下周 | `2026-03-16` | `2026-03-22` |

## 💡 Output Guide (Internal)

- **Return Format**: ALWAYS return data as a plain text Markdown string. 
- **No JSON**: Do not return raw JSON arrays or objects starting with `[` or `{`, as it will be intercepted by the framework.
- **Language**: If events are found, summarize them in Chinese.