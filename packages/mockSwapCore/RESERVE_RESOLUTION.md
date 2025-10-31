# TRUE On-Chain Reserve Resolution

This package now includes full on-chain reserve resolution capabilities based on SigilNet's `resolve_reserves.ts`. This provides accurate, real-time liquidity data directly from Solana blockchain.

## Features

- **Multi-Protocol Support**: AMM v4, CLMM, and Registry-based pools
- **On-Chain Data**: Fetches TRUE vault balances directly from Solana
- **Custom RPC Support**: Use your own private RPC endpoints
- **Fallback System**: Gracefully falls back to estimation if on-chain fetch fails
- **Fee Discovery**: Extracts actual trading fees from on-chain data

## Quick Start

### Basic Usage (Default RPC)

```typescript
import { mockSwapWithRealData, COMMON_TOKENS } from '@hackathon/mock-swap-core';

const result = await mockSwapWithRealData({
  inputMint: COMMON_TOKENS.SOL,
  outputMint: COMMON_TOKENS.USDC,
  amount: 100000000, // 0.1 SOL in lamports
});

console.log('Output:', result.out);
console.log('Efficiency:', result.efficiency);
```

### Using Custom RPC Endpoint

```typescript
import { mockSwapWithRealData, setCustomRpcUrl } from '@hackathon/mock-swap-core';

// Option 1: Set globally
setCustomRpcUrl('https://my-private-rpc.example.com');

const result1 = await mockSwapWithRealData({
  inputMint: COMMON_TOKENS.SOL,
  outputMint: COMMON_TOKENS.USDC,
  amount: 100000000,
});

// Option 2: Pass per-request
const result2 = await mockSwapWithRealData({
  inputMint: COMMON_TOKENS.SOL,
  outputMint: COMMON_TOKENS.USDC,
  amount: 100000000,
  rpcUrl: 'https://my-other-rpc.example.com', // Overrides global setting
});
```

### Using Environment Variables

Set `SOLANA_RPC_URL` in your environment:

```bash
export SOLANA_RPC_URL="https://my-rpc-endpoint.com"
```

The RPC resolution follows this priority:
1. `rpcUrl` parameter passed to function
2. Global custom RPC (set via `setCustomRpcUrl()`)
3. `SOLANA_RPC_URL` environment variable
4. Default public endpoint

## Advanced Usage

### Direct Reserve Access

```typescript
import {
  getRpcConnection,
  getRaydiumPoolReserves,
  resolvePoolId,
  getLiquidityForMint,
} from '@hackathon/mock-swap-core';

// 1. Resolve pool ID from token pair
const poolId = await resolvePoolId(
  COMMON_TOKENS.SOL,
  COMMON_TOKENS.USDC
);

if (poolId) {
  // 2. Get RPC connection
  const connection = getRpcConnection();
  
  // 3. Fetch full reserve data
  const reserves = await getRaydiumPoolReserves(
    connection,
    poolId,
    {
      mintA: COMMON_TOKENS.SOL,
      mintB: COMMON_TOKENS.USDC,
    }
  );
  
  console.log('Pool Type:', reserves.poolType); // 'ammV4' | 'clmm' | 'registry'
  console.log('Vault A:', reserves.vaultA);
  console.log('Vault B:', reserves.vaultB);
  console.log('Mid Price:', reserves.midPrice.toString());
  console.log('Trade Fee Rate:', reserves.fees?.tradeFeeRate);
  
  // 4. Get liquidity for specific token
  const solLiquidity = getLiquidityForMint(reserves, COMMON_TOKENS.SOL);
  console.log('SOL Liquidity:', solLiquidity);
}
```

### Get Reserves for Specific Token

```typescript
import { getRaydiumReservesForMint, getRpcConnection } from '@hackathon/mock-swap-core';

const connection = getRpcConnection();
const reserves = await getRaydiumReservesForMint(
  connection,
  COMMON_TOKENS.SOL
);

if (reserves) {
  console.log('Pool ID:', reserves.poolId);
  console.log('Liquidity:', reserves.liquidity.toString());
  console.log('Price:', reserves.price.toString());
}
```

## Integration with Your RPC System

If you have a sophisticated RPC management system (like the one shown in the requirements), you can integrate it:

```typescript
import { setCustomRpcUrl, clearConnectionCache } from '@hackathon/mock-swap-core';

// Your RPC manager
import { getHealthyConnection } from './your-rpc-manager';

async function setupRpc() {
  const connection = await getHealthyConnection('mainnet-beta', ['primary']);
  const rpcUrl = connection.rpcEndpoint;
  
  // Set for reserve resolution
  setCustomRpcUrl(rpcUrl);
}

// Call this when your RPC rotates
async function onRpcRotation(newUrl: string) {
  setCustomRpcUrl(newUrl);
  clearConnectionCache(); // Clear cached connections
}
```

## Response Structure

### PoolReserves Type

