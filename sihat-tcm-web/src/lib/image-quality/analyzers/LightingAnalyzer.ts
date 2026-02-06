/**
 * Lighting Analyzer
 *
 * Analyzes lighting conditions in medical images including brightness,
 * contrast, exposure, and histogram distribution for optimal image quality.
 */

import { LightingMetrics, ILightingAnalyzer } from "../interfaces/ImageQualityInterfaces";
import { ImageProcessor } from "../core/ImageProcessor";

export class LightingAnalyzer implements ILightingAnalyzer {
  private imageProcessor: ImageProcessor;

  constructor(imageProcessor: ImageProcessor) {
    this.imageProcessor = imageProcessor;
  }

  /**
   * Analyze lighting conditions and return comprehensive metrics
   */
  analyzeLighting(
    imageData: ImageData,
    options?: {
      detailedHistogram?: boolean;
      regionAnalysis?: boolean;
      exposureAnalysis?: boolean;
    }
  ): LightingMetrics {
    const detailedHistogram = options?.detailedHistogram ?? true;
    const regionAnalysis = options?.regionAnalysis ?? false;

    // Calculate basic histogram and brightness
    const histogram = this.imageProcessor.calculateHistogram(imageData, "luminance");
    const brightness = this.calculateAverageBrightness(imageData);
    const contrast = this.calculateContrast(histogram, brightness);

    // Calculate pixel distribution ratios
    const { darkPixelRatio, brightPixelRatio } = this.calculatePixelRatios(histogram, imageData);

    // Calculate overall lighting score
    const score = this.calculateLightingScore(
      brightness,
      contrast,
      darkPixelRatio,
      brightPixelRatio
    );

    return {
      score,
      brightness,
      contrast,
      histogram,
      darkPixelRatio,
      brightPixelRatio,
    };
  }

  /**
   * Calculate average brightness of the image
   */
  private calculateAverageBrightness(imageData: ImageData): number {
    const { data } = imageData;
    let totalBrightness = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      const brightness = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
      totalBrightness += brightness;
    }

