"use client";

import { useState } from "react";
import type { AnalysisResult } from "@/lib/analyzer";
import Link from "next/link";

// ── Types ──────────────────────────────────────────────────────
interface FormState {
  title: string;
  description: string;
  askingPrice: string;
}

// ── Helpers ────────────────────────────────────────────────────
function VerdictBadge({ verdict }: { verdict: AnalysisResult["verdict"] }) {
  const map = {
    "GREAT FLIP": { cls: "verdict-great", emoji: "🚀" },
    "FAIR DEAL":  { cls: "verdict-fair",  emoji: "👍" },
    "PASS":       { cls: "verdict-pass",  emoji: "⏭️" },
    "AVOID":      { cls: "verdict-avoid", emoji: "🚫" },
  };
  const { cls, emoji } = map[verdict];
  return (
    <span
      className={cls}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: "6px 16px",
        borderRadius: 99,
        fontSize: "0.85rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
      }}
    >
      {emoji} {verdict}
    </span>
  );
}

function IssuePill({ issue }: { issue: AnalysisResult["detectedIssues"][0] }) {
  const sev = issue.severity;
  return (
    <div
      className={`severity-${sev}`}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 6,
        padding: "5px 12px",
        borderRadius: 99,
        fontSize: "0.8rem",
        fontWeight: 500,
      }}
    >
      <span style={{ opacity: 0.7, fontSize: "0.7rem", textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {sev}
      </span>
      {issue.label}
      <span style={{ opacity: 0.6 }}>€{issue.estimatedCost}</span>
    </div>
  );
}

function MetricCard({
  label,
  value,
  sub,
  color,
}: {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}) {
  return (
    <div
      className="card"
      style={{ padding: "20px 22px", flex: 1 }}
    >
      <div style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "1.8rem",
          fontWeight: 800,
          fontFamily: "'Space Grotesk', sans-serif",
          color: color ?? "var(--text-primary)",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "0.78rem", color: "var(--text-secondary)" }}>{sub}</div>
      )}
    </div>
  );
}

