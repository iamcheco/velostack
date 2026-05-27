"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useTracker } from "@/app/tracker/context";
import type { Bike } from "@/lib/tracker-types";
import type { ComingSoonListing, BuyerReservation, UpgradeOption } from "@/lib/pre-sold";

interface PublishComingSoonModalProps {
  isOpen: boolean;
  onClose: () => void;
  bike: Bike;
}

const defaultUpgrades: UpgradeOption[] = [
  {
    id: "tan-wall-tires",
    name: "Tan-wall Gravel Tires",
    category: "Tires",
    buyerPrice: 40,
    flipperCost: 20,
  },
  {
    id: "cork-bar-tape",
    name: "Cork Bar Tape",
    category: "Cockpit",
    buyerPrice: 15,
    flipperCost: 7,
  },
  {
    id: "ergonomic-gel-saddle",
    name: "Ergonomic Gel Saddle",
    category: "Saddle",
    buyerPrice: 30,
    flipperCost: 12,
  },
];

function formatCurrency(value: number) {
  return `€${value.toFixed(0)}`;
}

function buildInitialListing(bike: Bike): ComingSoonListing {
  return {
    bikeId: bike.id,
    name: bike.name,
    type: bike.type,
    description: `${bike.name} is being built for a local rider. Reserve this custom flip before it hits the market.`,
    targetBasePrice: 650,
    estimatedCompletionDate: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString().split("T")[0],
    upgrades: defaultUpgrades,
    publishedAt: new Date().toISOString(),
  };
}

