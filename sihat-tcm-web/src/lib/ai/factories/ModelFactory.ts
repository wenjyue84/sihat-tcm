/**
 * Factory for creating AI model router instances
 */

import { AIModelRouter } from "../ModelRouter";
import { ModelRouterConfig } from "../interfaces/ModelInterfaces";
import { DoctorLevel } from "../../doctorLevels";

export class ModelFactory {
  /**
   * Create a standard model router for general use
   */
  static createStandardRouter(appName: string = "SihatTCM"): AIModelRouter {
    return new AIModelRouter(appName, {
      enablePerformanceMonitoring: true,
      enableAdaptiveSelection: true,
      fallbackThreshold: 10000,
      maxRetries: 3,
    });
  }

  /**
   * Create a high-performance router for critical operations
   */
  static createHighPerformanceRouter(appName: string = "SihatTCM-HP"): AIModelRouter {
    return new AIModelRouter(appName, {
      enablePerformanceMonitoring: true,
      enableAdaptiveSelection: true,
      fallbackThreshold: 5000, // Lower threshold for faster fallback
      maxRetries: 2, // Fewer retries for speed
    });
  }

  /**
   * Create a testing router with minimal monitoring
   */
  static createTestingRouter(appName: string = "SihatTCM-Test"): AIModelRouter {
    return new AIModelRouter(appName, {
      enablePerformanceMonitoring: false,
      enableAdaptiveSelection: false,
      fallbackThreshold: 15000,
      maxRetries: 1,
    });
  }

  /**
   * Create a router with custom configuration
   */
  static createCustomRouter(
    appName: string,
    config: Partial<ModelRouterConfig>
  ): AIModelRouter {
    return new AIModelRouter(appName, config);
  }
}

/**
 * Singleton instances for common use cases
 */
export const defaultModelRouter = ModelFactory.createStandardRouter("DefaultRouter");
export const highPerformanceRouter = ModelFactory.createHighPerformanceRouter("HPRouter");
export const testingRouter = ModelFactory.createTestingRouter("TestRouter");