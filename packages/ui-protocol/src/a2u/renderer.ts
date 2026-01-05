/**
 * A2U Renderer
 *
 * Renders A2U JSON responses into native DOM elements.
 *
 * @example Basic Usage
 * ```typescript
 * import { A2URenderer } from '@web-agent/ui-protocol';
 *
 * const renderer = new A2URenderer();
 * const container = document.getElementById('app');
 *
 * // Render A2U response
 * renderer.render(a2uResponse, container, {
 *   onAction: (action, componentId) => {
 *     console.log('Action triggered:', action, componentId);
 *   }
 * });
 * ```
 *
 * @example Custom Component Registration
 * ```typescript
 * const renderer = new A2URenderer();
 *
 * renderer.registerComponent({
 *   type: 'flight-card',
 *   renderer: (component, context) => {
 *     const div = document.createElement('div');
 *     div.className = 'flight-card';
 *     // ... custom rendering logic
 *     return div;
 *   },
 *   propsSchema: flightCardPropsSchema // Optional Zod schema
 * });
 * ```
 *
 * @module a2u/renderer
 */

import DOMPurify from 'dompurify';
import { createLogger, setLogLevel, type LogLevel } from '../logger';
import type {
  A2UComponent,
  A2UResponse,
  A2UAction,
  RenderContext,
  RendererConfig,
  ComponentRenderer,
  ComponentRegistryEntry,
} from './types';
import { rendererConfigSchema } from './types';
import {
  ComponentRenderError,
  DepthLimitError,
  ComponentLimitError,
} from './errors';
import { builtInComponents, getBuiltInRenderer } from './components';
import { createActionHandler, noopActionHandler, type ActionHandler } from './actions';

const logger = createLogger('A2URenderer');

/**
 * Render options for the A2URenderer.
 */
export interface RenderOptions {
  /** Action handler callback */
  onAction?: (action: A2UAction, componentId?: string) => void;
  /** Custom action handler */
  actionHandler?: ActionHandler;
}

/**
 * A2U Renderer class.
 *
 * Parses and renders A2U JSON into native DOM elements.
 */
export class A2URenderer {
  private config: RendererConfig;
  private componentRegistry: Map<string, ComponentRegistryEntry>;

  /**
   * Creates a new A2URenderer instance.
   *
   * @param config - Renderer configuration
   *
   * @example
   * ```typescript
   * const renderer = new A2URenderer({
   *   maxDepth: 5,
   *   maxComponents: 50,
   *   logLevel: 'debug',
   *   sanitizeHtml: true
   * });
   * ```
   */
  constructor(config: Partial<RendererConfig> = {}) {
    this.config = rendererConfigSchema.parse(config);
    this.componentRegistry = new Map();

    // Set log level
    setLogLevel(this.config.logLevel as LogLevel);

    // Register built-in components
    for (const entry of builtInComponents) {
      this.componentRegistry.set(entry.type, entry);
    }

    logger.debug('A2URenderer initialized', {
      maxDepth: this.config.maxDepth,
      maxComponents: this.config.maxComponents,
      registeredComponents: this.componentRegistry.size,
    });
  }

  /**
   * Registers a custom component renderer.
   *
   * @param entry - Component registry entry
   *
   * @example
   * ```typescript
   * renderer.registerComponent({
   *   type: 'custom-chart',
   *   renderer: (component, context) => {
   *     const canvas = document.createElement('canvas');
   *     // Render chart...
   *     return canvas;
   *   }
   * });
   * ```
   */
  registerComponent(entry: ComponentRegistryEntry): void {
    logger.info('Registering component', { type: entry.type });
    this.componentRegistry.set(entry.type, entry);
  }

  /**
   * Unregisters a component renderer.
   *
   * @param type - Component type to unregister
   */
  unregisterComponent(type: string): void {
    logger.info('Unregistering component', { type });
    this.componentRegistry.delete(type);
  }

  /**
   * Checks if a component type is registered.
   *
   * @param type - Component type
   * @returns true if registered, false otherwise
   */
  hasComponent(type: string): boolean {
    return this.componentRegistry.has(type);
  }

  /**
   * Gets a registered component renderer.
   *
   * @param type - Component type
   * @returns ComponentRenderer or undefined
   */
  getRenderer(type: string): ComponentRenderer | undefined {
    return this.componentRegistry.get(type)?.renderer;
  }

  /**
   * Checks if a component type is registered.
   *
   * @param type - Component type to check
   */
  hasRenderer(type: string): boolean {
    return this.componentRegistry.has(type);
  }

