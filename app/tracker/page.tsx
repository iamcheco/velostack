"use client";

import React, { useState } from "react";
import Link from "next/link";
import { TrackerProvider } from "@/app/tracker/context";
import Sidebar from "@/app/tracker/components/Sidebar";
import PartsTab from "@/app/tracker/components/PartsTab";
import RideLogTab from "@/app/tracker/components/RideLogTab";
import WearReportTab from "@/app/tracker/components/WearReportTab";

export default function TrackerPage() {
  const [activeTab, setActiveTab] = useState<"parts" | "ride" | "wear">("parts");

  return (
    <TrackerProvider>
      {/* Top bar - same as analyzer */}
      <div className="reddit-top-bar">
        <div className="reddit-sr-list">
          <Link href="/all">MY SUBREDDITS</Link> ▼ | <Link href="/all">POPULAR</Link> | <Link href="/all">ALL</Link> | <Link href="/all">RANDOM</Link> | <Link href="/all">BIKE_FLIP</Link> | <strong>VELOSTACK_TRACKER</strong>
        </div>
        <div>
          want to join? <Link href="/" style={{ color: "#369", textDecoration: "underline" }}>Login or register</Link> in seconds. | English
        </div>
      </div>

      {/* Header */}
      <div className="reddit-header">
        <div className="reddit-header-logo-container">
          <Link href="/all" className="reddit-logo-text">VeloStack</Link>
          <span className="reddit-sub-title">/r/velostack_tracker</span>
        </div>
        <div className="reddit-tabs">
          <span className={`reddit-tab ${activeTab === "parts" ? "active" : ""}`} onClick={() => setActiveTab("parts")}>Parts</span>
          <span className={`reddit-tab ${activeTab === "ride" ? "active" : ""}`} onClick={() => setActiveTab("ride")}>Ride Log</span>
          <span className={`reddit-tab ${activeTab === "wear" ? "active" : ""}`} onClick={() => setActiveTab("wear")}>⚡ Wear Report</span>
        </div>
      </div>

      {/* Main layout */}
      <div className="reddit-main">
        <div className="reddit-content">
          {activeTab === "parts" && <PartsTab />}
          {activeTab === "ride" && <RideLogTab />}
          {activeTab === "wear" && <WearReportTab />}
        </div>
        <Sidebar />
      </div>
    </TrackerProvider>
  );
}
