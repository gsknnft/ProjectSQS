/**
 * Mock Data Provider
 * 
 * Provides both synthetic data for demo mode and fetches real data
 * from Jupiter/Raydium for real mode (NO EXECUTION)
 */

import type { LiquidityContext, SweepPoint, PoolData } from './types.js';
import {
  getRpcConnection,
  getRaydiumPoolReserves,
  resolvePoolId,
  type PoolReserves,
} from './resolveReserves.js';

/**
 * API Endpoints
 */
const JUPITER_LITE_QUOTE_API = 'https://lite-api.jup.ag/swap/v1/quote';
const JUPITER_PRICE_API_V2 = 'https://api.jup.ag/price/v2';
const RAYDIUM_COMPUTE_API = 'https://transaction-v1.raydium.io/compute/swap-base-in';

/**
 * Common Solana token addresses for demo
 */
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  IMG: 'znv3FZt2HFAvzYf5LxzVyryh3mBXWuTRRng25gEZAjh',
  PEPELOCO: 'Gpg9shYtjVgJ8LtMye3tS6izM6a2vK8Eh7XSEwUTpump',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
};

/**
 * Token decimals helpers for realistic unit scaling
 */
const TOKEN_DECIMALS: Record<string, number> = {
  [COMMON_TOKENS.SOL]: 9,
  [COMMON_TOKENS.USDC]: 6,
  [COMMON_TOKENS.USDT]: 6,
  [COMMON_TOKENS.BONK]: 5,
  [COMMON_TOKENS.IMG]: 9,
  [COMMON_TOKENS.JTO]: 9,
};

const tokenDecimalsCache = new Map<string, number>();
let tokenListLoaded = false;

async function ensureTokenListLoaded(): Promise<void> {
  if (tokenListLoaded) return;
  try {
    const res = await fetch('https://token.jup.ag/all');
    if (!res.ok) throw new Error(`token list ${res.status}`);
    const list = await res.json();
    if (Array.isArray(list)) {
      for (const t of list) {
        if (t?.address && typeof t?.decimals === 'number') {
          tokenDecimalsCache.set(t.address, t.decimals);
        }
      }
      tokenListLoaded = true;
    }
  } catch (e) {
    console.warn('Failed to load Jupiter token list; using default decimals');
  }
}

export async function resolveTokenDecimals(mint: string): Promise<number> {
  if (TOKEN_DECIMALS[mint] !== undefined) return TOKEN_DECIMALS[mint];
  if (tokenDecimalsCache.has(mint)) return tokenDecimalsCache.get(mint)!;
  await ensureTokenListLoaded();
  if (tokenDecimalsCache.has(mint)) return tokenDecimalsCache.get(mint)!;
  return 9;
}

export function toBaseUnits(amountHuman: number, decimals: number): string {
  // Use string to avoid float precision; round to integer base units
  const v = Math.round(amountHuman * Math.pow(10, decimals));
  return String(v);
}

export function fromBaseUnits(amountBase: unknown, decimals: number): number {
  const n = typeof amountBase === 'string' ? Number(amountBase) : Number(amountBase);
  if (!isFinite(n)) return 0;
  return n / Math.pow(10, decimals);
}

/**
 * Price update tracking
 */
let lastPriceUpdate = 0;
const PRICE_UPDATE_INTERVAL = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch price data from Jupiter Price API v2
 * More efficient and robust than using quote API for price data
 */
