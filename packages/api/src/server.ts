/**
 * Hackathon API Server
 * 
 * Express server providing endpoints for mock swaps and signal analysis
 * NO WALLET CONNECTION - NO EXECUTION - DEMO/ANALYSIS ONLY
 */

import express, { Request, Response, Express } from 'express';
import cors from 'cors';
import {
  mockSwap,
  mockSwapWithRealData,
  fullSimulation,
  compareVenues,
  fetchAllVenueQuotes,
} from '../../mockSwapCore/dist/index.js';
// Local demo token list and address validator to avoid cross-package coupling in dev
const COMMON_TOKENS: Record<string, string> = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  IMG: 'imGNhoP6i8z7MqZmZwXgZQFdwDG7JHFUA9cRCJrGG4e',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
};

function isValidSolanaAddress(address: string): boolean {
  if (!address || address.length < 32 || address.length > 44) return false;
  const base58Regex = /^[1-9A-HJ-NP-Za-km-z]+$/;
  return base58Regex.test(address);
}
import type { QuoteRequest, QuoteResponse } from '@hackathon/shared';

const app: Express = express();
const PORT = process.env.PORT || 8787;

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', mode: 'demo', message: 'Hackathon API - No Execution Mode' });
});

/**
 * GET /api/quote
 * Get a quote for a token swap (demo or real data)
 */
