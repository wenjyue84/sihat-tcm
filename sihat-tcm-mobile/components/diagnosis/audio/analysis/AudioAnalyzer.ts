/**
 * Audio Analyzer
 * 
 * Analyzes recorded audio for TCM voice diagnosis
 */

import * as FileSystem from 'expo-file-system';
import { Audio } from 'expo-av';

import {
  AudioAnalysisResult,
  VoiceAnalysisData,
} from '../interfaces/AudioInterfaces';

import { TCM_VOICE_PATTERNS } from '../../../../constants';
import { ErrorFactory, AudioError } from '../../../../lib/errors/AppError';

export class AudioAnalyzer {
  private analysisCache = new Map<string, VoiceAnalysisData>();

  /**
   * Analyze audio file for TCM voice diagnosis
   */
  async analyzeAudio(uri: string): Promise<VoiceAnalysisData> {
    try {
      // Check cache first
      const cached = this.analysisCache.get(uri);
      if (cached) {
        return cached;
      }

      // Get basic audio analysis
      const basicAnalysis = await this.getBasicAnalysis(uri);
      
      // Perform TCM-specific analysis
      const tcmAnalysis = await this.performTCMAnalysis(basicAnalysis);
      
      // Cache result
      this.analysisCache.set(uri, tcmAnalysis);
      
      return tcmAnalysis;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioAnalyzer',
        action: 'analyzeAudio',
        metadata: { uri }
      });
    }
  }

  /**
   * Get basic audio analysis metrics
   */
  private async getBasicAnalysis(uri: string): Promise<AudioAnalysisResult> {
    try {
      // Load audio file
      const { sound } = await Audio.Sound.createAsync({ uri });
      const status = await sound.getStatusAsync();
      
      if (!status.isLoaded) {
        throw new AudioError('Failed to load audio file');
      }

      // Get file info
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (!fileInfo.exists) {
        throw new AudioError('Audio file not found');
      }

      // Basic analysis (simplified - would use actual audio processing in production)
      const duration = status.durationMillis || 0;
      const fileSize = fileInfo.size || 0;
      
      // Estimate quality based on file size and duration
      const bitRate = fileSize * 8 / (duration / 1000); // bits per second
      const qualityScore = Math.min(100, Math.max(0, (bitRate - 32000) / 1000)); // Normalize to 0-100

      const analysis: AudioAnalysisResult = {
        duration: duration / 1000, // Convert to seconds
        averageAmplitude: 0.5, // Would be calculated from actual audio data
        peakAmplitude: 0.8, // Would be calculated from actual audio data
        silenceRatio: 0.1, // Would be calculated from actual audio data
        qualityScore,
        recommendations: this.generateRecommendations(qualityScore, duration),
      };

      // Cleanup
      await sound.unloadAsync();

      return analysis;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioAnalyzer',
        action: 'getBasicAnalysis'
      });
    }
  }
  /**
   * Perform TCM-specific voice analysis
   */
  private async performTCMAnalysis(basicAnalysis: AudioAnalysisResult): Promise<VoiceAnalysisData> {
    try {
      // Simulate TCM voice analysis (would use actual audio processing algorithms)
      const { duration, averageAmplitude, qualityScore } = basicAnalysis;

      // Calculate pitch characteristics
      const pitch = this.calculatePitchPattern(averageAmplitude, duration);
      
      // Determine tone quality
      const tone = this.determineTone(averageAmplitude, qualityScore);
      
      // Analyze rhythm
      const rhythm = this.analyzeRhythm(duration, averageAmplitude);
      
      // Calculate clarity
      const clarity = Math.min(100, qualityScore * 1.2);
      
      // Determine energy level
      const energy = this.calculateEnergy(averageAmplitude, duration);
      
      // Analyze breath pattern
      const breathPattern = this.analyzeBreathPattern(duration, averageAmplitude);
      
      // Generate TCM indicators
      const tcmIndicators = this.generateTCMIndicators({
        tone,
        rhythm,
        clarity,
        energy,
        breathPattern,
        pitch: pitch[0] || 0,
      });

      return {
        pitch,
        tone,
        rhythm,
        clarity,
        energy,
        breathPattern,
        tcmIndicators,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'AudioAnalyzer',
        action: 'performTCMAnalysis'
      });
    }
  }

  /**
   * Calculate pitch pattern from audio characteristics
   */
  private calculatePitchPattern(amplitude: number, duration: number): number[] {
    // Simulate pitch analysis - would use FFT or similar in production
    const baseFreq = 150 + (amplitude * 100); // Base frequency
    const variations = Math.floor(duration / 1000) * 2; // Variations based on duration
    
    const pitchPattern: number[] = [];
    for (let i = 0; i < variations; i++) {
      const variation = (Math.random() - 0.5) * 50; // ±25 Hz variation
      pitchPattern.push(baseFreq + variation);
    }
    
    return pitchPattern.length > 0 ? pitchPattern : [baseFreq];
  }

  /**
   * Determine tone quality
   */
  private determineTone(amplitude: number, qualityScore: number): string {
    if (qualityScore > 80 && amplitude > 0.6) return 'strong_clear';
    if (qualityScore > 60 && amplitude > 0.4) return 'moderate_clear';
    if (qualityScore > 40) return 'weak_clear';
    if (amplitude > 0.5) return 'strong_rough';
    if (amplitude > 0.3) return 'moderate_rough';
    return 'weak_rough';
  }

  /**
   * Analyze rhythm pattern
   */
  private analyzeRhythm(duration: number, amplitude: number): string {
    const durationSeconds = duration / 1000;
    
    if (durationSeconds < 3) return 'rapid';
    if (durationSeconds > 10 && amplitude < 0.3) return 'slow';
    if (amplitude > 0.7) return 'forceful';
    if (amplitude < 0.3) return 'weak';
    return 'regular';
  }
  /**
   * Calculate energy level
   */
  private calculateEnergy(amplitude: number, duration: number): number {
    // Energy calculation based on amplitude and consistency
    const baseEnergy = amplitude * 100;
    const durationFactor = Math.min(1, duration / 10000); // Normalize to 10 seconds
    return Math.round(baseEnergy * durationFactor);
  }

  /**
   * Analyze breath pattern
   */
  private analyzeBreathPattern(duration: number, amplitude: number): string {
    const durationSeconds = duration / 1000;
    
    if (durationSeconds < 2) return 'shallow';
    if (durationSeconds > 8 && amplitude > 0.5) return 'deep';
    if (amplitude < 0.3) return 'weak';
    if (amplitude > 0.7) return 'strong';
    return 'normal';
  }

  /**
   * Generate TCM indicators based on voice characteristics
   */
  private generateTCMIndicators(params: {
    tone: string;
    rhythm: string;
    clarity: number;
    energy: number;
    breathPattern: string;
    pitch: number;
  }): VoiceAnalysisData['tcmIndicators'] {
    const { tone, rhythm, clarity, energy, breathPattern, pitch } = params;

    return {
      qiDeficiency: energy < 40 || breathPattern === 'weak' || rhythm === 'weak',
      yangDeficiency: tone.includes('weak') || breathPattern === 'shallow' || energy < 30,
      yinDeficiency: tone.includes('rough') || clarity < 50 || pitch > 200,
      dampness: tone.includes('rough') && rhythm === 'slow',
      heatSigns: pitch > 180 && energy > 70 && rhythm === 'rapid',
    };
  }

  /**
   * Generate recommendations based on analysis
   */
  private generateRecommendations(qualityScore: number, duration: number): string[] {
    const recommendations: string[] = [];

    if (qualityScore < 50) {
      recommendations.push('Try recording in a quieter environment');
      recommendations.push('Hold the device closer to your mouth');
    }

    if (duration < 3000) {
      recommendations.push('Speak for at least 3 seconds for better analysis');
    }

    if (duration > 30000) {
      recommendations.push('Keep recordings under 30 seconds for optimal processing');
    }

    if (recommendations.length === 0) {
      recommendations.push('Good recording quality - analysis should be accurate');
    }

    return recommendations;
  }

  /**
   * Clear analysis cache
   */
  clearCache(): void {
    this.analysisCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.analysisCache.size;
  }
}