async function fetchPrice({
  inputMint,
  outputMint,
  extraInfo = true
}: {
  inputMint: string;
  outputMint: string;
  extraInfo?: boolean;
}): Promise<{ inUsd: number; outUsd: number; spotRate: number } | null> {
  try {
    const url = `${JUPITER_PRICE_API_V2}?ids=${inputMint},${outputMint}&showExtraInfo=${extraInfo}`;
    
    const res = await fetch(url);
    if (!res.ok) throw new Error(`Jupiter Price API v2 error ${res.status}`);
    
    const response = await res.json();
    const inData = response.data?.[inputMint];
    const outData = response.data?.[outputMint];
    
    if (!inData?.price || !outData?.price) {
      return null;
    }
    
    const inUsd = Number(inData.price);
    const outUsd = Number(outData.price);
    
    if (!isFinite(inUsd) || !isFinite(outUsd) || inUsd <= 0 || outUsd <= 0) {
      return null;
    }
    
    return {
      inUsd,
      outUsd,
      spotRate: outUsd / inUsd, // OUT per IN
    };
  } catch (error) {
    console.warn('Jupiter Price API v2 failed:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Mock pool database (for demo mode)
 * These will be updated periodically with real prices
 */
const MOCK_POOLS: Record<string, PoolData> = {
  'SOL-USDC': {
    reserves: {
      reserveIn: 5000000, // 5M SOL - will be updated with real prices
      reserveOut: 925000000, // Initial: ~185 USDC per SOL
      poolId: 'demo-sol-usdc',
    },
    sweepData: [
      { size: 100, percent: 99.5 },
      { size: 1000, percent: 99.0 },
      { size: 10000, percent: 96.5 },
      { size: 50000, percent: 92.0 },
      { size: 100000, percent: 85.0 },
    ],
    volume24h: 50000000,
    fee: 0.003,
  },
  'IMG-SOL': {
    reserves: {
      reserveIn: 1000000000, // 1B IMG - will be updated with real prices
      reserveOut: 100000, // 100K SOL
      poolId: 'demo-img-sol',
    },
    sweepData: [
      { size: 10000, percent: 99.2 },
      { size: 100000, percent: 98.5 },
      { size: 1000000, percent: 95.0 },
      { size: 5000000, percent: 88.0 },
      { size: 10000000, percent: 78.0 },
    ],
    volume24h: 5000000,
    fee: 0.0025,
  },
  'BONK-USDC': {
    reserves: {
      reserveIn: 50000000000, // 50B BONK - will be updated with real prices
      reserveOut: 5000000, // 5M USDC
      poolId: 'demo-bonk-usdc',
    },
    sweepData: [
      { size: 1000000, percent: 99.0 },
      { size: 10000000, percent: 97.5 },
      { size: 100000000, percent: 93.0 },
      { size: 500000000, percent: 84.0 },
      { size: 1000000000, percent: 72.0 },
    ],
    volume24h: 10000000,
    fee: 0.0030,
  },
};

/**
 * Fetch real price and update mock pool reserves
 * Uses Jupiter Price API v2 for efficient, direct USD price data
 */
async function updatePoolWithRealPrice(
  poolKey: string,
  inputMint: string,
  outputMint: string
): Promise<void> {
  try {
    // Try the more efficient Price API v2 first
    const priceData = await fetchPrice({ inputMint, outputMint, extraInfo: true });
    
    if (priceData) {
      // Use direct spot rate from Price API
      const priceRatio = priceData.spotRate;
      
      // Update the pool reserves to reflect real price while maintaining liquidity depth
      const pool = MOCK_POOLS[poolKey];
      if (pool) {
        // Keep reserveIn the same, adjust reserveOut to match real price
        pool.reserves.reserveOut = pool.reserves.reserveIn * priceRatio;
        console.log(`✅ Updated ${poolKey} price: 1 input = ${priceRatio.toFixed(6)} output (USD: $${priceData.inUsd.toFixed(2)} → $${priceData.outUsd.toFixed(2)})`);
      }
      return;
    }
    
    // Fallback to quote-based price calculation if Price API fails
    const quote = await fetchRealQuote(inputMint, outputMint, 1.0);
    if (!quote) {
      console.warn(`Failed to fetch price for ${poolKey}`);
      return;
    }

    const priceRatio = quote.outAmount / quote.inAmount;
    const pool = MOCK_POOLS[poolKey];
    if (pool) {
      pool.reserves.reserveOut = pool.reserves.reserveIn * priceRatio;
      console.log(`✅ Updated ${poolKey} price: 1 input = ${priceRatio.toFixed(6)} output (fallback)`);
    }
  } catch (error) {
    console.error(`Failed to update price for ${poolKey}:`, error);
  }
}

/**
 * Update all mock pools with real prices from the market
 * This ensures demo mode reflects current market conditions
 */
async function updateMockPoolsWithRealPrices(): Promise<void> {
  const now = Date.now();
  
  // Check if enough time has passed since last update
  if (now - lastPriceUpdate < PRICE_UPDATE_INTERVAL) {
    return; // Skip update if too soon
  }
  
  console.log('🔄 Updating mock pools with real market prices...');
  
  try {
    // Update SOL-USDC
    await updatePoolWithRealPrice('SOL-USDC', COMMON_TOKENS.SOL, COMMON_TOKENS.USDC);
    
    // Update IMG-SOL
    await updatePoolWithRealPrice('IMG-SOL', COMMON_TOKENS.IMG, COMMON_TOKENS.SOL);
    
    // Update BONK-USDC
    await updatePoolWithRealPrice('BONK-USDC', COMMON_TOKENS.BONK, COMMON_TOKENS.USDC);
    
    lastPriceUpdate = now;
    console.log('✅ Mock pools updated with real prices');
  } catch (error) {
    console.error('Failed to update mock pools:', error);
  }
}

/**
 * Get mock pool data for token pair (demo mode)
 * Automatically updates with real prices periodically
 */
export async function getMockPoolData(inputToken: string, outputToken: string): Promise<PoolData> {
  // Update pools with real prices if needed
  await updateMockPoolsWithRealPrices();
  // Try to find matching pool
  const poolKey = `${inputToken}-${outputToken}`;
  const reverseKey = `${outputToken}-${inputToken}`;

  if (MOCK_POOLS[poolKey]) {
    return MOCK_POOLS[poolKey];
  }

  if (MOCK_POOLS[reverseKey]) {
    // Reverse the pool data
    const pool = MOCK_POOLS[reverseKey];
    return {
      reserves: {
        reserveIn: pool.reserves.reserveOut,
        reserveOut: pool.reserves.reserveIn,
        poolId: pool.reserves.poolId,
      },
      sweepData: pool.sweepData,
      volume24h: pool.volume24h,
      fee: pool.fee,
    };
  }

  // Generate synthetic pool data
  return generateSyntheticPoolData();
}

/**
 * Generate synthetic pool data for unknown pairs
 */
function generateSyntheticPoolData(): PoolData {
  const reserveIn = 1000000 + Math.random() * 9000000; // 1M-10M
  const reserveOut = 500000 + Math.random() * 4500000; // 500K-5M

  return {
    reserves: {
      reserveIn,
      reserveOut,
      poolId: 'synthetic',
    },
    sweepData: [
      { size: 100, percent: 99.5 },
      { size: 1000, percent: 99.0 },
      { size: 10000, percent: 96.0 },
      { size: 50000, percent: 90.0 },
      { size: 100000, percent: 80.0 },
    ],
    volume24h: Math.random() * 10000000,
    fee: 0.003,
  };
}

/**
 * Fetch real pool data from Jupiter Lite v1 or Raydium (REAL MODE - NO EXECUTION)
 * Prefers Jupiter Lite v1 quote API, falls back to Raydium compute API. We only read amounts.
 */
export async function getPoolDataForTokens(
  inputMint: string,
  outputMint: string,
  amount: number,
  rpcUrl?: string
): Promise<PoolData | null> {
  try {
    const quote = await fetchRealQuote(inputMint, outputMint, amount);
    if (!quote) return null;

    // Try to fetch TRUE on-chain reserves using full resolveReserves implementation
    const realReserves = await fetchOnChainReserves(inputMint, outputMint, quote.poolId, rpcUrl);
    
    let reserveIn: number;
    let reserveOut: number;
    let fee = quote.fee ?? 0.003;
    
    if (realReserves) {
      // Use TRUE on-chain reserves aligned with signal processing
      const inDec = await resolveTokenDecimals(inputMint);
      const outDec = await resolveTokenDecimals(outputMint);
      reserveIn = Number(realReserves.reserveIn) / Math.pow(10, inDec);
      reserveOut = Number(realReserves.reserveOut) / Math.pow(10, outDec);
      
      // Use actual fee from on-chain data if available
      if (realReserves.fee) {
        fee = realReserves.fee;
      }
      
      console.log(`✅ Using TRUE on-chain reserves: ${reserveIn} / ${reserveOut} (${realReserves.poolType})`);
    } else {
      // Fallback to estimation from quote
      reserveIn = quote.inAmount * 100;
      reserveOut = quote.outAmount * 100;
      console.warn('⚠️ Using estimated reserves (on-chain fetch failed)');
    }

    // Anchor price to the live quote to avoid pool mismatch
    const quotePrice = quote.outAmount > 0 && quote.inAmount > 0 ? (quote.outAmount / quote.inAmount) : undefined;
    if (quotePrice && isFinite(quotePrice) && quotePrice > 0) {
      reserveOut = reserveIn * quotePrice;
    }

  // Compute perfect price from reserves (human units)
  const perfectPrice = reserveOut / reserveIn;
  const sweepData = await generateSweepDataV1(inputMint, outputMint, amount, perfectPrice);

    return {
      reserves: {
        reserveIn,
        reserveOut,
        poolId: quote.poolId || 'unknown',
      },
      sweepData,
      fee,
      volume24h: realReserves?.volume24h,
    };
  } catch (error) {
    console.error('Failed to fetch real pool data:', error);
    return null;
  }
}

/**
 * Fetch TRUE on-chain reserves using full resolveReserves implementation
 * This provides accurate liquidity data aligned with signal processing
 * Supports AMM v4, CLMM, and Registry pools
 */
async function fetchOnChainReserves(
  inputMint: string,
  outputMint: string,
  poolId?: string,
  rpcUrl?: string
): Promise<{
  reserveIn: bigint;
  reserveOut: bigint;
  poolType: string;
  fee?: number;
  volume24h?: number;
} | null> {
  try {
    // Get RPC connection (uses custom RPC if set, or default)
    const connection = getRpcConnection(rpcUrl);
    
    // Resolve pool ID if not provided
    let resolvedPoolId: string | undefined = poolId;
    if (!resolvedPoolId) {
      console.log('Resolving pool ID from mint pair...');
      const poolIdResult = await resolvePoolId(inputMint, outputMint);
      if (!poolIdResult) {
        console.warn('⚠️ Could not resolve pool ID');
        return null;
      }
      resolvedPoolId = poolIdResult;
      console.log(`✅ Resolved pool ID: ${resolvedPoolId}`);
    }

    // Fetch TRUE on-chain reserves
    console.log('Fetching TRUE on-chain reserves...');
    const reserves: PoolReserves = await getRaydiumPoolReserves(
      connection,
      resolvedPoolId,
      { mintA: inputMint, mintB: outputMint }
    );

    // Determine correct order based on mint matching
    const isDirectOrder = reserves.vaultA.mint === inputMint;
    const reserveIn = isDirectOrder ? reserves.vaultA.amount : reserves.vaultB.amount;
    const reserveOut = isDirectOrder ? reserves.vaultB.amount : reserves.vaultA.amount;

    return {
      reserveIn,
      reserveOut,
      poolType: reserves.poolType,
      fee: reserves.fees?.tradeFeeRate,
      volume24h: undefined, // Could be fetched from additional API if needed
    };
  } catch (error) {
    console.warn('Failed to fetch on-chain reserves:', error instanceof Error ? error.message : error);
    return null;
  }
}

/**
 * Try Jupiter Lite v1 quote API, then Raydium compute API; return standardized quote
 */
async function fetchRealQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<{ inAmount: number; outAmount: number; poolId?: string; fee?: number } | null> {
  // Try Jupiter Lite first
  const jup = await fetchJupiterLiteQuote(inputMint, outputMint, amount).catch(() => null);
  if (jup) return jup;

  // Fallback to Raydium
  const ray = await fetchRaydiumQuote(inputMint, outputMint, amount).catch(() => null);
  if (ray) return ray;

  return null;
}

async function fetchJupiterLiteQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<{ inAmount: number; outAmount: number; poolId?: string; fee?: number } | null> {
  try {
    // Resolve decimals
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);

    // Jupiter Lite v1 quote API expects amounts in base units
    const amountBase = toBaseUnits(amount, inDec);
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountBase,
      slippageBps: '50',
    });

    const res = await fetch(`${JUPITER_LITE_QUOTE_API}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`Jupiter Lite v1 quote error ${res.status}`);
    const data = await res.json();

  // Jupiter Lite v1 response amounts are base units
  const inAmount = fromBaseUnits(data?.inAmount ?? amountBase, inDec);
  const outAmount = fromBaseUnits(data?.outAmount ?? 0, outDec);

    if (!outAmount || !inAmount) return null;

    // Extract pool info from route plan
  const poolId: string | undefined = data?.routePlan?.[0]?.swapInfo?.ammKey;
  const fee: number | undefined = data?.priceImpactPct ? Math.abs(Number(data.priceImpactPct)) : undefined;

    return { inAmount, outAmount, poolId, fee };
  } catch (e) {
    console.warn('Jupiter Lite v1 quote failed:', e);
    return null;
  }
}

async function fetchRaydiumQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<{ inAmount: number; outAmount: number; poolId?: string; fee?: number } | null> {
  try {
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);
    const amountBase = toBaseUnits(amount, inDec);
    // Raydium compute/swap-base-in uses GET with query parameters; amount is base units
    const params = new URLSearchParams({
      inputMint,
      outputMint,
      amount: amountBase,
      slippageBps: '50',
      txVersion: 'V0',
    });

    const res = await fetch(`${RAYDIUM_COMPUTE_API}?${params.toString()}`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });

    if (!res.ok) throw new Error(`Raydium swap-base-in error ${res.status}`);
    const data = await res.json();

    // Raydium response structure - data is nested in data.data
  const quoteData = data?.data;
  const inAmount = fromBaseUnits(amountBase, inDec);
  const outAmount = fromBaseUnits(quoteData?.outputAmount ?? 0, outDec);
    
    if (!outAmount || !inAmount) return null;

    const poolId: string | undefined = quoteData?.poolKeys?.id || quoteData?.id;
    const fee: number | undefined = Number(quoteData?.feeBps) ? Number(quoteData.feeBps) / 10000 : undefined;
    
    return { inAmount, outAmount, poolId, fee };
  } catch (e) {
    console.warn('Raydium quote failed:', e);
    return null;
  }
}

/**
 * Generate sweep data using the v1 quote fetcher
 */
async function generateSweepDataV1(
  inputMint: string,
  outputMint: string,
  baseAmount: number,
  perfectPrice: number
): Promise<SweepPoint[]> {
  const sweepData: SweepPoint[] = [];
  const multipliers = [0.1, 0.5, 1.0, 2.0, 5.0];

  for (const mult of multipliers) {
    const size = Math.max(1, Math.floor(baseAmount * mult));
    try {
      const quote = await fetchRealQuote(inputMint, outputMint, size);
      if (quote) {
        // Efficiency is output achieved relative to perfect price
        const idealOut = quote.inAmount * perfectPrice;
        const efficiency = idealOut > 0 ? (quote.outAmount / idealOut) * 100 : 0;
        sweepData.push({ size, percent: Math.max(50, Math.min(100, efficiency)) });
      }
    } catch (error) {
      console.error(`Failed to fetch sweep data for size ${size}:`, error);
    }
  }

  if (sweepData.length === 0) {
    return [
      { size: baseAmount * 0.1, percent: 99.0 },
      { size: baseAmount * 0.5, percent: 98.0 },
      { size: baseAmount, percent: 96.0 },
      { size: baseAmount * 2, percent: 92.0 },
      { size: baseAmount * 5, percent: 85.0 },
    ];
  }
  return sweepData;
}

/**
 * Validate Solana token address format
 */
export function isValidSolanaAddress(address: string): boolean {
  // Basic validation - should be base58 encoded, 32-44 characters
  if (!address || address.length < 32 || address.length > 44) {
    return false;
  }

  // Check for valid base58 characters
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}

/**
 * Get token info from known tokens
 */
export function getTokenInfo(address: string): { symbol: string; name: string } | null {
  for (const [symbol, addr] of Object.entries(COMMON_TOKENS)) {
    if (addr === address) {
      return { symbol, name: symbol };
    }
  }
  return null;
}
