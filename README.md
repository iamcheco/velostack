# VeloStack 🚲

> **Bike side-hustle engine** — find undervalued listings, diagnose issues, track component wear, and extract repair skills from YouTube videos.

A personal side project built incrementally, one phase at a time. No deadline. Built to learn and to earn.

## Live Phases

| Phase | Feature | Status |
|---|---|---|
| 1 | Fix & Flip Listing Analyzer | ✅ Live |
| 2 | Parts Wear Tracker (Strava) | 🔜 Next |
| 3 | YouTube Skill Extractor | 🔜 Planned |
| 4 | Pocket Bike Mechanic AI (OpenCV) | 🔜 Planned |
| 5 | Freemium Monetization | 🔜 Planned |

## Phase 1 — Fix & Flip Analyzer

Paste any bike listing (title + description + price) and get:
- **Deal verdict**: GREAT FLIP / FAIR DEAL / PASS / AVOID
- **Detected issues**: chain wear, brake problems, rust, derailleur issues, etc. (EN + DE)
- **Estimated repair cost**: per issue, summed
- **Profit estimate**: `resale - asking_price - repair_cost`
- **Confidence score**: based on whether comparable prices are available

No AI needed — pure rule-based heuristics. Works for German and English listings.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **Styling**: Tailwind CSS v4 (custom dark theme)
- **Language**: TypeScript
- **Backend**: Next.js API Routes
- **Validation**: Zod

## Getting Started

```bash
git clone https://github.com/iamcheco/velostack.git
cd velostack
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

## Project Structure

```
velostack/
├── app/
│   ├── page.tsx              # Landing page
│   ├── analyzer/page.tsx     # Phase 1: Fix & Flip tool
│   ├── tracker/page.tsx      # Phase 2: Parts tracker (stub)
│   ├── extractor/page.tsx    # Phase 3: YouTube extractor (stub)
│   ├── mechanic/page.tsx     # Phase 4: AI mechanic (stub)
│   └── api/
│       └── analyze/route.ts  # Listing analysis API
├── lib/
│   ├── analyzer.ts           # Rules engine + profit formula
│   └── cn.ts                 # Tailwind class helper
└── app/globals.css           # Full design system
```

## Environment Variables

Create `.env.local` (not committed):

```env
# Phase 3+
GEMINI_API_KEY=

# Phase 2
STRAVA_CLIENT_ID=
STRAVA_CLIENT_SECRET=

# Phase 5
STRIPE_SECRET_KEY=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
```

## Roadmap

See [implementation_plan.md](./docs/implementation_plan.md) for the full phased plan.

---

Built by [@iamcheco](https://github.com/iamcheco)
