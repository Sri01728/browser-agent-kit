/**
 * Base error class for MediaPipe adapter errors
 */
export class MediaPipeError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly cause?: Error
  ) {
    super(message);
    this.name = 'MediaPipeError';
    
    // Maintain proper stack trace in V8 engines
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, MediaPipeError);
    }
  }
}

/**
 * Error thrown when model initialization fails
 */
export class ModelInitializationError extends MediaPipeError {
  constructor(
    message: string,
    public readonly modelPath: string,
    cause?: Error
  ) {
    super(
      `Failed to initialize model at '${modelPath}': ${message}`,
      'MODEL_INITIALIZATION_ERROR',
      cause
    );
    this.name = 'ModelInitializationError';
  }
}

/**
 * Error thrown when WebGPU is required but not available
 */
export class WebGPUNotAvailableError extends MediaPipeError {
  constructor(
    public readonly fallbackAvailable: boolean
  ) {
    super(
      `WebGPU is not available in this browser.${fallbackAvailable ? ' Falling back to WASM.' : ' No fallback available.'}`,
      'WEBGPU_NOT_AVAILABLE'
    );
    this.name = 'WebGPUNotAvailableError';
  }
}

/**
 * Error thrown when inference fails
 */
export class InferenceError extends MediaPipeError {
  constructor(
    message: string,
    public readonly prompt: string,
    cause?: Error
  ) {
    super(
      `Inference failed: ${message}`,
      'INFERENCE_ERROR',
      cause
    );
    this.name = 'InferenceError';
    // Don't include full prompt in error message for security, but keep reference
  }
}

/**
 * Error thrown when model is not initialized
 */
export class ModelNotInitializedError extends MediaPipeError {
  constructor() {
    super(
      'Model is not initialized. Call initialize() before generating.',
      'MODEL_NOT_INITIALIZED'
    );
    this.name = 'ModelNotInitializedError';
  }
}

/**
 * Error thrown when model file cannot be loaded
 */
export class ModelLoadError extends MediaPipeError {
  constructor(
    public readonly modelPath: string,
    public readonly httpStatus?: number,
    cause?: Error
  ) {
    const statusInfo = httpStatus ? ` (HTTP ${httpStatus})` : '';
    super(
      `Failed to load model from '${modelPath}'${statusInfo}. Ensure the model file exists and is accessible.`,
      'MODEL_LOAD_ERROR',
      cause
    );
    this.name = 'ModelLoadError';
  }
}

/**
 * Error thrown when response parsing fails (e.g., invalid JSON for tool calls)
 */
export class ResponseParseError extends MediaPipeError {
  constructor(
    message: string,
    public readonly rawResponse: string,
    cause?: Error
  ) {
    super(
      `Failed to parse model response: ${message}`,
      'RESPONSE_PARSE_ERROR',
      cause
    );
    this.name = 'ResponseParseError';
  }
}

/**
 * Error thrown when configuration validation fails
 */
export class ConfigurationError extends MediaPipeError {
  constructor(
    message: string,
    public readonly invalidFields: string[]
  ) {
    super(
      `Invalid configuration: ${message}. Invalid fields: ${invalidFields.join(', ')}`,
      'CONFIGURATION_ERROR'
    );
    this.name = 'ConfigurationError';
  }
}