app.get('/api/quote', async (req: Request, res: Response) => {
  try {
    const { inputMint, outputMint, amount, mode = 'demo' } = req.query;

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: inputMint, outputMint, amount' 
      });
    }

    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    let result;
    
    if (mode === 'real' && isValidSolanaAddress(inputMint as string) && isValidSolanaAddress(outputMint as string)) {
      // Use real Solana token data
      result = await mockSwapWithRealData({
        inputMint: inputMint as string,
        outputMint: outputMint as string,
        amount: amountNum,
      });
    } else {
      // Use demo data
      result = await mockSwap(
        inputMint as string,
        outputMint as string,
        amountNum
      );
    }

    if ('error' in result) {
      return res.status(400).json(result);
    }

    const response: QuoteResponse = {
      ...result,
      route: [inputMint as string, outputMint as string],
      timestamp: Date.now(),
    };

    res.json(response);
  } catch (error) {
    console.error('Quote error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * POST /api/simulate
 * Run full simulation with signal processing and field analysis
 */
app.post('/api/simulate', async (req: Request, res: Response) => {
  try {
    const { inputToken, outputToken, amount, useRealData = false } = req.body;

    if (!inputToken || !outputToken || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: inputToken, outputToken, amount' 
      });
    }

    const result = await fullSimulation(
      inputToken,
      outputToken,
      parseFloat(amount),
      useRealData
    );

    res.json(result);
  } catch (error) {
    console.error('Simulation error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * GET /api/signals
 * Stream signal data (for real-time visualization)
 */
app.get('/api/signals', async (req: Request, res: Response) => {
  try {
    const { efficiency = 95 } = req.query;
    
    // Import signal generation
  const { generateSignalFrame } = await import('../../mockSwapCore/dist/index.js');
    
    const signal = generateSignalFrame(parseFloat(efficiency as string));
    
    res.json(signal);
  } catch (error) {
    console.error('Signal error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * POST /api/mock-trade
 * Execute mock trade (NO REAL EXECUTION - for demo purposes)
 */
app.post('/api/mock-trade', async (req: Request, res: Response) => {
  try {
    const { inputToken, outputToken, amount, mode = 'demo' } = req.body;

    if (!inputToken || !outputToken || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters' 
      });
    }

    // Simulate execution delay
    await new Promise(resolve => setTimeout(resolve, 1000));

    let result;
    
    if (mode === 'real' && isValidSolanaAddress(inputToken) && isValidSolanaAddress(outputToken)) {
      result = await mockSwapWithRealData({
        inputMint: inputToken,
        outputMint: outputToken,
        amount: parseFloat(amount),
      });
    } else {
      result = await mockSwap(inputToken, outputToken, parseFloat(amount));
    }

    if ('error' in result) {
      return res.status(400).json(result);
    }

    res.json({
      ...result,
      status: 'simulated',
      message: 'Mock execution complete (NO REAL TRANSACTION)',
      timestamp: Date.now(),
    });
  } catch (error) {
    console.error('Mock trade error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * GET /api/tokens
 * Get list of common tokens for demo
 */
app.get('/api/tokens', (req: Request, res: Response) => {
  res.json({
    tokens: Object.entries(COMMON_TOKENS).map(([symbol, address]) => ({
      symbol,
      address,
      name: symbol,
    })),
  });
});

/**
 * GET /api/pools
 * Get available pools for demo
 */
app.get('/api/pools', (req: Request, res: Response) => {
  res.json({
    pools: [
      { name: 'SOL-USDC', liquidity: 500000000, volume24h: 50000000 },
      { name: 'IMG-SOL', liquidity: 10000000, volume24h: 5000000 },
      { name: 'BONK-USDC', liquidity: 5000000, volume24h: 10000000 },
    ],
  });
});

/**
 * GET /api/compare-venues
 * Compare quotes across all venues (Jupiter, Raydium, Orca, Meteora)
 */
app.get('/api/compare-venues', async (req: Request, res: Response) => {
  try {
    const { inputMint, outputMint, amount } = req.query;

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: inputMint, outputMint, amount' 
      });
    }

    if (!isValidSolanaAddress(inputMint as string) || !isValidSolanaAddress(outputMint as string)) {
      return res.status(400).json({ 
        error: 'Invalid Solana token addresses' 
      });
    }

    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const comparison = await compareVenues(
      inputMint as string,
      outputMint as string,
      amountNum
    );

    res.json(comparison);
  } catch (error) {
    console.error('Venue comparison error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * POST /api/compare-venues
 * Compare quotes across all venues (POST version with body)
 */
app.post('/api/compare-venues', async (req: Request, res: Response) => {
  try {
    const { inputMint, outputMint, amount } = req.body;

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: inputMint, outputMint, amount' 
      });
    }

    if (!isValidSolanaAddress(inputMint) || !isValidSolanaAddress(outputMint)) {
      return res.status(400).json({ 
        error: 'Invalid Solana token addresses' 
      });
    }

    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const comparison = await compareVenues(inputMint, outputMint, amountNum);

    res.json(comparison);
  } catch (error) {
    console.error('Venue comparison error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

/**
 * GET /api/venue-quotes
 * Get quotes from all venues without full comparison (lighter endpoint)
 */
app.get('/api/venue-quotes', async (req: Request, res: Response) => {
  try {
    const { inputMint, outputMint, amount } = req.query;

    if (!inputMint || !outputMint || !amount) {
      return res.status(400).json({ 
        error: 'Missing required parameters: inputMint, outputMint, amount' 
      });
    }

    if (!isValidSolanaAddress(inputMint as string) || !isValidSolanaAddress(outputMint as string)) {
      return res.status(400).json({ 
        error: 'Invalid Solana token addresses' 
      });
    }

    const amountNum = parseFloat(amount as string);
    if (isNaN(amountNum) || amountNum <= 0) {
      return res.status(400).json({ error: 'Invalid amount' });
    }

    const quotes = await fetchAllVenueQuotes(
      inputMint as string,
      outputMint as string,
      amountNum
    );

    res.json({ quotes, timestamp: Date.now() });
  } catch (error) {
    console.error('Venue quotes error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Internal server error' 
    });
  }
});

// Error handling middleware
app.use((err: Error, req: Request, res: Response, next: any) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🚀 Hackathon API Server Running');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`📡 Port: ${PORT}`);
  console.log(`🔒 Mode: DEMO ONLY - NO EXECUTION`);
  console.log(`🌐 Endpoints:`);
  console.log(`   GET  /health`);
  console.log(`   GET  /api/quote`);
  console.log(`   POST /api/simulate`);
  console.log(`   GET  /api/signals`);
  console.log(`   POST /api/mock-trade`);
  console.log(`   GET  /api/tokens`);
  console.log(`   GET  /api/pools`);
  console.log(`   GET  /api/compare-venues`);
  console.log(`   POST /api/compare-venues`);
  console.log(`   GET  /api/venue-quotes`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
});

export default app;
