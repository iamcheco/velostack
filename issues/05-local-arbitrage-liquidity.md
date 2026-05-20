# Issue #5: Hyper-Local Arbitrage & Regional Liquidity Engine (Pricing Moat)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: Low
* **Assigned To**: None
* **Labels**: `feature`, `pricing-moat`, `algorithms`, `localization`

---

## 📖 Description
Market liquidity and pricing thresholds are highly geographical. A gravel or commuter bike sells within 48 hours at premium rates in high-density urban centres (London, Munich, NYC), whereas expensive downhill mountain bikes sit on flatlands classifieds (Florida, Netherlands) for months.

This issue implements hyper-local geographical adjustments. Users input a zip code or city, and the valuation analyzer scales profits and projects "Estimated Days on Market" based on regional demand multipliers and category mapping weights.

---

## 🛠️ Technical Scope

### 1. Geographic Multipliers Database
Create a static mapping configuration in `lib/geo-regions.ts`:
- Define major metropolitan clusters, geographic categories, and category multipliers:
  - **Urban High-Density** (commuter, gravel, vintage road bikes): Value modifier: `+10%`, Time-to-sell modifier: `-30%`.
  - **Mountainous Regions** (full-suspension, enduro, trail MTBs): Value modifier: `+15%`, Time-to-sell modifier: `-40%`.
  - **Flat Suburbs** (aerodynamic road bikes, high-end cruisers): Value modifier: `-10%`, Time-to-sell modifier: `+20%`.
  - **Standard Suburbia** (hybrid, budget commuter): Value modifier: `0%`, Time-to-sell modifier: `0%`.

### 2. Update Analyzer Business Logic
Extend `lib/analyzer.ts` or the server route `/api/analyze` to support local parameters:
- Add `locationCityOrZip?: string` to parameters.
- Parse input to map the closest geographic cluster.
- Apply multipliers to calculate:
  - **Adjusted Net Profit**: Scales standard valuation up or down.
  - **Projected Days on Market (DoM)**: Baseline value (e.g. 30 days) adjusted by the regional multiplier.

### 3. Localization UI Integration
Modify the search form in `app/analyzer/page.tsx`:
- Add a neat "Location (Zip Code or City)" input next to the bike search field.
- Renders an **"Estimated Days on Market" Liquidity Gauge** (Low / Moderate / High Liquidity) alongside the final deal recommendation.
- Adjust the final transaction rating: downgrades `GREAT FLIP` to `FAIR DEAL` if the projected Days on Market exceeds 45 days due to location risks.

---

## 🎯 Acceptance Criteria
- [ ] Users can optionally provide a zip code or city when analyzing a potential bike deal.
- [ ] The engine parses the location and matches the appropriate localized pricing multiplier.
- [ ] Renders an "Estimated Days on Market" visual progress bar or gauge.
- [ ] High-liquidity locations shorten estimated listing times and raise margin confidence.
- [ ] Verification fallback safely handles arbitrary text locations without crashing.

---

## 🧪 Verification Plan

### Automated Checks
- Add unit tests verifying geographical multipliers correctly compute and scale.
- Run `npm run build` to confirm zero TypeScript compilation errors.

### Manual Walkthrough
1. Navigate to `/analyzer`.
2. Input bike: `Specialized Diverge Gravel Bike` and set price: `400`.
3. Analyze without location. Note standard ROI and days-to-sell (e.g. 30 days).
4. Analyze again setting Zip Code: `10001` (NYC/Urban High-Density). Verify that:
   - Estimated value scales up.
   - Projected days-to-sell decreases (e.g. 21 days).
   - "High commuter demand in this zip code!" badge is displayed.
