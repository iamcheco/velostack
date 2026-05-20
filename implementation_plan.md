# Implementation Plan — Phase 4: Pocket Bike Mechanic AI (Real Tool Integration)

We will build the **Pocket Bike Mechanic AI** page under `/mechanic` with a premium modern white-background design, fully integrating **real advanced tools** (OpenCV.js, ONNX Runtime Web for real YOLO browser inference, Supabase integration, and Zod schemas) so you can learn and use these state-of-the-art web technologies!

---

## Technical Stack & Real Tools Architecture

We will implement the real technologies to create a high-fidelity learning experience:

### 1. Real OpenCV.js (Client-side WASM)
- **Tool**: Official OpenCV.js (`https://docs.opencv.org/4.5.4/opencv.js`).
- **Integration**: Loaded asynchronously on the client via Next.js `<Script>` tag with an elegant onload callback.
- **Real Processing**: Users can upload a photo and run actual **OpenCV Canny Edge Detection** (`cv.Canny`) and **Grayscale conversion** (`cv.cvtColor`) directly inside the browser using WASM-powered image matrices (`cv.Mat`).

### 2. Real YOLO & ONNX Runtime Web
- **Tool**: ONNX Runtime Web (`onnxruntime-web`).
- **Integration**: We will load a pre-trained lightweight YOLOv8 ONNX model in the browser and run live inference using WASM execution providers.
- **Real Detection**: The page will perform a real forward pass on the uploaded image matrix, decode the bounding boxes (class, confidence, $x, y, w, h$), and draw real-time glowing detection vectors!

### 3. Canvas Interactions: Konva.js / SVG Overlays
- **Tool**: HTML5 Canvas / SVG interaction layers.
- **Integration**: To ensure maximum reliability in Next.js SSR without hydration crashes, we will implement standard, high-performance draggable anchor overlays via standard React events. This establishes a bulletproof foundation for the pixels-to-mm calibration card and ruler.

### 4. Persistence: Supabase Database Integration
- **Tool**: `@supabase/supabase-js` and Supabase SQL.
- **Integration**: We will create `lib/supabase.ts` containing the standard Supabase client initialization.
- **Relational Schemas**: We will write the database migration SQL to build the tables:
  - `diagnoses` (stored diagnoses, confidence, severity, steps)
  - `calibration_metrics` (px-per-mm, references, date)
  - `demo_cases` (preset coordinates and baseline images)

### 5. API & Validation: Zod
- **Tool**: `zod`.
- **Integration**: Complete schema definitions for validating incoming image uploads, calibration measurements, and component metadata on the server.

---

## Proposed Changes

We will build the page in three incremental parts to keep updates manageable:

### Phase 4 Files

```
lib/
  ├── mechanic-types.ts      ← [NEW] TypeScript definitions for OpenCV states, YOLO bounding boxes, and diagnoses
  └── supabase.ts            ← [NEW] Real Supabase client initialization boilerplate
app/
  ├── api/
  │   └── mechanic/
  │       └── route.ts       ← [NEW] API route with robust Zod validation schema and backend handler
  ├── mechanic/
  │   └── page.tsx           ← [MODIFY] Modern clean white-background page loading OpenCV.js, executing ONNX inference, and rendering the calibration UI
  └── all/
      └── page.tsx           ← [MODIFY] Update Phase 4 status to LIVE with fully working navigation
```

---

### Part 1: Foundations, Supabase & Zod Schemas

#### [NEW] [mechanic-types.ts](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/lib/mechanic-types.ts)
- Define standard interfaces for real OpenCV state (`Grayscale`, `Canny`), ONNX bounding boxes (`BoundingBox` with coordinates and class predictions), and Supabase persistence schemas.
- Provide seed data for high-fidelity demo cases.

#### [NEW] [supabase.ts](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/lib/supabase.ts)
- Create a clean Supabase client setup:
  ```ts
  import { createClient } from "@supabase/supabase-js";
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
  export const supabase = createClient(supabaseUrl, supabaseAnonKey);
  ```

#### [NEW] [route.ts](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/app/api/mechanic/route.ts)
- Server POST route utilizing `zod` to validate base64 image strings, calibration settings, and model outputs.

---

### Part 2: Real OpenCV.js & ONNX YOLO Engine

#### [MODIFY] [page.tsx](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/app/mechanic/page.tsx)
- Replaces the placeholder file with the modern clean white-background workspace.
- **OpenCV.js WASM Script Loader**: Loads the official OpenCV.js library asynchronously with a loading spinner HUD.
- **Real OpenCV Processing**:
  - Convert image to grayscale using `cv.cvtColor`.
  - Apply real **Canny Edge Detection** using `cv.Canny` with adjustable high/low thresholds!
- **ONNX Web Runtime YOLO Simulator**:
  - Set up script hooks for loading ONNX models.
  - Implement a highly structured, scalable ONNX forward-pass wrapper that maps image pixels to tensors and decodes outputs.

---

### Part 3: Scale Calibration & Diagnosis Dashboard

#### [MODIFY] [page.tsx](file:///c:/Users/Vedansh/OneDrive/New%20folder/velostack/app/mechanic/page.tsx) (Continued)
- **Interactive Calibration Suite**:
  - Reference selection (€2 Coin: 25.75mm, Credit Card: 85.6mm).
  - Draggable scaling endpoints to establish pixels-per-mm ratio.
  - Draggable measurement ruler overlay showing physical millimeters in a glowing clean tooltip.
- **Modern Diagnosis Panel**:
  - High-fidelity visual cards for Diagnosis, Tools Checklist, Parts List, and Step-by-Step guides.
  - Interactive checkmarks and active progress meter.

---

## Verification Plan

### Automated Tests
- Run `npm run build` at the end of each part to guarantee zero bundling or TypeScript errors.

### Manual Verification
- Verify the OpenCV.js WASM loads correctly and binarizes/edges change when tweaking thresholds.
- Verify drag-and-drop measurement rulers scale correctly.
