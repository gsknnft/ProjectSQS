/**
 * Shared utility functions
 */
/**
 * Generate mock signal data with realistic characteristics
 */
export declare function generateMockSignal(efficiency: number): number[];
/**
 * Calculate coherence from signal data
 */
export declare function calculateCoherence(magnitude: number[]): number;
/**
 * Calculate entropy from signal data
 */
export declare function calculateEntropy(magnitude: number[]): number;
/**
 * Find dominant frequency
 */
export declare function findDominantFrequency(magnitude: number[], sampleRate?: number): number;
/**
 * Extract harmonic frequencies
 */
export declare function extractHarmonics(magnitude: number[], dominantHz: number, sampleRate?: number): number[];
/**
 * Format SOL amount for display
 */
export declare function formatSOL(amount: number): string;
/**
 * Format percentage
 */
export declare function formatPercent(value: number): string;
/**
 * Get liquidity rank based on total liquidity
 */
export declare function getLiquidityRank(totalLiquidity: number): string;
