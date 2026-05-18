"use client";

import React, { useState } from "react";
import { useTracker } from "@/app/tracker/context";
import type { RideLog, TerrainType, ConditionType, EffortLevel, Bike } from "@/lib/tracker-types";

export default function RideLogTab() {
  const { store, setStore, selectedBikeId } = useTracker();
  const [distance, setDistance] = useState(0);
  const [elevation, setElevation] = useState(0);
  const [terrain, setTerrain] = useState<TerrainType>("road");
  const [condition, setCondition] = useState<ConditionType>("dry");
  const [effort, setEffort] = useState<EffortLevel>("easy");
  const [loading, setLoading] = useState(false);

  const addRide = () => {
    if (!selectedBikeId) { alert("Select a bike first"); return; }
    setLoading(true);
    const newRide: RideLog = {
      id: crypto.randomUUID(),
      bikeId: selectedBikeId,
      date: new Date().toISOString(),
      distanceKm: distance,
      elevationM: elevation,
      terrain,
      condition,
      effort,
      source: "manual",
    };
    setStore(prev => ({
      ...prev,
      rides: [...prev.rides, newRide],
    }));
    // reset form
    setDistance(0);
    setElevation(0);
    setTerrain("road");
    setCondition("dry");
    setEffort("easy");
    setLoading(false);
  };

  return (
    <div className="reddit-form">
      <h2 className="reddit-sidebox-title">Ride Log</h2>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Distance (km)</label>
        <input
          className="reddit-form-input"
          type="number"
          min="0"
          value={distance}
          onChange={e => setDistance(parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Elevation Gain (m)</label>
        <input
          className="reddit-form-input"
          type="number"
          min="0"
          value={elevation}
          onChange={e => setElevation(parseFloat(e.target.value) || 0)}
        />
      </div>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Terrain</label>
        <select
          className="reddit-form-input"
          value={terrain}
          onChange={e => setTerrain(e.target.value as TerrainType)}
        >
          <option value="road">Road</option>
          <option value="gravel">Gravel</option>
          <option value="trail">Trail</option>
        </select>
      </div>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Condition</label>
        <select
          className="reddit-form-input"
          value={condition}
          onChange={e => setCondition(e.target.value as ConditionType)}
        >
          <option value="dry">Dry</option>
          <option value="wet">Wet</option>
          <option value="muddy">Muddy</option>
        </select>
      </div>
      <div className="reddit-form-group">
        <label className="reddit-form-label">Effort</label>
        <select
          className="reddit-form-input"
          value={effort}
          onChange={e => setEffort(e.target.value as EffortLevel)}
        >
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="hard">Hard</option>
        </select>
      </div>
      <button className="reddit-btn-submit" onClick={addRide} disabled={loading}>
        {loading ? "Logging..." : "Log Ride"}
      </button>
    </div>
  );
}
