/**
 * Field Resonator Mock - Simplified version of GreenResonator
 * 
 * Provides field state analysis without execution
 */

import type { SignalFrame } from './types.js';
import { generateSignalFrame } from './signalEngine.js';

export interface FieldState {
  locked: boolean;
  strength: number;
  regime: 'chaos' | 'transitional' | 'coherent';
  phaseAlignment: number;
}

export class FieldResonatorMock {
  private signalHistory: SignalFrame[] = [];
  private maxHistory = 100;

  /**
   * Analyze field state from signal
   */
  analyzeFieldState(signal: SignalFrame): FieldState {
    // Add to history
    this.signalHistory.push(signal);
    if (this.signalHistory.length > this.maxHistory) {
      this.signalHistory.shift();
    }

    // Calculate field metrics
    const avgCoherence = this.getAverageCoherence();
    const avgEntropy = this.getAverageEntropy();
    const phaseStability = this.getPhaseStability();

    // Determine if field is locked
    const locked = avgCoherence > 0.7 && avgEntropy < 0.4 && phaseStability > 0.6;

    // Calculate field strength
    const strength = (avgCoherence + (1 - avgEntropy) + phaseStability) / 3;

    // Determine regime
    let regime: 'chaos' | 'transitional' | 'coherent';
    if (avgCoherence > 0.7 && avgEntropy < 0.4) {
      regime = 'coherent';
    } else if (avgCoherence < 0.4 || avgEntropy > 0.7) {
      regime = 'chaos';
    } else {
      regime = 'transitional';
    }

    return {
      locked,
      strength,
      regime,
      phaseAlignment: phaseStability,
    };
  }

  /**
   * Get average coherence over history
   */
  private getAverageCoherence(): number {
    if (this.signalHistory.length === 0) return 0;
    
    const sum = this.signalHistory.reduce((acc, s) => acc + s.coherence, 0);
    return sum / this.signalHistory.length;
  }

  /**
   * Get average entropy over history
   */
  private getAverageEntropy(): number {
    if (this.signalHistory.length === 0) return 1;
    
    const sum = this.signalHistory.reduce((acc, s) => acc + s.entropy, 0);
    return sum / this.signalHistory.length;
  }

  /**
   * Calculate phase stability
   */
  private getPhaseStability(): number {
    if (this.signalHistory.length < 2) return 0;

    // Calculate variance in phase
    const phases = this.signalHistory.map(s => s.phase);
    const mean = phases.reduce((a, b) => a + b, 0) / phases.length;
    
    let variance = 0;
    for (const phase of phases) {
      // Handle phase wrapping
      let diff = phase - mean;
      while (diff > Math.PI) diff -= 2 * Math.PI;
      while (diff < -Math.PI) diff += 2 * Math.PI;
      variance += diff * diff;
    }
    variance /= phases.length;

    // Convert variance to stability score (0-1)
    // Low variance = high stability
    const maxVariance = Math.PI * Math.PI;
    return Math.max(0, 1 - variance / maxVariance);
  }

  /**
   * Simulate resonance pulse
   */
  simulatePulse(efficiency: number): {
    signal: SignalFrame;
    fieldState: FieldState;
    recommendation: string;
  } {
    const signal = generateSignalFrame(efficiency);
    const fieldState = this.analyzeFieldState(signal);

    let recommendation: string;
    if (fieldState.regime === 'coherent') {
      recommendation = 'Field coherent - optimal execution window';
    } else if (fieldState.regime === 'transitional') {
      recommendation = 'Field transitioning - monitor for stability';
    } else {
      recommendation = 'Field chaotic - wait for coherence';
    }

    return {
      signal,
      fieldState,
      recommendation,
    };
  }

  /**
   * Reset history
   */
  reset(): void {
    this.signalHistory = [];
  }

  /**
   * Get signal history for visualization
   */
  getHistory(): SignalFrame[] {
    return [...this.signalHistory];
  }
}
