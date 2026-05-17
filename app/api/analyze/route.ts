import { NextRequest, NextResponse } from "next/server";
import { analyzeListing } from "@/lib/analyzer";
import { z } from "zod";

const schema = z.object({
  title: z.string().min(3),
  description: z.string(),
  askingPrice: z.number().positive(),
  comparablePrice: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const parsed = schema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid input", details: parsed.error.flatten() },
        { status: 400 }
      );
    }

    // Call the newly async analyzeListing
    const result = await analyzeListing(parsed.data);
    return NextResponse.json(result);
  } catch (err: any) {
    console.error("Analysis Error:", err);
    return NextResponse.json({ error: "Analysis failed", details: err.message }, { status: 500 });
  }
}
