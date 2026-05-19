"use client";

import React, { useState, useEffect } from "react";
import { useTracker } from "@/app/tracker/context";
import { calcPartWear, getTotalBikeKm } from "@/lib/wear-engine";
import type { PartProfile, WearResult } from "@/lib/tracker-types";
import { PART_TYPE_LABELS } from "@/lib/tracker-types";

function healthColor(pct: number): string {
  if (pct > 60) return "#2ecc71";
  if (pct > 30) return "#f39c12";
  return "#e74c3c";
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
    case "good":         return "reddit-flair-great";
    case "watch":        return "reddit-flair-fair";
    case "replace_soon": return "reddit-flair-pass";
    case "overdue":      return "reddit-flair-avoid";
  }
}

export default function WearReportTab() {
  const { store, setStore, selectedBikeId } = useTracker();
  const [wearResults, setWearResults] = useState<WearResult[]>([]);
  const [modalPartKey, setModalPartKey] = useState<string | null>(null);
  const [modalLoading, setModalLoading] = useState(false);
  const [modalText, setModalText] = useState("");

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
      setModalPartKey(wr.partKey);
      return;
    }

    setModalLoading(true);
    setModalPartKey(wr.partKey);
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

  const closeModal = () => {
    setModalPartKey(null);
    setModalText("");
    setModalLoading(false);
  };

  const markReplaced = (partKey: string) => {
    if (!selectedBikeId) return;
    setStore(prev => ({
      ...prev,
      replacements: [
        ...prev.replacements,
        {
          partKey,
          bikeId: selectedBikeId,
          replacedAt: new Date().toISOString(),
          replacedAtTotalKm: getTotalBikeKm(selectedBikeId, prev.rides),
        },
      ],
      // Clear cached explanation so it refreshes
      explanations: { ...prev.explanations, [partKey]: "" },
    }));
  };

  // ── Empty states ────────────────────────────────────────────────
  if (!selectedBikeId) {
    return (
      <div className="reddit-form" style={{ textAlign: "center", color: "#888", padding: 40 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>⚡</div>
        <div>Select a bike to view its Wear Report.</div>
      </div>
    );
  }

  if (bikeParts.length === 0) {
    return (
      <div className="reddit-form" style={{ color: "#888", padding: 30 }}>
        <strong>No parts tracked yet.</strong>
        <p style={{ marginTop: 6, fontSize: 12 }}>
          Go to the <strong>🔩 Parts</strong> tab and add components to your bike. Then log some rides — the Wear Report will automatically update.
        </p>
      </div>
    );
  }

  const totalKm = getTotalBikeKm(selectedBikeId, store.rides);

  return (
    <div>
      {/* Header */}
      <div style={{ marginBottom: 14 }}>
        <h2 style={{ fontSize: 14, color: "#336699", margin: "0 0 4px 0", fontWeight: "bold" }}>
          ⚡ Wear Report — <em>{selectedBike?.name}</em>
        </h2>
        <div style={{ fontSize: 11, color: "#666" }}>
          {totalKm} km total · {bikeParts.length} component{bikeParts.length !== 1 ? "s" : ""} tracked
        </div>
      </div>

      {/* Wear cards */}
      {wearResults.map(wr => {
        const isModalOpen = modalPartKey === wr.partKey;
        const barColor = healthColor(wr.healthPercent);

        return (
          <div key={wr.partKey} className="wear-card">
            {/* Title row */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
              <div>
                <span style={{ fontWeight: "bold", fontSize: 13 }}>{wr.modelName}</span>
                <span style={{ color: "#888", fontSize: 11, marginLeft: 6 }}>
                  {PART_TYPE_LABELS[wr.partType]}
                </span>
              </div>
              <span className={`reddit-flair ${statusClass(wr.status)}`}>
                {statusLabel(wr.status)}
              </span>
            </div>

            {/* Health bar */}
            <div className="health-bar-track">
              <div
                className="health-bar-fill"
                style={{ width: `${wr.healthPercent}%`, background: barColor }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 11, color: "#555", marginTop: 3, marginBottom: 8 }}>
              <span style={{ fontWeight: "bold", color: barColor }}>{wr.healthPercent}% health</span>
              <span>{wr.kmSinceReplacement} km ridden since replacement</span>
            </div>

            {/* Forecast */}
            <div style={{ fontSize: 11, background: "#f8fbff", border: "1px solid #dde8f2", borderRadius: 3, padding: "5px 8px", marginBottom: 10, color: "#336699" }}>
              🗓️ Forecast: <strong>{wr.forecastKmLow}–{wr.forecastKmHigh} km</strong> remaining ·{" "}
              Replacement cost: <strong>€{wr.replacementCostEur}</strong>
            </div>

            {/* Action buttons */}
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <button className="reddit-btn-submit" onClick={() => openExplain(wr)}>
                💬 Explain
              </button>
              <button className="reddit-btn-reset" onClick={() => markReplaced(wr.partKey)}>
                ✅ Mark Replaced
              </button>
            </div>

            {/* Inline cached explanation preview */}
            {store.explanations[wr.partKey] && (
              <div style={{ marginTop: 10, fontSize: 11, color: "#444", fontStyle: "italic", borderLeft: "2px solid #5f99cf", paddingLeft: 8 }}>
                {store.explanations[wr.partKey]}
              </div>
            )}
          </div>
        );
      })}

      {/* Explain Modal */}
      {modalPartKey && (
        <div className="explain-modal-overlay" onClick={closeModal}>
          <div className="explain-modal" onClick={e => e.stopPropagation()}>
            <h3>⚡ Mechanic&apos;s Diagnosis</h3>
            {modalLoading ? (
              <div>
                <div className="reddit-skeleton" style={{ height: 14, width: "90%", marginBottom: 8 }} />
                <div className="reddit-skeleton" style={{ height: 14, width: "75%", marginBottom: 8 }} />
                <div className="reddit-skeleton" style={{ height: 14, width: "60%" }} />
              </div>
            ) : (
              <p>{modalText}</p>
            )}
            <button className="reddit-btn-submit" onClick={closeModal}>
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
