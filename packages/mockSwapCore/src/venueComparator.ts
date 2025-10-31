/**
 * Multi-Venue Comparator
 * 
 * Fetches quotes and liquidity data from multiple DEX venues:
 * - Jupiter (aggregator)
 * - Raydium (AMM)
 * - Orca (AMM with Whirlpools)
 * - Meteora (Dynamic AMM)
 * 
 * Compares venues to find best rates and potential arbitrage opportunities
 */

import type { PoolData } from './types.js';
import { 
  resolveTokenDecimals,
  toBaseUnits,
  fromBaseUnits 
} from './mockData.js';

/**
 * Venue identifiers
 */
export type VenueName = 'jupiter' | 'raydium' | 'orca' | 'meteora';

/**
 * Quote from a specific venue
 */
export interface VenueQuote {
  venue: VenueName;
  inAmount: number;
  outAmount: number;
  priceImpact?: number;
  fee?: number;
  route?: string[];
  poolId?: string;
  efficiency?: number;
  error?: string;
}

/**
 * Comparison result across all venues
 */
export interface VenueComparison {
  inputMint: string;
  outputMint: string;
  amount: number;
  timestamp: number;
  quotes: VenueQuote[];
  bestQuote: VenueQuote;
  arbitrageOpportunities?: ArbitrageOpportunity[];
}

/**
 * Arbitrage opportunity between two venues
 */
export interface ArbitrageOpportunity {
  buyVenue: VenueName;
  sellVenue: VenueName;
  buyPrice: number;
  sellPrice: number;
  spread: number;
  spreadPercent: number;
  profitPotential: number;
}

/**
 * API endpoints for different venues
 */
const ORCA_WHIRLPOOL_API = 'https://api.mainnet.orca.so/v1/whirlpool/quote';
const METEORA_QUOTE_API = 'https://quote-api.meteora.ag/swap';

/**
 * Fetch quote from Jupiter aggregator
 */
