# Issue #2: 1-Click AI Auto-Listing Description Generator (Hustle OS)

## 📋 Status
* **Status**: ✅ Completed
* **Priority**: Medium
* **Assigned To**: VeloStack AI
* **Labels**: `feature`, `hustle-os`, `api`, `llm`

---

## 📖 Description
Once a bike's upgrades, tuning, and repairs are completed, the flipper wants to list it for sale as fast as possible on classified platforms (Facebook Marketplace, Craigslist, eBay Kleinanzeigen). Writing clean, value-packed listings is tedious.

This issue implements an **AI Auto-Listing Generator** that aggregates the bike's specs, replaced components, and tuned health points, and calls a server-side Gemini/Groq completion endpoint to write high-converting, optimized copy.

---

## 🛠️ Technical Scope

### 1. Build Server-Side Completion API
Create a new Next.js route at `app/api/listing-generator/route.ts`:
- Follow the exact API error handling and LLM patterns from `AGENTS.md`.
- Extract post parameters:
  ```typescript
  interface ListingGeneratorRequest {
    bikeName: string;
    brandModel: string;
    color: string;
    frameSize: string;
    speedsCount: number;
    purchasePrice: number;
    targetPrice: number;
    upgrades: Array<{ partName: string; cost: number }>;
    wearCondition: string;
    tone: "professional" | "enthusiast" | "minimalist" | "deal-hunter";
  }
  ```
- Structure the system prompt for Gemini/Groq to output a neat description block:
  - **Catchy Headline**: Engaging title optimized for marketplace search (e.g. *Stunning Trek Domane Carbon Gravel Bike - Size M*).
  - **Core Bike Specs**: Clean structured summary.
  - **Fresh Maintenance / Upgrades List**: Emphasize what is new/upgraded (this justifies a premium price!).
  - **Condition Verdict**: Honest mechanic's review.
  - **Call to Action**: Highlighting location and collection policy.
- Prevent LLM markdown clutter; output clean, ready-to-paste text blocks.

### 2. Build Interactive Modal Interface
Create `app/tracker/components/ListingGeneratorModal.tsx`:
- Render a premium white-themed overlay dialog.
- Include selectors for **Tone Type** (e.g., "Professional Enthusiast", "Quick Budget Sell").
- Displays the generated listing in a dynamic, editable text area.
- Add a highly accessible **"Copy to Clipboard"** button with a 2-second checkmark success state.

### 3. Integrate into Tracker Page
Update `app/tracker/page.tsx` or the sidebar:
- Add a "✨ Generate Sale Listing" button next to "Sold/Archived" options for active bikes.

---

## 🎯 Acceptance Criteria
- [x] Clicking "Generate Sale Listing" launches the customizable description modal.
- [x] API successfully collects active bike details (upgraded parts, specs) and prompts the LLM correctly.
- [x] The generated copy highlights the upgraded elements (e.g. "Brand new Continental tires installed!").
- [x] The 1-click clipboard Copy button operates flawlessly with instant UI success badges.
- [x] The generated copy contains zero markdown hashtags or blockquotes (ready for marketplace pasting).

---

## 🧪 Verification Plan

### Automated Checks
- Validate typescript parameters inside the route.
- Run `npm run build` to confirm compiler compatibility.

### Manual Walkthrough
1. Select a bike in `/tracker` that has recorded parts upgrades (e.g., new tires, new chain).
2. Click the "Generate Sale Listing" button.
3. Select "Professional Enthusiast" tone and click "Generate".
4. Confirm the text box is populated with high-quality classified copy.
5. Click "Copy to Clipboard", paste it into a notepad, and verify correct formatting.
