# VeloStack — Open Development Issues & Backlog

This document maps out the strategic roadmap of VeloStack into discrete, highly structured, and actionable development issues. Developers or AI agents can pull from these issues to implement features incrementally.

---

## 🛠️ Category A: The "Hustle OS" (Operation & Workflow)

### [Issue #1] Implement "The Parts Bin" Drivetrain & Component Inventory
* **Status**: 🔲 Backlog
* **Priority**: High
* **Target Files**: 
  - `lib/tracker-types.ts` (Update type definitions for inventory components)
  - `app/tracker/context.tsx` (Add inventory state and localStorage sync)
  - `app/tracker/components/PartsBinTab.tsx` [NEW] (User interface to manage bin)
  - `lib/wear-engine.ts` (Implement compatibility suggestion algorithm)

#### Description
Bike flippers routinely take parts off bikes (saddles, cassettes, tires) and store them in their garage. When fixing a new bike project that is missing a component, they should be able to leverage their existing inventory instead of spending cash on retail parts.

#### Technical Scope
1. **Inventory Schema**: Define `PartsBinItem` with properties:
   ```typescript
   export interface PartsBinItem {
     id: string;
     componentType: "chain" | "cassette" | "saddle" | "tire" | "brake_pads" | "grip" | "cables";
     brandModel: string;
     condition: "new" | "excellent" | "fair" | "worn";
     compatSpeeds?: number; // e.g. 10-speed, 11-speed
     estimatedValueEur: number;
     dateAdded: string;
   }
   ```
2. **Context Extension**: Add `partsBin: PartsBinItem[]` and actions `addToPartsBin`, `removeFromPartsBin` to `TrackerContext` synced under `vst_parts_bin` localStorage.
3. **Smart Matching Algorithm**: In `WearReportTab.tsx`, when a part's health is below replacement threshold (or missing), scan the `partsBin` for compatible spares. If a match is found, display a recommendation badge:
   > 💡 **Parts Bin Match**: You have an *excellent condition 11-speed Shimano HG601 Chain* in your garage. Swap this in to save **€30** on retail replacements!

#### Acceptance Criteria
- [ ] Users can manually add items to the "Parts Bin" with type, condition, and specs.
- [ ] A dedicated "Parts Bin Inventory" grid page lists items categorized with search filters.
- [ ] When a part on an active bike is marked "Replaced," ask the user: *"Did you use a new part or a part from your Bin?"*
- [ ] System automatically displays recommendations in the parts wear tab when a compatible inventory item is available.

---

### [Issue #2] Implement 1-Click AI Auto-Listing Generator
* **Status**: ✅ Completed
* **Priority**: Medium
* **Target Files**:
  - `app/api/listing-generator/route.ts` [NEW] (LLM completion endpoint)
  - `app/tracker/components/ListingGeneratorModal.tsx` [NEW] (Overlay modal)
  - `app/tracker/page.tsx` (Add "Generate Sale Listing" button)

#### Description
Once a bike's upgrades and repairs are completed, the flipper wants to list it for sale as fast as possible. This issue automatically scrapes the bike's specs, replaced components, and tuned health points to generate a high-converting, SEO-optimized classified description for Facebook Marketplace, eBay Kleinanzeigen, or Craigslist.

#### Technical Scope
1. **API Endpoint**: Set up a POST route passing:
   - Bike details (make, model, color, frame material, speeds)
   - Replaced parts list (new chain, fresh tires, sanded rotors)
   - Upgraded accessories (carbon water bottle cage, new grips)
   - Target price
2. **LLM Prompt Pattern**: Draft a system prompt targeting local flippers:
   - Structure text into clear blocks: *Headline*, *Overview*, *Upgraded Components (Crucial for value)*, *Condition Verdict*, and *Hashtags*.
   - Output tone options: "Professional Enthusiast", "Quick Budget Sell", or "Direct Minimalist".
3. **Copy-to-Clipboard Utilities**: Provide a 1-click clipboard Copy button and SMS share hooks.

