"use client";

import React, { useState, useEffect } from "react";
import { useTracker } from "@/app/tracker/context";
import { calcPartWear, getTotalBikeKm } from "@/lib/wear-engine";
import type { PartProfile, WearResult, RideLog } from "@/lib/tracker-types";

export default function WearReportTab() {
  const { store, setStore, selectedBikeId } = useTracker();
  const [wearResults, setWearResults] = useState<WearResult[]>([]);
  const [explanation, setExplanation] = useState<string>("");
  const [showModal, setShowModal] = useState<boolean>(false);

  // compute wear when data changes
  useEffect(() => {
    if (!selectedBikeId) {
      setWearResults([]);
      return;
    }
    const bikeParts = store.parts[selectedBikeId] ?? [];
    const results = bikeParts.map(part =>
      calcPartWear(part as PartProfile, store.rides, store.replacements)
    );
    setWearResults(results);
  }, [store.rides, store.replacements, store.parts, selectedBikeId]);

  const openExplain = async (partResult: WearResult) => {
    const part = (store.parts[selectedBikeId] ?? []).find(p => p.partKey === partResult.partKey);
    if (!part) return;
    // check cache first
    const cached = store.explanations[partResult.partKey];
    if (cached) {
      setExplanation(cached);
      setShowModal(true);
      return;
    }
    const recentRides = store.rides
      .filter(r => r.bikeId === selectedBikeId)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10);
    try {
      const res = await fetch("/api/wear-explain", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ wearResult: partResult, recentRides, partProfile: part }),
      });
      const data = await res.json();
      const text = data.explanation ?? "";
      // cache it
      setStore(prev => ({
        ...prev,
        explanations: { ...prev.explanations, [partResult.partKey]: text },
      }));
      setExplanation(text);
      setShowModal(true);
    } catch (e) {
      console.error(e);
    }
  };

  const markReplaced = (partKey: string) => {
    if (!selectedBikeId) return;
    const newRepl = {
      partKey,
      bikeId: selectedBikeId,
      replacedAt: new Date().toISOString(),
      replacedAtTotalKm: getTotalBikeKm(selectedBikeId, store.rides),
    };
    setStore(prev => ({
      ...prev,
      replacements: [...prev.replacements, newRepl],
    }));
  };

  const statusBadgeClass = (status: WearResult["status"]) => {
    switch (status) {
      case "good":
        return "reddit-flair-great";
      case "watch":
        return "reddit-flair-fair";
      case "replace_soon":
        return "reddit-flair-pass";
      case "overdue":
        return "reddit-flair-avoid";
      default:
        return "reddit-flair";
    }
  };

  if (!selectedBikeId) {
    return <div className="reddit-form">Select a bike to view wear report.</div>;
  }

  return (
    <div className="reddit-form">
      <h2 className="reddit-sidebox-title">Wear Report</h2>
      {wearResults.map(w => (
        <div key={w.partKey} style={{ borderBottom: "1px solid #eee", paddingBottom: 8, marginBottom: 8 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <strong>{w.modelName} ({w.partType})</strong>
            <span className={statusBadgeClass(w.status)}>{w.status.replace("_", " ")}</span>
          </div>
          <div style={{ marginTop: 4 }}>
            <div style={{ background: "#ddd", height: 8, borderRadius: 4, overflow: "hidden" }}>
              <div
                style={{
                  width: `${w.healthPercent}%`,
                  background: `linear-gradient(to right, #2ecc71, #e74c3c)`,
                  height: "100%",
                }}
              />
            </div>
            <small>{w.healthPercent}% health, {w.kmSinceReplacement} km ridden</small>
          </div>
          <div style={{ marginTop: 4, fontSize: 12, color: "#555" }}>
            Forecast: {w.forecastKmLow}–{w.forecastKmHigh} km remaining
          </div>
          <div style={{ marginTop: 6, display: "flex", gap: 8 }}>
            <button className="reddit-btn-submit" onClick={() => openExplain(w)}>
              Explain
            </button>
            <button className="reddit-btn-reset" onClick={() => markReplaced(w.partKey)}>
              Mark Replaced
            </button>
          </div>
        </div>
      ))}

      {showModal && (
        <div
          className="reddit-modal"
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            width: "100vw",
            height: "100vh",
            background: "rgba(0,0,0,0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            style={{
              background: "#fff",
              padding: 20,
              borderRadius: 4,
              maxWidth: "600px",
              maxHeight: "80vh",
              overflowY: "auto",
            }}
            onClick={e => e.stopPropagation()}
          >
            <h3>Wear Explanation</h3>
            <p>{explanation}</p>
            <button className="reddit-btn-submit" onClick={() => setShowModal(false)}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
