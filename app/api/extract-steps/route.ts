import { NextRequest, NextResponse } from "next/server";
import { generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { createOpenAI } from "@ai-sdk/openai";
import { z } from "zod";

const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Helper to extract YouTube video ID
function extractVideoId(url: string): string | null {
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/)([^#\&\?]*).*/;
  const match = url.match(regExp);
  return match && match[2].length === 11 ? match[2] : null;
}

// Scrape public transcripts from YouTube watch page HTML
async function getYouTubeTranscript(videoId: string): Promise<string> {
  const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;
  const response = await fetch(videoUrl, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept-Language": "en-US,en;q=0.9",
    },
  });
  const html = await response.text();

  const regex = /ytInitialPlayerResponse\s*=\s*({[\s\S]+?});/;
  const match = html.match(regex);
  if (!match) {
    throw new Error("Could not parse YouTube player data");
  }

  const playerResponse = JSON.parse(match[1]);
  const captionTracks =
    playerResponse?.captions?.playerCaptionsTracklistRenderer?.captionTracks;
  if (!captionTracks || captionTracks.length === 0) {
    throw new Error("No captions or transcripts available on this video.");
  }

  // Pick English first, or auto-generated, or the first available caption track
  const englishTrack =
    captionTracks.find(
      (track: any) => track.languageCode === "en" || track.vssId?.includes(".en")
    ) || captionTracks[0];

  const captionUrl = englishTrack.baseUrl;
  const captionRes = await fetch(captionUrl);
  const captionXml = await captionRes.text();

  const textRegex = /<text[^>]*>([\s\S]*?)<\/text>/g;
  let textMatch;
  const lines: string[] = [];
  while ((textMatch = textRegex.exec(captionXml)) !== null) {
    const decoded = textMatch[1]
      .replace(/&amp;/g, "&")
      .replace(/&lt;/g, "<")
      .replace(/&gt;/g, ">")
      .replace(/&quot;/g, '"')
      .replace(/&#39;/g, "'");
    lines.push(decoded);
  }

  if (lines.length === 0) {
    throw new Error("Transcript was empty.");
  }
  return lines.join(" ");
}

export async function POST(req: NextRequest) {
  try {
    const { youtubeUrl } = await req.json();

    if (!youtubeUrl) {
      return NextResponse.json(
        { error: "YouTube URL is required" },
        { status: 400 }
      );
    }

    const videoId = extractVideoId(youtubeUrl);
    if (!videoId) {
      return NextResponse.json(
        { error: "Invalid YouTube URL" },
        { status: 400 }
      );
    }

    let transcript = "";
    try {
      transcript = await getYouTubeTranscript(videoId);
    } catch (err: any) {
      console.warn("Failed to fetch transcript, falling back to topic-based generation:", err.message);
      // We will supply video title or description if transcript fetch fails, or let AI generate based on the video's apparent topic
      transcript = `No transcript available. Create a default high-quality bicycle repair checklist based on a typical YouTube tutorial matching this URL: ${youtubeUrl}`;
    }

    const model = process.env.GOOGLE_GENERATIVE_AI_API_KEY
      ? google("gemini-2.5-flash")
      : groq("llama-3.3-70b-versatile");

    const schema = z.object({
      title: z.string().describe("Human-readable repair title"),
      difficulty: z.enum(["beginner", "intermediate", "advanced"]),
      estimated_minutes: z.number().describe("Total estimated repair time in minutes"),
      tools: z.array(z.string()).describe("List of tools needed"),
      parts: z.array(z.string()).describe("List of parts needed"),
      steps: z.array(
        z.object({
          number: z.number(),
          action: z.string().describe("Checklist item action step"),
          tip: z.string().optional().describe("Pro mechanic tip"),
          warning: z.string().optional().describe("Warning about potential damage or safety"),
        })
      ),
      skills_learned: z.array(z.string()).describe("Key skills gained"),
      related_searches: z.array(z.string()).describe("Kleinanzeigen search terms to find practice bikes"),
    });

    const systemPrompt = `You are a professional bike mechanic. Analyze this repair tutorial transcript.
Extract and return VALID JSON ONLY matching the requested schema. Ensure the instructions are highly specific, clean, and structured.`;

    const { object } = await generateObject({
      model,
      schema,
      system: systemPrompt,
      prompt: `Analyze this transcript or URL context:\n\n${transcript}\n\nURL: ${youtubeUrl}`,
    });

    return NextResponse.json({ ...object, videoId });
  } catch (err: any) {
    console.error("Extraction error:", err);
    return NextResponse.json(
      { error: "Failed to extract repair steps", details: err.message },
      { status: 500 }
    );
  }
}
