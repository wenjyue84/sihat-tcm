/**
 * AI Model Command Implementations
 *
 * Command implementations for AI model operations with undo/redo support
 * and comprehensive validation.
 */

import {
  Command,
  CommandResult,
  SelectAIModelCommand,
  UpdateModelConfigCommand,
} from "../interfaces/CommandInterfaces";

import { devLog, logError } from "../../systemLogger";
import { ErrorFactory } from "../../errors/AppError";

/**
 * Command to select an AI model with fallback support
 */
export class SelectAIModelCommandImpl implements SelectAIModelCommand {
  public readonly id: string;
  public readonly type = "ai:select-model" as const;
  public readonly description: string;
  public readonly timestamp: Date;
  public readonly metadata?: any;

  private readonly modelRouter: any; // Would be properly typed in real implementation
  private previousModelId?: string;

  constructor(
    public readonly data: {
      modelId: string;
      criteria: any;
      previousModelId?: string;
    },
    modelRouter: any,
    metadata?: any
  ) {
    this.id = `select-model-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.description = `Select AI model: ${data.modelId}`;
    this.timestamp = new Date();
    this.metadata = metadata;
    this.modelRouter = modelRouter;
    this.previousModelId = data.previousModelId;
  }

  /**
   * Execute the model selection
   */
  public async execute(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      devLog("debug", "SelectAIModelCommand", `Executing model selection: ${this.data.modelId}`, {
        commandId: this.id,
        criteria: this.data.criteria,
      });

      // Store current model for undo
      if (this.modelRouter.getCurrentModel) {
        this.previousModelId = this.modelRouter.getCurrentModel()?.id;
      }

      // Validate model exists
      if (!this.modelRouter.hasModel(this.data.modelId)) {
        throw new Error(`Model not found: ${this.data.modelId}`);
      }

      // Select the model
      const selectionResult = await this.modelRouter.selectModel(
        this.data.modelId,
        this.data.criteria
      );

      if (!selectionResult.success) {
        throw new Error(`Model selection failed: ${selectionResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          selectedModelId: this.data.modelId,
          previousModelId: this.previousModelId,
          selectionResult,
        },
        executionTime,
        metadata: {
          commandType: this.type,
          modelId: this.data.modelId,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logError("SelectAIModelCommand", "Model selection failed", { error: error instanceof Error ? error.message : String(error) });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime,
        metadata: {
          commandType: this.type,
          modelId: this.data.modelId,
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
      };
    }
  }

