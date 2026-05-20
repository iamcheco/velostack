"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrackerProvider, useTracker } from "@/app/tracker/context";
import Sidebar from "@/app/tracker/components/Sidebar";
import PartsTab from "@/app/tracker/components/PartsTab";
import RideLogTab from "@/app/tracker/components/RideLogTab";
import WearReportTab from "@/app/tracker/components/WearReportTab";
import PartsBinTab from "@/app/tracker/components/PartsBinTab";
import ListingGeneratorModal from "@/app/tracker/components/ListingGeneratorModal";
import { BIKE_TYPE_LABELS } from "@/lib/tracker-types";
import { getTotalBikeKm } from "@/lib/wear-engine";
import BuildMatchmaker from "@/app/tracker/components/BuildMatchmaker";

function TrackerContent() {
  const { store, selectedBikeId } = useTracker();
  const [activeTab, setActiveTab] = useState<"parts" | "ride" | "wear" | "parts_bin" | "matchmaker">("parts");
  const [isListingModalOpen, setIsListingModalOpen] = useState(false);

  const selectedBike = store.bikes.find(b => b.id === selectedBikeId);
  const bikeParts = selectedBikeId ? (store.parts[selectedBikeId] ?? []) : [];

  return (
    <div className="tracker-page-root">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .tracker-page-root {
          font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* Modern White Nav Header */
        .tracker-nav {
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
        .tracker-nav-logo {
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .tracker-nav-links {
          display: flex;
          gap: 4px;
        }
        .tracker-nav-link {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .tracker-nav-link:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .tracker-nav-link.active {
          color: #0f172a;
          background: #f1f5f9;
          font-weight: 700;
        }

        /* Layout Grid */
        .tracker-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }
        .tracker-grid {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .tracker-grid {
            grid-template-columns: 1fr;
          }
        }

        /* Active Bike Banner */
        .active-bike-banner {
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 14px 20px;
          margin-bottom: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          animation: fadeIn 0.25s ease;
          gap: 16px;
          flex-wrap: wrap;
        }
        .active-bike-banner-title {
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
          margin: 0;
        }
        .active-bike-banner-meta {
          font-size: 11px;
          color: #64748b;
          margin-top: 2px;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-4px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Modern White Card Styling */
        .modern-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.02), 0 2px 4px -1px rgba(0, 0, 0, 0.01);
          margin-bottom: 20px;
        }
        .modern-card-title {
          font-size: 15px;
          font-weight: 700;
          color: #0f172a;
          margin: 0 0 14px 0;
          display: flex;
          align-items: center;
          gap: 8px;
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 8px;
        }

        /* Sleek Tab Group */
        .tracker-inner-tabs {
          display: flex;
          background: #f1f5f9;
          padding: 4px;
          border-radius: 8px;
          gap: 2px;
          margin-bottom: 20px;
          border: none;
        }
        .tracker-inner-tab {
          flex: 1;
          background: transparent;
          border: none;
          padding: 8px 12px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          border-radius: 6px;
          cursor: pointer;
          transition: all 0.15s ease;
          text-align: center;
          user-select: none;
        }
        .tracker-inner-tab:hover {
          color: #0f172a;
          background: rgba(15, 23, 42, 0.03);
        }
        .tracker-inner-tab.active {
          background: #ffffff;
          color: #0f172a;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
          font-weight: 700;
          margin-bottom: 0;
          border-bottom: none;
          outline: none;
        }

        /* Shared Form Inputs */
        .modern-form-group {
          margin-bottom: 14px;
        }
        .modern-form-label {
          display: block;
          font-weight: 600;
          font-size: 12px;
          margin-bottom: 6px;
          color: #475569;
        }
        .modern-form-input {
          width: 100%;
          padding: 8px 12px;
          border: 1px solid #cbd5e1;
          border-radius: 8px;
          font-family: inherit;
          font-size: 13px;
          color: #0f172a;
          background-color: #ffffff;
          box-sizing: border-box;
          transition: all 0.15s ease;
        }
        .modern-form-input:focus {
          border-color: #0f172a;
          outline: none;
          box-shadow: 0 0 0 2px rgba(15, 23, 42, 0.05);
        }

        /* Buttons */
        .btn-modern-primary {
          background: #0f172a;
          color: #ffffff;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #0f172a;
          cursor: pointer;
          transition: all 0.15s ease;
          display: inline-flex;
          align-items: center;
          gap: 6px;
        }
        .btn-modern-primary:hover:not(:disabled) {
          background: #1e293b;
        }
        .btn-modern-primary:disabled {
          background: #94a3b8;
          border-color: #94a3b8;
          cursor: not-allowed;
        }

        .btn-modern-secondary {
          background: #ffffff;
          color: #0f172a;
          font-weight: 600;
          font-size: 13px;
          padding: 10px 16px;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .btn-modern-secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }

        /* Modern Status Badges */
        .status-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .status-good { background: #dcfce7; color: #166534; }
        .status-watch { background: #fef9c3; color: #854d0e; }
        .status-warning { background: #fee2e2; color: #991b1b; }
      `}</style>

      {/* Sticky Modern White Header */}
      <header className="tracker-nav">
        <Link href="/" className="tracker-nav-logo">
          🚲 VeloStack
        </Link>
        <nav className="tracker-nav-links">
          <Link href="/all" className="tracker-nav-link">
            all phases
          </Link>
          <Link href="/analyzer" className="tracker-nav-link">
            analyzer
          </Link>
          <span className="tracker-nav-link active">tracker</span>
          <Link href="/extractor" className="tracker-nav-link">
            extractor
          </Link>
          <Link href="/mechanic" className="tracker-nav-link">
            mechanic
          </Link>
          <Link href="/ledger" className="tracker-nav-link">
            ledger
          </Link>
        </nav>
      </header>

      {/* Main Content Workspace */}
      <div className="tracker-container">
        {/* Dynamic Active Bike Banner */}
        {selectedBike && (
          <div className="active-bike-banner">
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span style={{ fontSize: 22 }}>🚲</span>
              <div>
                <h2 className="active-bike-banner-title">{selectedBike.name}</h2>
                <div className="active-bike-banner-meta">
                  Active {BIKE_TYPE_LABELS[selectedBike.type]} Build · {getTotalBikeKm(selectedBike.id, store.rides)} km total · {bikeParts.length} components tracked
                </div>
              </div>
            </div>
            
            <button
              className="btn-modern-primary"
              style={{ padding: "8px 14px", fontSize: 12, boxShadow: "0 4px 10px rgba(15, 23, 42, 0.15)" }}
              onClick={() => setIsListingModalOpen(true)}
            >
              ✨ Generate Sale Listing
            </button>
          </div>
        )}

        <div className="tracker-grid">
          {/* Left Content Column */}
          <div>
            {/* Sleek Tab Switcher */}
            <div className="tracker-inner-tabs">
              <button
                className={`tracker-inner-tab ${activeTab === "parts" ? "active" : ""}`}
                onClick={() => setActiveTab("parts")}
              >
                🔩 Active Parts
              </button>
              <button
                className={`tracker-inner-tab ${activeTab === "ride" ? "active" : ""}`}
                onClick={() => setActiveTab("ride")}
              >
                🚴 Ride Log
              </button>
              <button
                className={`tracker-inner-tab ${activeTab === "wear" ? "active" : ""}`}
                onClick={() => setActiveTab("wear")}
              >
                ⚡ Wear Report
              </button>
              <button
                className={`tracker-inner-tab ${activeTab === "parts_bin" ? "active" : ""}`}
                onClick={() => setActiveTab("parts_bin")}
              >
                📥 Garage Parts Bin
              </button>
              <button
                className={`tracker-inner-tab ${activeTab === "matchmaker" ? "active" : ""}`}
                onClick={() => setActiveTab("matchmaker")}
              >
                🧬 Franken-Bike Matchmaker
              </button>
            </div>

            {/* Tab Display Router */}
            {activeTab === "parts" && <PartsTab />}
            {activeTab === "ride" && <RideLogTab />}
            {activeTab === "wear" && <WearReportTab />}
            {activeTab === "parts_bin" && <PartsBinTab />}
            {activeTab === "matchmaker" && <BuildMatchmaker />}
          </div>

          {/* Right Sidebar Column */}
          <Sidebar />
        </div>
      </div>

      {/* Listing Generator Modal */}
      {selectedBike && (
        <ListingGeneratorModal
          isOpen={isListingModalOpen}
          onClose={() => setIsListingModalOpen(false)}
          bike={selectedBike}
          bikeParts={bikeParts}
          allRides={store.rides}
          replacements={store.replacements}
        />
      )}
    </div>
  );
}

export default function TrackerPage() {
  return (
    <TrackerProvider>
      <TrackerContent />
    </TrackerProvider>
  );
}
