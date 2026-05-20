# Issue #1: "The Parts Bin" Drivetrain & Component Inventory (Hustle OS)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: High
* **Assigned To**: None
* **Labels**: `feature`, `hustle-os`, `frontend`, `state`

---

## 📖 Description
Bike flippers routinely dismantle bikes, take off usable parts (saddles, cassettes, tires, chains), and store them in their garage. When fixing a new bike project that is missing a component, they should be able to leverage their existing inventory instead of spending cash on retail parts.

This issue implements "The Parts Bin" inventory system where users can store, search, and manage spare components, and integrates an automated **compatibility matching alert** inside the wear-tracker view to suggest spare parts for replacement.

---

## 🛠️ Technical Scope

### 1. Define Inventory Data Models
Update [lib/tracker-types.ts](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/lib/tracker-types.ts) to define the `PartsBinItem` schema:

```typescript
export interface PartsBinItem {
  id: string;
  componentType: "chain" | "cassette" | "saddle" | "tire" | "brake_pads" | "grip" | "cables";
  brandModel: string;
  condition: "new" | "excellent" | "fair" | "worn";
  compatSpeeds?: number; // e.g. 10, 11 for drivetrains
  estimatedValueEur: number;
  dateAdded: string;
}
```

### 2. State & Persistence Context Integration
Modify the `TrackerContext` inside [app/tracker/context.tsx](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/app/tracker/context.tsx):
- Add `partsBin: PartsBinItem[]` to the state.
- Expose functions:
  - `addPartsBinItem(item: Omit<PartsBinItem, 'id' | 'dateAdded'>): void`
  - `removePartsBinItem(id: string): void`
- Persist the parts bin under the localStorage key `vst_parts_bin`.

### 3. Build UI View: PartsBinTab
Create a premium, minimalist React component at `app/tracker/components/PartsBinTab.tsx`:
- Render a modern white layout conforming to the design rules.
- **Add Part Form**: Clean modal/form taking name, component type, condition, speeds, and estimated value.
- **Inventory Grid**: Responsive CSS grid showing cards for each part, with custom badges for condition levels (e.g. green for "New", blue for "Excellent").
- **Search & Filters**: Filter by component type, condition, and search query.
- **Actions**: Delete/remove buttons.

### 4. Smart Wear Matching Integration
Update the parts wear list inside `app/tracker/components/WearReportTab.tsx`:
- When a component's wear level suggests replacement, automatically search the `partsBin` for compatible items (matching the same `componentType` and matching speeds if it's a chain/cassette).
- Render a highly visible recommendation banner:
  > 💡 **Parts Bin Match Available**: You have an *excellent condition [Brand/Model]* in your parts bin. Swap this in to save **€[Value]**!

---

## 🎯 Acceptance Criteria
- [ ] Users can successfully add spare parts to their parts bin.
- [ ] The parts bin state persists reliably in `localStorage`.
- [ ] Inventory grid lets users search and filter spare parts instantly.
- [ ] Active wear recommendations suggest using parts from the bin when a matching type is available.
- [ ] A clean prompt asks: *"Did you use a new part or a part from your Parts Bin?"* when a user clicks "Mark Replaced".

---

## 🧪 Verification Plan

### Automated Checks
- Run `npm run build` to verify zero TypeScript errors in schemas, context, and components.

### Manual Walkthrough
1. Navigate to `/tracker` and select the "Parts Bin" tab.
2. Add a new part: `Shimano 105 11-Speed Cassette`, condition: `excellent`, value: `45`.
3. Verify it appears in the inventory grid.
4. Select an active bike, navigate to its wear report, and ensure a wear-warning part (e.g. cassette) recommends the spare cassette from the Parts Bin.