export default function PublishComingSoonModal({ isOpen, onClose, bike }: PublishComingSoonModalProps) {
  const { addTransaction } = useTracker();
  const [listing, setListing] = useState<ComingSoonListing>(() => buildInitialListing(bike));
  const [reservations, setReservations] = useState<BuyerReservation[]>([]);
  const [notification, setNotification] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [shareUrl, setShareUrl] = useState("");
  const [newUpgradeName, setNewUpgradeName] = useState("");
  const [newUpgradeCategory, setNewUpgradeCategory] = useState("");
  const [newUpgradeBuyerPrice, setNewUpgradeBuyerPrice] = useState(0);
  const [newUpgradeFlipperCost, setNewUpgradeFlipperCost] = useState(0);

  const listingTotalValue = useMemo(() => {
    const upgradesValue = listing.upgrades.reduce((sum, upgrade) => sum + upgrade.buyerPrice, 0);
    return listing.targetBasePrice + upgradesValue;
  }, [listing]);

  useEffect(() => {
    if (!isOpen) return;

    setListing((prev) => ({ ...prev, ...buildInitialListing(bike) }));
    setNotification(null);
    fetchListing();
    fetchReservations();
    setShareUrl(`${window.location.origin}/public-listing/${bike.id}`);
  }, [isOpen, bike]);

  async function fetchListing() {
    try {
      const response = await fetch("/api/pre-sold?action=listings");
      const data = await response.json();
      const existing = Array.isArray(data.listings) ? data.listings.find((item: ComingSoonListing) => item.bikeId === bike.id) : null;
      if (existing) {
        setListing(existing);
      }
    } catch {
      // ignore
    }
  }

  async function fetchReservations() {
    try {
      const response = await fetch(`/api/pre-sold?action=reservations&bikeId=${encodeURIComponent(bike.id)}`);
      const data = await response.json();
      if (Array.isArray(data.reservations)) {
        setReservations(data.reservations);
      }
    } catch {
      // ignore
    }
  }

  async function handlePublish() {
    setIsSaving(true);
    setNotification(null);
    try {
      const response = await fetch("/api/pre-sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "publish", listing }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || "Publish failed");
      }
      setListing(data.listing);
      setNotification("Published successfully. Share the public preview link with buyers.");
      fetchReservations();
    } catch (error: any) {
      setNotification(error?.message || "Unable to publish listing.");
    } finally {
      setIsSaving(false);
    }
  }

  async function handleConfirmDeposit(reservation: BuyerReservation) {
    try {
      const response = await fetch("/api/pre-sold", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "update-status", id: reservation.id, status: "deposit_confirmed" }),
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data?.error?.message || "Unable to confirm deposit.");
      }
      setReservations((prev) => prev.map((item) => (item.id === reservation.id ? data.reservation : item)));
      addTransaction({
        bikeId: bike.id,
        title: `Deposit confirmed: ${reservation.buyerName} — ${bike.name}`,
        purchasePrice: 0,
        partsExpense: [],
        miscExpense: [],
        laborHours: 0,
        hourlyRate: 0,
        askingPrice: parseFloat(reservation.totalPrice.replace(/[^0-9.-]/g, "")) || 0,
        finalSalePrice: parseFloat(reservation.totalPrice.replace(/[^0-9.-]/g, "")) || 0,
        status: "sold",
      });
      setNotification(`Deposit confirmed for ${reservation.buyerName}. Transaction added to ledger.`);
    } catch (error: any) {
      setNotification(error?.message || "Unable to confirm deposit.");
    }
  }

  function addCustomUpgrade() {
    if (!newUpgradeName || !newUpgradeCategory || newUpgradeBuyerPrice <= 0) {
      setNotification("Enter a valid custom upgrade name, category, and buyer price.");
      return;
    }
    const newUpgrade: UpgradeOption = {
      id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: newUpgradeName,
      category: newUpgradeCategory,
      buyerPrice: newUpgradeBuyerPrice,
      flipperCost: newUpgradeFlipperCost,
    };
    setListing((prev) => ({ ...prev, upgrades: [...prev.upgrades, newUpgrade] }));
    setNewUpgradeName("");
    setNewUpgradeCategory("");
    setNewUpgradeBuyerPrice(0);
    setNewUpgradeFlipperCost(0);
    setNotification("Custom upgrade added.");
  }

  function updateUpgrade(index: number, key: keyof UpgradeOption, value: string | number) {
    setListing((prev) => {
      const next = [...prev.upgrades];
      next[index] = { ...next[index], [key]: value } as UpgradeOption;
      return { ...prev, upgrades: next };
    });
  }

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <style jsx>{`
        .modal-backdrop {
          position: fixed;
          inset: 0;
          background: rgba(15, 23, 42, 0.35);
          backdrop-filter: blur(4px);
          display: flex;
          justify-content: center;
          align-items: center;
          padding: 16px;
          z-index: 2000;
        }
        .modal-shell {
          width: min(1200px, 100%);
          max-height: 90vh;
          overflow: auto;
          background: #ffffff;
          border-radius: 24px;
          border: 1px solid #e2e8f0;
          box-shadow: 0 24px 60px rgba(15, 23, 42, 0.14);
          position: relative;
        }
        .modal-panel {
          display: grid;
          grid-template-columns: 1.5fr 1fr;
          gap: 24px;
          padding: 24px;
        }
        .modal-header {
          display: flex;
          align-items: flex-start;
          justify-content: space-between;
          gap: 16px;
          padding: 24px;
          border-bottom: 1px solid #e2e8f0;
        }
        .modal-title {
          margin: 0;
          font-size: 20px;
          font-weight: 800;
          color: #0f172a;
        }
        .close-button {
          border: none;
          background: transparent;
          color: #475569;
          cursor: pointer;
          font-size: 18px;
          padding: 8px;
          border-radius: 12px;
        }
        .close-button:hover { background: #f8fafc; }
        .section-card {
          background: #f8fafc;
          border-radius: 20px;
          padding: 20px;
          border: 1px solid #e2e8f0;
        }
        .section-title { font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.08em; margin-bottom: 10px; color: #334155; }
        .form-label { display: block; font-size: 12px; margin-bottom: 6px; color: #475569; }
        .form-input, .form-textarea { width: 100%; padding: 12px 14px; border: 1px solid #cbd5e1; border-radius: 12px; background: #ffffff; font-size: 13px; color: #0f172a; }
        .form-textarea { min-height: 96px; resize: vertical; }
        .btn-primary { background: #0f172a; color: #ffffff; border: none; border-radius: 12px; padding: 12px 18px; cursor: pointer; font-weight: 700; }
        .btn-primary:disabled { background: #94a3b8; cursor: not-allowed; }
        .btn-secondary { background: #ffffff; color: #0f172a; border: 1px solid #cbd5e1; border-radius: 12px; padding: 12px 18px; cursor: pointer; }
        .listing-value { font-size: 28px; font-weight: 800; color: #0f172a; margin: 0; }
        .badge { display: inline-flex; align-items: center; gap: 8px; border-radius: 999px; padding: 6px 12px; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.06em; }
        .badge-fresh { background: #d1fae5; color: #166534; }
        .badge-pending { background: #fef3c7; color: #92400e; }
        .badge-confirmed { background: #dbeafe; color: #1e40af; }
        .upgrade-row { display: grid; grid-template-columns: 1fr 1fr 120px 120px 160px; gap: 12px; align-items: center; margin-bottom: 12px; }
        .upgrade-row input { width: 100%; }
        .reserve-card { background: #ffffff; border: 1px solid #e2e8f0; border-radius: 20px; padding: 18px; }
        .reservation-row { display: grid; grid-template-columns: 1fr 120px 160px; gap: 12px; align-items: center; padding: 12px 0; border-bottom: 1px solid #e2e8f0; }
        .reservation-row:last-child { border-bottom: none; }
      `}</style>
      <div className="modal-shell" onClick={(event) => event.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Publish Coming Soon Listing</h2>
            <p style={{ color: "#475569", margin: "8px 0 0" }}>
              Configure the reservation page, track booking interest, and confirm deposits directly from your Flipper dashboard.
            </p>
          </div>
          <button className="close-button" onClick={onClose} aria-label="Close modal">
            ✕
          </button>
        </div>
        <div className="modal-panel">
          <div>
            <div className="section-card" style={{ marginBottom: 24 }}>
              <div className="section-title">Listing Basics</div>
              <label className="form-label">Bike Name</label>
              <input
                className="form-input"
                value={listing.name}
                onChange={(event) => setListing((prev) => ({ ...prev, name: event.target.value }))}
              />
              <label className="form-label">Short Description</label>
              <textarea
                className="form-textarea"
                value={listing.description}
                onChange={(event) => setListing((prev) => ({ ...prev, description: event.target.value }))}
              />
              <label className="form-label">Base Price</label>
              <input
                type="number"
                className="form-input"
                value={listing.targetBasePrice}
                onChange={(event) => setListing((prev) => ({ ...prev, targetBasePrice: Number(event.target.value) }))}
              />
              <label className="form-label">Estimated Completion Date</label>
              <input
                type="date"
                className="form-input"
                value={listing.estimatedCompletionDate}
                onChange={(event) => setListing((prev) => ({ ...prev, estimatedCompletionDate: event.target.value }))}
              />
              <label className="form-label">Public URL</label>
              <div style={{ display: "flex", gap: 8, alignItems: "center" }}>
                <input className="form-input" value={shareUrl} readOnly />
                <button
                  className="btn-secondary"
                  type="button"
                  onClick={() => {
                    navigator.clipboard.writeText(shareUrl);
                    setNotification("Public URL copied to clipboard.");
                  }}
                >
                  Copy
                </button>
              </div>
              <button
                type="button"
                className="btn-primary"
                disabled={isSaving}
                onClick={handlePublish}
                style={{ marginTop: 18 }}
              >
                {isSaving ? "Publishing..." : "Publish & Refresh"}
              </button>
              {notification && (
                <p style={{ marginTop: 14, color: "#0f172a" }}>{notification}</p>
              )}
            </div>

            <div className="section-card">
              <div className="section-title">Upgrade Definition Editor</div>
              {listing.upgrades.map((upgrade, index) => (
                <div key={upgrade.id} className="upgrade-row">
                  <input
                    value={upgrade.name}
                    onChange={(event) => updateUpgrade(index, "name", event.target.value)}
                    placeholder="Upgrade name"
                  />
                  <input
                    value={upgrade.category}
                    onChange={(event) => updateUpgrade(index, "category", event.target.value)}
                    placeholder="Category"
                  />
                  <input
                    type="number"
                    value={upgrade.buyerPrice}
                    onChange={(event) => updateUpgrade(index, "buyerPrice", Number(event.target.value))}
                    placeholder="Buyer €"
                  />
                  <input
                    type="number"
                    value={upgrade.flipperCost}
                    onChange={(event) => updateUpgrade(index, "flipperCost", Number(event.target.value))}
                    placeholder="Cost €"
                  />
                  <span style={{ fontSize: 12, color: "#475569" }}>{formatCurrency(upgrade.buyerPrice)}</span>
                </div>
              ))}

              <div className="upgrade-row" style={{ marginTop: 16, gap: 10 }}>
                <input
                  value={newUpgradeName}
                  onChange={(event) => setNewUpgradeName(event.target.value)}
                  placeholder="Custom upgrade name"
                />
                <input
                  value={newUpgradeCategory}
                  onChange={(event) => setNewUpgradeCategory(event.target.value)}
                  placeholder="Category"
                />
                <input
                  type="number"
                  value={newUpgradeBuyerPrice}
                  onChange={(event) => setNewUpgradeBuyerPrice(Number(event.target.value))}
                  placeholder="Buyer €"
                />
                <input
                  type="number"
                  value={newUpgradeFlipperCost}
                  onChange={(event) => setNewUpgradeFlipperCost(Number(event.target.value))}
                  placeholder="Cost €"
                />
                <button type="button" className="btn-secondary" onClick={addCustomUpgrade}>
                  Add
                </button>
              </div>
            </div>
          </div>

          <div>
            <div className="section-card" style={{ marginBottom: 24 }}>
              <div className="section-title">Public Listing Snapshot</div>
              <p style={{ margin: "0 0 12px", color: "#475569" }}>
                Buyers will see this page and choose upgrades before they reserve the build.
              </p>
              <div style={{ marginBottom: 16 }}>
                <span className="badge badge-fresh">Published</span>
                <span style={{ marginLeft: 10, color: "#64748b" }}>Published at {new Date(listing.publishedAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: "grid", gap: "10px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#475569" }}>Base price</span>
                  <strong>{formatCurrency(listing.targetBasePrice)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ color: "#475569" }}>Total upgrades value</span>
                  <strong>{formatCurrency(listing.upgrades.reduce((sum, upgrade) => sum + upgrade.buyerPrice, 0))}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 8 }}>
                  <span style={{ fontWeight: 700 }}>Projected buyer total</span>
                  <span className="listing-value">{formatCurrency(listingTotalValue)}</span>
                </div>
              </div>
            </div>

            <div className="reserve-card">
              <div className="section-title">Booking Sub-Ledger</div>
              {reservations.length === 0 ? (
                <p style={{ color: "#64748b", margin: 0 }}>No reservations yet. Refresh after a buyer books the ride.</p>
              ) : (
                reservations.map((reservation) => (
                  <div key={reservation.id} className="reservation-row">
                    <div>
                      <div style={{ fontWeight: 700 }}>{reservation.buyerName}</div>
                      <div style={{ fontSize: 12, color: "#64748b" }}>{reservation.buyerEmail} · {reservation.buyerPhone}</div>
                      <div style={{ fontSize: 12, color: "#475569" }}>{reservation.notes || "No notes"}</div>
                    </div>
                    <div>
                      <span className={`badge ${reservation.status === "pending_deposit" ? "badge-pending" : "badge-confirmed"}`}>
                        {reservation.status.replace("_", " ")}
                      </span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: 8, alignItems: "flex-end" }}>
                      <div style={{ fontWeight: 700 }}>{reservation.totalPrice}</div>
                      {reservation.status === "pending_deposit" && (
                        <button className="btn-secondary" type="button" onClick={() => handleConfirmDeposit(reservation)}>
                          Confirm Deposit
                        </button>
                      )}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
