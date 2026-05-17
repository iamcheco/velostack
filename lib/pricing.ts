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
