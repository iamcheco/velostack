import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';
import { fetchLiveMarketPrice } from './pricing';

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
}

// Fallback provider (Groq) for flexibility based on Second Brain project
const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export async function analyzeListing(input: {
  title: string;
  description: string;
  askingPrice: number;
  comparablePrice?: number;
}): Promise<AnalysisResult> {
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
  
  // Use user-provided comparable if available, else use LLM estimation
  const estimatedResalePrice = input.comparablePrice ?? object.estimatedResaleValueEur;
  const profit = estimatedResalePrice - input.askingPrice - totalRepairCost;
  const profitMarginPercent = estimatedResalePrice > 0 ? Math.round((profit / estimatedResalePrice) * 100) : 0;

  let verdict: AnalysisResult["verdict"];
  let verdictReason: string;

  if (dealbreaker) {
    verdict = "AVOID";
    verdictReason = `Dealbreaker issue detected — not worth repairing.`;
  } else if (profit >= 80 && object.confidence >= 0.5) {
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
    verdictReason = `Negative margin (€${profit}). Asking price is too high.`;
  }

  let priceVsMarket: AnalysisResult["priceVsMarket"] = "at";
  if (input.askingPrice < estimatedResalePrice * 0.85) priceVsMarket = "below";
  else if (input.askingPrice > estimatedResalePrice * 1.1) priceVsMarket = "above";

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
      estimatedCost: i.estimatedRepairCostEur
    })),
    components: componentsWithPrices,
    bikeTier: {
      brand: object.brand,
      type: object.type,
      tier: estimatedResalePrice > 1000 ? "premium" : estimatedResalePrice > 400 ? "mid" : "budget"
    },
    priceVsMarket,
  };
}