  /**
   * Renders an A2U response into a container element.
   *
   * @param response - A2U response to render
   * @param container - Container element to render into
   * @param options - Render options
   *
   * @example
   * ```typescript
   * renderer.render(response, document.getElementById('app'), {
   *   onAction: (action) => agent.handleAction(action)
   * });
   * ```
   */
  render(
    response: A2UResponse,
    container: HTMLElement,
    options: RenderOptions = {}
  ): void {
    logger.debug('Rendering A2U response', { type: response.type });

    // Clear previous content (last-write-wins)
    container.innerHTML = '';

    if (response.type === 'text') {
      // Render text response
      const textElement = document.createElement('div');
      textElement.className = 'a2u-text-response';
      textElement.textContent = response.text || '';
      container.appendChild(textElement);
      return;
    }

    if (response.type === 'ui' && response.ui) {
      // Create action handler
      const actionHandler = options.actionHandler ||
        (options.onAction
          ? createActionHandler({ onAction: options.onAction })
          : noopActionHandler);

      // Render component tree
      try {
        const element = this.renderComponent(response.ui, {
          depth: 0,
          componentCount: 0,
          actionHandler,
        });
        container.appendChild(element);
      } catch (error) {
        logger.error('Render failed, showing fallback', error as Error);
        this.renderFallback(container, error as Error, response);
      }
    }
  }

  /**
   * Renders a single component and its children.
   *
   * @param component - Component to render
   * @param state - Render state (depth, count)
   * @returns Rendered HTMLElement
   */
  private renderComponent(
    component: A2UComponent,
    state: { depth: number; componentCount: number; actionHandler: ActionHandler }
  ): HTMLElement {
    // Check depth limit
    if (state.depth >= this.config.maxDepth) {
      logger.warn('Depth limit reached', {
        depth: state.depth,
        maxDepth: this.config.maxDepth,
      });
      throw new DepthLimitError(state.depth, this.config.maxDepth);
    }

    // Check component limit
    if (state.componentCount >= this.config.maxComponents) {
      logger.warn('Component limit reached', {
        count: state.componentCount,
        maxComponents: this.config.maxComponents,
      });
      throw new ComponentLimitError(state.componentCount, this.config.maxComponents);
    }

    state.componentCount++;

    // Get renderer for component type
    const entry = this.componentRegistry.get(component.type);

    if (!entry) {
      logger.warn('Unknown component type', { type: component.type });
      return this.renderUnknownComponent(component);
    }

    // Create render context
    const context: RenderContext = {
      depth: state.depth,
      componentCount: state.componentCount,
      config: this.config,
      renderChild: (child: A2UComponent) =>
        this.renderComponent(child, {
          depth: state.depth + 1,
          componentCount: state.componentCount,
          actionHandler: state.actionHandler,
        }),
      onAction: (action: A2UAction, componentId?: string) => {
        state.actionHandler.execute(action, componentId);
      },
    };

    try {
      return entry.renderer(component, context);
    } catch (error) {
      throw new ComponentRenderError(
        (error as Error).message,
        component,
        component.type,
        error as Error
      );
    }
  }

  /**
   * Renders a placeholder for unknown component types.
   */
  private renderUnknownComponent(component: A2UComponent): HTMLElement {
    const placeholder = document.createElement('div');
    placeholder.className = 'a2u-unknown-component';
    placeholder.setAttribute('data-component-type', component.type);

    const message = document.createElement('span');
    message.textContent = `Unknown component: ${component.type}`;
    message.className = 'a2u-unknown-component__message';

    placeholder.appendChild(message);
    return placeholder;
  }

  /**
   * Renders a fallback when rendering fails.
   */
  private renderFallback(
    container: HTMLElement,
    error: Error,
    response: A2UResponse
  ): void {
    const fallback = document.createElement('div');
    fallback.className = 'a2u-render-error';

    const title = document.createElement('h4');
    title.textContent = 'Unable to render UI';
    title.className = 'a2u-render-error__title';

    const message = document.createElement('p');
    message.textContent = error.message;
    message.className = 'a2u-render-error__message';

    fallback.appendChild(title);
    fallback.appendChild(message);

    // Show text content if available
    if (response.type === 'text' && response.text) {
      const text = document.createElement('div');
      text.className = 'a2u-render-error__fallback-text';
      text.textContent = response.text;
      fallback.appendChild(text);
    }

    container.appendChild(fallback);
  }

  /**
   * Updates the renderer configuration.
   *
   * @param config - New configuration values
   */
  updateConfig(config: Partial<RendererConfig>): void {
    this.config = rendererConfigSchema.parse({ ...this.config, ...config });
    setLogLevel(this.config.logLevel as LogLevel);
    logger.debug('Config updated', this.config);
  }

  /**
   * Gets the current configuration.
   */
  getConfig(): RendererConfig {
    return { ...this.config };
  }

  /**
   * Gets all registered component types.
   */
  getRegisteredTypes(): string[] {
    return Array.from(this.componentRegistry.keys());
  }
}

// Export singleton factory
let defaultRenderer: A2URenderer | null = null;

/**
 * Gets the default A2URenderer instance.
 */
export function getDefaultRenderer(): A2URenderer {
  if (!defaultRenderer) {
    defaultRenderer = new A2URenderer();
  }
  return defaultRenderer;
}

/**
 * Convenience function to render an A2U response with the default renderer.
 *
 * @param response - A2U response to render
 * @param container - Container element
 * @param options - Render options
 */
export function render(
  response: A2UResponse,
  container: HTMLElement,
  options?: RenderOptions
): void {
  getDefaultRenderer().render(response, container, options);
}

