/**
 * Image Quality Validator
 * 
 * Provides real-time image quality assessment for medical image capture
 * including blur detection, lighting assessment, and composition guidance.
 */

export interface ImageQualityResult {
  overall: 'excellent' | 'good' | 'fair' | 'poor'
  score: number // 0-100
  issues: QualityIssue[]
  suggestions: string[]
}

export interface QualityIssue {
  type: 'blur' | 'lighting' | 'composition' | 'resolution'
  severity: 'low' | 'medium' | 'high'
  message: string
  confidence: number // 0-1
}

export interface CompositionGuide {
  centerX: number // 0-1, relative position
  centerY: number // 0-1, relative position
  scale: number // suggested scale factor
  rotation: number // suggested rotation in degrees
}

export class ImageQualityValidator {
  private canvas: HTMLCanvasElement
  private ctx: CanvasRenderingContext2D

  constructor() {
    this.canvas = document.createElement('canvas')
    const ctx = this.canvas.getContext('2d')
    if (!ctx) {
      throw new Error('Canvas 2D context not supported')
    }
    this.ctx = ctx
  }

  /**
   * Analyze image quality from various sources
   */
  async analyzeImage(
    source: HTMLVideoElement | HTMLImageElement | string,
    mode: 'tongue' | 'face' | 'body' = 'face'
  ): Promise<ImageQualityResult> {
    const imageData = await this.getImageData(source)
    
    const blurScore = this.detectBlur(imageData)
    const lightingScore = this.assessLighting(imageData)
    const compositionScore = this.assessComposition(imageData, mode)
    const resolutionScore = this.assessResolution(imageData)

    const issues: QualityIssue[] = []
    const suggestions: string[] = []

    // Blur analysis
    if (blurScore < 0.3) {
      issues.push({
        type: 'blur',
        severity: blurScore < 0.15 ? 'high' : 'medium',
        message: 'Image appears blurry',
        confidence: 1 - blurScore
      })
      suggestions.push('Hold the camera steady and ensure proper focus')
    }

    // Lighting analysis
    if (lightingScore < 0.4) {
      issues.push({
        type: 'lighting',
        severity: lightingScore < 0.2 ? 'high' : 'medium',
        message: lightingScore < 0.2 ? 'Image is too dark' : 'Lighting could be improved',
        confidence: 1 - lightingScore
      })
      suggestions.push('Move to better lighting or adjust camera position')
    } else if (lightingScore > 0.9) {
      issues.push({
        type: 'lighting',
        severity: 'medium',
        message: 'Image may be overexposed',
        confidence: lightingScore - 0.9
      })
      suggestions.push('Reduce lighting or move away from bright light sources')
    }

    // Composition analysis
    if (compositionScore < 0.5) {
      issues.push({
        type: 'composition',
        severity: compositionScore < 0.3 ? 'high' : 'medium',
        message: 'Subject positioning could be improved',
        confidence: 1 - compositionScore
      })
      suggestions.push('Center the subject and ensure proper framing')
    }

    // Resolution analysis
    if (resolutionScore < 0.6) {
      issues.push({
        type: 'resolution',
        severity: resolutionScore < 0.3 ? 'high' : 'medium',
        message: 'Image resolution is low',
        confidence: 1 - resolutionScore
      })
      suggestions.push('Move closer or use higher camera resolution')
    }

    // Calculate overall score
    const weights = { blur: 0.3, lighting: 0.25, composition: 0.25, resolution: 0.2 }
    const overallScore = Math.round(
      blurScore * weights.blur * 100 +
      lightingScore * weights.lighting * 100 +
      compositionScore * weights.composition * 100 +
      resolutionScore * weights.resolution * 100
    )

    let overall: 'excellent' | 'good' | 'fair' | 'poor'
    if (overallScore >= 85) overall = 'excellent'
    else if (overallScore >= 70) overall = 'good'
    else if (overallScore >= 50) overall = 'fair'
    else overall = 'poor'

    return {
      overall,
      score: overallScore,
      issues,
      suggestions
    }
  }

  /**
   * Get composition guidance for better image capture
   */
  getCompositionGuide(
    source: HTMLVideoElement | HTMLImageElement,
    mode: 'tongue' | 'face' | 'body' = 'face'
  ): Promise<CompositionGuide> {
    return new Promise((resolve) => {
      this.getImageData(source).then((imageData) => {
        const guide = this.calculateCompositionGuide(imageData, mode)
        resolve(guide)
      })
    })
  }

