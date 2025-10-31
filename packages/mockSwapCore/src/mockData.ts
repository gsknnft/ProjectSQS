/**
 * Mock Data Provider
 * 
 * Provides both synthetic data for demo mode and fetches real data
 * from Jupiter/Raydium for real mode (NO EXECUTION)
 */

import type { LiquidityContext, SweepPoint, PoolData } from './types';

/**
 * Common Solana token addresses for demo
 */
export const COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  IMG: 'imGNhoP6i8z7MqZmZwXgZQFdwDG7JHFUA9cRCJrGG4e',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
};

/**
 * Known token decimals (by mint) for realistic unit scaling
 */
const TOKEN_DECIMALS: Record<string, number> = {
  [COMMON_TOKENS.SOL]: 9,
  [COMMON_TOKENS.USDC]: 6,
  [COMMON_TOKENS.USDT]: 6,
  [COMMON_TOKENS.BONK]: 5,
  [COMMON_TOKENS.IMG]: 9, // unknown; assume 9 for demo
  [COMMON_TOKENS.JTO]: 9, // JTO commonly uses 9
};

function getTokenDecimals(mint: string): number {
  return TOKEN_DECIMALS[mint] ?? 9;
}

// In-memory cache for token decimals resolved from Jupiter token list
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
    console.warn('Failed to load Jupiter token list; using defaults', e);
  }
}

async function resolveTokenDecimals(mint: string): Promise<number> {
  if (TOKEN_DECIMALS[mint] !== undefined) return TOKEN_DECIMALS[mint];
  if (tokenDecimalsCache.has(mint)) return tokenDecimalsCache.get(mint)!;
  await ensureTokenListLoaded();
  if (tokenDecimalsCache.has(mint)) return tokenDecimalsCache.get(mint)!;
  return 9; // safe default
}

function toBaseUnits(amountHuman: number, decimals: number): number {
  // Avoid floating precision as much as possible for demo scale
  return Math.round(amountHuman * Math.pow(10, decimals));
}

function fromBaseUnits(amountBase: number | string, decimals: number): number {
  const n = typeof amountBase === 'string' ? Number(amountBase) : amountBase;
  return n / Math.pow(10, decimals);
}

/**
 * Mock pool database (for demo mode)
 */
const MOCK_POOLS: Record<string, PoolData> = {
  'SOL-USDC': {
    reserves: {
      reserveIn: 5000000, // 5M SOL
      reserveOut: 500000000, // 500M USDC
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
      reserveIn: 1000000000, // 1B IMG
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
      reserveIn: 50000000000, // 50B BONK
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
 * Get mock pool data for token pair (demo mode)
 */
export function getMockPoolData(inputToken: string, outputToken: string): PoolData {
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
 * Prefers Jupiter Lite v1 swap API, falls back to Raydium swap-base-in. We only read amounts.
 */
export async function getPoolDataForTokens(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<PoolData | null> {
  try {
    const quote = await fetchRealQuote(inputMint, outputMint, amount);
    if (!quote) return null;

    const sweepData = await generateSweepDataV1(inputMint, outputMint, amount);

    // Estimate reserves (very approximate) from quote
    const estimatedReserveIn = quote.inAmount * 100;
    const estimatedReserveOut = quote.outAmount * 100;

    return {
      reserves: {
        reserveIn: estimatedReserveIn,
        reserveOut: estimatedReserveOut,
        poolId: quote.poolId || 'unknown',
      },
      sweepData,
      fee: quote.fee ?? 0.003,
    };
  } catch (error) {
    console.error('Failed to fetch real pool data:', error);
    return null;
  }
}

/**
 * Try Jupiter Lite v1 swap API, then Raydium swap-base-in; return standardized quote
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
    const inDec = await resolveTokenDecimals(inputMint);
    const outDec = await resolveTokenDecimals(outputMint);
    const amountBase = toBaseUnits(amount, inDec);

    // Jupiter lite swap v1 typically expects POST with JSON
    const body = {
      inputMint,
      outputMint,
      amount: String(amountBase), // base units
      slippageBps: 50,
      swapMode: 'ExactIn',
      onlyDirectRoutes: false,
      asLegacyTransaction: true,
    } as any;

    const res = await fetch('https://lite-api.jup.ag/swap/v1/swap', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Jupiter Lite v1 error ${res.status}`);
    const data = await res.json();

    // Possible shapes: data.quote.outAmount / inAmount, or other fields
    const inAmountBase = data?.quote?.inAmount ?? amountBase;
    const outAmountBase = data?.quote?.outAmount ?? data?.otherAmountThreshold ?? data?.outAmount ?? 0;

    const inAmountHuman = fromBaseUnits(inAmountBase, inDec);
    const outAmountHuman = fromBaseUnits(outAmountBase, outDec);

    if (!outAmountHuman || !inAmountHuman) return null;

    const poolId: string | undefined = data?.routePlan?.[0]?.swapInfo?.ammKey || data?.ammKey;
    const fee: number | undefined = Number(data?.quote?.feeBps) ? Number(data.quote.feeBps) / 10000 : undefined;

    return { inAmount: inAmountHuman, outAmount: outAmountHuman, poolId, fee };
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
    const body = {
      inputMint,
      outputMint,
      amountIn: String(amountBase), // base units
      slippageBps: 50,
    } as any;

    const res = await fetch('https://transaction-v1.raydium.io/transaction/swap-base-in', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!res.ok) throw new Error(`Raydium swap-base-in error ${res.status}`);
  const data = await res.json();

  // Attempt to read amounts from response; schema may differ
  const inAmountBase = data?.inAmount ?? amountBase;
  const outAmountBase = data?.outAmount ?? data?.minOutAmount ?? 0;
  const inAmountHuman = fromBaseUnits(inAmountBase, inDec);
  const outAmountHuman = fromBaseUnits(outAmountBase, outDec);
  if (!outAmountHuman || !inAmountHuman) return null;

    const poolId: string | undefined = data?.poolKeys?.id || data?.route?.[0]?.id;
    const fee: number | undefined = Number(data?.feeBps) ? Number(data.feeBps) / 10000 : undefined;
    return { inAmount: inAmountHuman, outAmount: outAmountHuman, poolId, fee };
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
  baseAmount: number
): Promise<SweepPoint[]> {
  const sweepData: SweepPoint[] = [];
  const multipliers = [0.1, 0.5, 1.0, 2.0, 5.0];

  for (const mult of multipliers) {
    const size = Math.max(1, Math.floor(baseAmount * mult));
    try {
      const quote = await fetchRealQuote(inputMint, outputMint, size);
      if (quote) {
        const efficiency = (quote.outAmount / quote.inAmount) * 100;
        sweepData.push({ size, percent: Math.min(100, efficiency) });
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
