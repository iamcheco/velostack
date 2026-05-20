"use client";

import React, { useState, useEffect } from "react";
import { useTracker } from "@/app/tracker/context";
import { calcPartWear, getTotalBikeKm } from "@/lib/wear-engine";
import type { PartProfile, WearResult, PartsBinItem } from "@/lib/tracker-types";
import { PART_TYPE_LABELS } from "@/lib/tracker-types";

function healthColor(pct: number): string {
  if (pct > 60) return "#10b981"; // Vibrant Emerald
  if (pct > 30) return "#f59e0b"; // Warm Amber
  return "#ef4444"; // Vivid Rose
}

function statusLabel(status: WearResult["status"]): string {
  switch (status) {
    case "good":         return "Good";
    case "watch":        return "Watch";
    case "replace_soon": return "Replace Soon";
    case "overdue":      return "Overdue";
  }
}

function statusClass(status: WearResult["status"]): string {
  switch (status) {
    case "good":         return "status-good";
    case "watch":        return "status-watch";
    case "replace_soon": return "status-warning";
    case "overdue":      return "status-warning";
  }
}

// Help parse speeds from model name for smart matching
function parseSpeed(str: string): number | null {
  const match = str.match(/(\d+)\s*(?:speed|spd|s\b|-speed)/i);
  return match ? parseInt(match[1]) : null;
}

