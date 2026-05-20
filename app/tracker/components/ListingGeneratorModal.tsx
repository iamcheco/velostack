"use client";

import React, { useState, useEffect } from "react";
import type { Bike, PartProfile, RideLog, PartReplacement } from "@/lib/tracker-types";
import { calcPartWear } from "@/lib/wear-engine";
import { PART_TYPE_LABELS } from "@/lib/tracker-types";

interface ListingGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: Bike;
  bikeParts: PartProfile[];
  allRides: RideLog[];
  replacements: PartReplacement[];
}

export default function ListingGeneratorModal({
  isOpen,
  onClose,
  bike,
  bikeParts,
  allRides,
  replacements,
}: ListingGeneratorModalProps) {
  // Input fields state
  const [color, setColor] = useState("");
  const [frameSize, setFrameSize] = useState("");
  const [speedsCount, setSpeedsCount] = useState("");
  const [targetPrice, setTargetPrice] = useState<number>(0);
  const [wearCondition, setWearCondition] = useState("Excellent, fully tuned and ready to ride.");
  const [tone, setTone] = useState<"professional" | "enthusiast" | "minimalist" | "deal-hunter">("professional");
  const [platform, setPlatform] = useState<"facebook" | "ebay" | "craigslist" | "pinkbike">("facebook");

  // Interactive upgrades checklist state
  const [selectedUpgrades, setSelectedUpgrades] = useState<Record<string, boolean>>({});

  // API loading / response states
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [generatedText, setGeneratedText] = useState("");
  const [copied, setCopied] = useState(false);

  // Initialize and parse smart defaults on mount / open
  useEffect(() => {
    if (!isOpen) return;

    // Reset output states
    setError("");
    setGeneratedText("");
    setCopied(false);

    // Smart default speeds parser: scan components for speed indicators
    let detectedSpeed = "";
    for (const p of bikeParts) {
      const match = p.modelName.match(/(\d+)\s*(?:speed|spd|s\b|-speed)/i);
      if (match) {
        detectedSpeed = `${match[1]}-Speed`;
        break;
      }
    }
    setSpeedsCount(detectedSpeed || "11-Speed");

    // Smart upgrades selector: pre-check components with health > 80%
    const initialUpgrades: Record<string, boolean> = {};
    let estimatedInvestment = 0;
    bikeParts.forEach(p => {
      const wear = calcPartWear(p, allRides, replacements);
      const isFresh = wear.healthPercent > 80;
      initialUpgrades[p.partKey] = isFresh;
      if (isFresh) {
        estimatedInvestment += p.replacementCostEur;
      }
    });
    setSelectedUpgrades(initialUpgrades);

    // Smart default asking price: base price + parts investments
    const defaultAskingPrice = estimatedInvestment > 0 
      ? Math.round(350 + estimatedInvestment) 
      : 450;
    setTargetPrice(defaultAskingPrice);
    
    // Default color & size
    setColor("");
    setFrameSize("");
  }, [isOpen, bike, bikeParts, allRides, replacements]);

  const toggleUpgrade = (partKey: string) => {
    setSelectedUpgrades(prev => ({
      ...prev,
      [partKey]: !prev[partKey],
    }));
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setGeneratedText("");

    // Prepare selected upgrades array
    const upgradesPayload = bikeParts
      .filter(p => selectedUpgrades[p.partKey])
      .map(p => ({
        partName: p.modelName,
        cost: p.replacementCostEur,
      }));

    try {
      const res = await fetch("/api/listing-generator", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          bikeName: bike.name,
          color,
          frameSize,
          speedsCount,
          targetPrice,
          upgrades: upgradesPayload,
          wearCondition,
          tone,
          platform,
        }),
      });

      if (!res.ok) {
        throw new Error("Failed to generate listing.");
      }

      const data = await res.json();
      if (data.listingText) {
        setGeneratedText(data.listingText);
      } else {
        throw new Error("Empty response received.");
      }
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    if (!generatedText) return;
    navigator.clipboard.writeText(generatedText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <style jsx>{`
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 16px;
        }

        .modal-container {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          width: 100%;
          max-width: 960px;
          max-height: 90vh;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
          display: flex;
          flex-direction: column;
          overflow: hidden;
          animation: slideUp 0.3s ease-out;
        }

        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }

        .modal-header {
          padding: 18px 24px;
          border-bottom: 1px solid #e2e8f0;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .modal-title {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
          display: flex;
          align-items: center;
          gap: 8px;
        }

        .modal-close-btn {
          background: transparent;
          border: none;
          font-size: 18px;
          color: #64748b;
          cursor: pointer;
          padding: 4px;
          border-radius: 6px;
          transition: all 0.15s;
          line-height: 1;
        }

        .modal-close-btn:hover {
          background: #f1f5f9;
          color: #0f172a;
        }

        .modal-body-grid {
          display: grid;
          grid-template-columns: 1.1fr 1fr;
          overflow: hidden;
          flex: 1;
        }

        @media (max-width: 768px) {
          .modal-body-grid {
            grid-template-columns: 1fr;
            overflow-y: auto;
          }
        }

        .form-column {
          padding: 24px;
          border-right: 1px solid #e2e8f0;
          overflow-y: auto;
          max-height: calc(90vh - 120px);
        }

        @media (max-width: 768px) {
          .form-column {
            border-right: none;
            max-height: none;
          }
        }

        .preview-column {
          padding: 24px;
          background: #f8fafc;
          display: flex;
          flex-direction: column;
          overflow-y: auto;
          max-height: calc(90vh - 120px);
        }

        @media (max-width: 768px) {
          .preview-column {
            max-height: none;
          }
        }

        /* Form styling */
        .form-grid-2 {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 12px;
        }

        .upgrade-checklist-box {
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          max-height: 160px;
          overflow-y: auto;
          padding: 8px 12px;
          background: #ffffff;
          margin-top: 6px;
        }

        .upgrade-item-row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 0;
          border-bottom: 1px solid #f1f5f9;
          font-size: 12px;
          color: #334155;
          cursor: pointer;
        }

        .upgrade-item-row:last-child {
          border-bottom: none;
        }

        .upgrade-item-row input {
          cursor: pointer;
        }

        .upgrade-badge {
          background: #dcfce7;
          color: #166534;
          font-size: 9px;
          font-weight: 700;
          padding: 1px 5px;
          border-radius: 4px;
          text-transform: uppercase;
        }

        /* Output text styling */
        .output-textarea {
          width: 100%;
          flex: 1;
          min-height: 280px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          padding: 14px;
          font-family: inherit;
          font-size: 13px;
          line-height: 1.6;
          color: #0f172a;
          background: #ffffff;
          resize: none;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }

        .output-textarea:focus {
          border-color: #0f172a;
          outline: none;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05);
        }

        .preview-placeholder {
          flex: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: center;
          text-align: center;
          color: #64748b;
          padding: 40px 20px;
          border: 2px dashed #e2e8f0;
          border-radius: 12px;
          background: #ffffff;
        }

        /* Skeletons */
        .skeleton-line {
          height: 14px;
          background-color: #e2e8f0;
          border-radius: 4px;
          margin-bottom: 10px;
          animation: pulse 1.5s ease-in-out infinite;
        }

        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
      `}</style>

      <div className="modal-container" onClick={e => e.stopPropagation()}>
        {/* Modal Header */}
        <div className="modal-header">
          <h3 className="modal-title">
            <span>✨</span> 1-Click AI Classified Listing Generator
          </h3>
          <button className="modal-close-btn" onClick={onClose}>
            ✕
          </button>
        </div>

        {/* Modal Grid Body */}
        <div className="modal-body-grid">
          {/* Left Column: Form & Checklist */}
          <div className="form-column">
            <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              1. Customize Bike Details ({bike.name})
            </h4>

            <div className="form-grid-2">
              <div className="modern-form-group">
                <label className="modern-form-label">Color</label>
                <input
                  className="modern-form-input"
                  type="text"
                  value={color}
                  onChange={e => setColor(e.target.value)}
                  placeholder="e.g. Gloss Slate Blue"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Frame Size</label>
                <input
                  className="modern-form-input"
                  type="text"
                  value={frameSize}
                  placeholder="e.g. 54cm / Medium"
                  onChange={e => setFrameSize(e.target.value)}
                />
              </div>
            </div>

            <div className="form-grid-2">
              <div className="modern-form-group">
                <label className="modern-form-label">Drivetrain Speeds</label>
                <input
                  className="modern-form-input"
                  type="text"
                  value={speedsCount}
                  onChange={e => setSpeedsCount(e.target.value)}
                  placeholder="e.g. 11-Speed"
                />
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Asking Price (€)</label>
                <input
                  className="modern-form-input"
                  type="number"
                  value={targetPrice || ""}
                  onChange={e => setTargetPrice(Number(e.target.value))}
                  placeholder="e.g. 850"
                />
              </div>
            </div>

            <div className="modern-form-group">
              <label className="modern-form-label">Overall Condition Description</label>
              <input
                className="modern-form-input"
                type="text"
                value={wearCondition}
                onChange={e => setWearCondition(e.target.value)}
                placeholder="e.g. Fully tuned, immaculate condition, ready to ride."
              />
            </div>

            <div className="form-grid-2">
              <div className="modern-form-group">
                <label className="modern-form-label">Tone Profile</label>
                <select
                  className="modern-form-input"
                  value={tone}
                  onChange={e => setTone(e.target.value as any)}
                >
                  <option value="professional">Professional Enthusiast</option>
                  <option value="enthusiast">Friendly Rider</option>
                  <option value="minimalist">Direct Minimalist</option>
                  <option value="deal-hunter">Bargain Hunter</option>
                </select>
              </div>

              <div className="modern-form-group">
                <label className="modern-form-label">Classified Platform</label>
                <select
                  className="modern-form-input"
                  value={platform}
                  onChange={e => setPlatform(e.target.value as any)}
                >
                  <option value="facebook">Facebook Marketplace</option>
                  <option value="ebay">eBay / eBay Kleinanzeigen</option>
                  <option value="craigslist">Craigslist</option>
                  <option value="pinkbike">Pinkbike Classifieds</option>
                </select>
              </div>
            </div>

            {/* Upgrades Checklist */}
            <div className="modern-form-group" style={{ marginTop: 14 }}>
              <label className="modern-form-label" style={{ display: "flex", justifyContent: "space-between" }}>
                <span>🔧 Highlight Maintenance & Upgrades</span>
                <span style={{ fontSize: 10, color: "#64748b", fontWeight: 500 }}>
                  Pre-checked if wear health &gt; 80%
                </span>
              </label>

              {bikeParts.length === 0 ? (
                <div style={{ fontSize: 11, color: "#64748b", padding: "10px", background: "#f8fafc", border: "1px solid #cbd5e1", borderRadius: 8, textAlign: "center" }}>
                  No components registered to this bike.
                </div>
              ) : (
                <div className="upgrade-checklist-box">
                  {bikeParts.map(part => {
                    const wear = calcPartWear(part, allRides, replacements);
                    const isNewish = wear.healthPercent > 80;
                    return (
                      <label key={part.partKey} className="upgrade-item-row">
                        <input
                          type="checkbox"
                          checked={!!selectedUpgrades[part.partKey]}
                          onChange={() => toggleUpgrade(part.partKey)}
                        />
                        <span style={{ flex: 1, textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap" }}>
                          <strong>{PART_TYPE_LABELS[part.partType]}</strong>: {part.modelName}
                        </span>
                        {isNewish && <span className="upgrade-badge">Newish</span>}
                        <span style={{ color: "#64748b" }}>€{part.replacementCostEur}</span>
                      </label>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Action Trigger */}
            <button
              className="btn-modern-primary"
              style={{ width: "100%", justifyContent: "center", padding: "12px", marginTop: 10 }}
              onClick={handleGenerate}
              disabled={loading}
            >
              {loading ? "⚙️ Writing Copy..." : "✨ Generate Classified Description"}
            </button>
          </div>

          {/* Right Column: LLM Output Preview */}
          <div className="preview-column">
            <h4 style={{ margin: "0 0 16px 0", fontSize: 14, fontWeight: 700, color: "#0f172a" }}>
              2. Classified Copy Output
            </h4>

            {error && (
              <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "12px", borderRadius: 8, fontSize: 12, marginBottom: 16 }}>
                ⚠️ Error: {error}
              </div>
            )}

            {loading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, background: "#ffffff", padding: 20, border: "1px solid #cbd5e1", borderRadius: 8, flex: 1 }}>
                <div className="skeleton-line" style={{ width: "85%", height: 20 }} />
                <div className="skeleton-line" style={{ width: "40%" }} />
                <br />
                <div className="skeleton-line" style={{ width: "95%" }} />
                <div className="skeleton-line" style={{ width: "90%" }} />
                <div className="skeleton-line" style={{ width: "92%" }} />
                <div className="skeleton-line" style={{ width: "70%" }} />
                <br />
                <div className="skeleton-line" style={{ width: "80%" }} />
                <div className="skeleton-line" style={{ width: "85%" }} />
              </div>
            ) : generatedText ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 14, flex: 1 }}>
                <textarea
                  className="output-textarea"
                  value={generatedText}
                  onChange={e => setGeneratedText(e.target.value)}
                />
                
                <div style={{ display: "flex", gap: 10 }}>
                  <button
                    className="btn-modern-primary"
                    style={{ flex: 1, justifyContent: "center", background: copied ? "#10b981" : "#0f172a", borderColor: copied ? "#10b981" : "#0f172a" }}
                    onClick={handleCopy}
                  >
                    {copied ? "Copied! ✅" : "📋 Copy Listing Text"}
                  </button>
                  
                  {/* SMS share deep link */}
                  <a
                    href={`sms:?&body=${encodeURIComponent(generatedText.slice(0, 150) + "...")}`}
                    className="btn-modern-secondary"
                    style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", textDecoration: "none", fontSize: 12 }}
                  >
                    💬 SMS Hook
                  </a>
                </div>
              </div>
            ) : (
              <div className="preview-placeholder">
                <span style={{ fontSize: 32, display: "block", marginBottom: 8 }}>📝</span>
                <p style={{ margin: "0 0 4px 0", fontWeight: 700, color: "#334155", fontSize: 13 }}>
                  No Copy Generated Yet
                </p>
                <p style={{ margin: 0, fontSize: 11, color: "#64748b", maxWidth: 260 }}>
                  Adjust specs on the left and click &quot;Generate Classified Description&quot; to draft your marketplace listing instantly.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
