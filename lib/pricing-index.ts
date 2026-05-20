/**
 * VeloStack — Kelley Blue Book Pricing Index & Statistical Aggregator Engine
 * Calculates percentiles and confidence metrics for scraped/harvested transaction data.
 */

export interface PricingStats {
  prices: number[];
  bargainPrice: number;   // 15th percentile
  medianPrice: number;    // 50th percentile
  topPrice: number;       // 85th percentile
  sampleSize: number;
  confidence: "high" | "medium" | "low";
}

export interface SoldTransaction {
  price: number;
  platform: string;
  date: string;
  condition: "Pristine" | "Good" | "Fair" | "Needs Service" | string;
  title: string;
}

/**
 * Calculates statistical clearings (15th, 50th, and 85th percentiles)
 * and confidence scores across an array of transaction prices.
 */
export function calculatePricingStats(transactions: SoldTransaction[]): PricingStats {
  const prices = transactions
    .map(tx => tx.price)
    .filter(price => typeof price === "number" && !isNaN(price) && price > 0)
    .sort((a, b) => a - b);

  const sampleSize = prices.length;

  if (sampleSize === 0) {
    return {
      prices: [],
      bargainPrice: 0,
      medianPrice: 0,
      topPrice: 0,
      sampleSize: 0,
      confidence: "low"
    };
  }

  // Calculate percentiles
  const getPercentile = (p: number): number => {
    if (sampleSize === 1) return prices[0];
    const index = (sampleSize - 1) * p;
    const lower = Math.floor(index);
    const upper = Math.ceil(index);
    const weight = index - lower;
    return Math.round(prices[lower] * (1 - weight) + prices[upper] * weight);
  };

  const bargainPrice = getPercentile(0.15);
  const medianPrice = getPercentile(0.50);
  const topPrice = getPercentile(0.85);

  // Confidence based on sample volume
  let confidence: "high" | "medium" | "low" = "low";
  if (sampleSize > 15) {
    confidence = "high";
  } else if (sampleSize >= 5) {
    confidence = "medium";
  }

  return {
    prices,
    bargainPrice,
    medianPrice,
    topPrice,
    sampleSize,
    confidence
  };
}
