export interface BoundingBox {
  id: string;
  label: string;
  x: number; // Percentage value (0-100) or pixel absolute
  y: number; // Percentage value (0-100) or pixel absolute
  width: number;
  height: number;
  confidence: number;
}

export interface MechanicDiagnosis {
  id: string;
  detectedComponent: string;
  issueFound: string;
  severity: "low" | "medium" | "high" | "critical";
  confidence: number;
  description: string;
  measuredMetrics?: string;
  toolsRequired: string[];
  partsRequired: string[];
  repairSteps: {
    number: number;
    action: string;
    tip?: string;
    warning?: string;
  }[];
  skillsLearned: string[];
  estimatedCostRangeEur: string;
  createdAt: string;
}

export interface CalibrationState {
  pixelDistance: number;
  physicalDistance: number; // in mm
  scale: number; // px/mm ratio
  referenceType: "coin" | "card" | "custom";
}

export interface DemoCase {
  id: string;
  title: string;
  description: string;
  imageUrl: string;
  defaultBboxes: BoundingBox[];
  presetDiagnosis: MechanicDiagnosis;
}

// Structured Mock Database for Demo Cases
export const DEMO_CASES: DemoCase[] = [
  {
    id: "chain-wear",
    title: "11-Speed Drivetrain Chain Wear",
    description: "Visual analysis of chain link elongation and roller wear across 10 links.",
    imageUrl: "https://images.unsplash.com/photo-1485965120184-e220f721d03e?auto=format&fit=crop&q=80&w=800", // High quality bike drivetrain photo
    defaultBboxes: [
      {
        id: "bbox-chain-1",
        label: "Bicycle Chain (Worn)",
        x: 15,
        y: 35,
        width: 70,
        height: 25,
        confidence: 0.94,
      },
      {
        id: "bbox-cassette-1",
        label: "Rear Cassette (Acceptable)",
        x: 45,
        y: 20,
        width: 35,
        height: 45,
        confidence: 0.89,
      }
    ],
    presetDiagnosis: {
      id: "diag-chain-wear",
      detectedComponent: "11-Speed Bicycle Chain",
      issueFound: "Excessive Chain Stretch (Roller & Pin Wear)",
      severity: "high",
      confidence: 0.94,
      description: "Analysis of the chain links reveals significant elongation. Over 10 links, the calibrated stretch indicates 0.78% wear. A chain worn beyond 0.75% should be replaced immediately to prevent accelerated wear on the cassette and chainrings.",
      measuredMetrics: "Measured stretch: 0.78% over 10 links (1.0mm elongation). Limit is 0.75%.",
      toolsRequired: ["Chain Wear Indicator Tool", "Chain Breaker Tool", "Master Link Pliers"],
      partsRequired: ["11-Speed Chain (e.g., Shimano HG601 or KMC X11)", "11-Speed Quick Link"],
      repairSteps: [
        {
          number: 1,
          action: "Shift to the smallest chainring and smallest cassette cog to release chain tension.",
          tip: "This makes it significantly easier to break and remove the chain without it snapping violently."
        },
        {
          number: 2,
          action: "Locate the quick link and use master link pliers to compress and unlock it.",
          warning: "Do not reuse single-use quick links. Always use a fresh quick link when installing a new chain."
        },
        {
          number: 3,
          action: "Thread the new chain through the front derailleur, over the cassette, and through the rear derailleur pulley wheels.",
          warning: "Ensure the chain does not rub against the metal tab between the rear derailleur cage pulleys."
        },
        {
          number: 4,
          action: "Measure the new chain against the old one or use the 'big-to-big' sizing method, and break it to length.",
          tip: "For full suspension bikes, compress the suspension fully to account for chain growth before cutting."
        },
        {
          number: 5,
          action: "Install the new quick link, engage it, and apply downward pedal pressure to snap it locked.",
          tip: "Listen for an audible 'click' confirming the link is safely seated."
        }
      ],
      skillsLearned: ["Chain sizing and cutting", "Rear derailleur routing logic", "Master link installation"],
      estimatedCostRangeEur: "€25 - €45",
      createdAt: new Date().toISOString()
    }
  },
  {
    id: "cassette-wear",
    title: "11-34T Cassette Sprocket Profile",
    description: "Detailed zoom on rear cog tooth profile to diagnose slipping gears.",
    imageUrl: "https://images.unsplash.com/photo-1541614101331-1a5a3a194e92?auto=format&fit=crop&q=80&w=800", // Detailed bike gears photo
    defaultBboxes: [
      {
        id: "bbox-cassette-2",
        label: "Rear Cassette (Severely Worn)",
        x: 20,
        y: 15,
        width: 60,
        height: 70,
        confidence: 0.91,
      },
      {
        id: "bbox-derailleur-1",
        label: "Rear Derailleur (Aligned)",
        x: 60,
        y: 45,
        width: 30,
        height: 45,
        confidence: 0.88,
      }
    ],
    presetDiagnosis: {
      id: "diag-cassette-wear",
      detectedComponent: "Rear Cassette (11-Speed, 11-34T)",
      issueFound: "Sprocket Tooth Deformation ('Shark-Finning')",
      severity: "critical",
      confidence: 0.91,
      description: "The 15T and 17T cogs show advanced metal deformation. The trailing edges of the teeth are thin and hook-like ('shark-finned'), which explains the chain skipping under load. Installing a new chain on this cassette without replacing it will result in severe skipping.",
      measuredMetrics: "Tooth pitch profile wear: Critical deformation detected on cogs 4, 5, and 6.",
      toolsRequired: ["Cassette Lockring Tool (e.g., Park Tool FR-5.2)", "Chain Whip Tool", "Large Adjustable Wrench or 1\" Socket"],
      partsRequired: ["11-Speed Cassette (11-34T Shim./SRAM compatible)"],
      repairSteps: [
        {
          number: 1,
          action: "Remove the rear wheel from the frame and remove the quick-release skewer or thru-axle.",
          tip: "Lay the wheel flat on a clean rag with the cassette facing upwards."
        },
        {
          number: 2,
          action: "Wrap the chain whip around the middle cogs of the cassette to hold it in place, then insert the lockring tool.",
          warning: "Make sure the chain whip pins are securely engaged in the cog teeth to prevent slipping."
        },
        {
          number: 3,
          action: "Turn the adjustable wrench counter-clockwise on the lockring tool while holding the chain whip clockwise.",
          tip: "It will make a loud clicking noise as the lockring knurls release — this is normal."
        },
        {
          number: 4,
          action: "Slide the old cassette off the freehub body, clean the splines, and apply a thin layer of grease.",
          tip: "Notice the wide spline on the freehub body — the new cassette will only slide on in one specific alignment."
        },
        {
          number: 5,
          action: "Slide the new cassette onto the freehub, thread the lockring by hand, and torque to 40Nm using the lockring tool.",
          warning: "Do not cross-thread the lockring. Threading it by hand first prevents damage to aluminum freehubs."
        }
      ],
      skillsLearned: ["Cassette removal and torque specifications", "Freehub cleaning and maintenance", "Mechanical lever usage"],
      estimatedCostRangeEur: "€40 - €85",
      createdAt: new Date().toISOString()
    }
  },
  {
    id: "disc-brake",
    title: "160mm Hydraulic Disc Brake Assembly",
    description: "Analysis of disc caliper alignment, pad thickness, and rotor surface glazing.",
    imageUrl: "https://images.unsplash.com/photo-1507136566006-cfc505b114fc?auto=format&fit=crop&q=80&w=800", // Bicycle wheel disc brake closeup
    defaultBboxes: [
      {
        id: "bbox-caliper-1",
        label: "Brake Caliper (Misaligned)",
        x: 35,
        y: 25,
        width: 30,
        height: 35,
        confidence: 0.87,
      },
      {
        id: "bbox-rotor-1",
        label: "160mm Disc Rotor (Glazed)",
        x: 10,
        y: 10,
        width: 75,
        height: 80,
        confidence: 0.95,
      }
    ],
    presetDiagnosis: {
      id: "diag-disc-brake",
      detectedComponent: "Shimano Hydraulic Caliper + 160mm Rotor",
      issueFound: "Disc Brake Glazing & Caliper Misalignment",
      severity: "medium",
      confidence: 0.87,
      description: "Visual inspection of the rotor reveals a dark, mirror-like polished surface, indicating severe glazing from excessive heat. Furthermore, the brake pads are rubbing unevenly due to a slightly misaligned caliper body, leading to squealing and loss of braking power.",
      measuredMetrics: "Rotor surface reflectivity: High (glazed). Pad spacing: Uneven (left-biased).",
      toolsRequired: ["5mm Hex / Allen Key", "Disc Brake Rotor Truing Fork", "Isopropyl Alcohol (99%)", "Clean Sandpaper (120 Grit)"],
      partsRequired: ["Resin Brake Pads (e.g., Shimano B05S-RX)"],
      repairSteps: [
        {
          number: 1,
          action: "Loosen the two 5mm caliper mounting bolts until the caliper can wiggle freely.",
          tip: "Do not remove the bolts entirely; just back them off 2-3 full turns."
        },
        {
          number: 2,
          action: "Remove the wheel, slide out the brake pads, and inspect them. If glazed or contaminated, replace or sand them.",
          warning: "Never squeeze the brake lever while the wheel or pads are removed, as the pistons will over-extend."
        },
        {
          number: 3,
          action: "Clean the disc rotor thoroughly with Isopropyl Alcohol and sand the braking surface in a cross-hatch pattern.",
          tip: "Sanding removes the glazed layer, exposing fresh steel for the pads to bite into."
        },
        {
          number: 4,
          action: "Reinstall pads and wheel. Squeeze the brake lever tightly and hold it while tightening the caliper bolts.",
          tip: "This automatically centers the caliper body over the rotor in most cases."
        },
        {
          number: 5,
          action: "Spin the wheel and listen. If rubbing continues, visually align the pads by eye and tighten carefully.",
          warning: "Ensure your fingers are clear of the rotating rotor to avoid severe pinches or cuts."
        }
      ],
      skillsLearned: ["Brake pad inspection and deglazing", "Hydraulic caliper centering", "Rotor cleaning protocols"],
      estimatedCostRangeEur: "€10 - €25",
      createdAt: new Date().toISOString()
    }
  }
];
