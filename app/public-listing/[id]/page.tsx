"use client";

import React, { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import type { ComingSoonListing } from "@/lib/pre-sold";
import type { BuyerReservation } from "@/lib/pre-sold";

const amountFormat = (value: number) => `€${value.toFixed(0)}`;

export default function PublicListingPage({ params }: { params: { id: string } }) {
  const { id } = params;
  const [listing, setListing] = useState<ComingSoonListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [selectedUpgrades, setSelectedUpgrades] = useState<string[]>([]);
  const [buyerName, setBuyerName] = useState("");
  const [buyerEmail, setBuyerEmail] = useState("");
  const [buyerPhone, setBuyerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch("/api/pre-sold?action=listings")
      .then((response) => response.json())
      .then((data) => {
        const found = Array.isArray(data.listings)
          ? data.listings.find((item: ComingSoonListing) => item.bikeId === id)
          : null;
        setListing(found || null);
      })
      .catch(() => setListing(null))
      .finally(() => setLoading(false));
  }, [id]);

  const selectedOptions = useMemo(() => {
    if (!listing) return [];
    return listing.upgrades.filter((upgrade) => selectedUpgrades.includes(upgrade.id));
  }, [listing, selectedUpgrades]);

  const totalPrice = useMemo(() => {
    if (!listing) return 0;
    return listing.targetBasePrice + selectedOptions.reduce((sum, upgrade) => sum + upgrade.buyerPrice, 0);
  }, [listing, selectedOptions]);

  const handleToggleUpgrade = (upgradeId: string) => {
    setSelectedUpgrades((prev) =>
      prev.includes(upgradeId) ? prev.filter((item) => item !== upgradeId) : [...prev, upgradeId]
    );
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!listing) return;
    if (!buyerName || !buyerEmail || !buyerPhone) {
      setStatusMessage("Please complete all required fields before submitting.");
      return;
    }
    setSubmitting(true);
    setStatusMessage(null);

    const reservation: BuyerReservation = {
      id: "",
      bikeId: listing.bikeId,
      buyerName,
      buyerEmail,
      buyerPhone,
      selectedUpgradeIds: selectedUpgrades,
      totalPrice: amountFormat(totalPrice),
      status: "pending_deposit",
      createdAt: new Date().toISOString(),
      notes,
    };

    try {
      const response = await fetch("/api/pre-sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reserve", reservation }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Reservation failed.");
      }
      setStatusMessage("Reservation submitted! Please follow the deposit instructions below.");
      setBuyerName("");
      setBuyerEmail("");
      setBuyerPhone("");
      setNotes("");
      setSelectedUpgrades([]);
    } catch (error: any) {
      setStatusMessage(error?.message || "Unable to submit reservation.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 24px", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 840, margin: "0 auto", textAlign: "center" }}>
          <h1 style={{ fontSize: 32, marginBottom: 12 }}>Loading reservation page…</h1>
          <p style={{ color: "#64748b" }}>One moment while we prepare your custom bike booking portal.</p>
        </div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 24px", fontFamily: "Inter, system-ui, sans-serif" }}>
        <div style={{ maxWidth: 760, margin: "0 auto", background: "#ffffff", borderRadius: 24, padding: 32, boxShadow: "0 24px 60px rgba(15,23,42,0.08)" }}>
          <h1 style={{ fontSize: 28, marginBottom: 12, color: "#0f172a" }}>Build not found</h1>
          <p style={{ color: "#64748b", marginBottom: 24 }}>This bike listing is not yet published or the reservation link is invalid.</p>
          <Link href="/tracker" style={{ color: "#0f172a", fontWeight: 700 }}>Return to your tracker dashboard</Link>
        </div>
      </div>
    );
  }

  return (
    <div style={{ minHeight: "100vh", background: "#f8fafc", padding: "40px 24px", fontFamily: "Inter, system-ui, sans-serif" }}>
      <div style={{ maxWidth: 1120, margin: "0 auto" }}>
        <section style={{ marginBottom: 32 }}>
          <Link href="/tracker" style={{ color: "#0f172a", textDecoration: "underline", fontSize: 13 }}>← Back to flipper workspace</Link>
          <div style={{ marginTop: 24, display: "flex", flexDirection: "column", gap: 16 }}>
            <span style={{ fontSize: 13, color: "#10b981", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>Coming Soon</span>
            <h1 style={{ fontSize: 44, margin: 0, lineHeight: 1.05, color: "#0f172a" }}>{listing.name}</h1>
            <p style={{ fontSize: 17, maxWidth: 760, color: "#475569" }}>{listing.description}</p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 12, alignItems: "center" }}>
              <span style={{ background: "#e2e8f0", color: "#0f172a", borderRadius: 9999, padding: "8px 14px", fontSize: 13 }}>Estimated finish: {listing.estimatedCompletionDate}</span>
              <span style={{ background: "#d1fae5", color: "#166534", borderRadius: 9999, padding: "8px 14px", fontSize: 13 }}>Reserve today</span>
            </div>
          </div>
        </section>

        <main style={{ display: "grid", gap: 24, gridTemplateColumns: "1.15fr 0.85fr" }}>
          <section style={{ background: "#ffffff", borderRadius: 24, padding: 28, boxShadow: "0 24px 60px rgba(15,23,42,0.08)" }}>
            <h2 style={{ fontSize: 20, marginBottom: 18, color: "#0f172a" }}>Build custom upgrade bundles</h2>
            <div style={{ marginBottom: 24, padding: 20, background: "#f8fafc", borderRadius: 18 }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div>
                  <p style={{ margin: 0, color: "#64748b" }}>Total price</p>
                  <p style={{ margin: "6px 0 0", fontSize: 34, fontWeight: 800, color: "#0f172a" }}>{amountFormat(totalPrice)}</p>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p style={{ margin: 0, color: "#64748b" }}>Base price</p>
                  <p style={{ fontWeight: 700, margin: "6px 0 0" }}>{amountFormat(listing.targetBasePrice)}</p>
                </div>
              </div>
            </div>

            <div style={{ marginBottom: 28 }}>
              <p style={{ fontWeight: 700, marginBottom: 14, color: "#0f172a" }}>Available upgrades</p>
              <div style={{ display: "grid", gap: 14 }}>
                {listing.upgrades.map((upgrade) => {
                  const selected = selectedUpgrades.includes(upgrade.id);
                  return (
                    <button
                      key={upgrade.id}
                      type="button"
                      onClick={() => handleToggleUpgrade(upgrade.id)}
                      style={{
                        borderRadius: 18,
                        border: selected ? "2px solid #10b981" : "1px solid #e2e8f0",
                        background: selected ? "#ecfdf5" : "#ffffff",
                        padding: "18px 20px",
                        textAlign: "left",
                        cursor: "pointer",
                        display: "grid",
                        gap: 4,
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>{upgrade.name}</span>
                        <span style={{ fontWeight: 700, color: "#0f172a" }}>+{amountFormat(upgrade.buyerPrice)}</span>
                      </div>
                      <p style={{ margin: 0, color: "#64748b", fontSize: 13 }}>{upgrade.category}</p>
                      <small style={{ color: "#94a3b8" }}>Flipper cost €{upgrade.flipperCost}</small>
                    </button>
                  );
                })}
              </div>
            </div>

            <form onSubmit={handleSubmit} style={{ display: "grid", gap: 16 }}>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ color: "#475569", fontWeight: 700, fontSize: 12 }}>Your Name</label>
                <input
                  className="form-field"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "1px solid #cbd5e1" }}
                  value={buyerName}
                  onChange={(event) => setBuyerName(event.target.value)}
                  placeholder="Jane Doe"
                />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ color: "#475569", fontWeight: 700, fontSize: 12 }}>Email</label>
                <input
                  className="form-field"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "1px solid #cbd5e1" }}
                  value={buyerEmail}
                  onChange={(event) => setBuyerEmail(event.target.value)}
                  placeholder="john@example.com"
                />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ color: "#475569", fontWeight: 700, fontSize: 12 }}>Phone</label>
                <input
                  className="form-field"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "1px solid #cbd5e1" }}
                  value={buyerPhone}
                  onChange={(event) => setBuyerPhone(event.target.value)}
                  placeholder="+49 170 123 4567"
                />
              </div>
              <div style={{ display: "grid", gap: 10 }}>
                <label style={{ color: "#475569", fontWeight: 700, fontSize: 12 }}>Special instructions</label>
                <textarea
                  className="form-field"
                  style={{ width: "100%", padding: "14px 16px", borderRadius: 16, border: "1px solid #cbd5e1", minHeight: 120 }}
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Let the flipper know your preferred riding style, color preferences, or build notes."
                />
              </div>
              <button
                type="submit"
                disabled={submitting}
                style={{ background: "#0f172a", color: "#ffffff", borderRadius: 16, border: "none", padding: "16px 20px", fontWeight: 700, cursor: "pointer" }}
              >
                {submitting ? "Submitting reservation…" : "Reserve bike & request build upgrades"}
              </button>
              {statusMessage && <p style={{ color: "#475569", margin: 0 }}>{statusMessage}</p>}
            </form>
          </section>

          <aside style={{ display: "grid", gap: 20 }}>
            <div style={{ background: "#ffffff", borderRadius: 24, padding: 24, boxShadow: "0 14px 42px rgba(15,23,42,0.08)" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>Deposit Slate</h3>
              <p style={{ color: "#64748b", marginTop: 10 }}>Once your reservation is received, the flipper will confirm availability and share bank or cash payment instructions.</p>
              <div style={{ marginTop: 18, padding: 18, background: "#f8fafc", borderRadius: 18 }}>
                <p style={{ margin: "0 0 10px", color: "#0f172a", fontWeight: 700 }}>Suggested deposit:</p>
                <p style={{ margin: 0, fontSize: 22, fontWeight: 800, color: "#0f172a" }}>€{(totalPrice * 0.25).toFixed(0)}</p>
                <p style={{ margin: "10px 0 0", color: "#475569", fontSize: 13 }}>Bank transfer details will be provided after reservation confirmation.</p>
              </div>
            </div>

            <div style={{ background: "#ffffff", borderRadius: 24, padding: 24, boxShadow: "0 14px 42px rgba(15,23,42,0.08)" }}>
              <h3 style={{ margin: 0, fontSize: 18, color: "#0f172a" }}>How it works</h3>
              <ol style={{ margin: "16px 0 0", paddingLeft: 18, color: "#475569", gap: 10, display: "grid" }}>
                <li>Choose the upgrades you want.</li>
                <li>Submit your reservation request.</li>
                <li>The seller confirms the build and deposit details.</li>
                <li>Collect your custom ride when the build is complete.</li>
              </ol>
            </div>
          </aside>
        </main>
      </div>
    </div>
  );
}
