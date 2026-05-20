# Issue #6: The "Part-Out" Arbitrage Disassembly Calculator (Blue Ocean)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: Medium
* **Assigned To**: None
* **Labels**: `feature`, `blue-ocean`, `algorithms`, `pricing-engine`

---

## 📖 Description
Frequently, a complete bike is worth significantly less than the sum of its individual parts. For instance, if a high-end carbon frame suffers from a non-structural cosmetic paint scrape, the whole bike price drops drastically. However, the top-tier drivetrain, forks, wheelset, and cockpit are completely unaffected.

Dismantling the bike and selling the components separately on eBay or Pinkbike yields a much higher net profit margin. This issue implements the "Part-Out" Arbitrage Calculator, which breaks down component values, estimates packaging/shipping/seller fees, and provides an actionable dismantling recommendation.

---

## 🛠️ Technical Scope

### 1. Build Disassembly Value Calculator
Create a helper algorithm in `lib/part-out-engine.ts`:
- Estimate itemized parts value:
  - **Drivetrain** (groupset, shifters, derailleur)
  - **Suspension / Fork**
  - **Wheelset** (rims, hubs, tires)
  - **Frame & Cockpit**
- Deduct **Dismantling Friction Costs**:
  - Packaging materials (cartons, bubble wrap): €15
  - Shipping fees and listing commissions (e.g. 12% eBay fee)
  - Labor overhead: 3 hours flat (value labor at €20/hr)
- Define `PartOutAnalysis`:
  ```typescript
  export interface PartOutAnalysis {
    isRecommended: boolean;
    completeBikeResaleValue: number;
    rawPartOutSum: number;
    shippingFeesSum: number;
    commissionFeesSum: number;
    packagingMaterialsCost: number;
    laborTimeHours: number;
    netPartOutProfit: number;
    profitDifference: number; // netPartOutProfit - wholeBikeProfit
    componentBreakdown: Array<{ partName: string; rawValue: number; demandScore: "high" | "medium" | "low" }>;
  }
  ```

### 2. Update Valuation Analyzer View
Implement a split UI inside `app/analyzer/components/PartOutDetails.tsx`:
- Render an elegant toggled card comparing **"Whole Resale" vs "Part-Out Disassembly"**.
- Displays an interactive itemized component checklist. Users can check/uncheck parts if they are damaged or missing.
- When `netPartOutProfit > completeBikeResaleValue + 50`, trigger a prominent golden alert banner:
  > 🌊 **Part-Out Opportunity**: Strip down this bike! Dismantling it and listing components individually is estimated to yield **€[Difference] more profit** than selling it whole, even after shipping & labor overhead!

---

## 🎯 Acceptance Criteria
- [ ] The Analyzer interface displays an itemized parts list with individual estimated values.
- [ ] Users can check/uncheck parts to dynamically recalibrate part-out yields.
- [ ] The engine correctly factors in listing fees, shipping costs, packaging, and labor time.
- [ ] Prominent recommendation alert highlights when parting out is mathematically superior to whole resale.
- [ ] Visual slider balances labor effort vs monetary yield.

---

## 🧪 Verification Plan

### Automated Checks
- Run tests verifying that unchecking components correctly deducts their values and updates the net output.
- Verify `npm run build` exits successfully.

### Manual Walkthrough
1. Go to `/analyzer` and run an evaluation on a `Specialized Tarmac Comp 2018`.
2. Toggle on "Whole Bike vs. Part-Out Valuation".
3. Verify the itemized table displays Drivetrain, Wheels, Fork, and Frame estimates.
4. Uncheck "Wheelset" and confirm the total part-out sum drops instantly.
5. Tweak fees and verify the net profit recalculates correctly.
