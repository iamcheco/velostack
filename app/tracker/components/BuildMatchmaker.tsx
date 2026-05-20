"use client";

import React, { useState, useEffect } from "react";
import { useTracker } from "@/app/tracker/context";
import { validateBuild, FRAME_PRESETS, parseTireWidth, detectBBStandard, detectWheelSize } from "@/lib/compatibility";
import type { BikeFrameSpecs, MountedPartsState, CompatibilityIssue, PartsBinItem } from "@/lib/tracker-types";

// Helper to map slot keys to readable labels and expected categories
const SLOT_METADATA: Record<string, { label: string; icon: string; compatTypes: string[] }> = {
  saddle: { label: "Saddle", icon: "🏇", compatTypes: ["saddle"] },
  shifter: { label: "Cockpit Shifter", icon: "🕹️", compatTypes: ["shifter"] },
  bottomBracket: { label: "Bottom Bracket", icon: "🔄", compatTypes: ["bottom_bracket"] },
  chain: { label: "Chain", icon: "⛓️", compatTypes: ["chain"] },
  cassette: { label: "Cassette", icon: "⚙️", compatTypes: ["cassette"] },
  wheelset: { label: "Wheelset", icon: "⭕", compatTypes: ["wheelset"] },
  rotor: { label: "Brake Rotor", icon: "💿", compatTypes: ["rotor"] },
  tire: { label: "Tires", icon: "🚴", compatTypes: ["tire", "tire_front", "tire_rear"] },
};

