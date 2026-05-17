import { NextRequest, NextResponse } from "next/server";
import { fetchLiveMarketPrice } from "@/lib/pricing";
import { z } from "zod";

const schema = z.object({
  name: z.string().min(2),
  type: z.string().min(2),
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

    const { name, type } = parsed.data;
    const priceData = await fetchLiveMarketPrice(name, type);
    
    return NextResponse.json(priceData);
  } catch (err: any) {
    console.error("Pricing Error:", err);
    return NextResponse.json({ error: "Pricing failed", details: err.message }, { status: 500 });
  }
}
