/**
 * Main Hackathon Demo App
 * 
 * Showcases quantum signal processing vs traditional analysis
 */

import { useState, useEffect } from 'react';
import { SignalScope } from './components/SignalScope';
import { LiquidityFlow } from './components/LiquidityFlow';
import { MockSwapPanel } from './components/MockSwapPanel';
import { TraditionalVsQuantum } from './components/TraditionalVsQuantum';
import type { MockSwapResult } from '@hackathon/shared';

const COMMON_TOKENS = [
  { symbol: 'SOL', address: 'So11111111111111111111111111111111111111112' },
  { symbol: 'USDC', address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v' },
  { symbol: 'USDT', address: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB' },
  { symbol: 'IMG', address: 'imGNhoP6i8z7MqZmZwXgZQFdwDG7JHFUA9cRCJrGG4e' },
  { symbol: 'BONK', address: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263' },
];

function App() {
  const [mode, setMode] = useState<'demo' | 'real'>('demo');
  const [currentSwap, setCurrentSwap] = useState<MockSwapResult | null>(null);
  const [quantumMode, setQuantumMode] = useState(true);
  const [autoDemo, setAutoDemo] = useState(false);
  const [viewMode, setViewMode] = useState<'swap' | 'comparison'>('swap');
  
  // Mock data for comparison view
  const [comparisonData, setComparisonData] = useState({
    data: [] as any[],
    signalData: {
      coherence: [] as number[],
      entropy: [] as number[],
      fieldState: [] as string[],
    },
    anomalies: [] as any[],
  });

  // Auto demo mode - cycles through different swaps
  useEffect(() => {
    if (!autoDemo) return;

    const interval = setInterval(() => {
      // Cycle through different token pairs
      const pairs = [
        ['SOL', 'USDC'],
        ['IMG', 'SOL'],
        ['BONK', 'USDC'],
      ];
      
      const randomPair = pairs[Math.floor(Math.random() * pairs.length)];
      const amount = 100 + Math.random() * 900;
      
      // Trigger auto swap
      console.log(`Auto demo: ${randomPair[0]} -> ${randomPair[1]}, amount: ${amount}`);
    }, 5000);

    return () => clearInterval(interval);
  }, [autoDemo]);

  // Generate comparison data when switching to comparison view
  useEffect(() => {
    if (viewMode === 'comparison') {
      generateComparisonData();
    }
  }, [viewMode]);

  const generateComparisonData = () => {
    const dataPoints = 50;
    const data = [];
    const coherence = [];
    const entropy = [];
    const fieldState = [];
    const anomalies = [];

    let price = 100;
    
    for (let i = 0; i < dataPoints; i++) {
      // Simulate price movement
      const volatility = Math.sin(i / 5) * 0.1 + 0.05;
      price += (Math.random() - 0.5) * volatility * price;
      
      data.push({
        timestamp: Date.now() - (dataPoints - i) * 60000,
        price,
        volume: 1000 + Math.random() * 5000,
      });

      // Generate quantum signal data
      const coh = 0.5 + Math.sin(i / 3) * 0.3 + (Math.random() - 0.5) * 0.1;
      const ent = 0.5 - Math.sin(i / 4) * 0.3 + (Math.random() - 0.5) * 0.1;
      
      coherence.push(Math.max(0, Math.min(1, coh)));
      entropy.push(Math.max(0, Math.min(1, ent)));
      
      // Determine field state
      if (coh > 0.7 && ent < 0.4) {
        fieldState.push('coherent');
      } else if (coh < 0.4 || ent > 0.7) {
        fieldState.push('chaos');
      } else {
        fieldState.push('transitional');
      }

      // Generate anomalies
      // Traditional anomalies (simple price movements)
      if (i > 0 && Math.abs(data[i].price - data[i-1].price) / data[i-1].price > 0.03) {
        anomalies.push({
          timestamp: data[i].timestamp,
          type: 'traditional',
          severity: Math.abs(data[i].price - data[i-1].price) / data[i-1].price > 0.05 ? 'high' : 'medium',
          description: `Large price movement detected: ${((data[i].price - data[i-1].price) / data[i-1].price * 100).toFixed(2)}%`,
        });
      }

      // Quantum anomalies (coherence/entropy based)
      if (coh > 0.8 || ent < 0.2) {
        anomalies.push({
          timestamp: data[i].timestamp,
          type: 'quantum',
          severity: 'high',
          description: `Field resonance peak detected - optimal execution window`,
        });
      } else if (fieldState[i] === 'chaos' && (i === 0 || fieldState[i-1] !== 'chaos')) {
        anomalies.push({
          timestamp: data[i].timestamp,
          type: 'quantum',
          severity: 'medium',
          description: `Field transition to chaos - increased risk`,
        });
      }
    }

    setComparisonData({
      data,
      signalData: { coherence, entropy, fieldState },
      anomalies,
    });
  };

  const handleSwap = (result: MockSwapResult) => {
    setCurrentSwap(result);
  };

  const handleModeChange = (newMode: 'demo' | 'real') => {
    setMode(newMode);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-black to-purple-900 text-white">
      {/* Header */}
      <header className="border-b border-gray-800 bg-black/50 backdrop-blur">
        <div className="container mx-auto px-6 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-green-400 via-blue-500 to-purple-600 bg-clip-text text-transparent">
                SigilNet Quantum Signal Demo
              </h1>
              <p className="text-gray-400 text-sm mt-1">
                Advanced Signal Processing • Field Resonance Analysis • No Execution
              </p>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="quantumMode"
                  checked={quantumMode}
                  onChange={(e) => setQuantumMode(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="quantumMode" className="text-sm text-gray-400">
                  Quantum Mode
                </label>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="autoDemo"
                  checked={autoDemo}
                  onChange={(e) => setAutoDemo(e.target.checked)}
                  className="w-4 h-4"
                />
                <label htmlFor="autoDemo" className="text-sm text-gray-400">
                  Auto Demo
                </label>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setViewMode('swap')}
                  className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                    viewMode === 'swap'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Swap
                </button>
                <button
                  onClick={() => setViewMode('comparison')}
                  className={`px-3 py-1 rounded text-sm font-bold transition-colors ${
                    viewMode === 'comparison'
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
                  }`}
                >
                  Comparison
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-6 py-8">
        {viewMode === 'swap' ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column - Swap Interface */}
            <div className="space-y-6">
              <MockSwapPanel
                onSwap={handleSwap}
                commonTokens={COMMON_TOKENS}
                mode={mode}
                onModeChange={handleModeChange}
              />

              {currentSwap && (
                <LiquidityFlow
                  reserveIn={1000000}
                  reserveOut={500000}
                  swapAmount={currentSwap.in}
                  efficiency={currentSwap.efficiency}
                  impactRatio={currentSwap.slippage / 100}
                  poolName={mode === 'real' ? 'LIVE POOL' : 'DEMO POOL'}
                />
              )}
            </div>

            {/* Right Column - Signal Visualization */}
            <div className="space-y-6">
              {currentSwap && quantumMode && (
                <SignalScope
                  data={currentSwap.signal}
                  showPhase={true}
                  showHarmonics={true}
                />
              )}

              {currentSwap && (
                <div className="bg-gray-900 border border-yellow-500 rounded-lg p-6">
                  <h3 className="text-yellow-400 text-xl font-bold mb-4">
                    📊 ANALYSIS SUMMARY
                  </h3>
                  <div className="space-y-3 text-sm">
                    <div className="flex justify-between">
                      <span className="text-gray-400">Execution Efficiency:</span>
                      <span className={`font-bold ${
                        currentSwap.efficiency > 95 ? 'text-green-400' :
                        currentSwap.efficiency > 90 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {currentSwap.efficiency.toFixed(2)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Signal Coherence:</span>
                      <span className={`font-bold ${
                        currentSwap.signal.coherence > 0.7 ? 'text-green-400' :
                        currentSwap.signal.coherence > 0.5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {(currentSwap.signal.coherence * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-gray-400">Field Entropy:</span>
                      <span className={`font-bold ${
                        currentSwap.signal.entropy < 0.3 ? 'text-green-400' :
                        currentSwap.signal.entropy < 0.5 ? 'text-yellow-400' : 'text-red-400'
                      }`}>
                        {(currentSwap.signal.entropy * 100).toFixed(1)}%
                      </span>
                    </div>
                    <div className="pt-3 border-t border-gray-700">
                      <div className="text-gray-400 mb-2">Recommendation:</div>
                      <div className="text-white">
                        {currentSwap.efficiency > 95 && currentSwap.signal.coherence > 0.7
                          ? '✅ Optimal conditions for execution'
                          : currentSwap.efficiency > 90
                          ? '⚠️ Good conditions, acceptable execution window'
                          : '❌ Suboptimal conditions, consider waiting'}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
          // Comparison View
          <div className="space-y-6">
            <div className="bg-black/50 border border-yellow-500 rounded-lg p-6">
              <h2 className="text-2xl font-bold text-yellow-400 mb-2">
                🌟 Traditional vs Quantum Analysis
              </h2>
              <p className="text-gray-400">
                See how quantum signal processing reveals market dynamics invisible to traditional technical analysis
              </p>
            </div>

            <TraditionalVsQuantum
              data={comparisonData.data}
              signalData={comparisonData.signalData}
              anomalies={comparisonData.anomalies}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-800 bg-black/50 backdrop-blur mt-12">
        <div className="container mx-auto px-6 py-4 text-center text-gray-500 text-sm">
          <p>⚠️ DEMO ONLY - NO WALLET CONNECTION - NO EXECUTION</p>
          <p className="mt-1">Showcasing signal processing and liquidity analysis capabilities</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
