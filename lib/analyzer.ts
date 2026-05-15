// ============================================================
// VeloStack — Listing Analyzer Rules Engine
// Phase 1: Pure heuristics, no AI required
// ============================================================

export type IssueSeverity = "minor" | "moderate" | "major" | "dealbreaker";

export interface DetectedIssue {
  id: string;
  label: string;
  severity: IssueSeverity;
  estimatedCost: number; // EUR
  keywords: string[];
}

export interface AnalysisResult {
  verdict: "GREAT FLIP" | "FAIR DEAL" | "PASS" | "AVOID";
  verdictReason: string;
  estimatedRepairCost: number;
  estimatedResalePrice: number;
  estimatedProfit: number;
  profitMarginPercent: number;
  confidence: number; // 0–1
  detectedIssues: DetectedIssue[];
  bikeTier: BikeTier | null;
  priceVsMarket: "below" | "at" | "above" | "unknown";
}

// ------------------------------------------------------------------
// Known issue patterns (German + English keywords)
// ------------------------------------------------------------------
const ISSUE_PATTERNS: Omit<DetectedIssue, "keywords"> & { keywords: string[] }[] = [
  {
    id: "frame_damage",
    label: "Frame damage / crack",
    severity: "dealbreaker",
    estimatedCost: 9999,
    keywords: ["rahmen riss", "rahmen crack", "broken frame", "rahmen kaputt", "bent frame", "rahmen gebrochen", "frame crack", "frame broken", "rahmenbruch"],
  },
  {
    id: "derailleur",
    label: "Derailleur issues",
    severity: "moderate",
    estimatedCost: 45,
    keywords: ["derailleur", "schaltung", "schaltwerk", "umwerfer", "schaltet nicht", "shifting problem", "won't shift", "schaltet schlecht"],
  },
  {
    id: "brakes",
    label: "Brake issues",
    severity: "moderate",
    estimatedCost: 30,
    keywords: ["brake", "bremse", "bremsen", "brakes don't work", "bremst nicht", "bremse schleift", "brake pad", "beläge"],
  },
  {
    id: "chain",
    label: "Worn chain",
    severity: "minor",
    estimatedCost: 18,
    keywords: ["chain", "kette", "chain worn", "kette worn", "chain skip", "kette springt", "chain rust"],
  },
  {
    id: "tires",
    label: "Tire / tube issues",
    severity: "minor",
    estimatedCost: 22,
    keywords: ["flat tyre", "flat tire", "platter", "platt", "puncture", "reifen", "schlauch kaputt", "tyre worn", "reifen abgefahren"],
  },
  {
    id: "rust",
    label: "Rust / corrosion",
    severity: "minor",
    estimatedCost: 12,
    keywords: ["rust", "rost", "rostig", "corrosion", "oxidation"],
  },
  {
    id: "gears",
    label: "Gear / cassette wear",
    severity: "moderate",
    estimatedCost: 35,
    keywords: ["cassette", "kassette", "gears worn", "ritzel", "chain ring", "kettenblatt", "worn gears"],
  },
  {
    id: "cables",
    label: "Cables & housing",
    severity: "minor",
    estimatedCost: 15,
    keywords: ["cable", "kabel", "züge", "housing", "hülle", "gear cable", "brake cable"],
  },
  {
    id: "pedals",
    label: "Pedal issues",
    severity: "minor",
    estimatedCost: 14,
    keywords: ["pedal", "pedale", "pedals loose", "pedale wackeln", "klick im pedal"],
  },
  {
    id: "saddle",
    label: "Saddle / seatpost",
    severity: "minor",
    estimatedCost: 20,
    keywords: ["saddle", "sattel", "seatpost", "sattelstütze", "torn saddle", "sattel gerissen"],
  },
  {
    id: "bottom_bracket",
    label: "Bottom bracket",
    severity: "moderate",
    estimatedCost: 30,
    keywords: ["bottom bracket", "innenlager", "creaking", "knarzt", "knarren", "bb worn"],
  },
  {
    id: "wheels",
    label: "Wheel / rim damage",
    severity: "moderate",
    estimatedCost: 60,
    keywords: ["buckled wheel", "acht", "rim damage", "felge", "felgenschaden", "dented rim", "spoke", "speiche"],
  },
];

// ------------------------------------------------------------------
// Bike brand/type → market value tiers (EUR, Germany market)
// ------------------------------------------------------------------
export interface BikeTier {
  brand: string;
  type: string;
  minResale: number;
  maxResale: number;
  tier: "budget" | "mid" | "premium" | "high-end";
}

