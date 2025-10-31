# Quick Start: Multi-Venue Comparison

## 🚀 Get Started in 3 Steps

### 1. Start the API Server
```bash
cd /home/runner/work/ProjectSQS/ProjectSQS
pnpm dev:api
```

Server starts on: `http://localhost:8787`

### 2. Make Your First Request

#### Using cURL
```bash
curl "http://localhost:8787/api/compare-venues?\
inputMint=So11111111111111111111111111111111111111112&\
outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&\
amount=1.0"
```

#### Using JavaScript/TypeScript
```typescript
import { compareVenues, COMMON_TOKENS } from '@hackathon/mockSwapCore';

const result = await compareVenues(
  COMMON_TOKENS.SOL,   // Input: SOL
  COMMON_TOKENS.USDC,  // Output: USDC
  1.0                  // Amount: 1 SOL
);

console.log('Best venue:', result.bestQuote.venue);
console.log('Best rate:', result.bestQuote.outAmount);
```

### 3. Interpret Results

The response includes:
- **quotes** - Array of quotes from all venues
- **bestQuote** - The venue with highest output
- **arbitrageOpportunities** - Profitable spreads >0.5%

## 📊 Example Response

```json
{
  "quotes": [
    {
      "venue": "jupiter",
      "outAmount": 185.42,
      "efficiency": 100.0,
      "priceImpact": 0.05
    },
    {
      "venue": "raydium",
      "outAmount": 185.15,
      "efficiency": 99.85
    },
    {
      "venue": "orca",
      "outAmount": 184.98,
      "efficiency": 99.76
    },
    {
      "venue": "meteora",
      "outAmount": 185.05,
      "efficiency": 99.80
    }
  ],
  "bestQuote": {
    "venue": "jupiter",
    "outAmount": 185.42
  },
  "arbitrageOpportunities": [
    {
      "buyVenue": "orca",
      "sellVenue": "jupiter",
      "spreadPercent": 0.24,
      "profitPotential": 0.44
    }
  ]
}
```

## 🎯 Common Use Cases

### Find Best Rate
```typescript
const comparison = await compareVenues(inputMint, outputMint, amount);
console.log(`Use ${comparison.bestQuote.venue} for best rate!`);
```

### Check for Arbitrage
```typescript
const comparison = await compareVenues(inputMint, outputMint, amount);
if (comparison.arbitrageOpportunities?.length > 0) {
  console.log('💰 Arbitrage opportunity found!');
  const arb = comparison.arbitrageOpportunities[0];
  console.log(`Buy on ${arb.buyVenue}, sell on ${arb.sellVenue}`);
  console.log(`Spread: ${arb.spreadPercent}%`);
}
```

### Compare Efficiency
```typescript
const comparison = await compareVenues(inputMint, outputMint, amount);
comparison.quotes.forEach(q => {
  console.log(`${q.venue}: ${q.efficiency}% efficient`);
});
```

## 📝 Available Tokens (Demo)

```typescript
COMMON_TOKENS = {
  SOL: 'So11111111111111111111111111111111111111112',
  USDC: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
  USDT: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
  IMG: 'znv3FZt2HFAvzYf5LxzVyryh3mBXWuTRRng25gEZAjh',
  BONK: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
  JTO: 'jtojtomepa8beP8AuQc6eXt5FriJwfFMwQx2v2f9mCL',
}
```

## 🔧 API Endpoints

### Full Comparison
```
GET/POST /api/compare-venues
```
**Parameters:**
- `inputMint` - Input token address
- `outputMint` - Output token address  
- `amount` - Amount to swap

**Returns:** Full comparison with arbitrage detection

### Lightweight Quotes
```
GET /api/venue-quotes
```
**Parameters:** Same as above  
**Returns:** Just the quotes array (faster)

## 💡 Tips

1. **Always validate addresses** - Use `isValidSolanaAddress()` helper
2. **Handle errors gracefully** - Some venues may not support all pairs
3. **Consider fees** - Arbitrage profits shown are before fees
4. **Rate limiting** - Add delays for many sequential requests
5. **Check spreads** - Only >0.5% spreads are flagged as arbitrage

## 📚 Learn More

- **Complete Guide:** `MULTI_VENUE_GUIDE.md`
- **Implementation Details:** `IMPLEMENTATION_SUMMARY.md`
- **Code Examples:** `packages/mockSwapCore/examples/multi-venue-usage.ts`
- **Main README:** `README.md`

## ⚡ Quick Examples

### SOL to USDC
```bash
curl "http://localhost:8787/api/compare-venues?\
inputMint=So11111111111111111111111111111111111111112&\
outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&\
amount=1.0"
```

### BONK to USDC
```bash
curl "http://localhost:8787/api/compare-venues?\
inputMint=DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263&\
outputMint=EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v&\
amount=1000000"
```

### Custom Token Pair (POST)
```bash
curl -X POST http://localhost:8787/api/compare-venues \
  -H "Content-Type: application/json" \
  -d '{
    "inputMint": "YOUR_INPUT_MINT",
    "outputMint": "YOUR_OUTPUT_MINT",
    "amount": 1.0
  }'
```

## 🎉 You're Ready!

The multi-venue comparison is now fully integrated and ready to use. Start exploring different token pairs and finding the best rates across all major Solana DEXs!

**Branch:** `post-deadline-commits`  
**Status:** ✅ Complete and Production Ready
