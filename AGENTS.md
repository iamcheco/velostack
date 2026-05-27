# VeloStack — Agent Operating Guide

> **READ THIS FIRST.** Every AI agent (Antigravity, GitHub Copilot, Cursor, Claude, etc.)
> must read this file before writing a single line of code. It replaces the need
> for the user to re-explain context on every session.

---

## 1. Project Identity

| Field | Value |
|-------|-------|
| App name | VeloStack |
| Purpose | Bike fix-and-flip intelligence platform |
| Stack | Next.js 16 (App Router, Turbopack), TypeScript, Verdana/Reddit-style UI |
| Key env vars | `GOOGLE_GENERATIVE_AI_API_KEY`, `GROQ_API_KEY`, `TAVILY_API_KEY`, `STRAVA_CLIENT_ID`, `STRAVA_CLIENT_SECRET`, `NEXT_PUBLIC_BASE_URL` |
| localStorage key | `vst` (TrackerStore JSON) |

---

## 2. Phase Status (source of truth)

| Phase | Name | Route | Status | Author |
|-------|------|-------|--------|--------|
| 1 | Fix & Flip Analyzer | `/analyzer` | ✅ LIVE | VeloStack Team |
| 2 | Parts Wear Tracker | `/tracker` | ✅ LIVE | VeloStack Team |
| 3 | YouTube Skill Extractor | `/extractor` | ✅ LIVE | VeloStack Team |
| 4 | Pocket Bike Mechanic AI | `/mechanic` | ✅ LIVE | Vedansh |
| 5 | Profit & Loss Flip Ledger | `/ledger` | ✅ LIVE | VeloStack Team |
| 6 | AI Background Deal Sniper | `/settings` | ✅ LIVE | VeloStack Team |
| 7 | Pre-Sold Reservation Publisher | `/tracker` | ✅ LIVE | VeloStack Team |

**Update this table immediately when you complete or start a phase.**

---

## 3. File Map

```
app/
  page.tsx              ← Homepage (floating sketches, bike image → /all)
  all/page.tsx          ← Phase directory table (keep phase status in sync!)
  analyzer/page.tsx     ← Phase 1, full Reddit CSS embedded inline
  tracker/
    page.tsx            ← Phase 2, full Reddit CSS embedded inline
    context.tsx         ← TrackerContext (localStorage persistence, selectedBikeId)
    components/
      Sidebar.tsx       ← Bike list, add-bike form, Strava connect link
      PartsTab.tsx      ← Research parts via /api/research-part, list/remove
      RideLogTab.tsx    ← Manual ride logging, ride history list
      WearReportTab.tsx ← calcPartWear per part, health bars, Explain, Mark Replaced
  extractor/page.tsx    ← Phase 3 (TODO)
  mechanic/page.tsx     ← Phase 4 (TODO)
  api/
    analyze/route.ts        ← POST: LLM bike listing analysis
    price-component/route.ts← POST: market price lookup for component upgrade
    research-part/route.ts  ← POST: LLM/web part wear profile
    wear-explain/route.ts   ← POST: LLM mechanic explanation of wear
    strava/auth/route.ts    ← GET: redirect to Strava OAuth
    strava/callback/route.ts← GET: exchange code for token (stored in cookie)
    strava/activities/route.ts← POST: fetch and map activities to RideLog[]

lib/
  analyzer.ts           ← Types + LLM prompt for Phase 1
  tracker-types.ts      ← All types: Bike, RideLog, PartProfile, WearResult, etc.
  wear-engine.ts        ← calcPartWear(), getTotalBikeKm(), calcReplacementOptimization()
  pricing.ts            ← Market pricing helpers

components/
  FloatingSketches.tsx  ← Animated floating sketches on homepage
```

---

## 4. Design System Rules (NEVER break these)

- **Font**: Premium modern typography like `Plus Jakarta Sans`, `Inter`, `Outfit`, or system-ui (e.g., `system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif`).
- **Header style**: Clean minimalist white or light background (`#ffffff` or `#f8fafc`), with a very thin, elegant bottom border (`1px solid rgba(0,0,0,0.06)` or `#e2e8f0`).
- **Navigation tabs**: Sleek, modern, and pill-shaped or bottom-indicator active states (no old-school Reddit borders/colors unless specified for legacy pages).
- **Page backgrounds**: Clean modern white or very light off-white background (`#ffffff` or `#f8fafc`) with elegant subtle gradients, soft shadows, and high contrast typography.
- **CSS**: Pure vanilla CSS or CSS variables inside `<style jsx global>`. No Tailwind.
- **Phase nav tabs** in every page header must link to real routes:
  - `all phases` → `/all`
  - `analyzer` → `/analyzer`
  - `tracker` → `/tracker`
  - `extractor` → `/extractor`
  - `mechanic` → `/mechanic`
  - Current page tab = active, with appropriate modern visual indicators.