export default function WearReportTab() {
  const { store, setStore, selectedBikeId, removePartsBinItem } = useTracker();
  const [wearResults, setWearResults] = useState<WearResult[]>([]);
  const [explainPartKey, setExplainPartKey] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalText, setModalText] = useState("");

  // Replaced Modal Flow States
  const [replacePartKey, setReplacePartKey] = useState<string | null>(null);
  const [replaceOption, setReplaceOption] = useState<"new" | "parts_bin">("new");
  const [selectedSpareId, setSelectedSpareId] = useState<string>("");

  const selectedBike = store.bikes.find(b => b.id === selectedBikeId);
  const bikeParts: PartProfile[] = selectedBikeId ? (store.parts[selectedBikeId] ?? []) : [];

  // Recompute wear whenever rides, parts, or replacements change
  useEffect(() => {
    if (!selectedBikeId || bikeParts.length === 0) {
      setWearResults([]);
      return;
    }
    setWearResults(
      bikeParts.map(p => calcPartWear(p, store.rides, store.replacements))
    );
  }, [store.rides, store.replacements, store.parts, selectedBikeId]);

  const openExplain = async (wr: WearResult) => {
    const part = bikeParts.find(p => p.partKey === wr.partKey);
    if (!part) return;

    // Use cached explanation if available
    const cached = store.explanations[wr.partKey];
    if (cached) {
      setModalText(cached);
      setExplainPartKey(wr.partKey);
      return;
    }

    setModalLoading(true);
    setExplainPartKey(wr.partKey);
    setModalText("");

    const recentRides = store.rides
      .filter(r => r.bikeId === selectedBikeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);

    try {
      const res = await fetch("/api/wear-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wearResult: wr, recentRides, partProfile: part }),
      });
      const data = await res.json();
      const text: string = data.explanation ?? "No explanation available.";
      // Cache it
      setStore(prev => ({
        ...prev,
        explanations: { ...prev.explanations, [wr.partKey]: text },
      }));
      setModalText(text);
    } catch {
      setModalText("Failed to fetch explanation. Please try again.");
    } finally {
      setModalLoading(false);
    }
  };

  const closeExplainModal = () => {
    setExplainPartKey(null);
    setModalText("");
    setModalLoading(false);
  };

  // Triggers when user clicks main "Mark Replaced" button to open replaced modal
  const openReplaceModal = (wr: WearResult, spares: PartsBinItem[]) => {
    setReplacePartKey(wr.partKey);
    if (spares.length > 0) {
      setReplaceOption("parts_bin");
      setSelectedSpareId(spares[0].id);
    } else {
      setReplaceOption("new");
      setSelectedSpareId("");
    }
  };

  const submitReplacement = () => {
    if (!selectedBikeId || !replacePartKey) return;

    if (replaceOption === "parts_bin" && selectedSpareId) {
      const spare = store.partsBin?.find(s => s.id === selectedSpareId);
      if (spare) {
        // Consume spare part from bin
        removePartsBinItem(selectedSpareId);

        // Update installed Part Profile to use spare brandModel
        setStore(prev => {
          const updatedParts = { ...prev.parts };
          if (updatedParts[selectedBikeId]) {
            updatedParts[selectedBikeId] = updatedParts[selectedBikeId].map(p => {
              if (p.partKey === replacePartKey) {
                return {
                  ...p,
                  modelName: spare.brandModel,
                  brand: "",
                  material: spare.condition === "new" ? "New Spare" : `Used Spare (${spare.condition})`,
                  researchedAt: new Date().toISOString(),
                };
              }
              return p;
            });
          }

          return {
            ...prev,
            parts: updatedParts,
            replacements: [
              ...prev.replacements,
              {
                partKey: replacePartKey,
                bikeId: selectedBikeId,
                replacedAt: new Date().toISOString(),
                replacedAtTotalKm: getTotalBikeKm(selectedBikeId, prev.rides),
              },
            ],
            // Clear cached explanation so it updates
            explanations: { ...prev.explanations, [replacePartKey]: "" },
          };
        });
      }
    } else {
      // Manual replacement option
      setStore(prev => ({
        ...prev,
        replacements: [
          ...prev.replacements,
          {
            partKey: replacePartKey,
            bikeId: selectedBikeId,
            replacedAt: new Date().toISOString(),
            replacedAtTotalKm: getTotalBikeKm(selectedBikeId, prev.rides),
          },
        ],
        explanations: { ...prev.explanations, [replacePartKey]: "" },
      }));
    }

    setReplacePartKey(null);
    setSelectedSpareId("");
  };

  if (!selectedBikeId) {
    return (
      <div className="modern-card" style={{ textAlign: "center", color: "#64748b", padding: "60px 20px" }}>
        <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>⚡</span>
        <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 4px 0" }}>No Bike Selected</p>
        <p style={{ fontSize: 13, margin: 0 }}>Select a bike from the sidebar to view component wear diagnostics.</p>
      </div>
    );
  }

  if (bikeParts.length === 0) {
    return (
      <div className="modern-card" style={{ textAlign: "center", color: "#64748b", padding: "40px 20px" }}>
        <span style={{ fontSize: 32, display: "block", marginBottom: 10 }}>🔩</span>
        <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#475569" }}>No components tracked yet.</p>
        <p style={{ margin: "0 0 12px 0", fontSize: 12 }}>Configure installed parts for this bike under the Active Parts tab first!</p>
      </div>
    );
  }

  const totalKm = getTotalBikeKm(selectedBikeId, store.rides);

  return (
    <div>
      <style jsx>{`
        .wear-card-container {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .wear-item-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 18px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
          transition: all 0.2s ease;
        }
        .wear-item-card:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 14px rgba(0, 0, 0, 0.03);
        }
        .health-bar-container {
          background: #e2e8f0;
          height: 10px;
          border-radius: 9999px;
          width: 100%;
          overflow: hidden;
          margin: 12px 0 6px 0;
        }
        .health-bar-fill {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.3s ease;
        }
        .forecast-box {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 8px 12px;
          font-size: 11px;
          color: #475569;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: 8px;
        }
        .spares-recommendation-banner {
          background: #f0fdf4;
          border: 1.5px dashed #bbf7d0;
          border-radius: 8px;
          padding: 10px 14px;
          margin-bottom: 12px;
          font-size: 12px;
          color: #166534;
          display: flex;
          flex-direction: column;
          gap: 4px;
          animation: pulse-border 2.5s infinite;
        }
        @keyframes pulse-border {
          0%, 100% { border-color: #bbf7d0; }
          50% { border-color: #86efac; }
        }
        .explanation-preview {
          margin-top: 12px;
          font-size: 12px;
          color: #475569;
          font-style: italic;
          background: #f8fafc;
          padding: 10px 12px;
          border-radius: 8px;
          border-left: 3px solid #cbd5e1;
          line-height: 1.5;
        }
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
        }
        .modal-content {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          width: 90%;
          max-width: 500px;
          padding: 24px;
          box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04);
        }
        .modal-option-card {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px;
          margin-top: 10px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          align-items: flex-start;
          gap: 10px;
        }
        .modal-option-card:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .modal-option-card.selected {
          border-color: #0f172a;
          background: #f8fafc;
          box-shadow: 0 0 0 1px #0f172a;
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; }
          50% { opacity: .5; }
        }
        .skeleton {
          background-color: #f1f5f9;
          border-radius: 6px;
          animation: pulse 1.5s ease-in-out infinite;
        }
      `}</style>

      {/* Header bar */}
      <div style={{ marginBottom: 18, borderBottom: "1px solid #e2e8f0", paddingBottom: 10 }}>
        <h3 style={{ fontSize: 16, fontWeight: 800, margin: 0 }}>
          ⚡ Smart Wear Diagnostics — {selectedBike?.name}
        </h3>
        <span style={{ fontSize: 12, color: "#64748b" }}>
          Active Lifespan Tracker · {totalKm.toFixed(1)} km ridden total · {bikeParts.length} components monitored
        </span>
      </div>

      {/* Wear cards */}
      <div className="wear-card-container">
        {wearResults.map(wr => {
          const barColor = healthColor(wr.healthPercent);

          // SMART SPARE PART RECO ENGINE
          // Filter parts bin for matching spares
          const matchingSpares = (store.partsBin || []).filter(pb => {
            const categoryMatches = pb.componentType === wr.partType;
            if (!categoryMatches) return false;
            if (pb.condition === "worn") return false;

            if (wr.partType === "chain" || wr.partType === "cassette") {
              const activeSpeed = parseSpeed(wr.modelName);
              if (activeSpeed && pb.compatSpeeds) {
                return activeSpeed === pb.compatSpeeds;
              }
            }
            return true;
          });

          const hasSpares = matchingSpares.length > 0;
          const isWarningState = wr.healthPercent < 50;

          return (
            <div key={wr.partKey} className="wear-item-card">
              {/* Top row */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div>
                  <h4 style={{ margin: 0, fontSize: 15, fontWeight: 700 }}>{wr.modelName}</h4>
                  <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.5px" }}>
                    {PART_TYPE_LABELS[wr.partType]}
                  </span>
                </div>
                <span className={`status-badge ${statusClass(wr.status)}`}>
                  {statusLabel(wr.status)}
                </span>
              </div>

              {/* Progress gauge */}
              <div className="health-bar-container">
                <div
                  className="health-bar-fill"
                  style={{ width: `${wr.healthPercent}%`, background: barColor }}
                />
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, color: "#64748b", marginBottom: 12 }}>
                <span style={{ fontWeight: 700, color: barColor }}>{wr.healthPercent}% Health Remaining</span>
                <span>{wr.kmSinceReplacement} km since install</span>
              </div>

              {/* Forecast & Cost box */}
              <div className="forecast-box">
                <span>🗓️ Wear Forecast: <strong>{wr.forecastKmLow}–{wr.forecastKmHigh} km</strong> remaining</span>
                <span>Value Replacement: <strong>€{wr.replacementCostEur.toFixed(2)}</strong></span>
              </div>

              {/* Glowing Spares Recommendation Engine Banner */}
              {isWarningState && hasSpares && (
                <div className="spares-recommendation-banner">
                  <div style={{ fontWeight: 700, display: "flex", alignItems: "center", gap: 6 }}>
                    <span>💡 Smart Spare Recommendation</span>
                  </div>
                  <div style={{ fontSize: 11, color: "#1e3a1e", marginTop: 2 }}>
                    You have <strong>{matchingSpares.length} matching spare{matchingSpares.length !== 1 ? "s" : ""}</strong> available in your garage!
                    {" "}
                    {matchingSpares[0].compatSpeeds ? `${matchingSpares[0].compatSpeeds}-Speed ` : ""}
                    <strong>{matchingSpares[0].brandModel}</strong> ({matchingSpares[0].condition} condition) can be swapped instantly.
                  </div>
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 8 }}>
                <button className="btn-modern-secondary" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => openExplain(wr)}>
                  🔍 Mechanic&apos;s Diagnosis
                </button>
                <button className="btn-modern-primary" style={{ padding: "8px 14px", fontSize: 12 }} onClick={() => openReplaceModal(wr, matchingSpares)}>
                  🔧 Mark Replaced
                </button>
              </div>

              {/* Inline Diagnosis Cache */}
              {store.explanations[wr.partKey] && (
                <div className="explanation-preview">
                  <strong>Mechanic Diagnosis:</strong> {store.explanations[wr.partKey]}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Explain / Mechanic Diagnosis Modal */}
      {explainPartKey && (
        <div className="modal-overlay" onClick={closeExplainModal}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 12px 0", display: "flex", alignItems: "center", gap: 6 }}>
              🛠️ AI Mechanic Diagnosis
            </h3>
            {modalLoading ? (
              <div style={{ display: "flex", flexDirection: "column", gap: 10, padding: "10px 0" }}>
                <div className="skeleton" style={{ height: 16, width: "95%" }} />
                <div className="skeleton" style={{ height: 16, width: "85%" }} />
                <div className="skeleton" style={{ height: 16, width: "70%" }} />
              </div>
            ) : (
              <p style={{ fontSize: 13, color: "#334155", lineHeight: 1.6, margin: "0 0 20px 0", background: "#f8fafc", padding: 14, borderRadius: 8, border: "1px solid #e2e8f0" }}>
                {modalText}
              </p>
            )}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <button className="btn-modern-primary" onClick={closeExplainModal}>
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Replacement Modal with smart spares option */}
      {replacePartKey && (() => {
        const targetPart = bikeParts.find(p => p.partKey === replacePartKey);
        const matchingSpares = (store.partsBin || []).filter(pb => {
          if (!targetPart) return false;
          const categoryMatches = pb.componentType === targetPart.partType;
          if (!categoryMatches) return false;
          if (pb.condition === "worn") return false;

          if (targetPart.partType === "chain" || targetPart.partType === "cassette") {
            const activeSpeed = parseSpeed(targetPart.modelName);
            if (activeSpeed && pb.compatSpeeds) {
              return activeSpeed === pb.compatSpeeds;
            }
          }
          return true;
        });

        const hasSpares = matchingSpares.length > 0;

        return (
          <div className="modal-overlay" onClick={() => setReplacePartKey(null)}>
            <div className="modal-content" onClick={e => e.stopPropagation()}>
              <h3 style={{ fontSize: 16, fontWeight: 800, margin: "0 0 6px 0" }}>
                ⚙️ Mark Component Replaced
              </h3>
              <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 16px 0" }}>
                Select how you want to log the replacement of <strong>{targetPart?.modelName}</strong>.
              </p>

              {/* Option Cards */}
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {hasSpares && (
                  <div
                    className={`modal-option-card ${replaceOption === "parts_bin" ? "selected" : ""}`}
                    onClick={() => {
                      setReplaceOption("parts_bin");
                      if (matchingSpares.length > 0) setSelectedSpareId(matchingSpares[0].id);
                    }}
                  >
                    <input
                      type="radio"
                      checked={replaceOption === "parts_bin"}
                      onChange={() => {}}
                      style={{ marginTop: 3 }}
                    />
                    <div style={{ width: "100%" }}>
                      <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "block" }}>
                        Consume Spare from Parts Bin
                      </span>
                      <span style={{ fontSize: 11, color: "#64748b" }}>
                        Swaps the active component with a qualified garage spare inventory item.
                      </span>

                      {replaceOption === "parts_bin" && (
                        <div style={{ marginTop: 8 }}>
                          <label className="modern-form-label">Select Garage Spare</label>
                          <select
                            className="modern-form-input"
                            style={{ margin: 0, padding: "6px 10px" }}
                            value={selectedSpareId}
                            onChange={e => setSelectedSpareId(e.target.value)}
                          >
                            {matchingSpares.map(s => (
                              <option key={s.id} value={s.id}>
                                {s.brandModel} ({s.condition}) - Est €{s.estimatedValueEur.toFixed(2)}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div
                  className={`modal-option-card ${replaceOption === "new" ? "selected" : ""}`}
                  onClick={() => setReplaceOption("new")}
                >
                  <input
                    type="radio"
                    checked={replaceOption === "new"}
                    onChange={() => {}}
                    style={{ marginTop: 3 }}
                  />
                  <div>
                    <span style={{ fontSize: 13, fontWeight: 700, color: "#0f172a", display: "block" }}>
                      Log New Component Manually
                    </span>
                    <span style={{ fontSize: 11, color: "#64748b" }}>
                      Log a standard replacement. Keeps the existing component brand model but resets the wear cycle to 0.
                    </span>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div style={{ display: "flex", gap: 10, justifyContent: "flex-end", marginTop: 24 }}>
                <button className="btn-modern-secondary" onClick={() => setReplacePartKey(null)}>
                  Cancel
                </button>
                <button className="btn-modern-primary" onClick={submitReplacement}>
                  Confirm Swap
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
