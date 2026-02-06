/**
 * Blur Detector
 *
 * Implements various blur detection algorithms for medical image quality assessment.
 * Provides multiple methods including Laplacian variance, Sobel gradient, and Tenengrad.
 */

import { BlurMetrics, IBlurDetector } from "../interfaces/ImageQualityInterfaces";
import { ImageProcessor } from "../core/ImageProcessor";

export class BlurDetector implements IBlurDetector {
  private imageProcessor: ImageProcessor;

  constructor(imageProcessor: ImageProcessor) {
    this.imageProcessor = imageProcessor;
  }

  /**
   * Detect blur using multiple methods and return comprehensive metrics
   */
  detectBlur(
    imageData: ImageData,
    options?: {
      method?: "laplacian" | "sobel" | "gradient" | "auto";
      sampleRegions?: boolean;
      detailedAnalysis?: boolean;
    }
  ): BlurMetrics {
    const method = options?.method || "auto";
    const sampleRegions = options?.sampleRegions ?? false;

    let primaryScore: number;
    let variance: number;
    let selectedMethod: "laplacian" | "sobel" | "gradient";

    if (method === "auto") {
      // Use multiple methods and combine results
      const laplacianResult = this.detectBlurLaplacian(imageData, sampleRegions);
      const sobelResult = this.detectBlurSobel(imageData, sampleRegions);
      const gradientResult = this.detectBlurGradient(imageData, sampleRegions);

      // Weight the results (Laplacian is generally most reliable for medical images)
      primaryScore =
        laplacianResult.score * 0.5 + sobelResult.score * 0.3 + gradientResult.score * 0.2;
      variance = laplacianResult.variance;
      selectedMethod = "laplacian";
    } else {
      const result = this.detectBlurByMethod(imageData, method, sampleRegions);
      primaryScore = result.score;
      variance = result.variance;
      selectedMethod = method;
    }

    // Calculate confidence based on consistency across methods
    const confidence = this.calculateConfidence(imageData, primaryScore);

    return {
      score: primaryScore,
      variance,
      method: selectedMethod,
      confidence,
    };
  }

  /**
   * Laplacian variance method - most common for blur detection
   */
  private detectBlurLaplacian(
    imageData: ImageData,
    sampleRegions: boolean = false
  ): {
    score: number;
    variance: number;
  } {
    const { width, height } = imageData;
    const gray = this.imageProcessor.convertToGrayscale(imageData);

    // Laplacian kernel
    const kernel = [-1, -1, -1, -1, 8, -1, -1, -1, -1];

    let variance = 0;
    let count = 0;

    if (sampleRegions) {
      // Sample multiple regions for more robust detection
      const regions = this.getSampleRegions(width, height);

      for (const region of regions) {
        const regionVariance = this.calculateLaplacianVarianceInRegion(
          gray,
          width,
          height,
          region,
          kernel
        );
        variance += regionVariance.variance;
        count += regionVariance.count;
      }
    } else {
      // Process entire image
      for (let y = 1; y < height - 1; y++) {
        for (let x = 1; x < width - 1; x++) {
          const laplacian = this.applyLaplacianKernel(gray, width, x, y, kernel);
          variance += laplacian * laplacian;
          count++;
        }
      }
    }

    const normalizedVariance = count > 0 ? variance / count : 0;

    // Normalize to 0-1 scale (higher = sharper)
    // Typical values: blurry < 100, sharp > 1000
    const score = Math.min(normalizedVariance / 1000, 1);

    return {
      score,
      variance: normalizedVariance,
    };
  }