---

## 5. Agent Behaviour Rules (TOKEN EFFICIENCY)

These rules exist to prevent wasted turns and token loops:

### DO:
- **Ask ALL clarifying questions in one message** before starting any multi-file work.
- **Announce what you're about to do** in one sentence, then do it.
- **Mark tasks done** with ✅ after each discrete unit of work.
- **Stop after completing a clearly scoped task** and wait for the user to say "continue" or give new direction.
- **Update this file** (`AGENTS.md`) whenever phase status changes or new routes/files are added.

### DON'T:
- Do NOT loop through "plan → ask → act → verify → re-ask" without explicit user approval between steps.
- Do NOT create an `implementation_plan.md` for simple tasks (< 3 files). Just do it.
- Do NOT re-explain what you just did in a wall of text. One short summary paragraph is enough.
- Do NOT start Phase N+1 work while the user is reviewing Phase N.
- Do NOT run `npm run build` more than once per task unless a build error occurs.

### Scope Rules:
- **"Fix X"** = change only files related to X. Do not refactor unrelated code.
- **"Continue"** = pick up from the last incomplete task in the last message thread.
- **"Check build"** = run `npm run build`, report errors only. Do not fix anything unless asked.
- **"Start Phase N"** = ask 2–3 critical questions, then write implementation plan, wait for approval.

---
### Model Routing — Pick the Right Tool for the Job

| Task | Use this model |
|------|---------------|
| New phase / architecture | Gemini 3.1 Pro (High) OR Claude Opus 4.6 (Thinking) |
| Multi-file feature (≥ 3 files) | Gemini 3.5 Flash (High) |
| Single component or page | Gemini 3.5 Flash (Medium) OR Claude Haiku |
| LLM prompt refinement | Claude Sonnet 4.6 (Thinking) |
| TypeScript types / API scaffolding | Gemini 3.5 Flash (Medium) |
| Bug fix / quick debug | Claude Haiku OR Gemini 3.5 Flash (Medium) |
| CSS / design polish | Gemini 3.5 Flash (Medium) |
| AGENTS.md / CURRENT_TASK.md updates | Gemini 3.5 Flash (Low) |
| wear-engine.ts algorithm changes | Gemini 3.1 Pro (High) — data contract critical |
| Security audit | Claude Sonnet 4.6 (Thinking) |
| Second opinion / alt codegen | GPT-OSS 120B (Medium) |
| Hardest multi-phase problem | Claude Opus 4.6 (Thinking) — use sparingly |

**Context loading order** — always read in this sequence, stop when sufficient:
1. `AGENTS.md` → 2. `CURRENT_TASK.md` → 3. Target file(s) → 4. Related files only if needed

**Never** speculatively load files not in scope for the current task.

---
## 6. How to Work Across Antigravity + VS Code Agents

### The problem:
Each tool (Antigravity, Copilot, Cursor, etc.) has a fresh context per session.
You end up re-explaining the same project structure repeatedly.

### The solution — three habits:

**Habit 1: This file is the single source of truth.**
- Both Antigravity and VS Code agents read `AGENTS.md` at the start of each session.
- After any meaningful change, update the Phase Status table and File Map here.
- In VS Code: start every Copilot/Cursor chat with `@workspace read AGENTS.md first`.

**Habit 2: Use a `CURRENT_TASK.md` scratch file.**
- When you switch tools mid-task, write what you were doing into `CURRENT_TASK.md`.
- Keep it to 3–5 bullet points max. Example:
  ```
  - Working on: Phase 3 /extractor page
  - Last done: Created app/extractor/page.tsx with form UI
  - Next: Wire up /api/extract-steps route
  - Blocker: None
  ```
- The incoming agent reads this and continues without needing a verbal briefing.

**Habit 3: Commit before switching tools.**
- Run `git add . && git commit -m "wip: <what you just did>"` before switching.
- This gives VS Code agents a clean diff to inspect with `git diff HEAD~1`.

