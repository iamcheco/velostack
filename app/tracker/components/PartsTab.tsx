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
      <div className="reddit-form" style={{ textAlign: "center", color: "#888", padding: 40 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🚲</div>
        <div>Select a bike from the sidebar to manage its parts.</div>
      </div>
    );
  }

  return (
    <div>
      {/* Research form */}
      <div className="reddit-form">
        <h2 style={{ fontSize: 14, color: "#336699", margin: "0 0 12px 0", fontWeight: "bold", borderBottom: "1px solid #cee3f8", paddingBottom: 6 }}>
          🔩 Add Part to <em>{selectedBike?.name}</em>
        </h2>
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 2, minWidth: 180 }}>
            <label className="reddit-form-label">Model Name</label>
            <input
              className="reddit-form-input"
              type="text"
              value={modelName}
              onChange={e => setModelName(e.target.value)}
              onKeyDown={e => { if (e.key === "Enter") addPart(); }}
              placeholder="e.g. Shimano 105 R7000"
              disabled={loading}
            />
          </div>
          <div style={{ flex: 1, minWidth: 140 }}>
            <label className="reddit-form-label">Part Type</label>
            <select
              className="reddit-form-input"
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
        {error && <div style={{ color: "#e74c3c", fontSize: 11, marginTop: 6 }}>{error}</div>}
        <div style={{ marginTop: 10 }}>
          <button className="reddit-btn-submit" onClick={addPart} disabled={loading || !modelName.trim()}>
            {loading ? (
              <span>🔍 Researching...</span>
            ) : (
              "Research & Add Part"
            )}
          </button>
          <span style={{ fontSize: 10, color: "#888", marginLeft: 10 }}>
            AI will look up wear data for this exact model.
          </span>
        </div>
        {loading && (
          <div style={{ marginTop: 12 }}>
            <div className="reddit-skeleton" style={{ height: 14, width: "60%", marginBottom: 6 }} />
            <div className="reddit-skeleton" style={{ height: 14, width: "40%" }} />
          </div>
        )}
      </div>

      {/* Parts list - Reddit comment style */}
      <div>
        <div style={{ fontWeight: "bold", fontSize: 13, color: "#222", marginBottom: 10 }}>
          {bikeParts.length} component{bikeParts.length !== 1 ? "s" : ""} tracked
        </div>
        {bikeParts.length === 0 && (
          <div className="reddit-comment" style={{ color: "#888", fontSize: 12 }}>
            No parts added yet. Use the form above to research and add a component.
          </div>
        )}
        {bikeParts.map(p => (
          <div key={p.partKey} className="reddit-comment">
            <div className="reddit-comment-meta">
              <span className="reddit-comment-meta-user">/u/wear_bot_{p.partType}</span>{" "}
              <span style={{ fontWeight: "bold", color: "#5f99cf" }}>
                €{p.replacementCostEur} replacement cost
              </span>{" "}
              <span style={{ color: "#888" }}>{new Date(p.researchedAt).toLocaleDateString()}</span>
            </div>
            <div className="reddit-comment-body">
              <strong>{PART_TYPE_LABELS[p.partType]}:</strong> {p.modelName}
              {p.brand && <span style={{ color: "#666", marginLeft: 6 }}>({p.brand})</span>}
            </div>
            <div style={{ fontSize: 11, color: "#666", marginTop: 4 }}>
              <span>Lifespan: {p.lifespanKmMin}–{p.lifespanKmMax} km</span>
              {" · "}
              <span>Material: {p.material}</span>
              {" · "}
              <span>Source: {p.source === "web_search" ? "🌐 web" : "🤖 AI"}</span>
            </div>
            {p.notes && (
              <div style={{ fontSize: 11, color: "#555", fontStyle: "italic", marginTop: 4, paddingLeft: 8, borderLeft: "2px solid #cee3f8" }}>
                {p.notes}
              </div>
            )}
            <div className="reddit-comment-footer">
              <span style={{ color: "#369" }}>permalink</span>
              <span style={{ color: "#369" }}>embed</span>
              <span
                style={{ color: "#e74c3c" }}
                onClick={() => removePart(p.partKey)}
              >
                [remove]
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