#### Acceptance Criteria
- [x] Clicking "Generate Listing" on a bike opens a modal with customization controls (Asking Price, Platforms, Style).
- [x] API successfully formats prompt, calls Gemini/Groq, and streams/returns a clean, non-markdown formatted description text block.
- [x] Integrates a 1-click "Copy Listing text" interface returning a green "Copied!" check badge.

---

### [Issue #3] Create Profit & Loss (P&L) Ledger & Flip Dashboard
* **Status**: ✅ Completed
* **Priority**: Medium
* **Target Files**:
  - `lib/tracker-types.ts` (Add ledger metrics interfaces)
  - `app/ledger/page.tsx` [NEW] (Full P&L accounting panel page)
  - `app/tracker/context.tsx` (Extend state to record active vs. sold bikes)

#### Description
Flipping is an accounting game. Flippers need to track their initial purchase prices, component investment expenses, hourly labor allocations, and final sale prices to understand their true hourly earnings and net margins.

#### Technical Scope
1. **Ledger Model**: Define `FlipTransaction` schema:
   ```typescript
   export interface FlipTransaction {
     bikeId: string;
     title: string;
     purchasePrice: number;
     partsExpense: { partName: string; cost: number }[];
     laborHours: number;
     estimatedLaborCost: number; // e.g. hours * custom rate
     askingPrice: number;
     finalSalePrice?: number;
     saleDate?: string;
     status: "sourcing" | "in_progress" | "listed" | "sold";
   }
   ```
2. **Aggregates Calculator**: Write pure calculations for:
   - *Net Profit* (`salePrice - purchasePrice - sum(parts)`)
   - *ROI Percentage* (`netProfit / (purchasePrice + parts) * 100`)
   - *Hourly Labor Yield* (`netProfit / laborHours`)
3. **Visual Data Charts**: Build clean HTML/CSS visual ledger bars mapping total capital deployed vs. realized returns.

#### Acceptance Criteria
- [x] A dedicated `/ledger` dashboard displays key counters: Net Profit, Capital Invested, Average Flip Time, and Hourly Earnings.
- [x] Transactions can be filtered by active builds vs. sold flips.
- [x] Users can edit cost rows on-the-fly and add custom expenses (gas, shipping fees).

---

## 📈 Category B: The Pricing Moat (Data & Intelligence)

### [Issue #4] Build Proprietary "Sold" Classified Scraper & KBB Index
* **Status**: ✅ Completed
* **Priority**: High
* **Target Files**:
  - `app/api/market-data/route.ts` [NEW] (Query Pinkbike/eBay API or scrapers)
  - `lib/pricing.ts` (Update from static ranges to statistical index lookup)

#### Description
LLMs frequently hallucinate prices or supply generic ranges that ignore reality. To establish a true competitive moat, VeloStack must scrape actual sold transactions on eBay Completed listings and Pinkbike classifieds to construct a statistical marketplace price range index ("The Kelley Blue Book for Bikes").

#### Technical Scope
1. **Scraping Engine stub**: Create API to fetch historical transaction pricing:
   - For eBay: Scrape `ebay.com/sch/i.html?_nkw=<query>&LH_Sold=1&LH_Complete=1`.
   - For Pinkbike: Scrape `pinkbike.com/buysell/list/?q=<query>`.
2. **Statistical Aggregator**: Compute:
   - *Low clearing* (15th percentile)
   - *Median clearing* (50th percentile)
   - *High clearing* (85th percentile)
   - *Sample Size Count* (volume metric to rate confidence)
3. **Caching Layer**: Store queries and pricing results in database/localStorage for 7 days to stay rate-limit compliant.

#### Acceptance Criteria
- [x] `/api/market-data` takes a component/bike query, parses eBay/Pinkbike search pages, and returns structured clearing price statistics.
- [x] Replaces standard LLM price estimation in `/analyzer` with real empirical search ranges.
- [x] Renders a "Data Confidence Score Indicator" (based on sample size count of actual sold items found).

---