**Tool-specific startup commands:**
| Tool | Start session with |
|------|-------------------|
| **Antigravity** | Model auto-reads `AGENTS.md` via workspace context |
| **GitHub Copilot Chat** | `@workspace /explain AGENTS.md` then describe task |
| **Claude (VS Code ext.)** | `@workspace read AGENTS.md first, then CURRENT_TASK.md` |

**Copilot vs Claude in VS Code — when to use which:**
| Task | Use |
|------|-----|
| Inline autocomplete while typing | GitHub Copilot (always on) |
| Single-function fix or rename | Copilot Chat (fast, inline) |
| Multi-step bug with context | Claude Haiku 3.5 |
| Architectural question or refactor | Switch to Antigravity |

---

## 7. API Patterns (copy these exactly)

All API routes follow this pattern:
```ts
import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";           // or generateText
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai"; // Groq fallback

const groq = createOpenAI({ baseURL: "https://api.groq.com/openai/v1", apiKey: process.env.GROQ_API_KEY });

export async function POST(req: NextRequest) {
  const body = await req.json();

  // ⚡ Model selection: use Pro for complex/critical routes, Flash for standard
  // Complex routes: /api/wear-explain, /api/analyze (full analysis)
  // Standard routes: /api/research-part, /api/price-component, /api/market-data
  const isComplexRoute = true; // set to false for lightweight routes
  const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY
    ? isComplexRoute
      ? google("gemini-1.5-pro")   // wear-explain, full analyze
      : google("gemini-1.5-flash") // research-part, price-component
    : groq("llama-3.3-70b-versatile");

  // ... generateObject / generateText
  return NextResponse.json(result);
}
```

**Route → Model assignment:**
| API Route | Complexity | Model |
|-----------|-----------|-------|
| `/api/analyze` | Complex (full bike analysis) | `gemini-1.5-pro` |
| `/api/wear-explain` | Complex (mechanic reasoning) | `gemini-1.5-pro` |
| `/api/research-part` | Standard | `gemini-1.5-flash` |
| `/api/price-component` | Standard | `gemini-1.5-flash` |
| `/api/market-data` | Standard | `gemini-1.5-flash` |
| `/api/strava/*` | No LLM needed | — |

---

## 8. Known Gotchas

- **`.next` cache**: If you see `Unterminated regular expression` in `routes.d.ts`, delete `.next` and rebuild.
- **`jsx global` in Next.js**: The `<style jsx global>` blocks work because styled-jsx is bundled. Don't remove them.
- **Strava OAuth**: The callback route is at `/api/strava/callback`. The access token is stored in an httpOnly cookie named `strava_token`.
- **TrackerContext**: `selectedBikeId` and `setSelectedBikeId` are in the context type — do not omit them.
- **`calcPartWear`** is a pure function — it is safe to call client-side. No API call needed.

---

## 9. Forbidden Actions

These are hard rules. An agent that violates any of these has failed, regardless of whether the code works.

- ❌ **Never `git push` to `main`** directly. All changes stay local unless the user explicitly says "push".
- ❌ **Never delete or overwrite `.env`** or any file containing real secrets.
- ❌ **Never `console.log` any value from `process.env`** — not even partial values.
- ❌ **Never install a new npm package** without telling the user first and getting a "yes".
- ❌ **Never modify `lib/wear-engine.ts` or `lib/tracker-types.ts`** without explicit instruction — these are the data contract for Phase 2.
- ❌ **Never add Tailwind CSS** — the project uses plain CSS only.
- ❌ **Never move Reddit CSS out of the page's `<style jsx global>` block** into `globals.css` or a separate file.
- ❌ **Never rename existing routes** (`/analyzer`, `/tracker`, `/extractor`, `/mechanic`) — these are public URLs.
- ❌ **Never run `rm -rf` on anything outside `.next`** without confirmation.
- ❌ **Never use `any` type in TypeScript** unless inside a try/catch `catch(err: any)` block.

---

## 10. Naming Conventions

