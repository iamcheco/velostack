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
    <div className="reddit-sidebar">
      {/* Strava connect */}
      <div className="reddit-sidebox">
        <div className="reddit-sidebox-title">Connect Strava</div>
        <p style={{ fontSize: 11, color: "#555", margin: "0 0 8px 0" }}>
          Sync your rides automatically from Strava.
        </p>
        <a href="/api/strava/auth" className="strava-btn">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
            <path d="M15.387 17.944l-2.089-4.116h-3.065L15.387 24l5.15-10.172h-3.066m-7.008-5.599l2.836 5.599h4.172L10.463 0l-7 13.828h4.169" />
          </svg>
          Connect with Strava
        </a>
      </div>

      {/* Bike list */}
      <div className="reddit-sidebox">
        <div className="reddit-sidebox-title">My Bikes</div>
        {store.bikes.length === 0 && (
          <p style={{ fontSize: 11, color: "#888", margin: 0 }}>No bikes yet. Add one below.</p>
        )}
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
                <div>{b.name}</div>
                <div className="bike-item-type">
                  {BIKE_TYPE_LABELS[b.type]} · {totalKm} km · {partCount} part{partCount !== 1 ? "s" : ""}
                </div>
              </div>
              {selectedBikeId === b.id && (
                <span style={{ color: "#5f99cf", fontSize: 14 }}>▶</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Add bike form */}
      <div className="reddit-sidebox">
        <div className="reddit-sidebox-title">Add a Bike</div>
        {!adding ? (
          <button className="reddit-btn-submit" style={{ width: "100%" }} onClick={() => setAdding(true)}>
            + New Bike
          </button>
        ) : (
          <>
            <div className="reddit-form-group">
              <label className="reddit-form-label">Name</label>
              <input
                className="reddit-form-input"
                type="text"
                value={bikeName}
                onChange={e => setBikeName(e.target.value)}
                onKeyDown={e => { if (e.key === "Enter") addBike(); if (e.key === "Escape") setAdding(false); }}
                placeholder="e.g. Trek Émonda SL5"
                autoFocus
              />
            </div>
            <div className="reddit-form-group">
              <label className="reddit-form-label">Type</label>
              <select
                className="reddit-form-input"
                value={bikeType}
                onChange={e => setBikeType(e.target.value as BikeType)}
              >
                {Object.entries(BIKE_TYPE_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>
            <div style={{ display: "flex", gap: 6 }}>
              <button className="reddit-btn-submit" onClick={addBike}>Add</button>
              <button className="reddit-btn-reset" onClick={() => setAdding(false)}>Cancel</button>
            </div>
          </>
        )}
      </div>

      {/* Info box */}
      <div className="reddit-sidebox">
        <div className="reddit-sidebox-title">About Tracker</div>
        <p style={{ fontSize: 11, color: "#555", margin: 0, lineHeight: 1.6 }}>
          Add your bike and its components, then log rides to track wear in real time. The ⚡ Wear Report uses a deterministic wear model based on distance, terrain, weather, and effort.
        </p>
      </div>
    </div>
  );
}
