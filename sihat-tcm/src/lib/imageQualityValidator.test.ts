/**
 * Tests for ImageQualityValidator
 */

import { describe, it, expect, beforeEach, vi } from 'vitest'
import { ImageQualityValidator, getImageQualityValidator } from './imageQualityValidator'

// Mock canvas and context
const mockCanvas = {
  width: 0,
  height: 0,
  getContext: vi.fn()
}

const mockContext = {
  drawImage: vi.fn(),
  getImageData: vi.fn()
}

// Mock DOM APIs
Object.defineProperty(global, 'document', {
  value: {
    createElement: vi.fn(() => mockCanvas)
  }
})

describe('ImageQualityValidator', () => {
  let validator: ImageQualityValidator

  beforeEach(() => {
    vi.clearAllMocks()
    mockCanvas.getContext.mockReturnValue(mockContext)
    
    // Mock ImageData for testing
    mockContext.getImageData.mockReturnValue({
      data: new Uint8ClampedArray(400 * 300 * 4).fill(128), // Gray image
      width: 400,
      height: 300
    })
  })

  it('should create validator instance', () => {
    expect(() => {
      validator = new ImageQualityValidator()
    }).not.toThrow()
  })

  it('should return singleton instance', () => {
    const instance1 = getImageQualityValidator()
    const instance2 = getImageQualityValidator()
    expect(instance1).toBe(instance2)
  })

  it('should analyze image quality from base64 string', async () => {
    validator = new ImageQualityValidator()
    
    // Mock Image constructor properly
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      src: '',
      width: 400,
      height: 300
    }
    
    // Mock the Image constructor as a function that returns the mock
    global.Image = function() { return mockImage } as any

    const analysisPromise = validator.analyzeImage('data:image/jpeg;base64,test', 'face')
    
    // Simulate image load
    setTimeout(() => {
      if (mockImage.onload) mockImage.onload()
    }, 0)

    const result = await analysisPromise

    expect(result).toHaveProperty('overall')
    expect(result).toHaveProperty('score')
    expect(result).toHaveProperty('issues')
    expect(result).toHaveProperty('suggestions')
    expect(typeof result.score).toBe('number')
    expect(result.score).toBeGreaterThanOrEqual(0)
    expect(result.score).toBeLessThanOrEqual(100)
  })

  it('should handle different image modes', async () => {
    validator = new ImageQualityValidator()
    
    const mockImage = {
      onload: null as any,
      onerror: null as any,
      src: '',
      width: 400,
      height: 300
    }
    
    global.Image = function() { return mockImage } as any

    const modes: ('tongue' | 'face' | 'body')[] = ['tongue', 'face', 'body']
    
    for (const mode of modes) {
      const analysisPromise = validator.analyzeImage('data:image/jpeg;base64,test', mode)
      
      setTimeout(() => {
        if (mockImage.onload) mockImage.onload()
      }, 0)

      const result = await analysisPromise
      expect(result.overall).toMatch(/^(excellent|good|fair|poor)$/)
    }
  })

  it('should provide composition guide', async () => {
    validator = new ImageQualityValidator()
    
    const mockImage = {
      width: 400,
      height: 300
    } as HTMLImageElement

    const guide = await validator.getCompositionGuide(mockImage, 'face')
    
    expect(guide).toHaveProperty('centerX')
    expect(guide).toHaveProperty('centerY')
    expect(guide).toHaveProperty('scale')
    expect(guide).toHaveProperty('rotation')
    expect(guide.centerX).toBeGreaterThanOrEqual(0)
    expect(guide.centerX).toBeLessThanOrEqual(1)
    expect(guide.centerY).toBeGreaterThanOrEqual(0)
    expect(guide.centerY).toBeLessThanOrEqual(1)
  })

  it('should handle video frame assessment', async () => {
    validator = new ImageQualityValidator()
    
    const mockVideo = {
      readyState: 4, // HAVE_ENOUGH_DATA
      videoWidth: 640,
      videoHeight: 480
    } as HTMLVideoElement

    const result = await validator.assessVideoFrame(mockVideo, 'face')
    
    expect(result).toHaveProperty('overall')
    expect(result).toHaveProperty('score')
  })

  it('should handle unready video', async () => {
    validator = new ImageQualityValidator()
    
    const mockVideo = {
      readyState: 0, // HAVE_NOTHING
      videoWidth: 0,
      videoHeight: 0
    } as HTMLVideoElement

    const result = await validator.assessVideoFrame(mockVideo, 'face')
    
    expect(result.overall).toBe('poor')
    expect(result.score).toBe(0)
    expect(result.issues).toHaveLength(1)
    expect(result.issues[0].type).toBe('resolution')
  })

  it('should detect quality issues', async () => {
    validator = new ImageQualityValidator()
    
    // Mock very dark image (poor lighting)
    mockContext.getImageData.mockReturnValue({
      data: new Uint8ClampedArray(400 * 300 * 4).fill(10), // Very dark
      width: 400,
      height: 300
    })

    const mockImage = {
      onload: null as any,
      onerror: null as any,
      src: '',
      width: 400,
      height: 300
    }
    
    global.Image = function() { return mockImage } as any

    const analysisPromise = validator.analyzeImage('data:image/jpeg;base64,test', 'face')
    
    setTimeout(() => {
      if (mockImage.onload) mockImage.onload()
    }, 0)

    const result = await analysisPromise

    // Should detect lighting issues
    const lightingIssues = result.issues.filter(issue => issue.type === 'lighting')
    expect(lightingIssues.length).toBeGreaterThan(0)
    expect(result.suggestions.length).toBeGreaterThan(0)
  })
})