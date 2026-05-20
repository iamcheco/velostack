"use client";

import React, { useState } from "react";
import { useTracker } from "@/app/tracker/context";
import { PartType, PART_TYPE_LABELS } from "@/lib/tracker-types";

// Extends PartType labels to include custom saddle/grip categories
const ALL_CATEGORY_LABELS: Record<string, string> = {
  ...PART_TYPE_LABELS,
  saddle: "Saddle",
  grip: "Grips & Handlebars",
};

export default function PartsBinTab() {
  const { store, addPartsBinItem, removePartsBinItem } = useTracker();

  // Form State
  const [componentType, setComponentType] = useState<string>("chain");
  const [brandModel, setBrandModel] = useState("");
  const [condition, setCondition] = useState<"new" | "excellent" | "fair" | "worn">("new");
  const [compatSpeeds, setCompatSpeeds] = useState<string>("11");
  const [estimatedValueEur, setEstimatedValueEur] = useState("30");
  const [formError, setFormError] = useState("");
  const [formSuccess, setFormSuccess] = useState(false);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilterCategory, setActiveFilterCategory] = useState<string>("all");

  const handleAddPart = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    setFormSuccess(false);

    if (!brandModel.trim()) {
      setFormError("Please enter a brand and model name.");
      return;
    }

    const value = parseFloat(estimatedValueEur);
    if (isNaN(value) || value < 0) {
      setFormError("Please enter a valid estimated value.");
      return;
    }

    const speeds = (componentType === "chain" || componentType === "cassette") 
      ? parseInt(compatSpeeds) 
      : undefined;

    addPartsBinItem({
      componentType: componentType as any,
      brandModel: brandModel.trim(),
      condition,
      compatSpeeds: speeds,
      estimatedValueEur: value,
    });

    // Reset Form
    setBrandModel("");
    setFormSuccess(true);
    setTimeout(() => setFormSuccess(false), 3000);
  };

  // Filter Parts List
  const parts = store.partsBin || [];
  const filteredParts = parts.filter((part) => {
    const matchesSearch = part.brandModel.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = activeFilterCategory === "all" || part.componentType === activeFilterCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="partsbin-container">
      <style jsx>{`
        .partsbin-grid {
          display: grid;
          grid-template-columns: 320px 1fr;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 768px) {
          .partsbin-grid {
            grid-template-columns: 1fr;
          }
        }

        .category-filter-bar {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-bottom: 16px;
        }
        .filter-pill {
          padding: 6px 12px;
          border-radius: 9999px;
          font-size: 11px;
          font-weight: 600;
          color: #64748b;
          background: #ffffff;
          border: 1px solid #e2e8f0;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .filter-pill:hover {
          border-color: #cbd5e1;
          color: #0f172a;
        }
        .filter-pill.active {
          background: #0f172a;
          border-color: #0f172a;
          color: #ffffff;
        }

        .partbin-card-list {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
          gap: 12px;
        }
        .partbin-item-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 10px;
          padding: 14px;
          box-shadow: 0 2px 4px rgba(0,0,0,0.01);
          transition: all 0.15s ease;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          position: relative;
        }
        .partbin-item-card:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.04);
          border-color: #cbd5e1;
        }

        .delete-icon-btn {
          position: absolute;
          top: 12px;
          right: 12px;
          background: transparent;
          border: none;
          color: #ef4444;
          font-size: 14px;
          cursor: pointer;
          padding: 4px;
          border-radius: 4px;
          transition: background 0.15s;
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .delete-icon-btn:hover {
          background: #fee2e2;
        }

        /* Condition Badge styling */
        .cond-badge {
          display: inline-flex;
          padding: 2px 8px;
          border-radius: 9999px;
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.5px;
        }
        .cond-new { background: #dcfce7; color: #166534; }
        .cond-excellent { background: #e0f2fe; color: #0369a1; }
        .cond-fair { background: #fef9c3; color: #854d0e; }
        .cond-worn { background: #f1f5f9; color: #475569; }

        .empty-state {
          background: #ffffff;
          border: 1.5px dashed #cbd5e1;
          border-radius: 12px;
          padding: 40px 20px;
          text-align: center;
          color: #64748b;
        }
      `}</style>

      <div className="partsbin-grid">
        {/* Left Side: Add Component Form */}
        <div className="modern-card">
          <h3 className="modern-card-title">📥 Log Spare Component</h3>

          {formError && (
            <div style={{ background: "#fee2e2", border: "1px solid #fca5a5", color: "#991b1b", padding: "10px", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
              ⚠️ {formError}
            </div>
          )}

          {formSuccess && (
            <div style={{ background: "#dcfce7", border: "1px solid #bbf7d0", color: "#166534", padding: "10px", borderRadius: 8, fontSize: 12, marginBottom: 14 }}>
              ✅ Spare part added successfully!
            </div>
          )}

          <form onSubmit={handleAddPart}>
            <div className="modern-form-group">
              <label className="modern-form-label">Part Category</label>
              <select
                className="modern-form-input"
                value={componentType}
                onChange={(e) => setComponentType(e.target.value)}
              >
                {Object.entries(ALL_CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>
            </div>

            <div className="modern-form-group">
              <label className="modern-form-label">Brand & Model</label>
              <input
                type="text"
                className="modern-form-input"
                placeholder="e.g. Continental GP5000, Shimano XT"
                value={brandModel}
                onChange={(e) => setBrandModel(e.target.value)}
              />
            </div>

            <div className="modern-form-group">
              <label className="modern-form-label">Condition</label>
              <select
                className="modern-form-input"
                value={condition}
                onChange={(e) => setCondition(e.target.value as any)}
              >
                <option value="new">🆕 Brand New</option>
                <option value="excellent">💎 Excellent (Barely Used)</option>
                <option value="fair">👍 Fair (Normal Wear)</option>
                <option value="worn">⚠️ Worn (Spare backup)</option>
              </select>
            </div>

            {/* Drivetrain Speeds (only show if Chain or Cassette selected) */}
            {(componentType === "chain" || componentType === "cassette") && (
              <div className="modern-form-group">
                <label className="modern-form-label">Drivetrain Speeds</label>
                <select
                  className="modern-form-input"
                  value={compatSpeeds}
                  onChange={(e) => setCompatSpeeds(e.target.value)}
                >
                  <option value="8">8-Speed</option>
                  <option value="9">9-Speed</option>
                  <option value="10">10-Speed</option>
                  <option value="11">11-Speed</option>
                  <option value="12">12-Speed</option>
                </select>
              </div>
            )}

            <div className="modern-form-group">
              <label className="modern-form-label">Estimated Value (EUR)</label>
              <input
                type="number"
                min="0"
                className="modern-form-input"
                value={estimatedValueEur}
                onChange={(e) => setEstimatedValueEur(e.target.value)}
              />
            </div>

            <button type="submit" className="btn-modern-primary" style={{ width: "100%", justifyContent: "center", marginTop: 6 }}>
              ➕ Add to Parts Bin
            </button>
          </form>
        </div>

        {/* Right Side: Inventory Listing */}
        <div>
          {/* Search bar & Category filters */}
          <div className="modern-card" style={{ padding: 14 }}>
            <div style={{ display: "flex", gap: 10, marginBottom: 14 }}>
              <input
                type="text"
                className="modern-form-input"
                style={{ margin: 0 }}
                placeholder="🔍 Search garage inventory models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <p style={{ margin: "0 0 8px 0", fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px" }}>FILTER CATEGORY</p>
            <div className="category-filter-bar">
              <button
                className={`filter-pill ${activeFilterCategory === "all" ? "active" : ""}`}
                onClick={() => setActiveFilterCategory("all")}
              >
                All Components
              </button>
              {Object.entries(ALL_CATEGORY_LABELS).map(([key, label]) => (
                <button
                  key={key}
                  className={`filter-pill ${activeFilterCategory === key ? "active" : ""}`}
                  onClick={() => setActiveFilterCategory(key)}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          {/* Parts Grid */}
          {filteredParts.length === 0 ? (
            <div className="empty-state">
              <span style={{ fontSize: 32, display: "block", marginBottom: 10 }}>📦</span>
              <p style={{ margin: "0 0 4px 0", fontWeight: 600, color: "#475569" }}>No inventory parts found.</p>
              <p style={{ margin: 0, fontSize: 12 }}>Try adjusting your search query or log a new spare component on the left drawer!</p>
            </div>
          ) : (
            <div className="partbin-card-list">
              {filteredParts.map((part) => (
                <div key={part.id} className="partbin-item-card">
                  {/* Delete button */}
                  <button
                    className="delete-icon-btn"
                    title="Remove item"
                    onClick={() => removePartsBinItem(part.id)}
                  >
                    🗑️
                  </button>

                  <div>
                    <span style={{ fontSize: 10, fontWeight: 700, color: "#64748b", textTransform: "uppercase" }}>
                      {ALL_CATEGORY_LABELS[part.componentType] || part.componentType}
                    </span>
                    <h4 style={{ margin: "4px 0 8px 0", fontSize: 14, fontWeight: 700 }}>
                      {part.brandModel}
                    </h4>

                    <div style={{ display: "flex", gap: 6, flexWrap: "wrap", alignItems: "center", marginBottom: 12 }}>
                      <span className={`cond-badge cond-${part.condition}`}>
                        {part.condition}
                      </span>
                      {part.compatSpeeds && (
                        <span style={{ fontSize: 10, background: "#f1f5f9", padding: "2px 8px", borderRadius: 9999, fontWeight: 600 }}>
                          {part.compatSpeeds}-Speed
                        </span>
                      )}
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline", borderTop: "1px solid #f1f5f9", paddingTop: 8 }}>
                    <span style={{ fontSize: 11, color: "#64748b" }}>Est. Value</span>
                    <span style={{ fontSize: 15, fontWeight: 800, color: "#0f172a" }}>
                      €{part.estimatedValueEur.toFixed(2)}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
