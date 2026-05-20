import type { BikeFrameSpecs, MountedPartsState, CompatibilityIssue, PartsBinItem, BikeType } from "./tracker-types";

// Dynamic defaults based on bike types
export const FRAME_PRESETS: Record<BikeType, BikeFrameSpecs> = {
  road: {
    bottomBracketShell: "BSA",
    rearAxle: "135mm QR",
    brakeMount: "Rim",
    maxTireClearance: 28,
    wheelSize: "700c",
    targetSpeeds: 11,
  },
  gravel: {
    bottomBracketShell: "BB86/92",
    rearAxle: "12x142mm TA",
    brakeMount: "Flat Mount",
    maxTireClearance: 42,
    wheelSize: "700c",
    targetSpeeds: 11,
  },
  mtb: {
    bottomBracketShell: "BSA",
    rearAxle: "12x148mm Boost",
    brakeMount: "Post Mount",
    maxTireClearance: 65,
    wheelSize: "29 inch",
    targetSpeeds: 12,
  },
  city: {
    bottomBracketShell: "BSA",
    rearAxle: "135mm QR",
    brakeMount: "Rim",
    maxTireClearance: 38,
    wheelSize: "700c",
    targetSpeeds: 8,
  },
  ebike: {
    bottomBracketShell: "T47",
    rearAxle: "12x148mm Boost",
    brakeMount: "Post Mount",
    maxTireClearance: 60,
    wheelSize: "27.5 inch",
    targetSpeeds: 11,
  },
};

/**
 * Parses tire width in mm from a model name string.
 * Supporting formats like "700x38c", "29x2.4", "27.5x2.6", "700x38", "38mm", "35c".
 */
export function parseTireWidth(brandModel: string): number {
  const cleaned = brandModel.toLowerCase();
  
  // Match patterns like 700x38c, 29x2.4, etc.
  const crossMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*[xX]\s*(\d+(?:\.\d+)?)/);
  if (crossMatch) {
    const val = parseFloat(crossMatch[2]);
    if (val < 10) {
      // It's in inches (e.g. 2.4), convert to mm
      return Math.round(val * 25.4);
    }
    return Math.round(val);
  }

  // Look for standalone numbers followed by mm or c (e.g. 40mm, 35c)
  const singleMatch = cleaned.match(/(\d+(?:\.\d+)?)\s*(?:mm|c)\b/);
  if (singleMatch) {
    const val = parseFloat(singleMatch[1]);
    if (val < 10) {
      return Math.round(val * 25.4);
    }
    return Math.round(val);
  }

  // Fallback default
  return 30;
}

/**
 * Detects Bottom Bracket standard from a model name.
 */
export function detectBBStandard(brandModel: string): "BSA" | "BB30" | "BB86/92" | "T47" | "Unknown" {
  const cleaned = brandModel.toUpperCase();
  if (cleaned.includes("BSA") || cleaned.includes("THREADED") || cleaned.includes("ENGLISH") || cleaned.includes("OUTBOARD")) return "BSA";
  if (cleaned.includes("BB30") || cleaned.includes("PF30") || cleaned.includes("PRESSFIT 30")) return "BB30";
  if (cleaned.includes("BB86") || cleaned.includes("BB92") || cleaned.includes("PRESSFIT") || cleaned.includes("PRESS FIT") || cleaned.includes("PF86") || cleaned.includes("PF92")) return "BB86/92";
  if (cleaned.includes("T47")) return "T47";
  return "Unknown";
}

/**
 * Detects Wheel size from a model name.
 */
export function detectWheelSize(brandModel: string): "700c" | "650b" | "29 inch" | "27.5 inch" | "26 inch" | "Unknown" {
  const cleaned = brandModel.toLowerCase();
  if (cleaned.includes("700c") || cleaned.includes("700")) return "700c";
  if (cleaned.includes("650b") || cleaned.includes("27.5-inch") || cleaned.includes("27.5")) return "27.5 inch";
  if (cleaned.includes("29er") || cleaned.includes("29 inch") || cleaned.includes("29\"") || cleaned.includes("29-inch") || cleaned.includes("29")) return "29 inch";
  if (cleaned.includes("26 inch") || cleaned.includes("26\"") || cleaned.includes("26-inch") || cleaned.includes("26")) return "26 inch";
  if (cleaned.includes("650") || cleaned.includes("27.5 inch")) return "27.5 inch";
  return "Unknown";
}

