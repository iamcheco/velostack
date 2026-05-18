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

  const bikeParts = selectedBikeId ? store.parts[selectedBikeId] ?? [] : [];

  const addPart = async () => {
    if (!modelName || !selectedBikeId) return;
    setLoading(true);
    try {
      const res = await fetch("/api/research-part", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ modelName, partType }),
      });
      if (!res.ok) throw new Error("Failed to fetch part data");
      const data = await res.json();
      const newPart: PartProfile = {
        partKey: crypto.randomUUID(),
        bikeId: selectedBikeId,
        modelName: data.modelName ?? modelName,
        partType: data.partType ?? partType,
        brand: data.brand ?? "",
        material: data.material ?? "",
        lifespanKmMin: data.lifespanKmMin ?? 0,
        lifespanKmMax: data.lifespanKmMax ?? 0,
        wearCoefficient: data.wearCoefficient ?? 1,
        terrainSensitivity: data.terrainSensitivity ?? 0,
        weatherSensitivity: data.weatherSensitivity ?? 0,
        powerSensitivity: data.powerSensitivity ?? 0,
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
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const removePart = (partKey: string) => {
    setStore(prev => ({
      ...prev,
      parts: {
        ...prev.parts,
        [selectedBikeId]: (prev.parts[selectedBikeId] ?? []).filter(p => p.partKey !== partKey),
      },
    }));
  };

  return (
    <div className="reddit-form">
      <h2 className="reddit-sidebox-title">Parts</h2>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Model Name</label>
        <input
          className="reddit-form-input"
          type="text"
          value={modelName}
          onChange={e => setModelName(e.target.value)}
          placeholder="e.g. Shimano Ultegra 105"
        />
      </div>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Part Type</label>
        <select
          className="reddit-form-input"
          value={partType}
          onChange={e => setPartType(e.target.value as PartType)}
        >
          {Object.entries(PART_TYPE_LABELS).map(([key, label]) => (
            <option key={key} value={key}>{label}</option>
          ))}
        </select>
      </div>
      <button className="reddit-btn-submit" onClick={addPart} disabled={loading}>
        {loading ? "Adding..." : "Add Part"}
      </button>

      <hr style={{ margin: "12px 0" }} />
      <ul style={{ listStyle: "none", padding: 0 }}>
        {bikeParts.map(p => (
          <li key={p.partKey} style={{ marginBottom: 8, borderBottom: "1px solid #eee", paddingBottom: 4 }}>
            <strong>{PART_TYPE_LABELS[p.partType]}:</strong> {p.modelName}
            <span style={{ float: "right", cursor: "pointer", color: "#e74c3c" }} onClick={() => removePart(p.partKey)}>
              ✕
            </span>
          </li>
        ))}
        {bikeParts.length === 0 && <li>No parts added.</li>}
      </ul>
    </div>
  );
}