  /**
   * Real-time quality assessment for video streams
   */
  async assessVideoFrame(video: HTMLVideoElement, mode: 'tongue' | 'face' | 'body' = 'face'): Promise<ImageQualityResult> {
    if (video.readyState < 2) {
      return {
        overall: 'poor',
        score: 0,
        issues: [{
          type: 'resolution',
          severity: 'high',
          message: 'Video not ready',
          confidence: 1
        }],
        suggestions: ['Wait for camera to initialize']
      }
    }

    return this.analyzeImage(video, mode)
  }

  private async getImageData(source: HTMLVideoElement | HTMLImageElement | string): Promise<ImageData> {
    if (typeof source === 'string') {
      // Handle base64 or URL
      return new Promise((resolve, reject) => {
        const img = new Image()
        img.onload = () => {
          this.canvas.width = img.width
          this.canvas.height = img.height
          this.ctx.drawImage(img, 0, 0)
          resolve(this.ctx.getImageData(0, 0, img.width, img.height))
        }
        img.onerror = reject
        img.src = source
      })
    } else {
      // Handle HTMLVideoElement or HTMLImageElement
      const width = source instanceof HTMLVideoElement ? source.videoWidth : source.width
      const height = source instanceof HTMLVideoElement ? source.videoHeight : source.height
      
      this.canvas.width = width
      this.canvas.height = height
      this.ctx.drawImage(source, 0, 0)
      return this.ctx.getImageData(0, 0, width, height)
    }
  }

  /**
   * Detect blur using Laplacian variance method
   */
  private detectBlur(imageData: ImageData): number {
    const { data, width, height } = imageData
    const gray = new Array(width * height)
    
    // Convert to grayscale
    for (let i = 0; i < data.length; i += 4) {
      const idx = i / 4
      gray[idx] = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2]
    }

    // Apply Laplacian kernel
    let variance = 0
    let count = 0
    
    for (let y = 1; y < height - 1; y++) {
      for (let x = 1; x < width - 1; x++) {
        const idx = y * width + x
        const laplacian = 
          -gray[idx - width - 1] - gray[idx - width] - gray[idx - width + 1] +
          -gray[idx - 1] + 8 * gray[idx] - gray[idx + 1] +
          -gray[idx + width - 1] - gray[idx + width] - gray[idx + width + 1]
        
        variance += laplacian * laplacian
        count++
      }
    }