  /**
   * Undo the model selection
   */
  public async undo(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      if (!this.previousModelId) {
        throw new Error("No previous model to restore");
      }

      devLog("debug", "SelectAIModelCommand", `Undoing model selection, restoring: ${this.previousModelId}`, {
        commandId: this.id,
      });

      // Restore previous model
      const restoreResult = await this.modelRouter.selectModel(this.previousModelId, {
        reason: "undo_operation",
      });

      if (!restoreResult.success) {
        throw new Error(`Failed to restore previous model: ${restoreResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          restoredModelId: this.previousModelId,
          undoneModelId: this.data.modelId,
        },
        executionTime,
        metadata: {
          commandType: this.type,
          operation: "undo",
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logError("SelectAIModelCommand", "Undo failed", { error: error instanceof Error ? error.message : String(error) });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Undo failed",
        executionTime,
        metadata: {
          commandType: this.type,
          operation: "undo",
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
      };
    }
  }

  /**
   * Check if command can be undone
   */
  public canUndo(): boolean {
    return Boolean(this.previousModelId && this.modelRouter.hasModel(this.previousModelId));
  }

  /**
   * Validate command before execution
   */
  public async validate(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate model ID
    if (!this.data.modelId || typeof this.data.modelId !== "string") {
      errors.push("Model ID is required and must be a string");
    }

    // Validate model exists
    if (this.data.modelId && !this.modelRouter.hasModel(this.data.modelId)) {
      errors.push(`Model not found: ${this.data.modelId}`);
    }

    // Validate criteria
    if (!this.data.criteria || typeof this.data.criteria !== "object") {
      warnings.push("Selection criteria not provided or invalid");
    }

    // Check if model is already selected
    if (this.modelRouter.getCurrentModel?.()?.id === this.data.modelId) {
      warnings.push("Model is already selected");
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }

  /**
   * Before execute hook
   */
  public async beforeExecute(): Promise<void> {
    devLog("debug", "SelectAIModelCommand", `Preparing to select model: ${this.data.modelId}`);

    // Could perform additional setup here
    // e.g., warm up the model, check resources, etc.
  }

  /**
   * After execute hook
   */
  public async afterExecute(result: CommandResult): Promise<void> {
    if (result.success) {
      devLog("debug", "SelectAIModelCommand", `Model selection completed successfully: ${this.data.modelId}`);

      // Could trigger events, update metrics, etc.
      // this.eventEmitter.emit('ai:model:selected', { modelId: this.data.modelId });
    } else {
      logError("SelectAIModelCommand", `Model selection failed: ${result.error}`);
    }
  }

  /**
   * Error handler
   */
  public async onError(error: Error): Promise<void> {
    logError("SelectAIModelCommand", "Command error occurred", { error: error.message });

    // Could implement error recovery, notifications, etc.
    // this.notificationService.notifyError('Model selection failed', error.message);
  }
}

/**
 * Command to update AI model configuration
 */
export class UpdateModelConfigCommandImpl implements UpdateModelConfigCommand {
  public readonly id: string;
  public readonly type = "ai:update-config" as const;
  public readonly description: string;
  public readonly timestamp: Date;
  public readonly metadata?: any;

  private readonly modelRouter: any;
  private previousConfiguration?: any;

  constructor(
    public readonly data: {
      modelId: string;
      configuration: any;
      previousConfiguration?: any;
    },
    modelRouter: any,
    metadata?: any
  ) {
    this.id = `update-config-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    this.description = `Update model configuration: ${data.modelId}`;
    this.timestamp = new Date();
    this.metadata = metadata;
    this.modelRouter = modelRouter;
    this.previousConfiguration = data.previousConfiguration;
  }

  /**
   * Execute the configuration update
   */
  public async execute(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      devLog("debug", "UpdateModelConfigCommand", `Updating configuration for model: ${this.data.modelId}`, {
        commandId: this.id,
      });

      // Validate model exists
      if (!this.modelRouter.hasModel(this.data.modelId)) {
        throw new Error(`Model not found: ${this.data.modelId}`);
      }

      // Get current configuration for undo
      if (!this.previousConfiguration) {
        this.previousConfiguration = await this.modelRouter.getModelConfiguration(
          this.data.modelId
        );
      }

      // Update configuration
      const updateResult = await this.modelRouter.updateModelConfiguration(
        this.data.modelId,
        this.data.configuration
      );

      if (!updateResult.success) {
        throw new Error(`Configuration update failed: ${updateResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          modelId: this.data.modelId,
          newConfiguration: this.data.configuration,
          previousConfiguration: this.previousConfiguration,
        },
        executionTime,
        metadata: {
          commandType: this.type,
          modelId: this.data.modelId,
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logError("UpdateModelConfigCommand", "Configuration update failed", { error: error instanceof Error ? error.message : String(error) });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        executionTime,
        metadata: {
          commandType: this.type,
          modelId: this.data.modelId,
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
      };
    }
  }

  /**
   * Undo the configuration update
   */
  public async undo(): Promise<CommandResult> {
    const startTime = Date.now();

    try {
      if (!this.previousConfiguration) {
        throw new Error("No previous configuration to restore");
      }

      devLog(
        "debug",
        "UpdateModelConfigCommand",
        `Undoing configuration update for model: ${this.data.modelId}`,
        {
          commandId: this.id,
        }
      );

      // Restore previous configuration
      const restoreResult = await this.modelRouter.updateModelConfiguration(
        this.data.modelId,
        this.previousConfiguration
      );

      if (!restoreResult.success) {
        throw new Error(`Failed to restore previous configuration: ${restoreResult.error}`);
      }

      const executionTime = Date.now() - startTime;

      return {
        success: true,
        data: {
          modelId: this.data.modelId,
          restoredConfiguration: this.previousConfiguration,
        },
        executionTime,
        metadata: {
          commandType: this.type,
          operation: "undo",
        },
      };
    } catch (error) {
      const executionTime = Date.now() - startTime;

      logError("UpdateModelConfigCommand", "Undo failed", { error: error instanceof Error ? error.message : String(error) });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Undo failed",
        executionTime,
        metadata: {
          commandType: this.type,
          operation: "undo",
          errorType: error instanceof Error ? error.constructor.name : "Unknown",
        },
      };
    }
  }

  /**
   * Check if command can be undone
   */
  public canUndo(): boolean {
    return Boolean(this.previousConfiguration);
  }

  /**
   * Validate command before execution
   */
  public async validate(): Promise<{ valid: boolean; errors: string[]; warnings: string[] }> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Validate model ID
    if (!this.data.modelId || typeof this.data.modelId !== "string") {
      errors.push("Model ID is required and must be a string");
    }

    // Validate model exists
    if (this.data.modelId && !this.modelRouter.hasModel(this.data.modelId)) {
      errors.push(`Model not found: ${this.data.modelId}`);
    }

    // Validate configuration
    if (!this.data.configuration || typeof this.data.configuration !== "object") {
      errors.push("Configuration is required and must be an object");
    }

    // Validate configuration structure (basic check)
    if (this.data.configuration) {
      const requiredFields = ["timeout", "maxTokens"]; // Example required fields
      const missingFields = requiredFields.filter((field) => !(field in this.data.configuration));

      if (missingFields.length > 0) {
        warnings.push(`Missing recommended configuration fields: ${missingFields.join(", ")}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors,
      warnings,
    };
  }
}

/**
 * Factory functions for creating AI model commands
 */
export const AIModelCommandFactory = {
  /**
   * Create a select model command
   */
  createSelectModelCommand: (
    modelId: string,
    criteria: any,
    modelRouter: any,
    previousModelId?: string
  ): SelectAIModelCommandImpl => {
    return new SelectAIModelCommandImpl({ modelId, criteria, previousModelId }, modelRouter);
  },

  /**
   * Create an update configuration command
   */
  createUpdateConfigCommand: (
    modelId: string,
    configuration: any,
    modelRouter: any,
    previousConfiguration?: any
  ): UpdateModelConfigCommandImpl => {
    return new UpdateModelConfigCommandImpl(
      { modelId, configuration, previousConfiguration },
      modelRouter
    );
  },
};
