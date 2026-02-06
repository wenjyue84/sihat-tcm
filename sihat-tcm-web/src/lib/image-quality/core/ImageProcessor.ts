/**
 * Image Processor
 *
 * Handles image data extraction, conversion, and basic processing operations
 * for quality analysis. Provides utilities for working with different image sources.
 */

import {
  ImageSource,
  RegionOfInterest,
  IImageProcessor,
} from "../interfaces/ImageQualityInterfaces";

export class ImageProcessor implements IImageProcessor {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;

  constructor() {
    this.canvas = document.createElement("canvas");
    const ctx = this.canvas.getContext("2d");
    if (!ctx) {
      throw new Error("Canvas 2D context not supported");
    }
    this.ctx = ctx;
  }

  /**
   * Extract ImageData from various source types
   */
  async getImageData(source: ImageSource): Promise<ImageData> {
    if (source instanceof ImageData) {
      return source;
    }

    if (typeof source === "string") {
      return this.getImageDataFromString(source);
    }

    if (source instanceof HTMLVideoElement || source instanceof HTMLImageElement) {
      return this.getImageDataFromElement(source);
    }

    throw new Error("Unsupported image source type");
  }

  /**
   * Convert ImageData to grayscale array
   */
  convertToGrayscale(imageData: ImageData): number[] {
    const { data, width, height } = imageData;
    const gray = new Array(width * height);

    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4;
      // Use luminance formula for accurate grayscale conversion
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    }

    return gray;
  }

  /**
   * Extract a specific region from ImageData
   */
  extractRegion(imageData: ImageData, region: RegionOfInterest): ImageData {
    const { width, height, data } = imageData;

    // Clamp region to image bounds
    const x = Math.max(0, Math.floor(region.x));
    const y = Math.max(0, Math.floor(region.y));
    const w = Math.min(width - x, Math.ceil(region.width));
    const h = Math.min(height - y, Math.ceil(region.height));

    // Create new ImageData for the region
    const regionData = new ImageData(w, h);

    for (let row = 0; row < h; row++) {
      for (let col = 0; col < w; col++) {
        const srcIdx = ((y + row) * width + (x + col)) * 4;
        const dstIdx = (row * w + col) * 4;

        regionData.data[dstIdx] = data[srcIdx]; // R
        regionData.data[dstIdx + 1] = data[srcIdx + 1]; // G
        regionData.data[dstIdx + 2] = data[srcIdx + 2]; // B
        regionData.data[dstIdx + 3] = data[srcIdx + 3]; // A
      }
    }

    return regionData;
  }

  /**
   * Calculate image histogram
   */
  calculateHistogram(
    imageData: ImageData,
    channel: "luminance" | "red" | "green" | "blue" = "luminance"
  ): number[] {
    const { data } = imageData;
    const histogram = new Array(256).fill(0);

    for (let i = 0; i < data.length; i += 4) {
      let value: number;

      switch (channel) {
        case "red":
          value = data[i];
          break;
        case "green":
          value = data[i + 1];
          break;
        case "blue":
          value = data[i + 2];
          break;
        case "luminance":
        default:
          value = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]);
          break;
      }

      histogram[Math.min(255, Math.max(0, value))]++;
    }

    return histogram;
  }

  /**
   * Apply convolution filter to grayscale image
   */
  applyConvolution(grayData: number[], width: number, height: number, kernel: number[]): number[] {
    const kernelSize = Math.sqrt(kernel.length);
    const halfKernel = Math.floor(kernelSize / 2);
    const result = new Array(width * height);

    for (let y = halfKernel; y < height - halfKernel; y++) {
      for (let x = halfKernel; x < width - halfKernel; x++) {
        let sum = 0;

        for (let ky = 0; ky < kernelSize; ky++) {
          for (let kx = 0; kx < kernelSize; kx++) {
            const pixelY = y + ky - halfKernel;
            const pixelX = x + kx - halfKernel;
            const pixelIdx = pixelY * width + pixelX;
            const kernelIdx = ky * kernelSize + kx;

            sum += grayData[pixelIdx] * kernel[kernelIdx];
          }
        }

        result[y * width + x] = sum;
      }
    }

    return result;
  }

  /**
   * Calculate image statistics
   */
  calculateStatistics(imageData: ImageData): {
    mean: number;
    variance: number;
    standardDeviation: number;
    min: number;
    max: number;
  } {
    const gray = this.convertToGrayscale(imageData);

    let sum = 0;
    let min = 255;
    let max = 0;

    for (const value of gray) {
      sum += value;
      min = Math.min(min, value);
      max = Math.max(max, value);
    }

    const mean = sum / gray.length;

    let varianceSum = 0;
    for (const value of gray) {
      varianceSum += Math.pow(value - mean, 2);
    }

    const variance = varianceSum / gray.length;
    const standardDeviation = Math.sqrt(variance);

    return {
      mean,
      variance,
      standardDeviation,
      min,
      max,
    };
  }

  /**
   * Resize image data to specific dimensions
   */
  resizeImageData(imageData: ImageData, newWidth: number, newHeight: number): ImageData {
    const { width, height } = imageData;

    // Set canvas to original size and draw the image
    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.putImageData(imageData, 0, 0);

    // Create a temporary canvas for resizing
    const tempCanvas = document.createElement("canvas");
    const tempCtx = tempCanvas.getContext("2d");
    if (!tempCtx) {
      throw new Error("Cannot create temporary canvas context");
    }

    tempCanvas.width = newWidth;
    tempCanvas.height = newHeight;

    // Draw resized image
    tempCtx.drawImage(this.canvas, 0, 0, width, height, 0, 0, newWidth, newHeight);

    return tempCtx.getImageData(0, 0, newWidth, newHeight);
  }

  // Private helper methods

  private async getImageDataFromString(source: string): Promise<ImageData> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        try {
          this.canvas.width = img.width;
          this.canvas.height = img.height;
          this.ctx.drawImage(img, 0, 0);
          const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
          resolve(imageData);
        } catch (error) {
          reject(error);
        }
      };
      img.onerror = () => reject(new Error("Failed to load image from string"));
      img.src = source;
    });
  }

  private getImageDataFromElement(source: HTMLVideoElement | HTMLImageElement): ImageData {
    const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width;
    const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height;

    if (width === 0 || height === 0) {
      throw new Error("Invalid image dimensions");
    }

    this.canvas.width = width;
    this.canvas.height = height;
    this.ctx.drawImage(source, 0, 0);
    return this.ctx.getImageData(0, 0, width, height);
  }
}
