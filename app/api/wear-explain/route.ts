import { NextRequest, NextResponse } from "next/server";
import { generateText } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

export async function POST(req: NextRequest) {
  try {
    const { wearResult, recentRides, partProfile } = await req.json();

    const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ? google("gemini-2.5-flash")
      : groq("llama-3.3-70b-versatile");

    const rideSummary = recentRides.slice(0, 10).map((r: any) =>
      `${r.date}: ${r.distanceKm}km, ${r.elevationM}m gain, terrain=${r.terrain}, condition=${r.condition}, effort=${r.effort}`
    ).join("\n");

    const { text } = await generateText({
      model,
      system: "You are a bicycle mechanic AI assistant. Write 2–3 sentences explaining the current wear status of a specific bike component in plain English. Be specific, reference the rider's actual ride data, and give a concrete action recommendation. Sound like a knowledgeable mechanic, not a robot.",
      prompt: `
Component: ${partProfile.modelName} (${partProfile.partType})
Material: ${partProfile.material}
Health: ${wearResult.healthPercent}% (${wearResult.status})
km since replacement: ${wearResult.kmSinceReplacement} km
Estimated remaining: ${wearResult.forecastKmLow}–${wearResult.forecastKmHigh} km
Wear score: ${(wearResult.rawWearScore * 100).toFixed(0)}% of lifespan consumed
Part notes: ${partProfile.notes}

Recent rides (last 10):
${rideSummary}

Write a 2–3 sentence mechanic's explanation of why this part is wearing at this rate and what the rider should do.`.trim(),
    });

    return NextResponse.json({ explanation: text });
  } catch (err: any) {
    console.error("wear-explain error:", err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
