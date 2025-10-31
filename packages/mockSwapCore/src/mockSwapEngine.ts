/**
 * Mock Swap Engine - Main orchestration
 * 
 * Coordinates liquidity modeling, signal processing, and field resonance
 * for both DEMO mode (synthetic) and REAL mode (actual token data, no execution)
 */

import type { MockSwapResult, MockSwapConfig, RealTokenConfig } from './types.js';
import { buildLiquidityModel, calculateImpactRatio, suggestChunkSize, getLiquidityRank } from './liquidityModel.js';
import { generateSignalFrame, analyzeSignalQuality } from './signalEngine.js';
import { FieldResonatorMock } from './fieldResonator.js';
import { QuantumDecisionAdapter } from './quantumAdapter.js';
import { getMockPoolData, getPoolDataForTokens, isValidSolanaAddress } from './mockData.js';

/**
 * Default configuration
 */
const DEFAULT_CONFIG: MockSwapConfig = {
  mode: 'demo',
  enableSignalProcessing: true,
  enableFieldResonance: true,
  quantumMode: true,
};

/**
 * Mock swap with synthetic data (DEMO MODE)
 */
export async function mockSwap(
  inputToken: string,
  outputToken: string,
  amountIn: number,
  config: Partial<MockSwapConfig> = {}
): Promise<MockSwapResult> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Get mock pool data
  const poolData = getMockPoolData(inputToken, outputToken);

  // Build liquidity model
  const model = buildLiquidityModel(poolData.sweepData, poolData.reserves);

  // Predict efficiency
  const efficiency = model(amountIn);

  // Calculate perfect exchange rate from pool reserves
  // This represents how many output tokens per input token at 100% efficiency
  const perfectPrice = poolData.reserves.reserveOut / poolData.reserves.reserveIn;

  // Calculate output amount using pool exchange rate and efficiency
  const amountOut = amountIn * perfectPrice * (efficiency / 100);

  // Calculate slippage (difference from perfect price)
  const actualPrice = amountOut / amountIn;
  const slippage = ((perfectPrice - actualPrice) / perfectPrice) * 100;

  // Get liquidity rank
  const liquidityRank = getLiquidityRank(poolData.reserves);

  // Suggest chunking
  const chunking = suggestChunkSize(amountIn, poolData.reserves);

  // Generate signal frame if enabled
  let signal;
  if (cfg.enableSignalProcessing) {
    signal = generateSignalFrame(efficiency, cfg.mode);
  } else {
    signal = {
      coherence: 0,
      entropy: 0,
      phase: 0,
      dominantHz: 0,
      harmonics: [],
      magnitude: [],
    };
  }

  return {
    in: amountIn,
    out: amountOut,
    efficiency,
    signal,
    slippage,
    liquidityRank,
    executionPlan: {
      chunks: chunking.numChunks,
      chunkSize: chunking.chunkSize,
      estimatedTime: chunking.numChunks * 2, // 2 seconds per chunk
    },
  };
}

/**
 * Mock swap with REAL Solana token data (REAL MODE - NO EXECUTION)
 * 
 * Uses actual on-chain liquidity and routing data but never executes
 */
export async function mockSwapWithRealData(
  config: RealTokenConfig,
  swapConfig: Partial<MockSwapConfig> = {}
): Promise<MockSwapResult | { error: string }> {
  const cfg = { ...DEFAULT_CONFIG, mode: 'real' as const, ...swapConfig };

  // Validate addresses
  if (!isValidSolanaAddress(config.inputMint)) {
    return { error: 'Invalid input token address' };
  }

  if (!isValidSolanaAddress(config.outputMint)) {
    return { error: 'Invalid output token address' };
  }

  try {
    // Fetch real pool data with TRUE on-chain reserves (NO EXECUTION)
    const poolData = await getPoolDataForTokens(
      config.inputMint,
      config.outputMint,
      config.amount,
      config.rpcUrl // Pass through custom RPC URL if provided
    );

    if (!poolData) {
      return { error: 'Could not fetch pool data - tokens may not have liquidity' };
    }

    // Build liquidity model with real data
    const model = buildLiquidityModel(poolData.sweepData, poolData.reserves);

    // Predict efficiency
    const efficiency = model(config.amount);

    // Calculate perfect exchange rate from pool reserves
    // This represents how many output tokens per input token at 100% efficiency
    const perfectPrice = poolData.reserves.reserveOut / poolData.reserves.reserveIn;

    // Calculate output amount using pool exchange rate and efficiency
    const amountOut = config.amount * perfectPrice * (efficiency / 100);

    // Calculate slippage (difference from perfect price)
    const actualPrice = amountOut / config.amount;
    const slippage = Math.abs(((perfectPrice - actualPrice) / perfectPrice) * 100);

    // Get liquidity rank
    const liquidityRank = getLiquidityRank(poolData.reserves);

    // Suggest chunking
    const chunking = suggestChunkSize(config.amount, poolData.reserves);

    // Generate signal frame with real FFT if enabled
    let signal;
    if (cfg.enableSignalProcessing) {
      signal = generateSignalFrame(efficiency, 'real');
    } else {
      signal = {
        coherence: 0,
        entropy: 0,
        phase: 0,
        dominantHz: 0,
        harmonics: [],
        magnitude: [],
      };
    }

    return {
      in: config.amount,
      out: amountOut,
      efficiency,
      signal,
      slippage,
      liquidityRank,
      executionPlan: {
        chunks: chunking.numChunks,
        chunkSize: chunking.chunkSize,
        estimatedTime: chunking.numChunks * 2,
      },
    };
  } catch (error) {
    console.error('Real swap simulation failed:', error);
    return { 
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Full simulation with field resonance and quantum decision
 */
export async function fullSimulation(
  inputToken: string,
  outputToken: string,
  amountIn: number,
  useRealData: boolean = false,
  config: Partial<MockSwapConfig> = {}
): Promise<{
  swap: MockSwapResult;
  fieldState: any;
  decision: any;
  quality: any;
}> {
  const cfg = { ...DEFAULT_CONFIG, ...config };

  // Get swap result
  let swapResult: MockSwapResult;
  
  if (useRealData && isValidSolanaAddress(inputToken) && isValidSolanaAddress(outputToken)) {
    const result = await mockSwapWithRealData({
      inputMint: inputToken,
      outputMint: outputToken,
      amount: amountIn,
    }, cfg);
    
    if ('error' in result) {
      throw new Error(result.error);
    }
    
    swapResult = result;
  } else {
    swapResult = await mockSwap(inputToken, outputToken, amountIn, cfg);
  }

  // Analyze field resonance if enabled
  let fieldState = null;
  if (cfg.enableFieldResonance) {
    const resonator = new FieldResonatorMock();
    const pulse = resonator.simulatePulse(swapResult.efficiency);
    fieldState = pulse.fieldState;
  }

  // Make quantum decision if enabled
  let decision = null;
  if (cfg.quantumMode && fieldState) {
    const adapter = new QuantumDecisionAdapter();
    decision = adapter.decide(swapResult.signal, fieldState);
  }

  // Analyze signal quality
  const quality = analyzeSignalQuality(swapResult.signal);

  return {
    swap: swapResult,
    fieldState,
    decision,
    quality,
  };
}