### [Issue #5] Implement Hyper-Local Arbitrage & Regional Liquidity Engine
* **Status**: ✅ Completed
* **Priority**: Low
* **Target Files**:
  - `lib/analyzer.ts` (Extend profit logic with zip code rules)
  - `app/analyzer/page.tsx` (Add zipcode/city input field)

#### Description
A gravel bike sells quickly and at premium values in urban commuter spaces (e.g. London, NYC, Munich), whereas high-end mountain bikes sit on flatlands markets (e.g. Florida) for months. VeloStack will track geographic liquidity indices to factor time-to-sell risk into deal verdicts.

#### Technical Scope
1. **Geographic Pricing Modifiers**: Implement a multiplier database based on regional clusters.
2. **Liquidity Score Index**: Define local coefficients:
   - *Urban high-density*: Premium roads/gravel (+10% value, -30% time-to-sell)
   - *Mountain range clusters*: Premium MTBs (+15% value, -40% time-to-sell)
   - *Flat suburbia*: Road bike drag (-15% value, +50% time-to-sell)
3. **UI Integration**: In `analyzer/page.tsx`, ask for location. Adjust deal verdicts from `GREAT FLIP` to `FAIR DEAL` if time-to-sell risk exceeds 45 days.

#### Acceptance Criteria
- [ ] Users can enter a zip code or city.
- [ ] Profit margin calculations dynamically scale up or down depending on local model weights.
- [ ] Renders an "Estimated Days on Market" gauge showing high/med/low liquidity warnings.

---

## 🌊 Category C: Blue Ocean Features (radically novel ideas)

### [Issue #6] Create the "Part-Out" Arbitrage Calculator
* **Status**: ✅ Completed
* **Priority**: Medium
* **Target Files**:
  - `lib/pricing.ts` (Define parts disassembly values)
  - `app/analyzer/components/PartOutDetails.tsx` [NEW] (Visual split-card UI)

#### Description
Sometimes a complete bike is worth less than the sum of its parts. If a frame has cosmetic damage but the fork and drivetrain are mint, stripping the bike and selling the parts individually on eBay yields a much higher profit margin.

#### Technical Scope
1. **Part-Out Algorithm**: Calculate `disassemblyValue` as:
   - `Sum(extractedPartsPrice) * disassemblyDeductionFactor (e.g., 0.85 for packaging/fees)`
2. **Comparison Logic**:
   - Compare `disassemblyValue` vs `completeBikeResaleValue`.
   - If `disassemblyValue > completeBikeResaleValue + (laborTime * 20)`, trigger Part-Out alert:
     > 💡 **Part-Out Recommendation**: Strip down this bike! Dismantling it and selling the parts separately on eBay will yield **€180 more profit** than selling it whole!
3. **Labor Allocation**: Factor in the time needed to pack and ship individual components.

#### Acceptance Criteria
- [x] The Analyzer UI displays a toggle: "Whole Bike vs. Part-Out Valuation".
- [x] Renders an itemized list of components showing individual values (Drivetrain, Fork, Frame, Wheels).
- [x] Displays a step-by-step disassembly feasibility score based on tools needed.

---

### [Issue #7] Build the "Franken-Bike" Compatibility Matchmaker
* **Status**: 🔲 Backlog
* **Priority**: High
* **Target Files**:
  - `lib/compatibility.ts` [NEW] (Database of mechanical component matching standards)
  - `app/tracker/components/BuildMatchmaker.tsx` [NEW] (Interactive drag-and-drop compatibility canvas)

#### Description
The most frustrating part of building custom bikes from spare parts is compatibility. Bottom brackets, axle widths, and shifter pull-ratios are notoriously complicated. This engine cross-references items in the user's "Parts Bin" with their active frames to guarantee 100% mechanical compatibility before they touch a wrench.

#### Technical Scope
1. **Compatibility Rules Library**: Map mechanical constraints:
   - *Drivetrain pull-ratios* (e.g. SRAM 1:1 vs Shimano SIS)
   - *Speeds matching* (e.g. 11-speed chain on 11-speed cassette)
   - *Bottom Bracket standards* (BSA thread, PressFit BB30, BB86)
   - *Disc brake mounting* (Centerlock vs 6-bolt)
