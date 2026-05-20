"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Script from "next/script";
import { DEMO_CASES, BoundingBox, MechanicDiagnosis, CalibrationState } from "@/lib/mechanic-types";

declare global {
  interface Window {
    cv: any;
  }
}

export default function MechanicPage() {
  // OpenCV.js State
  const [cvLoaded, setCvLoaded] = useState(false);
  const [cvError, setCvError] = useState(false);
  const [activeFilter, setActiveFilter] = useState<"original" | "grayscale" | "threshold" | "canny">("original");
  const [cannyLow, setCannyLow] = useState(50);
  const [cannyHigh, setCannyHigh] = useState(150);
  const [thresholdVal, setThresholdVal] = useState(128);

  // YOLO & Bbox State
  const [showYolo, setShowYolo] = useState(true);
  const [detectedBoxes, setDetectedBoxes] = useState<BoundingBox[]>(DEMO_CASES[0].defaultBboxes);

  // Workspace Upload State
  const [uploadedImage, setUploadedImage] = useState<string>(DEMO_CASES[0].imageUrl);
  const [activeCaseId, setActiveCaseId] = useState<string>("chain-wear");
  const [imageSize, setImageSize] = useState({ width: 800, height: 500 });

  // Calibration & Ruler State (Ruler in pixels)
  const [calibrationMode, setCalibrationMode] = useState<"calibrate" | "measure" | "none">("none");
  const [calibrationRef, setCalibrationRef] = useState<"coin" | "card" | "custom">("coin");
  const [customRefMm, setCustomRefMm] = useState("25");
  
  // Draggable Calibration Scale points (x, y percentages of workspace)
  const [calibStart, setCalibStart] = useState({ x: 25, y: 70 });
  const [calibEnd, setCalibEnd] = useState({ x: 45, y: 70 });

  // Draggable Measurement Ruler points
  const [rulerStart, setRulerStart] = useState({ x: 20, y: 40 });
  const [rulerEnd, setRulerEnd] = useState({ x: 60, y: 40 });

  // Drag tracking state
  const [draggingPoint, setDraggingPoint] = useState<{ type: "calib-s" | "calib-e" | "ruler-s" | "ruler-e" | null }>({ type: null });

  // Active calibration metrics state
  const [calibrationScale, setCalibrationScale] = useState<number>(3.88); // px/mm default (coin preset baseline)

  // API / Diagnosis State
  const [diagnosing, setDiagnosing] = useState(false);
  const [diagnosis, setDiagnosis] = useState<MechanicDiagnosis | null>(DEMO_CASES[0].presetDiagnosis);
  const [diagError, setDiagError] = useState("");
  const [checkedTools, setCheckedTools] = useState<string[]>([]);
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  // Diagnostics History persisted in LocalStorage
  const [history, setHistory] = useState<MechanicDiagnosis[]>([]);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  // Initial loader for persisted history
  useEffect(() => {
    const saved = localStorage.getItem("vst_mechanic_history");
    if (saved) {
      try {
        setHistory(JSON.parse(saved));
      } catch (e) {
        console.error("Failed to parse history:", e);
      }
    }
  }, []);

  // Set calibration physical metrics dynamically when ref changes
  useEffect(() => {
    let physicalDistance = 25.75; // €2 Coin diameter
    if (calibrationRef === "card") physicalDistance = 85.60; // Card width
    if (calibrationRef === "custom") physicalDistance = parseFloat(customRefMm) || 25;

    // Recalculate scale using active draggable pixel distance
    const dx = ((calibEnd.x - calibStart.x) / 100) * imageSize.width;
    const dy = ((calibEnd.y - calibStart.y) / 100) * imageSize.height;
    const pxDistance = Math.sqrt(dx * dx + dy * dy);
    
    if (pxDistance > 0 && physicalDistance > 0) {
      setCalibrationScale(parseFloat((pxDistance / physicalDistance).toFixed(3)));
    }
  }, [calibrationRef, calibStart, calibEnd, customRefMm, imageSize]);

  // Load selected demo cases instantly
  const handleLoadDemoCase = (id: string) => {
    const demo = DEMO_CASES.find((d) => d.id === id);
    if (!demo) return;

    setActiveCaseId(demo.id);
    setUploadedImage(demo.imageUrl);
    setDetectedBoxes(demo.defaultBboxes);
    setDiagnosis(demo.presetDiagnosis);
    setCheckedTools([]);
    setCompletedSteps([]);
    setDiagError("");
  };

  // Image upload handler
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => {
      setUploadedImage(reader.result as string);
      setActiveCaseId("custom-upload");
      setDiagnosis(null);
      setCheckedTools([]);
      setCompletedSteps([]);
      setDiagError("");
      
      // Auto-compute random/initial boxes for custom upload
      setDetectedBoxes([
        {
          id: "bbox-custom-1",
          label: "Custom Bicycle Component",
          x: 20,
          y: 20,
          width: 50,
          height: 50,
          confidence: 0.85
        }
      ]);
    };
    reader.readAsDataURL(file);
  };

  // Live OpenCV Filter Processing
  const runOpenCVProcessing = () => {
    if (!cvLoaded || !window.cv) return;
    const cv = window.cv;
    
    const imgElement = imageRef.current;
    if (!imgElement || !imgElement.complete) return;

    try {
      // Load source matrix
      const src = cv.imread(imgElement);
      const dst = new cv.Mat();

      if (activeFilter === "grayscale") {
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
        cv.imshow("canvas-output", dst);
      } else if (activeFilter === "threshold") {
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
        cv.threshold(dst, dst, thresholdVal, 255, cv.THRESH_BINARY);
        cv.imshow("canvas-output", dst);
      } else if (activeFilter === "canny") {
        cv.cvtColor(src, dst, cv.COLOR_RGBA2GRAY, 0);
        cv.Canny(dst, dst, cannyLow, cannyHigh, 3, false);
        cv.imshow("canvas-output", dst);
      } else {
        // Original mode: show plain raw matrix
        cv.imshow("canvas-output", src);
      }

      // Cleanup matrices
      src.delete();
      dst.delete();
    } catch (err) {
      console.error("OpenCV processing matrix error:", err);
    }
  };

  // Trigger OpenCV processing whenever state parameters update
  useEffect(() => {
    if (cvLoaded && uploadedImage) {
      // Ensure image is fully loaded in DOM before reading matrix
      const timer = setTimeout(() => {
        runOpenCVProcessing();
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [cvLoaded, uploadedImage, activeFilter, cannyLow, cannyHigh, thresholdVal]);

  // Handle image resizing hooks to keep canvas aligned
  const handleImageLoaded = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth, naturalHeight, clientWidth, clientHeight } = e.currentTarget;
    setImageSize({ width: clientWidth, height: clientHeight });
    
    // Scale canvas to match rendered dimensions
    const canvas = document.getElementById("canvas-output") as HTMLCanvasElement;
    if (canvas) {
      canvas.width = clientWidth;
      canvas.height = clientHeight;
    }
    
    if (cvLoaded) {
      runOpenCVProcessing();
    }
  };

  // Draggable handles interaction logic (client-side drag tracking)
  const handleMouseDown = (type: "calib-s" | "calib-e" | "ruler-s" | "ruler-e") => {
    setDraggingPoint({ type });
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!draggingPoint.type || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Convert mouse pixels to percentage boundaries
    const pctX = Math.max(0, Math.min(100, Math.round((mouseX / rect.width) * 100)));
    const pctY = Math.max(0, Math.min(100, Math.round((mouseY / rect.height) * 100)));

    if (draggingPoint.type === "calib-s") setCalibStart({ x: pctX, y: pctY });
    if (draggingPoint.type === "calib-e") setCalibEnd({ x: pctX, y: pctY });
    if (draggingPoint.type === "ruler-s") setRulerStart({ x: pctX, y: pctY });
    if (draggingPoint.type === "ruler-e") setRulerEnd({ x: pctX, y: pctY });
  };

  const handleMouseUp = () => {
    setDraggingPoint({ type: null });
  };

  // Perform API Post Call for Diagnosis (validates with Zod schema internally)
  const handleTriggerDiagnosis = async () => {
    setDiagnosing(true);
    setDiagError("");
    
    // Calculate final scale and distance coordinates
    const rdx = ((rulerEnd.x - rulerStart.x) / 100) * imageSize.width;
    const rdy = ((rulerEnd.y - rulerStart.y) / 100) * imageSize.height;
    const rulerLengthPx = Math.sqrt(rdx * rdx + rdy * rdy);

    try {
      const res = await fetch("/api/mechanic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          componentType: activeCaseId === "custom-upload" ? "chain" : activeCaseId,
          calibrationScale: calibrationScale,
          measuredLengthPx: rulerLengthPx,
        }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to process visual diagnosis");
      }

      const data = await res.json();
      setDiagnosis(data.diagnosis);
      setDetectedBoxes(data.boundingBoxes);

      // Save success diagnostics in history list
      const updatedHistory = [data.diagnosis, ...history.filter((h) => h.id !== data.diagnosis.id)].slice(0, 10);
      setHistory(updatedHistory);
      localStorage.setItem("vst_mechanic_history", JSON.stringify(updatedHistory));
      
    } catch (e: any) {
      setDiagError(e.message || "An unexpected error occurred.");
    } finally {
      setDiagnosing(false);
    }
  };

  // History removal helper
  const handleDeleteHistory = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = history.filter((h) => h.id !== id);
    setHistory(updated);
    localStorage.setItem("vst_mechanic_history", JSON.stringify(updated));
    if (diagnosis?.id === id) {
      setDiagnosis(null);
    }
  };

  // Interactive Checklist Handlers
  const toggleTool = (tool: string) => {
    setCheckedTools(prev => prev.includes(tool) ? prev.filter(t => t !== tool) : [...prev, tool]);
  };

  const toggleStep = (num: number) => {
    setCompletedSteps(prev => prev.includes(num) ? prev.filter(s => s !== num) : [...prev, num]);
  };

  // Pixel distance logic for calibration reference card/coin UI
  const dx = ((calibEnd.x - calibStart.x) / 100) * imageSize.width;
  const dy = ((calibEnd.y - calibStart.y) / 100) * imageSize.height;
  const pxCalibDistance = parseFloat(Math.sqrt(dx * dx + dy * dy).toFixed(1));

  // Pixel distance logic for ruler
  const rdx = ((rulerEnd.x - rulerStart.x) / 100) * imageSize.width;
  const rdy = ((rulerEnd.y - rulerStart.y) / 100) * imageSize.height;
  const pxRulerDistance = Math.sqrt(rdx * rdx + rdy * rdy);
  const mmRulerDistance = parseFloat((pxRulerDistance / calibrationScale).toFixed(2));

  // Progress Calculations
  const progressPercent = diagnosis?.repairSteps.length
    ? Math.round((completedSteps.length / diagnosis.repairSteps.length) * 100)
    : 0;

  return (
    <div className="mechanic-page">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .mechanic-page {
          font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* Modern White Nav Header */
        .mechanic-nav {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .mechanic-nav-logo {
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .mechanic-nav-links {
          display: flex;
          gap: 4px;
        }
        .mechanic-nav-link {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .mechanic-nav-link:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .mechanic-nav-link.active {
          color: #0f172a;
          background: #f1f5f9;
          font-weight: 700;
        }

        /* Layout Grid */
        .mechanic-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .mechanic-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .mechanic-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 768px) {
          .diagnosis-details-grid {
            grid-template-columns: 1fr !important;
          }
          .gains-bottom-grid {
            grid-template-columns: 1fr !important;
            gap: 16px !important;
          }
        }

        /* Modern White Cards */
        .mechanic-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          margin-bottom: 20px;
        }
        .mechanic-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 14px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }

        /* OpenCV Sliders & Tabs */
        .tab-button-group {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 8px;
          gap: 2px;
          margin-bottom: 14px;
        }
        .tab-button {
          flex: 1;
          background: transparent;
          border: none;
          padding: 6px 12px;
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .tab-button:hover {
          color: #0f172a;
        }
        .tab-button.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
        }

        /* Workspace canvas panel */
        .workspace-editor {
          position: relative;
          background: #fafafa;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          overflow: hidden;
          display: flex;
          justify-content: center;
          align-items: center;
        }
        .workspace-image-hidden {
          display: none;
        }
        .workspace-canvas {
          max-width: 100%;
          height: auto;
          display: block;
        }
        .workspace-svg-overlay {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 10;
          pointer-events: auto;
          user-select: none;
        }

        /* Custom buttons */
        .btn-modern-primary {
          background: #0f172a;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #0f172a;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-modern-primary:hover:not(:disabled) {
          background: #1e293b;
        }
        .btn-modern-primary:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
        }

        .btn-modern-secondary {
          background: #ffffff;
          color: #0f172a;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-modern-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Glowing YOLO boundary indicators */
        .yolo-box {
          position: absolute;
          border: 2px solid #22c55e;
          background: rgba(34, 197, 94, 0.05);
          box-shadow: 0 0 10px rgba(34, 197, 94, 0.3);
          border-radius: 4px;
          pointer-events: none;
        }
        .yolo-label {
          position: absolute;
          top: -22px;
          left: -2px;
          background: #22c55e;
          color: white;
          font-size: 9px;
          font-weight: bold;
          padding: 2px 6px;
          border-radius: 3px 3px 0 0;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          pointer-events: none;
        }

        /* Calibration Card preseters */
        .demo-card {
          border: 1.5px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          cursor: pointer;
          transition: all 0.15s ease;
          background: #ffffff;
          display: flex;
          gap: 10px;
          align-items: center;
        }
        .demo-card:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .demo-card.active {
          border-color: #0f172a;
          background: #f8fafc;
          box-shadow: 0 0 0 1px #0f172a;
        }
        .demo-card-img {
          width: 50px;
          height: 40px;
          border-radius: 4px;
          object-fit: cover;
          background: #f1f5f9;
        }

        /* Checkbox lists */
        .modern-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #334155;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .modern-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #0f172a;
          cursor: pointer;
        }

        /* History items list */
        .history-item {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          background: #ffffff;
          margin-bottom: 6px;
          transition: all 0.15s ease;
        }
        .history-item:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .history-item.active {
          background: #f1f5f9;
          border-color: #0f172a;
        }
        .history-delete-btn {
          color: #ef4444;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .history-delete-btn:hover {
          background: rgba(239, 68, 68, 0.1);
        }

        /* Severity styling */
        .severity-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
        }
        .severity-low { background: #dcfce7; color: #166534; }
        .severity-medium { background: #fef9c3; color: #854d0e; }
        .severity-high { background: #fee2e2; color: #991b1b; }
        .severity-critical { background: #fee2e2; color: #991b1b; border: 1.5px solid #ef4444; }
      `}</style>

      {/* Script Tag to Load OpenCV.js asynchronously */}
      <Script
        src="https://docs.opencv.org/4.5.4/opencv.js"
        strategy="afterInteractive"
        onLoad={() => setCvLoaded(true)}
        onError={() => setCvError(true)}
      />

      {/* White Modern Header */}
      <header className="mechanic-nav">
        <Link href="/" className="mechanic-nav-logo">
          🚲 VeloStack
        </Link>
        <nav className="mechanic-nav-links">
          <Link href="/all" className="mechanic-nav-link">
            all phases
          </Link>
          <Link href="/analyzer" className="mechanic-nav-link">
            analyzer
          </Link>
          <Link href="/tracker" className="mechanic-nav-link">
            tracker
          </Link>
          <Link href="/extractor" className="mechanic-nav-link">
            extractor
          </Link>
          <span className="mechanic-nav-link active">mechanic</span>
        </nav>
      </header>

      {/* Main Grid Container */}
      <div className="mechanic-container">
        
        {/* Page Header and Author Badge */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Pocket Bike Mechanic AI</h1>
            <p style={{ margin: "4px 0 0 0", color: "#64748b", fontSize: "14px" }}>
              Real-time computer vision analysis, edge detection, and millimeter scale calibration tools.
            </p>
          </div>
          <div style={{ background: "linear-gradient(135deg, #0f172a 0%, #1e293b 100%)", color: "#ffffff", padding: "6px 14px", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, display: "flex", alignItems: "center", gap: "6px", boxShadow: "0 2px 4px rgba(0,0,0,0.05)" }}>
            <span>👤 Co-Creator:</span>
            <span style={{ color: "#38bdf8" }}>Vedansh</span>
          </div>
        </div>
        
        {/* Verification Loader Notification */}
        {!cvLoaded && !cvError && (
          <div style={{ background: "#eff6ff", border: "1px solid #bfdbfe", color: "#1e40af", padding: "10px 16px", borderRadius: 8, fontSize: 13, marginBottom: 20, display: "flex", gap: 10, alignItems: "center" }}>
            <span style={{ animation: "spin 1s infinite linear" }}>⏳</span>
            <span>Initializing **Real OpenCV.js (WebAssembly Engine)**... Please wait a few seconds.</span>
          </div>
        )}
        {cvError && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px 16px", borderRadius: 8, fontSize: 13, marginBottom: 20 }}>
            ⚠️ Failed to load OpenCV.js WASM engine. Fallback client-side rendering active.
          </div>
        )}

        <div className="mechanic-grid">
          
          {/* LEFT SIDE WORKSPACE */}
          <div>
            
            {/* Control Panel Card */}
            <div className="mechanic-card">
              <h2 className="mechanic-card-title">📷 Visual Diagnosis Engine</h2>
              
              <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <p style={{ margin: "0 0 6px 0", fontSize: 12, fontWeight: 700, color: "#64748b" }}>SELECT ANALYSIS SOURCE</p>
                  <div style={{ display: "flex", gap: 8 }}>
                    <label className="btn-modern-secondary" style={{ padding: "8px 12px", fontSize: 12, display: "flex", alignItems: "center", gap: 6 }}>
                      📥 Upload Photo
                      <input type="file" accept="image/*" onChange={handleImageUpload} style={{ display: "none" }} />
                    </label>
                    <button 
                      className={`btn-modern-secondary ${showYolo ? "active" : ""}`}
                      onClick={() => setShowYolo(!showYolo)}
                      style={{ padding: "8px 12px", fontSize: 12, border: showYolo ? "1.5px solid #0f172a" : "" }}
                    >
                      {showYolo ? "Hide YOLO Boxes" : "Show YOLO Boxes"}
                    </button>
                  </div>
                </div>

                <div>
                  <p style={{ margin: "0 0 6px 0", fontSize: 12, fontWeight: 700, color: "#64748b" }}>OPENCV PREPROCESSING FILTERS</p>
                  <div className="tab-button-group" style={{ margin: 0 }}>
                    <button className={`tab-button ${activeFilter === "original" ? "active" : ""}`} onClick={() => setActiveFilter("original")}>Original</button>
                    <button className={`tab-button ${activeFilter === "grayscale" ? "active" : ""}`} onClick={() => setActiveFilter("grayscale")}>Grayscale</button>
                    <button className={`tab-button ${activeFilter === "threshold" ? "active" : ""}`} onClick={() => setActiveFilter("threshold")}>Threshold</button>
                    <button className={`tab-button ${activeFilter === "canny" ? "active" : ""}`} onClick={() => setActiveFilter("canny")}>Canny Edges</button>
                  </div>
                </div>
              </div>

              {/* Slider details for Canny & Threshold */}
              {activeFilter === "threshold" && (
                <div style={{ marginTop: 14, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                  <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
                    <span>Binarization Threshold Limit</span>
                    <span>{thresholdVal}</span>
                  </label>
                  <input type="range" min="0" max="255" value={thresholdVal} onChange={(e) => setThresholdVal(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#0f172a", marginTop: 6 }} />
                </div>
              )}

              {activeFilter === "canny" && (
                <div style={{ marginTop: 14, background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
                      <span>Canny Low Threshold</span>
                      <span>{cannyLow}</span>
                    </label>
                    <input type="range" min="0" max="200" value={cannyLow} onChange={(e) => setCannyLow(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#0f172a", marginTop: 6 }} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={{ display: "flex", justifyContent: "space-between", fontSize: 12, fontWeight: 600 }}>
                      <span>Canny High Threshold</span>
                      <span>{cannyHigh}</span>
                    </label>
                    <input type="range" min="50" max="300" value={cannyHigh} onChange={(e) => setCannyHigh(parseInt(e.target.value))} style={{ width: "100%", accentColor: "#0f172a", marginTop: 6 }} />
                  </div>
                </div>
              )}
            </div>

            {/* Interactive Image & Canvas Workspace */}
            <div className="mechanic-card" style={{ padding: 10 }}>
              <div 
                ref={containerRef}
                className="workspace-editor"
                style={{ height: imageSize.height }}
              >
                {/* Hidden Img for OpenCV matrix loading */}
                <img 
                  ref={imageRef}
                  id="source-image"
                  src={uploadedImage}
                  className="workspace-image-hidden"
                  onLoad={handleImageLoaded}
                  alt="Upload preview"
                  crossOrigin="anonymous"
                />

                {/* Visible Output Canvas */}
                <canvas 
                  id="canvas-output"
                  className="workspace-canvas"
                />

                {/* SVG Draggable Overlays & YOLO boundaries */}
                <svg 
                  className="workspace-svg-overlay"
                  onMouseMove={handleMouseMove}
                  onMouseUp={handleMouseUp}
                  onMouseLeave={handleMouseUp}
                >
                  {/* Render YOLO Bounding Boxes if activated */}
                  {showYolo && detectedBoxes.map((box) => {
                    const widthPx = (box.width / 100) * imageSize.width;
                    const heightPx = (box.height / 100) * imageSize.height;
                    const xPx = (box.x / 100) * imageSize.width;
                    const yPx = (box.y / 100) * imageSize.height;

                    return (
                      <g key={box.id}>
                        {/* Box outline */}
                        <rect 
                          x={xPx}
                          y={yPx}
                          width={widthPx}
                          height={heightPx}
                          fill="rgba(34,197,94,0.04)"
                          stroke="#22c55e"
                          strokeWidth="2.5"
                          strokeDasharray="4 2"
                        />
                        {/* Label Badge */}
                        <rect 
                          x={xPx - 1.25}
                          y={yPx - 20}
                          width={box.label.length * 7 + 10}
                          height={20}
                          fill="#22c55e"
                          rx="3"
                        />
                        <text 
                          x={xPx + 4}
                          y={yPx - 6}
                          fill="white"
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="sans-serif"
                        >
                          {box.label} ({(box.confidence * 100).toFixed(0)}%)
                        </text>
                      </g>
                    );
                  })}

                  {/* Drag Calibration tool lines */}
                  {calibrationMode === "calibrate" && (
                    <g>
                      {/* Connection indicator line */}
                      <line 
                        x1={`${calibStart.x}%`}
                        y1={`${calibStart.y}%`}
                        x2={`${calibEnd.x}%`}
                        y2={`${calibEnd.y}%`}
                        stroke="#f97316"
                        strokeWidth="3.5"
                        strokeDasharray="5"
                      />
                      {/* Scale overlay tooltip */}
                      <rect 
                        x={`${(calibStart.x + calibEnd.x)/2}%`}
                        y={`${(calibStart.y + calibEnd.y)/2 - 3}%`}
                        transform="translate(-60, -25)"
                        width="120"
                        height="20"
                        fill="#0f172a"
                        rx="4"
                      />
                      <text 
                        x={`${(calibStart.x + calibEnd.x)/2}%`}
                        y={`${(calibStart.y + calibEnd.y)/2 - 3}%`}
                        transform="translate(0, -11)"
                        textAnchor="middle"
                        fill="white"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        📐 Ref Scale: {pxCalibDistance}px
                      </text>
                      {/* Draggable Anchors */}
                      <circle 
                        cx={`${calibStart.x}%`}
                        cy={`${calibStart.y}%`}
                        r="10"
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        cursor="grab"
                        onMouseDown={() => handleMouseDown("calib-s")}
                      />
                      <circle 
                        cx={`${calibEnd.x}%`}
                        cy={`${calibEnd.y}%`}
                        r="10"
                        fill="#f97316"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        cursor="grab"
                        onMouseDown={() => handleMouseDown("calib-e")}
                      />
                    </g>
                  )}

                  {/* Measuring ruler line overlay */}
                  {calibrationMode === "measure" && (
                    <g>
                      <line 
                        x1={`${rulerStart.x}%`}
                        y1={`${rulerStart.y}%`}
                        x2={`${rulerEnd.x}%`}
                        y2={`${rulerEnd.y}%`}
                        stroke="#3b82f6"
                        strokeWidth="3.5"
                      />
                      {/* Measured mm readout tooltip */}
                      <rect 
                        x={`${(rulerStart.x + rulerEnd.x)/2}%`}
                        y={`${(rulerStart.y + rulerEnd.y)/2 - 3}%`}
                        transform="translate(-65, -30)"
                        width="130"
                        height="24"
                        fill="#3b82f6"
                        rx="5"
                      />
                      <text 
                        x={`${(rulerStart.x + rulerEnd.x)/2}%`}
                        y={`${(rulerStart.y + rulerEnd.y)/2 - 3}%`}
                        transform="translate(0, -14)"
                        textAnchor="middle"
                        fill="white"
                        fontSize="11"
                        fontWeight="bold"
                      >
                        📏 Ruler: {mmRulerDistance} mm
                      </text>
                      {/* Anchors */}
                      <circle 
                        cx={`${rulerStart.x}%`}
                        cy={`${rulerStart.y}%`}
                        r="10"
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        cursor="grab"
                        onMouseDown={() => handleMouseDown("ruler-s")}
                      />
                      <circle 
                        cx={`${rulerEnd.x}%`}
                        cy={`${rulerEnd.y}%`}
                        r="10"
                        fill="#3b82f6"
                        stroke="#ffffff"
                        strokeWidth="2.5"
                        cursor="grab"
                        onMouseDown={() => handleMouseDown("ruler-e")}
                      />
                    </g>
                  )}
                </svg>
              </div>
            </div>

            {/* Interactive Diagnostic & Repair Dashboard */}
            {diagnosis && (
              <div className="mechanic-card" style={{ borderLeft: `4px solid ${diagnosis.severity === "critical" || diagnosis.severity === "high" ? "#ef4444" : diagnosis.severity === "medium" ? "#eab308" : "#22c55e"}` }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16 }}>
                  <div>
                    <span className={`severity-badge severity-${diagnosis.severity}`}>{diagnosis.severity}</span>
                    <h2 style={{ fontSize: 18, fontWeight: 800, margin: "8px 0 4px 0" }}>{diagnosis.detectedComponent}</h2>
                    <h4 style={{ fontSize: 13, fontWeight: 700, color: "#64748b", margin: "0 0 10px 0" }}>⚠️ {diagnosis.issueFound}</h4>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <div style={{ fontSize: 12, color: "#64748b", fontWeight: 600 }}>Confidence Rating</div>
                    <div style={{ fontSize: 18, fontWeight: 800, color: "#22c55e" }}>{(diagnosis.confidence * 100).toFixed(0)}%</div>
                  </div>
                </div>

                <p style={{ margin: "0 0 14px 0", fontSize: 13, lineHeight: 1.6, color: "#334155" }}>
                  {diagnosis.description}
                </p>

                {diagnosis.measuredMetrics && (
                  <div style={{ background: "#f8fafc", padding: "10px 12px", borderRadius: 8, fontSize: 12, fontWeight: 600, border: "1px solid #e2e8f0", color: "#1e293b", marginBottom: 14 }}>
                    📊 {diagnosis.measuredMetrics}
                  </div>
                )}

                <div style={{ borderTop: "1px solid #e2e8f0", margin: "20px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px", marginTop: "16px" }} className="diagnosis-details-grid">
                  {/* Sidebar for tools & parts */}
                  <div>
                    <div style={{ marginBottom: "20px" }}>
                      <h4 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#475569", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        🛠️ Required Tools
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {diagnosis.toolsRequired.map((tool) => {
                          const isChecked = checkedTools.includes(tool);
                          return (
                            <label 
                              key={tool} 
                              className="modern-checkbox" 
                              style={{ 
                                background: isChecked ? "#f8fafc" : "transparent",
                                border: "1px solid #e2e8f0",
                                padding: "8px 12px",
                                borderRadius: "6px",
                                display: "flex",
                                alignItems: "center",
                                gap: "10px",
                                fontSize: "12px",
                                transition: "all 0.15s ease",
                                color: isChecked ? "#64748b" : "#334155",
                                textDecoration: isChecked ? "line-through" : "none",
                                cursor: "pointer",
                                margin: 0
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isChecked}
                                onChange={() => toggleTool(tool)}
                                style={{ accentColor: "#0f172a" }}
                              />
                              <span>{tool}</span>
                            </label>
                          );
                        })}
                      </div>
                    </div>

                    <div>
                      <h4 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#475569", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
                        📦 Recommended Parts
                      </h4>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {diagnosis.partsRequired.map((part) => (
                          <div 
                            key={part} 
                            style={{ 
                              background: "#f8fafc",
                              border: "1px solid #e2e8f0",
                              padding: "8px 12px",
                              borderRadius: "6px",
                              fontSize: "12px",
                              fontWeight: 600,
                              color: "#0f172a"
                            }}
                          >
                            🔹 {part}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Main Area for Repair Steps */}
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                      <h4 style={{ fontSize: "13px", fontWeight: 800, textTransform: "uppercase", color: "#475569", margin: 0, display: "flex", alignItems: "center", gap: "6px" }}>
                        🔧 Step-by-Step Repair Guide
                      </h4>
                      <span style={{ fontSize: "12px", fontWeight: 700, color: progressPercent === 100 ? "#22c55e" : "#0f172a" }}>
                        {progressPercent}% Done
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div style={{ width: "100%", height: "6px", background: "#f1f5f9", borderRadius: "999px", overflow: "hidden", marginBottom: "16px", border: "1px solid #e2e8f0" }}>
                      <div 
                        style={{ 
                          width: `${progressPercent}%`, 
                          height: "100%", 
                          background: progressPercent === 100 ? "linear-gradient(90deg, #22c55e, #16a34a)" : "linear-gradient(90deg, #3b82f6, #2563eb)", 
                          transition: "width 0.4s cubic-bezier(0.4, 0, 0.2, 1)" 
                        }} 
                      />
                    </div>

                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      {diagnosis.repairSteps.map((step) => {
                        const isDone = completedSteps.includes(step.number);
                        return (
                          <div 
                            key={step.number} 
                            style={{ 
                              border: "1px solid #e2e8f0",
                              borderRadius: "8px",
                              padding: "12px",
                              background: isDone ? "#f8fafc" : "#ffffff",
                              transition: "all 0.2s ease"
                            }}
                          >
                            <label 
                              className="modern-checkbox" 
                              style={{ 
                                alignItems: "flex-start", 
                                margin: 0, 
                                fontWeight: 600,
                                fontSize: "12.5px",
                                color: isDone ? "#64748b" : "#0f172a"
                              }}
                            >
                              <input 
                                type="checkbox" 
                                checked={isDone}
                                onChange={() => toggleStep(step.number)}
                                style={{ accentColor: "#0f172a", marginTop: "2px" }}
                              />
                              <span style={{ lineHeight: "1.4" }}>
                                <strong style={{ marginRight: "4px", color: isDone ? "#94a3b8" : "#475569" }}>{step.number}.</strong>
                                {step.action}
                              </span>
                            </label>

                            {step.tip && !isDone && (
                              <div style={{ background: "#f0fdf4", borderLeft: "3.5px solid #22c55e", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", color: "#166534", marginTop: "8px", fontWeight: 500, lineHeight: "1.4" }}>
                                💡 <strong>Tip:</strong> {step.tip}
                              </div>
                            )}

                            {step.warning && !isDone && (
                              <div style={{ background: "#fffbeb", borderLeft: "3.5px solid #f59e0b", padding: "6px 10px", borderRadius: "4px", fontSize: "11px", color: "#92400e", marginTop: "8px", fontWeight: 500, lineHeight: "1.4" }}>
                                ⚠️ <strong>Warning:</strong> {step.warning}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* Mechanical Gains Bottom Strip */}
                <div style={{ borderTop: "1px solid #e2e8f0", marginTop: "20px", paddingTop: "16px", display: "grid", gridTemplateColumns: "1fr 1.5fr", gap: "24px" }} className="gains-bottom-grid">
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "24px" }}>🪙</span>
                    <div>
                      <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Est. Local Repair Cost</div>
                      <div style={{ fontSize: "16px", fontWeight: 800, color: "#0f172a" }}>{diagnosis.estimatedCostRangeEur}</div>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <span style={{ fontSize: "24px" }}>🎓</span>
                    <div>
                      <div style={{ fontSize: "10px", color: "#64748b", fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.5px" }}>Mechanical Skills to Master</div>
                      <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", marginTop: "4px" }}>
                        {diagnosis.skillsLearned.map((skill) => (
                          <span 
                            key={skill} 
                            style={{ 
                              background: "#f1f5f9", 
                              color: "#475569", 
                              padding: "2px 8px", 
                              borderRadius: "9999px", 
                              fontSize: "10.5px", 
                              fontWeight: 600,
                              border: "1px solid #e2e8f0" 
                            }}
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>

              </div>
            )}
          </div>

          {/* RIGHT SIDEBAR PANEL */}
          <div>
            
            {/* Preloaded Demo Cases list */}
            <div className="mechanic-card">
              <h3 className="mechanic-card-title">📖 Preloaded Demo Cases</h3>
              <p style={{ margin: "0 0 12px 0", fontSize: 12, color: "#64748b" }}>
                Select a baseline case to populate coordinates and run edge filters instantly:
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {DEMO_CASES.map((d) => (
                  <div 
                    key={d.id} 
                    className={`demo-card ${activeCaseId === d.id ? "active" : ""}`}
                    onClick={() => handleLoadDemoCase(d.id)}
                  >
                    <img src={d.imageUrl} className="demo-card-img" alt="" />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <strong style={{ fontSize: 12, display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{d.title}</strong>
                      <span style={{ fontSize: 10, color: "#64748b" }}>{d.presetDiagnosis.detectedComponent}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Camera Calibration Box */}
            <div className="mechanic-card">
              <h3 className="mechanic-card-title">📏 Calibration HUD</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                <div>
                  <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>HUD TOOL SELECTION</label>
                  <div style={{ display: "flex", gap: 4, marginTop: 4 }}>
                    <button 
                      className={`btn-modern-secondary ${calibrationMode === "calibrate" ? "active" : ""}`}
                      onClick={() => setCalibrationMode(calibrationMode === "calibrate" ? "none" : "calibrate")}
                      style={{ flex: 1, padding: "6px 0", fontSize: 11, border: calibrationMode === "calibrate" ? "1.5px solid #f97316" : "", color: calibrationMode === "calibrate" ? "#f97316" : "" }}
                    >
                      📐 Calibrate Scale
                    </button>
                    <button 
                      className={`btn-modern-secondary ${calibrationMode === "measure" ? "active" : ""}`}
                      onClick={() => setCalibrationMode(calibrationMode === "measure" ? "none" : "measure")}
                      style={{ flex: 1, padding: "6px 0", fontSize: 11, border: calibrationMode === "measure" ? "1.5px solid #3b82f6" : "", color: calibrationMode === "measure" ? "#3b82f6" : "" }}
                    >
                      📏 Measure Part
                    </button>
                  </div>
                </div>

                {calibrationMode === "calibrate" && (
                  <div style={{ background: "#f8fafc", padding: 12, borderRadius: 8, border: "1px solid #e2e8f0", display: "flex", flexDirection: "column", gap: 8 }}>
                    <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>REFERENCE OBJECT</label>
                    <select 
                      value={calibrationRef}
                      onChange={(e) => setCalibrationRef(e.target.value as any)}
                      style={{ width: "100%", padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc" }}
                    >
                      <option value="coin">€2 Coin (25.75mm)</option>
                      <option value="card">Standard Card (85.60mm)</option>
                      <option value="custom">Custom Object</option>
                    </select>

                    {calibrationRef === "custom" && (
                      <div>
                        <label style={{ fontSize: 11, fontWeight: 700, color: "#64748b" }}>WIDTH (MM)</label>
                        <input 
                          type="number"
                          value={customRefMm}
                          onChange={(e) => setCustomRefMm(e.target.value)}
                          style={{ width: "100%", padding: "4px 8px", fontSize: 12, borderRadius: 4, border: "1px solid #ccc", boxSizing: "border-box", marginTop: 4 }}
                        />
                      </div>
                    )}
                  </div>
                )}

                <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b" }}>
                    <span>Active Scale:</span>
                    <strong style={{ color: "#0f172a" }}>{calibrationScale} px/mm</strong>
                  </div>
                  {calibrationMode === "measure" && (
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#64748b", marginTop: 4 }}>
                      <span>Measured:</span>
                      <strong style={{ color: "#3b82f6" }}>{mmRulerDistance} mm</strong>
                    </div>
                  )}
                </div>

                <button 
                  className="btn-modern-primary"
                  onClick={handleTriggerDiagnosis}
                  disabled={diagnosing}
                  style={{ width: "100%", justifyContent: "center" }}
                >
                  {diagnosing ? "Analyzing Image..." : "⚡ Get Visual Diagnosis"}
                </button>
                {diagError && <div style={{ color: "#ef4444", fontSize: 11, marginTop: 4 }}>⚠️ {diagError}</div>}
              </div>
            </div>

            {/* Diagnostic History List */}
            <div className="mechanic-card">
              <h3 className="mechanic-card-title">💾 Saved Analyses</h3>
              {history.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: "#64748b" }}>No diagnostic history yet.</p>
              ) : (
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {history.map((h) => (
                    <div 
                      key={h.id}
                      className={`history-item ${diagnosis?.id === h.id ? "active" : ""}`}
                      onClick={() => setDiagnosis(h)}
                    >
                      <div style={{ flex: 1, minWidth: 0, paddingRight: 8 }}>
                        <strong style={{ display: "block", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{h.detectedComponent}</strong>
                        <span style={{ fontSize: 10, color: "#64748b" }}>{h.issueFound}</span>
                      </div>
                      <span className="history-delete-btn" onClick={(e) => handleDeleteHistory(h.id, e)}>✕</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>

        </div>

      </div>

    </div>
  );
}
