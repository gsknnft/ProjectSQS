# Multi-Venue Comparison Guide

## Overview

The **post-deadline-commits** branch introduces comprehensive multi-venue comparison capabilities, allowing you to fetch quotes from multiple Solana DEX venues simultaneously and compare them to find the best rates or identify arbitrage opportunities.

## Supported Venues

The system now supports **four major Solana DEX venues**:

1. **Jupiter** - Premier aggregator that routes through multiple DEXs
2. **Raydium** - Popular AMM with concentrated liquidity (CLMM) support
3. **Orca** - AMM with Whirlpool concentrated liquidity pools
4. **Meteora** - Dynamic AMM with adaptive fees

## Key Features

### 1. Multi-Venue Quote Fetching
Fetch quotes from all venues in parallel for the same token pair:

```typescript
import { fetchAllVenueQuotes, COMMON_TOKENS } from '@hackathon/mockSwapCore';

const quotes = await fetchAllVenueQuotes(
  COMMON_TOKENS.SOL,
  COMMON_TOKENS.USDC,
  1.0 // amount
);
```

### 2. Comprehensive Venue Comparison
Get a complete analysis with best quote and arbitrage opportunities:

```typescript
import { compareVenues } from '@hackathon/mockSwapCore';

const comparison = await compareVenues(
  COMMON_TOKENS.SOL,
  COMMON_TOKENS.USDC,
  1.0
);

console.log('Best venue:', comparison.bestQuote.venue);
console.log('Best output:', comparison.bestQuote.outAmount);
console.log('Arbitrage opportunities:', comparison.arbitrageOpportunities);
```

### 3. Arbitrage Detection
Automatically identify profitable arbitrage opportunities:

```typescript
import { findArbitrageOpportunities } from '@hackathon/mockSwapCore';

const arbOpps = findArbitrageOpportunities(quotes);

arbOpps.forEach(opp => {
  console.log(`Buy on ${opp.buyVenue} @ ${opp.buyPrice}`);
  console.log(`Sell on ${opp.sellVenue} @ ${opp.sellPrice}`);
  console.log(`Spread: ${opp.spreadPercent}%`);
  console.log(`Potential profit: $${opp.profitPotential}`);
});
```

### 4. Efficiency Calculation
Each quote includes an efficiency metric relative to the best available quote:

```typescript
quotes.forEach(quote => {
  console.log(`${quote.venue}: ${quote.efficiency}% efficient`);
});
```

## API Endpoints

### GET/POST `/api/compare-venues`

Full venue comparison with arbitrage detection.

**Parameters:**
- `inputMint` (string) - Input token Solana address
- `outputMint` (string) - Output token Solana address
- `amount` (number) - Amount to swap

**Example Request:**
```bash
curl "http://localhost:8787/api/compare-venues?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1.0"
```

**Example Response:**
```json
{
  "inputMint": "So11111111111111111111111111111111111111112",
  "outputMint": "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v",
  "amount": 1.0,
  "timestamp": 1698765432100,
  "quotes": [
    {
      "venue": "jupiter",
      "inAmount": 1.0,
      "outAmount": 185.42,
      "priceImpact": 0.05,
      "efficiency": 100.0,
      "route": ["Raydium", "Orca"]
    },
    {
      "venue": "raydium",
      "inAmount": 1.0,
      "outAmount": 185.15,
      "fee": 0.0025,
      "efficiency": 99.85,
      "poolId": "..."
    },
    {
      "venue": "orca",
      "inAmount": 1.0,
      "outAmount": 184.98,
      "priceImpact": 0.08,
      "efficiency": 99.76
    },
    {
      "venue": "meteora",
      "inAmount": 1.0,
      "outAmount": 185.05,
      "fee": 0.003,
      "efficiency": 99.80
    }
  ],
  "bestQuote": {
    "venue": "jupiter",
    "inAmount": 1.0,
    "outAmount": 185.42,
    "priceImpact": 0.05,
    "efficiency": 100.0
  },
  "arbitrageOpportunities": [
    {
      "buyVenue": "orca",
      "sellVenue": "jupiter",
      "buyPrice": 184.98,
      "sellPrice": 185.42,
      "spread": 0.44,
      "spreadPercent": 0.24,
      "profitPotential": 0.44
    }
  ]
}
```

### GET `/api/venue-quotes`

Lightweight endpoint for just fetching quotes without full comparison.

**Parameters:**
- `inputMint` (string) - Input token Solana address
- `outputMint` (string) - Output token Solana address
- `amount` (number) - Amount to swap

**Example Request:**
```bash
curl "http://localhost:8787/api/venue-quotes?inputMint=So11111111111111111111111111111111111111112&outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&amount=1.0"
```

## Usage Examples

### Example 1: Find Best Rate

```typescript
import { compareVenues, COMMON_TOKENS } from '@hackathon/mockSwapCore';

async function findBestRate() {
  const comparison = await compareVenues(
    COMMON_TOKENS.SOL,
    COMMON_TOKENS.USDC,
    10.0 // 10 SOL
  );

  console.log(`Best venue: ${comparison.bestQuote.venue}`);
  console.log(`Best rate: ${comparison.bestQuote.outAmount} USDC`);
  
  // Show how much better the best is vs others
  comparison.quotes.forEach(quote => {
    if (quote.venue !== comparison.bestQuote.venue && !quote.error) {
      const diff = comparison.bestQuote.outAmount - quote.outAmount;
      console.log(`${quote.venue}: -$${diff.toFixed(2)} (${quote.efficiency?.toFixed(1)}%)`);
    }
  });
}
```

### Example 2: Monitor for Arbitrage

