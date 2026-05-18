"use client";

import React, { useState } from "react";
import { useTracker } from "@/app/tracker/context";
import type { Bike, BikeType } from "@/lib/tracker-types";
import { BIKE_TYPE_LABELS } from "@/lib/tracker-types";

export default function Sidebar() {
  const { store, setStore, selectedBikeId, setSelectedBikeId } = useTracker();
  const [bikeName, setBikeName] = useState("");
  const [bikeType, setBikeType] = useState<BikeType>("road");

  const addBike = () => {
    if (!bikeName) return;
    const newBike: Bike = {
      id: crypto.randomUUID(),
      name: bikeName,
      type: bikeType,
      createdAt: new Date().toISOString(),
    };
    setStore(prev => ({
      ...prev,
      bikes: [...prev.bikes, newBike],
    }));
    setBikeName("");
    setSelectedBikeId(newBike.id);
  };

  return (
    <div className="reddit-sidebar">
      <div className="reddit-sidebox">
        <div className="reddit-sidebox-title">Your Bikes</div>
        {store.bikes.map(b => (
          <div key={b.id} style={{ marginBottom: 6, cursor: "pointer" }} onClick={() => setSelectedBikeId(b.id)}>
            <span style={{ fontWeight: selectedBikeId === b.id ? "bold" : "normal" }}>{b.name}</span>
            <span style={{ color: "#666", marginLeft: 4 }}>({BIKE_TYPE_LABELS[b.type]})</span>
          </div>
        ))}
      </div>

      <div className="reddit-sidebox">
        <div className="reddit-sidebox-title">Add Bike</div>
        <div className="reddit-form-group">
          <label className="reddit-form-label">Name</label>
          <input
            className="reddit-form-input"
            type="text"
            value={bikeName}
            onChange={e => setBikeName(e.target.value)}
            placeholder="My Bike"
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
        <button className="reddit-btn-submit" onClick={addBike}>Add Bike</button>
      </div>
    </div>
  );
}
