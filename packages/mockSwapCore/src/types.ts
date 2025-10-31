/**
 * Types for Mock Swap Core
 */

import type { LiquidityContext, SignalFrame, MockSwapResult } from '@hackathon/shared/types';

export type SwapMode = 'demo' | 'real';

export interface MockSwapConfig {
  mode: SwapMode;
  enableSignalProcessing: boolean;
  enableFieldResonance: boolean;
  quantumMode: boolean;
}

export interface RealTokenConfig {
  inputMint: string;
  outputMint: string;
  amount: number;
  slippageBps?: number;
}

export interface PoolData {
  reserves: LiquidityContext;
  sweepData: SweepPoint[];
  volume24h?: number;
  fee?: number;
}

export interface SweepPoint {
  size: number;
  percent: number;
  liquidity?: LiquidityContext;
}

export { LiquidityContext, SignalFrame, MockSwapResult };
