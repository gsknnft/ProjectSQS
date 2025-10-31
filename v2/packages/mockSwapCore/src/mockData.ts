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
 * Fetch real pool data from Jupiter/Raydium (REAL MODE - NO EXECUTION)
 * 
 * This uses actual on-chain data but never executes trades
 */
export async function getPoolDataForTokens(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<PoolData | null> {
  try {
    // Try to use Jupiter Quote API (read-only, no execution)
    const quoteData = await fetchJupiterQuote(inputMint, outputMint, amount);
    
    if (quoteData) {
      return {
        reserves: quoteData.reserves,
        sweepData: quoteData.sweepData,
        volume24h: quoteData.volume24h,
        fee: quoteData.fee,
      };
    }
  } catch (error) {
    console.error('Failed to fetch real pool data:', error);
  }

  return null;
}

/**
 * Fetch Jupiter quote (read-only)
 */
async function fetchJupiterQuote(
  inputMint: string,
  outputMint: string,
  amount: number
): Promise<{
  reserves: LiquidityContext;
  sweepData: SweepPoint[];
  volume24h?: number;
  fee?: number;
} | null> {
  try {
    // Use Jupiter API for quote (no execution)
    const response = await fetch(
      `https://quote-api.jup.ag/v6/quote?` +
      `inputMint=${inputMint}&` +
      `outputMint=${outputMint}&` +
      `amount=${amount}&` +
      `slippageBps=50`
    );

    if (!response.ok) {
      throw new Error(`Jupiter API error: ${response.status}`);
    }

    const data = await response.json();

    // Extract route information
    const route = data.routePlan?.[0];
    if (!route) {
      return null;
    }

    // Estimate reserves from the route (this is approximate)
    const outAmount = parseInt(data.outAmount);
    const inAmount = parseInt(data.inAmount);
    const efficiency = (outAmount / inAmount) * 100;

    // Generate sweep data by simulating different amounts
    const sweepData: SweepPoint[] = await generateSweepData(
      inputMint,
      outputMint,
      amount
    );

    // Estimate reserves (very approximate)
    const estimatedReserveIn = inAmount * 100; // Rough estimate
    const estimatedReserveOut = outAmount * 100;

    return {
      reserves: {
        reserveIn: estimatedReserveIn,
        reserveOut: estimatedReserveOut,
        poolId: route.swapInfo?.ammKey || 'unknown',
      },
      sweepData,
      fee: 0.003, // Default fee
    };
  } catch (error) {
    console.error('Jupiter quote failed:', error);
    return null;
  }
}

/**
 * Generate sweep data by querying multiple amounts
 */
async function generateSweepData(
  inputMint: string,
  outputMint: string,
  baseAmount: number
): Promise<SweepPoint[]> {
  const sweepData: SweepPoint[] = [];
  const multipliers = [0.1, 0.5, 1.0, 2.0, 5.0];

  for (const mult of multipliers) {
    const size = Math.floor(baseAmount * mult);
    
    try {
      const response = await fetch(
        `https://quote-api.jup.ag/v6/quote?` +
        `inputMint=${inputMint}&` +
        `outputMint=${outputMint}&` +
        `amount=${size}&` +
        `slippageBps=50`
      );

      if (response.ok) {
        const data = await response.json();
        const outAmount = parseInt(data.outAmount);
        const inAmount = parseInt(data.inAmount);
        const efficiency = (outAmount / inAmount) * 100;

        sweepData.push({
          size,
          percent: Math.min(100, efficiency),
        });
      }
    } catch (error) {
      console.error(`Failed to fetch sweep data for size ${size}:`, error);
    }
  }

  // If we couldn't get any data, return default
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
