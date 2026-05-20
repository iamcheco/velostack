"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";

interface Step {
  number: number;
  action: string;
  tip?: string;
  warning?: string;
}

interface ExtractionResult {
  title: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimated_minutes: number;
  tools: string[];
  parts: string[];
  steps: Step[];
  skills_learned: string[];
  related_searches: string[];
  videoId?: string;
}

interface SavedRepair extends ExtractionResult {
  id: string;
  savedAt: string;
  completedSteps: number[]; // step numbers
  checkedTools: string[]; // tool names
}

export default function ExtractorPage() {
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<ExtractionResult | null>(null);

  // Completed steps & checked tools for the CURRENT active checklist
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);
  const [checkedTools, setCheckedTools] = useState<string[]>([]);

  // Historical saved repairs
  const [savedRepairs, setSavedRepairs] = useState<SavedRepair[]>([]);
  const [activeSavedId, setActiveSavedId] = useState<string | null>(null);

  // Load saved repairs from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("vst_my_repairs");
    if (saved) {
      try {
        setSavedRepairs(JSON.parse(saved));
      } catch (err) {
        console.error("Failed to parse saved repairs:", err);
      }
    }
  }, []);

  const handleExtract = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!youtubeUrl.trim()) return;

    setLoading(true);
    setError("");
    setResult(null);
    setCompletedSteps([]);
    setCheckedTools([]);
    setActiveSavedId(null);

    try {
      const res = await fetch("/api/extract-steps", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ youtubeUrl: youtubeUrl.trim() }),
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || "Failed to extract steps");
      }

      const data: ExtractionResult = await res.json();
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Something went wrong. Please check the URL.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveRepair = () => {
    if (!result) return;

    // Check if already active or already exists
    const existing = savedRepairs.find(
      (r) => r.title === result.title && r.videoId === result.videoId
    );

    let updatedRepairs: SavedRepair[];

    if (existing) {
      // Just update it
      updatedRepairs = savedRepairs.map((r) =>
        r.id === existing.id
          ? {
              ...r,
              completedSteps,
              checkedTools,
              savedAt: new Date().toISOString(),
            }
          : r
      );
      setActiveSavedId(existing.id);
    } else {
      // Create new
      const newRepair: SavedRepair = {
        ...result,
        id: crypto.randomUUID(),
        savedAt: new Date().toISOString(),
        completedSteps,
        checkedTools,
      };
      updatedRepairs = [newRepair, ...savedRepairs];
      setSavedRepairs(updatedRepairs);
      setActiveSavedId(newRepair.id);
    }

    localStorage.setItem("vst_my_repairs", JSON.stringify(updatedRepairs));
  };

  const handleLoadSaved = (repair: SavedRepair) => {
    setResult({
      title: repair.title,
      difficulty: repair.difficulty,
      estimated_minutes: repair.estimated_minutes,
      tools: repair.tools,
      parts: repair.parts,
      steps: repair.steps,
      skills_learned: repair.skills_learned,
      related_searches: repair.related_searches,
      videoId: repair.videoId,
    });
    setCompletedSteps(repair.completedSteps || []);
    setCheckedTools(repair.checkedTools || []);
    setActiveSavedId(repair.id);
    setError("");
  };

  const handleDeleteSaved = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updated = savedRepairs.filter((r) => r.id !== id);
    setSavedRepairs(updated);
    localStorage.setItem("vst_my_repairs", JSON.stringify(updated));
    if (activeSavedId === id) {
      setResult(null);
      setCompletedSteps([]);
      setCheckedTools([]);
      setActiveSavedId(null);
    }
  };

  // Checkbox interactions
  const toggleStep = (num: number) => {
    const updated = completedSteps.includes(num)
      ? completedSteps.filter((s) => s !== num)
      : [...completedSteps, num];
    setCompletedSteps(updated);

    // Auto-update saved state if active
    if (activeSavedId) {
      const updatedRepairs = savedRepairs.map((r) =>
        r.id === activeSavedId ? { ...r, completedSteps: updated } : r
      );
      setSavedRepairs(updatedRepairs);
      localStorage.setItem("vst_my_repairs", JSON.stringify(updatedRepairs));
    }
  };

  const toggleTool = (tool: string) => {
    const updated = checkedTools.includes(tool)
      ? checkedTools.filter((t) => t !== tool)
      : [...checkedTools, tool];
    setCheckedTools(updated);

    // Auto-update saved state if active
    if (activeSavedId) {
      const updatedRepairs = savedRepairs.map((r) =>
        r.id === activeSavedId ? { ...r, checkedTools: updated } : r
      );
      setSavedRepairs(updatedRepairs);
      localStorage.setItem("vst_my_repairs", JSON.stringify(updatedRepairs));
    }
  };

  // Calculations
  const progressPercent = result?.steps.length
    ? Math.round((completedSteps.length / result.steps.length) * 100)
    : 0;

  return (
    <div className="modern-page">
      {/* Dynamic/Modern Styling */}
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .modern-page {
          font-family: "Plus Jakarta Sans", sans-serif;
          background-color: #0b0f19;
          color: #f3f4f6;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* Nav Header styling */
        .modern-nav {
          background: rgba(15, 23, 42, 0.65);
          backdrop-filter: blur(12px);
          border-bottom: 1px solid rgba(255, 255, 255, 0.08);
          padding: 16px 24px;
          position: sticky;
          top: 0;
          z-index: 100;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }
        .modern-nav-logo {
          font-weight: 800;
          font-size: 20px;
          background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          text-decoration: none;
        }
        .modern-nav-links {
          display: flex;
          gap: 8px;
        }
        .modern-nav-link {
          padding: 8px 16px;
          border-radius: 8px;
          font-size: 13px;
          font-weight: 600;
          color: #9ca3af;
          text-decoration: none;
          transition: all 0.2s ease;
          border: 1px solid transparent;
        }
        .modern-nav-link:hover {
          color: #f3f4f6;
          background: rgba(255, 255, 255, 0.05);
        }
        .modern-nav-link.active {
          color: #ffffff;
          background: rgba(99, 102, 241, 0.15);
          border-color: rgba(99, 102, 241, 0.3);
        }

        /* Container & Layout */
        .modern-container {
          max-width: 1240px;
          margin: 0 auto;
          padding: 32px 24px;
        }
        .modern-layout {
          display: grid;
          grid-template-columns: 1fr 340px;
          gap: 28px;
          margin-top: 28px;
        }
        @media (max-width: 1024px) {
          .modern-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Input Card Component */
        .modern-card {
          background: rgba(17, 24, 39, 0.7);
          backdrop-filter: blur(16px);
          border: 1px solid rgba(255, 255, 255, 0.06);
          border-radius: 16px;
          padding: 24px;
          box-shadow: 0 4px 30px rgba(0, 0, 0, 0.4);
        }
        .modern-input-group {
          display: flex;
          gap: 12px;
          margin-top: 14px;
        }
        .modern-input {
          flex: 1;
          background: rgba(255, 255, 255, 0.04);
          border: 1px solid rgba(255, 255, 255, 0.1);
          border-radius: 12px;
          padding: 14px 18px;
          color: #fff;
          font-family: inherit;
          font-size: 14px;
          outline: none;
          transition: all 0.2s ease;
        }
        .modern-input:focus {
          border-color: #6366f1;
          background: rgba(255, 255, 255, 0.07);
          box-shadow: 0 0 0 3px rgba(99, 102, 241, 0.2);
        }
        .modern-btn {
          background: linear-gradient(135deg, #6366f1 0%, #4f46e5 100%);
          color: #fff;
          font-weight: 700;
          font-size: 14px;
          padding: 14px 24px;
          border-radius: 12px;
          border: none;
          cursor: pointer;
          transition: all 0.2s ease;
          box-shadow: 0 4px 14px rgba(99, 102, 241, 0.35);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .modern-btn:hover:not(:disabled) {
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(99, 102, 241, 0.45);
        }
        .modern-btn:disabled {
          background: #374151;
          color: #9ca3af;
          box-shadow: none;
          cursor: not-allowed;
        }

        /* Difficulty/Rating Badges */
        .modern-badge {
          display: inline-flex;
          align-items: center;
          padding: 4px 10px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .badge-easy {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.3);
        }
        .badge-intermediate {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.3);
        }
        .badge-advanced {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.3);
        }

        /* Progress Tracker */
        .progress-bar-container {
          background: rgba(255, 255, 255, 0.05);
          height: 10px;
          border-radius: 9999px;
          overflow: hidden;
          margin: 12px 0 24px 0;
          border: 1px solid rgba(255, 255, 255, 0.04);
        }
        .progress-bar-fill {
          height: 100%;
          background: linear-gradient(90deg, #6366f1, #a855f7);
          transition: width 0.4s ease;
          border-radius: 9999px;
        }

        /* Step cards */
        .step-card {
          background: rgba(255, 255, 255, 0.02);
          border: 1px solid rgba(255, 255, 255, 0.05);
          border-radius: 12px;
          padding: 20px;
          margin-bottom: 16px;
          transition: all 0.2s ease;
          display: flex;
          gap: 16px;
        }
        .step-card:hover {
          border-color: rgba(99, 102, 241, 0.25);
          background: rgba(255, 255, 255, 0.03);
        }
        .step-card.completed {
          border-color: rgba(16, 185, 129, 0.2);
          background: rgba(16, 185, 129, 0.02);
        }

        /* Checkbox customization */
        .step-checkbox {
          width: 22px;
          height: 22px;
          border-radius: 6px;
          border: 2px solid rgba(255, 255, 255, 0.2);
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          background: transparent;
          flex-shrink: 0;
          margin-top: 2px;
        }
        .step-checkbox.checked {
          background: #10b981;
          border-color: #10b981;
        }
        .step-checkbox.checked::after {
          content: "✓";
          color: white;
          font-weight: 800;
          font-size: 13px;
        }

        /* Pro Tips and Warnings */
        .step-tip {
          background: rgba(99, 102, 241, 0.08);
          border-left: 3px solid #6366f1;
          padding: 8px 12px;
          border-radius: 0 8px 8px 0;
          margin-top: 10px;
          font-size: 12px;
          color: #c7d2fe;
        }
        .step-warning {
          background: rgba(239, 68, 68, 0.08);
          border-left: 3px solid #ef4444;
          padding: 8px 12px;
          border-radius: 0 8px 8px 0;
          margin-top: 10px;
          font-size: 12px;
          color: #fca5a5;
        }

        /* History items list */
        .history-item {
          padding: 10px 12px;
          border-radius: 8px;
          border: 1px solid rgba(255, 255, 255, 0.04);
          cursor: pointer;
          display: flex;
          justify-content: space-between;
          align-items: center;
          font-size: 12px;
          background: rgba(255, 255, 255, 0.01);
          margin-bottom: 6px;
          transition: all 0.15s ease;
        }
        .history-item:hover {
          background: rgba(255, 255, 255, 0.04);
          border-color: rgba(255, 255, 255, 0.1);
        }
        .history-item.active {
          background: rgba(99, 102, 241, 0.08);
          border-color: rgba(99, 102, 241, 0.3);
        }
        .history-delete-btn {
          color: #ef4444;
          cursor: pointer;
          padding: 2px 6px;
          border-radius: 4px;
          transition: background 0.15s;
        }
        .history-delete-btn:hover {
          background: rgba(239, 68, 68, 0.15);
        }

        /* Sidebar widget checklists */
        .widget-checkbox {
          display: flex;
          align-items: center;
          gap: 10px;
          font-size: 13px;
          color: #d1d5db;
          margin-bottom: 8px;
          cursor: pointer;
        }
        .widget-checkbox input {
          width: 16px;
          height: 16px;
          accent-color: #6366f1;
          cursor: pointer;
        }

        /* Practice link button */
        .practice-link-btn {
          display: block;
          text-align: center;
          background: rgba(168, 85, 247, 0.15);
          color: #c084fc;
          border: 1px solid rgba(168, 85, 247, 0.3);
          border-radius: 8px;
          padding: 10px;
          font-size: 12px;
          font-weight: 600;
          text-decoration: none;
          transition: all 0.2s ease;
          margin-top: 14px;
        }
        .practice-link-btn:hover {
          background: rgba(168, 85, 247, 0.25);
          border-color: rgba(168, 85, 247, 0.5);
          transform: translateY(-1px);
        }

        /* Skeleton loading */
        .modern-skeleton {
          background: linear-gradient(90deg, rgba(255, 255, 255, 0.02) 25%, rgba(255, 255, 255, 0.05) 50%, rgba(255, 255, 255, 0.02) 75%);
          background-size: 200% 100%;
          animation: modern-pulse 1.5s infinite;
          border-radius: 8px;
        }
        @keyframes modern-pulse {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>

      {/* Navigation Header */}
      <header className="modern-nav">
        <Link href="/" className="modern-nav-logo">
          VeloStack
        </Link>
        <nav className="modern-nav-links">
          <Link href="/all" className="modern-nav-link">
            all phases
          </Link>
          <Link href="/analyzer" className="modern-nav-link">
            analyzer
          </Link>
          <Link href="/tracker" className="modern-nav-link">
            tracker
          </Link>
          <span className="modern-nav-link active">extractor</span>
          <Link href="/mechanic" className="modern-nav-link">
            mechanic
          </Link>
          <Link href="/ledger" className="modern-nav-link">
            ledger
          </Link>
          <Link href="/settings" className="modern-nav-link">
            sniper
          </Link>
        </nav>
      </header>

      {/* Main Container */}
      <div className="modern-container">
        {/* URL Entry Form */}
        <div className="modern-card">
          <h2 style={{ margin: "0 0 6px 0", fontSize: 18, fontWeight: 700 }}>
            🎥 YouTube Skill Extractor
          </h2>
          <p style={{ margin: 0, fontSize: 13, color: "#9ca3af" }}>
            Paste a bike repair tutorial URL to extract step-by-step interactive checklists, tool checklists, and difficulty ratings.
          </p>
          <form onSubmit={handleExtract} className="modern-input-group">
            <input
              type="url"
              className="modern-input"
              value={youtubeUrl}
              onChange={(e) => setYoutubeUrl(e.target.value)}
              placeholder="e.g. https://www.youtube.com/watch?v=k8v5Xw8Y048"
              required
              disabled={loading}
            />
            <button type="submit" className="modern-btn" disabled={loading}>
              {loading ? "Extracting..." : "Get Checklist"}
            </button>
          </form>
          {error && (
            <div
              style={{
                marginTop: 12,
                color: "#f87171",
                fontSize: 13,
                background: "rgba(239, 68, 68, 0.1)",
                padding: "8px 12px",
                borderRadius: 8,
              }}
            >
              ⚠️ {error}
            </div>
          )}
        </div>

        {/* Dashboard Grid */}
        <div className="modern-layout">
          {/* Main Content Pane */}
          <div>
            {loading && (
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                  <div className="modern-skeleton" style={{ height: 28, width: "60%" }} />
                  <div className="modern-skeleton" style={{ height: 28, width: "15%" }} />
                </div>
                <div className="modern-skeleton" style={{ height: 40, width: "100%", marginBottom: 16 }} />
                <div className="modern-skeleton" style={{ height: 120, width: "100%", marginBottom: 16 }} />
                <div className="modern-skeleton" style={{ height: 120, width: "100%", marginBottom: 16 }} />
              </div>
            )}

            {!loading && !result && (
              <div
                style={{
                  textAlign: "center",
                  padding: "60px 20px",
                  background: "rgba(255, 255, 255, 0.01)",
                  borderRadius: 16,
                  border: "1px dashed rgba(255, 255, 255, 0.08)",
                }}
              >
                <div style={{ fontSize: 48, marginBottom: 16 }}>🛠️</div>
                <h3 style={{ margin: "0 0 6px 0", fontSize: 16, fontWeight: 700 }}>
                  No Active Checklist
                </h3>
                <p style={{ margin: 0, fontSize: 13, color: "#9ca3af", maxWidth: 400, marginInline: "auto" }}>
                  Paste a repair video URL above or load a previously saved repair guide from the sidebar history to get started.
                </p>
              </div>
            )}

            {!loading && result && (
              <div>
                {/* Meta details header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 16, marginBottom: 6 }}>
                  <div>
                    <h1 style={{ fontSize: 22, fontWeight: 800, margin: "0 0 4px 0" }}>
                      {result.title}
                    </h1>
                    {result.videoId && (
                      <a
                        href={`https://youtube.com/watch?v=${result.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        style={{ fontSize: 12, color: "#818cf8", textDecoration: "none" }}
                      >
                        📺 View Original Tutorial on YouTube →
                      </a>
                    )}
                  </div>
                  <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: 6 }}>
                    <span className={`modern-badge badge-${result.difficulty}`}>
                      {result.difficulty}
                    </span>
                    <span style={{ fontSize: 12, color: "#9ca3af", fontWeight: 600 }}>
                      ⏱️ {result.estimated_minutes} min
                    </span>
                  </div>
                </div>

                {/* Progress tracker */}
                <div style={{ marginTop: 14 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, fontWeight: 600 }}>
                    <span>Progress</span>
                    <span>{progressPercent}% Complete</span>
                  </div>
                  <div className="progress-bar-container">
                    <div className="progress-bar-fill" style={{ width: `${progressPercent}%` }} />
                  </div>
                </div>

                {/* Action buttons */}
                <div style={{ display: "flex", gap: 10, marginBottom: 20 }}>
                  <button className="modern-btn" style={{ padding: "10px 18px", fontSize: 13 }} onClick={handleSaveRepair}>
                    💾 {activeSavedId ? "Update Save State" : "Save to My Repairs"}
                  </button>
                  {activeSavedId && (
                    <span style={{ display: "inline-flex", alignItems: "center", color: "#10b981", fontSize: 12, fontWeight: 700 }}>
                      ✓ Auto-saving to active local session
                    </span>
                  )}
                </div>

                {/* Steps checklist */}
                <h3 style={{ fontSize: 15, fontWeight: 700, marginBottom: 12 }}>
                  Repair Checkpoints ({result.steps.length})
                </h3>
                {result.steps.map((step) => {
                  const isCompleted = completedSteps.includes(step.number);
                  return (
                    <div key={step.number} className={`step-card${isCompleted ? " completed" : ""}`}>
                      <div className={`step-checkbox${isCompleted ? " checked" : ""}`} onClick={() => toggleStep(step.number)} />
                      <div style={{ flex: 1 }}>
                        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 4 }}>
                          <span style={{ fontWeight: 700, fontSize: 14, color: isCompleted ? "#9ca3af" : "#fff" }}>
                            {step.number}. {step.action}
                          </span>
                        </div>
                        {step.tip && <div className="step-tip">💡 <strong>Mechanic Tip:</strong> {step.tip}</div>}
                        {step.warning && <div className="step-warning">⚠️ <strong>Critical Alert:</strong> {step.warning}</div>}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Right Sidebar Widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
            {/* Save list widget */}
            <div className="modern-card" style={{ padding: 18 }}>
              <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6 }}>
                💾 My Repairs
              </h3>
              {savedRepairs.length === 0 ? (
                <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>
                  No saved repairs yet. Complete or customize any checklist above and save it to keep a history of your maintenance tasks!
                </p>
              ) : (
                <div style={{ maxHeight: 200, overflowY: "auto" }}>
                  {savedRepairs.map((r) => {
                    const donePercent = r.steps.length
                      ? Math.round(((r.completedSteps?.length || 0) / r.steps.length) * 100)
                      : 0;
                    return (
                      <div
                        key={r.id}
                        className={`history-item${activeSavedId === r.id ? " active" : ""}`}
                        onClick={() => handleLoadSaved(r)}
                      >
                        <div style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, paddingRight: 8 }}>
                          <strong>{r.title}</strong>
                          <div style={{ fontSize: 10, color: "#9ca3af", marginTop: 2 }}>
                            {donePercent}% done · {r.steps.length} steps
                          </div>
                        </div>
                        <span className="history-delete-btn" onClick={(e) => handleDeleteSaved(r.id, e)}>
                          ✕
                        </span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Required details checklist */}
            {result && (
              <>
                {/* Tools checklist widget */}
                <div className="modern-card" style={{ padding: 18 }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6 }}>
                    🔧 Pre-work Tools Check
                  </h3>
                  {result.tools.length === 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>No special tools needed.</p>
                  )}
                  {result.tools.map((tool) => (
                    <label key={tool} className="widget-checkbox">
                      <input
                        type="checkbox"
                        checked={checkedTools.includes(tool)}
                        onChange={() => toggleTool(tool)}
                      />
                      <span style={{ textDecoration: checkedTools.includes(tool) ? "line-through" : "none", color: checkedTools.includes(tool) ? "#6b7280" : "#d1d5db" }}>
                        {tool}
                      </span>
                    </label>
                  ))}
                </div>

                {/* Parts checklist widget */}
                <div className="modern-card" style={{ padding: 18 }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6 }}>
                    📦 Required Spare Parts
                  </h3>
                  {result.parts.length === 0 && (
                    <p style={{ margin: 0, fontSize: 12, color: "#6b7280" }}>No new parts needed.</p>
                  )}
                  <ul style={{ paddingLeft: 16, margin: 0, fontSize: 13, color: "#d1d5db" }}>
                    {result.parts.map((part) => (
                      <li key={part} style={{ marginBottom: 4 }}>
                        {part}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Skills gained widget */}
                <div className="modern-card" style={{ padding: 18 }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6 }}>
                    🧠 Skills Gained
                  </h3>
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
                    {result.skills_learned.map((skill) => (
                      <span
                        key={skill}
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          background: "rgba(255, 255, 255, 0.05)",
                          border: "1px solid rgba(255,255,255,0.08)",
                          padding: "3px 8px",
                          borderRadius: 6,
                          color: "#9ca3af",
                        }}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Kleinanzeigen cross-link practice widget */}
                <div className="modern-card" style={{ padding: 18 }}>
                  <h3 style={{ margin: "0 0 10px 0", fontSize: 14, fontWeight: 700, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: 6 }}>
                    🚴 Practice This Flip
                  </h3>
                  <p style={{ margin: 0, fontSize: 12, color: "#9ca3af", lineHeight: 1.5 }}>
                    Want to lock in this skill? Find a listing in Phase 1 with these components to practice your repair on!
                  </p>
                  {result.related_searches.map((search) => (
                    <Link
                      key={search}
                      href={`/analyzer?query=${encodeURIComponent(search)}`}
                      className="practice-link-btn"
                    >
                      🔍 Search listings for &quot;{search}&quot;
                    </Link>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
