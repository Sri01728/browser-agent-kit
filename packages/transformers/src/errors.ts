/**
 * Error classes for Transformers.js adapter
 */

/**
 * Base error class for Transformers adapter errors
 */
export class TransformersError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'TransformersError';
    
    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, TransformersError);
    }
  }
}

/**
 * Error thrown when model initialization fails
 */
export class ModelInitializationError extends TransformersError {
  constructor(
    message: string,
    public readonly modelPath: string,
    cause?: Error
  ) {
    super(message, 'MODEL_INITIALIZATION_ERROR', cause);
    this.name = 'ModelInitializationError';
  }
}

/**
 * Error thrown when model is not initialized
 */
export class ModelNotInitializedError extends TransformersError {
  constructor(message: string = 'Model not initialized. Call initialize() first.') {
    super(message, 'MODEL_NOT_INITIALIZED', undefined);
    this.name = 'ModelNotInitializedError';
  }
}

/**
 * Error thrown when inference fails
 */
export class InferenceError extends TransformersError {
  constructor(
    message: string,
    public readonly prompt: string,
    cause?: Error
  ) {
    super(message, 'INFERENCE_ERROR', cause);
    this.name = 'InferenceError';
  }
}

/**
 * Error thrown when configuration is invalid
 */
export class ConfigurationError extends TransformersError {
  constructor(message: string, cause?: Error) {
    super(message, 'CONFIGURATION_ERROR', cause);
    this.name = 'ConfigurationError';
  }
}

/**
 * Error thrown when WebGPU is not available
 */
export class WebGPUNotAvailableError extends TransformersError {
  constructor(message: string = 'WebGPU is not available in this browser') {
    super(message, 'WEBGPU_NOT_AVAILABLE', undefined);
    this.name = 'WebGPUNotAvailableError';
  }
}

/**
 * Error thrown when model is not supported
 */
export class UnsupportedModelError extends TransformersError {
  constructor(
    message: string,
    public readonly modelPath: string
  ) {
    super(message, 'UNSUPPORTED_MODEL', undefined);
    this.name = 'UnsupportedModelError';
  }
}

