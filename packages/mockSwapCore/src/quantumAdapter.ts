/**
 * Quantum Decision Adapter
 * 
 * Scaffolding for quantum-inspired decision making
 * based on signal analysis and field state
 */

import type { SignalFrame } from './types';
import type { FieldState } from './fieldResonator';
import { getPhaseLockScore } from './signalEngine';

export interface DecisionParams {
  minCoherence: number;
  maxEntropy: number;
  minPhaseLock: number;
  requireFieldLock: boolean;
}

export interface SwapDecision {
  execute: boolean;
  confidence: number;
  reasoning: string[];
  warnings: string[];
  suggestedDelay?: number;
}

export class QuantumDecisionAdapter {
  private params: DecisionParams;

  constructor(params: Partial<DecisionParams> = {}) {
    this.params = {
      minCoherence: params.minCoherence ?? 0.6,
      maxEntropy: params.maxEntropy ?? 0.5,
      minPhaseLock: params.minPhaseLock ?? 0.5,
      requireFieldLock: params.requireFieldLock ?? false,
    };
  }

  /**
   * Make swap decision based on signal and field state
   */
  decide(signal: SignalFrame, fieldState: FieldState): SwapDecision {
    const reasoning: string[] = [];
    const warnings: string[] = [];
    let confidence = 0;
    let execute = true;

    // Check coherence
    if (signal.coherence >= this.params.minCoherence) {
      reasoning.push(`High coherence (${(signal.coherence * 100).toFixed(1)}%)`);
      confidence += 0.3;
    } else {
      warnings.push(`Low coherence (${(signal.coherence * 100).toFixed(1)}%)`);
      execute = false;
    }

    // Check entropy
    if (signal.entropy <= this.params.maxEntropy) {
      reasoning.push(`Low entropy (${(signal.entropy * 100).toFixed(1)}%)`);
      confidence += 0.3;
    } else {
      warnings.push(`High entropy (${(signal.entropy * 100).toFixed(1)}%)`);
      execute = false;
    }

    // Check phase lock
    const phaseLock = getPhaseLockScore(signal);
    if (phaseLock >= this.params.minPhaseLock) {
      reasoning.push(`Strong phase lock (${(phaseLock * 100).toFixed(1)}%)`);
      confidence += 0.2;
    } else {
      warnings.push(`Weak phase lock (${(phaseLock * 100).toFixed(1)}%)`);
    }

    // Check field state
    if (fieldState.regime === 'coherent') {
      reasoning.push('Field in coherent regime');
      confidence += 0.2;
    } else if (fieldState.regime === 'chaos') {
      warnings.push('Field in chaotic regime');
      execute = false;
    } else {
      warnings.push('Field in transition');
    }

    // Check field lock if required
    if (this.params.requireFieldLock && !fieldState.locked) {
      warnings.push('Field not locked');
      execute = false;
    } else if (fieldState.locked) {
      reasoning.push('Field locked');
      confidence = Math.min(1, confidence + 0.1);
    }

    // Suggest delay if not executing
    let suggestedDelay: number | undefined;
    if (!execute) {
      // Suggest delay based on field state
      if (fieldState.regime === 'chaos') {
        suggestedDelay = 30000; // 30 seconds
      } else {
        suggestedDelay = 10000; // 10 seconds
      }
    }

    return {
      execute,
      confidence: Math.min(1, confidence),
      reasoning,
      warnings,
      suggestedDelay,
    };
  }

  /**
   * Update decision parameters
   */
  updateParams(params: Partial<DecisionParams>): void {
    this.params = { ...this.params, ...params };
  }

  /**
   * Get current parameters
   */
  getParams(): DecisionParams {
    return { ...this.params };
  }

  /**
   * Simulate quantum measurement collapse
   * (for demo purposes - adds some randomness to decisions)
   */
  quantumMeasurement(baseConfidence: number): number {
    // Add small quantum fluctuation
    const fluctuation = (Math.random() - 0.5) * 0.1;
    return Math.max(0, Math.min(1, baseConfidence + fluctuation));
  }
}
