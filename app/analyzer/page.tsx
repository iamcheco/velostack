"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult, ExtractedComponent } from "@/lib/analyzer";
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
      style={{ padding: "20px 22px", flex: 1, minWidth: 150 }}
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

  // Dynamic state for the "What-If" engine
  const [localComponents, setLocalComponents] = useState<ExtractedComponent[]>([]);
  const [upgradedInvestment, setUpgradedInvestment] = useState(0);

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
      setLocalComponents(data.components || []);
      setUpgradedInvestment(price + data.estimatedRepairCost);
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
    setLocalComponents([]);
  };

  // Upgrades a component in state and adjusts the investment value
  const handleComponentUpgrade = (type: string, newName: string, newPriceEur: number) => {
    setLocalComponents(prev => {
      const exists = prev.find(c => c.type.toLowerCase() === type.toLowerCase());
      if (exists) {
        return prev.map(c => c.type.toLowerCase() === type.toLowerCase() ? { ...c, name: newName, marketPriceEur: newPriceEur } : c);
      } else {
        return [...prev, { type, name: newName, marketPriceEur: newPriceEur }];
      }
    });
    // Add the new part price to the total investment
    setUpgradedInvestment(prev => prev + newPriceEur);
  };

  const currentEstimatedResale = result?.estimatedResalePrice || 0;
  // A naive dynamic logic: adding high-value parts increases the resale slightly, but you never get 1:1 ROI on parts.
  const dynamicResaleValue = currentEstimatedResale + (upgradedInvestment - (result ? parseFloat(form.askingPrice) + result.estimatedRepairCost : 0)) * 0.5;
  const dynamicProfit = dynamicResaleValue - upgradedInvestment;

  const profitColor =
    dynamicProfit >= 80 ? "var(--accent-green)" : dynamicProfit >= 25 ? "var(--accent-amber)" : "var(--accent-red)";

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
            VeloStack Dynamic Pricing Engine
          </h1>
          <p style={{ fontSize: "0.78rem", color: "var(--text-muted)" }}>
            Phase 1b · AI Extractor & Web Search
          </p>
        </div>
      </div>

      {/* ── Content ─────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: 1200,
          margin: "0 auto",
          padding: "40px 24px 80px",
          display: "grid",
          gridTemplateColumns: result ? "1fr 1.5fr" : "1fr",
          gap: 32,
          alignItems: "start",
        }}
      >
        {/* ── Form ──────────────────────────────────────────── */}
        <section>
          <h2 style={{ fontSize: "1.4rem", marginBottom: 8 }}>Paste your listing</h2>
          <p style={{ fontSize: "0.875rem", color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.6 }}>
            Paste the raw text. The AI will extract components, search the web for live prices, and build the bike diagram.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                Listing title
              </label>
              <input
                className="input"
                type="text"
                placeholder='e.g. "Trek FX3 2019, 28 Zoll, Shimano Deore"'
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                Description
              </label>
              <textarea
                className="input"
                rows={7}
                placeholder="Paste the full listing description here..."
                value={form.description}
                onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "0.8rem", color: "var(--text-secondary)", marginBottom: 6, fontWeight: 500 }}>
                Asking price (€)
              </label>
              <input
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
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Agent Searching Web..." : "Run AI Analysis →"}
              </button>
              {result && (
                <button type="button" className="btn-secondary" onClick={handleReset}>
                  Reset
                </button>
              )}
            </div>
          </form>
        </section>

        {/* ── Results ───────────────────────────────────────── */}
        {loading && (
          <section style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {[200, 400].map((h, i) => (
              <div key={i} className="shimmer" style={{ height: h }} />
            ))}
          </section>
        )}

        {result && !loading && (
          <section className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Interactive "What-If" Dashboard */}
            <div className="card" style={{ padding: 24, background: "rgba(91,141,238,0.04)", borderColor: "rgba(91,141,238,0.2)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 16 }}>
                <div>
                  <h3 style={{ fontSize: "1.2rem", color: "var(--text-primary)" }}>Interactive Bike Diagram</h3>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)" }}>
                    Click any part to upgrade it. The agent will fetch the new price and recalculate your margins.
                  </p>
                </div>
                {result.bikeTier && (
                  <div style={{ background: "var(--bg-elevated)", padding: "6px 12px", borderRadius: 8, border: "1px solid var(--border)", fontSize: "0.8rem", fontWeight: 600 }}>
                    {result.bikeTier.brand.toUpperCase()} · {result.bikeTier.type.toUpperCase()}
                  </div>
                )}
              </div>

              <InteractiveBikeDiagram 
                components={localComponents} 
                onComponentUpgrade={handleComponentUpgrade} 
              />
            </div>

            {/* Metrics row */}
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <MetricCard
                label="Dynamic Profit"
                value={`€${Math.round(dynamicProfit)}`}
                sub={`Resale €${Math.round(dynamicResaleValue)}`}
                color={profitColor}
              />
              <MetricCard
                label="Total Investment"
                value={`€${Math.round(upgradedInvestment)}`}
                sub={`Base €${form.askingPrice} + Parts €${Math.round(upgradedInvestment - parseFloat(form.askingPrice))}`}
              />
              <MetricCard
                label="AI Confidence"
                value={`${Math.round(result.confidence * 100)}%`}
                sub={result.confidence > 0.6 ? "Strong Market Data" : "Weak Market Data"}
              />
            </div>
            
            {/* Initial Verdict */}
            <div className="card" style={{ padding: 20 }}>
              <h3 style={{ fontSize: "0.9rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: 12 }}>
                Initial Agent Verdict
              </h3>
              <VerdictBadge verdict={result.verdict} />
              <p style={{ marginTop: 12, fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.6 }}>
                {result.verdictReason}
              </p>
            </div>

          </section>
        )}
      </div>
    </main>
  );
}

