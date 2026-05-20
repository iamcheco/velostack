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
      <div className="modern-card" style={{ textAlign: "center", color: "#64748b", padding: "60px 20px" }}>
        <span style={{ fontSize: 40, display: "block", marginBottom: 12 }}>🚴</span>
        <p style={{ fontWeight: 600, color: "#475569", margin: "0 0 4px 0" }}>No Bike Selected</p>
        <p style={{ fontSize: 13, margin: 0 }}>Select a bike from the sidebar to log ride activities.</p>
      </div>
    );
  }

  const totalKm = bikeRides.reduce((s, r) => s + r.distanceKm, 0);
  const totalElev = bikeRides.reduce((s, r) => s + r.elevationM, 0);

  return (
    <div>
      <style jsx>{`
        .stats-summary-bar {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 16px;
          margin-bottom: 20px;
        }
        .stat-summary-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px;
          text-align: center;
        }
        .stat-summary-val {
          font-size: 16px;
          font-weight: 800;
          color: #0f172a;
          display: block;
        }
        .stat-summary-label {
          font-size: 11px;
          color: #64748b;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ride-history-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
        }
        .ride-history-row {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 12px 16px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: all 0.15s ease;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ride-history-row:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.02);
        }
        .ride-main-info {
          display: flex;
          align-items: center;
          gap: 16px;
        }
        .ride-date {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }
        .ride-dist-box {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }
        .ride-elev-box {
          font-size: 12px;
          color: #64748b;
          font-weight: 600;
        }
        .ride-badges {
          display: flex;
          gap: 6px;
          flex-wrap: wrap;
        }
        .ride-badge {
          font-size: 11px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          color: #475569;
          padding: 3px 8px;
          border-radius: 6px;
          font-weight: 600;
          display: inline-flex;
          align-items: center;
          gap: 4px;
        }
      `}</style>

      {/* Log form */}
      <div className="modern-card">
        <h3 className="modern-card-title">
          🚴 Log a Ride on <em>{selectedBike?.name}</em>
        </h3>

        <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="modern-form-label">Distance (km)</label>
            <input
              className="modern-form-input"
              type="number"
              min="0"
              step="0.1"
              value={distance}
              onChange={e => setDistance(e.target.value)}
            />
          </div>
          <div style={{ flex: 1, minWidth: 120 }}>
            <label className="modern-form-label">Elevation Gain (m)</label>
            <input
              className="modern-form-input"
              type="number"
              min="0"
              step="10"
              value={elevation}
              onChange={e => setElevation(e.target.value)}
            />
          </div>
        </div>

        <div style={{ display: "flex", gap: 12, marginTop: 12, flexWrap: "wrap" }}>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="modern-form-label">Terrain Type</label>
            <select className="modern-form-input" value={terrain} onChange={e => setTerrain(e.target.value as TerrainType)}>
              <option value="road">🛣️ Road</option>
              <option value="gravel">🪨 Gravel</option>
              <option value="trail">🌲 Trail</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="modern-form-label">Weather / Conditions</label>
            <select className="modern-form-input" value={condition} onChange={e => setCondition(e.target.value as ConditionType)}>
              <option value="dry">☀️ Dry</option>
              <option value="wet">🌧️ Wet</option>
              <option value="muddy">💧 Muddy</option>
            </select>
          </div>
          <div style={{ flex: 1, minWidth: 100 }}>
            <label className="modern-form-label">Rider Effort</label>
            <select className="modern-form-input" value={effort} onChange={e => setEffort(e.target.value as EffortLevel)}>
              <option value="easy">😊 Easy</option>
              <option value="moderate">😤 Moderate</option>
              <option value="hard">🔥 Hard</option>
            </select>
          </div>
        </div>

        <div style={{ marginTop: 16, display: "flex", alignItems: "center", gap: 12 }}>
          <button className="btn-modern-primary" onClick={logRide}>
            Log Active Ride
          </button>
          {submitted && (
            <span style={{ color: "#166534", fontWeight: 700, fontSize: 13, background: "#dcfce7", padding: "4px 10px", borderRadius: 6 }}>
              ✓ Ride logged successfully!
            </span>
          )}
        </div>
      </div>

      {/* Stats bar */}
      {bikeRides.length > 0 && (
        <div className="stats-summary-bar">
          <div className="stat-summary-card">
            <span className="stat-summary-val">{bikeRides.length}</span>
            <span className="stat-summary-label">Total Rides</span>
          </div>
          <div className="stat-summary-card">
            <span className="stat-summary-val">{totalKm.toFixed(1)} km</span>
            <span className="stat-summary-label">Total Distance</span>
          </div>
          <div className="stat-summary-card">
            <span className="stat-summary-val">{totalElev.toLocaleString()} m</span>
            <span className="stat-summary-label">Total Elevation</span>
          </div>
        </div>
      )}

      {/* Ride history */}
      {bikeRides.length > 0 && (
        <div>
          <h3 style={{ fontWeight: 700, fontSize: 14, color: "#0f172a", marginBottom: 12 }}>📋 Ride Activity History</h3>
          <div className="ride-history-list">
            {bikeRides.map(r => (
              <div key={r.id} className="ride-history-row">
                <div className="ride-main-info">
                  <span className="ride-date">{new Date(r.date).toLocaleDateString()}</span>
                  <span className="ride-dist-box">{r.distanceKm.toFixed(1)} km</span>
                  <span className="ride-elev-box">+{r.elevationM}m</span>
                </div>
                <div className="ride-badges">
                  <span className="ride-badge">{terrainEmoji[r.terrain]} {r.terrain}</span>
                  <span className="ride-badge">{conditionEmoji[r.condition]} {r.condition}</span>
                  <span className="ride-badge">{effortEmoji[r.effort]} {r.effort}</span>
                  {r.source === "strava" && (
                    <span className="ride-badge" style={{ color: "#fc4c02", borderColor: "#fc4c02", background: "#fff5f2" }}>STRAVA</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {bikeRides.length === 0 && (
        <div className="modern-card" style={{ textAlign: "center", color: "#64748b", padding: "40px 20px" }}>
          <span style={{ fontSize: 28, display: "block", marginBottom: 8 }}>📝</span>
          <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#475569" }}>No logged rides yet.</p>
          <p style={{ margin: 0, fontSize: 12 }}>Submit your first ride using the logging card above!</p>
        </div>
      )}
    </div>
  );
}
