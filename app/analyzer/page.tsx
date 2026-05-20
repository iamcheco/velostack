"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult, ExtractedComponent } from "@/lib/analyzer";
import Link from "next/link";
import PartOutDetails from "./components/PartOutDetails";`n 5eca781ffb80a3ccb308188a9f84955d38eeea87
}

interface MarketDataResult {
  prices: number[];
  bargainPrice: number;
  medianPrice: number;
  topPrice: number;
  sampleSize: number;
  confidence: "high" | "medium" | "low";
  transactions: Array<{
    price: number;
    platform: string;
    date: string;
    condition: string;
    title: string;
  }>;
}

interface CacheEntry {
  timestamp: number;
  data: MarketDataResult;
}

// ── Custom Component Card (Purged Reddit Styling) ──────────────────
function ComponentCard({
  label,
  type,
  upgradedInfo,
  originalComp,
  onUpgrade
}: {
  label: string;
  type: string;
  upgradedInfo?: { name: string; price: number };
  originalComp?: ExtractedComponent;
  onUpgrade: (type: string, name: string, price: number) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const [loadingPrice, setLoadingPrice] = useState(false);
  const [errorText, setErrorText] = useState("");

  const nameToShow = upgradedInfo ? upgradedInfo.name : (originalComp ? originalComp.name : "Not specified");
  const valueToShow = upgradedInfo ? upgradedInfo.price : (originalComp ? (originalComp.marketPriceEur ?? 0) : 0);
  const isUpgraded = !!upgradedInfo;
  
  const handleSave = async () => {
    if (!inputValue.trim()) {
      setEditing(false);
      return;
    }
    setLoadingPrice(true);
    setErrorText("");
    try {
      const res = await fetch("/api/price-component", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: inputValue, type })
      });
      if (!res.ok) throw new Error("Price fetch failed");
      const data = await res.json();
      onUpgrade(type, inputValue, data.estimatedPriceEur || 0);
      setEditing(false);
    } catch (e) {
      setErrorText("Failed to retrieve live market pricing.");
    } finally {
      setLoadingPrice(false);
    }
  };

  return (
    <div className="component-upgrade-card">
      <div className="component-upgrade-header">
        <span className="component-tag">🔧 {label}</span>
        <div className="component-value-badge">
          {valueToShow ? `+€${valueToShow} value` : "€0 value"}
          {isUpgraded && <span className="upgraded-flair">upgraded</span>}
        </div>
      </div>
      
      {editing ? (
        <div className="component-upgrade-form">
          <input
            className="modern-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
            disabled={loadingPrice}
            autoFocus
            placeholder={`Enter model name...`}
          />
          {errorText && <div className="error-hint">{errorText}</div>}
          <div className="upgrade-actions">
            <button 
              className="primary-btn sm" 
              onClick={handleSave} 
              disabled={loadingPrice}
            >
              {loadingPrice ? "Searching..." : "Save"}
            </button>
            <button 
              className="secondary-btn sm" 
              onClick={() => setEditing(false)} 
              disabled={loadingPrice}
            >
              Cancel
            </button>
            <span className="hint-text">Press Enter to search market</span>
          </div>
        </div>
      ) : (
        <div className="component-upgrade-body">
          <div className="component-model-display">
            <strong>Model:</strong> {nameToShow}
          </div>
          <button 
            className="upgrade-edit-trigger"
            onClick={() => {
              setInputValue(nameToShow === "Not specified" ? "" : nameToShow);
              setEditing(true);
            }}
          >
            Edit / Upgrade
          </button>
        </div>
      )}
    </div>
  );
}

// ── Main Page Component ────────────────────────────────────────
export default function AnalyzerPage() {
  const [form, setForm] = useState<FormState>({
    title: "",
    description: "",
    askingPrice: "",
    location: "",
    marketProfile: "",`n 5eca781ffb80a3ccb308188a9f84955d38eeea87
  
  // Hydrate form from cached session to provide fluid navigation states
  useEffect(() => {
    const savedForm = sessionStorage.getItem("vst_analyzer_form");
    if (savedForm) {
      try {
        setForm(JSON.parse(savedForm));
      } catch (e) {
        console.warn("Failed to load cached analyzer form data");
      }
    }
  }, []);

  const saveFormState = (newForm: FormState) => {
    setForm(newForm);
    sessionStorage.setItem("vst_analyzer_form", JSON.stringify(newForm));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setResult(null);
    setMarketData(null);

    const price = parseFloat(form.askingPrice);
    if (isNaN(price) || price <= 0) {
      setError("Please enter a valid asking price.");
      return;
    }

    setLoading(true);
    try {
      // 1. Fetch LLM-powered listing analysis
      const analysisPromise = fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          description: form.description,
          askingPrice: price,
          location: form.location || undefined,
          marketProfile: form.marketProfile || undefined,`n 5eca781ffb80a3ccb308188a9f84955d38eeea87
    sessionStorage.removeItem("vst_analyzer_form");
    setResult(null);
    setMarketData(null);
    setError(null);
    setLocalComponents([]);
    setUpgrades({});
    setAppraisalTab("whole");`n 5eca781ffb80a3ccb308188a9f84955d38eeea87

        /* Modern card layout styling */
        .modern-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          margin-bottom: 20px;
        }
        .modern-card-title {
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

        /* form layout */
        .form-group {
          margin-bottom: 18px;
        }
        .form-label {
          display: block;
          font-size: 13px;
          font-weight: 600;
          color: #334155;
          margin-bottom: 6px;
        }
        .modern-input {
          width: 100%;
          padding: 10px 14px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-family: inherit;
          font-size: 14px;
          color: #0f172a;
          box-sizing: border-box;
          transition: border-color 0.2s ease;
        }
        .modern-input:focus {
          border-color: #3b82f6;
          outline: none;
        }
        .input-subtext {
          font-size: 11px;
          color: #64748b;
          margin-top: 4px;
          display: block;
        }

        /* Button elements */
        .primary-btn {
          background: #0f172a;
          color: #ffffff;
          border: none;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border-radius: 8px;
          transition: all 0.2s ease;
        }
        .primary-btn:hover {
          background: #1e293b;
        }
        .primary-btn:disabled {
          background: #94a3b8;
          cursor: not-allowed;
        }
        .secondary-btn {
          background: #ffffff;
          color: #334155;
          border: 1px solid #e2e8f0;
          padding: 10px 18px;
          font-weight: 600;
          font-size: 14px;
          cursor: pointer;
          border-radius: 8px;
          margin-left: 8px;
          transition: all 0.2s ease;
        }
        .secondary-btn:hover {
          background: #f8fafc;
        }
        .primary-btn.sm, .secondary-btn.sm {
          padding: 4px 10px;
          font-size: 12px;
          border-radius: 6px;
        }

        /* appraiser verdict cards */
        .verdict-banner-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 24px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          position: relative;
          overflow: hidden;
        }
        .verdict-glow-emerald { border-top: 5px solid #10b981; }
        .verdict-glow-amber { border-top: 5px solid #f59e0b; }
        .verdict-glow-red { border-top: 5px solid #ef4444; }

        .verdict-header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 12px;
        }
        .verdict-headline {
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .verdict-badge {
          padding: 4px 12px;
          border-radius: 9999px;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-great { background: #d1fae5; color: #065f46; }
        .badge-fair { background: #fef3c7; color: #92400e; }
        .badge-pass { background: #f3f4f6; color: #374151; }
        .badge-avoid { background: #fee2e2; color: #991b1b; }

        .verdict-reason {
          font-size: 14px;
          line-height: 1.6;
          color: #334155;
          margin: 0 0 16px 0;
        }

        /* repair issues listing */
        .repairs-box {
          border-top: 1px dashed #e2e8f0;
          padding-top: 14px;
          margin-top: 14px;
        }
        .repairs-title {
          font-size: 13px;
          font-weight: 700;
          color: #ef4444;
          display: flex;
          align-items: center;
          gap: 6px;
          margin-bottom: 8px;
        }
        .repairs-list {
          margin: 0;
          padding-left: 20px;
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }

        /* component directory and custom cards */
        .components-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 12px;
        }
        .component-upgrade-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 14px 18px;
          transition: all 0.2s ease;
        }
        .component-upgrade-card:hover {
          border-color: #cbd5e1;
        }
        .component-upgrade-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }
        .component-tag {
          font-weight: 700;
          font-size: 13px;
          color: #334155;
        }
        .component-value-badge {
          font-size: 12px;
          font-weight: 600;
          color: #10b981;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .upgraded-flair {
          background: #dbeafe;
          color: #2563eb;
          font-size: 9px;
          padding: 1px 4px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .component-upgrade-body {
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 13px;
          color: #475569;
        }
        .upgrade-edit-trigger {
          background: none;
          border: none;
          color: #2563eb;
          font-weight: 600;
          cursor: pointer;
          font-size: 12px;
          padding: 0;
          text-decoration: underline;
        }
        .component-upgrade-form {
          margin-top: 8px;
        }
        .upgrade-actions {
          display: flex;
          align-items: center;
          gap: 6px;
          margin-top: 8px;
        }
        .hint-text {
          font-size: 10px;
          color: #94a3b8;
        }
        .error-hint {
          color: #ef4444;
          font-size: 11px;
          margin-top: 4px;
        }

        /* sidebar tables */
        .metrics-table {
          width: 100%;
          border-collapse: collapse;
        }
        .metrics-table td {
          padding: 8px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 13px;
        }
        .metrics-table tr:last-child td {
          border-bottom: none;
        }
        .metrics-table td.label {
          color: #64748b;
          font-weight: 600;
        }
        .metrics-table td.value {
          text-align: right;
          font-weight: 700;
          color: #0f172a;
        }

        /* Kelley Blue Book components */
        .kbb-percentile-grid {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 8px;
          margin-bottom: 18px;
        }
        .kbb-percentile-card {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px;
          text-align: center;
        }
        .kbb-percentile-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 4px;
        }
        .kbb-percentile-value {
          font-size: 14px;
          font-weight: 800;
          color: #0f172a;
        }

        /* KBB Index Clearing Meter HUD */
        .clearing-meter-container {
          margin-top: 14px;
          padding-bottom: 8px;
        }
        .clearing-meter-bar {
          height: 10px;
          border-radius: 9999px;
          position: relative;
          background: linear-gradient(to right, #10b981 0%, #10b981 30%, #3b82f6 30%, #3b82f6 70%, #ef4444 70%, #ef4444 100%);
          margin-bottom: 14px;
        }
        .clearing-meter-pointer {
          position: absolute;
          top: -4px;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          background: #0f172a;
          border: 3px solid #ffffff;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2), 0 0 8px rgba(15, 23, 42, 0.4);
          transform: translateX(-50%);
          transition: left 0.3s ease;
        }
        .clearing-meter-labels {
          display: flex;
          justify-content: space-between;
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          margin-bottom: 8px;
        }
        .meter-label-left { color: #10b981; }
        .meter-label-center { color: #3b82f6; }
        .meter-label-right { color: #ef4444; }

        .confidence-badge {
          display: inline-block;
          font-size: 10px;
          font-weight: 700;
          padding: 2px 8px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .confidence-high { background: #d1fae5; color: #065f46; border: 1px solid #a7f3d0; }
        .confidence-medium { background: #e0f2fe; color: #0369a1; border: 1px solid #bae6fd; }
        .confidence-low { background: #fef3c7; color: #92400e; border: 1px solid #fde68a; }

        /* Scraped Transactions Table */
        .scraped-table-container {
          max-height: 280px;
          overflow-y: auto;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          margin-top: 10px;
        }
        .scraped-table {
          width: 100%;
          border-collapse: collapse;
          font-size: 12px;
          text-align: left;
        }
        .scraped-table th {
          background: #f8fafc;
          padding: 8px 12px;
          font-weight: 700;
          color: #475569;
          border-bottom: 1px solid #e2e8f0;
          position: sticky;
          top: 0;
          z-index: 10;
        }
        .scraped-table td {
          padding: 10px 12px;
          border-bottom: 1px solid #f1f5f9;
          color: #334155;
          vertical-align: middle;
        }
        .scraped-table tr:last-child td {
          border-bottom: none;
        }
        .platform-badge {
          font-size: 9px;
          font-weight: 800;
          padding: 1px 6px;
          border-radius: 4px;
          text-transform: uppercase;
        }
        .platform-ebay { background: #e0f2fe; color: #0369a1; }
        .platform-pinkbike { background: #fce7f3; color: #9d174d; }
        .platform-other { background: #f1f5f9; color: #475569; }

        /* Loader HUD */
        .loader-overlay {
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          padding: 60px 20px;
        }
        .spinner {
          width: 48px;
          height: 48px;
          border: 4px solid #e2e8f0;
          border-top-color: #0f172a;
          border-radius: 50%;
          animation: spin 1s linear infinite;
          margin-bottom: 20px;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .loading-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin-bottom: 6px;
        }
        .loading-desc {
          font-size: 13px;
          color: #64748b;
        }

        /* Rules card style list */
        .rules-list {
          margin: 0;
          padding-left: 18px;
          font-size: 12px;
          color: #475569;
          line-height: 1.6;
        }
        .rules-list li {
          margin-bottom: 6px;
        }
      `}</style>

      {/* ── Cohesive Header ───────────────────────────────────────── */}
      <div className="analyzer-nav">
        <Link href="/all" className="analyzer-logo">
          🚲 VeloStack
        </Link>
        <div className="analyzer-nav-links">
          <Link href="/all" className="analyzer-nav-link">Directory</Link>
          <Link href="/analyzer" className="analyzer-nav-link active">Analyzer</Link>
          <Link href="/tracker" className="analyzer-nav-link">Tracker</Link>
          <Link href="/extractor" className="analyzer-nav-link">Extractor</Link>
          <Link href="/mechanic" className="analyzer-nav-link">Mechanic</Link>
          <Link href="/ledger" className="analyzer-nav-link">Ledger</Link>
          <Link href="/settings" className="analyzer-nav-link">Sniper</Link>`n 5eca781ffb80a3ccb308188a9f84955d38eeea87
                {error && (
                  <div style={{ border: "1px solid #fecaca", backgroundColor: "#fef2f2", color: "#991b1b", padding: "12px", borderRadius: "8px", marginBottom: "18px", fontSize: "13px" }}>
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <div style={{ marginTop: "24px" }}>
                  <button type="submit" className="primary-btn" disabled={loading}>
                    Appraise & Gather Market Data
                  </button>
                  <button type="button" className="secondary-btn" onClick={handleReset}>
                    Clear Fields
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* RESULTS THREAD VIEW */}
        {result && !loading && (
          <div className="space-y-6">
            {/* Elegant Tab Toggles */}
            <div className="flex border-b border-slate-200 gap-2 mb-2">
              <button
                onClick={() => setAppraisalTab("whole")}
                className={`py-3 px-6 font-bold text-sm border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  appraisalTab === "whole"
                    ? "border-indigo-600 text-indigo-600 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>🚲</span> Complete Bike Valuation
              </button>
              <button
                onClick={() => setAppraisalTab("partout")}
                className={`py-3 px-6 font-bold text-sm border-b-2 transition-all duration-200 flex items-center gap-2 cursor-pointer ${
                  appraisalTab === "partout"
                    ? "border-indigo-600 text-indigo-600 font-extrabold"
                    : "border-transparent text-slate-400 hover:text-slate-600 hover:border-slate-300"
                }`}
              >
                <span>🔧</span> Part-Out Teardown Calculator
              </button>
            </div>

            {appraisalTab === "whole" ? (
              <div className="analyzer-grid">`n 5eca781ffb80a3ccb308188a9f84955d38eeea87
            
            {/* Left Content Pane */}
            <div className="analyzer-left-pane">
              
              {/* Appraiser AI Verdict Card */}
              <div className={`verdict-banner-card ${
                result.verdict === "GREAT FLIP" ? "verdict-glow-emerald" :
                result.verdict === "FAIR DEAL" ? "verdict-glow-amber" :
                "verdict-glow-red"
              }`}>
                <div className="verdict-header-row">
                  <h1 className="verdict-headline">{form.title}</h1>
                  <span className={`verdict-badge ${
                    result.verdict === "GREAT FLIP" ? "badge-great" :
                    result.verdict === "FAIR DEAL" ? "badge-fair" :
                    result.verdict === "PASS" ? "badge-pass" :
                    "badge-avoid"
                  }`}>
                    {result.verdict}
                  </span>
                </div>
                
                <p className="verdict-reason">
                  <strong>AI Appraiser Valuation:</strong> {result.verdictReason}
                </p>

                {result.detectedIssues && result.detectedIssues.length > 0 ? (
                  <div className="repairs-box">
                    <div className="repairs-title">
                      🔧 Required Mechanical Repairs
                    </div>
                    <ul className="repairs-list">
                      {result.detectedIssues.map((issue, idx) => (
                        <li key={idx}>
                          <strong>{issue.part}</strong>: {issue.issue} (Estimated parts cost: <strong>€{issue.estimatedCost}</strong>)
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : (
                  <div className="repairs-box" style={{ borderColor: "#d1fae5", borderTopStyle: "solid" }}>
                    <div className="repairs-title" style={{ color: "#10b981" }}>
                      ✔ Clean Bill of Health
                    </div>
                    <p style={{ margin: 0, fontSize: "12px", color: "#475569" }}>
                      No active mechanical damages or worn drivetrain components were parsed in the text description.
                    </p>
                  </div>
                )}
              </div>

              {/* Scraped Transactions Sub-Ledger */}
              {marketData && (
                <div className="modern-card">
                  <div className="modern-card-title">
                    📈 Empirical Completed Sales Data (eBay & Pinkbike)
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b", margin: "-6px 0 14px 0" }}>
                    Showing {marketData.sampleSize} cleared transaction matches harvested in real-time.
                  </p>
                  
                  <div className="scraped-table-container">
                    <table className="scraped-table">
                      <thead>
                        <tr>
                          <th>Platform</th>
                          <th>Completed Listing Item</th>
                          <th>Condition</th>
                          <th>Sale Date</th>
                          <th style={{ textAlign: "right" }}>Cleared Value</th>
                        </tr>
                      </thead>
                      <tbody>
                        {marketData.transactions.map((tx, idx) => (
                          <tr key={idx}>
                            <td>
                              <span className={`platform-badge ${
                                tx.platform.toLowerCase() === "ebay" ? "platform-ebay" :
                                tx.platform.toLowerCase() === "pinkbike" ? "platform-pinkbike" :
                                "platform-other"
                              }`}>
                                {tx.platform}
                              </span>
                            </td>
                            <td style={{ fontWeight: 500, maxWidth: 220, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }} title={tx.title}>
                              {tx.title}
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", color: "#475569" }}>{tx.condition}</span>
                            </td>
                            <td>
                              <span style={{ fontSize: "11px", color: "#64748b" }}>{tx.date}</span>
                            </td>
                            <td style={{ textAlign: "right", fontWeight: 700, color: "#0f172a" }}>
                              €{Math.round(tx.price)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Component breakdown Upgrade Directory */}
              <div className="modern-card">
                <div className="modern-card-title">
                  🛠 Component Appraisal & Upgrade Simulator
                </div>
                <p style={{ fontSize: "12px", color: "#64748b", margin: "-6px 0 16px 0" }}>
                  Adjust component tiers on-the-fly to calculate how upgrades impact investment ROI and estimated resale returns.
                </p>
                
                <div className="components-grid">
                  {componentTypes.map(({ type, label }) => {
                    const originalComp = localComponents.find(c => c.type.toLowerCase().includes(type.toLowerCase()));
                    const upgradedInfo = upgrades[type.toLowerCase()];

                    return (
                      <ComponentCard
                        key={type}
                        label={label}
                        type={type}
                        upgradedInfo={upgradedInfo}
                        originalComp={originalComp}
                        onUpgrade={handleComponentUpgrade}
                      />
                    );
                  })}
                </div>
              </div>

            </div>

            {/* Right Sidebar Pane */}
            <div className="analyzer-right-pane">
              
              {/* Reset Submit button */}
              <button 
                className="primary-btn" 
                onClick={handleReset}
                style={{ width: "100%", padding: "12px", fontSize: "14px", background: "#ef4444", marginBottom: "20px", display: "block" }}
              >
                Appraise Another Listing
              </button>

              {/* Valuation stats grid */}
              <div className="modern-card">
                <div className="modern-card-title">
                  📊 Investment Statistics
                </div>
                <table className="metrics-table">
                  <tbody>
                    <tr>
                      <td className="label">Dynamic Profit</td>
                      <td className="value" style={{ color: profitColor, fontSize: "16px" }}>
                        €{Math.round(dynamicProfit)}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Resale Estimate</td>
                      <td className="value">€{Math.round(dynamicResaleValue)}</td>
                    </tr>
                    <tr>
                      <td className="label">Total Investment</td>
                      <td className="value">
                        €{Math.round(upgradedInvestment)}
                        <div style={{ fontSize: "9px", color: "#64748b", fontWeight: "normal", marginTop: 2 }}>
                          Base €{form.askingPrice} + Repairs €{Math.round(baseRepairCost)} + Upgrades €{Math.round(upgradesTotal)}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Appraiser Confidence</td>
                      <td className="value">
                        {Math.round(result.confidence * 100)}%
                        <div style={{ fontSize: "9px", color: result.confidence > 0.6 ? "#10b981" : "#ef4444", fontWeight: "normal", marginTop: 2 }}>
                          {result.confidence > 0.6 ? "Excellent Data Coverage" : "Valuation estimate volatile"}
                        </div>
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Clearing Bracket</td>
                      <td className="value" style={{ textTransform: "capitalize" }}>
                        {result.bikeTier ? `${result.bikeTier.brand} (${result.bikeTier.tier})` : "Generic"}
                      </td>
                    </tr>
                    <tr>
                      <td className="label">Pricing Sentiment</td>
                      <td className="value" style={{ 
                        textTransform: "capitalize", 
                        color: result.priceVsMarket === "below" ? "#10b981" : result.priceVsMarket === "above" ? "#ef4444" : "#64748b" 
                      }}>
                        {result.priceVsMarket} market value
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>

              {/* 📍 Local Arbitrage & Liquidity Index HUD */}
              {result && (
                <div className="modern-card" style={{ position: "relative", overflow: "hidden" }}>
                  {result.isVerdictDowngraded && (
                    <div style={{
                      position: "absolute",
                      top: 0,
                      left: 0,
                      width: "4px",
                      height: "100%",
                      backgroundColor: "#ef4444"
                    }} />
                  )}
                  <div className="modern-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>📍 Local Arbitrage Index</span>
                    <span style={{
                      fontSize: "9px",
                      fontWeight: 800,
                      padding: "1px 6px",
                      borderRadius: "4px",
                      textTransform: "uppercase",
                      backgroundColor: result.liquidityScore === "high" ? "#d1fae5" : result.liquidityScore === "medium" ? "#e0f2fe" : "#fee2e2",
                      color: result.liquidityScore === "high" ? "#065f46" : result.liquidityScore === "medium" ? "#0369a1" : "#991b1b",
                    }}>
                      {result.liquidityScore} turn
                    </span>
                  </div>

                  <p style={{ fontSize: "11px", color: "#64748b", margin: "-6px 0 14px 0" }}>
                    Market Archetype: <strong style={{ color: "#334155", textTransform: "capitalize" }}>{result.marketProfile}</strong>
                    {result.location && ` (${result.location})`}
                  </p>

                  {/* Estimated Days on Market Gauge */}
                  <div style={{ marginBottom: "20px", textAlign: "center" }}>
                    <div style={{ fontSize: "32px", fontWeight: 800, color: "#0f172a", letterSpacing: "-1px" }}>
                      {result.estimatedDaysOnMarket} <span style={{ fontSize: "14px", fontWeight: 600, color: "#64748b" }}>days</span>
                    </div>
                    <div style={{ fontSize: "11px", fontWeight: 600, color: "#475569", marginTop: "-2px" }}>
                      Estimated Days on Market
                    </div>
                    
                    {/* CSS bar gauge */}
                    <div style={{ 
                      height: "8px", 
                      borderRadius: "9999px", 
                      backgroundColor: "#f1f5f9", 
                      position: "relative",
                      marginTop: "12px",
                      overflow: "hidden"
                    }}>
                      <div style={{
                        height: "100%",
                        width: `${Math.min(100, (result.estimatedDaysOnMarket / 60) * 100)}%`,
                        backgroundColor: result.estimatedDaysOnMarket <= 20 ? "#10b981" : result.estimatedDaysOnMarket <= 40 ? "#3b82f6" : "#ef4444",
                        borderRadius: "9999px",
                        transition: "width 0.3s ease"
                      }} />
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", fontWeight: 700, color: "#94a3b8", marginTop: "4px" }}>
                      <span>FAST (&le;20d)</span>
                      <span>MODERATE</span>
                      <span>SLOW (&gt;40d)</span>
                    </div>
                  </div>

                  {/* Modifiers breakdown table */}
                  <table className="metrics-table" style={{ marginTop: "10px", borderTop: "1px dashed #e2e8f0" }}>
                    <tbody>
                      <tr>
                        <td className="label" style={{ fontSize: "12px" }}>Base Resale Value</td>
                        <td className="value" style={{ fontSize: "12px" }}>€{Math.round(result.originalResalePrice)}</td>
                      </tr>
                      <tr>
                        <td className="label" style={{ fontSize: "12px" }}>Regional Modifier</td>
                        <td className="value" style={{ 
                          fontSize: "12px", 
                          color: result.priceModifierPercent > 0 ? "#10b981" : result.priceModifierPercent < 0 ? "#ef4444" : "#64748b" 
                        }}>
                          {result.priceModifierPercent > 0 ? `+${result.priceModifierPercent}%` : `${result.priceModifierPercent}%`}
                          {result.priceModifierPercent !== 0 && (
                            <span style={{ fontSize: "10px", fontWeight: "normal", color: "#64748b", marginLeft: "4px" }}>
                              ({result.priceModifierPercent > 0 ? `+€${Math.round(result.originalResalePrice * result.priceModifierPercent / 100)}` : `-€${Math.round(Math.abs(result.originalResalePrice * result.priceModifierPercent / 100))}`})
                            </span>
                          )}
                        </td>
                      </tr>
                      <tr>
                        <td className="label" style={{ fontSize: "12px" }}>Days modifier</td>
                        <td className="value" style={{ 
                          fontSize: "12px",
                          color: result.daysOnMarketModifierPercent < 0 ? "#10b981" : result.daysOnMarketModifierPercent > 0 ? "#ef4444" : "#64748b"
                        }}>
                          {result.daysOnMarketModifierPercent > 0 ? `+${result.daysOnMarketModifierPercent}%` : `${result.daysOnMarketModifierPercent}%`}
                        </td>
                      </tr>
                    </tbody>
                  </table>

                  {/* Verdict Downgraded Alert Banner */}
                  {result.isVerdictDowngraded && (
                    <div style={{ 
                      marginTop: "16px", 
                      padding: "10px 12px", 
                      borderRadius: "8px", 
                      backgroundColor: "#fef2f2", 
                      border: "1px solid #fecaca",
                      fontSize: "11px",
                      color: "#991b1b",
                      lineHeight: "1.4"
                    }}>
                      <strong>⚠️ High Liquidity Holding Risk:</strong> Capital recovery timeline exceeds 45 days. Verdict auto-downgraded from <strong>GREAT FLIP</strong> to <strong>FAIR DEAL</strong>.
                    </div>
                  )}
                </div>
              )}
`n 5eca781ffb80a3ccb308188a9f84955d38eeea87

      </div>
    </main>
  );
}