| Thing | Convention | Example |
|-------|-----------|---------|
| Page files | `page.tsx` inside named folder | `app/tracker/page.tsx` |
| Component files | PascalCase | `WearReportTab.tsx` |
| API routes | kebab-case folder + `route.ts` | `app/api/wear-explain/route.ts` |
| TypeScript types/interfaces | PascalCase | `PartProfile`, `WearResult` |
| Type union strings | snake_case | `"replace_soon"`, `"llm_knowledge"` |
| React state variables | camelCase, descriptive | `selectedBikeId`, `modalLoading` |
| localStorage keys | short lowercase | `vst` (main store), `selectedBikeId` |
| CSS class names | kebab-case with `reddit-` prefix | `reddit-flair-avoid`, `wear-card` |
| Environment variables | SCREAMING_SNAKE_CASE | `GROQ_API_KEY` |
| Git branches | `feat/`, `fix/`, `chore/` prefix | `feat/phase3-extractor` |

---

## 11. Definition of "Done"

Before declaring any task complete, verify ALL of the following:

- [ ] `npm run build` exits with code 0
- [ ] No new TypeScript `any` types introduced (outside catch blocks)
- [ ] All navigation links between pages are real `<Link>` components — no disabled spans pointing to new live pages
- [ ] Phase Status table in `/all/page.tsx` AND in `AGENTS.md` Section 2 is updated
- [ ] `CURRENT_TASK.md` is updated to reflect what was done and what's next
- [ ] No secrets or API keys appear in any committed file
- [ ] New files are added to the File Map in `AGENTS.md` Section 3
- [ ] The UI matches the design system (modern clean white-background style or legacy style as appropriate)

---

## 12. Git Conventions

