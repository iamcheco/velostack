# Issue #7: The "Franken-Bike" Compatibility Matchmaker (Blue Ocean)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: High
* **Assigned To**: None
* **Labels**: `feature`, `blue-ocean`, `compatibility`, `canvas`, `drag-and-drop`

---

## 📖 Description
The single most frustrating bottleneck when building custom bikes from parts is standard compatibility. Bottom bracket widths, thread styles, pull ratios, and axle spacings are notoriously complex and fragmented across Shimano, SRAM, and Campagnolo.

This issue implements an interactive **"Franken-Bike" Matchmaker** tool. It lets users drag spare parts from their "Parts Bin" and drop them onto an active frame canvas, automatically validating mechanical and dimensional compatibility before they pick up a wrench.

---

## 🛠️ Technical Scope

### 1. Build Mechanical Compatibility Matrix
Create a rules validator database in `lib/compatibility-engine.ts`:
- Define matching rules for key components:
  - **Drivetrain Speeds**: Shifters, derailleur, chain, and cassette speeds must match (e.g. 11-speed shifter requires 11-speed cassette).
  - **Shifter Pull-Ratios**: SRAM exact-actuation shifters cannot pair with Shimano Shadow derailleurs.
  - **Bottom Bracket Standards**: Match frame BB shells (e.g., BSA threaded, BB30, PF30) to crank spindle widths (24mm Shimano, 30mm BB30, DUB).
  - **Brake Mounts**: Frame/Fork mount type (Flat Mount, Post Mount, IS Mount) vs Brake Caliper type.
  - **Wheel Hub Axle spacing**: Quick Release (100/135mm) vs Thru-Axle (12x100mm, 12x142mm).

### 2. Build Drag-and-Drop Matching Interface
Create a beautiful visual component at `app/tracker/components/BuildMatchmaker.tsx`:
- Render a schematic of a bike skeleton frame on a white high-contrast workspace.
- **Parts Drawer**: A scrollable side bar showing all available components in the "Parts Bin".
- **Draggable Anchors**: Allow dragging parts and dropping them onto specific slots on the frame (e.g. Bottom Bracket slot, Wheel slots, Cockpit slot).
- **Connector Indicators**:
  - Green indicator lines if the parts are fully compatible.
  - Orange indicator lines if a specific adapter is required (e.g., flat mount to post mount adapter, or BSA to 24mm BB).
  - Red indicator lines with detailed warning popups detailing hard incompatibilities (e.g., *"Cannot fit a PressFit BB30 crank into a BSA threaded frame"*).

---

## 🎯 Acceptance Criteria
- [ ] Users can toggle the "Matchmaker Mode" inside `/tracker`.
- [ ] The matching engine correctly parses specifications of parts in the Parts Bin against the selected frame.
- [ ] Drag-and-dropping compatible parts updates the build completion percentage.
- [ ] Displays explicit, detailed error warnings detailing why components are incompatible (e.g., speeds count mismatch).
- [ ] Offers alternative purchase links or adapter recommendations for orange/red states.

---

## 🧪 Verification Plan

### Automated Checks
- Write unit tests verifying compatibility functions trigger true/false accurately.
- Run `npm run build` to confirm compilation.

### Manual Walkthrough
1. Go to `/tracker`, open "Build Matchmaker".
2. Select a frame defined with a `BSA Threaded` bottom bracket.
3. Drag a `SRAM DUB BSA Bottom Bracket` and `SRAM DUB Crankset` onto the frame. Verify a green link forms.
4. Drag a `PressFit BB30 Crankset` onto the frame. Verify a red warning appears: *"BSA frames cannot accept native 30mm PressFit spindles without specialized adapters."*
