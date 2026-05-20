"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { TrackerStore, Bike, PartProfile, RideLog, PartReplacement, PartsBinItem } from "@/lib/tracker-types";

// localStorage key
const STORAGE_KEY = "vst";

const defaultStore: TrackerStore = {
  bikes: [],
  rides: [],
  parts: {},
  replacements: [],
  explanations: {},
  partsBin: [],
};

const TrackerContext = createContext<{
  store: TrackerStore;
  setStore: React.Dispatch<React.SetStateAction<TrackerStore>>;
  selectedBikeId: string;
  setSelectedBikeId: React.Dispatch<React.SetStateAction<string>>;
  addPartsBinItem: (item: Omit<PartsBinItem, "id" | "dateAdded">) => void;
  removePartsBinItem: (id: string) => void;
}>({
  store: defaultStore,
  setStore: () => {},
  selectedBikeId: "",
  setSelectedBikeId: () => {},
  addPartsBinItem: () => {},
  removePartsBinItem: () => {},
});

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<TrackerStore>(defaultStore);
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as TrackerStore;
        // Ensure partsBin is initialized if missing in older schema
        if (!parsed.partsBin) {
          parsed.partsBin = [];
        }
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

  // Expose Actions
  const addPartsBinItem = (item: Omit<PartsBinItem, "id" | "dateAdded">) => {
    setStore((prev) => {
      const newItem: PartsBinItem = {
        ...item,
        id: `partbin-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date().toISOString().split("T")[0],
      };
      return {
        ...prev,
        partsBin: [...(prev.partsBin || []), newItem],
      };
    });
  };

  const removePartsBinItem = (id: string) => {
    setStore((prev) => ({
      ...prev,
      partsBin: (prev.partsBin || []).filter((item) => item.id !== id),
    }));
  };

  return (
    <TrackerContext.Provider
      value={{
        store,
        setStore,
        selectedBikeId,
        setSelectedBikeId,
        addPartsBinItem,
        removePartsBinItem,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => useContext(TrackerContext);
