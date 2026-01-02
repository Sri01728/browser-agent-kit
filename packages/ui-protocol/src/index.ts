/**
 * @web-agent/ui-protocol
 *
 * A2U Protocol Renderer and AG-UI Event Bus for browser-based AI agents.
 *
 * @example Basic Usage
 * ```typescript
 * import { A2URenderer, AGUIEventBus } from '@web-agent/ui-protocol';
 *
 * // Create renderer
 * const renderer = new A2URenderer();
 *
 * // Create event bus
 * const eventBus = new AGUIEventBus();
 *
 * // Subscribe to events
 * eventBus.on('generation:start', (event) => {
 *   console.log('Generation started:', event.payload);
 * });
 *
 * // Render A2U response
 * const container = document.getElementById('app');
 * renderer.render(a2uResponse, container);
 * ```
 *
 * @module @web-agent/ui-protocol
 */

// A2U Protocol exports
export * from './a2u/types';
export * from './a2u/errors';
export * from './a2u/parser';
export {
  A2URenderer,
  render,
  getDefaultRenderer,
  type RenderOptions,
} from './a2u/renderer';
export {
  createActionHandler,
  noopActionHandler,
  type ActionHandler,
  type ActionHandlerCallbacks,
} from './a2u/actions';
export {
  builtInComponents,
  builtInComponentTypes,
  getBuiltInRenderer,
} from './a2u/components';

// AG-UI Event Bus exports
export * from './ag-ui/types';
export * from './ag-ui/errors';
export { AGUIEventBus, createEventBus } from './ag-ui/event-bus';

// Logger
export { createLogger, setLogLevel, getLogLevel, type Logger, type LogLevel } from './logger';

