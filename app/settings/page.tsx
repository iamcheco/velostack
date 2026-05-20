"use client";

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import type { SniperSettings, SnipedDealAlert } from '@/lib/deal-sniper';

export default function SettingsPage() {
  const [settings, setSettings] = useState<SniperSettings>({
    zipCode: '80331',
    radiusKm: 15,
    minProfitEur: 100,
    minDealScore: 75,
    maxBudgetEur: 500,
    targetBrands: ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Canyon'],
    alertPhoneNumber: '+15555555555',
    isSniperEnabled: true
  });
  const [alerts, setAlerts] = useState<SnipedDealAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [simulating, setSimulating] = useState(false);
  const [simPreset, setSimPreset] = useState('giant_defy');
  const [simLogs, setSimLogs] = useState<string[]>([]);
  const [brandInput, setBrandInput] = useState('');
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);

  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll logs
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [simLogs]);

  // Load initial settings and alert history
  useEffect(() => {
    fetchData();
  }, []);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchData = async () => {
    try {
      const res = await fetch('/api/deal-sniper/alerts');
      if (res.ok) {
        const data = await res.json();
        if (data.settings) setSettings(data.settings);
        if (data.alerts) setAlerts(data.alerts);
      }
    } catch (err) {
      showToast('Failed to load settings or alert logs', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleSaveSettings = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSaving(true);
    try {
      const res = await fetch('/api/deal-sniper/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'save-settings',
          settings
        })
      });
      if (res.ok) {
        showToast('Sniper settings updated successfully!', 'success');
      } else {
        throw new Error();
      }
    } catch (err) {
      showToast('Failed to save settings configurations', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleClearCache = async () => {
    if (!confirm('Are you sure you want to reset the duplicate scanner cache? The sniper will re-appraise previously scanned ads.')) return;
    try {
      const res = await fetch('/api/deal-sniper/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-cache' })
      });
      if (res.ok) {
        showToast('Duplicate scanner cache cleared.', 'info');
      }
    } catch (err) {
      showToast('Failed to reset cache', 'error');
    }
  };

  const handleClearAlerts = async () => {
    if (!confirm('Are you sure you want to clear your Sniped Alerts history logs?')) return;
    try {
      const res = await fetch('/api/deal-sniper/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear-alerts' })
      });
      if (res.ok) {
        setAlerts([]);
        showToast('Flipping alert logs successfully reset.', 'info');
      }
    } catch (err) {
      showToast('Failed to wipe alert history', 'error');
    }
  };

  const handleTriggerSniperSim = async () => {
    setSimulating(true);
    setSimLogs([`[Client] Packaging payload. Dispatching trigger to /api/deal-sniper...`]);

    let bodyPayload: any = { secret: 'TEST_SECRET' };

    if (simPreset === 'giant_defy') {
      bodyPayload = {
        ...bodyPayload,
        title: 'Giant Defy Advanced Disc road bike',
        description: 'Selling my Giant Defy Advanced carbon road bike. Size M/L. Shimano Tiagra groupset, hydraulic disc brakes. Rides really well, frame is perfect. Only issue is that the bottom bracket is squeaking a bit and needs cleaning or replacement, and it needs fresh bar tape. Selling cheap because I bought an e-bike. Price is €80.',
        price: 80,
        link: 'https://classifieds.local/items/giant-defy-advanced-80',
        location: settings.zipCode
      };
    } else if (simPreset === 'trek_emonda') {
      bodyPayload = {
        ...bodyPayload,
        title: '2021 Trek Emonda ALR Disc road bike',
        description: 'Trek Emonda ALR Disc frame, carbon fork, 11-speed Shimano 105 drivetrain. Kept inside, shifts and brakes fine. Rear tyre is completely flat and chain is heavily rusted, needs a full replace and minor shifting tune. Frame is in beautiful shape. Located nearby, asking €120 only for fast pickup.',
        price: 120,
        link: 'https://classifieds.local/items/trek-emonda-120',
        location: settings.zipCode
      };
    } else if (simPreset === 'overpriced_carbon') {
      bodyPayload = {
        ...bodyPayload,
        title: 'Canyon Ultimate CF Carbon Road Bike',
        description: 'Full carbon, carbon wheels. Selling my race rig, absolute perfect mint condition. Price is solid. No test rides without cash in hand. Asking €1400.',
        price: 1400,
        link: 'https://classifieds.local/items/canyon-ultimate-1400',
        location: settings.zipCode
      };
    } else if (simPreset === 'vintage_commuter') {
      bodyPayload = {
        ...bodyPayload,
        title: 'Vintage Peugeot City Bike 3-Speed',
        description: 'Old French bike. Front brake is loose, rusty fenders, needs new tubes. Rides otherwise. €45.',
        price: 45,
        link: 'https://classifieds.local/items/vintage-peugeot-45',
        location: settings.zipCode
      };
    } else {
      // Simulate general search run
      bodyPayload = {
        ...bodyPayload,
        simulate: true
      };
    }

    try {
      const res = await fetch('/api/deal-sniper?secret=TEST_SECRET', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bodyPayload)
      });

      const data = await res.json();
      if (data.logs) {
        setSimLogs(data.logs);
      } else {
        setSimLogs(prev => [...prev, `[ERROR] No logs returned from endpoint.`, JSON.stringify(data)]);
      }

      if (res.ok) {
        showToast('Deal sniper scan completed successfully!', 'success');
        // Reload alerts
        fetchData();
      } else {
        showToast(data.error || 'Scanner simulation failed', 'error');
      }
    } catch (err) {
      setSimLogs(prev => [...prev, `[CRITICAL ERROR] Failed to reach API route: Connect error.`]);
      showToast('Network error during simulation run', 'error');
    } finally {
      setSimulating(false);
    }
  };

  const handleAddBrand = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && brandInput.trim()) {
      e.preventDefault();
      const val = brandInput.trim();
      if (!settings.targetBrands.includes(val)) {
        setSettings(prev => ({
          ...prev,
          targetBrands: [...prev.targetBrands, val]
        }));
      }
      setBrandInput('');
    }
  };

  const handleRemoveBrand = (brand: string) => {
    setSettings(prev => ({
      ...prev,
      targetBrands: prev.targetBrands.filter(b => b !== brand)
    }));
  };

  const handleImportToTracker = (alert: SnipedDealAlert) => {
    try {
      const storageKey = 'vst';
      const rawStore = localStorage.getItem(storageKey);
      let store: any = {
        bikes: [],
        rides: [],
        parts: {},
        replacements: [],
        explanations: {},
        partsBin: [],
        bikeFrameSpecs: {},
        mountedParts: {}
      };

      if (rawStore) {
        try { store = JSON.parse(rawStore); } catch {}
      }

      // 1. Create unique bike ID
      const bikeId = `bike_${Date.now()}`;
      const brand = alert.details?.bikeTier?.brand || 'Trek';
      const model = alert.title.replace(new RegExp(brand, 'i'), '').replace(/\b(?:road|bike|disc)\b/gi, '').trim();

      const newBike = {
        id: bikeId,
        brand: brand,
        model: model || 'Spec Specifier',
        type: alert.details?.bikeTier?.type || 'road',
        purchasePrice: alert.price,
        purchaseDate: new Date().toISOString().split('T')[0],
        notes: `Imported from AI Deal Sniper! Sourcing URL: ${alert.link}. Appraisal: Profit target €${alert.estimatedProfit}, deal score ${alert.dealScore}/100.`
      };

      store.bikes = [newBike, ...(store.bikes || [])];
      localStorage.setItem(storageKey, JSON.stringify(store));

      // 2. Add to Ledger transaction
      const rawLedger = localStorage.getItem('vst_ledger');
      let transactions: any[] = [];
      if (rawLedger) {
        try { transactions = JSON.parse(rawLedger); } catch {}
      }

      const newTx = {
        id: `tx_${Date.now()}`,
        bikeId: bikeId,
        title: `${brand} ${model}`,
        purchasePrice: alert.price,
        repairExpenses: alert.details?.estimatedRepairCost || 0,
        targetResalePrice: alert.estimatedResalePrice,
        stage: 'repair',
        dateAcquired: newBike.purchaseDate,
        estimatedHours: 4,
        notes: `Imported from AI Deal Sniper`
      };

      transactions = [newTx, ...transactions];
      localStorage.setItem('vst_ledger', JSON.stringify(transactions));

      showToast(`Successfully imported ${brand} to Garage & Flip Ledger!`, 'success');
    } catch (err) {
      showToast('Failed to import to garage tracker', 'error');
    }
  };

  const handleOpenInAppraiser = (alert: SnipedDealAlert) => {
    try {
      const formPayload = {
        title: alert.title,
        description: alert.details?.verdictReason || alert.title,
        askingPrice: String(alert.price),
        location: alert.location,
        marketProfile: alert.details?.marketProfile || 'standard'
      };
      sessionStorage.setItem('vst_analyzer_form', JSON.stringify(formPayload));
      window.location.href = '/analyzer';
    } catch (err) {
      showToast('Failed to load appraisal details', 'error');
    }
  };

  return (
    <main className="settings-page-root">
      <style jsx global>{`
        @import url("https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap");

        .settings-page-root {
          font-family: "Plus Jakarta Sans", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
          background-color: #f8fafc;
          color: #0f172a;
          min-height: 100vh;
          margin: 0;
          padding: 0;
        }

        /* Sticky header matching overall aesthetics */
        .settings-nav {
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
        .settings-logo {
          font-weight: 800;
          font-size: 20px;
          color: #0f172a;
          text-decoration: none;
          display: flex;
          align-items: center;
          gap: 6px;
        }
        .settings-nav-links {
          display: flex;
          gap: 4px;
        }
        .settings-nav-link {
          padding: 6px 12px;
          border-radius: 6px;
          font-size: 13px;
          font-weight: 600;
          color: #64748b;
          text-decoration: none;
          transition: all 0.2s ease;
        }
        .settings-nav-link:hover {
          color: #0f172a;
          background: #f1f5f9;
        }
        .settings-nav-link.active {
          color: #0f172a;
          background: #f1f5f9;
          font-weight: 700;
        }

        .settings-container {
          max-width: 1280px;
          margin: 0 auto;
          padding: 24px;
        }

        .settings-grid {
          display: grid;
          grid-template-columns: 380px 1fr;
          gap: 24px;
        }
        @media (max-width: 1024px) {
          .settings-grid {
            grid-template-columns: 1fr;
          }
        }

        /* White minimalist cards */
        .settings-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 20px;
          box-shadow: 0 1px 3px rgba(0,0,0,0.02);
          margin-bottom: 24px;
        }
        .settings-card h3 {
          margin: 0 0 16px 0;
          font-size: 16px;
          font-weight: 700;
          color: #0f172a;
          display: flex;
          justify-content: space-between;
          align-items: center;
        }

        .form-group {
          margin-bottom: 16px;
        }
        .form-label {
          display: block;
          font-size: 12px;
          font-weight: 700;
          text-transform: uppercase;
          letter-spacing: 0.05em;
          color: #64748b;
          margin-bottom: 6px;
        }
        .form-control {
          width: 100%;
          padding: 10px 12px;
          border: 1px solid #e2e8f0;
          border-radius: 8px;
          font-size: 14px;
          font-family: inherit;
          color: #0f172a;
          background: #ffffff;
          transition: all 0.15s ease;
        }
        .form-control:focus {
          outline: none;
          border-color: #94a3b8;
          box-shadow: 0 0 0 3px rgba(148, 163, 184, 0.1);
        }

        /* Toggle switches */
        .toggle-switch-container {
          display: flex;
          align-items: center;
          justify-content: space-between;
          padding: 12px;
          background: #f8fafc;
          border-radius: 8px;
          border: 1px solid #e2e8f0;
          margin-bottom: 20px;
        }
        .toggle-switch-info h4 {
          margin: 0;
          font-size: 14px;
          font-weight: 600;
        }
        .toggle-switch-info p {
          margin: 2px 0 0 0;
          font-size: 12px;
          color: #64748b;
        }
        .toggle-btn {
          width: 48px;
          height: 26px;
          border-radius: 999px;
          background: #cbd5e1;
          border: none;
          position: relative;
          cursor: pointer;
          transition: background 0.2s ease;
        }
        .toggle-btn.enabled {
          background: #10b981;
        }
        .toggle-circle {
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #ffffff;
          position: absolute;
          top: 3px;
          left: 3px;
          transition: transform 0.2s ease;
          box-shadow: 0 1px 3px rgba(0,0,0,0.1);
        }
        .toggle-btn.enabled .toggle-circle {
          transform: translateX(22px);
        }

        /* Tags system for Brands */
        .brands-tag-wrapper {
          display: flex;
          flex-wrap: wrap;
          gap: 6px;
          margin-top: 8px;
        }
        .brand-tag {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          background: #f1f5f9;
          border: 1px solid #e2e8f0;
          color: #334155;
          padding: 4px 8px;
          border-radius: 6px;
          font-size: 12px;
          font-weight: 600;
        }
        .brand-tag-remove {
          border: none;
          background: none;
          color: #94a3b8;
          cursor: pointer;
          padding: 0;
          font-size: 10px;
          font-weight: 800;
        }
        .brand-tag-remove:hover {
          color: #ef4444;
        }

        /* Live console terminal styling */
        .terminal-console {
          background: #0f172a;
          color: #38bdf8;
          font-family: 'Courier New', Courier, monospace;
          padding: 16px;
          border-radius: 8px;
          height: 220px;
          overflow-y: auto;
          font-size: 12px;
          line-height: 1.5;
          border: 1px solid #1e293b;
          box-shadow: inset 0 2px 8px rgba(0,0,0,0.5);
        }
        .terminal-log-line {
          margin-bottom: 4px;
          white-space: pre-wrap;
        }

        /* Buttons matching VeloStack premium white specs */
        .btn {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 10px 16px;
          font-size: 13px;
          font-weight: 700;
          border-radius: 8px;
          cursor: pointer;
          transition: all 0.2s ease;
          border: 1px solid transparent;
          font-family: inherit;
        }
        .btn.primary {
          background: #0f172a;
          color: #ffffff;
        }
        .btn.primary:hover {
          background: #1e293b;
        }
        .btn.secondary {
          background: #ffffff;
          border-color: #e2e8f0;
          color: #475569;
        }
        .btn.secondary:hover {
          background: #f8fafc;
          border-color: #cbd5e1;
        }
        .btn.danger-link {
          background: none;
          border: none;
          color: #ef4444;
          font-size: 12px;
          font-weight: 600;
          cursor: pointer;
          padding: 0;
          text-decoration: underline;
        }

        /* Alerts feed cards list layout */
        .alerts-list {
          display: flex;
          flex-direction: column;
          gap: 16px;
        }
        .alert-card {
          background: #ffffff;
          border: 1px solid #e2e8f0;
          border-radius: 12px;
          padding: 16px;
          display: grid;
          grid-template-columns: 1fr 180px;
          gap: 16px;
          box-shadow: 0 1px 2px rgba(0,0,0,0.01);
          transition: all 0.15s ease;
        }
        .alert-card:hover {
          box-shadow: 0 4px 12px rgba(0,0,0,0.03);
          border-color: #cbd5e1;
        }
        @media (max-width: 640px) {
          .alert-card {
            grid-template-columns: 1fr;
          }
        }
        .alert-card-info h4 {
          margin: 0 0 6px 0;
          font-size: 15px;
          font-weight: 800;
          color: #0f172a;
        }
        .alert-meta {
          display: flex;
          flex-wrap: wrap;
          gap: 12px;
          font-size: 12px;
          color: #64748b;
          margin-bottom: 12px;
        }
        .alert-tag {
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 700;
          font-size: 11px;
        }
        .alert-tag.profit {
          background: #ecfdf5;
          color: #059669;
        }
        .alert-tag.verdict-great {
          background: #10b981;
          color: #ffffff;
        }
        .alert-tag.verdict-fair {
          background: #f59e0b;
          color: #ffffff;
        }
        .alert-actions {
          display: flex;
          gap: 8px;
        }
        .alert-right-panel {
          border-left: 1px solid #e2e8f0;
          padding-left: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
        }
        @media (max-width: 640px) {
          .alert-right-panel {
            border-left: none;
            padding-left: 0;
            border-top: 1px solid #e2e8f0;
            padding-top: 12px;
          }
        }
        
        .score-display {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: 8px;
        }
        .score-circle {
          width: 50px;
          height: 50px;
          border-radius: 50%;
          border: 4px solid #10b981;
          display: flex;
          justify-content: center;
          align-items: center;
          font-weight: 800;
          font-size: 15px;
          color: #0f172a;
        }
        .score-label {
          font-size: 10px;
          font-weight: 700;
          text-transform: uppercase;
          color: #64748b;
          margin-top: 4px;
        }
        .sms-badge {
          display: inline-flex;
          align-items: center;
          gap: 4px;
          font-size: 11px;
          font-weight: 600;
          color: #059669;
        }
        .sms-badge.failed {
          color: #64748b;
        }

        /* Toast notification */
        .toast-popup {
          position: fixed;
          bottom: 24px;
          right: 24px;
          background: #0f172a;
          color: #ffffff;
          padding: 12px 20px;
          border-radius: 8px;
          box-shadow: 0 4px 12px rgba(0,0,0,0.15);
          font-size: 13px;
          font-weight: 600;
          z-index: 1000;
          display: flex;
          align-items: center;
          gap: 8px;
          animation: slideInUp 0.2s ease-out;
        }
        .toast-popup.error {
          border-left: 4px solid #ef4444;
        }
        .toast-popup.info {
          border-left: 4px solid #3b82f6;
        }
        .toast-popup.success {
          border-left: 4px solid #10b981;
        }

        @keyframes slideInUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
      `}</style>

      {/* Navigation Header */}
      <header className="settings-nav">
        <Link href="/all" className="settings-logo">
          ⚡ VeloStack
        </Link>
        <div className="settings-nav-links">
          <Link href="/analyzer" className="settings-nav-link">Appraiser</Link>
          <Link href="/tracker" className="settings-nav-link">Wear Tracker</Link>
          <Link href="/extractor" className="settings-nav-link">Skill Extractor</Link>
          <Link href="/mechanic" className="settings-nav-link">AI Pocket Mechanic</Link>
          <Link href="/ledger" className="settings-nav-link">Flip Ledger</Link>
          <Link href="/settings" className="settings-nav-link active">Sniper Settings</Link>
        </div>
      </header>

      {/* Main Grid Container */}
      <div className="settings-container">
        <h2 style={{ fontSize: '24px', fontWeight: 800, color: '#0f172a', marginBottom: '4px' }}>
          AI Deal Sniper Sourcing Dashboard
        </h2>
        <p style={{ color: '#64748b', fontSize: '14px', margin: '0 0 24px 0' }}>
          Configure background classified ad monitors, run automated simulations, and manage sniped deal alerts.
        </p>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '40px', background: '#ffffff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
            <p style={{ fontWeight: 600, color: '#64748b' }}>Hydrating sniper configurations...</p>
          </div>
        ) : (
          <div className="settings-grid">
            
            {/* Left side: Configuration Forms */}
            <div className="settings-sidebar-col">
              <form onSubmit={handleSaveSettings}>
                <div className="settings-card">
                  <h3>
                    <span>Monitor Controls</span>
                    <span style={{ fontSize: '11px', fontWeight: 500, color: settings.isSniperEnabled ? '#10b981' : '#64748b' }}>
                      {settings.isSniperEnabled ? 'Active Scanning' : 'Paused'}
                    </span>
                  </h3>

                  <div className="toggle-switch-container">
                    <div className="toggle-switch-info">
                      <h4>AI Background Sniper</h4>
                      <p>Scan local classifieds 24/7</p>
                    </div>
                    <button
                      type="button"
                      className={`toggle-btn ${settings.isSniperEnabled ? 'enabled' : ''}`}
                      onClick={() => setSettings(prev => ({ ...prev, isSniperEnabled: !prev.isSniperEnabled }))}
                    >
                      <div className="toggle-circle"></div>
                    </button>
                  </div>

                  <div className="form-group">
                    <label className="form-label">Sourcing Zip Code</label>
                    <input
                      type="text"
                      className="form-control"
                      value={settings.zipCode}
                      onChange={e => setSettings(prev => ({ ...prev, zipCode: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Search Radius (km)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.radiusKm}
                      onChange={e => setSettings(prev => ({ ...prev, radiusKm: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Profit Target (€)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.minProfitEur}
                      onChange={e => setSettings(prev => ({ ...prev, minProfitEur: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Min Deal Score (70-100)</label>
                    <input
                      type="number"
                      className="form-control"
                      min="1"
                      max="100"
                      value={settings.minDealScore}
                      onChange={e => setSettings(prev => ({ ...prev, minDealScore: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Max Budget Limit (€)</label>
                    <input
                      type="number"
                      className="form-control"
                      value={settings.maxBudgetEur}
                      onChange={e => setSettings(prev => ({ ...prev, maxBudgetEur: parseInt(e.target.value) || 0 }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">SMS Alert Phone Number</label>
                    <input
                      type="tel"
                      className="form-control"
                      placeholder="+15555555555"
                      value={settings.alertPhoneNumber}
                      onChange={e => setSettings(prev => ({ ...prev, alertPhoneNumber: e.target.value }))}
                      required
                    />
                  </div>

                  <div className="form-group">
                    <label className="form-label">Brand Keyword Filters</label>
                    <input
                      type="text"
                      className="form-control"
                      placeholder="Add brand and press Enter"
                      value={brandInput}
                      onChange={e => setBrandInput(e.target.value)}
                      onKeyDown={handleAddBrand}
                    />
                    <div className="brands-tag-wrapper">
                      {settings.targetBrands.map(b => (
                        <span key={b} className="brand-tag">
                          {b}
                          <button
                            type="button"
                            className="brand-tag-remove"
                            onClick={() => handleRemoveBrand(b)}
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>

                  <div style={{ marginTop: '20px', display: 'flex', gap: '8px' }}>
                    <button type="submit" className="btn primary" style={{ flex: 1 }} disabled={saving}>
                      {saving ? 'Saving...' : 'Apply Settings'}
                    </button>
                  </div>
                </div>
              </form>

              {/* Maintenance Tools */}
              <div className="settings-card" style={{ padding: '16px 20px' }}>
                <h3>Diagnostic Tools</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#475569' }}>Duplicate Cache Register</span>
                    <button type="button" className="btn-danger-link" onClick={handleClearCache}>
                      Reset Cache
                    </button>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontSize: '13px', color: '#475569' }}>Flipping Alert Ledger</span>
                    <button type="button" className="btn-danger-link" onClick={handleClearAlerts}>
                      Wipe History
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side: Testing Simulator & Alerts Feed */}
            <div className="settings-main-col">
              
              {/* Test Simulator */}
              <div className="settings-card">
                <h3>
                  <span>⚡ Deal Sniper Crawler Simulator</span>
                  <span style={{ fontSize: '11px', fontWeight: 500, color: '#0ea5e9', background: '#e0f2fe', padding: '2px 8px', borderRadius: '4px' }}>
                    Offline Testing Box
                  </span>
                </h3>
                <p style={{ color: '#475569', fontSize: '13px', margin: '-8px 0 16px 0' }}>
                  Inject custom classified mock ads to test the scraping validation engine, AI appraiser rules, and SMS callbacks in real time.
                </p>

                <div style={{ display: 'flex', gap: '12px', marginBottom: '16px' }}>
                  <div style={{ flex: 1 }}>
                    <select
                      className="form-control"
                      value={simPreset}
                      onChange={e => setSimPreset(e.target.value)}
                      disabled={simulating}
                    >
                      <option value="giant_defy">Giant Defy carbon disc (€80 asking, €350 resale - GREAT FLIP)</option>
                      <option value="trek_emonda">2021 Trek Emonda ALR (€120 asking, €450 resale - GREAT FLIP)</option>
                      <option value="overpriced_carbon">Canyon Ultimate CF (€1400 asking, €1100 resale - OVERPRICED PASS)</option>
                      <option value="vintage_commuter">Vintage Peugeot 3-speed (€45 asking, €30 resale - LOW MARGIN PASS)</option>
                      <option value="simulate_run">Generate Dynamic Brand Sourcing Crawl (4 items)</option>
                    </select>
                  </div>
                  <button
                    type="button"
                    className="btn primary"
                    onClick={handleTriggerSniperSim}
                    disabled={simulating}
                  >
                    {simulating ? 'Scanning Feed...' : 'Trigger Sourcing Polling'}
                  </button>
                </div>

                {/* Console Log */}
                {(simulating || simLogs.length > 0) && (
                  <div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                      <span style={{ fontSize: '11px', fontWeight: 700, color: '#64748b', textTransform: 'uppercase' }}>Scanner Output Log</span>
                      <button 
                        type="button" 
                        style={{ border: 'none', background: 'none', color: '#94a3b8', fontSize: '11px', cursor: 'pointer' }}
                        onClick={() => setSimLogs([])}
                      >
                        Clear Terminal
                      </button>
                    </div>
                    <div className="terminal-console">
                      {simLogs.map((l, i) => (
                        <div key={i} className="terminal-log-line">
                          {l}
                        </div>
                      ))}
                      <div ref={logsEndRef} />
                    </div>
                  </div>
                )}
              </div>

              {/* Alerts Feed */}
              <div className="settings-card">
                <h3>Sniped Deals Alert History ({alerts.length})</h3>
                
                {alerts.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '32px', border: '2px dashed #e2e8f0', borderRadius: '12px' }}>
                    <p style={{ margin: '0', fontSize: '14px', color: '#64748b', fontWeight: 500 }}>
                      No sniped deals recorded yet. Try running the simulation scanner above to trigger matching deals!
                    </p>
                  </div>
                ) : (
                  <div className="alerts-list">
                    {alerts.map(alert => (
                      <div key={alert.id} className="alert-card">
                        
                        <div className="alert-card-info">
                          <h4>{alert.title}</h4>
                          
                          <div className="alert-meta">
                            <span>📍 Zip: {alert.location}</span>
                            <span>🚗 {alert.distanceKm} km away</span>
                            <span>📅 {new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                            <span className={`alert-tag verdict-${alert.verdict.toLowerCase().replace(' ', '-')}`}>
                              {alert.verdict}
                            </span>
                            <span className="alert-tag profit">
                              €{alert.estimatedProfit} Profit
                            </span>
                          </div>

                          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '14px', background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                            <div style={{ fontSize: '12px' }}>
                              <div style={{ color: '#64748b', fontWeight: 600 }}>LISTED PRICE</div>
                              <div style={{ fontWeight: 800, color: '#ef4444', fontSize: '15px' }}>€{alert.price}</div>
                            </div>
                            <div style={{ fontSize: '12px' }}>
                              <div style={{ color: '#64748b', fontWeight: 600 }}>EST. MARKET VALUE</div>
                              <div style={{ fontWeight: 800, color: '#10b981', fontSize: '15px' }}>€{alert.estimatedResalePrice}</div>
                            </div>
                          </div>

                          <p style={{ fontSize: '12px', color: '#475569', margin: '0 0 14px 0', fontStyle: 'italic', borderLeft: '2px solid #cbd5e1', paddingLeft: '8px' }}>
                            "{alert.verdictReason}"
                          </p>

                          <div className="alert-actions">
                            <button 
                              type="button" 
                              className="btn primary"
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}
                              onClick={() => handleImportToTracker(alert)}
                            >
                              📥 Import to Tracker
                            </button>
                            <button 
                              type="button" 
                              className="btn secondary"
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px' }}
                              onClick={() => handleOpenInAppraiser(alert)}
                            >
                              📊 Open in Appraiser
                            </button>
                            <a 
                              href={alert.link} 
                              target="_blank" 
                              rel="noreferrer" 
                              className="btn secondary"
                              style={{ padding: '6px 12px', borderRadius: '6px', fontSize: '12px', textDecoration: 'none' }}
                            >
                              🔗 Original Link
                            </a>
                          </div>
                        </div>

                        <div className="alert-right-panel">
                          <div className="score-display">
                            <div className="score-circle">
                              {alert.dealScore}
                            </div>
                            <div className="score-label">Deal Score</div>
                          </div>
                          
                          <div className={`sms-badge ${alert.smsSent ? 'sent' : 'failed'}`}>
                            {alert.smsSent ? (
                              <>
                                <span>✔ SMS Sent</span>
                              </>
                            ) : (
                              <>
                                <span>🔲 Log Alerts Only</span>
                              </>
                            )}
                          </div>
                          {alert.smsLog && (
                            <span style={{ fontSize: '9px', color: '#94a3b8', textAlign: 'center', marginTop: '4px', maxWidth: '140px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={alert.smsLog}>
                              {alert.smsLog}
                            </span>
                          )}
                        </div>

                      </div>
                    ))}
                  </div>
                )}

              </div>

            </div>

          </div>
        )}
      </div>

      {/* Toast Alert popup */}
      {toast && (
        <div className={`toast-popup ${toast.type}`}>
          <span>
            {toast.type === 'success' && '✔'}
            {toast.type === 'error' && '❌'}
            {toast.type === 'info' && 'ℹ'}
          </span>
          <span>{toast.message}</span>
        </div>
      )}

    </main>
  );
}
