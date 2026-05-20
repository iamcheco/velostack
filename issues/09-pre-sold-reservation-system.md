# Issue #9: "Pre-Sold" Flip & Buyer Customization Interface (Blue Ocean)

## 📋 Status
* **Status**: 🔲 Backlog
* **Priority**: Low
* **Assigned To**: None
* **Labels**: `feature`, `blue-ocean`, `frontend`, `public-portal`

---

## 📖 Description
Flippers face inventory holding costs and the risk of a completed bike sitting on the market. To de-risk the build process, they can publish a "Coming Soon" catalog of active workshop builds. Local buyers can review upcoming bikes, request tailored custom parts swaps (such as changing standard tires to tan-wall gravel tires, or mounting a specific saddle) and secure reservations before final assembly.

This issue implements the public-facing customizable landing page generator. The buyer selects desired upgrade options, the system recalculates the sales price, and the flipper sees the real-time profit impact on their dashboard.

---

## 🛠️ Technical Scope

### 1. Build Public Reservation API
Create a new Next.js route at `app/api/pre-sold/route.ts`:
- **POST**: Create or update reservation details (contact details, selected upgrade swaps, agreement timestamps).
- Validate incoming data using robust `zod` schemas.
- Persist reservation logs linked to `FlipTransaction` in Supabase.

### 2. Create Public Customization Portal
Build a responsive, highly polished public single-page application route at `app/public-listing/[id]/page.tsx`:
- Render a premium white-themed storefront.
- **Progress Tracking Bar**: Inform the buyer of the build status (e.g. *Frame Polished* ➔ *New Drivetrain Installed* ➔ *Awaiting Tuning*).
- **Custom upgrade selections** (interactive checkboxes):
  - *Tan-Wall Gravel Tires*: `+€35`
  - *Ergonomic Brooks Saddle*: `+€60`
  - *Premium Carbon Bottle Cages*: `+€15`
  - *Dual-sided SPD Pedals*: `+€20`
- **Dynamic Price Ticket**: Displays the adjusted purchase price in real time as checkboxes are selected.
- **Reservation Form**: Simple, clean fields for Name, Email, and Phone, with a call to action: "Reserve Bike & Request Build Upgrades".

### 3. Flipper Control Dashboard Integration
Update `app/tracker/page.tsx` or `/ledger`:
- Render a "Publish Public Reservation Page" button on active bikes.
- Render a notification indicator if a buyer submits a reservation request (e.g., *"Reservation Alert: John Doe reserved this Trek Domane and requested Tan-Wall Tires (+€35)!"*).

---

## 🎯 Acceptance Criteria
- [ ] Flippers can easily generate a public-facing URL `/public-listing/[id]` from their dashboard.
- [ ] The public portal allows prospective buyers to view active progress, estimated completion dates, and check upgrade option items.
- [ ] Dynamic pricing counter accurately adds upgrade costs instantly.
- [ ] Reservation details persist correctly in the database.
- [ ] Flipper receives clear alerts and real-time profit margin updates when upgrades are booked.

---

## 🧪 Verification Plan

### Automated Checks
- Verify `npm run build` exits with code 0.
- Verify TypeScript bindings for the reservation parameters are complete.

### Manual Walkthrough
1. Select an active bike in `/tracker` and click "Publish Public Reservation Page".
2. Open the generated public URL `/public-listing/[id]` in an incognito window.
3. Select "Tan-Wall Gravel Tires (+€35)" and verify the price ticket increments from the base asking price.
4. Submit reservation under name: `Alice Smith`.
5. Go back to `/ledger` or `/tracker` and confirm that Alice's reservation appears, and the bike's estimated profit adjusts to reflect the upgrades.
