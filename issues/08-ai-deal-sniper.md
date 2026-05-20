# Issue #8: Automated "AI Deal Sniper" Classified Scanner (Blue Ocean)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: High
* **Assigned To**: None
* **Labels**: `feature`, `blue-ocean`, `backend`, `cron`, `notifications`

---

## 📖 Description
The absolute best bike deals on classified sites (Craigslist, Facebook Marketplace, eBay Kleinanzeigen) are frequently snapped up within 15 minutes of posting. Professional flippers miss out because they cannot monitor these platforms 24/7.

This issue implements the **AI Deal Sniper**—a background polling worker that automatically monitors local listings, passes newly discovered listings through the AI Analyzer API, and sends an instant SMS notification if a bike represents an undervalued flip opportunity exceeding the user's profit target.

---

## 🛠️ Technical Scope

### 1. Build Background Cron Route
Create a new Next.js route at `app/api/deal-sniper/route.ts`:
- Accept requests secured with a secret token (to protect against unauthorized manual calls).
- Implement standard polling search fetch loops matching user filters:
  - Query classified feeds within a defined radius (e.g. 10 miles from a specified Zip Code).
  - Extract basic data: Title, Description, Price, Image URLs, Distance, and Sourcing Link.

### 2. Connect Automated Evaluation Engine
Inside the cron handler, for each parsed listing:
- Compare listing URL against a cached database (to ensure duplicate listings aren't re-analyzed).
- Call `/api/analyze` server-side passing listing details.
- Parse the deal verdict. Filter items where:
  - `estimatedProfitEur >= minProfitThreshold` (e.g. > €150)
  - `dealScore >= 75` (high-quality flip confidence)

### 3. Twilio SMS Integrations
If a bargain is identified:
- Construct an action-oriented notification message:
  ```text
  🚨 VELOSTACK DEAL SNIPED!
  Bike: 2021 Trek Emonda ALR
  Listed Price: €120
  Estimated Value: €450
  Est. Profit: €330 (ROI: 275%)
  Distance: 3.2 miles
  Link: https://ebay.de/item/12345678
  [Analyze inside VeloStack Workspace]
  ```
- Send the SMS payload using the **Twilio SDK** or a simple webhook dispatch service.

### 4. Alert Settings View
Create a setup panel at `app/settings/page.tsx`:
- Configure alert variables:
  - **Sourcing radius** (miles/km) and reference Zip Code.
  - **Target price range** (e.g. €0 - €250).
  - **Minimum Profit Margin threshold** (e.g. €150).
  - **Target Brand Keyword Filters** (e.g., Specialized, Trek, Cannondale).
  - **Phone number** for alerts.

---

## 🎯 Acceptance Criteria
- [ ] Users can configure alerts, phone numbers, target budgets, and zip code radiuses.
- [ ] Background polling API successfully scrapes, identifies, and parses new listings.
- [ ] Analyzer filters listings accurately based on the user's custom profit margin goals.
- [ ] The notification dispatcher successfully sends an SMS with deep-links within 60 seconds of deal detection.
- [ ] History of analyzed "Sniped Deals" is stored and viewable inside a dashboard feed.

---

## 🧪 Verification Plan

### Automated Checks
- Unit test the parsing logic with mock HTML classified listing payloads.
- Run `npm run build` to confirm compilation.

### Manual Walkthrough
1. Go to `/settings`. Enter your Zip Code, select radius, set min profit to `€100`, and input phone number.
2. Trigger the cron route `/api/deal-sniper?secret=TEST_SECRET` containing a mock listing (e.g. `Giant Defy road bike, price: €80`).
3. Verify that:
   - The listing is processed by the AI Analyzer.
   - You receive an SMS alert summarizing the giant deal details, ROI, and sourcing link.
   - The sniped item appears in your local workspace alerts.
