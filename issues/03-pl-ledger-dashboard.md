# Issue #3: Profit & Loss (P&L) Ledger & Flip Dashboard (Hustle OS)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: Medium
* **Assigned To**: None
* **Labels**: `feature`, `hustle-os`, `accounting`, `dashboard`

---

## 📖 Description
Flipping is an accounting and margin game. Flippers need to track their initial purchase prices, parts expenses, labor hours, and final sale prices to understand their true net margins, return on investment (ROI), and hourly labor yield.

This issue implements a centralized `/ledger` dashboard route where users can review active versus completed transactions, log miscellaneous expenses (such as gasoline, shipping, or fees), and visualize overall financial performance.

---

## 🛠️ Technical Scope

### 1. Ledger Schema Definitions
Update [lib/tracker-types.ts](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/lib/tracker-types.ts) to define the `FlipTransaction` interface:

```typescript
export interface FlipTransaction {
  id: string;
  bikeId: string;
  title: string;
  purchasePrice: number;
  partsExpense: Array<{ id: string; partName: string; cost: number }>;
  miscExpense: Array<{ id: string; name: string; cost: number }>;
  laborHours: number;
  hourlyRate: number;
  askingPrice: number;
  finalSalePrice?: number;
  saleDate?: string;
  status: "s sourcing" | "in_progress" | "listed" | "sold";
}
```

### 2. State Integration
Add a transactions list and management actions in `TrackerContext` ([app/tracker/context.tsx](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/app/tracker/context.tsx)):
- Sync transaction data under `vst_ledger` localStorage key.
- Provide helper methods:
  - `addTransaction(tx: Omit<FlipTransaction, 'id'>): void`
  - `updateTransaction(id: string, updates: Partial<FlipTransaction>): void`
  - `deleteTransaction(id: string): void`

### 3. Financial Metrics Calculations
Write clean helper algorithms in a new file `lib/accounting.ts` or directly within the context:
- **Net Profit**: `finalSalePrice - purchasePrice - sum(parts) - sum(misc)`
- **Total Investment**: `purchasePrice + sum(parts) + sum(misc)`
- **ROI Percentage**: `(Net Profit / Total Investment) * 100`
- **Hourly Yield**: `Net Profit / laborHours`

### 4. Create Ledger Page
Build a beautiful, high-contrast modern white dashboard at `app/ledger/page.tsx`:
- Include Phase Navigation tabs at the top pointing to `/analyzer`, `/tracker`, `/extractor`, `/mechanic`, and `/ledger`.
- **Top Financial Grid**: 4 cards showing:
  - **Net Realized Profit** (glowing green ledger style)
  - **Average ROI %** (blue modern style)
  - **Capital Deployed** (grey minimalist card)
  - **Average Hourly Yield** (gold style)
- **Active Flips vs. Sold Flips**: Two clean toggle tabs.
- **Dynamic Ledger Item**: Row expansion showing itemized parts and accessory lists.
- **Add Miscellaneous Expense Form**: Simple inline field to log gas/shipping.

---

## 🎯 Acceptance Criteria
- [ ] Users can navigate to the `/ledger` dashboard route using the primary navigation header.
- [ ] High-contrast cards display real-time computed profit, ROI %, deployed capital, and hourly rate metrics.
- [ ] Users can edit/update sale prices, labor hours, and add custom shipping/gas costs.
- [ ] Calculation engine accurately subtracts parts costs and misc costs from final sale prices to yield ROI.
- [ ] Clean modern responsive layout conforming fully to the premium white design guidelines.

---

## 🧪 Verification Plan

### Automated Checks
- Run `npm run build` to confirm compiler compatibility.

### Manual Walkthrough
1. Go to `/ledger`.
2. Add a test transaction: Bike `Gravel Specialized`, Purchase: `300`, Parts cost: `50`, Labor hours: `5`, Sale Price: `600`.
3. Verify that:
   - Total Investment is €350.
   - Net Profit is €250.
   - ROI % displays ~71.4%.
   - Hourly Yield displays €50/hr.
4. Add a miscellaneous shipping expense of €20 and ensure the profit automatically updates to €230.
