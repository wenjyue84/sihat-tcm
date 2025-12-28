/**
 * AI Model Selection Command Implementation
 */

import { Command, CommandResult, ValidationResult } from '../interfaces/CommandInterfaces';

export class SelectAIModelCommand implements Command {
  public readonly id: string;
  public readonly type = 'ai:select-model';
  public readonly description: string;
  public readonly timestamp = new Date();
  public readonly metadata?: Record<string, any>;

  private previousModelId?: string;

  constructor(
    private modelId: string,
    private criteria: any,
    private modelRouter: any,
    metadata?: Record<string, any>
  ) {
    this.id = `select-model-${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
    this.description = `Select AI model: ${modelId}`;
    this.metadata = metadata;
  }

  async execute(): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      // Store previous state for undo
      this.previousModelId = this.modelRouter.getCurrentModelId?.();
      
      // Execute model selection
      const result = await this.modelRouter.selectModel(this.modelId, this.criteria);
      
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        metadata: {
          modelId: this.modelId,
          previousModelId: this.previousModelId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  async undo(): Promise<CommandResult> {
    const startTime = Date.now();
    
    try {
      if (!this.previousModelId) {
        return {
          success: false,
          error: 'No previous model to restore',
          executionTime: Date.now() - startTime,
        };
      }

      const result = await this.modelRouter.selectModel(this.previousModelId, this.criteria);
      
      return {
        success: true,
        data: result,
        executionTime: Date.now() - startTime,
        metadata: {
          restoredModelId: this.previousModelId,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        executionTime: Date.now() - startTime,
      };
    }
  }

  canUndo(): boolean {
    return Boolean(this.previousModelId);
  }

  async validate(): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    if (!this.modelId) {
      errors.push('Model ID is required');
    }

    if (!this.modelRouter) {
      errors.push('Model router is required');
    }

    // Check if model is available
    if (this.modelRouter && !await this.modelRouter.isModelAvailable?.(this.modelId)) {
      warnings.push(`Model ${this.modelId} may not be available`);
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}