# weibo — OpenClaw Extension

Weibo read-only plugin for OpenClaw. Fetch and summarize recent posts for a configured Weibo account.

## Tools

| Tool | Description |
|------|-------------|
| `weibo_user_timeline` | Fetch the configured user's recent Weibo posts and return a markdown-friendly summary plus raw details. |

## Example Conversations

```text
You:   帮我看看最近几天我在微博都发了什么？
Agent: 我查到了你最近的 15 条微博，大致内容包括：
       - 关于工作进展和项目更新的 5 条微博
       - 转发了 3 条技术相关文章
       - 2 条关于日常生活的照片微博
       - 其余是对热点话题的简短评论

You:   帮我重点总结下上周跟 AI 相关的微博。
You:   有没有哪几条互动比较多，可以单独列出来？
```

---

## Setup

### Step 1 — Create a Weibo Open Platform application

1. Open the Weibo Open Platform site (developer portal).
2. Register a developer account if you do not already have one.
3. Create a new application with permission to read the user's timeline.
4. Record your app's **AppKey** and **AppSecret** (you will need the AppKey in OpenClaw as `appKey`).
5. Generate an OAuth `access_token` for the target account via the official OAuth flow.
   - Use an OAuth 2.0 flow supported by Weibo (typically authorization code flow).
   - The value required by OpenClaw is the OAuth `access_token` (not browser cookies).

> Note: This extension only reads timeline data; it does **not** publish or delete any posts.

#### Important: Do NOT use browser cookies as "accessToken"

Some online guides suggest copying the `SUB` cookie from `weibo.com` and using it as a token. That is **not** a valid Weibo Open Platform OAuth `access_token` and will fail against `api.weibo.com` endpoints.

### Step 2 — Add to `openclaw.json`

Configure the plugin in your OpenClaw gateway configuration:

```json
{
  "plugins": {
    "entries": {
      "weibo": {
        "enabled": true,
        "config": {
          "appKey": "YOUR_APP_KEY",
          "accessToken": "YOUR_ACCESS_TOKEN",
          "uid": "YOUR_UID",
          "screenName": "OPTIONAL_SCREEN_NAME"
        }
      }
    }
  }
}
```

- Provide **either** `uid` or `screenName` (or both). The plugin will use `uid` first if present.
- `appKey` is required and will be sent as the `source` parameter.
- `accessToken` must be a valid Weibo Open Platform OAuth token that can read the target account's timeline.

#### Late configuration (start first, configure later)

This plugin **does not require config at gateway startup**. You can start OpenClaw with the plugin enabled and add `appKey/accessToken` later. If you call `weibo_user_timeline` before configuring, the tool will return a clear missing-config error message.

If you prefer to keep configuration under `skills.weibo`, keep the same field names; this extension supports both layouts.

Example `skills.weibo` config (this avoids the "Missing: config.skills.weibo" warning in the Skills UI):

```json
{
  "skills": {
    "weibo": {
      "appKey": "YOUR_APP_KEY",
      "accessToken": "YOUR_ACCESS_TOKEN",
      "uid": "YOUR_UID"
    }
  }
}
```

### Step 3 — Place files & restart

```bash
# clone this repository
git clone https://github.com/Eric-LLMs/openclaw-skills.git

# copy Weibo extension code into your OpenClaw extensions directory
cp -r openclaw-skills/weibo/extensions/weibo ~/.openclaw/extensions/

# copy Weibo skill definition into your OpenClaw Skills directory
cp -r openclaw-skills/weibo/Skills/weibo ~/.openclaw/Skills/

# build the project
pnpm ui:build
pnpm build

# Restart gateway
openclaw gateway restart

# Docker users:
docker restart openclaw_server  # restart your openclaw service
docker logs openclaw_server | grep weibo
# Expected: [weibo] Loaded. user=<uid or screenName>
```

---

## File Structure

```text
weibo/                         # 📱 Weibo Plugin
├── extensions/
│   └── weibo/                 # The actual Agent tools (Weibo API integration)
│       ├── index.ts           # Core logic & Weibo API calls
│       ├── openclaw.plugin.json
│       └── package.json
├── Skills/                    # Skill definitions
│   └── weibo/
│       └── SKILL.md           # LLM behavior guidance & prompt overrides for Weibo
└── README.md                  # This file — setup & usage instructions
```

---

## Security

- **Read-only** — this plugin only reads public or authorized timeline posts; it does not modify content.
- Never commit any personal `access_token` or secrets to git.
- Consider storing credentials in environment variables or your gateway's secret storage mechanism.
- If a token is compromised, revoke it from the Weibo developer portal and rotate it in your OpenClaw configuration.

