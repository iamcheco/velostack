"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { TrackerStore, Bike, PartProfile, RideLog, PartReplacement } from "@/lib/tracker-types";

// localStorage key
const STORAGE_KEY = "vst";

const defaultStore: TrackerStore = {
  bikes: [],
  rides: [],
  parts: {},
  replacements: [],
  explanations: {},
};
// Selected bike ID (empty means no bike selected yet)


const TrackerContext = createContext<{
  store: TrackerStore;
  setStore: React.Dispatch<React.SetStateAction<TrackerStore>>;
  selectedBikeId: string;
  setSelectedBikeId: React.Dispatch<React.SetStateAction<string>>;
}>({ store: defaultStore, setStore: () => {}, selectedBikeId: '', setSelectedBikeId: () => {} });

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<TrackerStore>(defaultStore);
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TrackerStore;
        setStore(parsed);
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Persist on any change
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
  }, [store]);

  // Persist selected bike id separately (optional)
  useEffect(() => {
    if (selectedBikeId) localStorage.setItem('selectedBikeId', selectedBikeId);
  }, [selectedBikeId]);

  return (
    <TrackerContext.Provider value={{ store, setStore, selectedBikeId, setSelectedBikeId }}>
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => useContext(TrackerContext);