```typescript
import { compareVenues } from '@hackathon/mockSwapCore';

async function monitorArbitrage(pair: { in: string, out: string }, threshold: number = 0.5) {
  setInterval(async () => {
    const comparison = await compareVenues(pair.in, pair.out, 1.0);
    
    if (comparison.arbitrageOpportunities && comparison.arbitrageOpportunities.length > 0) {
      const best = comparison.arbitrageOpportunities[0];
      
      if (best.spreadPercent >= threshold) {
        console.log(`🚨 ARBITRAGE ALERT!`);
        console.log(`   Spread: ${best.spreadPercent.toFixed(2)}%`);
        console.log(`   Buy: ${best.buyVenue} @ ${best.buyPrice}`);
        console.log(`   Sell: ${best.sellVenue} @ ${best.sellPrice}`);
      }
    }
  }, 10000); // Check every 10 seconds
}

// Monitor SOL/USDC for arbitrage opportunities > 0.5%
monitorArbitrage({
  in: COMMON_TOKENS.SOL,
  out: COMMON_TOKENS.USDC
}, 0.5);
```

### Example 3: Batch Comparison

```typescript
import { compareVenues, COMMON_TOKENS } from '@hackathon/mockSwapCore';

async function comparePairs() {
  const pairs = [
    { in: COMMON_TOKENS.SOL, out: COMMON_TOKENS.USDC, label: 'SOL/USDC' },
    { in: COMMON_TOKENS.SOL, out: COMMON_TOKENS.BONK, label: 'SOL/BONK' },
    { in: COMMON_TOKENS.USDC, out: COMMON_TOKENS.SOL, label: 'USDC/SOL' },
  ];

  for (const pair of pairs) {
    const comp = await compareVenues(pair.in, pair.out, 1.0);
    const validQuotes = comp.quotes.filter(q => !q.error);
    
    console.log(`\n${pair.label}:`);
    console.log(`  Best: ${comp.bestQuote.venue} → ${comp.bestQuote.outAmount}`);
    console.log(`  Available on ${validQuotes.length} venues`);
    
    await new Promise(resolve => setTimeout(resolve, 500)); // Rate limiting
  }
}
```

## TypeScript Types

### VenueQuote
```typescript
interface VenueQuote {
  venue: 'jupiter' | 'raydium' | 'orca' | 'meteora';
  inAmount: number;
  outAmount: number;
  priceImpact?: number;    // Price impact percentage
  fee?: number;            // Fee as decimal (e.g., 0.003 = 0.3%)
  route?: string[];        // Routing path (Jupiter only)
  poolId?: string;         // Pool identifier
  efficiency?: number;     // Efficiency relative to best (0-100%)
  error?: string;          // Error message if quote failed
}
```

### VenueComparison
```typescript
interface VenueComparison {
  inputMint: string;
  outputMint: string;
  amount: number;
  timestamp: number;
  quotes: VenueQuote[];
  bestQuote: VenueQuote;
  arbitrageOpportunities?: ArbitrageOpportunity[];
}
```

### ArbitrageOpportunity
```typescript
interface ArbitrageOpportunity {
  buyVenue: VenueName;
  sellVenue: VenueName;
  buyPrice: number;
  sellPrice: number;
  spread: number;          // Absolute price difference
  spreadPercent: number;   // Percentage spread
  profitPotential: number; // Estimated profit (before fees)
}
```

## Integration with Existing Features

The multi-venue comparison integrates seamlessly with existing signal processing and liquidity analysis:

```typescript
import { 
  compareVenues, 
  mockSwapWithRealData,
  fullSimulation 
} from '@hackathon/mockSwapCore';

// 1. Find best venue
const comparison = await compareVenues(inputMint, outputMint, amount);

// 2. Use best venue for detailed analysis
const swapResult = await mockSwapWithRealData({
  inputMint,
  outputMint,
  amount
});

// 3. Run full simulation with signal processing
const simulation = await fullSimulation(
  inputMint,
  outputMint,
  amount,
  true // use real data
);
```

## Performance Considerations

- **Parallel Fetching**: All venue quotes are fetched in parallel for optimal speed
- **Error Handling**: Failed quotes don't block other venues - graceful degradation
- **Rate Limiting**: Consider adding delays when making many sequential requests
- **Caching**: For production, implement quote caching to reduce API calls

## Limitations & Notes

1. **API Availability**: Some venue APIs may have rate limits or downtime
2. **Token Support**: Not all venues support all token pairs
3. **Fees Not Included**: Arbitrage profit estimates don't include transaction fees
4. **No Execution**: This is analysis-only - no actual trades are executed
5. **Price Impact**: Large trades may have different actual impact than quoted

## Best Practices

1. **Always Check Errors**: Some venues may not support certain token pairs
2. **Consider Fees**: Factor in network fees and DEX fees when calculating profitability
3. **Validate Addresses**: Ensure token addresses are valid Solana addresses
4. **Monitor Spreads**: Spreads > 0.5% may indicate arbitrage opportunities
5. **Test with Small Amounts**: Always test with small amounts first

## Future Enhancements

Potential additions for future versions:
- Historical spread tracking
- More venues (Phoenix, GooseFX, etc.)
- Advanced routing optimization
- Real-time WebSocket price feeds
- Automated execution strategies
- Fee impact calculations

## Support

For issues or questions about multi-venue comparison:
1. Check existing issues in the repository
2. Review the examples in `packages/mockSwapCore/examples/multi-venue-usage.ts`
3. Test with demo mode first before using real data

---

**Post-Deadline Expansion** - This feature was added after the hackathon submission to expand verification capabilities and explore cross-venue arbitrage opportunities.
