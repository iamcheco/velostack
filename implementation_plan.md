# Implementation Plan — Issue #3: Profit & Loss (P&L) Ledger & Flip Dashboard (Hustle OS)

We will build the **Profit & Loss (P&L) Ledger & Flip Dashboard** under `/ledger` with a premium modern white-background design, fully integrating transactional schemas, live aggregators, itemized part lists, and custom expense modules, and updating global navigation interfaces.

---

## 🛠️ Technical Stack & Real Tools Architecture

We will implement the following:

### 1. Ledger Schema Definitions (`lib/tracker-types.ts`)
- **Integration**: Define the `FlipTransaction` interface and extend `TrackerStore` or keep ledger states synchronized.
- **Model**:
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
    status: "sourcing" | "in_progress" | "listed" | "sold";
  }
  ```

### 2. State Integration & Actions (`app/tracker/context.tsx`)
- **Integration**: Extend `TrackerContext` to store and manage transactions.
- **Persistence**: Load and sync data under the `vst_ledger` localStorage key.
- **Actions**:
  - `addTransaction(tx: Omit<FlipTransaction, 'id'>): void`
  - `updateTransaction(id: string, updates: Partial<FlipTransaction>): void`
  - `deleteTransaction(id: string): void`

### 3. Financial Metrics & Aggregators
- **Net Realized Profit**: `sum(finalSalePrice - purchasePrice - sum(partsExpense) - sum(miscExpense))` (only for sold items).
- **Capital Deployed**: `sum(purchasePrice + sum(partsExpense) + sum(miscExpense))` (across all active flips, or all transactions to show total deploy).
- **Average ROI %**: `(Net Realized Profit / Total Investment on Sold Flips) * 100` across all sold transactions.
- **Average Hourly Yield**: Average of `Net Profit / laborHours` for all sold transactions.
- **Visual Ledger Bars**: Build clean, modern CSS horizontal progress bars comparing **Total Capital Invested** vs. **Realized Returns (Revenue)**.

### 4. Premium White P&L Dashboard (`app/ledger/page.tsx`)
- **Design System**: A sleek modern dashboard utilizing the `#ffffff` base, `#f8fafc` background, slate typography, elegant `1px` borders, soft shadows, and Plus Jakarta Sans.
- **Top Financial Grid**: 4 custom-styled stat cards:
  - **Net Realized Profit** (glowing emerald ledger style)
  - **Average ROI %** (indigo style)
  - **Capital Deployed** (grey minimalist card)
  - **Average Hourly Yield** (amber/gold style)
- **Active Flips vs. Sold Flips Toggles**: Smooth tab filters to separate builds in progress from realized sales.
- **Dynamic Expanding Rows**: Expand transaction rows to show itemized parts and accessory expenses, add shipping/gas fees, and log labor hours.
- **Add Miscellaneous Expense Form**: Simple inline field to log shipping, gas, and fees.
- **New Transaction Modal**: Clean slide-over overlay to log purchase price, select an active parts tracker bike (pre-populating its parts and estimated costs!), and set status.

---

## 📂 Proposed Changes

We will implement these changes across the following files:

```
lib/
  └── tracker-types.ts       ← [MODIFY] Add FlipTransaction schema definition
app/
  ├── ledger/
  │   └── page.tsx           ← [NEW] Beautiful, high-contrast P&L ledger dashboard
  ├── tracker/
  │   ├── context.tsx        ← [MODIFY] Add ledger state, actions, and vst_ledger sync
  │   └── page.tsx           ← [MODIFY] Update navigation header to include ledger
  ├── extractor/
  │   └── page.tsx           ← [MODIFY] Update navigation header to include ledger
  ├── mechanic/
  │   └── page.tsx           ← [MODIFY] Update navigation header to include ledger
  ├── analyzer/
  │   └── page.tsx           ← [MODIFY] Update navigation header to include ledger
  └── all/
      └── page.tsx           ← [MODIFY] Add Ledger Dashboard to Phase Directory
```

---

## ✍️ Code Implementations & Prompts

### Part 1: Schema Updates & Context Extension
- We will update `lib/tracker-types.ts` to add the `FlipTransaction` interface.
- We will update `app/tracker/context.tsx` to include `transactions`, `addTransaction`, `updateTransaction`, and `deleteTransaction`.
- Integrate smart pre-population: when adding a transaction, the user can select an existing bike, pulling its active wear component models and replacement costs directly as parts expenses.

### Part 2: Global Navigation Updates
- We will update all page headers (`app/tracker/page.tsx`, `app/extractor/page.tsx`, `app/mechanic/page.tsx`, `app/analyzer/page.tsx`, `app/all/page.tsx`) to add a sleek, modern navigation tab pointing to `/ledger`.
- In `/all/page.tsx`, we will add **Phase 5: P&L Ledger & Flip Dashboard** as a high-fidelity item.

### Part 3: The P&L Ledger Dashboard Page (`app/ledger/page.tsx`)
- Implement a stunning responsive page wrapped in the `TrackerProvider` context.
- Include the standard modern navigation header at the top.
- Render the 4-card metric grid.
- Build the "➕ Log New Transaction" modal allowing users to create custom transactions or select registered tracker bikes.
- Design the CSS Ledger Bar comparing Deployed Capital vs. Returns.
- Build the Active vs. Sold toggling table with expanding detail views, on-the-fly labor hour sliders, and dynamic parts/misc expense adding.

---

## 🧪 Verification Plan

### Automated Tests
- Validate TypeScript compilation of new context actions and components.
- Run `npm run build` to confirm compiler compatibility.

### Manual Verification
1. Navigate to `/ledger`.
2. Add a test transaction: Bike `Specialized Diverge`, Purchase: `€300`, Parts cost: `€50` (pre-populated or custom), Labor: `5 hrs`, Asking: `€700`.
3. Verify calculations:
   - Total Investment is €350.
   - Project Net Profit is €350.
4. Mark the transaction as **Sold** at `€600`.
5. Verify:
   - Net Realized Profit updates to **€250**.
   - Average ROI % displays **71.4%**.
   - Average Hourly Yield displays **€50/hr**.
6. Add a custom gas fee of `€20` in the miscellaneous list and ensure the Net Profit automatically decreases to `€230` and ROI to `65.7%`.
