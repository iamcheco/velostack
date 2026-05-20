import fs from 'fs';
import path from 'path';

// Define the directory inside the workspace for persistent files
const SCRATCH_DIR = path.join(process.cwd(), 'scratch');

// Helper to ensure scratch directory exists
function ensureScratchDir() {
  if (!fs.existsSync(SCRATCH_DIR)) {
    fs.mkdirSync(SCRATCH_DIR, { recursive: true });
  }
}

export interface SniperSettings {
  zipCode: string;
  radiusKm: number;
  minProfitEur: number;
  minDealScore: number;
  maxBudgetEur: number;
  targetBrands: string[];
  alertPhoneNumber: string;
  isSniperEnabled: boolean;
}

export interface SnipedDealAlert {
  id: string;
  timestamp: string;
  title: string;
  price: number;
  location: string;
  estimatedResalePrice: number;
  estimatedProfit: number;
  roiPercent: number;
  dealScore: number;
  verdict: string;
  verdictReason: string;
  distanceKm: number;
  link: string;
  smsSent: boolean;
  smsLog?: string;
  details?: any; // full analysis result
}

// Default settings
export const DEFAULT_SETTINGS: SniperSettings = {
  zipCode: '80331',
  radiusKm: 15,
  minProfitEur: 100,
  minDealScore: 75,
  maxBudgetEur: 500,
  targetBrands: ['Trek', 'Specialized', 'Giant', 'Cannondale', 'Canyon'],
  alertPhoneNumber: '+15555555555',
  isSniperEnabled: true
};

// --- Settings Operations ---
export function getSniperSettings(): SniperSettings {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_settings.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return { ...DEFAULT_SETTINGS, ...JSON.parse(content) };
    }
  } catch (error) {
    console.error('Error reading sniper settings:', error);
  }
  return DEFAULT_SETTINGS;
}

export function saveSniperSettings(settings: SniperSettings): void {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_settings.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify(settings, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing sniper settings:', error);
  }
}

// --- Cache Operations (to avoid duplicate appraisals) ---
export function isListingCached(link: string): boolean {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_cache.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      const cache: string[] = JSON.parse(content);
      return cache.includes(link);
    }
  } catch (error) {
    console.error('Error reading sniper cache:', error);
  }
  return false;
}

export function addListingToCache(link: string): void {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_cache.json');
  try {
    let cache: string[] = [];
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      cache = JSON.parse(content);
    }
    if (!cache.includes(link)) {
      cache.push(link);
      fs.writeFileSync(filePath, JSON.stringify(cache, null, 2), 'utf-8');
    }
  } catch (error) {
    console.error('Error writing sniper cache:', error);
  }
}

export function clearSniperCache(): void {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_cache.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
  } catch (error) {
    console.error('Error clearing sniper cache:', error);
  }
}

// --- Alerts History Operations ---
export function getSnipedAlerts(): SnipedDealAlert[] {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_alerts.json');
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch (error) {
    console.error('Error reading sniper alerts:', error);
  }
  return [];
}

export function addSnipedAlert(alert: SnipedDealAlert): void {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_alerts.json');
  try {
    let alerts = getSnipedAlerts();
    // Prepend to show newest first
    alerts = [alert, ...alerts];
    fs.writeFileSync(filePath, JSON.stringify(alerts, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error writing sniper alert:', error);
  }
}

export function clearSnipedAlerts(): void {
  ensureScratchDir();
  const filePath = path.join(SCRATCH_DIR, 'deal_sniper_alerts.json');
  try {
    fs.writeFileSync(filePath, JSON.stringify([], null, 2), 'utf-8');
  } catch (error) {
    console.error('Error clearing sniper alerts:', error);
  }
}
