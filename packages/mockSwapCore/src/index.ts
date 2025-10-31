/**
 * Mock Swap Core - Hackathon Demo Engine
 * 
 * Dual-mode operation:
 * 1. DEMO mode: Uses synthetic data for offline demos
 * 2. REAL mode: Uses actual Solana contract addresses with real liquidity data
 *                but NO execution or wallet connection
 */

export { mockSwap, mockSwapWithRealData, fullSimulation } from './mockSwapEngine.js';
export { buildLiquidityModel } from './liquidityModel.js';
export { generateSignalFrame } from './signalEngine.js';
export { FieldResonatorMock } from './fieldResonator.js';
export { QuantumDecisionAdapter } from './quantumAdapter.js';
export { getMockPoolData, getPoolDataForTokens, COMMON_TOKENS, isValidSolanaAddress } from './mockData.js';
export {
  getRpcConnection,
  setCustomRpcUrl,
  getCustomRpcUrl,
  clearConnectionCache,
  getRaydiumPoolReserves,
  resolvePoolId,
  getLiquidityForMint,
  getRaydiumReservesForMint,
  type PoolReserves,
  type VaultInfo,
} from './resolveReserves.js';
export type { MockSwapConfig, SwapMode } from './types.js';
