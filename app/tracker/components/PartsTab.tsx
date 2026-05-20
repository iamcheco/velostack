"use client";

import React, { useState } from "react";
import { useTracker } from "@/app/tracker/context";
import type { PartProfile, PartType } from "@/lib/tracker-types";
import { PART_TYPE_LABELS } from "@/lib/tracker-types";

export default function PartsTab() {
  const { store, setStore, selectedBikeId } = useTracker();
  const [modelName, setModelName] = useState("");
  const [partType, setPartType] = useState<PartType>("chain");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const bikeParts: PartProfile[] = selectedBikeId ? (store.parts[selectedBikeId] ?? []) : [];
  const selectedBike = store.bikes.find(b => b.id === selectedBikeId);

  const addPart = async () => {
    if (!modelName.trim()) return;
    if (!selectedBikeId) { setError("Select a bike first."); return; }
    setLoading(true);
    setError("");
    try {
      const res = await fetch("/api/research-part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName: modelName.trim(), partType }),
      });
      if (!res.ok) throw new Error("Research failed");
      const data = await res.json();
      const newPart: PartProfile = {
        partKey: crypto.randomUUID(),
        bikeId: selectedBikeId,
        modelName: data.modelName ?? modelName.trim(),
        partType: (data.partType as PartType) ?? partType,
        brand: data.brand ?? "",
        material: data.material ?? "",
        lifespanKmMin: data.lifespanKmMin ?? 1000,
        lifespanKmMax: data.lifespanKmMax ?? 3000,
        wearCoefficient: data.wearCoefficient ?? 1,
        terrainSensitivity: data.terrainSensitivity ?? 0.5,
        weatherSensitivity: data.weatherSensitivity ?? 0.5,
        powerSensitivity: data.powerSensitivity ?? 0.5,
        replacementCostEur: data.replacementCostEur ?? 0,
        notes: data.notes ?? "",
        source: data.source ?? "llm_knowledge",
        researchedAt: data.researchedAt ?? new Date().toISOString(),
      };
      setStore(prev => ({
        ...prev,
        parts: {
          ...prev.parts,
          [selectedBikeId]: [...(prev.parts[selectedBikeId] ?? []), newPart],
        },
      }));
      setModelName("");
    } catch {
      setError("Failed to research part. Check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  const removePart = (partKey: string) => {
    if (!selectedBikeId) return;
    setStore(prev => ({
      ...prev,
      parts: {
        ...prev.parts,
        [selectedBikeId]: (prev.parts[selectedBikeId] ?? []).filter(p => p.partKey !== partKey),
      },
    }));
  };

  if (!selectedBikeId) {
    return (
      <div className="modern-card" style={{ textAlign: "center", color: "#64748b", padding: "60px 20px" }}>
        <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🚲</span>
        <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 4px 0" }}>No Bike Selected</p>
        <p style={{ fontSize: 13, margin: 0 }}>Select a bike from the sidebar to manage its active components.</p>
      </div>
    );
  }

  return (
    <div>
      <style jsx>{`
        .part-card-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
          gap: 16px;
          margin-top: 16px;
        }
        .part-item-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
          transition: all 0.2s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .part-item-card:hover {
          box-shadow: 0 6px 16px rgba(0, 0, 0, 0.04);
          border-color: #cbd5e1;
        }
        .part-delete-btn {
          position: absolute;
          top: 14px;
          right: 14px;
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: all 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .part-delete-btn:hover {
          background: #fee2e2;
        }
        .part-category-badge {
          display: inline-block;
          font-size: 9px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .part-title {
          font-size: 14px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 4px 0;
          padding-right: 20px;
        }
        .part-brand {
          font-size: 12px;
          color: #64748b;
          margin-bottom: 12px;
        }
        .part-meta-grid {
          display: grid;
          grid-template-columns: 1.2fr 1fr;
          gap: 6px;
          font-size: 11px;
          color: #475569;
          background: #f8fafc;
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 12px;
        }
        .part-meta-row {
          display: contents;
        }
        .part-meta-label {
          color: #64748b;
          font-weight: 500;
        }
        .part-meta-value {
          font-weight: 600;
          text-align: right;
        }
        .part-notes {
          font-size: 11px;
          color: #64748b;
          font-style: italic;
          background: #f8fafc;
          padding: 8px 10px;
          border-radius: 6px;
          border-left: 3px solid #cbd5e1;
          margin-bottom: 12px;
          line-height: 1.4;
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

      {/* Research form */}
      <div className="modern-card">
        <h3 className="modern-card-title">
          🔧 Add Part to <em>{selectedBike?.name}</em>
        </h3>
        <div style={{ display: "flex", gap: 12, flexWrap: "wrap", marginBottom: 12 }}>
          <div style={{ flex: 2, minWidth: 200 }}>
            <label className="modern-form-label">Model Name</label>
            <input
              className="modern-form-input"
              type="text"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addPart(); }}
              placeholder="e.g. Shimano 105 Chain, GP5000 Tire"
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1, minWidth: 160 }}>
            <label className="modern-form-label">Part Category</label>
            <select
              className="modern-form-input"
              value={partType}
              onChange={e => setPartType(e.target.value as PartType)}
              disabled={loading}
            >
              {Object.entries(PART_TYPE_LABELS).map(([key, label]) => (
                <option key={key} value={key}>{label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px", borderRadius: 8, fontSize: 12, marginBottom: 12 }}>
            ⚠️ {error}
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
          <button className="btn-modern-primary" onClick={addPart} disabled={loading || !modelName.trim()}>
            {loading ? "🔍 Researching..." : "Research & Add Part"}
          </button>
          <span style={{ fontSize: 12, color: "#64748b" }}>
            AI will look up wear parameters for this exact brand and model.
          </span>
        </div>

        {loading && (
          <div style={{ marginTop: 16, display: "flex", flexDirection: "column", gap: 8 }}>
            <div className="skeleton" style={{ height: 16, width: "70%" }} />
            <div className="skeleton" style={{ height: 12, width: "40%" }} />
            <div className="skeleton" style={{ height: 32, width: "100%" }} />
          </div>
        )}
      </div>

      {/* Parts list */}
      <div>
        <div style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 12, display: "flex", justifyContent: "between", alignItems: "center" }}>
          <span>📋 Currently Installed Components ({bikeParts.length})</span>
        </div>

        {bikeParts.length === 0 && (
          <div className="modern-card" style={{ textAlign: "center", color: "#64748b", padding: "40px 20px" }}>
            <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>🔩</span>
            <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#475569" }}>No parts registered yet.</p>
            <p style={{ margin: 0, fontSize: 12 }}>Research and add your first part using the dashboard card above.</p>
          </div>
        )}

        <div className="part-card-list">
          {bikeParts.map(p => (
            <div key={p.partKey} className="part-item-card">
              {/* Delete button */}
              <button
                className="part-delete-btn"
                title="Remove part"
                onClick={() => removePart(p.partKey)}
              >
                🗑️
              </button>

              <div>
                <span className="part-category-badge">
                  {PART_TYPE_LABELS[p.partType]}
                </span>
                <h4 className="part-title">{p.modelName}</h4>
                {p.brand && <div className="part-brand">{p.brand}</div>}

                <div className="part-meta-grid">
                  <div className="part-meta-row">
                    <span className="part-meta-label">Est. Lifespan</span>
                    <span className="part-meta-value">{p.lifespanKmMin}–{p.lifespanKmMax} km</span>
                  </div>
                  <div className="part-meta-row">
                    <span className="part-meta-label">Material</span>
                    <span className="part-meta-value">{p.material || "Standard"}</span>
                  </div>
                  <div className="part-meta-row">
                    <span className="part-meta-label">Cost (EUR)</span>
                    <span className="part-meta-value">€{p.replacementCostEur.toFixed(2)}</span>
                  </div>
                  <div className="part-meta-row">
                    <span className="part-meta-label">Data Source</span>
                    <span className="part-meta-value">{p.source === "web_search" ? "🌐 Web Search" : "🤖 LLM KB"}</span>
                  </div>
                </div>

                {p.notes && (
                  <div className="part-notes">
                    {p.notes}
                  </div>
                )}
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #f1f5f9", paddingTop: 10, fontSize: 11, color: "#64748b" }}>
                <span>Added {new Date(p.researchedAt).toLocaleDateString()}</span>
                <span style={{ fontWeight: 600, color: "#0f172a" }}>ID: {p.partKey.slice(0, 8)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
