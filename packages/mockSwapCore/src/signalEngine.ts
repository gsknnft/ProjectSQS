/**
 * Signal Engine - FFT and Coherence Processing
 * 
 * Wraps the REAL signal processing from qtransform and QSignalSuite
 * for visualization and analysis
 */

import type { SignalFrame } from './types';
import {
  generateMockSignal,
  calculateCoherence,
  calculateEntropy,
  findDominantFrequency,
  extractHarmonics,
} from '@hackathon/shared/utils';

// Try to import real FFT processor
let FFTProcessorReal: any;
try {
  const fftModule = require('../../../packages/qtransform/src/fft/fft-processor');
  FFTProcessorReal = fftModule.FFTProcessor;
} catch (e) {
  console.warn('Could not import real FFT processor, using fallback');
  FFTProcessorReal = null;
}

/**
 * Generate signal frame from efficiency data
 * Uses real FFT if available, fallback to mock otherwise
 */
export function generateSignalFrame(
  efficiency: number,
  mode: 'real' | 'demo' = 'demo'
): SignalFrame {
  // Generate input signal based on efficiency
  const signal = generateMockSignal(efficiency);
  
  if (FFTProcessorReal && mode === 'real') {
    try {
      return generateWithRealFFT(signal, efficiency);
    } catch (e) {
      console.warn('Real FFT failed, using fallback:', e);
    }
  }
  
  // Fallback implementation
  return generateWithFallbackFFT(signal, efficiency);
}

/**
 * Generate signal frame using real FFT processor
 */
function generateWithRealFFT(signal: number[], efficiency: number): SignalFrame {
  const fft = new FFTProcessorReal(1024);
  const result = fft.forwardWithPhase(Float64Array.from(signal));
  
  const coherence = calculateCoherence(Array.from(result.magnitude));
  const entropy = calculateEntropy(Array.from(result.magnitude));
  const dominantHz = findDominantFrequency(Array.from(result.magnitude));
  const harmonics = extractHarmonics(Array.from(result.magnitude), dominantHz);
  
  // Calculate average phase
  let sumPhase = 0;
  for (let i = 0; i < result.phase.length; i++) {
    sumPhase += result.phase[i];
  }
  const avgPhase = sumPhase / result.phase.length;
  
  return {
    coherence,
    entropy,
    phase: avgPhase,
    dominantHz,
    harmonics,
    magnitude: Array.from(result.magnitude),
  };
}

/**
 * Fallback FFT using simple DFT (for demo when real FFT unavailable)
 */
function generateWithFallbackFFT(signal: number[], efficiency: number): SignalFrame {
  const N = signal.length;
  const magnitude: number[] = [];
  const phase: number[] = [];
  
  // Simple DFT for demo purposes (only compute first N/2 frequencies)
  for (let k = 0; k < N / 2; k++) {
    let real = 0;
    let imag = 0;
    
    for (let n = 0; n < N; n++) {
      const angle = (2 * Math.PI * k * n) / N;
      real += signal[n] * Math.cos(angle);
      imag -= signal[n] * Math.sin(angle);
    }
    
    magnitude.push(Math.sqrt(real * real + imag * imag));
    phase.push(Math.atan2(imag, real));
  }
  
  const coherence = calculateCoherence(magnitude);
  const entropy = calculateEntropy(magnitude);
  const dominantHz = findDominantFrequency(magnitude);
  const harmonics = extractHarmonics(magnitude, dominantHz);
  
  // Calculate average phase
  const avgPhase = phase.reduce((a, b) => a + b, 0) / phase.length;
  
  return {
    coherence,
    entropy,
    phase: avgPhase,
    dominantHz,
    harmonics,
    magnitude,
  };
}

/**
 * Analyze signal quality
 */
export function analyzeSignalQuality(frame: SignalFrame): {
  quality: 'excellent' | 'good' | 'fair' | 'poor';
  recommendation: string;
} {
  const { coherence, entropy } = frame;
  
  // High coherence and low entropy = excellent
  if (coherence > 0.8 && entropy < 0.3) {
    return {
      quality: 'excellent',
      recommendation: 'Optimal conditions for execution',
    };
  }
  
  if (coherence > 0.6 && entropy < 0.5) {
    return {
      quality: 'good',
      recommendation: 'Favorable conditions',
    };
  }
  
  if (coherence > 0.4 && entropy < 0.7) {
    return {
      quality: 'fair',
      recommendation: 'Moderate conditions, consider waiting',
    };
  }
  
  return {
    quality: 'poor',
    recommendation: 'Unfavorable conditions, delay recommended',
  };
}

/**
 * Generate phase lock score (0-1)
 */
export function getPhaseLockScore(frame: SignalFrame): number {
  // Phase lock is high when coherence is high and entropy is low
  return frame.coherence * (1 - frame.entropy);
}
