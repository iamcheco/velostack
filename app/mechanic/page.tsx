"use client";
import Link from "next/link";

export default function MechanicPage() {
  return (
    <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/"><button className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>← Back</button></Link>
        <div>
          <h1 style={{ fontSize: "1.1rem" }}>Pocket Bike Mechanic AI</h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Phase 4 · Coming soon</p>
        </div>
      </div>
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 20 }}>📷</div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Coming in Phase 4</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Upload a photo of any bike problem. OpenCV preprocessing + YOLO part detection + Gemini Vision gives you a precise diagnosis and step-by-step repair guide — leveraging camera calibration for better accuracy.
        </p>
      </div>
    </main>
  );
}
