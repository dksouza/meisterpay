const cachedRates: { [key: string]: { rate: number; timestamp: number } } = {};
const CACHE_DURATION_MS = 10 * 60 * 1000; // 10 minutes

const FALLBACK_RATES: Record<string, number> = {
  USD: 5.60,
  EUR: 6.10,
  BRL: 1.0,
};

/**
 * Gets the exchange rate from the given currency to BRL (Reais).
 * Uses in-memory cache and AwesomeAPI with static fallbacks.
 */
export async function getExchangeRateToBRL(currency: string = "BRL"): Promise<number> {
  const curr = (currency || "BRL").trim().toUpperCase();
  if (curr === "BRL") return 1.0;

  const now = Date.now();
  if (cachedRates[curr] && (now - cachedRates[curr].timestamp < CACHE_DURATION_MS)) {
    return cachedRates[curr].rate;
  }

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    const response = await fetch(`https://economia.awesomeapi.com.br/json/last/${curr}-BRL`, {
      signal: controller.signal,
      cache: "no-store",
    });
    clearTimeout(timeoutId);

    if (response.ok) {
      const data = await response.json();
      const pairKey = `${curr}BRL`;
      if (data[pairKey] && data[pairKey].bid) {
        const rate = parseFloat(data[pairKey].bid);
        if (!isNaN(rate) && rate > 0) {
          cachedRates[curr] = { rate, timestamp: now };
          return rate;
        }
      }
    }
  } catch (error) {
    console.error(`[CURRENCY] Error fetching exchange rate for ${curr}-BRL:`, error);
  }

  const fallback = FALLBACK_RATES[curr] || 1.0;
  cachedRates[curr] = { rate: fallback, timestamp: now };
  return fallback;
}

/**
 * Converts a given amount in a specific currency to BRL (Reais).
 */
export async function convertToBRL(amount: number, currency: string = "BRL"): Promise<number> {
  if (typeof amount !== "number" || isNaN(amount)) return 0;
  const rate = await getExchangeRateToBRL(currency);
  return Math.round(amount * rate * 100) / 100;
}