```typescript
{
  poolType: "ammV4" | "clmm" | "registry",
  vaultA: {
    address: string,
    amount: bigint,
    mint: string,
  },
  vaultB: {
    address: string,
    amount: bigint,
    mint: string,
  },
  midPrice: Decimal,
  depth: number,
  lpSupply?: bigint,
  fees?: {
    tradeFeeRate: number,
    protocolFeeRate?: number,
  },
  clmmTicks?: {
    currentPrice: Decimal,
    nearestLowerTick: number,
    nearestUpperTick: number,
    lowerPrice: Decimal,
    upperPrice: Decimal,
    liquidityNet: string,
  },
  rawState: any,
}
```

## Error Handling

The system gracefully handles errors and falls back to estimation:

```typescript
const result = await mockSwapWithRealData({
  inputMint: COMMON_TOKENS.SOL,
  outputMint: COMMON_TOKENS.USDC,
  amount: 100000000,
});

// Check if on-chain data was used
// Console will show:
// ✅ Using TRUE on-chain reserves: ... (ammV4)
// OR
// ⚠️ Using estimated reserves (on-chain fetch failed)
```

## Dependencies

- `@solana/web3.js`: Solana blockchain interaction
- `@solana/spl-token`: Token account reading
- `@raydium-io/raydium-sdk-v2`: Raydium pool decoding
- `decimal.js`: High-precision decimal math
- `axios`: HTTP requests for API fallbacks

## Performance Considerations

1. **Caching**: Connections are cached by default when using default settings
2. **Fallbacks**: System falls back to API-based estimation if on-chain fetch fails
3. **Timeout**: RPC calls have a 60-second timeout to prevent hanging
4. **Parallel Fetches**: Multiple vault reads are done in parallel

## Debugging

Enable detailed logging:

```typescript
// The system logs automatically:
// - Pool ID resolution
// - Reserve fetch attempts
// - Fallback to estimation
// - Pool type detected (AMM v4, CLMM, Registry)

// Watch console for:
console.log('Resolving pool ID from mint pair...');
console.log('✅ Resolved pool ID: ...');
console.log('Fetching TRUE on-chain reserves...');
console.log('✅ Using TRUE on-chain reserves: ... (ammV4)');
```

## Common Issues

### Issue: "Pool account not found on chain"
**Solution**: Pool ID may be incorrect. Try resolving it from mint pair first.

### Issue: Slow response times
**Solution**: Use a private/paid RPC endpoint with higher rate limits.

### Issue: Rate limiting
**Solution**: Implement your own RPC rotation system and pass URLs dynamically.

### Issue: Wrong reserve amounts
**Solution**: Ensure mints are in correct order (inputMint, outputMint) when calling functions.

## API Reference

### Functions

- `setCustomRpcUrl(url: string)` - Set global custom RPC
- `getCustomRpcUrl()` - Get current custom RPC URL
- `clearConnectionCache()` - Clear cached connections
- `getRpcConnection(overrideUrl?: string)` - Get connection with fallback chain
- `getRaydiumPoolReserves(connection, poolId, mints)` - Fetch full reserve data
- `resolvePoolId(inputMint, outputMint)` - Resolve pool ID from token pair
- `getLiquidityForMint(reserves, mint)` - Extract liquidity for specific token
- `getRaydiumReservesForMint(connection, mint)` - Get reserves for any token

### Types

- `PoolReserves` - Full pool reserve information
- `VaultInfo` - Individual vault information
- `RealTokenConfig` - Configuration with optional rpcUrl field

## Example: Full Integration

```typescript
import {
  mockSwapWithRealData,
  setCustomRpcUrl,
  COMMON_TOKENS,
} from '@hackathon/mock-swap-core';

async function performSwapSimulation() {
  // Configure custom RPC (optional)
  if (process.env.PRIVATE_RPC) {
    setCustomRpcUrl(process.env.PRIVATE_RPC);
  }

  try {
    const result = await mockSwapWithRealData({
      inputMint: COMMON_TOKENS.SOL,
      outputMint: COMMON_TOKENS.USDC,
      amount: 100_000_000, // 0.1 SOL
      slippageBps: 50, // 0.5% slippage
    });

    if ('error' in result) {
      console.error('Swap simulation failed:', result.error);
      return;
    }

    console.log('Simulation Results:');
    console.log('==================');
    console.log('Input:', result.in / 1e9, 'SOL');
    console.log('Output:', result.out / 1e6, 'USDC');
    console.log('Efficiency:', result.efficiency.toFixed(2), '%');
    console.log('Slippage:', result.slippage.toFixed(4), '%');
    console.log('Liquidity Rank:', result.liquidityRank);
    console.log('Execution Plan:', result.executionPlan);
  } catch (error) {
    console.error('Error:', error);
  }
}

performSwapSimulation();
```

## Notes

- **NO EXECUTION**: This system only reads data. It never executes transactions or requires wallet connections.
- **Network Dependency**: Requires connection to Solana RPC. In restricted environments, will fall back to estimation.
- **Token Decimals**: All amounts are in smallest units (lamports for SOL, base units for tokens).