const BIKE_TIERS: BikeTier[] = [
  // Premium brands
  { brand: "trek", type: "road", minResale: 400, maxResale: 1200, tier: "premium" },
  { brand: "trek", type: "mtb", minResale: 350, maxResale: 1100, tier: "premium" },
  { brand: "trek", type: "hybrid", minResale: 280, maxResale: 700, tier: "premium" },
  { brand: "specialized", type: "road", minResale: 450, maxResale: 1400, tier: "premium" },
  { brand: "specialized", type: "mtb", minResale: 400, maxResale: 1300, tier: "premium" },
  { brand: "specialized", type: "hybrid", minResale: 300, maxResale: 800, tier: "premium" },
  { brand: "giant", type: "road", minResale: 300, maxResale: 900, tier: "mid" },
  { brand: "giant", type: "mtb", minResale: 280, maxResale: 850, tier: "mid" },
  { brand: "giant", type: "hybrid", minResale: 200, maxResale: 550, tier: "mid" },
  { brand: "cannondale", type: "road", minResale: 400, maxResale: 1200, tier: "premium" },
  { brand: "cannondale", type: "mtb", minResale: 350, maxResale: 1100, tier: "premium" },
  { brand: "scott", type: "road", minResale: 350, maxResale: 1000, tier: "premium" },
  { brand: "scott", type: "mtb", minResale: 320, maxResale: 950, tier: "premium" },
  { brand: "cube", type: "road", minResale: 250, maxResale: 700, tier: "mid" },
  { brand: "cube", type: "mtb", minResale: 220, maxResale: 650, tier: "mid" },
  { brand: "cube", type: "hybrid", minResale: 180, maxResale: 500, tier: "mid" },
  { brand: "focus", type: "road", minResale: 280, maxResale: 750, tier: "mid" },
  { brand: "focus", type: "mtb", minResale: 250, maxResale: 700, tier: "mid" },
  { brand: "merida", type: "road", minResale: 220, maxResale: 600, tier: "mid" },
  { brand: "merida", type: "mtb", minResale: 200, maxResale: 580, tier: "mid" },
  { brand: "bianchi", type: "road", minResale: 350, maxResale: 1000, tier: "premium" },
  { brand: "radon", type: "mtb", minResale: 200, maxResale: 600, tier: "mid" },
  { brand: "radon", type: "road", minResale: 180, maxResale: 500, tier: "mid" },
  // Budget brands
  { brand: "btwin", type: "hybrid", minResale: 80, maxResale: 200, tier: "budget" },
  { brand: "btwin", type: "road", minResale: 90, maxResale: 220, tier: "budget" },
  { brand: "decathlon", type: "hybrid", minResale: 80, maxResale: 200, tier: "budget" },
  { brand: "prophete", type: "hybrid", minResale: 60, maxResale: 150, tier: "budget" },
  { brand: "fischer", type: "hybrid", minResale: 60, maxResale: 140, tier: "budget" },
  { brand: "bulls", type: "mtb", minResale: 150, maxResale: 400, tier: "mid" },
  { brand: "bulls", type: "hybrid", minResale: 120, maxResale: 300, tier: "mid" },
  // Generic fallbacks by type
  { brand: "generic", type: "road", minResale: 150, maxResale: 400, tier: "budget" },
  { brand: "generic", type: "mtb", minResale: 120, maxResale: 350, tier: "budget" },
  { brand: "generic", type: "hybrid", minResale: 80, maxResale: 250, tier: "budget" },
  { brand: "generic", type: "city", minResale: 60, maxResale: 200, tier: "budget" },
  { brand: "generic", type: "ebike", minResale: 400, maxResale: 1200, tier: "mid" },
];

// ------------------------------------------------------------------
// Helper: detect bike type from text
// ------------------------------------------------------------------
function detectBikeType(text: string): string {
  const lower = text.toLowerCase();
  if (/e-bike|ebike|elektro|pedelec/.test(lower)) return "ebike";
  if (/mountain|mtb|trail|enduro|downhill|fully|hardtail/.test(lower)) return "mtb";
  if (/road|rennrad|gravel|cyclocross/.test(lower)) return "road";
  if (/city|trekking|hybrid|urban|commuter|stadtrad/.test(lower)) return "hybrid";
  return "hybrid"; // default
}

