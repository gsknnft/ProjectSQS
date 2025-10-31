/**
 * Usage Examples for Mock Swap Core with TRUE On-Chain Reserve Resolution
 */

import {
  mockSwapWithRealData,
  setCustomRpcUrl,
  getRpcConnection,
  getRaydiumPoolReserves,
  resolvePoolId,
  COMMON_TOKENS,
} from '../src/index.js';

// ============================================================================
// Example 1: Basic swap simulation with default RPC
// ============================================================================
async function basicSwapSimulation() {
  console.log('\n📊 Example 1: Basic Swap Simulation');
  console.log('=' .repeat(50));

  const result = await mockSwapWithRealData({
    inputMint: COMMON_TOKENS.SOL,
    outputMint: COMMON_TOKENS.USDC,
    amount: 100_000_000, // 0.1 SOL in lamports
  });

  if ('error' in result) {
    console.error('❌ Error:', result.error);
    return;
  }

  console.log('✅ Swap Simulation Complete');
  console.log(`   Input: ${result.in / 1e9} SOL`);
  console.log(`   Output: ${result.out / 1e6} USDC`);
  console.log(`   Efficiency: ${result.efficiency.toFixed(2)}%`);
  console.log(`   Slippage: ${result.slippage.toFixed(4)}%`);
  console.log(`   Liquidity Rank: ${result.liquidityRank}`);
  console.log(`   Execution Plan:`, result.executionPlan);
}

// ============================================================================
// Example 2: Using custom RPC endpoint
// ============================================================================
async function customRpcSwapSimulation() {
  console.log('\n📊 Example 2: Custom RPC Swap Simulation');
  console.log('='.repeat(50));

  // Set custom RPC globally
  const customRpc = process.env.SOLANA_RPC_URL || 'https://api.mainnet-beta.solana.com';
  setCustomRpcUrl(customRpc);
  console.log(`   Using RPC: ${customRpc}`);

  const result = await mockSwapWithRealData({
    inputMint: COMMON_TOKENS.SOL,
    outputMint: COMMON_TOKENS.USDC,
    amount: 100_000_000,
  });

  if ('error' in result) {
    console.error('❌ Error:', result.error);
    return;
  }

  console.log('✅ Swap Complete with Custom RPC');
  console.log(`   Output: ${result.out / 1e6} USDC`);
}

// ============================================================================
// Example 3: Per-request RPC override
// ============================================================================
async function perRequestRpcOverride() {
  console.log('\n📊 Example 3: Per-Request RPC Override');
  console.log('='.repeat(50));

  const result = await mockSwapWithRealData({
    inputMint: COMMON_TOKENS.SOL,
    outputMint: COMMON_TOKENS.USDC,
    amount: 100_000_000,
    rpcUrl: 'https://api.mainnet-beta.solana.com', // Override per request
  });

  if ('error' in result) {
    console.error('❌ Error:', result.error);
    return;
  }

  console.log('✅ Swap Complete with Override RPC');
  console.log(`   Output: ${result.out / 1e6} USDC`);
}

// ============================================================================
// Example 4: Direct reserve access
// ============================================================================
async function directReserveAccess() {
  console.log('\n📊 Example 4: Direct Reserve Access');
  console.log('='.repeat(50));

  try {
    // 1. Resolve pool ID from token pair
    console.log('   Resolving pool ID...');
    const poolId = await resolvePoolId(
      COMMON_TOKENS.SOL,
      COMMON_TOKENS.USDC
    );

    if (!poolId) {
      console.error('❌ Could not resolve pool ID');
      return;
    }

    console.log(`   ✅ Pool ID: ${poolId}`);

    // 2. Get RPC connection
    const connection = getRpcConnection();

    // 3. Fetch full reserve data
    console.log('   Fetching on-chain reserves...');
    const reserves = await getRaydiumPoolReserves(
      connection,
      poolId,
      {
        mintA: COMMON_TOKENS.SOL,
        mintB: COMMON_TOKENS.USDC,
      }
    );

    console.log('   ✅ Reserve Data Retrieved');
    console.log(`   Pool Type: ${reserves.poolType}`);
    console.log(`   Vault A: ${reserves.vaultA.mint.slice(0, 8)}...`);
    console.log(`   Amount A: ${reserves.vaultA.amount.toString()}`);
    console.log(`   Vault B: ${reserves.vaultB.mint.slice(0, 8)}...`);
    console.log(`   Amount B: ${reserves.vaultB.amount.toString()}`);
    console.log(`   Mid Price: ${reserves.midPrice.toString()}`);
    
    if (reserves.fees) {
      console.log(`   Trade Fee Rate: ${(reserves.fees.tradeFeeRate * 100).toFixed(3)}%`);
    }

    if (reserves.clmmTicks) {
      console.log('   CLMM Tick Data:');
      console.log(`   Current Price: ${reserves.clmmTicks.currentPrice.toString()}`);
      console.log(`   Nearest Lower Tick: ${reserves.clmmTicks.nearestLowerTick}`);
      console.log(`   Nearest Upper Tick: ${reserves.clmmTicks.nearestUpperTick}`);
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// ============================================================================
// Run all examples (commented out as examples for demonstration)
// ============================================================================
/*
async function runAllExamples() {
  console.log('\n╔══════════════════════════════════════════════════╗');
  console.log('║   Mock Swap Core - Usage Examples               ║');
  console.log('╚══════════════════════════════════════════════════╝');

  try {
    await basicSwapSimulation();
    await customRpcSwapSimulation();
    await perRequestRpcOverride();
    await directReserveAccess();

    console.log('\n✅ All examples completed successfully!');
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Run if needed
runAllExamples();
*/

export {
  basicSwapSimulation,
  customRpcSwapSimulation,
  perRequestRpcOverride,
  directReserveAccess,
};