2. **Matchmaker solver**: Take a target frame, scan the user's `PartsBinItem[]`, and auto-generate the optimal matching build combination.
3. **UI Overlay**: Show clean red/green connector lines between components indicating compatibilities or mismatches.

#### Acceptance Criteria
- [ ] Drag-and-dropping a part from the Parts Bin onto a bike frame highlights compatibilities.
- [ ] Displays explicit mechanical errors (e.g., *"Cannot pair 10-speed shifter with 11-speed cassette"*).
- [ ] Offers alternative parts search queries to purchase missing compatible adapters.

---

### [Issue #8] Implement "AI Deal Sniper" (Automated classified scanner)
* **Status**: 🔲 Backlog
* **Priority**: High
* **Target Files**:
  - `app/api/deal-sniper/route.ts` [NEW] (Cron task classified monitoring loop)
  - `app/settings/page.tsx` [NEW] (Configure alerts, filters, and phone notification hooks)

#### Description
Flippers miss out on the best deals because listings are snatched up within minutes. The AI Deal Sniper scans local classified platforms (eBay Kleinanzeigen, Craigslist) 24/7. When an undervalued bike is posted, the engine runs listing details through the Analyzer API and sends a high-priority push or SMS notification instantly.

#### Technical Scope
1. **Cron Poller Service**: Set up a background cron scheduler scanning classified listing search APIs or HTML lists.
2. **Auto-Analyzer Filter**: Parse every discovered listing:
   - Extract title, description, price, and images.
   - Run listing through `/api/analyze`.
   - Filter transactions where `profitMargin >= threshold` (e.g. margin > €150).
3. **SMS Alert Trigger**: Send SMS containing deep link direct to sourcing platform and calculated ROI summary.

#### Acceptance Criteria
- [ ] Setting page allows setting alerts for Zip Code, Search Radius, Target Budget, and Minimum Profit.
- [ ] Background polling detects test listings, analyzes them within 10 seconds, and correctly filters high-profit options.
- [ ] Delivers formatted alert: *"🚨 DEAL SNIPED: Specialized Allez Road Bike listed at €80. Estimated profit: €240. Distance: 2.1 miles. [Link to Listing]"*.

---

### [Issue #9] Build "Pre-Sold" Flip & Buyer Customization Interface
* **Status**: 🔲 Backlog
* **Priority**: Low
* **Target Files**:
  - `app/api/pre-sold/route.ts` [NEW] (Public reservation API)
  - `app/mechanic/page.tsx` (Add "Publish coming soon listing" button)
  - `app/public-listing/[id]/page.tsx` [NEW] (Public customization portal for buyers)

#### Description
To eliminate listing risks, flippers can post "coming soon" mockups of in-progress bikes. Local buyers can browse active workshop builds, secure reservations with deposits, and request custom part swaps (e.g., swapping slick tires for tan-wall gravel tires) *before* the flipper completes the build.

#### Technical Scope
1. **Coming Soon Publisher**: Takes active bike metadata and renders a clean public-facing single-page application under `/public-listing/[id]`.
2. **Buyer Customizer Engine**: Renders checkboxes for parts upgrades (e.g., *"Tan-wall tires (+€25)"*, *"Ergonomic saddle (+€15)"*).
3. **Price/Margin Adjuster**: Automatically adjusts the final asking price dynamically as options are selected, displaying real-time profit impact to the flipper.

#### Acceptance Criteria
- [ ] Flippers can publish a "Coming Soon" card with the build's estimated completion date.
- [ ] Public page displays the customizer form, allowing buyers to select upgrades.
- [ ] Generates custom quote sheet summaries showing final build specs.

---

> [!IMPORTANT]
> ### How to Execute an Issue
> 1. Select a backlog issue card (e.g., **Issue #1: Parts Bin Inventory**).
> 2. Create the target files and implement the TS interfaces, states, API routes, and components.
> 3. Verify the implementation compiles using `npm run build` and save persistence records to local storage or database.
> 4. Mark the issue as `✅ Completed` in this file, commit work, and proceed to the next backlog item!
