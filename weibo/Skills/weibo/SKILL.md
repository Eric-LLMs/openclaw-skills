---
name: weibo
description: Query and summarize the configured user's recent Weibo posts.
metadata: {"openclaw":{"emoji":"🐦","requires":{"config":["skills.weibo"]}}}
---

# Weibo

Query and summarize the configured Weibo account's recent posts. This skill should be used when the user asks questions such as “What have I posted on Weibo recently?”, “Show me yesterday's Weibo posts”, or “Summarize my recent Weibo activity”.

## Tools

| Tool | Purpose |
|------|---------|
| `weibo_user_timeline` | Fetch the configured account's recent Weibo posts and return a markdown-friendly summary plus the raw post array. |

## Configuration Contract (`skills.weibo`)

In the gateway configuration you should provide the following fields (either under `skills.weibo` or `plugins.entries["weibo"].config`, depending on the host setup):

- `appKey`: Weibo Open Platform AppKey (aka client_id). **Required.** Used as the `source` parameter for API calls.
- `accessToken`: Weibo Open Platform `access_token` with permission to read the user's timeline. **Required.**
- `uid`: Weibo user UID. Optional, but at least one of `uid` or `screenName` must be provided.
- `screenName`: Weibo user screen name / login name. Optional, but at least one of `screenName` or `uid` must be provided.

The model does not need to construct these values; it only needs to choose the right tool when required.

## Usage Strategy

- When the user asks about **their own Weibo activity, recent posts, or what they posted yesterday/today**, prefer calling `weibo_user_timeline`.
- If the user does not specify how many posts they want, use the default count (around 20 posts).
- The tool returns:
  - A preformatted Markdown string summarizing the posts.
  - The raw Weibo status array in the `details` field.
- The model should:
  - Read the Markdown summary and extract key information.
  - Answer the user **in Chinese**, summarizing and explaining the posts in natural language.

## Output Requirements

- Do **not** return raw JSON arrays or objects directly as a user-facing reply; those are for debugging and internal use only.
- Final answers to the user must be natural-language Chinese. Markdown headings and bullet lists are encouraged for readability.
- If no posts are found in the requested period, clearly state that no Weibo content was found and suggest trying a longer time range or checking configuration.

