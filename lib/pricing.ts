import { generateObject } from 'ai';
import { z } from 'zod';
import { google } from '@ai-sdk/google';
import { createOpenAI } from '@ai-sdk/openai';

const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

export interface PriceEstimate {
  estimatedPriceEur: number;
  confidence: "high" | "medium" | "low";
  reasoning: string;
}

export interface PartOutItem {
  id: string;
  type: string;          // e.g. "frame", "fork", "drivetrain", "wheels", "brakes", "saddle", "cockpit", "other"
  name: string;          // e.g. "Shimano Deore Cassette"
  estimatedPriceEur: number;
  packagingComplexity: "low" | "medium" | "high";
  toolsNeeded: string[];
}

export interface PartOutCalculation {
  items: PartOutItem[];
  grossValue: number;
  netDisassemblyValue: number; // grossValue * 0.85
  laborHours: number;
  laborCost: number;
  netProfit: number;
  isPartOutPreferred: boolean;
  profitDifference: number;
  feasibilityScore: number;
  feasibilityRating: "Easy" | "Medium" | "Hard";
  requiredTools: string[];
}

export async function fetchLiveMarketPrice(
  componentName: string,
  componentType: string
): Promise<PriceEstimate> {
  // Graceful fallback if keys aren't set yet
  if (!process.env.TAVILY_API_KEY) {
    return {
      estimatedPriceEur: 0,
      confidence: "low",
      reasoning: "TAVILY_API_KEY is missing. Add it to .env.local to enable live web search.",
    };
  }

  const query = `current used market price average for "${componentName}" bicycle ${componentType} in EUR`;

  try {
    // 1. Search the web using Tavily
    const searchResponse = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: process.env.TAVILY_API_KEY,
        query: query,
        search_depth: "basic",
        include_answer: true,
      }),
    });

    if (!searchResponse.ok) {
      throw new Error(`Search API error: ${searchResponse.statusText}`);
    }

    const data = await searchResponse.json();
    const searchContext = data.answer || data.results.map((r: any) => r.content).join("\n");

    // 2. Use LLM to extract a single EUR price from the messy search results
    const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY 
      ? google('gemini-2.5-flash') 
      : groq('llama-3.3-70b-versatile');

    const { object } = await generateObject({
      model,
      schema: z.object({
        estimatedPriceEur: z.number().describe("The estimated average used market price in EUR extracted from the text."),
        confidence: z.enum(["high", "medium", "low"]).describe("How confident you are in this price based on the search results."),
        reasoning: z.string().describe("A very brief 1-sentence explanation of how you derived this price."),
      }),
      system: "You are a pricing extraction agent. Read the provided web search results and determine the average used market price in EUR for the requested bicycle component.",
      prompt: `Component: ${componentName} (${componentType})\n\nSearch Results:\n${searchContext}`
    });

    return object;
  } catch (error: any) {
    console.error(`Failed to fetch price for ${componentName}:`, error);
    return {
      estimatedPriceEur: 0,
      confidence: "low",
      reasoning: `Search failed: ${error.message}`,
    };
  }
}

/**
 * Calculates part-out valuation, feasibility, and disassembly labor costs
 * for extracted components based on bike category and tier.
 */