// ── Main component ─────────────────────────────────────────────
export default function AnalyzerPage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    askingPrice: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);

    const price = parseFloat(form.askingPrice);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid asking price.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          askingPrice: price,
        }),
      });
      if (!res.ok) throw new Error("Analysis failed");
      const data: AnalysisResult = await res.json();
      setResult(data);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ title: "", description: "", askingPrice: "" });
    setResult(null);
    setError(null);
  };

  const profitColor =
    result
      ? result.estimatedProfit >= 80
        ? "var(--accent-green)"
        : result.estimatedProfit >= 25
        ? "var(--accent-amber)"
        : "var(--accent-red)"
      : undefined;

  return (
    <main style={{ position: "relative", zIndex: 1, minHeight: "100vh" }}>
      {/* ── Top bar ─────────────────────────────────────────── */}
      <div
        style={{
          borderBottom: "1px solid var(--border)",
          padding: "16px 24px",
          display: "flex",
          alignItems: "center",
          gap: 16,
        }}
      >
        <Link href="/" style={{ textDecoration: "none" }}>
          <button className="btn-secondary" style={{ padding: "8px 14px", fontSize: "0.8rem" }}>
            ← Back
          </button>
        </Link>
        <div>
          <h1 style={{ fontSize: "1.1rem", color: "var(--text-primary)" }}>
            Fix &amp; Flip Analyzer
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Phase 1 · Rule-based · No AI required
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 900,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "grid",
          gridTemplateColumns: result ? "1fr 1fr" : "1fr",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* ── Form ──────────────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Paste your listing</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
            Copy the title and description from eBay Kleinanzeigen (or any marketplace) and drop it below.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Title */}
            <div>
              <label
                htmlFor="listing-title"
                style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}
              >
                Listing title
              </label>
              <input
                id="listing-title"
                className="input"
                type="text"
                placeholder='e.g. "Trek FX3 2019, 28 Zoll, Shimano Deore"'
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            {/* Description */}
            <div>
              <label
                htmlFor="listing-description"
                style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}
              >
                Description
              </label>
              <textarea
                id="listing-description"
                className="input"
                rows={7}
                placeholder={"Paste the full listing description here.\nKeywords like 'brake worn', 'rust', 'derailleur problem' will be detected automatically."}
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            {/* Asking price */}
            <div>
              <label
                htmlFor="asking-price"
                style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}
              >
                Asking price (€)
              </label>
              <input
                id="asking-price"
                className="input"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 280"
                value={form.askingPrice}
                onChange={(e) => setForm((f) => ({ ...f, askingPrice: e.target.value }))}
                required
              />
            </div>

            {/* Comparable price (optional) */}
            <div>
              <label
                htmlFor="comparable-price"
                style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}
              >
                Market comparison price — optional{" "}
                <span style={{ color: "var(--text-muted)", fontWeight: 400 }}>
                  (found a similar listing? paste its price)
                </span>
              </label>
              <input
                id="comparable-price"
                className="input"
                type="number"
                min="1"
                step="1"
                placeholder="e.g. 380 (raises confidence score)"
              />
            </div>

            {error && (
              <div
                style={{
                  background: "rgba(255,77,109,0.08)",
                  border: "1px solid rgba(255,77,109,0.2)",
                  borderRadius: "var(--radius-sm)",
                  padding: "12px 16px",
                  fontSize: "0.85rem",
                  color: "var(--accent-red)",
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10 }}>
              <button
                id="analyze-btn"
                type="submit"
                className="btn-primary"
                disabled={loading}
                style={{ flex: 1 }}
              >
                {loading ? "Analyzing…" : "Analyze Listing →"}
              </button>
              {result && (
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Reset
                </button>
              )}
            </div>
          </form>

          {/* Tip box */}
          <div
            style={{
              marginTop: 24,
              background: "rgba(91,141,238,0.06)",
              border: "1px solid rgba(91,141,238,0.15)",
              borderRadius: "var(--radius-sm)",
              padding: "14px 16px",
              fontSize: "0.8rem",
              color: "var(--text-secondary)",
              lineHeight: 1.6,
            }}
          >
            💡 <strong style={{ color: "var(--text-primary)" }}>Pro tip:</strong>{" "}
            The more description text you include, the more issues the engine can detect.
            Descriptions in German and English both work.
          </div>
        </section>

        {/* ── Results ───────────────────────────────────────── */}
        {loading && (
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[200, 100, 140, 180].map((h, i) => (
              <div key={i} className="shimmer" style={{ height: h }} />
            ))}
          </section>
        )}

        {result && !loading && (
          <section className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Verdict hero card */}
            <div
              className="card"
              style={{
                padding: 28,
                borderColor:
                  result.verdict === "GREAT FLIP" ? "rgba(0,229,160,0.25)"
                  : result.verdict === "FAIR DEAL" ? "rgba(245,166,35,0.25)"
                  : result.verdict === "AVOID"     ? "rgba(255,77,109,0.35)"
                  : "var(--border)",
              }}
            >
              <VerdictBadge verdict={result.verdict} />
              <p style={{ marginTop: 14, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {result.verdictReason}
              </p>

              {result.bikeTier && (
                <div style={{ marginTop: 14, fontSize: "0.8rem", color: "var(--text-muted)" }}>
                  Detected: <strong style={{ color: "var(--text-secondary)" }}>
                    {result.bikeTier.brand.charAt(0).toUpperCase() + result.bikeTier.brand.slice(1)}{" "}
                    {result.bikeTier.type}
                  </strong>{" "}
                  · {result.bikeTier.tier} tier · typical resale €{result.bikeTier.minResale}–€{result.bikeTier.maxResale}
                </div>
              )}
            </div>

            {/* Metrics row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MetricCard
                label="Est. Profit"
                value={`€${result.estimatedProfit}`}
                sub={`${result.profitMarginPercent}% margin`}
                color={profitColor}
              />
              <MetricCard
                label="Repair Cost"
                value={result.estimatedRepairCost >= 9999 ? "—" : `€${result.estimatedRepairCost}`}
                sub={result.estimatedRepairCost >= 9999 ? "Deal-breaker issue" : `${result.detectedIssues.length} issue(s)`}
              />
              <MetricCard
                label="Est. Resale"
                value={`€${result.estimatedResalePrice}`}
                sub={
                  result.priceVsMarket === "below" ? "↓ below market"
                  : result.priceVsMarket === "above" ? "↑ above market"
                  : result.priceVsMarket === "at"    ? "≈ at market"
                  : "market unknown"
                }
              />
            </div>

            {/* Confidence */}
            <div className="card" style={{ padding: "16px 20px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10 }}>
                <span style={{ fontSize: "0.78rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  Confidence
                </span>
                <span style={{ fontSize: "0.85rem", fontWeight: 600, color: "var(--text-secondary)" }}>
                  {Math.round(result.confidence * 100)}%
                </span>
              </div>
              <div style={{ height: 6, background: "rgba(255,255,255,0.06)", borderRadius: 99, overflow: "hidden" }}>
                <div
                  style={{
                    height: "100%",
                    width: `${result.confidence * 100}%`,
                    background: "linear-gradient(90deg, var(--accent-blue), var(--accent-green))",
                    borderRadius: 99,
                    transition: "width 0.6s ease",
                  }}
                />
              </div>
              <p style={{ fontSize: "0.75rem", color: "var(--text-muted)", marginTop: 8 }}>
                {result.confidence >= 0.75
                  ? "High — comparable price found"
                  : result.confidence >= 0.5
                  ? "Medium — based on brand/type lookup"
                  : "Low — brand unknown, estimate is rough"}
              </p>
            </div>

            {/* Detected issues */}
            {result.detectedIssues.length > 0 && (
              <div className="card" style={{ padding: "20px 22px" }}>
                <h3 style={{ fontSize: "0.9rem", marginBottom: 14 }}>
                  Detected issues
                </h3>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
                  {result.detectedIssues.map((issue) => (
                    <IssuePill key={issue.id} issue={issue} />
                  ))}
                </div>
              </div>
            )}

            {result.detectedIssues.length === 0 && (
              <div
                className="card"
                style={{
                  padding: "16px 20px",
                  fontSize: "0.85rem",
                  color: "var(--accent-green)",
                  borderColor: "rgba(0,229,160,0.2)",
                  background: "rgba(0,229,160,0.04)",
                }}
              >
                ✅ No issues detected in the description. Inspect in person before buying.
              </div>
            )}

            {/* Action footer */}
            <div style={{ fontSize: "0.78rem", color: "var(--text-muted)", textAlign: "center", paddingTop: 4 }}>
              Estimates based on German second-hand market data · Always verify in person
            </div>
          </section>
        )}
      </div>
    </main>
  );
}