async function fetchJupiterVenueQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<VenueQuote> {
  try {
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);
    const amountBase = toBaseUnits(amount, inDec);
    
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountBase,
      slippageBps: '50',
    });

    const res = await fetch(`https://lite-api.jup.ag/swap/v1/quote?${params.toString()}`);
    if (!res.ok) throw new Error(`Jupiter API error ${res.status}`);
    
    const data = await res.json();
    const inAmount = fromBaseUnits(data?.inAmount ?? amountBase, inDec);
    const outAmount = fromBaseUnits(data?.outAmount ?? 0, outDec);
    
    if (!outAmount || !inAmount) {
      return {
        venue: 'jupiter',
        inAmount: 0,
        outAmount: 0,
        error: 'No quote available',
      };
    }

    const poolId = data?.routePlan?.[0]?.swapInfo?.ammKey;
    const priceImpact = data?.priceImpactPct ? Math.abs(Number(data.priceImpactPct)) : undefined;
    
    return {
      venue: 'jupiter',
      inAmount,
      outAmount,
      priceImpact,
      poolId,
      route: data?.routePlan?.map((r: any) => r?.swapInfo?.label) || [],
    };
  } catch (error) {
    console.warn('Jupiter quote failed:', error instanceof Error ? error.message : error);
    return {
      venue: 'jupiter',
      inAmount: 0,
      outAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch quote from Raydium
 */
async function fetchRaydiumVenueQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<VenueQuote> {
  try {
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);
    const amountBase = toBaseUnits(amount, inDec);
    
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountBase,
      slippageBps: '50',
      txVersion: 'V0',
    });

    const res = await fetch(`https://transaction-v1.raydium.io/compute/swap-base-in?${params.toString()}`);
    if (!res.ok) throw new Error(`Raydium API error ${res.status}`);
    
    const data = await res.json();
    const quoteData = data?.data;
    const inAmount = fromBaseUnits(amountBase, inDec);
    const outAmount = fromBaseUnits(quoteData?.outputAmount ?? 0, outDec);
    
    if (!outAmount || !inAmount) {
      return {
        venue: 'raydium',
        inAmount: 0,
        outAmount: 0,
        error: 'No quote available',
      };
    }

    const poolId = quoteData?.poolKeys?.id || quoteData?.id;
    const fee = Number(quoteData?.feeBps) ? Number(quoteData.feeBps) / 10000 : undefined;
    
    return {
      venue: 'raydium',
      inAmount,
      outAmount,
      fee,
      poolId,
    };
  } catch (error) {
    console.warn('Raydium quote failed:', error instanceof Error ? error.message : error);
    return {
      venue: 'raydium',
      inAmount: 0,
      outAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch quote from Orca Whirlpools
 */
async function fetchOrcaVenueQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<VenueQuote> {
  try {
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);
    const amountBase = toBaseUnits(amount, inDec);
    
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountBase,
      slippage: '0.5', // 0.5% slippage
    });

    const res = await fetch(`${ORCA_WHIRLPOOL_API}?${params.toString()}`);
    if (!res.ok) throw new Error(`Orca API error ${res.status}`);
    
    const data = await res.json();
    const inAmount = fromBaseUnits(data?.inAmount ?? amountBase, inDec);
    const outAmount = fromBaseUnits(data?.outAmount ?? 0, outDec);
    
    if (!outAmount || !inAmount) {
      return {
        venue: 'orca',
        inAmount: 0,
        outAmount: 0,
        error: 'No quote available',
      };
    }

    const priceImpact = data?.priceImpact ? Math.abs(Number(data.priceImpact)) : undefined;
    
    return {
      venue: 'orca',
      inAmount,
      outAmount,
      priceImpact,
      poolId: data?.poolId,
    };
  } catch (error) {
    console.warn('Orca quote failed:', error instanceof Error ? error.message : error);
    return {
      venue: 'orca',
      inAmount: 0,
      outAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch quote from Meteora
 */
async function fetchMeteoraVenueQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<VenueQuote> {
  try {
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);
    const amountBase = toBaseUnits(amount, inDec);
    
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountBase,
      slippageBps: '50',
    });

    const res = await fetch(`${METEORA_QUOTE_API}?${params.toString()}`);
    if (!res.ok) throw new Error(`Meteora API error ${res.status}`);
    
    const data = await res.json();
    const inAmount = fromBaseUnits(data?.inAmount ?? amountBase, inDec);
    const outAmount = fromBaseUnits(data?.outAmount ?? 0, outDec);
    
    if (!outAmount || !inAmount) {
      return {
        venue: 'meteora',
        inAmount: 0,
        outAmount: 0,
        error: 'No quote available',
      };
    }

    const priceImpact = data?.priceImpact ? Math.abs(Number(data.priceImpact)) : undefined;
    const fee = data?.fee ? Number(data.fee) : undefined;
    
    return {
      venue: 'meteora',
      inAmount,
      outAmount,
      priceImpact,
      fee,
      poolId: data?.poolId,
    };
  } catch (error) {
    console.warn('Meteora quote failed:', error instanceof Error ? error.message : error);
    return {
      venue: 'meteora',
      inAmount: 0,
      outAmount: 0,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Fetch quotes from all venues in parallel
 */
export async function fetchAllVenueQuotes(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<VenueQuote[]> {
  const [jupiter, raydium, orca, meteora] = await Promise.all([
    fetchJupiterVenueQuote(inputMint, outputMint, amount),
    fetchRaydiumVenueQuote(inputMint, outputMint, amount),
    fetchOrcaVenueQuote(inputMint, outputMint, amount),
    fetchMeteoraVenueQuote(inputMint, outputMint, amount),
  ]);

  return [jupiter, raydium, orca, meteora];
}

/**
 * Find the best quote from all venues
 */
export function findBestQuote(quotes: VenueQuote[]): VenueQuote {
  // Filter out quotes with errors or zero output
  const validQuotes = quotes.filter(q => !q.error && q.outAmount > 0);
  
  if (validQuotes.length === 0) {
    // Return the first quote as fallback (will contain error)
    return quotes[0] || {
      venue: 'jupiter',
      inAmount: 0,
      outAmount: 0,
      error: 'No valid quotes',
    };
  }

  // Find quote with highest output amount
  return validQuotes.reduce((best, current) => 
    current.outAmount > best.outAmount ? current : best
  );
}

/**
 * Calculate efficiency for each quote relative to best
 */
export function calculateQuoteEfficiencies(quotes: VenueQuote[], bestQuote: VenueQuote): VenueQuote[] {
  if (bestQuote.outAmount === 0) return quotes;
  
  return quotes.map(quote => ({
    ...quote,
    efficiency: quote.outAmount > 0 
      ? (quote.outAmount / bestQuote.outAmount) * 100 
      : 0,
  }));
}

/**
 * Find arbitrage opportunities between venues
 */
export function findArbitrageOpportunities(quotes: VenueQuote[]): ArbitrageOpportunity[] {
  const opportunities: ArbitrageOpportunity[] = [];
  const validQuotes = quotes.filter(q => !q.error && q.outAmount > 0 && q.inAmount > 0);
  
  if (validQuotes.length < 2) return opportunities;

  // Compare each pair of venues
  for (let i = 0; i < validQuotes.length; i++) {
    for (let j = i + 1; j < validQuotes.length; j++) {
      const quote1 = validQuotes[i];
      const quote2 = validQuotes[j];
      
      const price1 = quote1.outAmount / quote1.inAmount;
      const price2 = quote2.outAmount / quote2.inAmount;
      
      const spread = Math.abs(price1 - price2);
      const spreadPercent = (spread / Math.min(price1, price2)) * 100;
      
      // Consider it an arbitrage opportunity if spread is > 0.5%
      if (spreadPercent > 0.5) {
        const buyVenue = price1 > price2 ? quote2.venue : quote1.venue;
        const sellVenue = price1 > price2 ? quote1.venue : quote2.venue;
        const buyPrice = Math.min(price1, price2);
        const sellPrice = Math.max(price1, price2);
        
        // Estimate profit (simplified, doesn't account for fees)
        const profitPotential = (sellPrice - buyPrice) * quote1.inAmount;
        
        opportunities.push({
          buyVenue,
          sellVenue,
          buyPrice,
          sellPrice,
          spread,
          spreadPercent,
          profitPotential,
        });
      }
    }
  }
  
  // Sort by spread percentage (highest first)
  return opportunities.sort((a, b) => b.spreadPercent - a.spreadPercent);
}

/**
 * Compare quotes across all venues
 */
export async function compareVenues(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<VenueComparison> {
  const quotes = await fetchAllVenueQuotes(inputMint, outputMint, amount);
  const bestQuote = findBestQuote(quotes);
  const quotesWithEfficiency = calculateQuoteEfficiencies(quotes, bestQuote);
  const arbitrageOpportunities = findArbitrageOpportunities(quotesWithEfficiency);

  return {
    inputMint,
    outputMint,
    amount,
    timestamp: Date.now(),
    quotes: quotesWithEfficiency,
    bestQuote,
    arbitrageOpportunities: arbitrageOpportunities.length > 0 ? arbitrageOpportunities : undefined,
  };
}

/**
 * Get detailed pool data for best venue
 */
export async function getBestVenuePoolData(
  comparison: VenueComparison
): Promise<PoolData | null> {
  // This would integrate with existing pool data fetching
  // For now, we return null and let the caller handle it
  return null;
}
