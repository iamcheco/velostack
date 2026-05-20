"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { TrackerStore, Bike, PartProfile, RideLog, PartReplacement, PartsBinItem, FlipTransaction, BikeFrameSpecs, MountedPartsState } from "@/lib/tracker-types";

// localStorage key
const STORAGE_KEY = "vst";

const defaultStore: TrackerStore = {
  bikes: [],
  rides: [],
  parts: {},
  replacements: [],
  explanations: {},
  partsBin: [],
  bikeFrameSpecs: {},
  mountedParts: {},
};

const TrackerContext = createContext<{
  store: TrackerStore;
  setStore: React.Dispatch<React.SetStateAction<TrackerStore>>;
  selectedBikeId: string;
  setSelectedBikeId: React.Dispatch<React.SetStateAction<string>>;
  addPartsBinItem: (item: Omit<PartsBinItem, "id" | "dateAdded">) => void;
  removePartsBinItem: (id: string) => void;
  transactions: FlipTransaction[];
  addTransaction: (tx: Omit<FlipTransaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<FlipTransaction>) => void;
  deleteTransaction: (id: string) => void;
  updateFrameSpecs: (bikeId: string, specs: BikeFrameSpecs) => void;
  updateMountedParts: (bikeId: string, mounted: MountedPartsState) => void;
}>({
  store: defaultStore,
  setStore: () => {},
  selectedBikeId: "",
  setSelectedBikeId: () => {},
  addPartsBinItem: () => {},
  removePartsBinItem: () => {},
  transactions: [],
  addTransaction: () => {},
  updateTransaction: () => {},
  deleteTransaction: () => {},
  updateFrameSpecs: () => {},
  updateMountedParts: () => {},
});

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<TrackerStore>(defaultStore);
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');
  const [transactions, setTransactions] = useState<FlipTransaction[]>([]);

  // Load from localStorage on mount
  useEffect(() => {
    const raw = localStorage.getItem(STORAGE_KEY);
    let parsed: TrackerStore = { ...defaultStore };
    if (raw) {
      try {
        parsed = JSON.parse(raw) as TrackerStore;
        if (!parsed.partsBin) {
          parsed.partsBin = [];
        }
      } catch {
        // ignore
      }
    }

    const rawSpecs = localStorage.getItem("vst_frame_specs");
    if (rawSpecs) {
      try {
        parsed.bikeFrameSpecs = JSON.parse(rawSpecs);
      } catch {
        parsed.bikeFrameSpecs = {};
      }
    } else {
      parsed.bikeFrameSpecs = {};
    }

    const rawMounted = localStorage.getItem("vst_mounted_parts");
    if (rawMounted) {
      try {
        parsed.mountedParts = JSON.parse(rawMounted);
      } catch {
        parsed.mountedParts = {};
      }
    } else {
      parsed.mountedParts = {};
    }

    setStore(parsed);
    const rawLedger = localStorage.getItem("vst_ledger");
    if (rawLedger) {
      try {
        setTransactions(JSON.parse(rawLedger));
      } catch {
        // ignore parse errors
      }
    }
  }, []);

  // Persist store on any change
  useEffect(() => {
    const { bikeFrameSpecs, mountedParts, ...rest } = store as TrackerStore;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(rest));

    if (bikeFrameSpecs) {
      localStorage.setItem("vst_frame_specs", JSON.stringify(bikeFrameSpecs));
    }
    if (mountedParts) {
      localStorage.setItem("vst_mounted_parts", JSON.stringify(mountedParts));
    }
  }, [store]);

  // Persist ledger on any change
  useEffect(() => {
    localStorage.setItem("vst_ledger", JSON.stringify(transactions));
  }, [transactions]);

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

  const addTransaction = (tx: Omit<FlipTransaction, "id">) => {
    const newTx: FlipTransaction = {
      ...tx,
      id: `tx-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    };
    setTransactions((prev) => [...prev, newTx]);
  };

  const updateTransaction = (id: string, updates: Partial<FlipTransaction>) => {
    setTransactions((prev) =>
      prev.map((tx) => (tx.id === id ? { ...tx, ...updates } : tx))
    );
  };

  const deleteTransaction = (id: string) => {
    setTransactions((prev) => prev.filter((tx) => tx.id !== id));
  };

  const updateFrameSpecs = (bikeId: string, specs: BikeFrameSpecs) => {
    setStore((prev) => ({
      ...prev,
      bikeFrameSpecs: {
        ...(prev.bikeFrameSpecs || {}),
        [bikeId]: specs,
      },
    }));
  };

  const updateMountedParts = (bikeId: string, mounted: MountedPartsState) => {
    setStore((prev) => ({
      ...prev,
      mountedParts: {
        ...(prev.mountedParts || {}),
        [bikeId]: mounted,
      },
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
        transactions,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        updateFrameSpecs,
        updateMountedParts,
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => useContext(TrackerContext);
