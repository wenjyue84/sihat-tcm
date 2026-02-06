/**
 * Image Quality Validation Interfaces
 *
 * Comprehensive type definitions for medical image quality assessment,
 * including blur detection, lighting analysis, and composition guidance.
 */

export interface ImageQualityResult {
  overall: "excellent" | "good" | "fair" | "poor";
  score: number; // 0-100
  issues: QualityIssue[];
  suggestions: string[];
  metadata?: {
    analysisTime: number;
    imageSize: { width: number; height: number };
    mode: ImageAnalysisMode;
  };
}

export interface QualityIssue {
  type: "blur" | "lighting" | "composition" | "resolution";
  severity: "low" | "medium" | "high";
  message: string;
  confidence: number; // 0-1
  details?: Record<string, any>;
}

export interface CompositionGuide {
  centerX: number; // 0-1, relative position
  centerY: number; // 0-1, relative position
  scale: number; // suggested scale factor
  rotation: number; // suggested rotation in degrees
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

export interface QualityMetrics {
  blur: BlurMetrics;
  lighting: LightingMetrics;
  composition: CompositionMetrics;
  resolution: ResolutionMetrics;
}

export interface BlurMetrics {
  score: number; // 0-1, higher = sharper
  variance: number;
  method: "laplacian" | "sobel" | "gradient";
  confidence: number;
}

export interface LightingMetrics {
  score: number; // 0-1, higher = better lighting
  brightness: number; // 0-255 average
  contrast: number; // 0-1
  histogram: number[]; // 256 bins
  darkPixelRatio: number; // 0-1
  brightPixelRatio: number; // 0-1
}

export interface CompositionMetrics {
  score: number; // 0-1, higher = better composition
  subjectCoverage: number; // 0-1, how much of expected region is covered
  centering: number; // 0-1, how well centered the subject is
  expectedRegion: RegionOfInterest;
  detectedRegion?: RegionOfInterest;
}

export interface ResolutionMetrics {
  score: number; // 0-1, higher = better resolution
  totalPixels: number;
  width: number;
  height: number;
  pixelDensity: number; // pixels per unit area
  adequacyLevel: "insufficient" | "minimal" | "adequate" | "optimal";
}

export interface RegionOfInterest {
  x: number;
  y: number;
  width: number;
  height: number;
  confidence?: number;
}

export type ImageAnalysisMode = "tongue" | "face" | "body" | "general";

export type ImageSource = HTMLVideoElement | HTMLImageElement | string | ImageData;

export interface QualityAnalysisOptions {
  mode: ImageAnalysisMode;
  enableRealTime?: boolean;
  detailedMetrics?: boolean;
  customThresholds?: QualityThresholds;
}

export interface QualityThresholds {
  blur: {
    excellent: number;
    good: number;
    fair: number;
  };
  lighting: {
    minBrightness: number;
    maxBrightness: number;
    minContrast: number;
    maxDarkPixels: number;
    maxBrightPixels: number;
  };
  composition: {
    minCentering: number;
    minCoverage: number;
  };
  resolution: {
    minPixels: Record<ImageAnalysisMode, number>;
    optimalPixels: Record<ImageAnalysisMode, number>;
  };
}

export interface IBlurDetector {
  detectBlur(imageData: ImageData, options?: any): BlurMetrics;
}

export interface ILightingAnalyzer {
  analyzeLighting(imageData: ImageData, options?: any): LightingMetrics;
}

export interface ICompositionAnalyzer {
  analyzeComposition(
    imageData: ImageData,
    mode: ImageAnalysisMode,
    options?: any
  ): CompositionMetrics;
}

export interface IResolutionAnalyzer {
  analyzeResolution(
    imageData: ImageData,
    mode: ImageAnalysisMode,
    options?: any
  ): ResolutionMetrics;
}

export interface IImageProcessor {
  getImageData(source: ImageSource): Promise<ImageData>;
  convertToGrayscale(imageData: ImageData): number[];
  extractRegion(imageData: ImageData, region: RegionOfInterest): ImageData;
}

export interface IQualityScorer {
  calculateOverallScore(metrics: QualityMetrics, mode: ImageAnalysisMode): number;
  generateIssues(metrics: QualityMetrics, thresholds: QualityThresholds): QualityIssue[];
  generateSuggestions(issues: QualityIssue[], mode: ImageAnalysisMode): string[];
}

export interface IImageQualityValidator {
  analyzeImage(source: ImageSource, options: QualityAnalysisOptions): Promise<ImageQualityResult>;
  getCompositionGuide(source: ImageSource, mode: ImageAnalysisMode): Promise<CompositionGuide>;
  assessVideoFrame(video: HTMLVideoElement, mode: ImageAnalysisMode): Promise<ImageQualityResult>;
  getQualityMetrics(source: ImageSource, options: QualityAnalysisOptions): Promise<QualityMetrics>;
  updateThresholds(thresholds: Partial<QualityThresholds>): void;
  dispose(): void;
}

export interface QualityValidationConfig {
  thresholds: QualityThresholds;
  enableGPUAcceleration?: boolean;
  cacheResults?: boolean;
  maxCacheSize?: number;
  debugMode?: boolean;
}
