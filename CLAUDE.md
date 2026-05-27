# VeloStack — Claude-Specific Agent Guide

> This file contains Claude-specific overrides and startup rules.
> For full project context, read `AGENTS.md` first.

---

## Session Startup Checklist (Claude MUST do this every session)

1. **Read `AGENTS.md`** — full project context, phase status, file map, forbidden actions
2. **Read `CURRENT_TASK.md`** — what the last agent did, what's next, any blockers
3. **Declare your model and budget** before writing any code:
   ```
   🤖 Model: Claude Haiku 3.5  (or Sonnet 4.6 Thinking)
   📦 Budget: Low — single-file fix
   ```
4. **State what you're about to do** in one sentence, then do it.

---

## Claude Model Selection (VS Code)

| Model | When to use in this project |
|-------|----------------------------|
| **Claude Haiku 3.5** | Default — single-file patches, bug fixes, quick Q&A, CSS tweaks |
| **Claude Sonnet 4.6 (Thinking)** | Only when: prompt engineering in `analyzer.ts`/`wear-explain`, security review, or multi-step correctness-critical code |

> **Never** reach for Sonnet Thinking for a single-function fix. Haiku is sufficient.

---

## Claude-Specific Behaviour Rules

### DO:
- Always read `AGENTS.md § 9` (Forbidden Actions) before touching any file.
- For TypeScript changes, check `AGENTS.md § 10` (Naming Conventions) first.
- Treat `lib/wear-engine.ts` and `lib/tracker-types.ts` as **read-only** unless explicitly told otherwise.
- Use `AGENTS.md § 7` API pattern verbatim for any new route — do not invent a new pattern.
- After finishing, update `CURRENT_TASK.md` with what you did and what's next.

### DON'T:
- Don't use `any` TypeScript type except in `catch(err: any)` blocks.
- Don't add Tailwind CSS — plain CSS only (see `AGENTS.md § 4`).
- Don't `git push` to `main`. Ever.
- Don't re-explain what you just did in a wall of text. One short paragraph max.
- Don't start the next phase or task without the user saying "continue" or "yes".

---

## Context Loading Order (Claude)

Load in this exact sequence. Stop when you have enough:

```
1. AGENTS.md          ← always (source of truth)
2. CURRENT_TASK.md    ← always (last handoff state)
3. Target file(s)     ← only the file(s) in scope
4. Related files      ← only if the task explicitly touches them
```

> Loading files speculatively is wasteful. Each unnecessary file read
> burns context window. If in doubt, ask — don't load.

---

## Handoff Protocol (Claude → Antigravity)

When you finish a task and the user is switching to Antigravity:

1. Write to `CURRENT_TASK.md`:
   ```
   - Working on: <phase or issue>
   - Last done: <what you completed>
   - Next: <what Antigravity should pick up>
   - Blocker: <any issue, or "None">
   ```
2. Run: `git add . && git commit -m "wip(<scope>): <what>"`
3. Tell the user: "Ready to hand off to Antigravity. CURRENT_TASK.md is updated."

---

## Quick Reference — Key Files

| File | Purpose |
|------|---------|
| `AGENTS.md` | Full project OS — read first every session |
| `CURRENT_TASK.md` | Handoff state between agents |
| `lib/tracker-types.ts` | Data contract — do NOT modify without instruction |
| `lib/wear-engine.ts` | Core algorithm — do NOT modify without instruction |
| `app/tracker/context.tsx` | Global state — touch carefully, check types |
| `AGENTS.md § 7` | Copy API route pattern from here exactly |
| `AGENTS.md § 9` | Forbidden actions — check before any edit |
