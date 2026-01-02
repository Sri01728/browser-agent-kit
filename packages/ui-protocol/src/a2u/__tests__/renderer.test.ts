/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { A2URenderer } from '../renderer';
import type { A2UResponse, A2UComponent, RenderContext } from '../types';

describe('A2URenderer', () => {
  let renderer: A2URenderer;
  let container: HTMLElement;

  beforeEach(() => {
    renderer = new A2URenderer();
    container = document.createElement('div');
  });

  describe('constructor', () => {
    it('should create renderer with default config', () => {
      const config = renderer.getConfig();
      expect(config.maxDepth).toBe(10);
      expect(config.maxComponents).toBe(100);
      expect(config.sanitizeHtml).toBe(true);
    });

    it('should create renderer with custom config', () => {
      const customRenderer = new A2URenderer({
        maxDepth: 5,
        maxComponents: 50,
        logLevel: 'debug',
      });

      const config = customRenderer.getConfig();
      expect(config.maxDepth).toBe(5);
      expect(config.maxComponents).toBe(50);
    });

    it('should register built-in components', () => {
      expect(renderer.hasRenderer('card')).toBe(true);
      expect(renderer.hasRenderer('list')).toBe(true);
      expect(renderer.hasRenderer('button')).toBe(true);
      expect(renderer.hasRenderer('text')).toBe(true);
      expect(renderer.hasRenderer('image')).toBe(true);
      expect(renderer.hasRenderer('form')).toBe(true);
    });
  });

  describe('registerComponent', () => {
    it('should register custom component', () => {
      const customRenderer = vi.fn(() => document.createElement('div'));

      renderer.registerComponent({
        type: 'custom',
        renderer: customRenderer,
      });

      expect(renderer.hasRenderer('custom')).toBe(true);
    });

    it('should allow overriding built-in components', () => {
      const customCard = vi.fn(() => document.createElement('section'));

      renderer.registerComponent({
        type: 'card',
        renderer: customCard,
      });

      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: { type: 'card' },
      };

      renderer.render(response, container);
      expect(customCard).toHaveBeenCalled();
    });
  });

  describe('render', () => {
    it('should render text response', () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'text',
        text: 'Hello, world!',
      };

      renderer.render(response, container);

      expect(container.textContent).toBe('Hello, world!');
      expect(container.querySelector('.a2u-text-response')).not.toBeNull();
    });

    it('should clear container before rendering (last-write-wins)', () => {
      container.innerHTML = '<div>Previous content</div>';

      const response: A2UResponse = {
        version: '1.0',
        type: 'text',
        text: 'New content',
      };

      renderer.render(response, container);

      expect(container.textContent).toBe('New content');
      expect(container.querySelector('div:not(.a2u-text-response)')).toBeNull();
    });

    it('should render UI response with card', () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          props: { title: 'Test Card' },
        },
      };

      renderer.render(response, container);

      expect(container.querySelector('.a2u-card')).not.toBeNull();
      expect(container.querySelector('.a2u-card__title')?.textContent).toBe('Test Card');
    });

    it('should render nested components', () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          children: [
            { type: 'text', props: { content: 'Hello' } },
          ],
        },
      };

      renderer.render(response, container);

      expect(container.querySelector('.a2u-card')).not.toBeNull();
      expect(container.querySelector('.a2u-text')).not.toBeNull();
    });

    it('should call onAction when action is triggered', () => {
      const onAction = vi.fn();

      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'button',
          id: 'btn-1',
          props: { label: 'Click me' },
          actions: [{ type: 'call_tool', params: { tool: 'test' } }],
        },
      };

      renderer.render(response, container, { onAction });

      const button = container.querySelector('button');
      button?.click();

      expect(onAction).toHaveBeenCalledWith(
        { type: 'call_tool', params: { tool: 'test' } },
        'btn-1'
      );
    });

    it('should render placeholder for unknown component', () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: { type: 'unknown-widget' },
      };

      renderer.render(response, container);

      const placeholder = container.querySelector('.a2u-unknown-component');
      expect(placeholder).not.toBeNull();
      expect(placeholder?.getAttribute('data-component-type')).toBe('unknown-widget');
    });

    it('should render fallback on error', () => {
      // Force an error by setting max depth to 0
      const strictRenderer = new A2URenderer({ maxDepth: 0 });

      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: { type: 'card' },
      };

      strictRenderer.render(response, container);

      expect(container.querySelector('.a2u-render-error')).not.toBeNull();
    });
  });

  describe('limits', () => {
    it('should respect maxDepth limit', () => {
      const shallowRenderer = new A2URenderer({ maxDepth: 2 });

      // Depth 3 - should fail
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          children: [{
            type: 'list',
            children: [{ type: 'text', props: { content: 'Too deep' } }],
          }],
        },
      };

      shallowRenderer.render(response, container);

      // Should show error fallback
      expect(container.querySelector('.a2u-render-error')).not.toBeNull();
    });
  });

  describe('getRegisteredTypes', () => {
    it('should return all registered component types', () => {
      const types = renderer.getRegisteredTypes();

      expect(types).toContain('card');
      expect(types).toContain('list');
      expect(types).toContain('button');
      expect(types).toContain('text');
      expect(types).toContain('image');
      expect(types).toContain('form');
    });
  });

  describe('updateConfig', () => {
    it('should update configuration', () => {
      renderer.updateConfig({ maxDepth: 5 });

      expect(renderer.getConfig().maxDepth).toBe(5);
    });
  });
});

