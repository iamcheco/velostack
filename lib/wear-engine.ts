import type { PartProfile, RideLog, PartReplacement, WearResult } from "./tracker-types";

const TERRAIN_FACTOR: Record<string, number> = { road: 0, gravel: 0.4, trail: 0.8 };
const CONDITION_FACTOR: Record<string, number> = { dry: 0, wet: 0.4, muddy: 0.8 };
const EFFORT_FACTOR: Record<string, number> = { easy: 0, moderate: 0.3, hard: 0.7 };

function statusFromHealth(h: number): WearResult["status"] {
  if (h > 60) return "good";
  if (h > 30) return "watch";
  if (h > 0)  return "replace_soon";
  return "overdue";
}

export function calcPartWear(
  part: PartProfile,
  allRides: RideLog[],
  replacements: PartReplacement[]
): WearResult {
  const partReplacements = replacements
    .filter(r => r.partKey === part.partKey && r.bikeId === part.bikeId)
    .sort((a, b) => new Date(b.replacedAt).getTime() - new Date(a.replacedAt).getTime());

  const lastReplacement = partReplacements[0];

  const bikeRides = allRides.filter(r => r.bikeId === part.bikeId);
  const relevantRides = lastReplacement
    ? bikeRides.filter(r => new Date(r.date) > new Date(lastReplacement.replacedAt))
    : bikeRides;

  let totalWearKm = 0;
  for (const ride of relevantRides) {
    const d = ride.distanceKm;
    const k = part.wearCoefficient;
    const r = (TERRAIN_FACTOR[ride.terrain]  ?? 0) * part.terrainSensitivity;
    const m = (CONDITION_FACTOR[ride.condition] ?? 0) * part.weatherSensitivity;
    const p = (EFFORT_FACTOR[ride.effort]    ?? 0) * part.powerSensitivity;
    const e = Math.min((ride.elevationM / Math.max(ride.distanceKm, 1)) / 15, 1.0);
    totalWearKm += d * k * (1 + 0.7 * r + 0.5 * m + 0.3 * p + 0.2 * e);
  }

  const rawWearScore   = totalWearKm / part.lifespanKmMax;
  const healthPercent  = Math.max(0, 100 - rawWearScore * 100);
  const capacityLeft   = part.lifespanKmMax * Math.max(0, 1 - rawWearScore);
  const forecastKmHigh = Math.round(capacityLeft);
  const forecastKmLow  = Math.round(capacityLeft * (part.lifespanKmMin / part.lifespanKmMax));
  const kmSinceReplacement = relevantRides.reduce((s, r) => s + r.distanceKm, 0);

  return {
    partKey: part.partKey,
    partType: part.partType,
    modelName: part.modelName,
    kmSinceReplacement: Math.round(kmSinceReplacement),
    rawWearScore,
    healthPercent: Math.round(healthPercent),
    status: statusFromHealth(healthPercent),
    forecastKmLow:  Math.max(0, forecastKmLow),
    forecastKmHigh: Math.max(0, forecastKmHigh),
    replacementCostEur: part.replacementCostEur,
  };
}

export function calcReplacementOptimization(
  results: WearResult[]
): { message: string; savingsEur: number } | null {
  const chain    = results.find(w => w.partType === "chain");
  const cassette = results.find(w => w.partType === "cassette");
  if (!chain || !cassette) return null;
  if (chain.rawWearScore > 0.8 && cassette.rawWearScore < 0.5) {
    return {
      message: `Replace chain now (€${chain.replacementCostEur}) to avoid cassette co-damage`,
      savingsEur: cassette.replacementCostEur,
    };
  }
  return null;
}

export function getTotalBikeKm(bikeId: string, rides: RideLog[]): number {
  return Math.round(rides.filter(r => r.bikeId === bikeId).reduce((s, r) => s + r.distanceKm, 0));
}
