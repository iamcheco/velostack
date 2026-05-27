import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { groq } from '@ai-sdk/groq';
import { createOpenAI } from '@ai-sdk/openai';
import { fetchLiveMarketPrice, calculatePartOutValues, PartOutCalculation } from './pricing';

// ============================================================
// VeloStack — Listing Analyzer Rules Engine
// Phase 1: LLM-powered dynamic extraction
// ============================================================

export type IssueSeverity = "minor" | "moderate" | "dealbreaker";

export interface DetectedIssue {
  part: string;
  issue: string;
  estimatedCost: number;
}

export interface ExtractedComponent {
  type: string; // e.g., 'frame', 'drivetrain', 'brakes', 'saddle', 'wheels'
  name: string; // e.g., 'Shimano Deore', 'Selle Italia'
  marketPriceEur?: number;
  priceConfidence?: string;
  priceReasoning?: string;
}

export interface AnalysisResult {
  verdict: "GREAT FLIP" | "FAIR DEAL" | "PASS" | "AVOID";
  verdictReason: string;
  estimatedRepairCost: number;
  estimatedResalePrice: number;
  estimatedProfit: number;
  profitMarginPercent: number;
  confidence: number;
  detectedIssues: DetectedIssue[];
  components: ExtractedComponent[];
  bikeTier: {
    brand: string;
    type: string;
    tier: string;
  } | null;
  priceVsMarket: "below" | "at" | "above" | "unknown";
  
  // Geographic and Liquidity fields
  location?: string;
  marketProfile: "urban" | "mountain" | "flatland" | "standard";
  originalResalePrice: number;
  priceModifierPercent: number;
  estimatedDaysOnMarket: number;
  daysOnMarketModifierPercent: number;
  liquidityScore: "high" | "medium" | "low";
  isVerdictDowngraded: boolean;

  // Part-Out Calculation
  partOutCalc?: PartOutCalculation;
}

export function resolveMarketProfile(
  location?: string,
  marketProfileInput?: "urban" | "mountain" | "flatland" | "standard"
): "urban" | "mountain" | "flatland" | "standard" {
  if (marketProfileInput && marketProfileInput !== "standard" && ["urban", "mountain", "flatland", "standard"].includes(marketProfileInput)) {
    return marketProfileInput;
  }

  if (!location) {
    return "standard";
  }

  const loc = location.toLowerCase().trim();

  // ZIP codes
  // US ZIP codes: 
  // NYC prefix (100, 101, 102) -> urban
  // Florida prefix (320-349) -> flatland
  // Colorado/Utah (800-816, 840-847) -> mountain
  const usZipMatch = loc.match(/^\b\d{5}\b/);
  if (usZipMatch) {
    const zip = parseInt(usZipMatch[0], 10);
    const prefix = Math.floor(zip / 100);
    if (prefix >= 100 && prefix <= 102) return "urban";
    if (prefix >= 320 && prefix <= 349) return "flatland";
    if ((prefix >= 800 && prefix <= 816) || (prefix >= 840 && prefix <= 847)) return "mountain";
  }

  // German ZIP codes
  const deZipMatch = loc.match(/^\b\d{5}\b/);
  if (deZipMatch) {
    const zipStr = deZipMatch[0];
    if (zipStr.startsWith("80") || zipStr.startsWith("81") || zipStr.startsWith("10") || zipStr.startsWith("11") || zipStr.startsWith("12") || zipStr.startsWith("13") || zipStr.startsWith("14")) {
      return "urban";
    }
    if (zipStr.startsWith("82") || zipStr.startsWith("83")) {
      return "mountain";
    }
  }

  // Keywords
  const urbanKeywords = ["london", "munich", "paris", "nyc", "new york", "berlin", "amsterdam", "tokyo", "san francisco", "chicago", "boston", "vienna", "hamburg", "frankfurt"];
  const mountainKeywords = ["denver", "innsbruck", "vancouver", "chamonix", "salt lake", "utah", "colorado", "alps", "seattle", "portland", "whistler", "calgary", "aspen", "boulder"];
  const flatlandKeywords = ["florida", "miami", "houston", "dallas", "phoenix", "orlando", "tampa", "charlotte", "netherlands"];

  if (urbanKeywords.some(kw => loc.includes(kw))) return "urban";
  if (mountainKeywords.some(kw => loc.includes(kw))) return "mountain";
  if (flatlandKeywords.some(kw => loc.includes(kw))) return "flatland";

  return "standard";
}

