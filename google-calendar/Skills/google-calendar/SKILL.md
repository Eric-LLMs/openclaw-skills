---
name: google-calendar
description: Query the user's Google Calendar events and meeting details. Use when user asks about schedule, meetings, appointments, or availability.
metadata: {"openclaw":{"emoji":"📅"}}
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

### 🚫 绝对禁止

- 用户说"3月10日"，却传今天的日期
- 用户说"到12日"，却传13日或其他日期

## ⚠️ 极其重要：拿到工具结果后必须逐条展示给用户

**工具返回 JSON 数据后，必须将每个事件逐条列出，绝对不能沉默、不能只说"查询完毕"、不能省略事件内容。**

### 展示格式

```
📅 3月10日（周二）

• 10:00 - 11:00  产品评审
  🔗 会议链接：meet.google.com/xxx
  👥 参与者：alice@example.com

• 14:00 - 15:00  1:1 with Sarah
```

- 按日期分组，每天一个标题
- 每个事件显示：时间段、标题、会议链接（如有）、参与者（如有）
- 工具返回 `"No events found."` 时回复"该时间段没有日程安排"

## 错误处理

- `invalid_grant`：refresh token 过期，告知用户需重新授权
- 403：权限不足，检查 OAuth scope 是否含 `calendar.readonly`
- 404：事件不存在或已删除
