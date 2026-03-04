# 🤖 APEX — Advanced Programming EXpert Agent

> **An autonomous AI agent for frontend development** — not a chatbot. APEX scans your repositories, thinks autonomously, plans actions, executes improvements, and learns from its own results.

![APEX Agent](https://img.shields.io/badge/APEX-v1.0-00ff88?style=for-the-badge&labelColor=0a0a0f)
![Next.js](https://img.shields.io/badge/Next.js-14-black?style=for-the-badge)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991?style=for-the-badge)
![Vercel](https://img.shields.io/badge/Deploy-Vercel-black?style=for-the-badge)

---

## What Makes APEX Different

APEX is **not** a chatbot with a "how can I help you?" prompt. It's an **autonomous agent** that follows a strict reasoning loop:

```
THINK → PLAN → ACT → OBSERVE → REFLECT → ITERATE
```

When you point it at a repository, it:

1. **Scans** the entire codebase structure and dependencies
2. **Analyzes** using AI-powered deep analysis across 7 dimensions
3. **Identifies** issues (security, performance, accessibility, etc.)
4. **Generates** actionable suggestions with exact code fixes
5. **Executes** improvements when you trigger actions
6. **Reflects** on its own output and improves its approach

## Features

- **Autonomous Repo Scanning** — Connects to any GitHub repo and builds a complete analysis
- **7-Dimension Scoring** — Performance, Accessibility, Best Practices, Security, DX, Maintainability, Overall
- **Skills System** — Loads expertise from `skills.sh` dynamically (performance, a11y, security, architecture, testing, SEO, DX)
- **Agent Loop** — Full Think/Plan/Act/Observe/Reflect autonomous reasoning
- **Self-Improvement** — Rates its own effectiveness and adjusts approach
- **Act on Suggestions** — One-click to have the agent implement any suggestion
- **Real-time Logs** — Watch the agent's thought process in real-time
- **Quick Actions** — Pre-built commands for common operations

---

## Quick Start

### 1. Clone & Install

```bash
git clone https://github.com/YOUR_USERNAME/frontend-agent.git
cd frontend-agent
npm install
```

### 2. Configure Environment

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
OPENAI_API_KEY=sk-your-key-here
GITHUB_TOKEN=ghp_your-github-token  # optional, for private repos
OPENAI_MODEL=gpt-4o                 # or gpt-4o-mini for faster/cheaper
```

### 3. Run Locally

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

### 4. Deploy to Vercel

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Set environment variables in Vercel dashboard:
# OPENAI_API_KEY, GITHUB_TOKEN (optional), OPENAI_MODEL
```

Or click the button:

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR_USERNAME/frontend-agent&env=OPENAI_API_KEY,GITHUB_TOKEN,OPENAI_MODEL)

---

## Deploy to GitHub + Vercel

### Step 1: Push to GitHub

```bash
cd frontend-agent
git init
git add .
git commit -m "Initial commit: APEX Frontend Agent"
git remote add origin https://github.com/YOUR_USERNAME/frontend-agent.git
git push -u origin main
```

### Step 2: Connect to Vercel

1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repository
3. Add environment variables:
   - `OPENAI_API_KEY` → Your OpenAI API key
   - `GITHUB_TOKEN` → Your GitHub personal access token (for private repos)
   - `OPENAI_MODEL` → `gpt-4o` (recommended)
4. Click **Deploy**

Every push to `main` will auto-deploy.

---

## Architecture

```
frontend-agent/
├── app/
│   ├── layout.tsx              # Root layout
│   ├── page.tsx                # Main agent dashboard UI
│   └── api/
│       ├── analyze/route.ts    # Repo scanning & analysis endpoint
│       └── agent/route.ts      # Agent task execution endpoint
├── lib/
│   ├── agent-engine.ts         # Core agent engine (Think/Plan/Act/Observe/Reflect)
│   └── store.ts                # Zustand global state management
├── styles/
│   └── globals.css             # Global styles with agent theme
├── skills.sh                   # Skill definitions loaded by agent
├── package.json
├── next.config.js
├── tailwind.config.js
└── tsconfig.json
```

## Skills System

Skills are defined in `skills.sh` and loaded dynamically by the agent. Each skill contains:

- **Trigger conditions** — When to activate
- **Analysis steps** — What to check
- **Auto-fix actions** — What to do about issues
- **Code templates** — Ready-to-use implementations

### Available Skills

| Skill | Trigger | Priority |
|-------|---------|----------|
| Performance Optimization | bundle size, slow load, lighthouse | HIGH |
| Accessibility Audit | a11y, wcag, screen reader | CRITICAL |
| Security Hardening | xss, csrf, csp, vulnerability | CRITICAL |
| Modern Architecture | refactor, component patterns | HIGH |
| Testing Strategy | test, coverage, e2e | HIGH |
| SEO Optimization | meta tags, sitemap, og | MEDIUM |
| DX Enhancement | lint, typescript, prettier | MEDIUM |

### Adding Custom Skills

Add new skills to `skills.sh`:

```bash
# SKILL: Your Custom Skill Name
# Trigger: keyword1, keyword2
# Priority: HIGH

## Analysis Steps
1. Step one
2. Step two

## Auto-Fix Actions
- Fix one
- Fix two
```

---

## How the Agent Works

### The Agent Loop

```
┌─────────────────────────────────────────────┐
│                APEX Agent Loop               │
├─────────────────────────────────────────────┤
│                                             │
│  ┌─────────┐    ┌──────────┐    ┌────────┐ │
│  │  THINK  │───▶│   PLAN   │───▶│  ACT   │ │
│  └─────────┘    └──────────┘    └────────┘ │
│       ▲                              │      │
│       │                              ▼      │
│  ┌─────────┐    ┌──────────┐              │
│  │ REFLECT │◀───│ OBSERVE  │◀─────────────│ │
│  └─────────┘    └──────────┘               │
│       │                                     │
│       └──── ITERATE if goal not met ────────│
│                                             │
└─────────────────────────────────────────────┘
```

### Scoring Dimensions

- **Performance** (0-100): Bundle size, loading speed, rendering efficiency
- **Accessibility** (0-100): WCAG compliance, keyboard nav, screen reader support
- **Best Practices** (0-100): Modern patterns, error handling, code organization
- **Security** (0-100): XSS prevention, CSP, dependency vulnerabilities
- **DX** (0-100): TypeScript, linting, testing, documentation
- **Maintainability** (0-100): Code structure, modularity, readability

---

## API Keys Setup

### OpenAI API Key
1. Go to [platform.openai.com/api-keys](https://platform.openai.com/api-keys)
2. Create a new key
3. Fund your account (GPT-4o costs ~$2.50/1M input tokens)

### GitHub Token (Optional)
1. Go to [github.com/settings/tokens](https://github.com/settings/tokens)
2. Generate a new token (classic) with `repo` scope
3. This enables scanning private repositories

---

## License

MIT
