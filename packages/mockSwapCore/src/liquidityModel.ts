/**
 * Liquidity Model - Wraps the real buildLiquidityAwareModel
 * 
 * This imports and uses the ACTUAL production liquidity modeling
 * from the MSE package, keeping the "special sauce" encapsulated
 */

import type { LiquidityContext, SweepPoint } from './types';

// Import the REAL liquidity-aware model from production code
let buildLiquidityAwareModelReal: any;
try {
  const liquidityModule = require('../../../packages/mse/src/ghost/liquidityAwareModel');
  buildLiquidityAwareModelReal = liquidityModule.buildLiquidityAwareModel;
} catch (e) {
  console.warn('Could not import real liquidity model, using fallback');
  buildLiquidityAwareModelReal = null;
}

/**
 * Build efficiency predictor using real or fallback logic
 */
export function buildLiquidityModel(
  points: SweepPoint[],
  liquidity: LiquidityContext
): (size: number) => number {
  // Try to use the real model first
  if (buildLiquidityAwareModelReal) {
    try {
      return buildLiquidityAwareModelReal(points, liquidity);
    } catch (e) {
      console.warn('Real model failed, using fallback:', e);
    }
  }

  // Fallback: simple polynomial regression for demo
  return buildFallbackModel(points, liquidity);
}

/**
 * Fallback model for demo/offline mode
 * Uses polynomial regression on the sweep data
 */
function buildFallbackModel(
  points: SweepPoint[],
  liquidity: LiquidityContext
): (size: number) => number {
  if (!points || points.length === 0) {
    throw new Error('buildLiquidityModel: points array must not be empty');
  }

  if (liquidity.reserveIn <= 0 || liquidity.reserveOut <= 0) {
    throw new Error('buildLiquidityModel: reserves must be positive');
  }

  // Calculate effective liquidity
  const effectiveLiquidity = Math.sqrt(liquidity.reserveIn * liquidity.reserveOut);

  // Sort points by size
  const sortedPoints = [...points].sort((a, b) => a.size - b.size);

  // Fit a simple curve: efficiency = a - b * log(1 + c * size/liquidity)
  // This models the common behavior where efficiency drops logarithmically with size
  const normalizedSizes = sortedPoints.map(p => p.size / effectiveLiquidity);
  const efficiencies = sortedPoints.map(p => p.percent);

  // Simple 2-parameter fit
  const maxEff = Math.max(...efficiencies);
  const minEff = Math.min(...efficiencies);
  const range = maxEff - minEff;

  return (size: number) => {
    const normalizedSize = size / effectiveLiquidity;
    
    // Logarithmic decay model
    const dropFactor = Math.log(1 + normalizedSize * 10) / Math.log(11);
    const efficiency = maxEff - range * dropFactor;
    
    // Clamp to reasonable bounds
    return Math.max(50, Math.min(100, efficiency));
  };
}

/**
 * Calculate impact ratio for a swap
 */
export function calculateImpactRatio(
  swapSize: number,
  liquidity: LiquidityContext
): number {
  const effectiveLiquidity = Math.sqrt(liquidity.reserveIn * liquidity.reserveOut);
  return swapSize / effectiveLiquidity;
}

/**
 * Suggest optimal chunking strategy
 */
export function suggestChunkSize(
  totalSize: number,
  liquidity: LiquidityContext,
  targetImpactRatio: number = 0.05
): { chunkSize: number; numChunks: number } {
  const effectiveLiquidity = Math.sqrt(liquidity.reserveIn * liquidity.reserveOut);
  const optimalChunkSize = effectiveLiquidity * targetImpactRatio;
  const numChunks = Math.ceil(totalSize / optimalChunkSize);

  return {
    chunkSize: Math.ceil(totalSize / numChunks),
    numChunks,
  };
}

/**
 * Get liquidity rank
 */
export function getLiquidityRank(liquidity: LiquidityContext): string {
  const totalLiquidity = liquidity.reserveIn + liquidity.reserveOut;
  
  if (totalLiquidity >= 10000000) return 'S';
  if (totalLiquidity >= 5000000) return 'A';
  if (totalLiquidity >= 1000000) return 'B';
  if (totalLiquidity >= 500000) return 'C';
  if (totalLiquidity >= 100000) return 'D';
  return 'E';
}
