import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

const requestSchema = z.object({
  bikeName: z.string(),
  color: z.string().optional(),
  frameSize: z.string().optional(),
  speedsCount: z.string().optional(),
  targetPrice: z.number().positive(),
  upgrades: z.array(z.object({
    partName: z.string(),
    cost: z.number(),
  })),
  wearCondition: z.string().optional(),
  tone: z.enum(["professional", "enthusiast", "minimalist", "deal-hunter"]),
  platform: z.enum(["facebook", "ebay", "craigslist", "pinkbike"]),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = requestSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input variables", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const {
      bikeName,
      color,
      frameSize,
      speedsCount,
      targetPrice,
      upgrades,
      wearCondition,
      tone,
      platform,
    } = parsed.data;

    // Use Gemini if API key is present, otherwise fallback to Groq Llama
    const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ? google("gemini-2.5-flash")
      : groq("llama-3.3-70b-versatile");

    const platformLabels: Record<string, string> = {
      facebook: "Facebook Marketplace",
      ebay: "eBay / eBay Kleinanzeigen",
      craigslist: "Craigslist",
      pinkbike: "Pinkbike Classifieds",
    };

    const toneDescriptions: Record<string, string> = {
      professional: "Professional Mechanic/Enthusiast. Thorough, technically detailed, highlights exact component hierarchies, meticulous maintenance, and clean specs. Perfect for justifying a fair/premium price.",
      enthusiast: "Passionate Bike Lover. Enthusiastic, speaks about the smooth ride quality, shares the joy of cycling, and highlights the value of quality component upgrades.",
      minimalist: "Direct & Minimalist. Bulleted, straightforward specs, ready-to-ride upgrades, and price. Fast-reading, clean, with absolutely no marketing fluff.",
      "deal-hunter": "High-Value Bargain. Emphasizes total retail investment vs. bargain asking price, highlighting how much money the buyer is saving.",
    };

    const upgradesSummary = upgrades.length > 0
      ? upgrades.map(u => `- ${u.partName} (investment value: €${u.cost.toFixed(2)})`).join("\n")
      : "No specific components highlighted as upgrades, but fully serviced and tuned.";

    const systemPrompt = `You are VeloStack AI Listing Writer, an expert bike seller and high-converting classified copywriter.
Your goal is to generate an optimized, engaging, and professional classified listing for ${platformLabels[platform]} to sell a high-quality bicycle.

TONE SETTING:
You must write in the "${tone}" tone: ${toneDescriptions[tone]}

CRITICAL RESTRICTION:
Write the output in raw plain text format suitable for direct copying and pasting.
- DO NOT output any markdown tags (no #, no ##, no ###).
- DO NOT use markdown bolding (do not output **text**).
- DO NOT use markdown italics (*text*) or blockquotes (>).
- DO NOT output HTML.
- DO NOT use markdown list hyphens like "-". Use standard plain bullet characters like "•" or "  " if listing specs.
- Use clean CAPITAL LETTERS for section headers (e.g. CATCHY HEADLINE, OVERVIEW, CORE SPECIFICATIONS, RECENT MAINTENANCE AND UPGRADES, CONDITION VERDICT, COLLECTION DETAILS).
- Use double linebreaks (\n\n) to create clear visual spacing between sections.

The copy must be highly attractive, clean, professional, and entirely ready to paste directly into the classified description box.`;

    const userPrompt = `
Bicycle Name: ${bikeName}
Color: ${color || "Not specified"}
Frame Size: ${frameSize || "Not specified"}
Drivetrain Speeds: ${speedsCount || "Not specified"}
Asking Price: €${targetPrice.toFixed(2)}
Overall Wear Condition: ${wearCondition || "Ready to ride, excellent condition"}

Upgraded Components Installed:
${upgradesSummary}

Generate the classified listing following the format below:
1. A catchy search-optimized headline (e.g., "Beautiful Shimano-Equipped Specialized Allez - Size M - Ready to Ride").
2. A warm, engaging overview/hook.
3. Core Specifications (Frame size, drivetrain speeds, color, etc.) in a clear list.
4. Recent Upgrades & Maintenances (Crucial for value - highlight the upgraded components listed above and explain how they translate to worry-free riding).
5. Overall Condition Verdict.
6. Collection & Contact Details (mentioning pickup and a friendly call to action).
`.trim();

    const { text } = await generateText({
      model,
      system: systemPrompt,
      prompt: userPrompt,
    });

    return NextResponse.json({ listingText: text });
  } catch (err: any) {
    console.error("Listing generator API error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
