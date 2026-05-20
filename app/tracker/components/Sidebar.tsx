"use client";

import React, { useState } from "react";
import { useTracker } from "@/app/tracker/context";
import type { Bike, BikeType } from "@/lib/tracker-types";
import { BIKE_TYPE_LABELS } from "@/lib/tracker-types";
import { getTotalBikeKm } from "@/lib/wear-engine";

export default function Sidebar() {
  const { store, setStore, selectedBikeId, setSelectedBikeId } = useTracker();
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState<BikeType>("road");
  const [adding, setAdding] = useState(false);

  const addBike = () => {
    if (!bikeName.trim()) return;
    const newBike: Bike = {
      id: crypto.randomUUID(),
      name: bikeName.trim(),
      type: bikeType,
      createdAt: new Date().toISOString(),
    };
    setStore(prev => ({
      ...prev,
      bikes: [...prev.bikes, newBike],
    }));
    setBikeName("");
    setSelectedBikeId(newBike.id);
    setAdding(false);
  };

  return (
    <div className="tracker-sidebar">
      <style jsx>{`
        .tracker-sidebar {
          display: flex;
          flex-direction: column;
          gap: 20px;
        }
        .bike-item {
          padding: 12px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          background: #ffffff;
          margin-bottom: 8px;
          cursor: pointer;
          transition: all 0.15s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .bike-item:hover {
          border-color: #cbd5e1;
          background: #f8fafc;
        }
        .bike-item.selected {
          border-color: #0f172a;
          background: #f8fafc;
          box-shadow: 0 0 0 1px #0f172a;
        }
        .bike-item-name {
          font-weight: 700;
          font-size: 13px;
          color: #0f172a;
        }
        .bike-item-type {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        .strava-btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          gap: 8px;
          background: #fc4c02;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #fc4c02;
          cursor: pointer;
          transition: all 0.15s ease;
          text-decoration: none;
          width: 100%;
          box-sizing: border-box;
        }
        .strava-btn:hover {
          background: #e04000;
          border-color: #e04000;
        }
      `}</style>

      {/* Strava connect */}
      <div className="modern-card">
        <h3 className="modern-card-title">🧡 Connect Strava</h3>
        <p style={{ fontSize: 12, color: "#64748b", margin: "0 0 12px 0", lineHeight: 1.5 }}>
          Sync your rides automatically from Strava to track component wear.
        </p>
        <a href="/api/strava/auth" className="strava-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          Connect with Strava
        </a>
      </div>

      {/* Bike list */}
      <div className="modern-card">
        <h3 className="modern-card-title">🚲 My Bikes</h3>
        {store.bikes.length === 0 && (
          <p style={{ fontSize: 12, color: "#64748b", margin: 0, textAlign: "center", padding: "12px 0" }}>
            No bikes added yet. Use the form below.
          </p>
        )}
        <div style={{ maxHeight: "300px", overflowY: "auto" }}>
          {store.bikes.map(b => {
            const totalKm = getTotalBikeKm(b.id, store.rides);
            const partCount = (store.parts[b.id] ?? []).length;
            return (
              <div
                key={b.id}
                className={`bike-item${selectedBikeId === b.id ? " selected" : ""}`}
                onClick={() => setSelectedBikeId(b.id)}
              >
                <div>
                  <div className="bike-item-name">{b.name}</div>
                  <div className="bike-item-type">
                    {BIKE_TYPE_LABELS[b.type]} · {totalKm} km · {partCount} part{partCount !== 1 ? "s" : ""}
                  </div>
                </div>
                {selectedBikeId === b.id && (
                  <span style={{ color: "#0f172a", fontSize: 12, fontWeight: 700 }}>Active</span>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Add bike form */}
      <div className="modern-card">
        <h3 className="modern-card-title">➕ Add a Bike</h3>
        {!adding ? (
          <button className="btn-modern-secondary" style={{ width: "100%", justifyContent: "center" }} onClick={() => setAdding(true)}>
            + New Bike
          </button>
        ) : (
          <>
            <div className="modern-form-group">
              <label className="modern-form-label">Bike Name</label>
              <input
                className="modern-form-input"
                type="text"
                value={bikeName}
                onChange={e => setBikeName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addBike(); if (e.key === "Escape") setAdding(false); }}
                placeholder="e.g. Trek Émonda SL5"
                autoFocus
              />
            </div>
            <div className="modern-form-group">
              <label className="modern-form-label">Bike Type</label>
              <select
                className="modern-form-input"
                value={bikeType}
                onChange={e => setBikeType(e.target.value as BikeType)}
              >
                {Object.entries(BIKE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 8, marginTop: 8 }}>
              <button className="btn-modern-primary" style={{ flex: 1, justifyContent: "center" }} onClick={addBike}>Add</button>
              <button className="btn-modern-secondary" style={{ flex: 1, justifyContent: "center" }} onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>

      {/* Info box */}
      <div className="modern-card">
        <h3 className="modern-card-title">ℹ️ Wear Tracking</h3>
        <p style={{ fontSize: 12, color: "#64748b", margin: 0, lineHeight: 1.6 }}>
          Register your active bikes and log their individual components, then track wear in real time by logging rides.
        </p>
        <p style={{ fontSize: 12, color: "#64748b", margin: "8px 0 0 0", lineHeight: 1.6 }}>
          The ⚡ Wear Report calculates actual component health based on distance, terrain types, weather conditions, and relative rider effort.
        </p>
      </div>
    </div>
  );
}