    const normalizedVariance = variance / count
    // Normalize to 0-1 scale (higher = sharper)
    return Math.min(normalizedVariance / 1000, 1)
  }

  /**
   * Assess lighting conditions
   */
  private assessLighting(imageData: ImageData): number {
    const { data } = imageData
    let totalBrightness = 0
    let histogram = new Array(256).fill(0)
    
    // Calculate brightness histogram
    for (let i = 0; i < data.length; i += 4) {
      const brightness = Math.round(0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2])
      histogram[brightness]++
      totalBrightness += brightness
    }

    const pixelCount = data.length / 4
    const avgBrightness = totalBrightness / pixelCount

    // Check for good distribution (avoid too dark, too bright, or low contrast)
    const darkPixels = histogram.slice(0, 50).reduce((a, b) => a + b, 0) / pixelCount
    const brightPixels = histogram.slice(200, 256).reduce((a, b) => a + b, 0) / pixelCount
    
    // Calculate contrast using standard deviation
    let variance = 0
    for (let i = 0; i < 256; i++) {
      const count = histogram[i]
      if (count > 0) {
        variance += count * Math.pow(i - avgBrightness, 2)
      }
    }
    const contrast = Math.sqrt(variance / pixelCount) / 128 // Normalize to 0-1

    // Ideal conditions: moderate brightness, good contrast, not too many dark/bright pixels
    let score = 1.0
    
    // Penalize extreme brightness
    if (avgBrightness < 60) score *= (avgBrightness / 60) // Too dark
    else if (avgBrightness > 200) score *= (1 - (avgBrightness - 200) / 55) // Too bright
    
    // Penalize low contrast
    if (contrast < 0.3) score *= (contrast / 0.3)
    
    // Penalize too many dark or bright pixels
    if (darkPixels > 0.3) score *= (1 - (darkPixels - 0.3) / 0.7)
    if (brightPixels > 0.1) score *= (1 - (brightPixels - 0.1) / 0.9)

    return Math.max(0, Math.min(1, score))
  }

  /**
   * Assess composition based on subject positioning
   */
  private assessComposition(imageData: ImageData, mode: 'tongue' | 'face' | 'body'): number {
    const { width, height } = imageData
    
    // For medical images, we want the subject centered
    // This is a simplified composition check - in practice, you might use
    // face detection APIs or more sophisticated computer vision
    
    const centerX = width / 2
    const centerY = height / 2
    const expectedRegion = this.getExpectedRegion(width, height, mode)
    
    // Check if the image has good contrast in the expected region
    const regionScore = this.analyzeRegionQuality(imageData, expectedRegion)
    
    // For now, return a baseline score that can be improved with actual subject detection
    return Math.min(1, regionScore * 0.8 + 0.2) // Baseline of 0.2, up to 1.0
  }

  /**
   * Assess image resolution adequacy
   */
  private assessResolution(imageData: ImageData): number {
    const { width, height } = imageData
    const totalPixels = width * height
    
    // Minimum recommended resolutions for medical imaging
    const minPixels = {
      tongue: 300 * 300,   // 90k pixels
      face: 400 * 400,     // 160k pixels  
      body: 500 * 500      // 250k pixels
    }
    
    // For general assessment, use face requirements
    const minRequired = minPixels.face
    const optimalPixels = minRequired * 4 // 4x for excellent quality
    
    if (totalPixels >= optimalPixels) return 1.0
    if (totalPixels >= minRequired) return 0.6 + 0.4 * (totalPixels - minRequired) / (optimalPixels - minRequired)
    return Math.max(0.1, totalPixels / minRequired * 0.6)
  }

  private getExpectedRegion(width: number, height: number, mode: 'tongue' | 'face' | 'body') {
    const centerX = width / 2
    const centerY = height / 2
    
    switch (mode) {
      case 'tongue':
        return {
          x: centerX - width * 0.15,
          y: centerY - height * 0.1,
          width: width * 0.3,
          height: height * 0.2
        }
      case 'face':
        return {
          x: centerX - width * 0.2,
          y: centerY - height * 0.15,
          width: width * 0.4,
          height: height * 0.5
        }
      case 'body':
        return {
          x: centerX - width * 0.3,
          y: centerY - height * 0.3,
          width: width * 0.6,
          height: height * 0.6
        }
    }
  }

  private analyzeRegionQuality(imageData: ImageData, region: { x: number, y: number, width: number, height: number }): number {
    const { data, width } = imageData
    let totalVariance = 0
    let pixelCount = 0
    
    const startX = Math.max(0, Math.floor(region.x))
    const endX = Math.min(width, Math.ceil(region.x + region.width))
    const startY = Math.max(0, Math.floor(region.y))
    const endY = Math.min(imageData.height, Math.ceil(region.y + region.height))
    
    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const idx = (y * width + x) * 4
        const brightness = 0.299 * data[idx] + 0.587 * data[idx + 1] + 0.114 * data[idx + 2]
        
        // Simple variance calculation (could be improved)
        if (x > startX && y > startY) {
          const prevIdx = ((y - 1) * width + (x - 1)) * 4
          const prevBrightness = 0.299 * data[prevIdx] + 0.587 * data[prevIdx + 1] + 0.114 * data[prevIdx + 2]
          totalVariance += Math.abs(brightness - prevBrightness)
        }
        pixelCount++
      }
    }
    
    const avgVariance = totalVariance / Math.max(1, pixelCount - 1)
    return Math.min(1, avgVariance / 50) // Normalize variance to 0-1 scale
  }

  private calculateCompositionGuide(imageData: ImageData, mode: 'tongue' | 'face' | 'body'): CompositionGuide {
    const { width, height } = imageData
    
    // For now, return center positioning as ideal
    // This could be enhanced with actual subject detection
    return {
      centerX: 0.5, // Center horizontally
      centerY: mode === 'tongue' ? 0.45 : 0.5, // Slightly higher for tongue
      scale: 1.0,   // No scaling needed
      rotation: 0   // No rotation needed
    }
  }

  /**
   * Clean up resources
   */
  dispose(): void {
    // Canvas cleanup is handled by garbage collection
  }
}

// Singleton instance for performance
let validatorInstance: ImageQualityValidator | null = null

export function getImageQualityValidator(): ImageQualityValidator {
  if (!validatorInstance) {
    validatorInstance = new ImageQualityValidator()
  }
  return validatorInstance
}