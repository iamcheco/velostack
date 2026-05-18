import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import type { PartType } from "@/lib/tracker-types";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const schema = z.object({
  modelName:            z.string(),
  partType:             z.string(),
  brand:                z.string().describe("Brand name, e.g. Shimano, SRAM, Continental"),
  material:             z.string().describe("e.g. nickel-plated steel, titanium, carbon"),
  lifespanKmMin:        z.number().describe("Conservative lower-bound lifespan in km"),
  lifespanKmMax:        z.number().describe("Optimistic upper-bound lifespan in km"),
  wearCoefficient:      z.number().describe("Relative wear rate vs category average. 1.0 = average, >1 wears faster"),
  terrainSensitivity:   z.number().min(0).max(1).describe("How much rough terrain accelerates wear (0=not sensitive, 1=very sensitive)"),
  weatherSensitivity:   z.number().min(0).max(1).describe("How much wet/mud accelerates wear"),
  powerSensitivity:     z.number().min(0).max(1).describe("How much hard effort/torque accelerates wear"),
  replacementCostEur:   z.number().describe("Approximate new retail price in EUR"),
  notes:                z.string().describe("One sentence about this specific model's wear characteristics"),
});

export async function POST(req: NextRequest) {
  try {
    const { modelName, partType } = await req.json();
    if (!modelName || !partType) {
      return NextResponse.json({ error: "modelName and partType required" }, { status: 400 });
    }

    const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ? google("gemini-2.5-flash")
      : groq("llama-3.3-70b-versatile");

    let searchContext = "";
    let source: "web_search" | "llm_knowledge" = "llm_knowledge";

    // Try Tavily search if key exists
    if (process.env.TAVILY_API_KEY) {
      try {
        const query = `"${modelName}" bicycle ${partType} lifespan durability km review specifications`;
        const searchRes = await fetch("https://api.tavily.com/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            api_key: process.env.TAVILY_API_KEY,
            query,
            search_depth: "basic",
            include_answer: true,
            max_results: 5,
          }),
        });
        if (searchRes.ok) {
          const data = await searchRes.json();
          searchContext = data.answer || data.results?.map((r: any) => r.content).join("\n") || "";
          source = "web_search";
        }
      } catch {
        // silently fall back to LLM knowledge
      }
    }

    const { object } = await generateObject({
      model,
      schema,
      system: "You are an expert bicycle mechanic and component analyst. Given a specific bicycle component model, provide detailed durability and wear profile data. Use your training knowledge or any provided web search results. Be precise with lifespan estimates based on real-world data for that exact model.",
      prompt: searchContext
        ? `Component: ${modelName} (${partType})\n\nSearch Results:\n${searchContext}`
        : `Component: ${modelName} (${partType})\n\nUse your training knowledge to provide accurate lifespan and wear data for this specific component model.`,
    });

    return NextResponse.json({ ...object, source, researchedAt: new Date().toISOString() });
  } catch (err: any) {
    console.error("research-part error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