/**
 * Validates the currently mounted parts against the frame specifications.
 */
export function validateBuild(
  specs: BikeFrameSpecs,
  mounted: MountedPartsState,
  partsBin: PartsBinItem[]
): CompatibilityIssue[] {
  const issues: CompatibilityIssue[] = [];

  // Helper to find a parts bin item by ID
  const getPart = (id?: string) => partsBin.find(p => p.id === id);

  const chain = getPart(mounted.chain);
  const cassette = getPart(mounted.cassette);
  const shifter = getPart(mounted.shifter);
  const bottomBracket = getPart(mounted.bottomBracket);
  const wheelset = getPart(mounted.wheelset);
  const rotor = getPart(mounted.rotor);
  const tire = getPart(mounted.tire);

  // 1. DRIVETRAIN SPEEDS MATCHING
  if (cassette) {
    if (cassette.compatSpeeds && cassette.compatSpeeds !== specs.targetSpeeds) {
      issues.push({
        id: "drivetrain-speeds-frame",
        severity: "warning",
        component: "Cassette",
        message: `Cassette speed (${cassette.compatSpeeds}s) does not match frame design target (${specs.targetSpeeds}s).`,
        alternativeQuery: `${specs.targetSpeeds}-speed cassette`,
      });
    }
  }

  if (chain && cassette) {
    if (chain.compatSpeeds && cassette.compatSpeeds && chain.compatSpeeds !== cassette.compatSpeeds) {
      issues.push({
        id: "drivetrain-chain-cassette",
        severity: "error",
        component: "Chain",
        message: `Chain speed (${chain.compatSpeeds}s) does not match cassette speed (${cassette.compatSpeeds}s).`,
        alternativeQuery: `${cassette.compatSpeeds}-speed chain`,
      });
    }
  } else if (chain) {
    if (chain.compatSpeeds && chain.compatSpeeds !== specs.targetSpeeds) {
      issues.push({
        id: "drivetrain-chain-frame",
        severity: "warning",
        component: "Chain",
        message: `Chain speed (${chain.compatSpeeds}s) does not match frame target speeds (${specs.targetSpeeds}s).`,
        alternativeQuery: `${specs.targetSpeeds}-speed chain`,
      });
    }
  }

  if (shifter && cassette) {
    if (shifter.compatSpeeds && cassette.compatSpeeds && shifter.compatSpeeds !== cassette.compatSpeeds) {
      issues.push({
        id: "drivetrain-shifter-cassette",
        severity: "error",
        component: "Shifter",
        message: `Shifter pull-ratio (${shifter.compatSpeeds}s) does not match cassette speed (${cassette.compatSpeeds}s).`,
        alternativeQuery: `${cassette.compatSpeeds}-speed shifter`,
      });
    }
  } else if (shifter) {
    if (shifter.compatSpeeds && shifter.compatSpeeds !== specs.targetSpeeds) {
      issues.push({
        id: "drivetrain-shifter-frame",
        severity: "warning",
        component: "Shifter",
        message: `Shifter speed (${shifter.compatSpeeds}s) does not match frame design target (${specs.targetSpeeds}s).`,
        alternativeQuery: `${specs.targetSpeeds}-speed shifter`,
      });
    }
  }

  // 2. BOTTOM BRACKET SHELL MATCHING
  if (bottomBracket) {
    const bbStd = detectBBStandard(bottomBracket.brandModel);
    if (bbStd !== "Unknown" && bbStd !== specs.bottomBracketShell) {
      // It's a clash!
      let adapterExplanation = "";
      let query = "";
      if (specs.bottomBracketShell === "BB30" && bbStd === "BSA") {
        adapterExplanation = " BSA bottom brackets cannot fit directly inside BB30 press-fit shells without external adapter cups.";
        query = "BB30 to BSA bottom bracket adapter";
      } else if (specs.bottomBracketShell === "BB86/92" && bbStd === "BSA") {
        adapterExplanation = " Threaded BSA BBs cannot fit press-fit BB86/BB92 shells. You need a pressfit BB or conversion sleeve.";
        query = "BB86 to BSA adapter cup";
      } else if (specs.bottomBracketShell === "T47" && bbStd === "BSA") {
        adapterExplanation = " T47 shells require larger diameter T47 cups, threaded BSA will not match thread pitches.";
        query = "T47 bottom bracket";
      }

      issues.push({
        id: "bb-shell-mismatch",
        severity: "error",
        component: "Bottom Bracket",
        message: `BB standard (${bbStd}) does not match frame bottom bracket shell standard (${specs.bottomBracketShell}).${adapterExplanation}`,
        alternativeQuery: query || `${specs.bottomBracketShell} bottom bracket`,
      });
    }
  }

  // 3. WHEELSET SIZE MATCHING
  if (wheelset) {
    const wheelSize = detectWheelSize(wheelset.brandModel);
    if (wheelSize !== "Unknown" && wheelSize !== specs.wheelSize) {
      issues.push({
        id: "wheelset-size-mismatch",
        severity: "error",
        component: "Wheelset",
        message: `Wheelset size (${wheelSize}) does not match frame design size (${specs.wheelSize}).`,
        alternativeQuery: `${specs.wheelSize} wheelset`,
      });
    }
  }

  // 4. TIRE WIDTH CLEARANCE
  if (tire) {
    const tireWidth = parseTireWidth(tire.brandModel);
    if (tireWidth > specs.maxTireClearance) {
      issues.push({
        id: "tire-clearance-exceeded",
        severity: "error",
        component: "Tires",
        message: `Tire width (${tireWidth}mm) exceeds the maximum frame tire clearance of ${specs.maxTireClearance}mm.`,
        alternativeQuery: `${specs.wheelSize === "29 inch" ? "29" : specs.wheelSize === "27.5 inch" ? "27.5" : "700"}x${specs.maxTireClearance - 2} tire`,
      });
    }
  }

  // 5. BRAKE MOUNTING & ROTORS
  if (specs.brakeMount === "Rim") {
    if (rotor) {
      issues.push({
        id: "rim-brake-has-rotor",
        severity: "error",
        component: "Brakes",
        message: `Frame uses traditional Rim Brakes. A disc brake rotor cannot be mounted on the frame.`,
      });
    }
    if (wheelset) {
      const isDiscWheel = wheelset.brandModel.toLowerCase().includes("disc") ||
        wheelset.brandModel.toLowerCase().includes("centerlock") ||
        wheelset.brandModel.toLowerCase().includes("6-bolt");
      if (isDiscWheel) {
        issues.push({
          id: "rim-brake-disc-wheels",
          severity: "warning",
          component: "Wheelset",
          message: `Rim brake frame requires a machined braking surface track, but this wheelset appears disc-specific.`,
          alternativeQuery: `${specs.wheelSize} rim brake wheelset`,
        });
      }
    }
  } else {
    // Disc brakes frame (Flat Mount or Post Mount)
    if (wheelset && rotor) {
      const wheelModel = wheelset.brandModel.toLowerCase();
      const rotorModel = rotor.brandModel.toLowerCase();
      
      const wheelIsCenterlock = wheelModel.includes("centerlock") || wheelModel.includes("cl");
      const wheelIs6Bolt = wheelModel.includes("6-bolt") || wheelModel.includes("6b") || wheelModel.includes("six bolt");
      
      const rotorIsCenterlock = rotorModel.includes("centerlock") || rotorModel.includes("cl");
      const rotorIs6Bolt = rotorModel.includes("6-bolt") || rotorModel.includes("6b") || rotorModel.includes("six bolt");

      if (wheelIsCenterlock && rotorIs6Bolt) {
        issues.push({
          id: "rotor-wheel-mount-cl-6b",
          severity: "warning",
          component: "Brakes",
          message: `Rotor mounting style (6-Bolt) does not match Centerlock wheel hub. You will need a Centerlock-to-6-Bolt adapter.`,
          alternativeQuery: "Centerlock to 6-bolt rotor adapter",
        });
      } else if (wheelIs6Bolt && rotorIsCenterlock) {
        issues.push({
          id: "rotor-wheel-mount-6b-cl",
          severity: "error",
          component: "Brakes",
          message: `Centerlock rotor cannot be mounted on a 6-Bolt wheelset hub. Adapters only exist for 6-Bolt rotors on Centerlock hubs.`,
          alternativeQuery: "6-bolt brake rotor",
        });
      }
    }
  }

  return issues;
}