    return totalBrightness / pixelCount;
  }

  /**
   * Calculate contrast using standard deviation method
   */
  private calculateContrast(histogram: number[], avgBrightness: number): number {
    let variance = 0;
    let totalPixels = 0;

    for (let i = 0; i < histogram.length; i++) {
      const count = histogram[i];
      if (count > 0) {
        variance += count * Math.pow(i - avgBrightness, 2);
        totalPixels += count;
      }
    }

    if (totalPixels === 0) return 0;

    const standardDeviation = Math.sqrt(variance / totalPixels);

    // Normalize to 0-1 scale (128 is theoretical maximum std dev)
    return Math.min(standardDeviation / 128, 1);
  }

  /**
   * Calculate ratios of dark and bright pixels
   */
  private calculatePixelRatios(
    histogram: number[],
    imageData: ImageData
  ): {
    darkPixelRatio: number;
    brightPixelRatio: number;
  } {
    const totalPixels = imageData.width * imageData.height;

    // Count dark pixels (0-50)
    const darkPixels = histogram.slice(0, 51).reduce((sum, count) => sum + count, 0);

    // Count bright pixels (200-255)
    const brightPixels = histogram.slice(200, 256).reduce((sum, count) => sum + count, 0);

    return {
      darkPixelRatio: darkPixels / totalPixels,
      brightPixelRatio: brightPixels / totalPixels,
    };
  }

  /**
   * Calculate overall lighting quality score
   */
  private calculateLightingScore(
    brightness: number,
    contrast: number,
    darkPixelRatio: number,
    brightPixelRatio: number
  ): number {
    let score = 1.0;

    // Optimal brightness range: 80-180 (out of 255)
    if (brightness < 60) {
      // Too dark
      score *= brightness / 60;
    } else if (brightness > 200) {
      // Too bright
      score *= 1 - (brightness - 200) / 55;
    } else if (brightness >= 60 && brightness <= 200) {
      // Good brightness range, slight bonus for optimal range
      if (brightness >= 80 && brightness <= 180) {
        score *= 1.1; // 10% bonus for optimal range
      }
    }

    // Contrast should be reasonable (not too low, not too high)
    if (contrast < 0.2) {
      // Too low contrast
      score *= contrast / 0.2;
    } else if (contrast > 0.8) {
      // Too high contrast (harsh lighting)
      score *= 1 - (contrast - 0.8) / 0.2;
    }

    // Penalize too many dark pixels (underexposed)
    if (darkPixelRatio > 0.3) {
      score *= 1 - (darkPixelRatio - 0.3) / 0.7;
    }

    // Penalize too many bright pixels (overexposed)
    if (brightPixelRatio > 0.1) {
      score *= 1 - (brightPixelRatio - 0.1) / 0.9;
    }

    // Ensure score stays within bounds
    return Math.max(0, Math.min(1, score));
  }

  /**
   * Analyze lighting in specific regions of the image
   */
  analyzeRegionalLighting(
    imageData: ImageData,
    regions: Array<{
      x: number;
      y: number;
      width: number;
      height: number;
      name: string;
    }>
  ): Array<{
    region: string;
    brightness: number;
    contrast: number;
    score: number;
  }> {
    const results = [];

    for (const region of regions) {
      try {
        const regionData = this.imageProcessor.extractRegion(imageData, region);
        const regionMetrics = this.analyzeLighting(regionData);

        results.push({
          region: region.name,
          brightness: regionMetrics.brightness,
          contrast: regionMetrics.contrast,
          score: regionMetrics.score,
        });
      } catch (error) {
        console.warn(`Failed to analyze region ${region.name}:`, error);
      }
    }

    return results;
  }

  /**
   * Detect exposure problems (over/under exposure)
   */
  detectExposureProblems(imageData: ImageData): {
    overexposed: boolean;
    underexposed: boolean;
    clippedHighlights: number; // percentage
    blockedShadows: number; // percentage
    exposureScore: number; // 0-1
  } {
    const histogram = this.imageProcessor.calculateHistogram(imageData, "luminance");
    const totalPixels = imageData.width * imageData.height;

    // Check for clipped highlights (pure white pixels)
    const clippedHighlights = (histogram[255] / totalPixels) * 100;

    // Check for blocked shadows (pure black pixels)
    const blockedShadows = (histogram[0] / totalPixels) * 100;

    // Check for significant overexposure (very bright pixels)
    const overexposedPixels = histogram.slice(240, 256).reduce((sum, count) => sum + count, 0);
    const overexposedRatio = overexposedPixels / totalPixels;

    // Check for significant underexposure (very dark pixels)
    const underexposedPixels = histogram.slice(0, 16).reduce((sum, count) => sum + count, 0);
    const underexposedRatio = underexposedPixels / totalPixels;

    const overexposed = overexposedRatio > 0.05 || clippedHighlights > 1;
    const underexposed = underexposedRatio > 0.1 || blockedShadows > 1;

    // Calculate exposure score (1 = perfect, 0 = terrible)
    let exposureScore = 1.0;

    if (clippedHighlights > 0) {
      exposureScore -= Math.min(0.3, clippedHighlights / 10);
    }

    if (blockedShadows > 0) {
      exposureScore -= Math.min(0.3, blockedShadows / 10);
    }

    if (overexposedRatio > 0.05) {
      exposureScore -= Math.min(0.2, (overexposedRatio - 0.05) * 4);
    }

    if (underexposedRatio > 0.1) {
      exposureScore -= Math.min(0.2, (underexposedRatio - 0.1) * 2);
    }

    return {
      overexposed,
      underexposed,
      clippedHighlights,
      blockedShadows,
      exposureScore: Math.max(0, exposureScore),
    };
  }

  /**
   * Suggest lighting improvements based on analysis
   */
  suggestLightingImprovements(metrics: LightingMetrics): string[] {
    const suggestions: string[] = [];

    if (metrics.brightness < 60) {
      suggestions.push("Increase lighting or move to a brighter area");
      suggestions.push("Avoid backlighting - ensure light source is in front of the subject");
    } else if (metrics.brightness > 200) {
      suggestions.push("Reduce lighting intensity or move away from bright light sources");
      suggestions.push("Avoid direct sunlight or harsh artificial lighting");
    }

    if (metrics.contrast < 0.2) {
      suggestions.push("Improve lighting contrast - add directional lighting");
      suggestions.push("Avoid flat, diffused lighting that reduces detail visibility");
    } else if (metrics.contrast > 0.8) {
      suggestions.push("Soften harsh lighting with diffusion");
      suggestions.push("Add fill lighting to reduce strong shadows");
    }

    if (metrics.darkPixelRatio > 0.3) {
      suggestions.push("Increase overall exposure or add fill lighting");
      suggestions.push("Check for shadows blocking important details");
    }

    if (metrics.brightPixelRatio > 0.1) {
      suggestions.push("Reduce exposure or avoid reflective surfaces");
      suggestions.push("Check for overexposed areas that may hide important details");
    }

    if (suggestions.length === 0) {
      suggestions.push("Lighting conditions are good for medical imaging");
    }

    return suggestions;
  }

  /**
   * Calculate color temperature estimation (basic)
   */
  estimateColorTemperature(imageData: ImageData): {
    temperature: number; // Kelvin
    tint: "warm" | "neutral" | "cool";
    confidence: number;
  } {
    const { data } = imageData;
    let totalR = 0,
      totalG = 0,
      totalB = 0;
    const pixelCount = data.length / 4;

    for (let i = 0; i < data.length; i += 4) {
      totalR += data[i];
      totalG += data[i + 1];
      totalB += data[i + 2];
    }

    const avgR = totalR / pixelCount;
    const avgG = totalG / pixelCount;
    const avgB = totalB / pixelCount;

    // Simple color temperature estimation based on R/B ratio
    const rbRatio = avgR / Math.max(avgB, 1);

    // Rough mapping to color temperature
    let temperature: number;
    let tint: "warm" | "neutral" | "cool";

    if (rbRatio > 1.2) {
      temperature = 2700 + (rbRatio - 1.2) * 1000; // Warm light
      tint = "warm";
    } else if (rbRatio < 0.8) {
      temperature = 6500 + (0.8 - rbRatio) * 2000; // Cool light
      tint = "cool";
    } else {
      temperature = 5500; // Neutral daylight
      tint = "neutral";
    }

    // Confidence based on how distinct the color cast is
    const confidence = Math.abs(rbRatio - 1.0);

    return {
      temperature: Math.round(temperature),
      tint,
      confidence: Math.min(1, confidence),
    };
  }
}
