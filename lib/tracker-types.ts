export type PartType = "chain" | "cassette" | "brake_pads" | "tire_rear" | "tire_front" | "cables" | "bar_tape";
export type TerrainType = "road" | "gravel" | "trail";
export type EffortLevel = "easy" | "moderate" | "hard";
export type ConditionType = "dry" | "wet" | "muddy";
export type BikeType = "road" | "gravel" | "mtb" | "city" | "ebike";

export const PART_TYPE_LABELS: Record<PartType, string> = {
  chain: "Chain",
  cassette: "Cassette",
  brake_pads: "Brake Pads",
  tire_rear: "Rear Tire",
  tire_front: "Front Tire",
  cables: "Cables & Housing",
  bar_tape: "Bar Tape",
};

export const BIKE_TYPE_LABELS: Record<BikeType, string> = {
  road: "Road",
  gravel: "Gravel",
  mtb: "MTB",
  city: "City / Commuter",
  ebike: "E-Bike",
};

export interface PartProfile {
  partKey: string;           // unique id per part instance
  bikeId: string;
  modelName: string;
  partType: PartType;
  brand: string;
  material: string;
  lifespanKmMin: number;
  lifespanKmMax: number;
  wearCoefficient: number;      // 1.0 = category average; higher = wears faster
  terrainSensitivity: number;   // 0–1
  weatherSensitivity: number;   // 0–1
  powerSensitivity: number;     // 0–1
  replacementCostEur: number;
  notes: string;
  source: "web_search" | "llm_knowledge";
  researchedAt: string;
}

export interface Bike {
  id: string;
  name: string;
  type: BikeType;
  createdAt: string;
}

export interface RideLog {
  id: string;
  bikeId: string;
  date: string;
  distanceKm: number;
  elevationM: number;
  terrain: TerrainType;
  condition: ConditionType;
  effort: EffortLevel;
  source: "manual" | "strava";
  stravaId?: number;
  notes?: string;
}

export interface PartReplacement {
  partKey: string;
  bikeId: string;
  replacedAt: string;
  replacedAtTotalKm: number;
}

export interface StravaTokens {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;       // unix timestamp in seconds
  athleteId: number;
  athleteName: string;
}

export interface WearResult {
  partKey: string;
  partType: PartType;
  modelName: string;
  kmSinceReplacement: number;
  rawWearScore: number;    // 0–1+ (>1 = overdue)
  healthPercent: number;   // 0–100
  status: "good" | "watch" | "replace_soon" | "overdue";
  forecastKmLow: number;
  forecastKmHigh: number;
  explanation?: string;
  replacementCostEur: number;
}

export interface PartsBinItem {
  id: string;
  componentType: PartType | "saddle" | "grip" | "shifter" | "bottom_bracket" | "wheelset" | "rotor" | "tire"; // Maps to core parts plus custom accessories
  brandModel: string;
  condition: "new" | "excellent" | "fair" | "worn";
  compatSpeeds?: number;
  estimatedValueEur: number;
  dateAdded: string;
}

export interface BikeFrameSpecs {
  bottomBracketShell: "BSA" | "BB30" | "BB86/92" | "T47";
  rearAxle: "135mm QR" | "12x142mm TA" | "12x148mm Boost";
  brakeMount: "Rim" | "Flat Mount" | "Post Mount";
  maxTireClearance: number; // in mm
  wheelSize: "700c" | "650b" | "29 inch" | "27.5 inch" | "26 inch";
  targetSpeeds: number;     // e.g. 10, 11, 12
}

export interface MountedPartsState {
  frameId: string;
  chain?: string;        // parts bin item id
  cassette?: string;     // parts bin item id
  shifter?: string;      // parts bin item id (drivetrain)
  bottomBracket?: string;// parts bin item id
  wheelset?: string;     // parts bin item id
  rotor?: string;        // parts bin item id
  tire?: string;         // parts bin item id
  saddle?: string;       // parts bin item id
}

export interface CompatibilityIssue {
  id: string;
  severity: "error" | "warning";
  component: string;
  message: string;
  alternativeQuery?: string; // eBay search suggestion
}

export interface FlipTransaction {
  id: string;
  bikeId: string; // references an existing bike id, or "custom"
  title: string;
  purchasePrice: number;
  partsExpense: Array<{ id: string; partName: string; cost: number }>;
  miscExpense: Array<{ id: string; name: string; cost: number }>;
  laborHours: number;
  hourlyRate: number;
  askingPrice: number;
  finalSalePrice?: number;
  saleDate?: string;
  status: "sourcing" | "in_progress" | "listed" | "sold";
}

export interface TrackerStore {
  bikes: Bike[];
  rides: RideLog[];
  parts: Record<string, PartProfile[]>;   // bikeId → PartProfile[]
  replacements: PartReplacement[];
  explanations: Record<string, string>;   // partKey → cached LLM text
  partsBin?: PartsBinItem[];
  transactions?: FlipTransaction[];
  bikeFrameSpecs?: Record<string, BikeFrameSpecs>;
  mountedParts?: Record<string, MountedPartsState>;
}
