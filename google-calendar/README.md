# google-calendar — OpenClaw Extension

Read-only Google Calendar plugin for OpenClaw. Query events and meeting details through natural language.

## Tools

| Tool | Description |
|------|-------------|
| `calendar_today` | Get all events for today |
| `calendar_list_events` | Query events by date range |
| `calendar_get_event` | Get full details of a specific event |

## Example Conversations

```
You:       今天有什么安排？
Assistant: 今天你有 3 个事件：
           10:00 产品评审（Google Meet: meet.google.com/xxx）
           14:00 1:1 with Sarah
           17:30 Team standup

You:       帮我看看下周的日程
You:       这个评审会议有哪些人参加？
```

---

## Setup

### Step 1 — Google Cloud Console

1. Open https://console.cloud.google.com/
2. Create or select a project
3. Enable **Google Calendar API**
4. Go to **Credentials → Create → OAuth 2.0 Client ID**
5. Type: **Desktop app**
6. Note down `client_id` and `client_secret`

### Step 2 — Get Refresh Token

```bash
pip install google-auth-oauthlib

python3 - <<'EOF'
from google_auth_oauthlib.flow import InstalledAppFlow
flow = InstalledAppFlow.from_client_secrets_file(
    "credentials.json",
    scopes=["https://www.googleapis.com/auth/calendar.readonly"]
)
creds = flow.run_local_server(port=0)
print("refresh_token:", creds.refresh_token)
EOF
```

### Step 3 — Add to openclaw.json

```json
{
  "plugins": {
    "entries": {
      "google-calendar": {
        "enabled": true,
        "config": {
          "clientId":     "YOUR_CLIENT_ID",
          "clientSecret": "YOUR_CLIENT_SECRET",
          "refreshToken": "YOUR_REFRESH_TOKEN",
          "calendarId":   "primary"
        }
      }
    }
  }
}
```

### Step 4 — Place files & restart

```bash
# copy into your OpenClaw plugin directory:
git clone https://github.com/Eric-LLMs/openclaw-skills.git
cp -r openclaw-skills/google-calendar/extensions/google-calendar ~/.openclaw/extensions/
cp -r openclaw-skills/google-calendar/Skills/google-calendar ~/.openclaw/Skills/

# build the project
pnpm ui:build
pnpm build

# Restart gateway
openclaw gateway restart

# Docker users:
docker restart openclaw_server  (restart your openclaw service)
docker logs openclaw_server | grep google-calendar
# Expected: [google-calendar] Loaded. calendarId="primary"
```

---

## File Structure

```
google-calendar/              # 📅 Google Calendar Plugin
├── extensions/               
│   └── google-calendar/      # The actual Agent tools (Logic, APIs & OAuth integration)
│       ├── index.ts          # Core logic & Google API integration
│       ├── openclaw.plugin.json 
│       └── package.json      
├── Skills/                   
│   └── google-calendar/      
│       └── SKILL.md          # LLM behavior guidance & Prompt Overrides
├── Standalone-Prompt.md      # Standalone instruction-based tasks
└── README.md                 # Detailed setup & OAuth instructions
```

---

## Security

- **Read-only** — cannot create, modify, or delete events
- Never commit `credentials.json` or `token.json` to git
- Add to `.gitignore`:
  ```
  credentials.json
  token.json
  ```
- Revoke tokens at https://myaccount.google.com/permissions if compromised
