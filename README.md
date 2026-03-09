# 🦞 OpenClaw Custom Skills & Use Cases

[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat-square&logo=typescript&logoColor=white)]()
[![AI Agents](https://img.shields.io/badge/AI%20Agents-Function%20Calling-FF9900?style=flat-square)]()
[![Status](https://img.shields.io/badge/Status-Active%20Development-success?style=flat-square)]()

Personal OpenClaw skills and extensions and advanced use cases built for the [OpenClaw](https://github.com/Eric-LLMs/openclaw.git) AI Agent framework. 

---

## 📦 Skills Catalog

Currently available and actively maintained extensions:

| Status | Skill / Extension | Description | Link |
| :---: | :--- | :--- | :--- |
| ✅ | **Google Calendar Agent** | Read-only Google Calendar integration. Empowers the LLM to autonomously query events, analyze daily schedules, and extract meeting details using natural language. | [View Details](./extensions/google-calendar) |
| 🚧 | **Weibo Agent** | *(In Development)* Weibo integration. Empowers the LLM to browse hot topics, monitor trends, and summarize posts. | [View Details](./extensions/weibo) |

*(Click on "View Details" to see the specific setup guide, tools, and technical implementation for each extension.)*

---

## 📂 Repository Structure

This repository is structured as a monorepo for OpenClaw plugins:

```text
openclaw-skills/
├── README.md                 # 👈 You are here (Project Overview)
├── docs/                     # Architecture designs and engineering notes
└── extensions/               # The actual Agent tools
    ├── google-calendar/      # 📅 Google Calendar Plugin
    │   ├── index.ts          # Core logic & Google API integration
    │   ├── package.json      
    │   ├── openclaw.plugin.json 
    │   ├── README.md         # Detailed setup & OAuth instructions
    │   └── skills/
    │       └── SKILL.md      # LLM behavior guidance & Prompt Overrides
    └── weibo/                # 📱 Weibo Plugin (WIP)
        ├── README.md         # Placeholder info
        └── skills/
            └── SKILL.md      # Weibo behavior guidance

```

## Usage

Clone and copy into your OpenClaw extensions directory:

```bash
git clone [https://github.com/Eric-LLMs/openclaw-skills.git](https://github.com/Eric-LLMs/openclaw-skills.git)
cp -r openclaw-skills/extensions/google-calendar ~/.openclaw/extensions/

```
---