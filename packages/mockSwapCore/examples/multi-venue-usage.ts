/**
 * Multi-Venue Comparison Examples
 * 
 * Demonstrates how to use the venue comparison features to:
 * 1. Fetch quotes from multiple venues (Jupiter, Raydium, Orca, Meteora)
 * 2. Compare venues to find the best rate
 * 3. Identify arbitrage opportunities
 * 4. Make informed trading decisions
 */

import {
  compareVenues,
  fetchAllVenueQuotes,
  findBestQuote,
  findArbitrageOpportunities,
  COMMON_TOKENS,
  type VenueComparison,
  type VenueQuote,
} from '../src/index.js';

// ============================================================================
// Example 1: Basic venue comparison
// ============================================================================
async function basicVenueComparison() {
  console.log('\n📊 Example 1: Basic Venue Comparison');
  console.log('=' .repeat(60));

  try {
    const comparison = await compareVenues(
      COMMON_TOKENS.SOL,
      COMMON_TOKENS.USDC,
      1.0 // 1 SOL
    );

    console.log(`\n✅ Comparison Complete`);
    console.log(`   Input: 1 SOL`);
    console.log(`   Output Token: USDC`);
    console.log(`   Timestamp: ${new Date(comparison.timestamp).toISOString()}`);
    console.log(`\n📈 Quotes from All Venues:`);
    
    comparison.quotes.forEach(quote => {
      const status = quote.error ? '❌' : '✅';
      const efficiency = quote.efficiency ? `(${quote.efficiency.toFixed(2)}%)` : '';
      const output = quote.error ? 'N/A' : `${quote.outAmount.toFixed(2)} USDC`;
      const priceImpact = quote.priceImpact ? ` | Impact: ${quote.priceImpact.toFixed(3)}%` : '';
      
      console.log(`   ${status} ${quote.venue.toUpperCase().padEnd(10)} → ${output} ${efficiency}${priceImpact}`);
      if (quote.error) {
        console.log(`      Error: ${quote.error}`);
      }
    });

    console.log(`\n🏆 Best Quote:`);
    console.log(`   Venue: ${comparison.bestQuote.venue.toUpperCase()}`);
    console.log(`   Output: ${comparison.bestQuote.outAmount.toFixed(2)} USDC`);
    console.log(`   Price per SOL: $${comparison.bestQuote.outAmount.toFixed(2)}`);

    if (comparison.arbitrageOpportunities && comparison.arbitrageOpportunities.length > 0) {
      console.log(`\n💰 Arbitrage Opportunities Found:`);
      comparison.arbitrageOpportunities.forEach((arb, index) => {
        console.log(`   ${index + 1}. Buy on ${arb.buyVenue.toUpperCase()} @ ${arb.buyPrice.toFixed(4)}`);
        console.log(`      Sell on ${arb.sellVenue.toUpperCase()} @ ${arb.sellPrice.toFixed(4)}`);
        console.log(`      Spread: ${arb.spreadPercent.toFixed(2)}% | Potential Profit: $${arb.profitPotential.toFixed(2)}`);
      });
    } else {
      console.log(`\n💰 No significant arbitrage opportunities found (spread < 0.5%)`);
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// ============================================================================
// Example 2: Compare multiple token pairs
// ============================================================================
async function compareMultiplePairs() {
  console.log('\n📊 Example 2: Compare Multiple Token Pairs');
  console.log('=' .repeat(60));

  const pairs = [
    { in: COMMON_TOKENS.SOL, out: COMMON_TOKENS.USDC, label: 'SOL → USDC', amount: 1.0 },
    { in: COMMON_TOKENS.USDC, out: COMMON_TOKENS.SOL, label: 'USDC → SOL', amount: 100.0 },
    { in: COMMON_TOKENS.SOL, out: COMMON_TOKENS.BONK, label: 'SOL → BONK', amount: 0.5 },
  ];

  for (const pair of pairs) {
    console.log(`\n🔄 ${pair.label} (${pair.amount} input)`);
    console.log('-'.repeat(60));
    
    try {
      const comparison = await compareVenues(pair.in, pair.out, pair.amount);
      
      // Find valid quotes
      const validQuotes = comparison.quotes.filter(q => !q.error && q.outAmount > 0);
      
      if (validQuotes.length === 0) {
        console.log('   ❌ No valid quotes available for this pair');
        continue;
      }

      // Show results
      validQuotes.forEach(quote => {
        const isBest = quote.venue === comparison.bestQuote.venue;
        const marker = isBest ? '🏆' : '  ';
        console.log(`   ${marker} ${quote.venue.toUpperCase().padEnd(10)} → ${quote.outAmount.toFixed(4)} (${quote.efficiency?.toFixed(1)}%)`);
      });

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    }
    
    // Small delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 500));
  }
}

// ============================================================================
// Example 3: Find best venue with detailed analysis
// ============================================================================
async function findBestVenueDetailed() {
  console.log('\n📊 Example 3: Best Venue with Detailed Analysis');
  console.log('=' .repeat(60));

  try {
    // Fetch quotes from all venues
    const quotes = await fetchAllVenueQuotes(
      COMMON_TOKENS.SOL,
      COMMON_TOKENS.USDC,
      10.0 // 10 SOL (larger amount to see price impact)
    );

    console.log(`\n📋 All Venue Quotes:`);
    quotes.forEach(quote => {
      if (quote.error) {
        console.log(`   ${quote.venue.toUpperCase().padEnd(10)} → ❌ ${quote.error}`);
      } else {
        console.log(`   ${quote.venue.toUpperCase().padEnd(10)} → ${quote.outAmount.toFixed(2)} USDC`);
        if (quote.priceImpact) {
          console.log(`      Price Impact: ${quote.priceImpact.toFixed(3)}%`);
        }
        if (quote.fee) {
          console.log(`      Fee: ${(quote.fee * 100).toFixed(3)}%`);
        }
        if (quote.route && quote.route.length > 0) {
          console.log(`      Route: ${quote.route.join(' → ')}`);
        }
      }
    });

    // Find best
    const bestQuote = findBestQuote(quotes);
    
    console.log(`\n🏆 Best Quote: ${bestQuote.venue.toUpperCase()}`);
    console.log(`   Output: ${bestQuote.outAmount.toFixed(2)} USDC`);
    console.log(`   Effective Price: ${(bestQuote.outAmount / bestQuote.inAmount).toFixed(4)} USDC per SOL`);

    // Calculate how much better the best is compared to others
    const validQuotes = quotes.filter(q => !q.error && q.outAmount > 0);
    if (validQuotes.length > 1) {
      console.log(`\n📊 Comparison to Other Venues:`);
      validQuotes.forEach(quote => {
        if (quote.venue !== bestQuote.venue) {
          const difference = bestQuote.outAmount - quote.outAmount;
          const percentBetter = ((difference / quote.outAmount) * 100);
          console.log(`   vs ${quote.venue.toUpperCase()}: ${percentBetter > 0 ? '+' : ''}${percentBetter.toFixed(2)}% (${difference > 0 ? '+' : ''}$${difference.toFixed(2)})`);
        }
      });
    }

    // Check for arbitrage
    const arbOpportunities = findArbitrageOpportunities(quotes);
    if (arbOpportunities.length > 0) {
      console.log(`\n💰 Arbitrage Analysis:`);
      arbOpportunities.forEach((arb, idx) => {
        console.log(`   Opportunity ${idx + 1}:`);
        console.log(`      Buy ${arb.buyVenue.toUpperCase()} @ ${arb.buyPrice.toFixed(4)}`);
        console.log(`      Sell ${arb.sellVenue.toUpperCase()} @ ${arb.sellPrice.toFixed(4)}`);
        console.log(`      Spread: ${arb.spreadPercent.toFixed(2)}%`);
        console.log(`      Estimated Profit: $${arb.profitPotential.toFixed(2)} (before fees)`);
      });
    }

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// ============================================================================
// Example 4: Real-time monitoring (simulated)
// ============================================================================
async function monitorVenuesRealTime() {
  console.log('\n📊 Example 4: Real-Time Venue Monitoring');
  console.log('=' .repeat(60));
  console.log('Monitoring SOL/USDC across all venues for 3 iterations...\n');

  for (let i = 0; i < 3; i++) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] Iteration ${i + 1}/3`);
    
    try {
      const comparison = await compareVenues(
        COMMON_TOKENS.SOL,
        COMMON_TOKENS.USDC,
        1.0
      );

      const validQuotes = comparison.quotes.filter(q => !q.error);
      
      if (validQuotes.length > 0) {
        validQuotes.forEach(quote => {
          const marker = quote.venue === comparison.bestQuote.venue ? '🏆' : '  ';
          console.log(`   ${marker} ${quote.venue.toUpperCase().padEnd(10)} ${quote.outAmount.toFixed(2)} USDC`);
        });

        if (comparison.arbitrageOpportunities && comparison.arbitrageOpportunities.length > 0) {
          console.log(`   💰 Arbitrage: ${comparison.arbitrageOpportunities[0].spreadPercent.toFixed(2)}% spread!`);
        }
      } else {
        console.log('   ⚠️  No valid quotes this iteration');
      }

    } catch (error) {
      console.log(`   ❌ Error: ${error instanceof Error ? error.message : error}`);
    }

    console.log('');
    
    // Wait before next iteration (only if not the last one)
    if (i < 2) {
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  console.log('Monitoring complete.');
}

// ============================================================================
// Example 5: Custom token comparison
// ============================================================================
async function customTokenComparison() {
  console.log('\n📊 Example 5: Custom Token Comparison');
  console.log('=' .repeat(60));

  // Use actual Solana token addresses
  const customInput = COMMON_TOKENS.JTO; // JTO token
  const customOutput = COMMON_TOKENS.USDC;

  console.log(`\nComparing custom token pair:`);
  console.log(`   Input: ${customInput.slice(0, 8)}...`);
  console.log(`   Output: ${customOutput.slice(0, 8)}...`);

  try {
    const comparison = await compareVenues(customInput, customOutput, 100.0);

    const validQuotes = comparison.quotes.filter(q => !q.error && q.outAmount > 0);

    if (validQuotes.length === 0) {
      console.log('\n⚠️  No venues found liquidity for this pair');
      console.log('This may be a less liquid token or not supported by all venues.');
      return;
    }

    console.log(`\n✅ Found ${validQuotes.length} venue(s) with liquidity:`);
    validQuotes.forEach(quote => {
      const isBest = quote.venue === comparison.bestQuote.venue;
      console.log(`   ${isBest ? '🏆' : '  '} ${quote.venue.toUpperCase().padEnd(10)} → ${quote.outAmount.toFixed(4)} USDC`);
    });

    console.log(`\n🏆 Best venue for this pair: ${comparison.bestQuote.venue.toUpperCase()}`);

  } catch (error) {
    console.error('❌ Error:', error instanceof Error ? error.message : error);
  }
}

// ============================================================================
// Run examples
// ============================================================================
async function runAllExamples() {
  console.log('\n╔══════════════════════════════════════════════════════════╗');
  console.log('║   Multi-Venue Comparison - Usage Examples               ║');
  console.log('║   Post-Hackathon Expansion & Verification                ║');
  console.log('╚══════════════════════════════════════════════════════════╝');

  try {
    await basicVenueComparison();
    await compareMultiplePairs();
    await findBestVenueDetailed();
    await monitorVenuesRealTime();
    await customTokenComparison();

    console.log('\n✅ All examples completed successfully!');
    console.log('\n💡 Tips:');
    console.log('   - Use compareVenues() for full analysis with arbitrage detection');
    console.log('   - Use fetchAllVenueQuotes() for lighter weight queries');
    console.log('   - Monitor spreads > 0.5% for potential arbitrage opportunities');
    console.log('   - Consider fees and slippage when executing actual trades');
    console.log('   - Some venues may not support all token pairs');
    
  } catch (error) {
    console.error('\n❌ Error running examples:', error);
  }
}

// Export examples for selective running
export {
  basicVenueComparison,
  compareMultiplePairs,
  findBestVenueDetailed,
  monitorVenuesRealTime,
  customTokenComparison,
  runAllExamples,
};

// Uncomment to run all examples
// runAllExamples().catch(console.error);
