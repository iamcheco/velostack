"use client";

import { useState } from "react";
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
        fontSize: "1.2rem",
        fontWeight: 700,
        letterSpacing: "0.05em",
        transform: "rotate(-1deg)"
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
      style={{ padding: "20px 22px", flex: 1, minWidth: 150, transform: "rotate(1deg)" }}
    >
      <div style={{ fontSize: "1rem", color: "var(--text-muted)", marginBottom: 8, textTransform: "uppercase", letterSpacing: "0.06em", textDecoration: "underline" }}>
        {label}
      </div>
      <div
        style={{
          fontSize: "2.4rem",
          fontWeight: 800,
          color: color ?? "var(--text-primary)",
          lineHeight: 1,
          marginBottom: 4,
        }}
      >
        {value}
      </div>
      {sub && (
        <div style={{ fontSize: "1.1rem", color: "var(--text-secondary)" }}>{sub}</div>
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

  const handleComponentUpgrade = (type: string, newName: string, newPriceEur: number) => {
    setLocalComponents(prev => {
      const exists = prev.find(c => c.type.toLowerCase() === type.toLowerCase());
      if (exists) {
        return prev.map(c => c.type.toLowerCase() === type.toLowerCase() ? { ...c, name: newName, marketPriceEur: newPriceEur } : c);
      } else {
        return [...prev, { type, name: newName, marketPriceEur: newPriceEur }];
      }
    });
    setUpgradedInvestment(prev => prev + newPriceEur);
  };

  const currentEstimatedResale = result?.estimatedResalePrice || 0;
  const dynamicResaleValue = currentEstimatedResale + (upgradedInvestment - (result ? parseFloat(form.askingPrice) + result.estimatedRepairCost : 0)) * 0.5;
  const dynamicProfit = dynamicResaleValue - upgradedInvestment;

  const profitColor = dynamicProfit >= 80 ? "var(--accent-green)" : dynamicProfit >= 25 ? "var(--accent-amber)" : "var(--accent-red)";

  return (
    <main className="bezel-wrapper">
      <div className="bezel-frame">
        <div className="bezel-inner" style={{ display: "flex", flexDirection: "column", position: "relative" }}>
          
          {/* ── Top bar ─────────────────────────────────────────── */}
          <div
            style={{
              borderBottom: "4px dashed var(--border-strong)",
              paddingBottom: "16px",
              marginBottom: "32px",
              display: "flex",
              alignItems: "center",
              gap: 24,
            }}
          >
            <Link href="/" style={{ textDecoration: "none" }}>
              <button className="btn-secondary" style={{ 
                padding: "12px", 
                fontSize: "1.2rem", 
                borderRadius: "50%", 
                width: 80, 
                height: 80, 
                display: "flex", 
                justifyContent: "center", 
                alignItems: "center",
                boxShadow: "4px 4px 0 rgba(0,0,0,0.1)"
              }}>
                ← Back
              </button>
            </Link>
            <div>
              <h1 style={{ fontSize: "2.5rem", color: "var(--text-primary)", fontWeight: 800, textTransform: "uppercase" }}>
                Analyzer
              </h1>
            </div>
          </div>

          {/* ── Content ─────────────────────────────────────────── */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: result ? "1fr 1.5fr" : "1fr",
              gap: 32,
              alignItems: "start",
              flex: 1
            }}
          >
        {/* ── Form ──────────────────────────────────────────── */}
        <section className="card" style={{ transform: "rotate(-1deg)" }}>
          <h2 style={{ fontSize: "2rem", marginBottom: 8 }}>Paste your listing</h2>
          <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)", marginBottom: 28, lineHeight: 1.4 }}>
            The AI will extract components, search the web for live prices, and build the bike diagram.
          </p>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div>
              <label style={{ display: "block", fontSize: "1.2rem", marginBottom: 6, fontWeight: 600 }}>
                Listing title
              </label>
              <input
                className="input"
                type="text"
                placeholder='e.g. "Trek FX3 2019, 28 Zoll"'
                value={form.title}
                onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                required
              />
            </div>

            <div>
              <label style={{ display: "block", fontSize: "1.2rem", marginBottom: 6, fontWeight: 600 }}>
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
              <label style={{ display: "block", fontSize: "1.2rem", marginBottom: 6, fontWeight: 600 }}>
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
                className="sketch-border"
                style={{
                  padding: "12px 16px",
                  fontSize: "1.2rem",
                  color: "var(--accent-red)",
                  background: "#fff",
                  transform: "rotate(1deg)"
                }}
              >
                {error}
              </div>
            )}

            <div style={{ display: "flex", gap: 10, marginTop: 10 }}>
              <button type="submit" className="btn-primary" disabled={loading} style={{ flex: 1 }}>
                {loading ? "Searching Web..." : "Run Analysis →"}
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
              <div key={i} style={{ height: h, background: "#f5f5f5", border: "2px dashed #ccc", borderRadius: 10 }} />
            ))}
          </section>
        )}

        {result && !loading && (
          <section className="fade-in-up" style={{ display: "flex", flexDirection: "column", gap: 24 }}>
            
            {/* Interactive "What-If" Dashboard */}
            <div className="card" style={{ padding: 24 }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 24 }}>
                <div>
                  <h3 style={{ fontSize: "1.8rem", color: "var(--text-primary)" }}>Interactive Diagram</h3>
                  <p style={{ fontSize: "1.2rem", color: "var(--text-secondary)" }}>
                    Click any part to upgrade it and instantly fetch live market prices.
                  </p>
                </div>
                {result.bikeTier && (
                  <div className="sketch-border" style={{ padding: "6px 12px", fontSize: "1.1rem", fontWeight: 600, transform: "rotate(2deg)" }}>
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
                label="Investment"
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
            <div className="card" style={{ padding: 20, transform: "rotate(-1deg)" }}>
              <h3 style={{ fontSize: "1.2rem", textTransform: "uppercase", textDecoration: "underline", marginBottom: 12 }}>
                Initial Agent Verdict
              </h3>
              <VerdictBadge verdict={result.verdict} />
              <p style={{ marginTop: 12, fontSize: "1.3rem", color: "var(--text-secondary)", lineHeight: 1.4 }}>
                {result.verdictReason}
              </p>
            </div>

          </section>
        )}
      </div>
        </div>
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

  const PartNode = ({ label, type, rotation }: { label: string, type: string, rotation: number }) => {
    const comp = getComp(type);
    const isEditing = editingType === type;
    
    return (
      <div 
        className={isEditing ? "card" : "sketch-border"}
        style={{
          padding: "16px",
          minHeight: 110,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          cursor: "pointer",
          transform: `rotate(${rotation}deg)`,
          background: "#fff",
          borderStyle: isEditing ? "solid" : "dashed",
          zIndex: isEditing ? 10 : 1
        }}
        onClick={() => {
          if (!isEditing) {
            setEditingType(type);
            setEditValue(comp?.name || "");
          }
        }}
      >
        <div style={{ fontSize: "1rem", color: "var(--text-muted)", textTransform: "uppercase", textDecoration: "underline wavy 1px" }}>{label}</div>
        
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
              style={{ width: "100%", padding: "6px 8px", fontSize: "1.2rem", height: "auto" }}
              placeholder={`New ${label}...`}
            />
            {loadingPrice ? (
              <div style={{ fontSize: "1rem", marginTop: 8, fontWeight: 600 }}>
                <span className="pulse-dot" style={{ marginRight: 4 }}/> Searching web...
              </div>
            ) : (
              <div style={{ fontSize: "1rem", color: "var(--text-muted)", marginTop: 8 }}>
                Press Enter to search market
              </div>
            )}
          </div>
        ) : (
          <>
            <div style={{ fontWeight: 700, fontSize: "1.4rem", color: "var(--text-primary)", marginTop: 6, lineHeight: 1.2 }}>
              {comp ? comp.name : <span style={{ opacity: 0.3, fontWeight: 400 }}>?</span>}
            </div>
            {comp?.marketPriceEur !== undefined && (
              <div style={{ fontSize: "1.2rem", color: "var(--accent-green)", marginTop: 6, fontWeight: 600 }}>
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
      gap: 20, 
      position: "relative",
      padding: "20px 10px"
    }}>
      <div /> 
      <PartNode label="Saddle" type="saddle" rotation={-2} />
      <PartNode label="Cockpit" type="handlebars" rotation={1} />
      
      <PartNode label="Brakes" type="brakes" rotation={2} />
      <PartNode label="Frame" type="frame" rotation={-1} />
      <PartNode label="Fork" type="fork" rotation={3} />

      <PartNode label="Rear Wheel" type="wheels" rotation={-3} />
      <PartNode label="Drivetrain" type="drivetrain" rotation={0} />
      <div /> 
    </div>
  );
}
