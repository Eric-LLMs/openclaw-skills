# 🦞 OpenClaw Custom Addons & Use Cases

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)]()
[![AI Agents](https://img.shields.io/badge/AI%20Agents-Function%20Calling-FF9900?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-success?style=flat-square)]()

A collection of personal OpenClaw addons—including skills, extensions, and channels for Google Calendar, Weibo, and more—along with advanced use cases built for the [OpenClaw](https://github.com/Eric-LLMs/openclaw.git) AI Agent framework. 

---
## 🧩 Addons Catalog

Currently available and actively maintained addons:

| Status | Name | Type | Description | Link |
| :---: | :--- | :---: | :--- | :--- |
| ✅ | **Google Calendar** | `Extension` | Read-only Google Calendar integration. Empowers the LLM to autonomously query events, analyze daily schedules, and extract meeting details using natural language. | [View Details](google-calendar) |
| ✅ | **Weibo Agent** | `Extension` | Read-only Weibo integration. Empowers the LLM to fetch a user's recent posts, monitor activity, and summarize timelines. | [View Details](weibo) |

*(Click on "View Details" to see the specific setup guide, tools, and technical implementation for each addon.)*

---

## 📂 Repository Structure

This repository is structured as a monorepo for OpenClaw plugins:

```text
openclaw-skills/
├── README.md                     # 👈 You are here (Project Overview)
├── google-calendar/              # 📅 Google Calendar Plugin
│   ├── extensions/               
│   │   └── google-calendar/      # The actual Agent tools (Logic, APIs & OAuth integration)
│   │       ├── index.ts          # Core logic & Google API integration
│   │       ├── openclaw.plugin.json 
│   │       └── package.json      
│   ├── Skills/                   
│   │   └── google-calendar/      
│   │       └── SKILL.md          # LLM behavior guidance & Prompt Overrides
│   ├── Standalone-Prompt.md      # Standalone instruction-based tasks
│   └── README.md                 # Detailed setup & OAuth instructions
└── weibo/                        # 📱 Weibo Plugin
    ├── extensions/               
    │   └── weibo/                # The actual Agent tools (Weibo API integration)
    │       ├── index.ts          # Core logic & Weibo API integration
    │       ├── openclaw.plugin.json 
    │       └── package.json      
    ├── Skills/                   
    │   └── weibo/                # Weibo Skill folder
    │       └── SKILL.md          # Weibo behavior guidance
    └── README.md                 # Detailed setup & usage instructions

```

## Usage

Clone and copy into your OpenClaw plugin directory:

```bash
git clone https://github.com/Eric-LLMs/openclaw-skills.git
cp -r openclaw-skills/google-calendar/extensions/google-calendar ~/.openclaw/extensions/
cp -r openclaw-skills/google-calendar/Skills/google-calendar ~/.openclaw/Skills/
cp -r openclaw-skills/weibo/extensions/weibo ~/.openclaw/extensions/
cp -r openclaw-skills/weibo/Skills/weibo ~/.openclaw/Skills/
```

---

```