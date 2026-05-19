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
      {/* ── Embedded Reddit Stylesheet (matches Analyzer exactly) ── */}
      <style jsx global>{`
        .reddit-page {
          font-family: Verdana, Arial, Helvetica, sans-serif !important;
          font-size: 12px !important;
          color: #222 !important;
          background-color: #ffffff !important;
          min-height: 100vh;
          padding: 0;
          margin: 0;
        }
        .reddit-top-bar {
          background-color: #f0f0f0;
          border-bottom: 1px solid #e0e0e0;
          font-size: 10px;
          color: #555;
          padding: 4px 10px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .reddit-sr-list a {
          color: #555;
          text-decoration: none;
          margin-right: 5px;
        }
        .reddit-sr-list a:hover { text-decoration: underline; }
        .reddit-header {
          background-color: #cee3f8;
          border-bottom: 1px solid #5f99cf;
          padding: 15px 20px 0 20px;
          display: flex;
          flex-direction: column;
          justify-content: flex-end;
          min-height: 70px;
          position: relative;
        }
        .reddit-header-logo-container {
          display: flex;
          align-items: flex-end;
          margin-bottom: 5px;
          gap: 10px;
        }
        .reddit-logo-text {
          font-size: 22px;
          font-weight: bold;
          color: #55585a;
          text-decoration: none;
        }
        .reddit-sub-title {
          font-size: 18px;
          color: #555;
          font-weight: normal;
        }
        .reddit-tabs {
          display: flex;
          gap: 2px;
          margin-bottom: -1px;
          padding-left: 10px;
        }
        .reddit-tab {
          background-color: #eff7ff;
          border: 1px solid #5f99cf;
          border-bottom: none;
          padding: 4px 12px;
          font-size: 11px;
          font-weight: bold;
          color: #555;
          text-decoration: none;
          border-radius: 4px 4px 0 0;
          cursor: pointer;
          transition: background 0.1s;
        }
        .reddit-tab:hover { background-color: #d8eaf8; }
        .reddit-tab.active {
          background-color: #ffffff;
          border-bottom: 1px solid #ffffff;
          color: #ff4500 !important;
        }
        .reddit-main {
          display: flex;
          padding: 15px;
          gap: 20px;
          max-width: 1200px;
          margin: 0 auto;
          align-items: start;
        }
        .reddit-content {
          flex: 1;
          min-width: 0;
        }
        .reddit-sidebar {
          width: 300px;
          flex-shrink: 0;
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .reddit-sidebox {
          background-color: #f4f9fd;
          border: 1px solid #cee3f8;
          border-radius: 4px;
          padding: 12px;
        }
        .reddit-sidebox-title {
          font-size: 11px;
          font-weight: bold;
          color: #336699;
          border-bottom: 1px solid #cee3f8;
          padding-bottom: 4px;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .reddit-form {
          background-color: #fafafa;
          border: 1px solid #dbdbdb;
          border-radius: 4px;
          padding: 20px;
          margin-bottom: 15px;
        }
        .reddit-form-group { margin-bottom: 12px; }
        .reddit-form-label {
          display: block;
          font-weight: bold;
          font-size: 12px;
          margin-bottom: 4px;
          color: #333;
        }
        .reddit-form-input {
          width: 100%;
          padding: 6px 8px;
          border: 1px solid #ccc;
          border-radius: 3px;
          font-family: Verdana, sans-serif;
          font-size: 12px;
          box-sizing: border-box;
        }
        .reddit-form-input:focus {
          border-color: #5f99cf;
          outline: none;
        }
        .reddit-btn-submit {
          background-color: #5f99cf;
          color: white;
          border: 1px solid #3f79af;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 11px;
          cursor: pointer;
          border-radius: 3px;
          transition: background 0.1s;
        }
        .reddit-btn-submit:hover { background-color: #3f79af; }
        .reddit-btn-submit:disabled { background-color: #ccc; border-color: #bbb; cursor: not-allowed; }
        .reddit-btn-reset {
          background-color: #f0f0f0;
          color: #333;
          border: 1px solid #ccc;
          padding: 6px 12px;
          font-weight: bold;
          font-size: 11px;
          cursor: pointer;
          border-radius: 3px;
          margin-left: 8px;
          transition: background 0.1s;
        }
        .reddit-btn-reset:hover { background-color: #e0e0e0; }
        .reddit-flair {
          padding: 1px 5px;
          font-size: 9px;
          border-radius: 2px;
          font-weight: bold;
          display: inline-block;
          text-transform: uppercase;
          letter-spacing: 0.3px;
        }
        .reddit-flair-great  { background:#d4edda; color:#155724; border:1px solid #c3e6cb; }
        .reddit-flair-fair   { background:#fff3cd; color:#856404; border:1px solid #ffeeba; }
        .reddit-flair-pass   { background:#e2e3e5; color:#383d41; border:1px solid #d6d8db; }
        .reddit-flair-avoid  { background:#f8d7da; color:#721c24; border:1px solid #f5c6cb; }
        .reddit-comment {
          border-left: 2px solid #cee3f8;
          padding-left: 12px;
          margin-bottom: 12px;
          margin-top: 8px;
        }
        .reddit-comment-meta { font-size: 10px; color: #888; margin-bottom: 3px; }
        .reddit-comment-meta-user { font-weight: bold; color: #369; }
        .reddit-comment-body { font-size: 12px; line-height: 1.5; color: #222; }
        .reddit-comment-footer {
          font-size: 10px; color: #888; margin-top: 4px;
          display: flex; gap: 8px; font-weight: bold;
        }
        .reddit-comment-footer span { cursor: pointer; }
        .reddit-comment-footer span:hover { color: #222; }
        .reddit-skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading-pulse 1.5s infinite;
          border-radius: 4px;
        }
        @keyframes loading-pulse {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        /* Inner tracker content tabs */
        .tracker-inner-tabs {
          display: flex;
          gap: 4px;
          margin-bottom: 14px;
          border-bottom: 2px solid #cee3f8;
          padding-bottom: 0;
        }
        .tracker-inner-tab {
          padding: 6px 14px;
          font-size: 11px;
          font-weight: bold;
          color: #336699;
          cursor: pointer;
          border: 1px solid transparent;
          border-bottom: none;
          border-radius: 4px 4px 0 0;
          background: transparent;
          transition: background 0.1s;
        }
        .tracker-inner-tab:hover { background: #eff7ff; }
        .tracker-inner-tab.active {
          background: #fff;
          border-color: #5f99cf;
          border-bottom: 2px solid #fff;
          color: #ff4500;
          margin-bottom: -2px;
        }

        /* Health bar */
        .health-bar-track {
          background: #e0e0e0;
          height: 10px;
          border-radius: 5px;
          overflow: hidden;
          margin: 4px 0;
        }
        .health-bar-fill {
          height: 100%;
          border-radius: 5px;
          transition: width 0.4s ease;
        }

        /* Bike list item */
        .bike-item {
          padding: 5px 7px;
          border-radius: 3px;
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          transition: background 0.1s;
        }
        .bike-item:hover { background: #e8f2fc; }
        .bike-item.selected { background: #cee3f8; font-weight: bold; }
        .bike-item-type { font-size: 10px; color: #888; }

        /* Part card */
        .part-card {
          background: #fff;
          border: 1px solid #dde8f2;
          border-radius: 4px;
          padding: 10px 12px;
          margin-bottom: 8px;
          display: flex;
          align-items: center;
          justify-content: space-between;
          transition: box-shadow 0.15s;
        }
        .part-card:hover { box-shadow: 0 1px 4px rgba(0,0,0,0.08); }

        /* Wear card */
        .wear-card {
          background: #fff;
          border: 1px solid #dde8f2;
          border-radius: 4px;
          padding: 12px 14px;
          margin-bottom: 12px;
        }

        /* Modal */
        .explain-modal-overlay {
          position: fixed; inset: 0;
          background: rgba(0,0,0,0.45);
          display: flex; justify-content: center; align-items: center;
          z-index: 1000;
        }
        .explain-modal {
          background: #fff;
          border-radius: 6px;
          padding: 24px;
          max-width: 580px;
          width: 90%;
          max-height: 80vh;
          overflow-y: auto;
          box-shadow: 0 8px 32px rgba(0,0,0,0.18);
        }
        .explain-modal h3 {
          font-size: 14px;
          color: #336699;
          margin: 0 0 12px 0;
          border-bottom: 1px solid #cee3f8;
          padding-bottom: 6px;
        }
        .explain-modal p { font-size: 13px; line-height: 1.6; color: #333; margin: 0 0 14px 0; }

        /* Ride history */
        .ride-row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 6px 0;
          border-bottom: 1px solid #eef2f7;
          font-size: 11px;
          color: #444;
        }
        .ride-row-date { color: #888; width: 80px; flex-shrink: 0; }

        /* Strava button */
        .strava-btn {
          display: inline-flex;
          align-items: center;
          gap: 6px;
          background: #fc4c02;
          color: #fff;
          font-weight: bold;
          font-size: 11px;
          padding: 6px 12px;
          border-radius: 3px;
          text-decoration: none;
          transition: background 0.1s;
        }
        .strava-btn:hover { background: #e04000; }
      `}</style>

      <div className="reddit-page">
        {/* ── Top Bar ─────────────────────────────────────────── */}
        <div className="reddit-top-bar">
          <div className="reddit-sr-list">
            <Link href="/all">MY SUBREDDITS</Link> ▼ |{" "}
            <Link href="/all">POPULAR</Link> |{" "}
            <Link href="/all">ALL</Link> |{" "}
            <Link href="/all">RANDOM</Link> |{" "}
            <Link href="/all">BIKE_FLIP</Link> |{" "}
            <strong>VELOSTACK_TRACKER</strong>
          </div>
          <div>
            want to join?{" "}
            <Link href="/" style={{ color: "#369", textDecoration: "underline" }}>
              Login or register
            </Link>{" "}
            in seconds. | English
          </div>
        </div>

        {/* ── Subreddit Header with phase nav tabs ─────────────── */}
        <div className="reddit-header">
          <div className="reddit-header-logo-container">
            <Link href="/" className="reddit-logo-text">VeloStack</Link>
            <span className="reddit-sub-title">/r/velostack_tracker</span>
          </div>
          <div className="reddit-tabs">
            <Link href="/all" className="reddit-tab">all phases</Link>
            <Link href="/analyzer" className="reddit-tab">analyzer</Link>
            <span className="reddit-tab active">tracker</span>
            <Link href="/extractor" className="reddit-tab">extractor</Link>
            <Link href="/mechanic" className="reddit-tab">mechanic</Link>
          </div>
        </div>

        {/* ── Main Layout ──────────────────────────────────────── */}
        <div className="reddit-main">
          {/* Left content pane */}
          <div className="reddit-content">
            {/* Inner content tabs */}
            <div className="tracker-inner-tabs">
              <span
                className={`tracker-inner-tab${activeTab === "parts" ? " active" : ""}`}
                onClick={() => setActiveTab("parts")}
              >
                🔩 Parts
              </span>
              <span
                className={`tracker-inner-tab${activeTab === "ride" ? " active" : ""}`}
                onClick={() => setActiveTab("ride")}
              >
                🚴 Ride Log
              </span>
              <span
                className={`tracker-inner-tab${activeTab === "wear" ? " active" : ""}`}
                onClick={() => setActiveTab("wear")}
              >
                ⚡ Wear Report
              </span>
            </div>

            {activeTab === "parts" && <PartsTab />}
            {activeTab === "ride"  && <RideLogTab />}
            {activeTab === "wear"  && <WearReportTab />}
          </div>

          {/* Right sidebar */}
          <Sidebar />
        </div>
      </div>
    </TrackerProvider>
  );
}
