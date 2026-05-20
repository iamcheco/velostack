# Issue #4: Proprietary "Sold" Classified Scraper & KBB Index (Pricing Moat)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: High
* **Assigned To**: None
* **Labels**: `feature`, `pricing-moat`, `api`, `scraping`, `statistics`

---

## 📖 Description
Static price ranges or LLM estimations frequently suffer from hallucinations or outdated pricing knowledge. To establish a true competitive data moat, VeloStack must scrape actual sold transactions on platforms like eBay Completed Listings and Pinkbike Classifieds to construct a statistical market price range index ("The Kelley Blue Book for Bikes").

This issue implements an API scraping handler that parses completed classified pages for a given component/bike query, calculates statistical clearings (15th, 50th, and 85th percentiles), and displays a premium confidence metric on `/analyzer`.

---

## 🛠️ Technical Scope

### 1. Build Scraper Completed Listings Endpoint
Create a new Next.js route at `app/api/market-data/route.ts`:
- Accept queries via POST:
  ```typescript
  interface MarketDataRequest {
    query: string; // e.g. "Shimano Ultegra R8000 Cassette" or "Trek Domane 2021"
    category?: "bike" | "component";
  }
  ```
- Implement HTML parser routines fetchingCompleted / Sold items:
  - **eBay Completed Listings**: `https://www.ebay.com/sch/i.html?_nkw=<query>&LH_Sold=1&LH_Complete=1`
  - **Pinkbike Buysell Archive**: `https://www.pinkbike.com/buysell/list/?q=<query>`
- Write robust regex/selector parsers extracting price values and item condition.
- Implement standard rate limit protections and cache successful results in `localStorage` or Supabase for 7 days.

### 2. Statistical Aggregator Engine
Build calculations inside a helper `lib/pricing-index.ts`:
- Extract array of transaction prices.
- Compute:
  - **Low Valuation** (15th percentile): Bargain sourcing price.
  - **Median Valuation** (50th percentile): Standard fair clearing.
  - **High Valuation** (85th percentile): Top-tier pristine listing price.
  - **Sample Size Metric**: Total successful items found.
  - **Data Confidence Score**: Rate "High" if count > 15, "Medium" if 5-15, and "Low" if < 5.

### 3. Replace Static Estimations in Analyzer View
Update the `/analyzer` page (`app/analyzer/page.tsx`):
- Wire up the Analyzer submit button to trigger `/api/market-data` alongside the LLM call.
- Replace or overlay the static mock value ranges with the empirical statistics card.
- Draw a sleek "KBB Index Clearing Meter" showing the 15-50-85 percentile layout with an interactive slider indicating the user's target pricing.
- Render the data confidence score with matching modern badges.

---

## 🎯 Acceptance Criteria
- [ ] Users submitting a search in `/analyzer` trigger a real-time classified completed listings search.
- [ ] System handles scraping errors gracefully, falling back to LLM estimations without breaking the UI.
- [ ] Renders the empirical price statistics: Bargain (15%), Fair (50%), and Top (85%).
- [ ] Renders a "Data Confidence Score" based on the volume of matching transactions found.
- [ ] Caching logic stores queries for 7 days to prevent heavy scrapers running on duplicate searches.

---

## 🧪 Verification Plan

### Automated Checks
- Mock HTML structures of eBay / Pinkbike listings and run unit tests on the regex parser.
- Verify `npm run build` exits with code 0.

### Manual Walkthrough
1. Go to `/analyzer`.
2. Input a highly specific query like `Shimano 105 R7000 Shifters`.
3. Verify the system scrapes and populates the pricing cards showing actual sold transactions, confidence levels, and percentiles.
4. Verify searching the exact same query in rapid succession triggers the cached database path instead of loading pages again.
