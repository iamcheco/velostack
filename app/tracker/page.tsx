"use client";
import Link from "next/link";

export default function TrackerPage() {
  return (
    <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      <div style={{ borderBottom: "1px solid var(--border)", padding: "16px 24px", display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/"><button className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>← Back</button></Link>
        <div>
          <h1 style={{ fontSize: "1.1rem" }}>Parts Wear Tracker</h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>Phase 2 · Coming soon</p>
        </div>
      </div>
      <div style={{ maxWidth: 600, margin: "80px auto", padding: "0 24px", textAlign: "center" }}>
        <div style={{ fontSize: "3rem", marginBottom: 20 }}>⚙️</div>
        <h2 style={{ fontSize: "1.5rem", marginBottom: 12 }}>Coming in Phase 2</h2>
        <p style={{ color: "var(--text-secondary)", lineHeight: 1.7 }}>
          Log rides via Strava or manually. Track chain, brake pad, cassette and tire wear with formula-based predictions.
          Get warned <em>before</em> parts fail.
        </p>
        <div style={{ marginTop: 32, padding: "16px 20px", background: "rgba(91,141,238,0.06)", border: "1px solid rgba(91,141,238,0.15)", borderRadius: "var(--radius-sm)", fontSize: "0.85rem", color: "var(--text-secondary)" }}>
          💡 Finish building Phase 1 first — then come back here.
        </div>
      </div>
    </main>
  );
}