export function calculatePartOutValues(
  components: Array<{
    type: string;
    name: string;
    marketPriceEur?: number;
  }>,
  bikeType: string,
  bikeTier: "premium" | "mid" | "budget",
  askingPrice: number,
  wholeBikeProfit: number,
  estimatedResalePrice: number,
  descriptionText: string = ""
): PartOutCalculation {
  const normType = bikeType.toLowerCase();
  
  // 1. Process Extracted Components
  const items: PartOutItem[] = [];
  const processedTypes = new Set<string>();

  components.forEach((comp, idx) => {
    const compType = comp.type.toLowerCase().trim();
    processedTypes.add(compType);

    // Skip creating duplicate items of the same primary category if redundant, but keep list clean
    const id = `part_${compType}_${idx}`;
    let marketPrice = comp.marketPriceEur ?? 0;

    // Apply heuristic fallback if price is missing/0
    if (marketPrice === 0) {
      if (compType === "frame") {
        marketPrice = bikeTier === "premium" ? 250 : bikeTier === "mid" ? 120 : 60;
      } else if (compType === "fork" || compType === "suspension") {
        marketPrice = bikeTier === "premium" ? 220 : bikeTier === "mid" ? 100 : 40;
      } else if (compType === "drivetrain") {
        marketPrice = bikeTier === "premium" ? 180 : bikeTier === "mid" ? 90 : 35;
      } else if (compType === "wheels" || compType === "wheelset") {
        marketPrice = bikeTier === "premium" ? 160 : bikeTier === "mid" ? 80 : 30;
      } else if (compType === "brakes") {
        marketPrice = bikeTier === "premium" ? 80 : bikeTier === "mid" ? 40 : 15;
      } else if (compType === "saddle") {
        marketPrice = bikeTier === "premium" ? 40 : bikeTier === "mid" ? 20 : 10;
      } else {
        marketPrice = bikeTier === "premium" ? 30 : bikeTier === "mid" ? 15 : 8;
      }
    }

    // Determine tools needed
    const toolsNeeded: string[] = ["Allen Keys"];
    if (compType === "drivetrain") {
      toolsNeeded.push("Chain Breaker", "Cassette Lockring Tool", "Chain Whip");
    } else if (compType === "wheels" || compType === "wheelset") {
      toolsNeeded.push("Tire Levers", "Cassette Lockring Tool");
    } else if (compType === "frame") {
      toolsNeeded.push("Bottom Bracket Tool");
    } else if (compType === "brakes") {
      toolsNeeded.push("Cable Cutters");
      const nameLower = comp.name.toLowerCase();
      if (nameLower.includes("hydraulic") || nameLower.includes("disc") || normType === "mtb") {
        toolsNeeded.push("Hydraulic Bleed Kit");
      }
    } else if (compType === "fork" || compType === "suspension") {
      const nameLower = comp.name.toLowerCase();
      if (nameLower.includes("fox") || nameLower.includes("rockshox") || nameLower.includes("air")) {
        toolsNeeded.push("Shock Pump");
      }
    }

    // Determine packaging complexity
    let packagingComplexity: PartOutItem["packagingComplexity"] = "low";
    if (compType === "frame") {
      packagingComplexity = "high";
    } else if (compType === "wheels" || compType === "wheelset") {
      packagingComplexity = "high";
    } else if (compType === "fork" || compType === "suspension" || compType === "drivetrain") {
      packagingComplexity = "medium";
    }

    items.push({
      id,
      type: compType,
      name: comp.name,
      estimatedPriceEur: marketPrice,
      packagingComplexity,
      toolsNeeded,
    });
  });

  // 2. Synthesize Frame if not explicitly extracted (A complete bike always has a frame!)
  if (!processedTypes.has("frame")) {
    const framePrice = Math.round(
      bikeTier === "premium"
        ? Math.max(250, estimatedResalePrice * 0.3)
        : bikeTier === "mid"
        ? Math.max(120, estimatedResalePrice * 0.25)
        : Math.max(50, estimatedResalePrice * 0.2)
    );

    items.push({
      id: "part_frame_synthesized",
      type: "frame",
      name: `${bikeTier.toUpperCase()} ${normType.toUpperCase()} Bike Frame`,
      estimatedPriceEur: framePrice,
      packagingComplexity: "high",
      toolsNeeded: ["Allen Keys", "Bottom Bracket Tool"],
    });
  }

  // 3. Mathematical sums & fee calculations
  const grossValue = items.reduce((sum, item) => sum + item.estimatedPriceEur, 0);
  const netDisassemblyValue = Math.round(grossValue * 0.85); // 15% platform/box fees

  // 4. Labor estimations
  const baselineLabor = 2.0; // Clean, list, photograph parts
  const partHandlingTime = 0.5; // Strip & pack each part
  const laborHours = Math.min(6.0, Number((baselineLabor + items.length * partHandlingTime).toFixed(1)));
  const defaultHourlyRate = 20;
  const laborCost = Math.round(laborHours * defaultHourlyRate);

  // 5. Final Part-Out Profit calculations
  const netProfit = netDisassemblyValue - askingPrice - laborCost;
  const isPartOutPreferred = netProfit > wholeBikeProfit;
  const profitDifference = Math.round(Math.abs(netProfit - wholeBikeProfit));

  // 6. Disassembly Feasibility Score calculations
  let feasibilityScore = 100;
  
  // Deduct points for packaging complexity
  items.forEach(item => {
    if (item.packagingComplexity === "high") feasibilityScore -= 10;
    else if (item.packagingComplexity === "medium") feasibilityScore -= 5;
  });

  // Deduct points for complexity by category
  if (normType === "ebike") {
    feasibilityScore -= 30; // Motors, electronics, batteries are highly complex
  } else if (normType === "mtb") {
    const isFullSuspension = 
      descriptionText.toLowerCase().includes("full suspension") ||
      descriptionText.toLowerCase().includes("fs") ||
      descriptionText.toLowerCase().includes("shock") ||
      descriptionText.toLowerCase().includes("linkage");
    if (isFullSuspension) {
      feasibilityScore -= 20; // Full suspension linkage pivots are complex
    } else {
      feasibilityScore -= 10; // Hardtails are slightly easier
    }
  }

  // Deduct points for hydraulic brakes
  const hasHydraulicBrakes = items.some(
    item => item.type === "brakes" && item.toolsNeeded.includes("Hydraulic Bleed Kit")
  );
  if (hasHydraulicBrakes) {
    feasibilityScore -= 10;
  }

  feasibilityScore = Math.max(10, Math.min(100, feasibilityScore));

  let feasibilityRating: PartOutCalculation["feasibilityRating"] = "Medium";
  if (feasibilityScore >= 85) {
    feasibilityRating = "Easy";
  } else if (feasibilityScore < 60) {
    feasibilityRating = "Hard";
  }

  // 7. Aggregate specialized tools checklist
  const requiredTools = Array.from(
    new Set(items.flatMap(item => item.toolsNeeded))
  ).sort();

  return {
    items,
    grossValue,
    netDisassemblyValue,
    laborHours,
    laborCost,
    netProfit,
    isPartOutPreferred,
    profitDifference,
    feasibilityScore,
    feasibilityRating,
    requiredTools,
  };
}
