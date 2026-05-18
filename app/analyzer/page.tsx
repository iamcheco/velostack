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

// ── Comment Node Component ─────────────────────────────────────
function CommentNode({
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
    <div className="reddit-comment">
      <div className="reddit-comment-meta">
        <span className="reddit-comment-meta-user">/u/component_bot_{type}</span>{" "}
        <span style={{ fontWeight: "bold", color: valueToShow ? "#2ecc71" : "#888" }}>
          {valueToShow ? `+€${valueToShow} value` : "€0 value"}
        </span>{" "}
        {isUpgraded && <span className="reddit-flair reddit-flair-upgraded">upgraded</span>}{" "}
        <span style={{ color: "#888" }}>3 minutes ago</span>
      </div>
      
      {editing ? (
        <div style={{ marginTop: 6, maxWidth: 450 }}>
          <input
            className="reddit-form-input"
            type="text"
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
              if (e.key === "Escape") setEditing(false);
            }}
            disabled={loadingPrice}
            autoFocus
            placeholder={`Enter new ${label.toLowerCase()} model...`}
          />
          {errorText && <div style={{ color: "#e74c3c", fontSize: 10, marginTop: 4 }}>{errorText}</div>}
          <div style={{ display: "flex", gap: 6, marginTop: 6, alignItems: "center" }}>
            <button 
              className="reddit-btn-submit" 
              onClick={handleSave} 
              disabled={loadingPrice}
              style={{ padding: "3px 8px", fontSize: 10 }}
            >
              {loadingPrice ? "Searching..." : "save"}
            </button>
            <button 
              className="reddit-btn-reset" 
              onClick={() => setEditing(false)} 
              disabled={loadingPrice}
              style={{ padding: "3px 8px", fontSize: 10, marginLeft: 0 }}
            >
              cancel
            </button>
            <span style={{ fontSize: 10, color: "#888", marginLeft: 4 }}>Press Enter to search market</span>
          </div>
        </div>
      ) : (
        <>
          <div className="reddit-comment-body">
            <strong>{label}:</strong> {nameToShow}
          </div>
          <div className="reddit-comment-footer">
            <span style={{ color: "#369" }}>permalink</span>
            <span style={{ color: "#369" }}>embed</span>
            <span style={{ color: "#369" }}>save</span>
            <span style={{ color: "#369" }}>parent</span>
            <span 
              style={{ color: "#ff4500", textDecoration: "underline", cursor: "pointer" }} 
              onClick={() => {
                setInputValue(nameToShow === "Not specified" ? "" : nameToShow);
                setEditing(true);
              }}
            >
              [edit/upgrade]
            </span>
            <span style={{ color: "#369" }}>reply</span>
          </div>
        </>
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
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [localComponents, setLocalComponents] = useState<ExtractedComponent[]>([]);
  const [upgrades, setUpgrades] = useState<Record<string, { name: string; price: number }>>({});
  
  // Upvotes state for the Reddit post upvote/downvote mockup
  const [upvotes, setUpvotes] = useState(128);
  const [userVote, setUserVote] = useState<"up" | "down" | null>(null);

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
      setUpgrades({}); // Clear any previous upgrades
      setUpvotes(Math.floor(Math.random() * 50) + 80);
      setUserVote(null);
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
    setUpgrades({});
  };

  const handleComponentUpgrade = (type: string, newName: string, newPriceEur: number) => {
    setUpgrades(prev => ({
      ...prev,
      [type.toLowerCase()]: { name: newName, price: newPriceEur }
    }));
  };

  // Upvote / downvote click handlers
  const handleUpvote = () => {
    if (userVote === "up") {
      setUserVote(null);
      setUpvotes(prev => prev - 1);
    } else if (userVote === "down") {
      setUserVote("up");
      setUpvotes(prev => prev + 2);
    } else {
      setUserVote("up");
      setUpvotes(prev => prev + 1);
    }
  };

  const handleDownvote = () => {
    if (userVote === "down") {
      setUserVote(null);
      setUpvotes(prev => prev + 1);
    } else if (userVote === "up") {
      setUserVote("down");
      setUpvotes(prev => prev - 2);
    } else {
      setUserVote("down");
      setUpvotes(prev => prev - 1);
    }
  };

  // Calculations
  const askingPriceNum = parseFloat(form.askingPrice) || 0;
  const baseRepairCost = result?.estimatedRepairCost || 0;
  const baseInvestment = result ? askingPriceNum + baseRepairCost : 0;
  
  // Total cost of all upgrades
  const upgradesTotal = Object.values(upgrades).reduce((sum, item) => sum + item.price, 0);
  const upgradedInvestment = baseInvestment + upgradesTotal;

  const currentEstimatedResale = result?.estimatedResalePrice || 0;
  // Dynamic resale: base resale + (total upgrades * 0.5)
  const dynamicResaleValue = currentEstimatedResale + (upgradesTotal * 0.5);
  const dynamicProfit = dynamicResaleValue - upgradedInvestment;

  const profitColor = dynamicProfit >= 80 ? "#2ecc71" : dynamicProfit >= 25 ? "#f39c12" : "#e74c3c";

  // Component Types list to render in order
  const componentTypes = [
    { type: "saddle", label: "Saddle" },
    { type: "handlebars", label: "Cockpit" },
    { type: "brakes", label: "Brakes" },
    { type: "frame", label: "Frame" },
    { type: "fork", label: "Fork" },
    { type: "wheels", label: "Rear Wheel" },
    { type: "drivetrain", label: "Drivetrain" }
  ];

  return (
    <main className="reddit-page">
      {/* ── Embedded Reddit Stylesheet ─────────────────────────────── */}
      <style jsx global>{`
        .reddit-page {
          font-family: Verdana, Arial, Helvetica, sans-serif !important;
          font-size: 12px !important;
          color: #222 !important;
          background-color: #ffffff !important;
          min-height: 100vh;
          padding: 0;
          margin: 0;
        }

        .reddit-top-bar {
          background-color: #f0f0f0;
          border-bottom: 1px solid #e0e0e0;
          font-size: 10px;
          color: #555;
          padding: 4px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .reddit-sr-list a {
          color: #555;
          text-decoration: none;
          margin-right: 5px;
        }
        .reddit-sr-list a:hover {
          text-decoration: underline;
        }

        .reddit-header {
          background-color: #cee3f8;
          border-bottom: 1px solid #5f99cf;
          padding: 15px 20px 0 20px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 70px;
          position: relative;
        }

        .reddit-header-logo-container {
          display: flex;
          align-items: flex-end;
          margin-bottom: 5px;
          gap: 10px;
        }

        .reddit-logo-text {
          font-size: 22px;
          font-weight: bold;
          color: #55585a;
          text-decoration: none;
        }

        .reddit-sub-title {
          font-size: 18px;
          color: #555;
          font-weight: normal;
        }

        .reddit-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: -1px;
          padding-left: 10px;
        }

        .reddit-tab {
          background-color: #eff7ff;
          border: 1px solid #5f99cf;
          border-bottom: none;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: bold;
          color: #555;
          text-decoration: none;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
        }

        .reddit-tab.active {
          background-color: #ffffff;
          border-bottom: 1px solid #ffffff;
          color: #ff4500 !important; /* reddit orange */
        }

        .reddit-main {
          display: flex;
          padding: 15px;
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
          align-items: start;
        }

        .reddit-content {
          flex: 1;
          min-width: 0;
        }

        .reddit-sidebar {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }

        .reddit-sidebox {
          background-color: #f4f9fd;
          border: 1px solid #cee3f8;
          border-radius: 4px;
          padding: 12px;
        }

        .reddit-sidebox-title {
          font-size: 11px;
          font-weight: bold;
          color: #336699;
          border-bottom: 1px solid #cee3f8;
          padding-bottom: 4px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }

        .reddit-post {
          display: flex;
          gap: 10px;
          padding: 8px;
          margin-bottom: 15px;
          background: #ffffff;
        }

        .reddit-post-voting {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 35px;
          font-size: 11px;
          font-weight: bold;
          color: #c0c0c0;
          user-select: none;
        }

        .reddit-arrow-up, .reddit-arrow-down {
          cursor: pointer;
          font-size: 20px;
          color: #c0c0c0;
          transition: color 0.1s ease;
          line-height: 1;
        }
        .reddit-arrow-up:hover, .reddit-arrow-up.active {
          color: #ff4500;
        }
        .reddit-arrow-down:hover, .reddit-arrow-down.active {
          color: #5f99cf;
        }

        .reddit-post-body {
          flex: 1;
        }

        .reddit-post-title {
          font-size: 16px;
          color: #0000ff;
          text-decoration: underline;
          margin: 0 0 4px 0;
          font-weight: normal;
        }

        .reddit-post-meta {
          font-size: 10px;
          color: #888;
          margin-bottom: 8px;
        }

        .reddit-post-meta a {
          color: #369;
          text-decoration: none;
        }
        .reddit-post-meta a:hover {
          text-decoration: underline;
        }

        .reddit-post-text {
          background-color: #fafafa;
          border: 1px solid #eef2f7;
          border-radius: 4px;
          padding: 12px 16px;
          font-size: 12px;
          line-height: 1.5;
          color: #333;
          white-space: pre-wrap;
        }

        .reddit-post-footer {
          font-size: 11px;
          font-weight: bold;
          color: #888;
          margin-top: 6px;
          display: flex;
          gap: 10px;
        }

        .reddit-post-footer span {
          cursor: pointer;
        }
        .reddit-post-footer span:hover {
          color: #222;
        }

        .reddit-comment-section {
          border-top: 1px solid #ddd;
          margin-top: 15px;
          padding-top: 15px;
        }

        .reddit-comments-title {
          font-size: 14px;
          font-weight: bold;
          color: #222;
          margin-bottom: 12px;
        }

        .reddit-comment {
          border-left: 1px dotted #ccc;
          padding-left: 12px;
          margin-bottom: 15px;
          margin-top: 8px;
        }

        .reddit-comment-meta {
          font-size: 10px;
          color: #888;
          margin-bottom: 4px;
        }

        .reddit-comment-meta-user {
          font-weight: bold;
          color: #369;
        }

        .reddit-comment-body {
          font-size: 12px;
          line-height: 1.4;
          color: #222;
          margin-top: 4px;
        }

        .reddit-comment-footer {
          font-size: 10px;
          color: #888;
          margin-top: 4px;
          display: flex;
          gap: 8px;
          font-weight: bold;
        }

        .reddit-comment-footer span {
          cursor: pointer;
        }
        .reddit-comment-footer span:hover {
          color: #222;
        }

        .reddit-form {
          background-color: #fafafa;
          border: 1px solid #dbdbdb;
          border-radius: 4px;
          padding: 20px;
        }

        .reddit-form-group {
          margin-bottom: 15px;
        }

        .reddit-form-label {
          display: block;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 5px;
          color: #333;
        }

        .reddit-form-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-family: Verdana, sans-serif;
          font-size: 12px;
          box-sizing: border-box;
        }

        .reddit-form-input:focus {
          border-color: #5f99cf;
          outline: none;
        }

        .reddit-btn-submit {
          background-color: #5f99cf;
          color: white;
          border: 1px solid #3f79af;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 11px;
          cursor: pointer;
          border-radius: 3px;
        }

        .reddit-btn-submit:hover {
          background-color: #3f79af;
        }

        .reddit-btn-submit:disabled {
          background-color: #ccc;
          border-color: #bbb;
          cursor: not-allowed;
        }

        .reddit-btn-reset {
          background-color: #f0f0f0;
          color: #333;
          border: 1px solid #ccc;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 11px;
          cursor: pointer;
          border-radius: 3px;
          margin-left: 8px;
        }

        .reddit-btn-reset:hover {
          background-color: #e0e0e0;
          border-color: #bbb;
        }

        .reddit-flair {
          padding: 1px 4px;
          font-size: 9px;
          border-radius: 2px;
          font-weight: normal;
          display: inline-block;
          margin-left: 4px;
          text-transform: uppercase;
        }

        .reddit-flair-upgraded {
          background-color: #e8f4fd;
          color: #1da1f2;
          border: 1px solid #b3d9ff;
        }

        .reddit-flair-great {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }

        .reddit-flair-fair {
          background-color: #fff3cd;
          color: #856404;
          border: 1px solid #ffeeba;
        }

        .reddit-flair-pass {
          background-color: #e2e3e5;
          color: #383d41;
          border: 1px solid #d6d8db;
        }

        .reddit-flair-avoid {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }

        .reddit-sticky-comment {
          background-color: #f9fff9;
          border-left: 2px solid #5fcf5f !important;
          padding: 10px 12px;
          border: 1px solid #dbeddb;
          border-radius: 4px;
          margin-bottom: 15px;
        }

        .reddit-mod-tag {
          color: #228822;
          font-weight: bold;
          margin-left: 4px;
        }

        .reddit-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading-pulse 1.5s infinite;
          border-radius: 4px;
        }

        @keyframes loading-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .reddit-side-metrics-table {
          width: 100%;
          border-collapse: collapse;
          margin-top: 5px;
        }

        .reddit-side-metrics-table td {
          padding: 6px 0;
          border-bottom: 1px solid #eef2f7;
          font-size: 11px;
        }

        .reddit-side-metrics-table td:first-child {
          color: #666;
          font-weight: bold;
        }

        .reddit-side-metrics-table td:last-child {
          text-align: right;
          font-weight: bold;
          color: #222;
        }
      `}</style>

      {/* ── Top Bar ────────────────────────────────────────────────── */}
      <div className="reddit-top-bar">
        <div className="reddit-sr-list">
          <Link href="/all">MY SUBREDDITS</Link> ▼ | <Link href="/all">POPULAR</Link> | <Link href="/all">ALL</Link> | <Link href="/all">RANDOM</Link> | <Link href="/all">BIKE_FLIP</Link> | <strong>VELOSTACK_ANALYZER</strong>
        </div>
        <div>
          want to join? <Link href="/" style={{ color: "#369", textDecoration: "underline" }}>Login or register</Link> in seconds. | English
        </div>
      </div>

      {/* ── Subreddit Header ───────────────────────────────────────── */}
      <div className="reddit-header">
        <div className="reddit-header-logo-container">
          <Link href="/all" className="reddit-logo-text">VeloStack</Link>
          <span className="reddit-sub-title">/r/velostack_analyzer</span>
        </div>
        <div className="reddit-tabs">
          <Link href="/all" className="reddit-tab">all phases</Link>
          <span className={`reddit-tab active`}>analyzer</span>
          <span className="reddit-tab" style={{ opacity: 0.5, cursor: "not-allowed" }}>tracker</span>
          <span className="reddit-tab" style={{ opacity: 0.5, cursor: "not-allowed" }}>extractor</span>
        </div>
      </div>

      {/* ── Main Layout ────────────────────────────────────────────── */}
      <div className="reddit-main">
        {/* ── Left Content Pane ────────────────────────────────────── */}
        <div className="reddit-content">
          
          {/* SKELETON / LOADING STATE */}
          {loading && (
            <div>
              <div className="reddit-post" style={{ border: "1px solid #e0e0e0", padding: "15px" }}>
                <div className="reddit-post-voting">
                  <div style={{ fontSize: 18 }}>▲</div>
                  <div style={{ margin: "4px 0" }}>••</div>
                  <div style={{ fontSize: 18 }}>▼</div>
                </div>
                <div className="reddit-post-body">
                  <div className="reddit-skeleton" style={{ height: 20, width: "60%", marginBottom: 8 }} />
                  <div className="reddit-skeleton" style={{ height: 12, width: "30%", marginBottom: 15 }} />
                  <div className="reddit-skeleton" style={{ height: 100, width: "100%", marginBottom: 10 }} />
                </div>
              </div>
              <div className="reddit-sticky-comment">
                <div className="reddit-comment-meta">
                  <div className="reddit-skeleton" style={{ height: 12, width: "150px" }} />
                </div>
                <div className="reddit-skeleton" style={{ height: 60, width: "90%", marginTop: 8 }} />
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 15, marginTop: 20 }}>
                {[1, 2, 3].map((i) => (
                  <div key={i} className="reddit-comment" style={{ marginLeft: 0, paddingLeft: 10 }}>
                    <div className="reddit-skeleton" style={{ height: 12, width: "120px", marginBottom: 6 }} />
                    <div className="reddit-skeleton" style={{ height: 24, width: "50%" }} />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* SUBMISSION FORM VIEW (If NO Result and Not Loading) */}
          {!result && !loading && (
            <div>
              <h2 style={{ fontSize: "18px", color: "#336699", borderBottom: "1px solid #5f99cf", paddingBottom: "5px", marginBottom: "15px", fontWeight: "normal" }}>
                Submit to VeloStack Analyzer
              </h2>
              
              <div style={{ display: "flex", gap: "2px", marginBottom: "-1px" }}>
                <span className="reddit-tab active" style={{ borderRadius: "4px 4px 0 0", border: "1px solid #ccc", borderBottom: "1px solid #ffffff", padding: "6px 16px" }}>
                  TEXT POST
                </span>
                <span className="reddit-tab" style={{ borderRadius: "4px 4px 0 0", border: "1px solid #eee", opacity: 0.4, cursor: "not-allowed", padding: "6px 16px" }}>
                  LINK
                </span>
              </div>

              <form onSubmit={handleSubmit} className="reddit-form">
                <div className="reddit-form-group">
                  <label className="reddit-form-label">title</label>
                  <input
                    className="reddit-form-input"
                    type="text"
                    placeholder='e.g. "Trek FX3 2019, 28 Zoll"'
                    value={form.title}
                    onChange={(e) => setForm((f) => ({ ...f, title: e.target.value }))}
                    required
                  />
                  <span style={{ fontSize: "10px", color: "#888" }}>Provide a clean title for the bike classified listing.</span>
                </div>

                <div className="reddit-form-group">
                  <label className="reddit-form-label">text (optional)</label>
                  <textarea
                    className="reddit-form-input"
                    rows={8}
                    style={{ resize: "vertical" }}
                    placeholder="Paste the full classified description here (components, condition, issues)..."
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                  />
                  <span style={{ fontSize: "10px", color: "#888" }}>Our AI will parse this description to extract individual components and list issues.</span>
                </div>

                <div className="reddit-form-group">
                  <label className="reddit-form-label">asking price (€)</label>
                  <input
                    className="reddit-form-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 280"
                    value={form.askingPrice}
                    onChange={(e) => setForm((f) => ({ ...f, askingPrice: e.target.value }))}
                    required
                  />
                  <span style={{ fontSize: "10px", color: "#888" }}>Required for ROI and flip calculations.</span>
                </div>

                {error && (
                  <div style={{ border: "1px solid #f5c6cb", backgroundColor: "#f8d7da", color: "#721c24", padding: "10px", borderRadius: "3px", marginBottom: "15px" }}>
                    <strong>Error:</strong> {error}
                  </div>
                )}

                <div style={{ marginTop: "15px" }}>
                  <button type="submit" className="reddit-btn-submit" disabled={loading}>
                    {loading ? "analyzing..." : "analyze listing"}
                  </button>
                  <button type="button" className="reddit-btn-reset" onClick={handleReset}>
                    clear fields
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* POST THREAD VIEW (Once result is loaded and not loading) */}
          {result && !loading && (
            <div>
              {/* Main Post */}
              <div className="reddit-post">
                {/* Voting column */}
                <div className="reddit-post-voting">
                  <span 
                    className={`reddit-arrow-up ${userVote === "up" ? "active" : ""}`}
                    onClick={handleUpvote}
                  >
                    ▲
                  </span>
                  <span style={{ color: userVote === "up" ? "#ff4500" : userVote === "down" ? "#5f99cf" : "#555", margin: "2px 0" }}>
                    {upvotes}
                  </span>
                  <span 
                    className={`reddit-arrow-down ${userVote === "down" ? "active" : ""}`}
                    onClick={handleDownvote}
                  >
                    ▼
                  </span>
                </div>

                {/* Post Contents */}
                <div className="reddit-post-body">
                  <h1 className="reddit-post-title" style={{ textDecoration: "none", color: "#000", fontWeight: "bold" }}>
                    {form.title} — Listing Price: €{form.askingPrice}
                    {result.verdict === "GREAT FLIP" && <span className="reddit-flair reddit-flair-great">great flip</span>}
                    {result.verdict === "FAIR DEAL" && <span className="reddit-flair reddit-flair-fair">fair deal</span>}
                    {result.verdict === "PASS" && <span className="reddit-flair reddit-flair-pass">pass</span>}
                    {result.verdict === "AVOID" && <span className="reddit-flair reddit-flair-avoid">avoid</span>}
                  </h1>
                  <div className="reddit-post-meta">
                    submitted 3 minutes ago by <a href="#user">bike_flipper_pro</a> to <Link href="/analyzer">/r/velostack_analyzer</Link>
                  </div>

                  {form.description ? (
                    <div className="reddit-post-text">
                      {form.description}
                    </div>
                  ) : (
                    <div className="reddit-post-text" style={{ fontStyle: "italic", color: "#888" }}>
                      No listing description provided.
                    </div>
                  )}

                  <div className="reddit-post-footer">
                    <span><strong>12 comments</strong></span>
                    <span>share</span>
                    <span>save</span>
                    <span>hide</span>
                    <span>delete</span>
                    <span>nsfw</span>
                    <span>spoiler</span>
                    <span>crosspost</span>
                  </div>
                </div>
              </div>

              {/* Sticky Moderator AI Verdict Comment */}
              <div className="reddit-sticky-comment">
                <div className="reddit-comment-meta">
                  <span className="reddit-comment-meta-user">AutoModerator</span>
                  <span className="reddit-mod-tag">[M]</span>{" "}
                  <span style={{ color: "#888" }}>[score hidden] 3 minutes ago</span>{" "}
                  <span style={{ color: "#228822", fontWeight: "bold" }}>stickied comment</span>
                </div>
                <div className="reddit-comment-body">
                  <p style={{ margin: "4px 0 8px 0", fontSize: "13px", lineHeight: "1.5" }}>
                    <strong>AI AGENT VERDICT:</strong>{" "}
                    <span 
                      style={{ 
                        fontWeight: "bold", 
                        color: result.verdict === "GREAT FLIP" ? "#2ecc71" : result.verdict === "FAIR DEAL" ? "#f39c12" : "#e74c3c" 
                      }}
                    >
                      {result.verdict}
                    </span>
                    <br />
                    {result.verdictReason}
                  </p>

                  {result.detectedIssues && result.detectedIssues.length > 0 ? (
                    <div style={{ marginTop: 10, borderTop: "1px dashed #cee3f8", paddingTop: 8 }}>
                      <strong style={{ color: "#c0392b" }}>🔧 Detected Repairs Required:</strong>
                      <ul style={{ margin: "6px 0 0 0", paddingLeft: 20, fontSize: "11px", lineHeight: 1.4 }}>
                        {result.detectedIssues.map((issue, idx) => (
                          <li key={idx} style={{ marginBottom: 4 }}>
                            <strong>{issue.part}</strong>: {issue.issue} (Estimated: <strong>€{issue.estimatedCost}</strong>)
                          </li>
                        ))}
                      </ul>
                    </div>
                  ) : (
                    <div style={{ marginTop: 8, color: "#27ae60", fontSize: "11px" }}>
                      ✔ No mechanical issues were explicitly detected in the description.
                    </div>
                  )}
                </div>
                <div className="reddit-comment-footer" style={{ marginTop: 8 }}>
                  <span style={{ color: "#369" }}>permalink</span>
                  <span style={{ color: "#369" }}>parent</span>
                  <span style={{ color: "#369" }}>source</span>
                  <span style={{ color: "#369" }}>reply</span>
                </div>
              </div>

              {/* Component Comments section */}
              <div className="reddit-comment-section">
                <div className="reddit-comments-title">
                  all 7 comments
                  <span style={{ fontSize: "10px", color: "#888", fontWeight: "normal", marginLeft: 10 }}>
                    sorted by: <strong>best</strong>
                  </span>
                </div>

                <div style={{ paddingLeft: 5 }}>
                  {componentTypes.map(({ type, label }) => {
                    const originalComp = localComponents.find(c => c.type.toLowerCase().includes(type.toLowerCase()));
                    const upgradedInfo = upgrades[type.toLowerCase()];

                    return (
                      <CommentNode
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
          )}
        </div>

        {/* ── Right Sidebar Pane ────────────────────────────────────── */}
        <div className="reddit-sidebar">
          {/* SEARCH BOX */}
          <div className="reddit-sidebox" style={{ padding: "8px 12px" }}>
            <div style={{ display: "flex", gap: "4px" }}>
              <input
                type="text"
                className="reddit-form-input"
                placeholder="search"
                style={{ padding: "4px 8px", fontSize: "11px" }}
                disabled
              />
              <button className="reddit-btn-submit" style={{ padding: "4px 8px" }} disabled>🔍</button>
            </div>
          </div>

          {/* SUBMIT BUTTONS / RESET */}
          {result && (
            <button 
              className="reddit-btn-submit" 
              onClick={handleReset}
              style={{ width: "100%", padding: "10px", fontSize: "13px", backgroundColor: "#ff4500", borderColor: "#e03d00" }}
            >
              Submit a New Text Post
            </button>
          )}

          {/* SUBREDDIT INFO */}
          <div className="reddit-sidebox">
            <div style={{ fontSize: "15px", fontWeight: "bold", marginBottom: "4px" }}>velostack_analyzer</div>
            <div style={{ fontSize: "10px", color: "#888", marginBottom: "8px" }}>
              <span style={{ color: "#222", fontWeight: "bold" }}>12,402</span> readers | <span style={{ color: "green", fontWeight: "bold" }}>54</span> users here now
            </div>
            
            <div style={{ borderTop: "1px solid #cee3f8", paddingTop: "8px", fontSize: "11px", lineHeight: "1.4", color: "#555" }}>
              The premier subreddit for extracting components, pricing, and diagnosing used bicycle classified listings in real-time.
            </div>
          </div>

          {/* VELOSTACK EVALUATION METRICS PANEL */}
          {result && (
            <div className="reddit-sidebox" style={{ borderColor: "#c3e6cb", backgroundColor: "#f9fff9" }}>
              <div className="reddit-sidebox-title" style={{ color: "#2e7d32", borderBottomColor: "#c3e6cb" }}>
                BIKE EVALUATION METRICS
              </div>
              
              <table className="reddit-side-metrics-table">
                <tbody>
                  <tr>
                    <td>Dynamic Profit</td>
                    <td style={{ color: profitColor, fontSize: "13px" }}>
                      €{Math.round(dynamicProfit)}
                    </td>
                  </tr>
                  <tr>
                    <td>Est. Resale Value</td>
                    <td>€{Math.round(dynamicResaleValue)}</td>
                  </tr>
                  <tr>
                    <td>Total Investment</td>
                    <td>
                      €{Math.round(upgradedInvestment)}
                      <div style={{ fontSize: "9px", color: "#888", fontWeight: "normal" }}>
                        Base €{form.askingPrice} + Parts €{Math.round(upgradesTotal)}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>AI Confidence</td>
                    <td>
                      {Math.round(result.confidence * 100)}%
                      <div style={{ fontSize: "9px", color: result.confidence > 0.6 ? "#27ae60" : "#d35400", fontWeight: "normal" }}>
                        {result.confidence > 0.6 ? "Strong Market Data" : "Weak Market Data"}
                      </div>
                    </td>
                  </tr>
                  <tr>
                    <td>Bike Tier</td>
                    <td style={{ textTransform: "capitalize" }}>
                      {result.bikeTier ? `${result.bikeTier.brand} ${result.bikeTier.type} (${result.bikeTier.tier})` : "Generic"}
                    </td>
                  </tr>
                  <tr>
                    <td>Price vs Market</td>
                    <td style={{ textTransform: "capitalize", color: result.priceVsMarket === "below" ? "#27ae60" : result.priceVsMarket === "above" ? "#c0392b" : "#7f8c8d" }}>
                      {result.priceVsMarket}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          )}

          {/* SUBREDDIT RULES */}
          <div className="reddit-sidebox">
            <div className="reddit-sidebox-title">SUBREDDIT RULES</div>
            <ol style={{ margin: 0, paddingLeft: 15, fontSize: "10px", lineHeight: "1.4", color: "#555" }}>
              <li style={{ marginBottom: 4 }}>Do not post stolen or illegal bicycles.</li>
              <li style={{ marginBottom: 4 }}>Always specify asking price in EUR (€).</li>
              <li style={{ marginBottom: 4 }}>AI appraisals are estimates, not financial advice.</li>
              <li style={{ marginBottom: 4 }}>Verify frame serial numbers before purchase.</li>
            </ol>
          </div>
        </div>
      </div>
    </main>
  );
}
