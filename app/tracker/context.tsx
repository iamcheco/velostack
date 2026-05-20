"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from "react";
import type { TrackerStore, Bike, PartProfile, RideLog, PartReplacement, PartsBinItem, FlipTransaction } from "@/lib/tracker-types";

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
  transactions: FlipTransaction[];
  addTransaction: (tx: Omit<FlipTransaction, "id">) => void;
  updateTransaction: (id: string, updates: Partial<FlipTransaction>) => void;
  deleteTransaction: (id: string) => void;
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
});

export const TrackerProvider = ({ children }: { children: ReactNode }) => {
  const [store, setStore] = useState<TrackerStore>(defaultStore);
  const [selectedBikeId, setSelectedBikeId] = useState<string>('');
  const [transactions, setTransactions] = useState<FlipTransaction[]>([]);

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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
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
      }}
    >
      {children}
    </TrackerContext.Provider>
  );
};

export const useTracker = () => useContext(TrackerContext);