**Commit message format** — always use [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <short description>

Types: feat | fix | chore | refactor | style | docs
Scope: the phase or file area, e.g. tracker, analyzer, api, agents

Examples:
  feat(tracker): add ride log history and stats bar
  fix(analyzer): make tracker tab a real Link
  chore(agents): update AGENTS.md with phase 3 status
  docs(agents): add forbidden actions section
```

**Branch naming:**
```
feat/phase3-extractor
fix/tracker-sidebar-links
chore/agents-md-update
```

**Commit before switching tools** — always commit with `git add . && git commit -m "wip(<scope>): <what>"` before handing off to another agent.

---

## 13. Approved & Banned Dependencies

### ✅ Already installed — use these:
| Package | Use for |
|---------|---------|
| `next` | Framework |
| `react`, `react-dom` | UI |
| `ai` (`@ai-sdk/*`) | LLM calls (`generateObject`, `generateText`) |
| `@ai-sdk/google` | Gemini models |
| `@ai-sdk/openai` | Groq (via custom baseURL) |
| `zod` | Schema validation for `generateObject` |
| `framer-motion` | Animations (homepage only) |

### ❌ Do NOT add without asking:
| Package | Reason |
|---------|--------|
| `tailwindcss` | Project uses plain CSS |
| `axios` | `fetch` is sufficient |
| `lodash` | Use native JS |
| `redux`, `zustand` | React Context is the state pattern here |
| `prisma`, any ORM | No database in this project |
| Any YouTube Data API client | Fetch directly if needed |

---

## 14. Security Rules

- **Never** import or use `process.env.*` inside a `"use client"` component — only server-side (API routes, server components).
- Only `NEXT_PUBLIC_*` variables are safe to use client-side.
- Strava tokens are stored in httpOnly cookies — never expose them in JSON responses or client state.
- The `vst` localStorage object never contains tokens — only ride/bike/part data.
- When adding new API routes, always validate required body fields and return `400` for missing inputs.
- Never trust client-supplied `bikeId` or `partKey` for any server-side operation without validation.

---

## 15. Environment Setup (Bootstrap from Zero)

If you are a new agent setting this project up from scratch:

```bash
# 1. Install dependencies
npm install

# 2. Create .env.local from the example
cp .env.example .env.local
# Then fill in your keys:
#   GOOGLE_GENERATIVE_AI_API_KEY=...  (or GROQ_API_KEY= for free fallback)
#   TAVILY_API_KEY=...                (optional — enables web search for parts)
#   STRAVA_CLIENT_ID=...
#   STRAVA_CLIENT_SECRET=...
#   NEXT_PUBLIC_BASE_URL=http://localhost:3000

# 3. Run dev server
npm run dev

# 4. Visit http://localhost:3000
```

**Minimum viable setup** (no paid APIs): set only `GROQ_API_KEY` — all LLM features fall back to `llama-3.3-70b-versatile` via Groq's free tier.

---

## 16. Error Handling Pattern

Every API route must follow this exact structure:

```ts
export async function POST(req: NextRequest) {
  try {
    const { field1, field2 } = await req.json();

    // 1. Validate inputs
    if (!field1 || !field2) {
      return NextResponse.json({ error: "field1 and field2 are required" }, { status: 400 });
    }

    // 2. Do work
    const result = await doSomething();

    // 3. Return success
    return NextResponse.json(result);

  } catch (err: any) {
    console.error("<route-name> error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
```

Client-side error handling: always set an `error` state string and display it inline near the form. Never use `alert()` or `window.confirm()`.

---

## 17. Data Flow

```
User input (form)
  │
  ▼
Client component (useState)
  │
  ├─► /api/* route (POST)
  │     │
  │     └─► LLM (Gemini / Groq) ──► structured JSON response
  │
  ├─► TrackerContext (setStore)
  │     │
  │     └─► localStorage "vst" (auto-persisted on every store change)
  │
  └─► calcPartWear() [pure, client-side]
        │
        └─► WearResult[] ──► health bars, badges, forecast UI
```

Strava flow:
```
User clicks "Connect Strava"
  → GET /api/strava/auth (redirect to Strava OAuth)
  → Strava redirects to GET /api/strava/callback
  → Callback exchanges code for token, stores in httpOnly cookie
  → Client POSTs to /api/strava/activities with bikeId
  → Route reads cookie, fetches activities, maps to RideLog[], returns array
  → Client stores rides in TrackerContext
```

---

## 18. Architectural Decisions Log

| Date | Decision | Reason |
|------|----------|--------|
| 2026-05-15 | Plain CSS, no Tailwind | Faster iteration, full control, no class explosion |
| 2026-05-15 | Reddit-style UI for all pages | Consistent brand identity, quick to build |
| 2026-05-18 | `calcPartWear` runs client-side | Pure function, no server cost, instant feedback |
| 2026-05-18 | localStorage (`vst`) for persistence | No database needed for MVP, zero backend cost |
| 2026-05-18 | Strava token in httpOnly cookie | Security — prevents JS access to OAuth tokens |
| 2026-05-19 | Reddit CSS embedded per-page | Avoids CSS bleed between pages, easier to maintain |
| 2026-05-19 | `CURRENT_TASK.md` pattern | Enables clean handoff between Antigravity and VS Code agents |

## 19. Agent Model Selection Guide

### Antigravity Models (select in Antigravity sidebar)

| Model | When to use |
|-------|-------------|
| **Gemini 3.5 Flash (Low)** | Docs, AGENTS.md/CURRENT_TASK.md updates, trivial text edits |
| **Gemini 3.5 Flash (Medium)** | Single-file patches, CSS, TypeScript types, API route scaffolding, bug fixes |
| **Gemini 3.5 Flash (High)** | Multi-file features (≥ 3 files), structured code gen with schema context |
| **Gemini 3.1 Pro (Low)** | Moderate complexity refactors, when Flash (High) is insufficient |
| **Gemini 3.1 Pro (High)** | Architecture decisions, new phase planning, wear-engine algorithm changes |
| **Claude Sonnet 4.6 (Thinking)** | LLM prompt engineering, security audit, correctness-critical code |
| **Claude Opus 4.6 (Thinking)** | ☢️ Nuclear option — hardest architectural problems only, use very sparingly |
| **GPT-OSS 120B (Medium)** | Second opinion / alternative code generation perspective |

### VS Code Agents
- **Claude Haiku 3.5** — Multi-step bugs, context-heavy fixes, small refactors.
  Always start with `@workspace read AGENTS.md first, then CURRENT_TASK.md`.
- **GitHub Copilot** — Inline autocomplete (always on) + Copilot Chat for single-function
  fixes. Start Copilot Chat with `@workspace /explain AGENTS.md` then describe task.

### Decision Flowchart

```
Task touches ≥ 3 files?
  Yes → Needs architecture / new data contract / algorithm design?
          Yes → Gemini 3.1 Pro (High)  OR  Claude Opus 4.6 (Thinking)
          No  → Gemini 3.5 Flash (High)
  No  → Prompt engineering, security, or correctness-critical?
          Yes → Claude Sonnet 4.6 (Thinking)
          No  → Single file?    → Gemini 3.5 Flash (Medium) OR Claude Haiku
               Docs/text only? → Gemini 3.5 Flash (Low)
               Need alt view?  → GPT-OSS 120B (Medium)
               Inline typing?  → GitHub Copilot (autocomplete)
```
