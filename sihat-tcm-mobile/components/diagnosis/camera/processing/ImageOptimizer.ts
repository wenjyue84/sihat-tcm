/**
 * Image Optimizer
 * 
 * Optimizes captured images for TCM diagnosis analysis
 */

import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system';

import {
  CapturedImage,
  ImageOptimizationOptions,
  QualityMetrics,
  ImageType,
} from '../interfaces/CameraInterfaces';

import { CAMERA_CONFIG } from '../../../../constants';
import { ErrorFactory, ImageError } from '../../../../lib/errors/AppError';

export class ImageOptimizer {
  private optimizationCache = new Map<string, CapturedImage>();

  /**
   * Optimize image for mobile TCM diagnosis
   */
  async optimizeImage(image: CapturedImage, imageType: ImageType): Promise<CapturedImage> {
    try {
      // Check cache first
      const cacheKey = `${image.uri}_${imageType}`;
      const cached = this.optimizationCache.get(cacheKey);
      if (cached) {
        return cached;
      }

      // Get optimization options based on image type
      const options = this.getOptimizationOptions(imageType);
      
      // Apply optimizations
      const optimizedImage = await this.applyOptimizations(image, options);
      
      // Analyze quality
      const qualityMetrics = await this.analyzeImageQuality(optimizedImage);
      optimizedImage.metadata = {
        lighting: this.assessLighting(qualityMetrics),
        focus: this.assessFocus(qualityMetrics),
        angle: this.assessAngle(qualityMetrics),
        overall: qualityMetrics.overall,
      };

      // Cache result
      this.optimizationCache.set(cacheKey, optimizedImage);
      
      return optimizedImage;
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'ImageOptimizer',
        action: 'optimizeImage',
        metadata: { imageType, uri: image.uri }
      });
    }
  }

  /**
   * Apply image optimizations
   */
  private async applyOptimizations(
    image: CapturedImage, 
    options: ImageOptimizationOptions
  ): Promise<CapturedImage> {
    try {
      const actions: ImageManipulator.Action[] = [];

      // Resize if needed
      if (image.width > options.maxWidth || image.height > options.maxHeight) {
        actions.push({
          resize: {
            width: Math.min(image.width, options.maxWidth),
            height: Math.min(image.height, options.maxHeight),
          },
        });
      }

      // Apply format and quality
      const result = await ImageManipulator.manipulateAsync(
        image.uri,
        actions,
        {
          compress: options.quality,
          format: ImageManipulator.SaveFormat.JPEG,
        }
      );

      return {
        ...image,
        uri: result.uri,
        width: result.width,
        height: result.height,
        quality: options.quality,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'ImageOptimizer',
        action: 'applyOptimizations'
      });
    }
  }
  /**
   * Analyze image quality for TCM diagnosis
   */
  private async analyzeImageQuality(image: CapturedImage): Promise<QualityMetrics> {
    try {
      // Get file info for basic analysis
      const fileInfo = await FileSystem.getInfoAsync(image.uri);
      if (!fileInfo.exists) {
        throw new ImageError('Image file not found');
      }

      // Basic quality analysis (simplified - would use actual image processing in production)
      const fileSize = fileInfo.size || 0;
      const pixelCount = image.width * image.height;
      const bytesPerPixel = fileSize / pixelCount;

      // Calculate metrics based on file characteristics
      const brightness = this.calculateBrightness(image, bytesPerPixel);
      const contrast = this.calculateContrast(image, bytesPerPixel);
      const sharpness = this.calculateSharpness(image, fileSize);
      const colorBalance = this.calculateColorBalance(image);

      // Overall quality score
      const overall = Math.round((brightness + contrast + sharpness + colorBalance) / 4);

      const recommendations = this.generateRecommendations({
        brightness,
        contrast,
        sharpness,
        colorBalance,
        overall,
      });

      return {
        brightness,
        contrast,
        sharpness,
        colorBalance,
        overall,
        recommendations,
      };
    } catch (error) {
      throw ErrorFactory.fromUnknownError(error, {
        component: 'ImageOptimizer',
        action: 'analyzeImageQuality'
      });
    }
  }

  /**
   * Get optimization options based on image type
   */
  private getOptimizationOptions(imageType: ImageType): ImageOptimizationOptions {
    const baseOptions = {
      quality: CAMERA_CONFIG.DEFAULT_QUALITY,
      format: 'jpeg' as const,
      compress: 0.8,
    };

    switch (imageType) {
      case 'tongue':
        return {
          ...baseOptions,
          maxWidth: 1024,
          maxHeight: 768,
          quality: 0.9, // Higher quality for tongue analysis
        };
      case 'face':
        return {
          ...baseOptions,
          maxWidth: 800,
          maxHeight: 1200,
          quality: 0.8,
        };
      case 'body':
        return {
          ...baseOptions,
          maxWidth: 600,
          maxHeight: 800,
          quality: 0.7,
        };
      case 'pulse':
        return {
          ...baseOptions,
          maxWidth: 400,
          maxHeight: 400,
          quality: 0.8,
        };
      default:
        return {
          ...baseOptions,
          maxWidth: 800,
          maxHeight: 600,
        };
    }
  }
  // Quality calculation methods (simplified implementations)

  private calculateBrightness(image: CapturedImage, bytesPerPixel: number): number {
    // Estimate brightness based on file characteristics
    const brightnessScore = Math.min(100, Math.max(0, bytesPerPixel * 50));
    return Math.round(brightnessScore);
  }

  private calculateContrast(image: CapturedImage, bytesPerPixel: number): number {
    // Estimate contrast based on file size and dimensions
    const aspectRatio = image.width / image.height;
    const contrastScore = Math.min(100, Math.max(0, (bytesPerPixel * aspectRatio) * 40));
    return Math.round(contrastScore);
  }

  private calculateSharpness(image: CapturedImage, fileSize: number): number {
    // Estimate sharpness based on file size relative to dimensions
    const pixelCount = image.width * image.height;
    const compressionRatio = fileSize / pixelCount;
    const sharpnessScore = Math.min(100, Math.max(0, compressionRatio * 100));
    return Math.round(sharpnessScore);
  }

  private calculateColorBalance(image: CapturedImage): number {
    // Basic color balance estimation (would use actual color analysis in production)
    const aspectRatio = image.width / image.height;
    const balanceScore = Math.min(100, Math.max(0, 75 + (aspectRatio - 1) * 10));
    return Math.round(balanceScore);
  }

  // Quality assessment methods

  private assessLighting(metrics: QualityMetrics): 'good' | 'poor' | 'excellent' {
    if (metrics.brightness > 80) return 'excellent';
    if (metrics.brightness > 60) return 'good';
    return 'poor';
  }

  private assessFocus(metrics: QualityMetrics): 'sharp' | 'blurry' | 'acceptable' {
    if (metrics.sharpness > 80) return 'sharp';
    if (metrics.sharpness > 50) return 'acceptable';
    return 'blurry';
  }

  private assessAngle(metrics: QualityMetrics): 'optimal' | 'suboptimal' | 'poor' {
    if (metrics.overall > 80) return 'optimal';
    if (metrics.overall > 60) return 'suboptimal';
    return 'poor';
  }

  /**
   * Generate recommendations based on quality metrics
   */
  private generateRecommendations(metrics: QualityMetrics): string[] {
    const recommendations: string[] = [];

    if (metrics.brightness < 50) {
      recommendations.push('Increase lighting or move to a brighter area');
    }

    if (metrics.contrast < 50) {
      recommendations.push('Ensure good contrast between subject and background');
    }

    if (metrics.sharpness < 50) {
      recommendations.push('Hold the device steady and ensure proper focus');
    }

    if (metrics.colorBalance < 50) {
      recommendations.push('Check white balance and color temperature');
    }

    if (metrics.overall < 60) {
      recommendations.push('Consider retaking the photo for better analysis');
    }

    if (recommendations.length === 0) {
      recommendations.push('Image quality is good for analysis');
    }

    return recommendations;
  }

  /**
   * Clear optimization cache
   */
  clearCache(): void {
    this.optimizationCache.clear();
  }

  /**
   * Get cache size
   */
  getCacheSize(): number {
    return this.optimizationCache.size;
  }
}