// ── Interactive Diagram UI Component ────────────────────────────────
function InteractiveBikeDiagram({
  components,
  onComponentUpgrade
}: {
  components: ExtractedComponent[];
  onComponentUpgrade: (type: string, newName: string, newPriceEur: number) => void;
}) {
  const [editingType, setEditingType] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [loadingPrice, setLoadingPrice] = useState(false);

  const getComp = (type: string) => components.find(c => c.type.toLowerCase().includes(type.toLowerCase()));

  const handleUpgrade = async (type: string) => {
    if (!editValue.trim()) {
      setEditingType(null);
      return;
    }
    setLoadingPrice(true);
    try {
      const res = await fetch("/api/price-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editValue, type })
      });
      const data = await res.json();
      onComponentUpgrade(type, editValue, data.estimatedPriceEur || 0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingPrice(false);
      setEditingType(null);
      setEditValue("");
    }
  };

  const PartNode = ({ label, type }: { label: string, type: string }) => {
    const comp = getComp(type);
    const isEditing = editingType === type;
    
    return (
      <div 
        style={{
          border: isEditing ? "1px solid var(--accent-blue)" : "1px dashed rgba(255,255,255,0.15)",
          padding: "16px",
          borderRadius: 12,
          background: isEditing ? "rgba(91,141,238,0.05)" : "rgba(255,255,255,0.02)",
          position: "relative",
          minHeight: 90,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          cursor: "pointer",
          transition: "all 0.2s",
          boxShadow: isEditing ? "0 0 0 2px rgba(91,141,238,0.3)" : "none"
        }}
        onClick={() => {
          if (!isEditing) {
            setEditingType(type);
            setEditValue(comp?.name || "");
          }
        }}
      >
        <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em" }}>{label}</div>
        
        {isEditing ? (
          <div style={{ marginTop: 8 }}>
            <input 
              autoFocus
              className="input"
              type="text" 
              value={editValue}
              onChange={e => setEditValue(e.target.value)}
              onKeyDown={e => {
                if (e.key === "Enter") handleUpgrade(type);
                if (e.key === "Escape") setEditingType(null);
              }}
              disabled={loadingPrice}
              style={{ width: "100%", padding: "6px 8px", fontSize: "0.85rem", height: "auto" }}
              placeholder={`New ${label}...`}
            />
            {loadingPrice ? (
              <div style={{ fontSize: "0.7rem", color: "var(--accent-blue)", marginTop: 8, fontWeight: 500 }}>
                <span className="pulse-dot" style={{ display: "inline-block", marginRight: 4 }}/> Searching web...
              </div>
            ) : (
              <div style={{ fontSize: "0.65rem", color: "var(--text-muted)", marginTop: 8 }}>
                Press Enter to fetch market price
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 600, fontSize: "0.95rem", color: "var(--text-primary)", marginTop: 6 }}>
              {comp ? comp.name : <span style={{ opacity: 0.3, fontWeight: 400 }}>Unknown</span>}
            </div>
            {comp?.marketPriceEur !== undefined && (
              <div style={{ fontSize: "0.75rem", color: "var(--accent-green)", marginTop: 6, fontWeight: 500 }}>
                + €{comp.marketPriceEur} value
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      display: "grid", 
      gridTemplateColumns: "1fr 1fr 1fr", 
      gap: 16, 
      position: "relative"
    }}>
      {/* 3x3 Bicycle Diagram Layout */}
      <div /> 
      <PartNode label="Saddle" type="saddle" />
      <PartNode label="Cockpit" type="handlebars" />
      
      <PartNode label="Brakes" type="brakes" />
      <PartNode label="Frame" type="frame" />
      <PartNode label="Fork" type="fork" />

      <PartNode label="Rear Wheel" type="wheels" />
      <PartNode label="Drivetrain" type="drivetrain" />
      <div /> 
    </div>
  );
}
