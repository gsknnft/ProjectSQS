/**
 * Shared types for the Hackathon Demo
 */
export interface LiquidityContext {
    reserveIn: number;
    reserveOut: number;
    totalLiquidity?: number;
    poolId?: string;
}
export interface SignalFrame {
    coherence: number;
    entropy: number;
    phase: number;
    dominantHz: number;
    harmonics: number[];
    magnitude: number[];
}
export interface MockSwapResult {
    in: number;
    out: number;
    efficiency: number;
    signal: SignalFrame;
    slippage: number;
    liquidityRank: string;
    executionPlan: {
        chunks: number;
        chunkSize: number;
        estimatedTime: number;
    };
}
export interface PoolSnapshot {
    poolId: string;
    tokenA: string;
    tokenB: string;
    reserveA: number;
    reserveB: number;
    volume24h: number;
    fee: number;
}
export interface QuoteRequest {
    inputMint: string;
    outputMint: string;
    amount: number;
}
export interface QuoteResponse extends MockSwapResult {
    route: string[];
    timestamp: number;
}
