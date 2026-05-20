import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { DEMO_CASES } from "@/lib/mechanic-types";

// Zod validation schema for incoming visual diagnosis requests
const MechanicPayloadSchema = z.object({
  imageBase64: z.string().optional(),
  componentType: z.string().min(1, "Component type must not be empty"),
  calibrationScale: z.number().optional(), // px/mm
  measuredLengthPx: z.number().optional(),
});

export async function POST(req: NextRequest) {
  try {
    // 1. Parse and validate payload
    const body = await req.json();
    const result = MechanicPayloadSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        { error: "Invalid request payload", details: result.error.format() },
        { status: 400 }
      );
    }

    const { componentType, calibrationScale, measuredLengthPx } = result.data;

    // 2. Simulate AI Vision & OpenCV logic based on component type
    let matchedCase = DEMO_CASES.find(
      (c) =>
        c.id === componentType ||
        c.presetDiagnosis.detectedComponent.toLowerCase().includes(componentType.toLowerCase())
    );

    // Fallback default case if no direct match
    if (!matchedCase) {
      matchedCase = DEMO_CASES[0]; // Fallback to chain wear
    }

    // Clone case to adjust dynamic measurements if calibration is provided
    const diagnosis = { ...matchedCase.presetDiagnosis };

    if (calibrationScale && measuredLengthPx && calibrationScale > 0) {
      const physicalLengthMm = parseFloat((measuredLengthPx / calibrationScale).toFixed(2));
      
      if (componentType.includes("chain")) {
        // Chain stretch calculation (Standard 10 links = 127.0mm nominal)
        const nominalLength = 127.0;
        const elongation = parseFloat((physicalLengthMm - nominalLength).toFixed(2));
        const wearPercent = parseFloat(((elongation / nominalLength) * 100).toFixed(2));
        
        diagnosis.measuredMetrics = `Draggable Ruler Measurement: ${physicalLengthMm}mm over 10 links (${elongation}mm elongation). Calculated stretch: ${wearPercent}%.`;
        
        if (wearPercent >= 0.75) {
          diagnosis.severity = "critical";
          diagnosis.issueFound = `Excessive Chain Stretch (${wearPercent}% wear) - CRITICAL`;
          diagnosis.description = `Draggable visual calibration confirmed the chain stretch is at ${wearPercent}%. This exceeds the maximum 0.75% mechanical wear limit for 11-speed systems. Replace the chain immediately to prevent damage to the rear cassette.`;
        } else if (wearPercent >= 0.5) {
          diagnosis.severity = "high";
          diagnosis.issueFound = `Moderate Chain Stretch (${wearPercent}% wear) - HIGH`;
          diagnosis.description = `Draggable visual calibration calculated chain stretch at ${wearPercent}%. The chain is approaching the end of its service life. Prepare to replace it soon.`;
        } else {
          diagnosis.severity = "low";
          diagnosis.issueFound = `Healthy Chain (${wearPercent}% wear) - OK`;
          diagnosis.description = `Chain stretch measured at ${wearPercent}%, which is well within the acceptable 0.5% limit. No replacement required at this time.`;
        }
      } else {
        diagnosis.measuredMetrics = `Draggable Ruler Measurement: Calibrated distance is ${physicalLengthMm}mm.`;
      }
    }

    // 3. Return structured response matching the data contract
    return NextResponse.json({
      success: true,
      boundingBoxes: matchedCase.defaultBboxes,
      diagnosis: diagnosis,
    });

  } catch (err: any) {
    console.error("api/mechanic error:", err);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}
