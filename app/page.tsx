"use client";

import Link from "next/link";
import { useState } from "react";

const features = [
  {
    icon: "🔍",
    phase: "Phase 1 — Live",
    title: "Fix & Flip Finder",
    description:
      "Paste any bike listing and get an instant deal verdict, estimated repair costs, and profit potential.",
    href: "/analyzer",
    color: "var(--accent-green)",
    ready: true,
  },
  {
    icon: "⚙️",
    phase: "Phase 2 — Coming",
    title: "Parts Wear Tracker",
    description:
      "Log rides via Strava or manually. Get warnings before your chain, brakes, or cassette fail.",
    href: "/tracker",
    color: "var(--accent-blue)",
    ready: false,
  },
  {
    icon: "▶️",
    phase: "Phase 3 — Coming",
    title: "YouTube Skill Extractor",
    description:
      "Paste a repair video URL and get an interactive step-by-step checklist with tools and time estimate.",
    href: "/extractor",
    color: "var(--accent-amber)",
    ready: false,
  },
  {
    icon: "📷",
    phase: "Phase 4 — Coming",
    title: "Pocket Bike Mechanic AI",
    description:
      "Upload a photo of any bike issue. OpenCV preprocessing + AI vision gives you a diagnosis and repair steps.",
    href: "/mechanic",
    color: "var(--accent-purple)",
    ready: false,
  },
];

const stats = [
  { value: "€30–120", label: "avg. flip profit" },
  { value: "12+", label: "issue patterns detected" },
  { value: "30+", label: "brands indexed" },
  { value: "0", label: "API keys needed" },
];

export default function HomePage() {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  return (
    <main
      style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}
    >
      {/* ── Hero ──────────────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "120px 24px 80px",
          textAlign: "center",
        }}
      >
        {/* Status pill */}
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            background: "rgba(0,229,160,0.08)",
            border: "1px solid rgba(0,229,160,0.2)",
            borderRadius: 99,
            padding: "6px 16px",
            marginBottom: 32,
            fontSize: "0.8rem",
            color: "var(--accent-green)",
            fontWeight: 500,
          }}
        >
          <span className="pulse-dot" />
          Phase 1 live — Listing Analyzer
        </div>

        <h1
          style={{ fontSize: "clamp(2.5rem, 6vw, 4.5rem)", marginBottom: 20 }}
        >
          Turn bike knowledge{" "}
          <span className="gradient-text">into profit.</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(1rem, 2vw, 1.2rem)",
            color: "var(--text-secondary)",
            maxWidth: 600,
            margin: "0 auto 48px",
            lineHeight: 1.65,
          }}
        >
          VeloStack is your bike side-hustle engine — find undervalued listings,
          diagnose issues, track wear, and extract repair skills from any YouTube video.
        </p>

        <div
          style={{ display: "flex", gap: 12, justifyContent: "center", flexWrap: "wrap" }}
        >
          <Link href="/analyzer">
            <button className="btn-primary" style={{ fontSize: "1rem", padding: "14px 32px" }}>
              Analyze a Listing →
            </button>
          </Link>
          <a
            href="https://github.com"
            target="_blank"
            rel="noopener noreferrer"
          >
            <button className="btn-secondary">
              ⭐ Star on GitHub
            </button>
          </a>
        </div>

        {/* Stats row */}
        <div
          style={{
            display: "flex",
            gap: 0,
            marginTop: 72,
            borderRadius: "var(--radius)",
            overflow: "hidden",
            border: "1px solid var(--border)",
          }}
        >
          {stats.map((s, i) => (
            <div
              key={i}
              style={{
                flex: 1,
                padding: "24px 16px",
                borderRight:
                  i < stats.length - 1 ? "1px solid var(--border)" : "none",
                background: "var(--bg-card)",
                textAlign: "center",
              }}
            >
              <div
                style={{
                  fontSize: "1.75rem",
                  fontWeight: 800,
                  fontFamily: "'Space Grotesk', sans-serif",
                  color: "var(--text-primary)",
                  marginBottom: 4,
                }}
              >
                {s.value}
              </div>
              <div style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
                {s.label}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── Feature Grid ──────────────────────────────────────── */}
      <section
        style={{
          maxWidth: 1000,
          margin: "0 auto",
          padding: "0 24px 120px",
        }}
      >
        <h2
          style={{
            fontSize: "1.05rem",
            color: "var(--text-muted)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            textAlign: "center",
            marginBottom: 40,
            fontFamily: "'Inter', sans-serif",
            fontWeight: 500,
          }}
        >
          The full platform — built one phase at a time
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(420px, 1fr))",
            gap: 16,
          }}
        >
          {features.map((f, i) => (
            <div
              key={i}
              className="card fade-in-up"
              style={{
                padding: 28,
                animationDelay: `${i * 80}ms`,
                opacity: 0,
                animationFillMode: "forwards",
                position: "relative",
                overflow: "hidden",
                cursor: f.ready ? "pointer" : "default",
                borderColor:
                  hoveredIdx === i && f.ready
                    ? `${f.color}44`
                    : undefined,
                transform:
                  hoveredIdx === i && f.ready
                    ? "translateY(-3px)"
                    : undefined,
                transition: "border-color 0.2s, transform 0.2s",
              }}
              onMouseEnter={() => setHoveredIdx(i)}
              onMouseLeave={() => setHoveredIdx(null)}
            >
              {/* Glow blob */}
              {hoveredIdx === i && f.ready && (
                <div
                  style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 160,
                    height: 160,
                    borderRadius: "50%",
                    background: f.color,
                    opacity: 0.06,
                    filter: "blur(40px)",
                    pointerEvents: "none",
                  }}
                />
              )}

              <div
                style={{
                  display: "flex",
                  alignItems: "flex-start",
                  gap: 16,
                }}
              >
                <div
                  style={{
                    width: 48,
                    height: 48,
                    borderRadius: "var(--radius-sm)",
                    background: `${f.color}14`,
                    border: `1px solid ${f.color}28`,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    fontSize: "1.4rem",
                    flexShrink: 0,
                  }}
                >
                  {f.icon}
                </div>

                <div style={{ flex: 1 }}>
                  <div
                    style={{
                      fontSize: "0.72rem",
                      color: f.color,
                      fontWeight: 600,
                      letterSpacing: "0.06em",
                      textTransform: "uppercase",
                      marginBottom: 6,
                    }}
                  >
                    {f.phase}
                  </div>
                  <h3
                    style={{
                      fontSize: "1.1rem",
                      marginBottom: 8,
                      color: "var(--text-primary)",
                    }}
                  >
                    {f.title}
                  </h3>
                  <p
                    style={{
                      fontSize: "0.875rem",
                      color: "var(--text-secondary)",
                      lineHeight: 1.6,
                    }}
                  >
                    {f.description}
                  </p>

                  {f.ready && (
                    <Link href={f.href}>
                      <button
                        className="btn-primary"
                        style={{
                          marginTop: 20,
                          fontSize: "0.85rem",
                          padding: "10px 20px",
                          background: `linear-gradient(135deg, ${f.color}, #5b8dee)`,
                        }}
                      >
                        Open Tool →
                      </button>
                    </Link>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