// ------------------------------------------------------------------
// Helper: detect brand from text
// ------------------------------------------------------------------
function detectBrand(text: string): string {
  const lower = text.toLowerCase();
  const brands = [
    "trek", "specialized", "giant", "cannondale", "scott", "cube",
    "focus", "merida", "bianchi", "radon", "bulls", "btwin", "decathlon",
    "prophete", "fischer", "bergamont", "ghost", "kona", "santa cruz",
    "transition", "yeti", "norco", "orbea", "colnago", "de rosa",
  ];
  return brands.find((b) => lower.includes(b)) ?? "generic";
}

// ------------------------------------------------------------------
// Helper: detect issues from listing text
// ------------------------------------------------------------------
function detectIssues(text: string): DetectedIssue[] {
  const lower = text.toLowerCase();
  return ISSUE_PATTERNS.filter((pattern) =>
    pattern.keywords.some((kw) => lower.includes(kw))
  );
}

// ------------------------------------------------------------------
// Helper: lookup resale tier
// ------------------------------------------------------------------
function lookupTier(brand: string, bikeType: string): BikeTier | null {
  return (
    BIKE_TIERS.find((t) => t.brand === brand && t.type === bikeType) ??
    BIKE_TIERS.find((t) => t.brand === "generic" && t.type === bikeType) ??
    null
  );
}

// ------------------------------------------------------------------
// Main analysis function
// ------------------------------------------------------------------
export function analyzeListing(input: {
  title: string;
  description: string;
  askingPrice: number;
  comparablePrice?: number; // if we have live scrape data
}): AnalysisResult {
  const fullText = `${input.title} ${input.description}`;

  const brand = detectBrand(fullText);
  const bikeType = detectBikeType(fullText);
  const issues = detectIssues(fullText);
  const tier = lookupTier(brand, bikeType);

  // Total repair cost
  const dealbreaker = issues.find((i) => i.severity === "dealbreaker");
  const totalRepairCost = dealbreaker
    ? 9999
    : issues.reduce((sum, i) => sum + i.estimatedCost, 0);

  // Estimated resale price
  let estimatedResalePrice: number;
  let confidence = 0.5;
  let priceVsMarket: AnalysisResult["priceVsMarket"] = "unknown";

  if (input.comparablePrice) {
    estimatedResalePrice = input.comparablePrice;
    confidence = 0.8;
    if (input.askingPrice < estimatedResalePrice * 0.85) priceVsMarket = "below";
    else if (input.askingPrice > estimatedResalePrice * 1.1) priceVsMarket = "above";
    else priceVsMarket = "at";
  } else if (tier) {
    const midpoint = (tier.minResale + tier.maxResale) / 2;
    // Condition adjustment: more issues → lower resale
    const conditionFactor = 1 - Math.min(issues.length * 0.05, 0.3);
    estimatedResalePrice = Math.round(midpoint * conditionFactor);
    confidence = 0.5;
    if (input.askingPrice < tier.minResale) priceVsMarket = "below";
    else if (input.askingPrice > tier.maxResale) priceVsMarket = "above";
    else priceVsMarket = "at";
  } else {
    estimatedResalePrice = Math.round(input.askingPrice * 1.2);
    confidence = 0.3;
  }

  const profit = estimatedResalePrice - input.askingPrice - totalRepairCost;
  const profitMarginPercent = Math.round((profit / estimatedResalePrice) * 100);

  // Verdict logic
  let verdict: AnalysisResult["verdict"];
  let verdictReason: string;

  if (dealbreaker) {
    verdict = "AVOID";
    verdictReason = `Frame or structural damage detected ("${dealbreaker.label}") — not worth repairing.`;
  } else if (profit >= 80 && confidence >= 0.5) {
    verdict = "GREAT FLIP";
    verdictReason = `Strong margin of €${profit} after estimated €${totalRepairCost} in repairs. Act fast.`;
  } else if (profit >= 25) {
    verdict = "FAIR DEAL";
    verdictReason = `Modest margin of €${profit}. Safe flip if you can do repairs yourself.`;
  } else if (profit >= 0) {
    verdict = "PASS";
    verdictReason = `Too thin — €${profit} profit doesn't cover your time. Negotiate price down.`;
  } else {
    verdict = "PASS";
    verdictReason = `Negative margin (€${profit}). Asking price is too high for the condition.`;
  }

  return {
    verdict,
    verdictReason,
    estimatedRepairCost: totalRepairCost,
    estimatedResalePrice,
    estimatedProfit: profit,
    profitMarginPercent,
    confidence,
    detectedIssues: issues,
    bikeTier: tier,
    priceVsMarket,
  };
}
