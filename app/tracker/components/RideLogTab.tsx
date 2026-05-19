"use client";

import React, { useState } from "react";
import { useTracker } from "@/app/tracker/context";
import type { RideLog, TerrainType, ConditionType, EffortLevel } from "@/lib/tracker-types";

const terrainEmoji: Record<TerrainType, string> = {
  road: "🛣️", gravel: "🪨", trail: "🌲",
};
const conditionEmoji: Record<ConditionType, string> = {
  dry: "☀️", wet: "🌧️", muddy: "💧",
};
const effortEmoji: Record<EffortLevel, string> = {
  easy: "😊", moderate: "😤", hard: "🔥",
};

export default function RideLogTab() {
  const { store, setStore, selectedBikeId } = useTracker();
  const [distance, setDistance] = useState<string>("30");
  const [elevation, setElevation] = useState<string>("200");
  const [terrain, setTerrain] = useState<TerrainType>("road");
  const [condition, setCondition] = useState<ConditionType>("dry");
  const [effort, setEffort] = useState<EffortLevel>("moderate");
  const [submitted, setSubmitted] = useState(false);

  const selectedBike = store.bikes.find(b => b.id === selectedBikeId);
  const bikeRides = store.rides
    .filter(r => r.bikeId === selectedBikeId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const logRide = () => {
    if (!selectedBikeId) return;
    const km = parseFloat(distance) || 0;
    const elev = parseFloat(elevation) || 0;
    if (km <= 0) return;
    const newRide: RideLog = {
      id: crypto.randomUUID(),
      bikeId: selectedBikeId,
      date: new Date().toISOString(),
      distanceKm: km,
      elevationM: elev,
      terrain,
      condition,
      effort,
      source: "manual",
    };
    setStore(prev => ({
      ...prev,
      rides: [...prev.rides, newRide],
    }));
    setSubmitted(true);
    setTimeout(() => setSubmitted(false), 2000);
  };

  if (!selectedBikeId) {
    return (
      <div className="reddit-form" style={{ textAlign: "center", color: "#888", padding: 40 }}>
        <div style={{ fontSize: 28, marginBottom: 8 }}>🚴</div>
        <div>Select a bike from the sidebar to log a ride.</div>
      </div>
    );
  }

  const totalKm = bikeRides.reduce((s, r) => s + r.distanceKm, 0);
  const totalElev = bikeRides.reduce((s, r) => s + r.elevationM, 0);

  return (
    <div>
      {/* Log form */}
      <div className="reddit-form">
        <h2 style={{ fontSize: 14, color: "#336699", margin: "0 0 12px 0", fontWeight: "bold", borderBottom: "1px solid #cee3f8", paddingBottom: 6 }}>
          🚴 Log a Ride on <em>{selectedBike?.name}</em>
        </h2>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="reddit-form-label">Distance (km)</label>
            <input
              className="reddit-form-input"
              type="number"
              min="0"
              step="0.1"
              value={distance}
              onChange={e => setDistance(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="reddit-form-label">Elevation (m)</label>
            <input
              className="reddit-form-input"
              type="number"
              min="0"
              step="10"
              value={elevation}
              onChange={e => setElevation(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 8, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="reddit-form-label">Terrain</label>
            <select className="reddit-form-input" value={terrain} onChange={e => setTerrain(e.target.value as TerrainType)}>
              <option value="road">🛣️ Road</option>
              <option value="gravel">🪨 Gravel</option>
              <option value="trail">🌲 Trail</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="reddit-form-label">Condition</label>
            <select className="reddit-form-input" value={condition} onChange={e => setCondition(e.target.value as ConditionType)}>
              <option value="dry">☀️ Dry</option>
              <option value="wet">🌧️ Wet</option>
              <option value="muddy">💧 Muddy</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="reddit-form-label">Effort</label>
            <select className="reddit-form-input" value={effort} onChange={e => setEffort(e.target.value as EffortLevel)}>
              <option value="easy">😊 Easy</option>
              <option value="moderate">😤 Moderate</option>
              <option value="hard">🔥 Hard</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 12, display: "flex", alignItems: "center", gap: 10 }}>
          <button className="reddit-btn-submit" onClick={logRide}>
            Log Ride
          </button>
          {submitted && (
            <span style={{ color: "#2ecc71", fontWeight: "bold", fontSize: 11 }}>
              ✓ Ride logged!
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {bikeRides.length > 0 && (
        <div style={{ display: "flex", gap: 20, padding: "10px 14px", background: "#f4f9fd", border: "1px solid #cee3f8", borderRadius: 4, marginBottom: 14, fontSize: 12 }}>
          <div><strong>{bikeRides.length}</strong> <span style={{ color: "#666" }}>rides</span></div>
          <div><strong>{totalKm.toFixed(1)} km</strong> <span style={{ color: "#666" }}>total</span></div>
          <div><strong>{totalElev.toLocaleString()} m</strong> <span style={{ color: "#666" }}>elevation</span></div>
        </div>
      )}

      {/* Ride history */}
      {bikeRides.length > 0 && (
        <div>
          <div style={{ fontWeight: "bold", fontSize: 13, color: "#222", marginBottom: 8 }}>Ride History</div>
          {bikeRides.map(r => (
            <div key={r.id} className="ride-row">
              <span className="ride-row-date">{new Date(r.date).toLocaleDateString()}</span>
              <span style={{ fontWeight: "bold" }}>{r.distanceKm} km</span>
              <span style={{ color: "#666" }}>{r.elevationM} m ↑</span>
              <span>{terrainEmoji[r.terrain]} {r.terrain}</span>
              <span>{conditionEmoji[r.condition]} {r.condition}</span>
              <span>{effortEmoji[r.effort]} {r.effort}</span>
              {r.source === "strava" && (
                <span style={{ color: "#fc4c02", fontSize: 10, fontWeight: "bold" }}>STRAVA</span>
              )}
            </div>
          ))}
        </div>
      )}

      {bikeRides.length === 0 && (
        <div style={{ color: "#888", fontSize: 12, padding: "12px 0" }}>
          No rides logged yet. Use the form above to add your first ride.
        </div>
      )}
    </div>
  );
}
