"use client";

import { useState, useEffect } from "react";
import type { AnalysisResult, ExtractedComponent } from "@/lib/analyzer";
import Link from "next/link";
import PartOutDetails from "./components/PartOutDetails";

// ── Types ──────────────────────────────────────────────────────
interface FormState {
  title: string;
  description: string;
  askingPrice: string;
  location: string;
  marketProfile: "urban" | "mountain" | "flatland" | "standard" | "";
}

// Client-side helper for real-time location archetype hints
function getClientDetectedProfile(location: string) {
  if (!location) return null;
  const loc = location.toLowerCase().trim();

  // ZIP codes
  const usZipMatch = loc.match(/^\b\d{5}\b/);
  if (usZipMatch) {
    const zip = parseInt(usZipMatch[0], 10);
    const prefix = Math.floor(zip / 100);
    if (prefix >= 100 && prefix <= 102) return { label: "Urban Commuter Hub", type: "urban", details: "+10% Road/Gravel Resale, -30% Days on Market" };
    if (prefix >= 320 && prefix <= 349) return { label: "Flat Suburban Sprawl", type: "flatland", details: "-15% Road/Gravel Resale, +50% Days on Market" };
    if ((prefix >= 800 && prefix <= 816) || (prefix >= 840 && prefix <= 847)) return { label: "Mountain Trail Zone", type: "mountain", details: "+15% MTB Resale, -40% Days on Market" };
  }

  const deZipMatch = loc.match(/^\b\d{5}\b/);
  if (deZipMatch) {
    const zipStr = deZipMatch[0];
    if (zipStr.startsWith("80") || zipStr.startsWith("81") || zipStr.startsWith("10") || zipStr.startsWith("11") || zipStr.startsWith("12") || zipStr.startsWith("13") || zipStr.startsWith("14")) {
      return { label: "Urban Commuter Hub", type: "urban", details: "+10% Road/Gravel/City Resale, -30% Days on Market" };
    }
    if (zipStr.startsWith("82") || zipStr.startsWith("83")) {
      return { label: "Mountain Trail Zone", type: "mountain", details: "+15% MTB Resale, -40% Days on Market" };
    }
  }

  // Keywords
  const urbanKeywords = ["london", "munich", "paris", "nyc", "new york", "berlin", "amsterdam", "tokyo", "san francisco", "chicago", "boston", "vienna", "hamburg", "frankfurt"];
  const mountainKeywords = ["denver", "innsbruck", "vancouver", "chamonix", "salt lake", "utah", "colorado", "alps", "seattle", "portland", "whistler", "calgary", "aspen", "boulder"];
  const flatlandKeywords = ["florida", "miami", "houston", "dallas", "phoenix", "orlando", "tampa", "charlotte", "netherlands"];

  if (urbanKeywords.some(kw => loc.includes(kw))) return { label: "Urban Commuter Hub", type: "urban", details: "+10% Road/Gravel/City Resale, -30% Days on Market" };
  if (mountainKeywords.some(kw => loc.includes(kw))) return { label: "Mountain Trail Zone", type: "mountain", details: "+15% MTB Resale, -40% Days on Market" };
  if (flatlandKeywords.some(kw => loc.includes(kw))) return { label: "Flat Suburban Sprawl", type: "flatland", details: "-15% Road/Gravel Resale, +50% Days on Market" };

  return { label: "Standard Baseline Market", type: "standard", details: "No multipliers, baseline days on market" };
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
    marketProfile: "",
  });
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const [marketData, setMarketData] = useState<MarketDataResult | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [localComponents, setLocalComponents] = useState<ExtractedComponent[]>([]);
  const [upgrades, setUpgrades] = useState<Record<string, { name: string; price: number }>>({});
  const [appraisalTab, setAppraisalTab] = useState<"whole" | "partout">("whole");
  
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
          marketProfile: form.marketProfile || undefined,
        }),
      }).then(res => {
        if (!res.ok) throw new Error("Analysis failed");
        return res.json();
      });

      // 2. Fetch completed listings market data with 7-day client cache
      const fetchMarketData = async (): Promise<MarketDataResult> => {
        const cacheKey = form.title.toLowerCase().trim();
        const localCache = localStorage.getItem("vst_market_data_cache");
        let cacheObj: Record<string, CacheEntry> = {};
        
        if (localCache) {
          try {
            cacheObj = JSON.parse(localCache);
            const entry = cacheObj[cacheKey];
            const sevenDays = 7 * 24 * 60 * 60 * 1000;
            if (entry && (Date.now() - entry.timestamp) < sevenDays) {
              console.log("Serving completed sales market index from 7-day client cache:", cacheKey);
              return entry.data;
            }
          } catch (e) {
            console.warn("Failed to parse market cache");
          }
        }

        // Cache miss: execute scraper call
        const marketRes = await fetch("/api/market-data", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            query: form.title,
            category: "bike"
          })
        });
        
        if (!marketRes.ok) throw new Error("Market data retrieval failed");
        const data = await marketRes.json();
        
        // Save to cache
        cacheObj[cacheKey] = {
          timestamp: Date.now(),
          data
        };
        localStorage.setItem("vst_market_data_cache", JSON.stringify(cacheObj));
        return data;
      };

      // Run both calls concurrently to maximize load speeds
      const [analysisResult, marketStats] = await Promise.all([
        analysisPromise,
        fetchMarketData().catch(err => {
          console.warn("Scraper endpoint failed. Falling back gracefully...", err);
          return null;
        })
      ]);

      setResult(analysisResult);
      setLocalComponents(analysisResult.components || []);
      setMarketData(marketStats);
      setUpgrades({});
    } catch (err: any) {
      setError(err.message || "Failed to analyze listings. Please check network parameters.");
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setForm({ title: "", description: "", askingPrice: "", location: "", marketProfile: "" });
    sessionStorage.removeItem("vst_analyzer_form");
    setResult(null);
    setMarketData(null);
    setError(null);
    setLocalComponents([]);
    setUpgrades({});
    setAppraisalTab("whole");
  };

  const handleComponentUpgrade = (type: string, newName: string, newPriceEur: number) => {
    setUpgrades(prev => ({
      ...prev,
      [type.toLowerCase()]: { name: newName, price: newPriceEur }
    }));
  };

  // Pricing calculations
  const askingPriceNum = parseFloat(form.askingPrice) || 0;
  const baseRepairCost = result?.estimatedRepairCost || 0;
  const baseInvestment = result ? askingPriceNum + baseRepairCost : 0;
  
  const upgradesTotal = Object.values(upgrades).reduce((sum, item) => sum + item.price, 0);
  const upgradedInvestment = baseInvestment + upgradesTotal;

  const currentEstimatedResale = result?.estimatedResalePrice || 0;
  const dynamicResaleValue = currentEstimatedResale + (upgradesTotal * 0.5);
  const dynamicProfit = dynamicResaleValue - upgradedInvestment;

  const profitColor = dynamicProfit >= 80 ? "#10b981" : dynamicProfit >= 25 ? "#f59e0b" : "#ef4444";

  // Enforce pricing zone markers based on statistical clearances
  let clearingMeterPercent = 50;
  let priceZone: "Bargain" | "Fair Market" | "Overpriced" | "Unknown" = "Unknown";
  let zoneColor = "#64748b";

  if (marketData && marketData.bargainPrice && marketData.topPrice) {
    const { bargainPrice, medianPrice, topPrice } = marketData;
    
    if (askingPriceNum < bargainPrice) {
      priceZone = "Bargain";
      zoneColor = "#10b981"; // Emerald
      // Map asking price in the lower bounds
      const ratio = askingPriceNum / bargainPrice;
      clearingMeterPercent = Math.max(5, Math.round(ratio * 30));
    } else if (askingPriceNum <= topPrice) {
      priceZone = "Fair Market";
      zoneColor = "#3b82f6"; // Indigo/blue
      // Map asking price linearly between bargain and top
      const range = topPrice - bargainPrice || 1;
      const ratio = (askingPriceNum - bargainPrice) / range;
      clearingMeterPercent = 30 + Math.round(ratio * 40); // Between 30% and 70%
    } else {
      priceZone = "Overpriced";
      zoneColor = "#ef4444"; // Red
      // Map asking price in higher bounds
      const ratio = (askingPriceNum - topPrice) / (topPrice || 1);
      clearingMeterPercent = Math.min(95, 70 + Math.round(ratio * 25));
    }
  }

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
    <main className="analyzer-page-root">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .analyzer-page-root {
          font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* sticky minimalist header */
        .analyzer-nav {
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
        .analyzer-logo {
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .analyzer-nav-links {
          display: flex;
          gap: 4px;
        }
        .analyzer-nav-link {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .analyzer-nav-link:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .analyzer-nav-link.active {
          color: #0f172a;
          background: #f1f5f9;
          font-weight: 700;
        }

        /* standard layout grid */
        .analyzer-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .analyzer-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .analyzer-grid {
            grid-template-columns: 1fr;
          }
        }
        @media (max-width: 640px) {
          .form-row-2col {
            grid-template-columns: 1fr !important;
            gap: 0 !important;
          }
        }

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
          <Link href="/settings" className="analyzer-nav-link">Sniper</Link>
        </div>
      </div>

      {/* ── Main Layout Container ──────────────────────────────────── */}
      <div className="analyzer-container">
        
        {/* SKELETON / LOADER HUD */}
        {loading && (
          <div className="modern-card">
            <div className="loader-overlay">
              <div className="spinner" />
              <div className="loading-title">Analyzing Classified Listing</div>
              <div className="loading-desc">Extracting specifications, evaluating components, and scraping completed sales...</div>
            </div>
          </div>
        )}

        {/* SUBMISSION FORM VIEW (If NO Result and Not Loading) */}
        {!result && !loading && (
          <div className="analyzer-grid" style={{ gridTemplateColumns: "1fr" }}>
            <div className="modern-card">
              <div className="modern-card-title">
                ✨ VeloStack Classified Listing Analyzer & KBB Index
              </div>
              
              <form onSubmit={handleSubmit}>
                <div className="form-group">
                  <label className="form-label">Ad Title</label>
                  <input
                    className="modern-input"
                    type="text"
                    placeholder='e.g. "Trek FX 3 Hybrid Bike 2021"'
                    value={form.title}
                    onChange={(e) => saveFormState({ ...form, title: e.target.value })}
                    required
                  />
                  <span className="input-subtext">Provide the exact model and year from the classified listing for precision scraping.</span>
                </div>

                <div className="form-group">
                  <label className="form-label">Listing Description (optional)</label>
                  <textarea
                    className="modern-input"
                    rows={8}
                    style={{ resize: "vertical" }}
                    placeholder="Paste the complete description containing components, wear issues, and history..."
                    value={form.description}
                    onChange={(e) => saveFormState({ ...form, description: e.target.value })}
                  />
                  <span className="input-subtext">Our appraiser AI will parse this structure to identify repairs and parts upgrades.</span>
                </div>

                <div className="form-group" style={{ maxWidth: 300 }}>
                  <label className="form-label">Asking Price (€)</label>
                  <input
                    className="modern-input"
                    type="number"
                    min="1"
                    step="1"
                    placeholder="e.g. 350"
                    value={form.askingPrice}
                    onChange={(e) => saveFormState({ ...form, askingPrice: e.target.value })}
                    required
                  />
                  <span className="input-subtext">Used to calculate target flip margin and clearing percentiles.</span>
                </div>

                <div className="form-row-2col" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "18px" }}>
                  <div className="form-group">
                    <label className="form-label">Location / ZIP Code</label>
                    <input
                      className="modern-input"
                      type="text"
                      placeholder="e.g. Munich, Florida, Denver, or 80301"
                      value={form.location}
                      onChange={(e) => saveFormState({ ...form, location: e.target.value })}
                    />
                    <span className="input-subtext">Geographic market locator for regional arbitrage modifiers.</span>
                    
                    {/* Live typing auto-detect helper badge */}
                    {form.location && (
                      (() => {
                        const detected = getClientDetectedProfile(form.location);
                        if (!detected) return null;
                        
                        let badgeColor = "#64748b";
                        let badgeBg = "#f1f5f9";
                        if (detected.type === "urban") { badgeColor = "#2563eb"; badgeBg = "#eff6ff"; }
                        else if (detected.type === "mountain") { badgeColor = "#059669"; badgeBg = "#ecfdf5"; }
                        else if (detected.type === "flatland") { badgeColor = "#d97706"; badgeBg = "#fffbeb"; }
                        
                        return (
                          <div style={{ 
                            marginTop: "8px", 
                            padding: "8px 12px", 
                            borderRadius: "6px", 
                            fontSize: "11px", 
                            color: badgeColor, 
                            backgroundColor: badgeBg, 
                            border: `1px solid ${badgeColor}20`,
                            fontWeight: 600,
                            lineHeight: "1.4"
                          }}>
                            ⚡ Auto-Detected: <strong>{detected.label}</strong>
                            <div style={{ fontWeight: "normal", fontSize: "10px", marginTop: "2px", opacity: 0.9 }}>
                              {detected.details}
                            </div>
                          </div>
                        );
                      })()
                    )}
                  </div>

                  <div className="form-group">
                    <label className="form-label">Market Archetype Profile</label>
                    <select
                      className="modern-input"
                      value={form.marketProfile}
                      onChange={(e) => saveFormState({ ...form, marketProfile: e.target.value as any })}
                      style={{ height: "42px" }}
                    >
                      <option value="">Auto-Detect from Location</option>
                      <option value="urban">Urban Commuter Hub (+10% Road/Gravel/City, -30% DOM)</option>
                      <option value="mountain">Mountain Trail Zone (+15% MTB, -40% DOM)</option>
                      <option value="flatland">Flat Suburban Sprawl (-15% Road/Gravel, +50% DOM)</option>
                      <option value="standard">Standard Baseline Market (0% Modifier)</option>
                    </select>
                    <span className="input-subtext">Override or force a specific regional cluster calculation.</span>
                  </div>
                </div>

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
              <div className="analyzer-grid">
            
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

              {/* KBB Empirical Index Card */}
              {marketData && (
                <div className="modern-card">
                  <div className="modern-card-title" style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>📖 Kelley Blue Book Index</span>
                    <span className={`confidence-badge ${
                      marketData.confidence === "high" ? "confidence-high" :
                      marketData.confidence === "medium" ? "confidence-medium" :
                      "confidence-low"
                    }`}>
                      {marketData.confidence} Vol
                    </span>
                  </div>

                  <div className="kbb-percentile-grid">
                    <div className="kbb-percentile-card">
                      <div className="kbb-percentile-label">Bargain</div>
                      <div className="kbb-percentile-value">€{marketData.bargainPrice}</div>
                    </div>
                    <div className="kbb-percentile-card">
                      <div className="kbb-percentile-value" style={{ color: "#3b82f6" }}>€{marketData.medianPrice}</div>
                      <div className="kbb-percentile-label" style={{ fontSize: "8px", marginTop: 2 }}>Median</div>
                    </div>
                    <div className="kbb-percentile-card">
                      <div className="kbb-percentile-label">Top Tier</div>
                      <div className="kbb-percentile-value">€{marketData.topPrice}</div>
                    </div>
                  </div>

                  {/* clearing meter gauge */}
                  <div className="clearing-meter-container">
                    <div className="clearing-meter-labels">
                      <span className="meter-label-left">Bargain</span>
                      <span className="meter-label-center">Fair clearing</span>
                      <span className="meter-label-right">Overpriced</span>
                    </div>
                    <div className="clearing-meter-bar">
                      <div 
                        className="clearing-meter-pointer" 
                        style={{ left: `${clearingMeterPercent}%` }} 
                        title={`Asking Price: €${askingPriceNum}`}
                      />
                    </div>
                    <div style={{ textAlign: "center", fontSize: "11px", fontWeight: "700", color: zoneColor, marginTop: 12 }}>
                      Asking price is in the {priceZone} zone
                    </div>
                  </div>
                </div>
              )}

              {/* Rules block */}
              <div className="modern-card">
                <div className="modern-card-title">Appraiser Rules</div>
                <ol className="rules-list">
                  <li>Estimations are generated from scraped empirical classified listings.</li>
                  <li>Hourly return parameters simulate manual repair rates.</li>
                  <li>Check local component sizes (frame, bottom bracket spacing) before purchasing spares.</li>
                </ol>
              </div>

            </div>

          </div>
        ) : (
          result.partOutCalc && (
            <PartOutDetails
              partOutCalc={result.partOutCalc}
              askingPrice={askingPriceNum}
              wholeBikeProfit={dynamicProfit}
              estimatedResalePrice={dynamicResaleValue}
            />
          )
        )}
      </div>
    )}

      </div>
    </main>
  );
}
