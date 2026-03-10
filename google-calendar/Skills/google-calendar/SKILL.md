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

## 时间范围推断规则

- "今天" → 直接用 `calendar_today`
- "明天" → 明天 00:00:00Z ~ 23:59:59Z
- "本周" → 本周一 00:00:00Z ~ 本周日 23:59:59Z
- "下周" → 下周一 00:00:00Z ~ 下周日 23:59:59Z
- 具体日期如 "3月15日" → 当天 00:00:00Z ~ 23:59:59Z
- 所有时间统一使用 ISO8601 格式，带 Z 时区后缀

## 查询详情流程

1. 先用 `calendar_today` 或 `calendar_list_events` 获取事件列表和 ID
2. 用户询问具体事件详情时，用 `calendar_get_event` 传入 eventId

## 展示格式

- 时间按用户语言展示（中文用户：3月9日 14:00）
- 有 `conferenceLink` 时主动告知会议链接
- 有 `attendees` 时列出参会人及回复状态（accepted/declined/tentative）
- 无事件时回复"该时间段没有日程安排"

## 错误处理

- `invalid_grant`：refresh token 过期，告知用户需重新授权
- 403：权限不足，检查 OAuth scope 是否含 `calendar.readonly`
- 404：事件不存在或已删除
