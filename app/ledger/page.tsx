"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrackerProvider, useTracker } from "@/app/tracker/context";
import { BIKE_TYPE_LABELS } from "@/lib/tracker-types";
import type { FlipTransaction, Bike } from "@/lib/tracker-types";

function LedgerContent() {
  const { store, transactions, addTransaction, updateTransaction, deleteTransaction } = useTracker();
  const [activeFilter, setActiveFilter] = useState<"active" | "sold">("active");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [expandedTxId, setExpandedTxId] = useState<string | null>(null);

  // Form states for Logging New Transaction
  const [selectedBikeId, setSelectedBikeId] = useState<string>("");
  const [customTitle, setCustomTitle] = useState<string>("");
  const [purchasePrice, setPurchasePrice] = useState<number>(0);
  const [askingPrice, setAskingPrice] = useState<number>(0);
  const [laborHours, setLaborHours] = useState<number>(0);
  const [hourlyRate, setHourlyRate] = useState<number>(30); // Default €30/hr rate
  const [status, setStatus] = useState<"sourcing" | "in_progress" | "listed" | "sold">("in_progress");
  
  // Track checked parts from chosen bike to include in partsExpense
  const [bikePartsToInclude, setBikePartsToInclude] = useState<Record<string, { name: string; cost: number; checked: boolean }>>({});

  // Inline forms for adding expenses to expanded rows
  const [newPartName, setNewPartName] = useState("");
  const [newPartCost, setNewPartCost] = useState<number>(0);
  const [newMiscName, setNewMiscName] = useState("");
  const [newMiscCost, setNewMiscCost] = useState<number>(0);

  // Sold status modal helper states
  const [sellPriceInput, setSellPriceInput] = useState<number>(0);
  const [sellDateInput, setSellDateInput] = useState<string>(new Date().toISOString().split("T")[0]);

  // Handle bike dropdown change to dynamically pre-fill defaults
  const handleBikeChange = (bikeId: string) => {
    setSelectedBikeId(bikeId);
    if (!bikeId || bikeId === "custom") {
      setCustomTitle("");
      setBikePartsToInclude({});
      return;
    }

    const bike = store.bikes.find(b => b.id === bikeId);
    if (bike) {
      setCustomTitle(bike.name);
      
      // Load components currently installed on this bike to let user pre-select
      const parts = store.parts[bikeId] ?? [];
      const partsMap: Record<string, { name: string; cost: number; checked: boolean }> = {};
      parts.forEach(part => {
        partsMap[part.partKey] = {
          name: `${part.brand} ${part.modelName}`,
          cost: part.replacementCostEur,
          checked: true // Check by default
        };
      });
      setBikePartsToInclude(partsMap);
    }
  };

  const handleCreateTransaction = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customTitle.trim()) return;

    // Build parts expense list from checked parts
    const partsExpense = Object.entries(bikePartsToInclude)
      .filter(([_, data]) => data.checked)
      .map(([id, data]) => ({
        id: `part-${Date.now()}-${id}`,
        partName: data.name,
        cost: data.cost
      }));

    addTransaction({
      bikeId: selectedBikeId || "custom",
      title: customTitle,
      purchasePrice,
      partsExpense,
      miscExpense: [],
      laborHours,
      hourlyRate,
      askingPrice,
      status: status,
      finalSalePrice: status === "sold" ? askingPrice : undefined,
      saleDate: status === "sold" ? new Date().toISOString().split("T")[0] : undefined
    });

    // Reset Form
    setSelectedBikeId("");
    setCustomTitle("");
    setPurchasePrice(0);
    setAskingPrice(0);
    setLaborHours(0);
    setBikePartsToInclude({});
    setStatus("in_progress");
    setIsModalOpen(false);
  };

  // Financial Metrics Calculations
  const soldTransactions = transactions.filter(t => t.status === "sold");
  const activeTransactions = transactions.filter(t => t.status !== "sold");

  // Helper to calculate total parts cost
  const getPartsTotal = (tx: FlipTransaction) => tx.partsExpense.reduce((sum, p) => sum + p.cost, 0);
  // Helper to calculate total misc cost
  const getMiscTotal = (tx: FlipTransaction) => tx.miscExpense.reduce((sum, m) => sum + m.cost, 0);
  // Helper to calculate total investment cost
  const getTotalInvestment = (tx: FlipTransaction) => tx.purchasePrice + getPartsTotal(tx) + getMiscTotal(tx);

  // 1. Net Realized Profit (Realized from Sold)
  const netRealizedProfit = soldTransactions.reduce((sum, tx) => {
    const revenue = tx.finalSalePrice ?? 0;
    const profit = revenue - getTotalInvestment(tx);
    return sum + profit;
  }, 0);

  // 2. Capital Deployed (Tied up in active flips)
  const capitalDeployed = activeTransactions.reduce((sum, tx) => sum + getTotalInvestment(tx), 0);

  // Total investment on completed flips to compute exact average ROI %
  const totalSoldInvestment = soldTransactions.reduce((sum, tx) => sum + getTotalInvestment(tx), 0);
  
  // 3. Average ROI % on Sold Flips
  const averageRoiPercent = totalSoldInvestment > 0 
    ? (netRealizedProfit / totalSoldInvestment) * 100 
    : 0;

  // 4. Average Hourly Yield (Net Realized Profit / Total Realized Labor Hours)
  const totalSoldHours = soldTransactions.reduce((sum, tx) => sum + tx.laborHours, 0);
  const averageHourlyYield = totalSoldHours > 0 
    ? netRealizedProfit / totalSoldHours 
    : 0;

  // Visual chart metrics: Total Capital deployed overall vs total revenue overall
  const totalCapitalInvestedOverall = transactions.reduce((sum, tx) => sum + getTotalInvestment(tx), 0);
  const totalRealizedRevenueOverall = soldTransactions.reduce((sum, tx) => sum + (tx.finalSalePrice ?? 0), 0);

  const filteredTransactions = transactions.filter(tx => {
    if (activeFilter === "active") return tx.status !== "sold";
    return tx.status === "sold";
  });

  return (
    <div className="ledger-page-root">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .ledger-page-root {
          font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* Nav Header */
        .ledger-nav {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.02);
        }
        .ledger-nav-logo {
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .ledger-nav-links {
          display: flex;
          gap: 4px;
        }
        .ledger-nav-link {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .ledger-nav-link:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .ledger-nav-link.active {
          color: #0f172a;
          background: #f1f5f9;
          font-weight: 700;
        }

        .ledger-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }

        /* Financial Grid */
        .financial-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: 20px;
          margin-bottom: 24px;
        }
        @media (max-width: 768px) {
          .financial-grid {
            grid-template-columns: repeat(2, 1fr);
          }
        }
        @media (max-width: 480px) {
          .financial-grid {
            grid-template-columns: 1fr;
          }
        }

        .stat-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          transition: all 0.2s ease;
        }
        .stat-card:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.04), 0 4px 6px -2px rgba(0, 0, 0, 0.02);
        }
        .stat-label {
          font-size: 12px;
          font-weight: 600;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 6px;
        }
        .stat-value {
          font-size: 28px;
          font-weight: 800;
          letter-spacing: -0.5px;
        }
        .stat-value.profit { color: #10b981; }
        .stat-value.roi { color: #6366f1; }
        .stat-value.deployed { color: #475569; }
        .stat-value.yield { color: #d97706; }

        .stat-subtext {
          font-size: 11px;
          color: #94a3b8;
          margin-top: 4px;
        }

        /* Ledger Bar Chart */
        .chart-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          margin-bottom: 24px;
        }
        .chart-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 16px;
        }
        .chart-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0;
        }
        .chart-bar-wrapper {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .chart-row {
          display: flex;
          align-items: center;
          gap: 12px;
        }
        .chart-row-label {
          width: 140px;
          font-size: 12px;
          font-weight: 600;
          color: #475569;
        }
        .chart-bar-outer {
          flex: 1;
          height: 16px;
          background: #f1f5f9;
          border-radius: 9999px;
          overflow: hidden;
          position: relative;
        }
        .chart-bar-inner {
          height: 100%;
          border-radius: 9999px;
          transition: width 0.5s ease-out;
        }
        .chart-bar-inner.invested {
          background: #94a3b8;
        }
        .chart-bar-inner.revenue {
          background: #10b981;
        }
        .chart-row-value {
          width: 80px;
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          text-align: right;
        }

        /* Toggle & Actions Bar */
        .actions-bar {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 20px;
          flex-wrap: wrap;
          gap: 12px;
        }
        .ledger-toggle-group {
          display: flex;
          background: #e2e8f0;
          padding: 4px;
          border-radius: 8px;
          gap: 2px;
        }
        .ledger-toggle {
          border: none;
          background: transparent;
          padding: 6px 14px;
          font-size: 13px;
          font-weight: 600;
          color: #475569;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .ledger-toggle:hover {
          color: #0f172a;
        }
        .ledger-toggle.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 2px rgba(0, 0, 0, 0.05);
        }

        .btn-primary {
          background: #0f172a;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 8px 16px;
          border-radius: 8px;
          border: 1px solid #0f172a;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-primary:hover {
          background: #1e293b;
        }

        .btn-secondary {
          background: #ffffff;
          color: #0f172a;
          font-weight: 600;
          font-size: 13px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        .btn-danger {
          background: #fff1f2;
          color: #e11d48;
          font-weight: 600;
          font-size: 12px;
          padding: 6px 12px;
          border-radius: 6px;
          border: 1px solid #fecdd3;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-danger:hover {
          background: #ffe4e6;
        }

        /* Ledger Table Base */
        .ledger-table-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02);
          overflow: hidden;
        }
        .ledger-table {
          width: 100%;
          border-collapse: collapse;
          text-align: left;
        }
        .ledger-th {
          background: #f8fafc;
          border-bottom: 1px solid #e2e8f0;
          padding: 14px 18px;
          font-size: 12px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .ledger-tr {
          border-bottom: 1px solid #f1f5f9;
          transition: background 0.15s ease;
          cursor: pointer;
        }
        .ledger-tr:hover {
          background: #f8fafc;
        }
        .ledger-tr.expanded {
          background: #f8fafc;
          border-bottom: none;
        }
        .ledger-td {
          padding: 16px 18px;
          font-size: 13px;
          color: #334155;
        }
        .ledger-title {
          font-weight: 700;
          color: #0f172a;
          font-size: 14px;
        }
        .ledger-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-sourcing { background: #eff6ff; color: #1d4ed8; }
        .badge-progress { background: #fef3c7; color: #b45309; }
        .badge-listed { background: #faf5ff; color: #7e22ce; }
        .badge-sold { background: #dcfce7; color: #15803d; }

        /* Detail Expansion Panel */
        .detail-row {
          background: #ffffff;
          border-bottom: 1px solid #e2e8f0;
        }
        .detail-container {
          padding: 20px 24px;
          border-top: 1px dashed #e2e8f0;
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 24px;
        }
        @media (max-width: 768px) {
          .detail-container {
            grid-template-columns: 1fr;
          }
        }
        .detail-section-title {
          font-size: 12px;
          font-weight: 700;
          color: #0f172a;
          text-transform: uppercase;
          letter-spacing: 0.5px;
          margin-bottom: 12px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .detail-list {
          list-style: none;
          padding: 0;
          margin: 0;
          display: flex;
          flex-direction: column;
          gap: 6px;
        }
        .detail-list-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 12px;
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 12px;
        }
        .detail-list-item-name {
          font-weight: 600;
          color: #334155;
        }
        .detail-list-item-cost {
          font-weight: 700;
          color: #0f172a;
        }

        .expense-form-inline {
          display: flex;
          gap: 8px;
          margin-top: 8px;
        }
        .input-inline {
          padding: 6px 10px;
          border: 1px solid #cbd5e1;
          border-radius: 6px;
          font-size: 12px;
          font-family: inherit;
        }
        .input-inline:focus {
          outline: none;
          border-color: #0f172a;
        }

        /* Controls Section */
        .controls-panel {
          background: #f8fafc;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 12px 16px;
          margin-top: 16px;
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 12px;
        }
        @media (max-width: 640px) {
          .controls-panel {
            grid-template-columns: 1fr;
          }
        }
        .control-group {
          display: flex;
          flex-direction: column;
          gap: 4px;
        }
        .control-label {
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
        }

        /* Modern Premium Modal */
        .modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(15, 23, 42, 0.4);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          z-index: 1000;
          animation: fadeIn 0.2s ease;
        }
        .modal-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 16px;
          width: 100%;
          max-width: 580px;
          box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.15);
          overflow: hidden;
          animation: slideUp 0.25s cubic-bezier(0.16, 1, 0.3, 1);
          margin: 16px;
          max-height: 90vh;
          display: flex;
          flex-direction: column;
        }
        .modal-header {
          padding: 20px 24px;
          border-bottom: 1px solid #f1f5f9;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modal-title {
          font-size: 18px;
          font-weight: 800;
          margin: 0;
          color: #0f172a;
        }
        .modal-close {
          border: none;
          background: transparent;
          font-size: 20px;
          cursor: pointer;
          color: #64748b;
        }
        .modal-body {
          padding: 24px;
          overflow-y: auto;
          flex: 1;
        }
        .modal-footer {
          padding: 16px 24px;
          background: #f8fafc;
          border-top: 1px solid #f1f5f9;
          display: flex;
          justify-content: flex-end;
          gap: 12px;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: 16px;
          margin-bottom: 16px;
        }
        .form-group-full {
          grid-column: span 2;
        }
        .form-label {
          display: block;
          font-weight: 600;
          font-size: 12px;
          margin-bottom: 6px;
          color: #475569;
        }
        .form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          box-sizing: border-box;
          transition: border-color 0.15s ease;
        }
        .form-input:focus {
          outline: none;
          border-color: #0f172a;
        }

        .parts-checklist {
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          max-height: 120px;
          overflow-y: auto;
          padding: 8px 12px;
          background: #f8fafc;
        }
        .checklist-item {
          display: flex;
          align-items: center;
          gap: 8px;
          font-size: 12px;
          padding: 4px 0;
          color: #475569;
        }

        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(16px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Modern White Sticky Navbar */}
      <header className="ledger-nav">
        <Link href="/" className="ledger-nav-logo">
          🚲 VeloStack
        </Link>
        <nav className="ledger-nav-links">
          <Link href="/all" className="ledger-nav-link">
            all phases
          </Link>
          <Link href="/analyzer" className="ledger-nav-link">
            analyzer
          </Link>
          <Link href="/tracker" className="ledger-nav-link">
            tracker
          </Link>
          <Link href="/extractor" className="ledger-nav-link">
            extractor
          </Link>
          <Link href="/mechanic" className="ledger-nav-link">
            mechanic
          </Link>
          <span className="ledger-nav-link active">ledger</span>
          <Link href="/settings" className="ledger-nav-link">
            sniper
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <main className="ledger-container">
        
        {/* Title Block */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <h1 style={{ fontSize: "26px", fontWeight: 800, margin: 0, letterSpacing: "-0.5px" }}>Profit & Loss Flip Ledger</h1>
            <p style={{ fontSize: "13px", color: "#64748b", margin: "4px 0 0 0" }}>Track expenses, labor allocation, and true profit margins across your bicycle flipping operation.</p>
          </div>
          <button className="btn-primary" onClick={() => setIsModalOpen(true)}>
            ➕ Log New Transaction
          </button>
        </div>

        {/* 4-Card Financial Metrics Grid */}
        <section className="financial-grid">
          
          <div className="stat-card">
            <div className="stat-label">Net Realized Profit</div>
            <div className="stat-value profit">
              €{netRealizedProfit.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-subtext">Realized from {soldTransactions.length} sold bikes</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Average ROI %</div>
            <div className="stat-value roi">
              {averageRoiPercent.toFixed(1)}%
            </div>
            <div className="stat-subtext">Avg yield per sold bike</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Capital Deployed</div>
            <div className="stat-value deployed">
              €{capitalDeployed.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="stat-subtext">Active capital in {activeTransactions.length} bikes</div>
          </div>

          <div className="stat-card">
            <div className="stat-label">Average Hourly Yield</div>
            <div className="stat-value yield">
              €{averageHourlyYield.toLocaleString("en-IE", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/hr
            </div>
            <div className="stat-subtext">Across {totalSoldHours} total sold hours</div>
          </div>

        </section>

        {/* Capital vs Revenue Horizontal Visual Chart */}
        <section className="chart-card">
          <div className="chart-header">
            <h3 className="chart-title">Visual Cumulative Ledger Chart</h3>
            <span style={{ fontSize: 11, color: "#64748b", fontWeight: 600 }}>All Flips Cumulative</span>
          </div>
          
          <div className="chart-bar-wrapper">
            <div className="chart-row">
              <div className="chart-row-label">Capital Invested</div>
              <div className="chart-bar-outer">
                <div 
                  className="chart-bar-inner invested" 
                  style={{ 
                    width: totalCapitalInvestedOverall > 0 
                      ? `${Math.min(100, (totalCapitalInvestedOverall / Math.max(totalCapitalInvestedOverall, totalRealizedRevenueOverall)) * 100)}%`
                      : "0%"
                  }}
                />
              </div>
              <div className="chart-row-value">€{totalCapitalInvestedOverall.toFixed(0)}</div>
            </div>

            <div className="chart-row">
              <div className="chart-row-label">Realized Revenue</div>
              <div className="chart-bar-outer">
                <div 
                  className="chart-bar-inner revenue" 
                  style={{ 
                    width: totalRealizedRevenueOverall > 0 
                      ? `${Math.min(100, (totalRealizedRevenueOverall / Math.max(totalCapitalInvestedOverall, totalRealizedRevenueOverall)) * 100)}%`
                      : "0%"
                  }}
                />
              </div>
              <div className="chart-row-value" style={{ color: "#10b981" }}>€{totalRealizedRevenueOverall.toFixed(0)}</div>
            </div>
          </div>
        </section>

        {/* Filter Toggle and Transactions Ledger Row */}
        <section className="actions-bar">
          <div className="ledger-toggle-group">
            <button 
              className={`ledger-toggle ${activeFilter === "active" ? "active" : ""}`}
              onClick={() => { setActiveFilter("active"); setExpandedTxId(null); }}
            >
              Active Flips ({activeTransactions.length})
            </button>
            <button 
              className={`ledger-toggle ${activeFilter === "sold" ? "active" : ""}`}
              onClick={() => { setActiveFilter("sold"); setExpandedTxId(null); }}
            >
              Completed Sales ({soldTransactions.length})
            </button>
          </div>
        </section>

        {/* Table Ledger Panel */}
        <section className="ledger-table-card">
          {filteredTransactions.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#64748b", fontSize: "14px", display: "flex", justifyContent: "center" }}>
              No transactions logged for this tab. Click "Log New Transaction" to get started!
            </div>
          ) : (
            <table className="ledger-table">
              <thead>
                <tr>
                  <th className="ledger-th" style={{ width: "40px" }} />
                  <th className="ledger-th">Flip Title / Bike</th>
                  <th className="ledger-th">Status</th>
                  <th className="ledger-th">Total Investment</th>
                  <th className="ledger-th">Target Asking</th>
                  {activeFilter === "sold" ? (
                    <>
                      <th className="ledger-th">Sold For</th>
                      <th className="ledger-th">Net Margin</th>
                      <th className="ledger-th">Realized ROI</th>
                    </>
                  ) : (
                    <>
                      <th className="ledger-th">Labor Est</th>
                      <th className="ledger-th">Projected Profit</th>
                    </>
                  )}
                  <th className="ledger-th" style={{ width: "100px" }} />
                </tr>
              </thead>
              <tbody>
                {filteredTransactions.map((tx) => {
                  const isExpanded = expandedTxId === tx.id;
                  const totalInvested = getTotalInvestment(tx);
                  const revenue = tx.finalSalePrice ?? 0;
                  const profit = tx.status === "sold" ? (revenue - totalInvested) : (tx.askingPrice - totalInvested);
                  const roi = totalInvested > 0 ? (profit / totalInvested) * 100 : 0;
                  
                  return (
                    <React.Fragment key={tx.id}>
                      <tr 
                        className={`ledger-tr ${isExpanded ? "expanded" : ""}`}
                        onClick={() => setExpandedTxId(isExpanded ? null : tx.id)}
                      >
                        <td className="ledger-td" style={{ textAlign: "center", fontSize: 16 }}>
                          {isExpanded ? "▼" : "▶"}
                        </td>
                        <td className="ledger-td">
                          <div className="ledger-title">{tx.title}</div>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {tx.bikeId !== "custom" ? "🚲 Tracker Linked" : "🔧 Custom One-off"}
                          </div>
                        </td>
                        <td className="ledger-td">
                          <span className={`ledger-badge badge-${tx.status === "in_progress" ? "progress" : tx.status}`}>
                            {tx.status.replace("_", " ")}
                          </span>
                        </td>
                        <td className="ledger-td" style={{ fontWeight: 700 }}>
                          €{totalInvested.toFixed(2)}
                        </td>
                        <td className="ledger-td">
                          €{tx.askingPrice.toFixed(2)}
                        </td>
                        {tx.status === "sold" ? (
                          <>
                            <td className="ledger-td" style={{ fontWeight: 700, color: "#10b981" }}>
                              €{revenue.toFixed(2)}
                            </td>
                            <td className="ledger-td" style={{ fontWeight: 700, color: profit >= 0 ? "#10b981" : "#ef4444" }}>
                              €{profit.toFixed(2)}
                            </td>
                            <td className="ledger-td" style={{ fontWeight: 700, color: "#6366f1" }}>
                              {roi.toFixed(1)}%
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="ledger-td">
                              {tx.laborHours} hrs
                            </td>
                            <td className="ledger-td" style={{ fontWeight: 700, color: "#10b981" }}>
                              €{profit.toFixed(2)}
                            </td>
                          </>
                        )}
                        <td className="ledger-td" style={{ textAlign: "right" }} onClick={(e) => e.stopPropagation()}>
                          <button 
                            className="btn-danger" 
                            onClick={() => {
                              if (confirm("Are you sure you want to delete this transaction from the ledger?")) {
                                deleteTransaction(tx.id);
                              }
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>

                      {/* Row Expanded Sub-ledger detail panel */}
                      {isExpanded && (
                        <tr className="detail-row">
                          <td colSpan={activeFilter === "sold" ? 9 : 8} style={{ padding: 0 }}>
                            <div className="detail-container" onClick={(e) => e.stopPropagation()}>
                              
                              {/* Parts Expense Checklist */}
                              <div>
                                <div className="detail-section-title">
                                  <span>🔧 Itemized Parts Expenses</span>
                                  <span style={{ color: "#64748b" }}>Total: €{getPartsTotal(tx).toFixed(2)}</span>
                                </div>
                                <ul className="detail-list">
                                  {tx.partsExpense.length === 0 ? (
                                    <li style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>No parts logged yet.</li>
                                  ) : (
                                    tx.partsExpense.map(part => (
                                      <li key={part.id} className="detail-list-item">
                                        <span className="detail-list-item-name">{part.partName}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                          <span className="detail-list-item-cost">€{part.cost.toFixed(2)}</span>
                                          <button 
                                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}
                                            onClick={() => {
                                              const updatedParts = tx.partsExpense.filter(p => p.id !== part.id);
                                              updateTransaction(tx.id, { partsExpense: updatedParts });
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </li>
                                    ))
                                  )}
                                </ul>

                                {/* Inline Form to Add Parts */}
                                <div className="expense-form-inline">
                                  <input 
                                    type="text" 
                                    className="input-inline" 
                                    placeholder="Part Name (e.g. Chain)"
                                    style={{ flex: 2 }}
                                    value={newPartName}
                                    onChange={(e) => setNewPartName(e.target.value)}
                                  />
                                  <input 
                                    type="number" 
                                    className="input-inline" 
                                    placeholder="Cost €" 
                                    style={{ flex: 1 }}
                                    value={newPartCost || ""}
                                    onChange={(e) => setNewPartCost(parseFloat(e.target.value) || 0)}
                                  />
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: "4px 10px", fontSize: 12 }}
                                    onClick={() => {
                                      if (!newPartName.trim()) return;
                                      const updatedParts = [
                                        ...tx.partsExpense,
                                        {
                                          id: `part-${Date.now()}-${Math.random()}`,
                                          partName: newPartName,
                                          cost: newPartCost
                                        }
                                      ];
                                      updateTransaction(tx.id, { partsExpense: updatedParts });
                                      setNewPartName("");
                                      setNewPartCost(0);
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>
                              </div>

                              {/* Miscellaneous & Labor Calculations */}
                              <div>
                                <div className="detail-section-title">
                                  <span>📦 Misc Shipping / Gas Fees</span>
                                  <span style={{ color: "#64748b" }}>Total: €{getMiscTotal(tx).toFixed(2)}</span>
                                </div>
                                <ul className="detail-list">
                                  {tx.miscExpense.length === 0 ? (
                                    <li style={{ fontSize: 11, color: "#94a3b8", fontStyle: "italic" }}>No misc expenses logged.</li>
                                  ) : (
                                    tx.miscExpense.map(misc => (
                                      <li key={misc.id} className="detail-list-item">
                                        <span className="detail-list-item-name">{misc.name}</span>
                                        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                                          <span className="detail-list-item-cost">€{misc.cost.toFixed(2)}</span>
                                          <button 
                                            style={{ background: "transparent", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, fontWeight: "bold" }}
                                            onClick={() => {
                                              const updatedMisc = tx.miscExpense.filter(m => m.id !== misc.id);
                                              updateTransaction(tx.id, { miscExpense: updatedMisc });
                                            }}
                                          >
                                            ✕
                                          </button>
                                        </div>
                                      </li>
                                    ))
                                  )}
                                </ul>

                                {/* Inline Form to Add Misc */}
                                <div className="expense-form-inline">
                                  <input 
                                    type="text" 
                                    className="input-inline" 
                                    placeholder="Expense (e.g. Gas, Shipping)"
                                    style={{ flex: 2 }}
                                    value={newMiscName}
                                    onChange={(e) => setNewMiscName(e.target.value)}
                                  />
                                  <input 
                                    type="number" 
                                    className="input-inline" 
                                    placeholder="Cost €" 
                                    style={{ flex: 1 }}
                                    value={newMiscCost || ""}
                                    onChange={(e) => setNewMiscCost(parseFloat(e.target.value) || 0)}
                                  />
                                  <button 
                                    className="btn-primary" 
                                    style={{ padding: "4px 10px", fontSize: 12 }}
                                    onClick={() => {
                                      if (!newMiscName.trim()) return;
                                      const updatedMisc = [
                                        ...tx.miscExpense,
                                        {
                                          id: `misc-${Date.now()}-${Math.random()}`,
                                          name: newMiscName,
                                          cost: newMiscCost
                                        }
                                      ];
                                      updateTransaction(tx.id, { miscExpense: updatedMisc });
                                      setNewMiscName("");
                                      setNewMiscCost(0);
                                    }}
                                  >
                                    Add
                                  </button>
                                </div>

                                {/* Dynamic Cost Control Panel */}
                                <div className="controls-panel">
                                  <div className="control-group">
                                    <label className="control-label">Purchase Price (€)</label>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      style={{ padding: "4px 8px", fontSize: "12px" }}
                                      value={tx.purchasePrice}
                                      onChange={(e) => updateTransaction(tx.id, { purchasePrice: parseFloat(e.target.value) || 0 })}
                                    />
                                  </div>
                                  
                                  <div className="control-group">
                                    <label className="control-label">Target Asking (€)</label>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      style={{ padding: "4px 8px", fontSize: "12px" }}
                                      value={tx.askingPrice}
                                      onChange={(e) => updateTransaction(tx.id, { askingPrice: parseFloat(e.target.value) || 0 })}
                                    />
                                  </div>

                                  <div className="control-group">
                                    <label className="control-label">Labor Hours</label>
                                    <input 
                                      type="number" 
                                      className="form-input" 
                                      style={{ padding: "4px 8px", fontSize: "12px" }}
                                      value={tx.laborHours}
                                      onChange={(e) => updateTransaction(tx.id, { laborHours: parseFloat(e.target.value) || 0 })}
                                    />
                                  </div>

                                  <div className="control-group-full" style={{ gridColumn: "span 3", display: "flex", gap: "10px", marginTop: "8px", alignItems: "center" }}>
                                    <label className="control-label" style={{ minWidth: 80 }}>Status</label>
                                    <select 
                                      className="form-input"
                                      style={{ padding: "4px 8px", fontSize: "12px" }}
                                      value={tx.status}
                                      onChange={(e) => {
                                        const newStatus = e.target.value as any;
                                        if (newStatus === "sold" && !tx.finalSalePrice) {
                                          setSellPriceInput(tx.askingPrice);
                                          // Prompt sold modal in place
                                          updateTransaction(tx.id, { 
                                            status: "sold", 
                                            finalSalePrice: tx.askingPrice,
                                            saleDate: new Date().toISOString().split("T")[0]
                                          });
                                        } else {
                                          updateTransaction(tx.id, { status: newStatus });
                                        }
                                      }}
                                    >
                                      <option value="sourcing">Sourcing</option>
                                      <option value="in_progress">In Progress</option>
                                      <option value="listed">Listed</option>
                                      <option value="sold">Sold (Completed)</option>
                                    </select>
                                  </div>

                                  {tx.status === "sold" && (
                                    <div className="control-group-full" style={{ gridColumn: "span 3", borderTop: "1px dashed #cbd5e1", paddingTop: "8px", marginTop: "4px" }}>
                                      <div style={{ display: "flex", gap: "10px" }}>
                                        <div style={{ flex: 1 }}>
                                          <label className="control-label">Final Sale Price (€)</label>
                                          <input 
                                            type="number" 
                                            className="form-input" 
                                            style={{ padding: "4px 8px", fontSize: "12px" }}
                                            value={tx.finalSalePrice || 0}
                                            onChange={(e) => updateTransaction(tx.id, { finalSalePrice: parseFloat(e.target.value) || 0 })}
                                          />
                                        </div>
                                        <div style={{ flex: 1 }}>
                                          <label className="control-label">Sale Date</label>
                                          <input 
                                            type="date" 
                                            className="form-input" 
                                            style={{ padding: "4px 8px", fontSize: "12px" }}
                                            value={tx.saleDate || ""}
                                            onChange={(e) => updateTransaction(tx.id, { saleDate: e.target.value })}
                                          />
                                        </div>
                                      </div>
                                    </div>
                                  )}

                                </div>

                              </div>

                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          )}
        </section>

      </main>

      {/* Log Transaction Modal Component */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-card">
            
            <div className="modal-header">
              <h2 className="modal-title">Log New Transaction</h2>
              <button className="modal-close" onClick={() => setIsModalOpen(false)}>✕</button>
            </div>

            <form onSubmit={handleCreateTransaction}>
              <div className="modal-body">
                
                {/* Bike Link Dropdown */}
                <div className="form-group-full" style={{ marginBottom: 14 }}>
                  <label className="form-label">Link to Parts Tracker Bike (Optional)</label>
                  <select 
                    className="form-input"
                    value={selectedBikeId}
                    onChange={(e) => handleBikeChange(e.target.value)}
                  >
                    <option value="">-- No linked tracker bike (One-off manual) --</option>
                    {store.bikes.map(bike => (
                      <option key={bike.id} value={bike.id}>🚲 {bike.name} ({BIKE_TYPE_LABELS[bike.type]})</option>
                    ))}
                  </select>
                </div>

                <div className="form-grid">
                  <div className="form-group-full">
                    <label className="form-label">Flip Listing Title *</label>
                    <input 
                      type="text" 
                      className="form-input" 
                      required
                      placeholder="e.g. Custom Gravel Build / Specialized Allez"
                      value={customTitle}
                      onChange={(e) => setCustomTitle(e.target.value)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Purchase Price (€)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={purchasePrice || ""}
                      placeholder="0.00"
                      onChange={(e) => setPurchasePrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Target Asking Price (€)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={askingPrice || ""}
                      placeholder="0.00"
                      onChange={(e) => setAskingPrice(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Labor Allocation (Hours)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={laborHours || ""}
                      placeholder="e.g. 5"
                      onChange={(e) => setLaborHours(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div>
                    <label className="form-label">Default Hourly Rate (€)</label>
                    <input 
                      type="number" 
                      className="form-input" 
                      value={hourlyRate || ""}
                      onChange={(e) => setHourlyRate(parseFloat(e.target.value) || 0)}
                    />
                  </div>

                  <div className="form-group-full">
                    <label className="form-label">Starting Project Status</label>
                    <select 
                      className="form-input"
                      value={status}
                      onChange={(e) => setStatus(e.target.value as any)}
                    >
                      <option value="sourcing">Sourcing</option>
                      <option value="in_progress">In Progress</option>
                      <option value="listed">Listed</option>
                      <option value="sold">Sold</option>
                    </select>
                  </div>
                </div>

                {/* Prepopulated Parts Checklist */}
                {selectedBikeId && Object.keys(bikePartsToInclude).length > 0 && (
                  <div style={{ marginTop: 14 }}>
                    <label className="form-label">Include Installed Parts as Expenses?</label>
                    <div className="parts-checklist">
                      {Object.entries(bikePartsToInclude).map(([id, part]) => (
                        <label key={id} className="checklist-item" style={{ cursor: "pointer", display: "flex", alignItems: "center" }}>
                          <input 
                            type="checkbox"
                            checked={part.checked}
                            onChange={(e) => {
                              setBikePartsToInclude(prev => ({
                                ...prev,
                                [id]: { ...prev[id], checked: e.target.checked }
                              }));
                            }}
                          />
                          <span>{part.name} (Est. €{part.cost.toFixed(2)})</span>
                        </label>
                      ))}
                    </div>
                  </div>
                )}

              </div>

              <div className="modal-footer">
                <button type="button" className="btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
                <button type="submit" className="btn-primary">➕ Log Flip</button>
              </div>
            </form>

          </div>
        </div>
      )}

    </div>
  );
}

export default function LedgerPage() {
  return (
    <TrackerProvider>
      <LedgerContent />
    </TrackerProvider>
  );
}
