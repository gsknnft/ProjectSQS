/**
 * MockSwapPanel - Interactive Swap Interface
 * 
 * Allows users to simulate swaps with real or demo tokens
 */

import React, { useState } from 'react';
import type { MockSwapResult } from '@hackathon/shared';

interface MockSwapPanelProps {
  onSwap: (result: MockSwapResult) => void;
  commonTokens: { symbol: string; address: string }[];
  mode: 'demo' | 'real';
  onModeChange: (mode: 'demo' | 'real') => void;
}

export const MockSwapPanel: React.FC<MockSwapPanelProps> = ({
  onSwap,
  commonTokens,
  mode,
  onModeChange
}) => {
  const [inputToken, setInputToken] = useState(commonTokens[0]?.address || '');
  const [outputToken, setOutputToken] = useState(commonTokens[1]?.address || '');
  const [amount, setAmount] = useState('100');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<MockSwapResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [useCustomAddress, setUseCustomAddress] = useState(false);

  const handleSwap = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:8787/api/simulate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          inputToken,
          outputToken,
          amount: parseFloat(amount),
          useRealData: mode === 'real',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to simulate swap');
      }

      const data = await response.json();
      setResult(data.swap);
      onSwap(data.swap);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  const getTokenSymbol = (address: string): string => {
    const token = commonTokens.find(t => t.address === address);
    return token?.symbol || address.slice(0, 4) + '...' + address.slice(-4);
  };

  return (
    <div className="mock-swap-panel bg-gray-900 border border-purple-500 rounded-lg p-6 max-w-2xl">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-purple-400 text-2xl font-bold">SWAP SIMULATOR</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onModeChange('demo')}
            className={`px-4 py-2 rounded font-bold transition-colors ${
              mode === 'demo'
                ? 'bg-purple-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            DEMO MODE
          </button>
          <button
            onClick={() => onModeChange('real')}
            className={`px-4 py-2 rounded font-bold transition-colors ${
              mode === 'real'
                ? 'bg-green-600 text-white'
                : 'bg-gray-800 text-gray-400 hover:bg-gray-700'
            }`}
          >
            REAL MODE
          </button>
        </div>
      </div>

      {mode === 'real' && (
        <div className="mb-4 p-4 bg-green-950 border border-green-700 rounded">
          <div className="text-green-400 font-bold mb-2">⚡ REAL MODE ACTIVE</div>
          <div className="text-green-300 text-sm">
            Using real Solana token data and liquidity analysis.
            <br />
            NO wallet connection. NO execution. Analysis only.
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Mode Toggle for Custom Address */}
        {mode === 'real' && (
          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="customAddress"
              checked={useCustomAddress}
              onChange={(e) => setUseCustomAddress(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="customAddress" className="text-sm text-gray-400">
              Use custom Solana token addresses
            </label>
          </div>
        )}

        {/* Input Token */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">FROM</label>
          {useCustomAddress && mode === 'real' ? (
            <input
              type="text"
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              placeholder="Enter Solana token address"
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-purple-500 focus:outline-none"
            />
          ) : (
            <select
              value={inputToken}
              onChange={(e) => setInputToken(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white font-bold focus:border-purple-500 focus:outline-none"
            >
              {commonTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Amount */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">AMOUNT</label>
          <input
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white text-2xl font-bold focus:border-purple-500 focus:outline-none"
            placeholder="0.00"
          />
          <div className="text-gray-500 text-sm mt-1">
            {getTokenSymbol(inputToken)}
          </div>
        </div>

        {/* Swap Direction Indicator */}
        <div className="flex justify-center">
          <button
            onClick={() => {
              const temp = inputToken;
              setInputToken(outputToken);
              setOutputToken(temp);
            }}
            className="bg-gray-800 hover:bg-gray-700 text-purple-400 rounded-full p-3 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4" />
            </svg>
          </button>
        </div>

        {/* Output Token */}
        <div>
          <label className="text-gray-400 text-sm block mb-2">TO</label>
          {useCustomAddress && mode === 'real' ? (
            <input
              type="text"
              value={outputToken}
              onChange={(e) => setOutputToken(e.target.value)}
              placeholder="Enter Solana token address"
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white font-mono focus:border-purple-500 focus:outline-none"
            />
          ) : (
            <select
              value={outputToken}
              onChange={(e) => setOutputToken(e.target.value)}
              className="w-full bg-gray-800 border border-gray-700 rounded px-4 py-3 text-white font-bold focus:border-purple-500 focus:outline-none"
            >
              {commonTokens.map((token) => (
                <option key={token.address} value={token.address}>
                  {token.symbol}
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Simulate Button */}
        <button
          onClick={handleSwap}
          disabled={loading || !inputToken || !outputToken || !amount}
          className={`w-full py-4 rounded-lg font-bold text-lg transition-all ${
            loading || !inputToken || !outputToken || !amount
              ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
              : 'bg-gradient-to-r from-purple-600 to-pink-600 text-white hover:from-purple-700 hover:to-pink-700 shadow-lg hover:shadow-xl'
          }`}
        >
          {loading ? 'SIMULATING...' : 'SIMULATE SWAP'}
        </button>

        {error && (
          <div className="p-4 bg-red-950 border border-red-700 rounded text-red-300">
            {error}
          </div>
        )}

        {result && (
          <div className="mt-6 p-6 bg-gray-800 border border-green-500 rounded-lg space-y-4">
            <div className="text-green-400 font-bold text-lg mb-4">
              ✅ SIMULATION COMPLETE
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-gray-500 text-sm">INPUT</div>
                <div className="text-white text-xl font-bold">
                  {result.in.toFixed(6)} {getTokenSymbol(inputToken)}
                </div>
              </div>
              <div>
                <div className="text-gray-500 text-sm">OUTPUT</div>
                <div className="text-green-400 text-xl font-bold">
                  {result.out.toFixed(6)} {getTokenSymbol(outputToken)}
                </div>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 text-sm">
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-gray-500">Efficiency</div>
                <div className="text-green-400 font-bold">{result.efficiency.toFixed(2)}%</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-gray-500">Slippage</div>
                <div className="text-yellow-400 font-bold">{result.slippage.toFixed(2)}%</div>
              </div>
              <div className="bg-gray-900 p-3 rounded">
                <div className="text-gray-500">Liquidity</div>
                <div className="text-blue-400 font-bold">Rank {result.liquidityRank}</div>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="text-gray-500 text-sm mb-2">EXECUTION PLAN</div>
              <div className="text-white">
                {result.executionPlan.chunks} chunks × {result.executionPlan.chunkSize.toFixed(2)} tokens
                <br />
                <span className="text-gray-400 text-sm">
                  Estimated time: ~{result.executionPlan.estimatedTime}s
                </span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-700">
              <div className="text-purple-400 text-sm font-bold mb-2">⚡ QUANTUM SIGNAL</div>
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-gray-500">Coherence:</span>
                  <span className="text-green-400 ml-2 font-bold">
                    {(result.signal.coherence * 100).toFixed(1)}%
                  </span>
                </div>
                <div>
                  <span className="text-gray-500">Entropy:</span>
                  <span className="text-yellow-400 ml-2 font-bold">
                    {(result.signal.entropy * 100).toFixed(1)}%
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