  /**
   * Sobel gradient method - good for edge-based blur detection
   */
  private detectBlurSobel(
    imageData: ImageData,
    sampleRegions: boolean = false
  ): {
    score: number;
    variance: number;
  } {
    const { width, height } = imageData;
    const gray = this.imageProcessor.convertToGrayscale(imageData);

    // Sobel kernels
    const sobelX = [-1, 0, 1, -2, 0, 2, -1, 0, 1];
    const sobelY = [-1, -2, -1, 0, 0, 0, 1, 2, 1];

    let totalGradient = 0;
    let count = 0;

    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const gx = this.applyKernel3x3(gray, width, x, y, sobelX);
        const gy = this.applyKernel3x3(gray, width, x, y, sobelY);
        const gradient = Math.sqrt(gx * gx + gy * gy);

        totalGradient += gradient;
        count++;
      }
    }

    const avgGradient = count > 0 ? totalGradient / count : 0;

    // Normalize to 0-1 scale
    const score = Math.min(avgGradient / 100, 1);

    return {
      score,
      variance: avgGradient,
    };
  }

  /**
   * Gradient-based method using simple differences
   */
  private detectBlurGradient(
    imageData: ImageData,
    sampleRegions: boolean = false
  ): {
    score: number;
    variance: number;
  } {
    const { width, height } = imageData;
    const gray = this.imageProcessor.convertToGrayscale(imageData);

    let totalGradient = 0;
    let count = 0;

    for (let y = 0; y < height - 1; y++) {
      for (let x = 0; x < width - 1; x++) {
        const current = gray[y * width + x];
        const right = gray[y * width + (x + 1)];
        const down = gray[(y + 1) * width + x];

        const gradientX = Math.abs(right - current);
        const gradientY = Math.abs(down - current);
        const gradient = Math.sqrt(gradientX * gradientX + gradientY * gradientY);

        totalGradient += gradient;
        count++;
      }
    }

    const avgGradient = count > 0 ? totalGradient / count : 0;

    // Normalize to 0-1 scale
    const score = Math.min(avgGradient / 50, 1);

    return {
      score,
      variance: avgGradient,
    };
  }

  /**
   * Detect blur using specified method
   */
  private detectBlurByMethod(
    imageData: ImageData,
    method: "laplacian" | "sobel" | "gradient",
    sampleRegions: boolean
  ): { score: number; variance: number } {
    switch (method) {
      case "laplacian":
        return this.detectBlurLaplacian(imageData, sampleRegions);
      case "sobel":
        return this.detectBlurSobel(imageData, sampleRegions);
      case "gradient":
        return this.detectBlurGradient(imageData, sampleRegions);
      default:
        return this.detectBlurLaplacian(imageData, sampleRegions);
    }
  }

  /**
   * Calculate confidence in blur detection result
   */
  private calculateConfidence(imageData: ImageData, primaryScore: number): number {
    // Test multiple methods and check consistency
    const laplacian = this.detectBlurLaplacian(imageData);
    const sobel = this.detectBlurSobel(imageData);
    const gradient = this.detectBlurGradient(imageData);

    const scores = [laplacian.score, sobel.score, gradient.score];
    const mean = scores.reduce((a, b) => a + b, 0) / scores.length;
    const variance =
      scores.reduce((acc, score) => acc + Math.pow(score - mean, 2), 0) / scores.length;
    const standardDeviation = Math.sqrt(variance);

    // Higher confidence when methods agree (low standard deviation)
    const consistency = Math.max(0, 1 - standardDeviation / 0.5);

    // Higher confidence for extreme values (very sharp or very blurry)
    const extremeness = Math.abs(primaryScore - 0.5) * 2;

    return Math.min(1, consistency * 0.7 + extremeness * 0.3);
  }

  /**
   * Get sample regions for regional blur analysis
   */
  private getSampleRegions(
    width: number,
    height: number
  ): Array<{
    x: number;
    y: number;
    width: number;
    height: number;
  }> {
    const regionSize = Math.min(width, height) / 4;
    const regions = [];

    // Center region
    regions.push({
      x: (width - regionSize) / 2,
      y: (height - regionSize) / 2,
      width: regionSize,
      height: regionSize,
    });

    // Corner regions
    regions.push(
      { x: 0, y: 0, width: regionSize, height: regionSize },
      { x: width - regionSize, y: 0, width: regionSize, height: regionSize },
      { x: 0, y: height - regionSize, width: regionSize, height: regionSize },
      { x: width - regionSize, y: height - regionSize, width: regionSize, height: regionSize }
    );

    return regions;
  }

  /**
   * Calculate Laplacian variance in a specific region
   */
  private calculateLaplacianVarianceInRegion(
    gray: number[],
    width: number,
    height: number,
    region: { x: number; y: number; width: number; height: number },
    kernel: number[]
  ): { variance: number; count: number } {
    let variance = 0;
    let count = 0;

    const startX = Math.max(1, Math.floor(region.x));
    const endX = Math.min(width - 1, Math.ceil(region.x + region.width));
    const startY = Math.max(1, Math.floor(region.y));
    const endY = Math.min(height - 1, Math.ceil(region.y + region.height));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const laplacian = this.applyLaplacianKernel(gray, width, x, y, kernel);
        variance += laplacian * laplacian;
        count++;
      }
    }

    return { variance, count };
  }

  /**
   * Apply Laplacian kernel at specific position
   */
  private applyLaplacianKernel(
    gray: number[],
    width: number,
    x: number,
    y: number,
    kernel: number[]
  ): number {
    const positions = [
      (y - 1) * width + (x - 1),
      (y - 1) * width + x,
      (y - 1) * width + (x + 1),
      y * width + (x - 1),
      y * width + x,
      y * width + (x + 1),
      (y + 1) * width + (x - 1),
      (y + 1) * width + x,
      (y + 1) * width + (x + 1),
    ];

    let result = 0;
    for (let i = 0; i < 9; i++) {
      result += gray[positions[i]] * kernel[i];
    }

    return result;
  }

  /**
   * Apply 3x3 kernel at specific position
   */
  private applyKernel3x3(
    gray: number[],
    width: number,
    x: number,
    y: number,
    kernel: number[]
  ): number {
    return this.applyLaplacianKernel(gray, width, x, y, kernel);
  }
}
