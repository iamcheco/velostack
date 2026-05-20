"use client";

import React, { useState, useEffect } from "react";
import { PartOutCalculation, PartOutItem } from "@/lib/pricing";

interface PartOutDetailsProps {
  partOutCalc: PartOutCalculation;
  askingPrice: number;
  wholeBikeProfit: number;
  estimatedResalePrice: number;
}

export default function PartOutDetails({
  partOutCalc,
  askingPrice,
  wholeBikeProfit,
  estimatedResalePrice,
}: PartOutDetailsProps) {
  // 1. Core Interactive States
  const [laborHours, setLaborHours] = useState<number>(partOutCalc.laborHours);
  const [laborRate, setLaborRate] = useState<number>(20);
  const [customPrices, setCustomPrices] = useState<Record<string, number>>({});

  // Sync labor hours if the calculation changes
  useEffect(() => {
    setLaborHours(partOutCalc.laborHours);
    setCustomPrices({});
  }, [partOutCalc]);

  // 2. Map items incorporating override values
  const items = partOutCalc.items.map((item) => ({
    ...item,
    estimatedPriceEur:
      customPrices[item.id] !== undefined
        ? customPrices[item.id]
        : item.estimatedPriceEur,
  }));

  // 3. Dynamic Interactive Calculations
  const grossValue = items.reduce((sum, item) => sum + item.estimatedPriceEur, 0);
  const netDisassemblyValue = Math.round(grossValue * 0.85); // 15% platform & packaging deduction
  const laborCost = Math.round(laborHours * laborRate);
  const netProfit = netDisassemblyValue - askingPrice - laborCost;
  const profitDifference = Math.round(Math.abs(netProfit - wholeBikeProfit));
  const isPartOutPreferred = netProfit > wholeBikeProfit;

  // Handle unit price change override
  const handlePriceChange = (id: string, val: string) => {
    const numeric = parseFloat(val);
    if (!isNaN(numeric) && numeric >= 0) {
      setCustomPrices((prev) => ({ ...prev, [id]: numeric }));
    } else if (val === "") {
      setCustomPrices((prev) => ({ ...prev, [id]: 0 }));
    }
  };

  // Helper for complexity color badges
  const getComplexityBadge = (complexity: PartOutItem["packagingComplexity"]) => {
    switch (complexity) {
      case "high":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-orange-50 text-orange-600 border border-orange-100">
            High Box
          </span>
        );
      case "medium":
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-sky-50 text-sky-600 border border-sky-100">
            Medium
          </span>
        );
      case "low":
        default:
        return (
          <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-600 border border-emerald-100">
            Low
          </span>
        );
    }
  };

  // Helper for type badges
  const getTypeBadge = (type: string) => {
    const t = type.toLowerCase();
    let bg = "bg-slate-50 text-slate-600 border-slate-100";
    if (t === "frame") bg = "bg-violet-50 text-violet-600 border-violet-100 font-bold";
    else if (t === "fork" || t === "suspension") bg = "bg-amber-50 text-amber-600 border-amber-100";
    else if (t === "drivetrain") bg = "bg-indigo-50 text-indigo-600 border-indigo-100";
    else if (t === "wheels" || t === "wheelset") bg = "bg-rose-50 text-rose-600 border-rose-100";
    else if (t === "brakes") bg = "bg-teal-50 text-teal-600 border-teal-100";
    else if (t === "saddle") bg = "bg-emerald-50 text-emerald-600 border-emerald-100";

    return (
      <span className={`inline-flex items-center px-2.5 py-1 rounded border text-xs font-semibold uppercase tracking-wider ${bg}`}>
        {type}
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* ========================================== */}
      {/* 1. Header KPI Dashboard Grid (4 Cards)     */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Gross Parts Sum */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Gross Parts Value
          </p>
          <p className="text-2xl font-bold text-slate-800 mt-1">
            €{grossValue.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 text-xs text-slate-400">Sum of itemized components</div>
        </div>

        {/* Platform Fees & Boxes */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Marketplace Fees & boxes
          </p>
          <p className="text-2xl font-bold text-rose-600 mt-1">
            -€{(grossValue * 0.15).toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 text-xs font-semibold text-rose-500 bg-rose-50 border border-rose-100 rounded px-2 py-0.5 inline-block">
            15% standard overhead
          </div>
        </div>

        {/* Labor cost */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Disassembly Labor Cost
          </p>
          <p className="text-2xl font-bold text-slate-600 mt-1">
            -€{laborCost.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2 text-xs text-slate-500">
            {laborHours} hrs @ €{laborRate}/hr
          </div>
        </div>

        {/* Net Part-Out Profit */}
        <div className={`rounded-xl border p-5 shadow-sm transition-all duration-300 ${
          isPartOutPreferred 
            ? "bg-emerald-50/30 border-emerald-200 shadow-emerald-50/50" 
            : "bg-white border-slate-200"
        }`}>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">
            Net Part-Out Profit
          </p>
          <p className={`text-2xl font-bold mt-1 ${isPartOutPreferred ? "text-emerald-600" : "text-slate-800"}`}>
            €{netProfit.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </p>
          <div className="mt-2">
            {isPartOutPreferred ? (
              <span className="text-xs font-bold text-emerald-500 bg-emerald-50 border border-emerald-100 rounded px-2 py-0.5 inline-block animate-pulse">
                🔥 Highly Profitable
              </span>
            ) : (
              <span className="text-xs font-semibold text-slate-500 bg-slate-50 border border-slate-100 rounded px-2 py-0.5 inline-block">
                Standard Teardown
              </span>
            )}
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 2. Glow Recommendation Alert Banner      */}
      {/* ========================================== */}
      <div className={`p-5 rounded-2xl border transition-all duration-300 ${
        isPartOutPreferred 
          ? "bg-emerald-50/70 border-emerald-200 text-emerald-950 shadow-sm"
          : "bg-indigo-50/70 border-indigo-200 text-indigo-950 shadow-sm"
      }`}>
        <div className="flex items-start gap-4">
          <div className={`p-3 rounded-xl mt-0.5 ${isPartOutPreferred ? "bg-emerald-100 text-emerald-600" : "bg-indigo-100 text-indigo-600"}`}>
            {isPartOutPreferred ? (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            ) : (
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </div>
          <div className="flex-1 space-y-1">
            <h3 className="text-base font-bold">
              {isPartOutPreferred ? "Dismantle Recommended" : "Sell Whole Bicycle Recommended"}
            </h3>
            <p className="text-sm opacity-90 leading-relaxed font-medium">
              {isPartOutPreferred ? (
                <>
                  Strip down this bike! Dismantling it and selling the parts separately on eBay/classifieds will yield{" "}
                  <strong className="text-emerald-700 font-extrabold text-base">€{profitDifference.toLocaleString("en-US")} more net profit</strong>{" "}
                  than restoring it and selling it complete (€{netProfit.toLocaleString("en-US")} vs. €{wholeBikeProfit.toLocaleString("en-US")}).
                </>
              ) : (
                <>
                  Keep this bike complete! Restoring it and selling it whole will yield{" "}
                  <strong className="text-indigo-700 font-extrabold text-base">€{profitDifference.toLocaleString("en-US")} more net profit</strong>{" "}
                  than parting it out (€{wholeBikeProfit.toLocaleString("en-US")} vs. €{netProfit.toLocaleString("en-US")}). Dismantling it will result in unnecessary labor and packing fees.
                </>
              )}
            </p>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 3. Interactive Parameter Control Sliders  */}
      {/* ========================================== */}
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-5">
        <h4 className="text-sm font-bold text-slate-700 mb-4 uppercase tracking-wider flex items-center gap-2">
          <span>⚙️</span> Interactive Teardown Parameters
        </h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Disassembly Labor Time */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Disassembly & Listing Labor</span>
              <span className="text-indigo-600 font-extrabold">{laborHours} hours</span>
            </div>
            <input
              type="range"
              min="1.0"
              max="8.0"
              step="0.5"
              value={laborHours}
              onChange={(e) => setLaborHours(parseFloat(e.target.value))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>1 hr (Express)</span>
              <span>4.5 hrs (Default)</span>
              <span>8 hrs (Complex build)</span>
            </div>
          </div>

          {/* Hourly Labor Rate */}
          <div className="space-y-2">
            <div className="flex justify-between items-center text-sm font-bold text-slate-600">
              <span>Hourly Labor Rate</span>
              <span className="text-indigo-600 font-extrabold">€{laborRate}/hr</span>
            </div>
            <input
              type="range"
              min="10"
              max="60"
              step="5"
              value={laborRate}
              onChange={(e) => setLaborRate(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-indigo-600 focus:outline-none"
            />
            <div className="flex justify-between text-xs text-slate-400 font-medium">
              <span>€10/hr (DIY)</span>
              <span>€20/hr (Garage shop)</span>
              <span>€60/hr (Pro mechanic)</span>
            </div>
          </div>
        </div>
      </div>

      {/* ========================================== */}
      {/* 4. Split Layout: Tables & Feasibility   */}
      {/* ========================================== */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Component Teardown Table (2/3 Span) */}
        <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden lg:col-span-2">
          <div className="p-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
            <div>
              <h4 className="text-sm font-bold text-slate-700">Extracted Components Sub-Ledger</h4>
              <p className="text-xs text-slate-400 font-medium mt-0.5">Customize individual pricing estimates on-the-fly</p>
            </div>
            <button
              onClick={() => setCustomPrices({})}
              className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 transition-colors"
            >
              Reset Prices
            </button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-xs font-bold text-slate-400 uppercase tracking-wider">
                  <th className="py-3.5 px-5">Part Class</th>
                  <th className="py-3.5 px-4">Component name / Spec</th>
                  <th className="py-3.5 px-4 text-center">Packaging</th>
                  <th className="py-3.5 px-5 text-right">Unit Value (€)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm font-medium text-slate-700">
                {items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="py-4 px-5 align-middle">
                      {getTypeBadge(item.type)}
                    </td>
                    <td className="py-4 px-4 align-middle">
                      <div className="font-semibold text-slate-800 leading-snug">{item.name}</div>
                      <div className="text-xs text-slate-400 leading-normal font-medium mt-0.5">
                        Tools: {item.toolsNeeded.join(", ")}
                      </div>
                    </td>
                    <td className="py-4 px-4 align-middle text-center">
                      {getComplexityBadge(item.packagingComplexity)}
                    </td>
                    <td className="py-4 px-5 align-middle text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <span className="text-slate-400 text-sm">€</span>
                        <input
                          type="number"
                          value={item.estimatedPriceEur === 0 ? "" : item.estimatedPriceEur}
                          onChange={(e) => handlePriceChange(item.id, e.target.value)}
                          placeholder="0"
                          className="w-20 px-2 py-1 text-right bg-white border border-slate-200 rounded font-bold text-slate-800 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 shadow-sm"
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Column: Feasibility Gauge & Tool Checklist (1/3 Span) */}
        <div className="space-y-6 lg:col-span-1">
          {/* Feasibility Gauge */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-3">Teardown Feasibility</h4>
            <div className="flex flex-col items-center justify-center py-6 space-y-4">
              {/* Circular Score Gauge */}
              <div className="relative w-36 h-36 flex items-center justify-center">
                {/* SVG Circle Track */}
                <svg className="w-full h-full transform -rotate-90">
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className="stroke-slate-100"
                    strokeWidth="10"
                    fill="transparent"
                  />
                  <circle
                    cx="72"
                    cy="72"
                    r="60"
                    className={`transition-all duration-1000 ${
                      partOutCalc.feasibilityScore >= 85
                        ? "stroke-emerald-500"
                        : partOutCalc.feasibilityScore >= 60
                        ? "stroke-indigo-500"
                        : "stroke-orange-500"
                    }`}
                    strokeWidth="10"
                    fill="transparent"
                    strokeDasharray={377.0} // 2 * pi * r
                    strokeDashoffset={377.0 - (377.0 * partOutCalc.feasibilityScore) / 100}
                    strokeLinecap="round"
                  />
                </svg>
                {/* Score Number Panel */}
                <div className="absolute text-center">
                  <span className="text-3xl font-extrabold text-slate-800">{partOutCalc.feasibilityScore}%</span>
                  <p className={`text-xs font-extrabold mt-0.5 tracking-wider uppercase ${
                    partOutCalc.feasibilityScore >= 85
                      ? "text-emerald-500"
                      : partOutCalc.feasibilityScore >= 60
                      ? "text-indigo-500"
                      : "text-orange-500"
                  }`}>
                    {partOutCalc.feasibilityRating} Teardown
                  </p>
                </div>
              </div>

              <p className="text-xs text-slate-400 font-medium text-center leading-relaxed px-2">
                Scores represent teardown complexity. Electric motors, linkage pivots, or hydraulic fluid bleeding decrease the score due to technical difficulty.
              </p>
            </div>
          </div>

          {/* Specialized Tools Checklist */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm">
            <h4 className="text-sm font-bold text-slate-700 border-b border-slate-100 pb-3 flex items-center gap-1.5">
              <span>🛠️</span> Required Workshop Tools
            </h4>
            <div className="py-3 space-y-2.5">
              {partOutCalc.requiredTools.map((tool, idx) => (
                <div key={idx} className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-5 h-5 rounded-md border border-indigo-200 bg-indigo-50/50 text-indigo-500">
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span className="text-sm font-semibold text-slate-700">{tool}</span>
                </div>
              ))}
            </div>
            <div className="mt-3 pt-3 border-t border-slate-100 text-[11px] text-slate-400 font-medium leading-normal">
              Ensure you possess these tools in your workshop before attempting disassembly to avoid rounded bolt heads or stripped components.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