export default function BuildMatchmaker() {
  const { store, setStore, selectedBikeId, updateFrameSpecs, updateMountedParts } = useTracker();
  
  // Active Bike Details
  const selectedBike = store.bikes.find(b => b.id === selectedBikeId);

  // Specs & Mounted State per Bike Frame
  const currentSpecs = selectedBikeId && store.bikeFrameSpecs?.[selectedBikeId]
    ? store.bikeFrameSpecs[selectedBikeId]
    : null;

  const currentMounted = selectedBikeId && store.mountedParts?.[selectedBikeId]
    ? store.mountedParts[selectedBikeId]
    : { frameId: selectedBikeId };

  // Expandable configs drawer state
  const [isConfigOpen, setIsConfigOpen] = useState(false);

  // Drag and drop highlights
  const [draggingType, setDraggingType] = useState<string | null>(null);
  const [overSlot, setOverSlot] = useState<string | null>(null);

  // Pre-fill / Auto-initialize presets if frame specs don't exist yet
  useEffect(() => {
    if (selectedBike && !currentSpecs) {
      // Auto-apply archetype preset based on bike type
      const preset = FRAME_PRESETS[selectedBike.type] || FRAME_PRESETS.road;
      updateFrameSpecs(selectedBike.id, preset);
      updateMountedParts(selectedBike.id, { frameId: selectedBike.id });
    }
  }, [selectedBike, currentSpecs, selectedBikeId, updateFrameSpecs, updateMountedParts]);

  if (!selectedBike) {
    return (
      <div className="modern-card" style={{ textAlign: "center", padding: "40px 20px" }}>
        <span style={{ fontSize: 40 }}>🧬</span>
        <h3 style={{ margin: "12px 0 6px 0", fontSize: 16 }}>No Active Bike Selected</h3>
        <p style={{ color: "#64748b", fontSize: 13, margin: 0 }}>
          Please select or register an active bike frame in the left sidebar to access the Franken-Bike Matchmaker.
        </p>
      </div>
    );
  }

  // Get specs or fallbacks
  const specs: BikeFrameSpecs = currentSpecs || FRAME_PRESETS[selectedBike.type] || FRAME_PRESETS.road;
  const mounted: MountedPartsState = currentMounted;
  const partsBin: PartsBinItem[] = store.partsBin || [];

  // Rules Validation Engine
  const issues = validateBuild(specs, mounted, partsBin);

  // Calculate Build progress & stats
  const coreSlots = ["bottomBracket", "chain", "cassette", "wheelset", "tire"];
  const mountedCount = coreSlots.filter(slot => !!mounted[slot as keyof MountedPartsState]).length;
  
  const totalValue = Object.entries(mounted)
    .filter(([key]) => key !== "frameId")
    .reduce((sum, [_, partId]) => {
      const part = partsBin.find(p => p.id === partId);
      return sum + (part ? part.estimatedValueEur : 0);
    }, 0);

  // Dynamic preset changer
  const handleApplyPreset = (type: keyof typeof FRAME_PRESETS) => {
    updateFrameSpecs(selectedBike.id, FRAME_PRESETS[type]);
  };

  // State actions
  const handleMountPart = (slotKey: keyof MountedPartsState, partId: string) => {
    updateMountedParts(selectedBike.id, {
      ...mounted,
      [slotKey]: partId,
    });
  };

  const handleUnmountPart = (slotKey: keyof MountedPartsState) => {
    const updated = { ...mounted };
    delete updated[slotKey];
    updateMountedParts(selectedBike.id, updated);
  };

  const handleInjectMockSpares = () => {
    const mockItems: Omit<PartsBinItem, "id" | "dateAdded">[] = [
      {
        componentType: "chain",
        brandModel: "Shimano Ultegra CN-HG701 11-Speed",
        condition: "new",
        compatSpeeds: 11,
        estimatedValueEur: 29.00,
      },
      {
        componentType: "chain",
        brandModel: "SRAM PC-1031 PowerChain 10-Speed",
        condition: "excellent",
        compatSpeeds: 10,
        estimatedValueEur: 19.00,
      },
      {
        componentType: "cassette",
        brandModel: "Shimano 105 R7000 11-30t 11-Speed",
        condition: "new",
        compatSpeeds: 11,
        estimatedValueEur: 45.00,
      },
      {
        componentType: "cassette",
        brandModel: "SRAM GX Eagle 10-52t 12-Speed",
        condition: "new",
        compatSpeeds: 12,
        estimatedValueEur: 129.00,
      },
      {
        componentType: "shifter",
        brandModel: "Shimano DropBar 105 11-Speed Shifters",
        condition: "excellent",
        compatSpeeds: 11,
        estimatedValueEur: 140.00,
      },
      {
        componentType: "bottom_bracket",
        brandModel: "Shimano BBR60 BSA Threaded BB Cups",
        condition: "new",
        estimatedValueEur: 22.00,
      },
      {
        componentType: "bottom_bracket",
        brandModel: "SRAM DUB PressFit BB86/92 Bottom Bracket",
        condition: "new",
        estimatedValueEur: 38.00,
      },
      {
        componentType: "wheelset",
        brandModel: "Zipp 303 Firecrest 700c Disc Centerlock Wheelset",
        condition: "excellent",
        estimatedValueEur: 1450.00,
      },
      {
        componentType: "wheelset",
        brandModel: "DT Swiss M1900 29-Inch 6-Bolt Boost MTB Wheelset",
        condition: "excellent",
        estimatedValueEur: 320.00,
      },
      {
        componentType: "rotor",
        brandModel: "Shimano RT86 6-Bolt 160mm Ice-Tech Rotor",
        condition: "new",
        estimatedValueEur: 35.00,
      },
      {
        componentType: "rotor",
        brandModel: "SRAM Centerline Centerlock 160mm Disc Rotor",
        condition: "excellent",
        estimatedValueEur: 39.00,
      },
      {
        componentType: "tire",
        brandModel: "Panaracer GravelKing SK 700x38c Gravel Tire",
        condition: "new",
        estimatedValueEur: 42.00,
      },
      {
        componentType: "tire",
        brandModel: "Continental Grand Prix 5000 700x28c Road Tire",
        condition: "new",
        estimatedValueEur: 62.00,
      },
      {
        componentType: "tire",
        brandModel: "Maxxis Rekon 29x2.4 TR Trail MTB Tire",
        condition: "new",
        estimatedValueEur: 58.00,
      },
      {
        componentType: "saddle",
        brandModel: "Selle Italia SLR Boost Superflow Saddle",
        condition: "excellent",
        estimatedValueEur: 110.00,
      },
    ];

    // Inject items into store
    setStore((prev) => {
      const generated: PartsBinItem[] = mockItems.map((item, idx) => ({
        ...item,
        id: `partbin-mock-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 9)}`,
        dateAdded: new Date().toISOString().split("T")[0],
      }));
      return {
        ...prev,
        partsBin: [...(prev.partsBin || []), ...generated],
      };
    });
  };

  // Drag and Drop helpers
  const handleDragStart = (e: React.DragEvent, partId: string, type: string) => {
    e.dataTransfer.setData("partId", partId);
    e.dataTransfer.setData("componentType", type);
    setDraggingType(type);
  };

  const handleDragEnd = () => {
    setDraggingType(null);
    setOverSlot(null);
  };

  const isSlotCompatible = (slotKey: string, draggedType: string | null) => {
    if (!draggedType) return false;
    const compatTypes = SLOT_METADATA[slotKey]?.compatTypes || [];
    return compatTypes.includes(draggedType);
  };

  // Diagnostic checklist computations
  const checkList = [
    {
      id: "speeds",
      title: "Drivetrain Speed Alignment",
      ok: !issues.some(i => i.id.includes("drivetrain")),
      desc: "Cassette, shifter, chain, and frame design target speeds must match.",
    },
    {
      id: "bb",
      title: "Bottom Bracket Shell Standard",
      ok: !issues.some(i => i.id.includes("bb")),
      desc: `Frame utilizes a ${specs.bottomBracketShell} shell standard.`,
    },
    {
      id: "wheels",
      title: "Wheelset Fitment & Clearance",
      ok: !issues.some(i => i.id.includes("wheelset")),
      desc: `Frame fits ${specs.wheelSize} diameter wheels.`,
    },
    {
      id: "tire",
      title: "Maximum Tire Clearance Limit",
      ok: !issues.some(i => i.id.includes("tire")),
      desc: `Tire width must not exceed the frame's max clearance of ${specs.maxTireClearance}mm.`,
    },
    {
      id: "brake",
      title: "Brake Mounting & Rotor Interfaces",
      ok: !issues.some(i => i.id.includes("rotor") || i.id.includes("brake") || i.id.includes("rim")),
      desc: `Frame utilizes ${specs.brakeMount} brake mounting standards.`,
    },
  ];

  return (
    <div className="matchmaker-container animate-fade-in">
      <style jsx>{`
        .matchmaker-layout {
          display: grid;
          grid-template-columns: 290px 1fr 310px;
          gap: 20px;
          align-items: start;
        }
        @media (max-width: 1200px) {
          .matchmaker-layout {
            grid-template-columns: 1fr;
          }
        }

        /* Inventory Drawer */
        .drawer-list {
          display: flex;
          flex-direction: column;
          gap: 10px;
          max-height: 520px;
          overflow-y: auto;
          padding-right: 4px;
        }
        .drawer-item {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          padding: 10px 12px;
          cursor: grab;
          transition: all 0.2s ease;
          display: flex;
          justify-content: space-between;
          align-items: center;
          user-select: none;
        }
        .drawer-item:hover {
          border-color: #cbd5e1;
          box-shadow: 0 4px 10px rgba(0, 0, 0, 0.03);
          transform: translateY(-1px);
        }
        .drawer-item.mounted {
          opacity: 0.65;
          border-style: dashed;
          background: #f8fafc;
          cursor: not-allowed;
        }

        /* Center Canvas */
        .canvas-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          position: relative;
          box-shadow: 0 4px 6px -1px rgba(0,0,0,0.01);
          min-height: 480px;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
        }

        /* Frame Config Drawer */
        .config-drawer {
          border-bottom: 1px solid #f1f5f9;
          padding-bottom: 16px;
          margin-bottom: 16px;
          animation: slideDown 0.2s ease;
        }
        @keyframes slideDown {
          from { opacity: 0; transform: translateY(-10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        /* Interactive Canvas Framework */
        .canvas-visual-wrapper {
          position: relative;
          width: 100%;
          height: 300px;
          margin: 10px 0;
          background: #f8fafc;
          border-radius: 10px;
          border: 1px solid #f1f5f9;
          overflow: hidden;
        }

        /* Visual Nodes Absolute Positioning */
        .canvas-node {
          position: absolute;
          z-index: 10;
          transform: translate(-50%, -50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
        }
        .node-hotspot {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: #ffffff;
          border: 2px solid #cbd5e1;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
          cursor: pointer;
          transition: all 0.2s ease;
        }
        .node-hotspot.glow-green {
          border-color: #22c55e;
          background: #f0fdf4;
          box-shadow: 0 0 12px rgba(34, 197, 94, 0.6);
          transform: scale(1.15);
        }
        .node-hotspot.glow-red {
          border-color: #ef4444;
          background: #fef2f2;
          box-shadow: 0 0 12px rgba(239, 68, 68, 0.6);
          transform: scale(1.1);
        }
        .node-hotspot.mounted {
          border-color: #0f172a;
          background: #0f172a;
          color: #ffffff;
          box-shadow: 0 4px 10px rgba(15, 23, 42, 0.2);
        }
        .node-label {
          font-size: 10px;
          font-weight: 700;
          color: #64748b;
          text-transform: uppercase;
          background: rgba(255, 255, 255, 0.85);
          padding: 2px 6px;
          border-radius: 4px;
          border: 1px solid #f1f5f9;
          white-space: nowrap;
          pointer-events: none;
        }

        /* SVG Framework Lines */
        .bike-svg-lines {
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
        }

        /* Diagnostic ledger */
        .diagnostics-panel {
          display: flex;
          flex-direction: column;
          gap: 12px;
        }
        .diag-checklist-item {
          display: flex;
          gap: 10px;
          padding: 8px 10px;
          border-radius: 8px;
          background: #f8fafc;
          border: 1px solid #f1f5f9;
        }
        .diag-checklist-item.error {
          border-color: #fee2e2;
          background: #fff5f5;
        }
        .diag-badge-ok {
          color: #166534;
          font-weight: 800;
        }
        .diag-badge-error {
          color: #991b1b;
          font-weight: 800;
        }
      `}</style>

      <div className="matchmaker-layout">
        {/* Left Side: Garage Drawer of Spares */}
        <div className="modern-card">
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
            <h3 className="modern-card-title" style={{ border: "none", padding: 0, margin: 0 }}>
              📥 Bin Spares
            </h3>
            <span style={{ fontSize: 11, fontWeight: 700, color: "#64748b", background: "#f1f5f9", padding: "2px 8px", borderRadius: 9999 }}>
              {partsBin.length} available
            </span>
          </div>

          <p style={{ fontSize: 11, color: "#64748b", marginTop: -6, marginBottom: 16 }}>
            Drag components from your garage inventory and drop them onto the frame hotspots to evaluate clearance, standard compatibility, and speeds.
          </p>

          {partsBin.length === 0 ? (
            <div style={{ textAlign: "center", padding: "30px 10px", border: "1.5px dashed #cbd5e1", borderRadius: 10 }}>
              <span style={{ fontSize: 24, display: "block", marginBottom: 6 }}>📦</span>
              <p style={{ margin: "0 0 10px 0", fontSize: 12, fontWeight: 600, color: "#475569" }}>Your parts bin is empty</p>
              <button className="btn-modern-primary" style={{ padding: "6px 12px", fontSize: 11 }} onClick={handleInjectMockSpares}>
                ✨ Inject Mock Spares
              </button>
            </div>
          ) : (
            <>
              <div className="drawer-list">
                {partsBin.map((part) => {
                  // Check if part is already mounted in ANY slot
                  const isMounted = Object.values(mounted).includes(part.id);
                  const isMatchForDrag = draggingType && SLOT_METADATA[Object.keys(SLOT_METADATA).find(k => SLOT_METADATA[k].compatTypes.includes(part.componentType)) || ""]?.compatTypes.includes(part.componentType);

                  return (
                    <div
                      key={part.id}
                      className={`drawer-item ${isMounted ? "mounted" : ""}`}
                      draggable={!isMounted}
                      onDragStart={(e) => handleDragStart(e, part.id, part.componentType)}
                      onDragEnd={handleDragEnd}
                      style={{
                        borderColor: isMatchForDrag ? "#3b82f6" : "#e2e8f0",
                        boxShadow: isMatchForDrag ? "0 0 6px rgba(59, 130, 246, 0.2)" : "none",
                      }}
                    >
                      <div>
                        <span style={{ fontSize: 9, fontWeight: 700, color: "#64748b", textTransform: "uppercase", display: "block" }}>
                          {SLOT_METADATA[Object.keys(SLOT_METADATA).find(k => SLOT_METADATA[k].compatTypes.includes(part.componentType)) || ""]?.label || part.componentType}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0f172a", display: "block", maxWidth: 180, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                          {part.brandModel}
                        </span>
                        <div style={{ display: "flex", gap: 6, marginTop: 4, alignItems: "center" }}>
                          <span style={{ fontSize: 9, color: "#475569", background: "#f1f5f9", padding: "1px 6px", borderRadius: 4, fontWeight: 600 }}>
                            {part.condition}
                          </span>
                          {part.compatSpeeds && (
                            <span style={{ fontSize: 9, color: "#0369a1", background: "#e0f2fe", padding: "1px 6px", borderRadius: 4, fontWeight: 700 }}>
                              {part.compatSpeeds}s
                            </span>
                          )}
                        </div>
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 800, color: "#0f172a" }}>
                        €{part.estimatedValueEur.toFixed(0)}
                      </span>
                    </div>
                  );
                })}
              </div>

              <button
                className="btn-modern-secondary"
                style={{ width: "100%", marginTop: 14, fontSize: 11, padding: "8px 12px" }}
                onClick={handleInjectMockSpares}
              >
                ➕ Inject More Mock Spares
              </button>
            </>
          )}
        </div>

        {/* Center: Visual Interactive Bike Frame Canvas */}
        <div className="canvas-card">
          <div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
              <div>
                <h3 style={{ fontSize: 15, fontWeight: 800, margin: 0 }}>
                  🧬 Compatibility Workspace
                </h3>
                <span style={{ fontSize: 11, color: "#64748b" }}>
                  Target: <strong>{selectedBike.name}</strong> ({selectedBike.type.toUpperCase()} frame archetype)
                </span>
              </div>
              
              <button
                className="btn-modern-secondary"
                style={{ padding: "6px 12px", fontSize: 11 }}
                onClick={() => setIsConfigOpen(!isConfigOpen)}
              >
                ⚙️ {isConfigOpen ? "Hide Frame Specs" : "Configure Specs"}
              </button>
            </div>

            {/* Expandable Specifications Configuration Drawer */}
            {isConfigOpen && (
              <div className="config-drawer">
                <p style={{ margin: "0 0 10px 0", fontSize: 10, fontWeight: 700, color: "#64748b", letterSpacing: "0.5px" }}>FRAME SPEC ARCHETYPE PRESETS</p>
                <div style={{ display: "flex", gap: 6, marginBottom: 14, flexWrap: "wrap" }}>
                  {(Object.keys(FRAME_PRESETS) as Array<keyof typeof FRAME_PRESETS>).map((type) => (
                    <button
                      key={type}
                      className="filter-pill"
                      style={{
                        padding: "4px 10px",
                        fontSize: 10,
                        background: selectedBike.type === type ? "#e2e8f0" : "#ffffff",
                        fontWeight: 700,
                      }}
                      onClick={() => handleApplyPreset(type)}
                    >
                      {type.toUpperCase()} Preset
                    </button>
                  ))}
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 10 }}>
                  <div className="modern-form-group" style={{ marginBottom: 8 }}>
                    <label className="modern-form-label" style={{ fontSize: 10 }}>BB Shell Standard</label>
                    <select
                      className="modern-form-input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      value={specs.bottomBracketShell}
                      onChange={(e) => updateFrameSpecs(selectedBike.id, { ...specs, bottomBracketShell: e.target.value as any })}
                    >
                      <option value="BSA">BSA Threaded</option>
                      <option value="BB30">BB30 PressFit</option>
                      <option value="BB86/92">BB86/BB92 PressFit</option>
                      <option value="T47">T47 Threaded</option>
                    </select>
                  </div>

                  <div className="modern-form-group" style={{ marginBottom: 8 }}>
                    <label className="modern-form-label" style={{ fontSize: 10 }}>Rear Hub Spacing</label>
                    <select
                      className="modern-form-input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      value={specs.rearAxle}
                      onChange={(e) => updateFrameSpecs(selectedBike.id, { ...specs, rearAxle: e.target.value as any })}
                    >
                      <option value="135mm QR">135mm QR</option>
                      <option value="12x142mm TA">12x142mm Thru-Axle</option>
                      <option value="12x148mm Boost">12x148mm Boost TA</option>
                    </select>
                  </div>

                  <div className="modern-form-group" style={{ marginBottom: 8 }}>
                    <label className="modern-form-label" style={{ fontSize: 10 }}>Brake Mount Type</label>
                    <select
                      className="modern-form-input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      value={specs.brakeMount}
                      onChange={(e) => updateFrameSpecs(selectedBike.id, { ...specs, brakeMount: e.target.value as any })}
                    >
                      <option value="Rim">Traditional Rim Brake</option>
                      <option value="Flat Mount">Flat Mount Disc</option>
                      <option value="Post Mount">Post Mount Disc</option>
                    </select>
                  </div>

                  <div className="modern-form-group" style={{ marginBottom: 8 }}>
                    <label className="modern-form-label" style={{ fontSize: 10 }}>Max Tire Clearance (mm)</label>
                    <input
                      type="number"
                      className="modern-form-input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      value={specs.maxTireClearance}
                      onChange={(e) => updateFrameSpecs(selectedBike.id, { ...specs, maxTireClearance: parseInt(e.target.value) || 28 })}
                    />
                  </div>

                  <div className="modern-form-group" style={{ marginBottom: 8 }}>
                    <label className="modern-form-label" style={{ fontSize: 10 }}>Wheel Size Standard</label>
                    <select
                      className="modern-form-input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      value={specs.wheelSize}
                      onChange={(e) => updateFrameSpecs(selectedBike.id, { ...specs, wheelSize: e.target.value as any })}
                    >
                      <option value="700c">700c</option>
                      <option value="650b">650b</option>
                      <option value="29 inch">29 inch</option>
                      <option value="27.5 inch">27.5 inch</option>
                      <option value="26 inch">26 inch</option>
                    </select>
                  </div>

                  <div className="modern-form-group" style={{ marginBottom: 8 }}>
                    <label className="modern-form-label" style={{ fontSize: 10 }}>Target Drivetrain Speeds</label>
                    <select
                      className="modern-form-input"
                      style={{ padding: "6px 10px", fontSize: 12 }}
                      value={specs.targetSpeeds}
                      onChange={(e) => updateFrameSpecs(selectedBike.id, { ...specs, targetSpeeds: parseInt(e.target.value) || 11 })}
                    >
                      <option value="8">8-Speed</option>
                      <option value="9">9-Speed</option>
                      <option value="10">10-Speed</option>
                      <option value="11">11-Speed</option>
                      <option value="12">12-Speed</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {/* Interactive Visual Canvas Map */}
            <div className="canvas-visual-wrapper">
              {/* SVG Framework Vector Lines illustrating a premium skeletal bike frame layout */}
              <svg className="bike-svg-lines" viewBox="0 0 500 300">
                {/* Wheels circles */}
                <circle cx="110" cy="190" r="70" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" />
                <circle cx="390" cy="190" r="70" fill="none" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="3,3" />
                
                {/* Rear axle to Front Axle */}
                <line x1="110" y1="190" x2="390" y2="190" stroke="#f1f5f9" strokeWidth="2" />

                {/* Main Frame Geometry */}
                {/* Rear Hub (110,190) -> Bottom Bracket (220,190) */}
                <line x1="110" y1="190" x2="220" y2="190" stroke="#64748b" strokeWidth="4" />
                {/* Rear Hub (110,190) -> Seatpost Clamp (180,95) */}
                <line x1="110" y1="190" x2="180" y2="95" stroke="#64748b" strokeWidth="3" />
                {/* Bottom Bracket (220,190) -> Seatpost Clamp (180,95) */}
                <line x1="220" y1="190" x2="180" y2="95" stroke="#64748b" strokeWidth="4" />
                {/* Bottom Bracket (220,190) -> Headtube (340,75) */}
                <line x1="220" y1="190" x2="340" y2="75" stroke="#64748b" strokeWidth="4" />
                {/* Seatpost Clamp (180,95) -> Headtube (340,75) */}
                <line x1="180" y1="95" x2="340" y2="75" stroke="#64748b" strokeWidth="4" />
                {/* Headtube (340,75) -> Front Hub (390,190) - Fork */}
                <line x1="340" y1="75" x2="390" y2="190" stroke="#475569" strokeWidth="3" />
                
                {/* Seatpost (180,95) -> Saddle (170,60) */}
                <line x1="180" y1="95" x2="170" y2="60" stroke="#94a3b8" strokeWidth="4" />
                {/* Cockpit Handlebars (340,75) -> Shifter (350,55) */}
                <line x1="340" y1="75" x2="350" y2="55" stroke="#94a3b8" strokeWidth="4" />
              </svg>

              {/* absolute hotspots on the bike skeleton map */}
              
              {/* SADDLE SLOT */}
              <div className="canvas-node" style={{ left: "168px", top: "54px" }}>
                <div
                  className={`node-hotspot ${mounted.saddle ? "mounted" : ""} ${
                    overSlot === "saddle" ? "glow-green" : ""
                  }`}
                  onDragOver={(e) => { if (isSlotCompatible("saddle", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("saddle", draggingType)) setOverSlot("saddle"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("saddle", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.saddle && handleUnmountPart("saddle")}
                  title={mounted.saddle ? "Click to unmount saddle" : "Drop saddle here"}
                >
                  {mounted.saddle ? "🏇" : "🏇"}
                </div>
                <span className="node-label">
                  {mounted.saddle ? partsBin.find(p => p.id === mounted.saddle)?.brandModel.split(" ")[0] : "Saddle"}
                </span>
              </div>

              {/* COCKPIT SHIFTER SLOT */}
              <div className="canvas-node" style={{ left: "355px", top: "48px" }}>
                <div
                  className={`node-hotspot ${mounted.shifter ? "mounted" : ""} ${
                    overSlot === "shifter" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Shifter") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("shifter", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("shifter", draggingType)) setOverSlot("shifter"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("shifter", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.shifter && handleUnmountPart("shifter")}
                  title={mounted.shifter ? "Click to unmount shifter" : "Drop shifter here"}
                >
                  {mounted.shifter ? "🕹️" : "🕹️"}
                </div>
                <span className="node-label">
                  {mounted.shifter ? partsBin.find(p => p.id === mounted.shifter)?.brandModel.split(" ")[0] : "Shifter"}
                </span>
              </div>

              {/* BOTTOM BRACKET SLOT */}
              <div className="canvas-node" style={{ left: "220px", top: "190px" }}>
                <div
                  className={`node-hotspot ${mounted.bottomBracket ? "mounted" : ""} ${
                    overSlot === "bottomBracket" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Bottom Bracket") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("bottomBracket", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("bottomBracket", draggingType)) setOverSlot("bottomBracket"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("bottomBracket", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.bottomBracket && handleUnmountPart("bottomBracket")}
                  title={mounted.bottomBracket ? "Click to unmount bottom bracket" : "Drop bottom bracket here"}
                >
                  {mounted.bottomBracket ? "🔄" : "🔄"}
                </div>
                <span className="node-label">
                  {mounted.bottomBracket ? partsBin.find(p => p.id === mounted.bottomBracket)?.brandModel.split(" ")[0] : "BB Shell"}
                </span>
              </div>

              {/* CHAIN SLOT */}
              <div className="canvas-node" style={{ left: "165px", top: "215px" }}>
                <div
                  className={`node-hotspot ${mounted.chain ? "mounted" : ""} ${
                    overSlot === "chain" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Chain") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("chain", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("chain", draggingType)) setOverSlot("chain"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("chain", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.chain && handleUnmountPart("chain")}
                  title={mounted.chain ? "Click to unmount chain" : "Drop chain here"}
                >
                  {mounted.chain ? "⛓️" : "⛓️"}
                </div>
                <span className="node-label">
                  {mounted.chain ? partsBin.find(p => p.id === mounted.chain)?.brandModel.split(" ")[0] : "Chain"}
                </span>
              </div>

              {/* CASSETTE SLOT */}
              <div className="canvas-node" style={{ left: "110px", top: "190px" }}>
                <div
                  className={`node-hotspot ${mounted.cassette ? "mounted" : ""} ${
                    overSlot === "cassette" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Cassette") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("cassette", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("cassette", draggingType)) setOverSlot("cassette"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("cassette", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.cassette && handleUnmountPart("cassette")}
                  title={mounted.cassette ? "Click to unmount cassette" : "Drop cassette here"}
                >
                  {mounted.cassette ? "⚙️" : "⚙️"}
                </div>
                <span className="node-label">
                  {mounted.cassette ? partsBin.find(p => p.id === mounted.cassette)?.brandModel.split(" ")[0] : "Cassette"}
                </span>
              </div>

              {/* ROTOR / DISC BRAKE SLOT */}
              <div className="canvas-node" style={{ left: "75px", top: "145px" }}>
                <div
                  className={`node-hotspot ${mounted.rotor ? "mounted" : ""} ${
                    overSlot === "rotor" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Brakes") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("rotor", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("rotor", draggingType)) setOverSlot("rotor"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("rotor", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.rotor && handleUnmountPart("rotor")}
                  title={mounted.rotor ? "Click to unmount rotor" : "Drop brake rotor here"}
                >
                  {mounted.rotor ? "💿" : "💿"}
                </div>
                <span className="node-label">
                  {mounted.rotor ? partsBin.find(p => p.id === mounted.rotor)?.brandModel.split(" ")[0] : "Rotor"}
                </span>
              </div>

              {/* WHEELSET SLOT */}
              <div className="canvas-node" style={{ left: "270px", top: "245px" }}>
                <div
                  className={`node-hotspot ${mounted.wheelset ? "mounted" : ""} ${
                    overSlot === "wheelset" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Wheelset") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("wheelset", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("wheelset", draggingType)) setOverSlot("wheelset"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("wheelset", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.wheelset && handleUnmountPart("wheelset")}
                  title={mounted.wheelset ? "Click to unmount wheelset" : "Drop wheelset here"}
                >
                  {mounted.wheelset ? "⭕" : "⭕"}
                </div>
                <span className="node-label">
                  {mounted.wheelset ? partsBin.find(p => p.id === mounted.wheelset)?.brandModel.split(" ")[0] : "Wheels"}
                </span>
              </div>

              {/* TIRE SLOT */}
              <div className="canvas-node" style={{ left: "390px", top: "190px" }}>
                <div
                  className={`node-hotspot ${mounted.tire ? "mounted" : ""} ${
                    overSlot === "tire" ? "glow-green" : ""
                  } ${issues.some(i => i.component === "Tires") ? "glow-red" : ""}`}
                  onDragOver={(e) => { if (isSlotCompatible("tire", draggingType)) e.preventDefault(); }}
                  onDragEnter={() => { if (isSlotCompatible("tire", draggingType)) setOverSlot("tire"); }}
                  onDragLeave={() => setOverSlot(null)}
                  onDrop={(e) => {
                    const id = e.dataTransfer.getData("partId");
                    handleMountPart("tire", id);
                    setOverSlot(null);
                  }}
                  onClick={() => mounted.tire && handleUnmountPart("tire")}
                  title={mounted.tire ? "Click to unmount tire" : "Drop tire here"}
                >
                  {mounted.tire ? "🚴" : "🚴"}
                </div>
                <span className="node-label">
                  {mounted.tire ? partsBin.find(p => p.id === mounted.tire)?.brandModel.split(" ")[0] : "Tire Size"}
                </span>
              </div>
            </div>
          </div>

          {/* Quick Metrics Bar at the bottom */}
          <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid #f1f5f9", paddingTop: 14, marginTop: 10, flexWrap: "wrap", gap: 10 }}>
            <div>
              <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>CORE PROGRESS</span>
              <span style={{ fontSize: 14, fontWeight: 800 }}>
                {mountedCount} of {coreSlots.length} parts mounted
              </span>
            </div>
            <div style={{ textAlign: "right" }}>
              <span style={{ fontSize: 10, color: "#64748b", textTransform: "uppercase", fontWeight: 700, display: "block" }}>EST. BUILD VALUE</span>
              <span style={{ fontSize: 15, fontWeight: 800, color: "#16a34a" }}>
                €{totalValue.toLocaleString("en-US", { minimumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* Right Side: Diagnostics & Marketplace Adapter Ledger */}
        <div className="modern-card">
          <h3 className="modern-card-title" style={{ border: "none", padding: 0, marginBottom: 12 }}>
            ⚙️ Diagnostic Ledger
          </h3>

          <div className="diagnostics-panel">
            {/* Build Completion Progress Bar */}
            <div style={{ background: "#f1f5f9", height: 6, borderRadius: 3, overflow: "hidden", marginBottom: 4 }}>
              <div
                style={{
                  height: "100%",
                  width: `${(mountedCount / coreSlots.length) * 100}%`,
                  background: issues.some(i => i.severity === "error") ? "#ef4444" : "#22c55e",
                  transition: "width 0.3s ease",
                }}
              />
            </div>

            {/* Checklist */}
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {checkList.map((item) => (
                <div key={item.id} className={`diag-checklist-item ${!item.ok ? "error" : ""}`}>
                  <span style={{ fontSize: 14 }}>
                    {item.ok ? (
                      <span className="diag-badge-ok">✔</span>
                    ) : (
                      <span className="diag-badge-error">✘</span>
                    )}
                  </span>
                  <div>
                    <h4 style={{ margin: 0, fontSize: 12, fontWeight: 700, color: item.ok ? "#0f172a" : "#991b1b" }}>
                      {item.title}
                    </h4>
                    <p style={{ margin: "2px 0 0 0", fontSize: 10, color: "#64748b" }}>
                      {item.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* Conflict Logs */}
            <div style={{ borderTop: "1px solid #f1f5f9", paddingTop: 12, marginTop: 4 }}>
              <h4 style={{ margin: "0 0 8px 0", fontSize: 11, fontWeight: 800, color: "#475569", textTransform: "uppercase", letterSpacing: "0.5px" }}>
                Active Mechanical Issues ({issues.length})
              </h4>

              {issues.length === 0 ? (
                <div style={{ background: "#f0fdf4", border: "1px solid #bbf7d0", color: "#166534", borderRadius: 8, padding: 10, fontSize: 11 }}>
                  🎉 <strong>Build Aligned!</strong> No physical standard conflicts or speeds mismatch discovered in this setup.
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {issues.map((issue) => (
                    <div
                      key={issue.id}
                      style={{
                        background: issue.severity === "error" ? "#fef2f2" : "#fffbeb",
                        border: `1px solid ${issue.severity === "error" ? "#fca5a5" : "#fde047"}`,
                        borderRadius: 8,
                        padding: 10,
                        fontSize: 11,
                        color: issue.severity === "error" ? "#991b1b" : "#854d0e",
                      }}
                    >
                      <strong style={{ textTransform: "uppercase", fontSize: 9, display: "block", marginBottom: 2 }}>
                        {issue.severity === "error" ? "🛑 Error" : "⚠️ Warning"} - {issue.component}
                      </strong>
                      <p style={{ margin: 0, lineHeight: 1.4 }}>
                        {issue.message}
                      </p>

                      {issue.alternativeQuery && (
                        <a
                          href={`https://www.ebay.com/sch/i.html?_nkw=${encodeURIComponent(issue.alternativeQuery)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="btn-modern-primary"
                          style={{
                            display: "inline-flex",
                            marginTop: 8,
                            padding: "4px 8px",
                            fontSize: 10,
                            borderRadius: 4,
                            background: "#0f172a",
                            color: "#ffffff",
                            textDecoration: "none",
                            fontWeight: 600,
                          }}
                        >
                          🔍 Find {issue.alternativeQuery} on eBay
                        </a>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
