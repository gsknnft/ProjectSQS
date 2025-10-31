/**
 * Mock Swap Core - Hackathon Demo Engine
 * 
 * Dual-mode operation:
 * 1. DEMO mode: Uses synthetic data for offline demos
 * 2. REAL mode: Uses actual Solana contract addresses with real liquidity data
 *                but NO execution or wallet connection
 */

export { mockSwap, mockSwapWithRealData, fullSimulation } from './mockSwapEngine';
export { buildLiquidityModel } from './liquidityModel';
export { generateSignalFrame } from './signalEngine';
export { FieldResonatorMock } from './fieldResonator';
export { QuantumDecisionAdapter } from './quantumAdapter';
export { getMockPoolData, getPoolDataForTokens, COMMON_TOKENS, isValidSolanaAddress } from './mockData';
export type { MockSwapConfig, SwapMode } from './types';