export async function analyzeInput(input: { title: string; description: string; location?: string; marketProfile?: "urban" | "mountain" | "flatland" | "standard"; comparablePrice?: number; askingPrice: number }): Promise<AnalysisResult> {
  const fullText = `${input.title}\n\n${input.description}`;

  // Prioritize Gemini if key exists, else Groq
  const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY 
    ? google('gemini-2.5-flash') 
    : groq('llama-3.3-70b-versatile');

  const { object } = await generateObject({
    model,
    schema: z.object({
      brand: z.string().describe("The brand of the bike (e.g. Trek, Specialized). Return 'generic' if unknown."),
      type: z.string().describe("Type of bike: 'road', 'mtb', 'hybrid', 'ebike', or 'city'"),
      components: z.array(z.object({
        type: z.string().describe("Category of the component (e.g., 'drivetrain', 'frame', 'brakes', 'saddle', 'wheels', 'fork')"),
        name: z.string().describe("The specific model/name of the component (e.g., 'Shimano 105', 'Fox 36 Float')")
      })),
      issues: z.array(z.object({
        part: z.string().describe("The part that has an issue (e.g., 'chain', 'frame')"),
        issue: z.string().describe("Description of the problem (e.g., 'rusty', 'cracked')"),
        severity: z.enum(["minor", "moderate", "dealbreaker"]).describe("Severity of the issue"),
        estimatedRepairCostEur: z.number().describe("Estimated cost in EUR to fix this issue")
      })),
      estimatedResaleValueEur: z.number().describe("Your expert estimation of the fair used market value of this bike in EUR, assuming all issues are fixed."),
      confidence: z.number().min(0).max(1).describe("Your confidence in this resale valuation (0 to 1)")
    }),
    system: "You are an expert bicycle mechanic and appraiser. Read the bike classified ad and extract the components, brand, type, and any mentioned mechanical issues. Estimate the fair market resale value of the bike in EUR.",
    prompt: `Analyze the following bike listing:\n\n${fullText}`
  });

  const totalRepairCost = object.issues.reduce((sum, i) => sum + i.estimatedRepairCostEur, 0);
  const dealbreaker = object.issues.some(i => i.severity === "dealbreaker");
  
  // Fetch live market prices for all extracted components in parallel
  const componentsWithPrices = await Promise.all(
    object.components.map(async (comp) => {
      const priceData = await fetchLiveMarketPrice(comp.name, comp.type);
      return {
        ...comp,
        marketPriceEur: priceData.estimatedPriceEur,
        priceConfidence: priceData.confidence,
        priceReasoning: priceData.reasoning,
      };
    })
  );
  
  // Resolve geographic archetype
  const resolvedProfile = resolveMarketProfile(input.location, input.marketProfile);

  // Check if it's a gravel bike (road bike but gravel term matches)
  const bikeType = object.type.toLowerCase();
  const isGravel = bikeType === "road" && (
    input.title.toLowerCase().includes("gravel") || 
    input.description.toLowerCase().includes("gravel")
  );

  let priceModifierPercent = 0;
  let daysOnMarketModifierPercent = 0;

  if (resolvedProfile === "urban") {
    // Commuter-friendly categories: road, gravel, hybrid, city
    if (bikeType === "road" || isGravel || bikeType === "hybrid" || bikeType === "city") {
      priceModifierPercent = 10;
      daysOnMarketModifierPercent = -30;
    }
  } else if (resolvedProfile === "mountain") {
    // MTB category
    if (bikeType === "mtb") {
      priceModifierPercent = 15;
      daysOnMarketModifierPercent = -40;
    }
  } else if (resolvedProfile === "flatland") {
    // Road/gravel drag in flatlands
    if (bikeType === "road" || isGravel) {
      priceModifierPercent = -15;
      daysOnMarketModifierPercent = 50;
    }
  }

  const originalResalePrice = input.comparablePrice ?? object.estimatedResaleValueEur;
  const estimatedResalePrice = Math.round(originalResalePrice * (1 + priceModifierPercent / 100));

  const profit = estimatedResalePrice - input.askingPrice - totalRepairCost;
  const profitMarginPercent = estimatedResalePrice > 0 ? Math.round((profit / estimatedResalePrice) * 100) : 0;

  // Calculate Days on Market
  let baselineDays = 25;
  if (bikeType === "mtb") baselineDays = 32;
  else if (bikeType === "road" || isGravel) baselineDays = 28;
  else if (bikeType === "ebike") baselineDays = 20;
  else if (bikeType === "hybrid" || bikeType === "city") baselineDays = 22;

  const estimatedDaysOnMarket = Math.max(
    5,
    Math.round(baselineDays * (1 + daysOnMarketModifierPercent / 100))
  );

  let liquidityScore: "high" | "medium" | "low" = "medium";
  if (estimatedDaysOnMarket <= 20) {
    liquidityScore = "high";
  } else if (estimatedDaysOnMarket > 40) {
    liquidityScore = "low";
  }

  let verdict: AnalysisResult["verdict"];
  let verdictReason: string;
  let isVerdictDowngraded = false;

  if (dealbreaker) {
    verdict = "AVOID";
    verdictReason = `Dealbreaker issue detected — not worth repairing.`;
  } else if (profit >= 80 && object.confidence >= 0.5) {
    if (estimatedDaysOnMarket > 45) {
      verdict = "FAIR DEAL";
      verdictReason = `Strong margins of €${profit}, but geographic time-to-sell risk is too high (${estimatedDaysOnMarket} days). Holding risk downgraded verdict from GREAT FLIP.`;
      isVerdictDowngraded = true;
    } else {
      verdict = "GREAT FLIP";
      verdictReason = `Strong margin of €${profit} after estimated €${totalRepairCost} in repairs. Act fast.`;
    }
  } else if (profit >= 25) {
    verdict = "FAIR DEAL";
    verdictReason = `Modest margin of €${profit}. Safe flip if you can do repairs yourself.`;
  } else if (profit >= 0) {
    verdict = "PASS";
    verdictReason = `Too thin — €${profit} profit doesn't cover your time. Negotiate price down.`;
  } else {
    verdict = "PASS";
    verdictReason = `Negative margin (€${profit}). Asking price is too high.`;
  }

  let priceVsMarket: AnalysisResult["priceVsMarket"] = "at";
  if (input.askingPrice < estimatedResalePrice * 0.85) priceVsMarket = "below";
  else if (input.askingPrice > estimatedResalePrice * 1.1) priceVsMarket = "above";

  const bikeTierName: "premium" | "mid" | "budget" = 
    estimatedResalePrice > 1000 ? "premium" : estimatedResalePrice > 400 ? "mid" : "budget";

  const partOutCalc = calculatePartOutValues(
    componentsWithPrices,
    object.type,
    bikeTierName,
    input.askingPrice,
    profit,
    estimatedResalePrice,
    input.description
  );

  return {
    verdict,
    verdictReason,
    estimatedRepairCost: totalRepairCost,
    estimatedResalePrice,
    estimatedProfit: profit,
    profitMarginPercent,
    confidence: object.confidence,
    detectedIssues: object.issues.map(i => ({
      part: i.part,
      issue: i.issue,
      estimatedCost: i.estimatedRepairCostEur,
    })),
    components: componentsWithPrices,
    bikeTier: {
      brand: object.brand,
      type: object.type,
      tier: bikeTierName,
    },
    priceVsMarket,
    location: input.location,
    marketProfile: resolvedProfile,
    originalResalePrice,
    priceModifierPercent,
    estimatedDaysOnMarket,
    daysOnMarketModifierPercent,
    liquidityScore,
    isVerdictDowngraded,
    partOutCalc,
  };
}

