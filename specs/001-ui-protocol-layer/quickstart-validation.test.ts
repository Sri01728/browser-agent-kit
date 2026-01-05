/**
 * Quickstart Examples Validation
 * 
 * This file validates that all code examples in quickstart.md
 * compile correctly and use the correct APIs.
 */

import { describe, it, expect, vi } from 'vitest';
import { A2URenderer, AGUIEventBus } from '../../packages/ui-protocol/src';
import type { A2UResponse, A2UComponent, ComponentRenderer } from '../../packages/ui-protocol/src';
import { z } from 'zod';

describe('Quickstart Examples Validation', () => {
  describe('Example 1: Render A2U Components (Vanilla JS)', () => {
    it('should validate A2URenderer API usage', () => {
      const renderer = new A2URenderer();
      expect(renderer).toBeDefined();
      expect(typeof renderer.render).toBe('function');
      
      // Validate response structure
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          id: 'welcome-card',
          props: {
            title: 'Welcome',
          },
        },
      };
      
      const container = document.createElement('div');
      renderer.render(response, container);
      
      expect(container.children.length).toBeGreaterThan(0);
    });
  });

  describe('Example 2: Listen to Agent Events', () => {
    it('should validate AGUIEventBus API usage', () => {
      const eventBus = new AGUIEventBus();
      
      // Validate event subscription API
      const handler = vi.fn();
      const unsubscribe = eventBus.on('generation:start', handler);
      
      expect(typeof unsubscribe).toBe('function');
      
      // Validate event emission
      eventBus.emit('generation:start', {
        requestId: 'test-123',
        prompt: 'Test prompt',
      });
      
      expect(handler).toHaveBeenCalledOnce();
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          type: 'generation:start',
          payload: expect.objectContaining({
            requestId: 'test-123',
            prompt: 'Test prompt',
          }),
        })
      );
      
      // Validate cleanup
      eventBus.dispose();
      expect(eventBus.isDisposed()).toBe(true);
    });

    it('should validate all event types', () => {
      const eventBus = new AGUIEventBus();
      
      // Test all event types from the example
      const handlers = {
        'generation:start': vi.fn(),
        'tool:call': vi.fn(),
        'error': vi.fn(),
      };
      
      eventBus.on('generation:start', handlers['generation:start']);
      eventBus.on('tool:call', handlers['tool:call']);
      eventBus.on('error', handlers['error']);
      
      // Emit events
      eventBus.emit('generation:start', {
        requestId: 'req-1',
        prompt: 'What is the weather?',
      });
      
      eventBus.emit('tool:call', {
        callId: 'call-1',
        toolId: 'getWeather',
        args: { location: 'Paris' },
      });
      
      eventBus.emit('error', {
        code: 'ERR_TEST',
        message: 'Test error',
      });
      
      expect(handlers['generation:start']).toHaveBeenCalled();
      expect(handlers['tool:call']).toHaveBeenCalled();
      expect(handlers['error']).toHaveBeenCalled();
      
      eventBus.dispose();
    });
  });

  describe('Example 5: Register Custom Component', () => {
    it('should validate custom component registration API', () => {
      const renderer = new A2URenderer();
      
      // Define custom component props schema (from example)
      const chartPropsSchema = z.object({
        data: z.array(z.object({
          label: z.string(),
          value: z.number(),
        })),
        title: z.string().optional(),
      });
      
      // Create custom renderer (simplified from example)
      const chartRenderer: ComponentRenderer = (component, context) => {
        const props = chartPropsSchema.parse(component.props);
        
        const container = document.createElement('div');
        container.className = 'chart-container';
        
        const title = document.createElement('h3');
        title.textContent = props.title || 'Chart';
        container.appendChild(title);
        
        props.data.forEach((item) => {
          const bar = document.createElement('div');
          bar.className = 'bar';
          bar.textContent = `${item.label}: ${item.value}`;
          container.appendChild(bar);
        });
        
        return container;
      };
      
      // Register with renderer
      renderer.registerComponent({
        type: 'chart',
        renderer: chartRenderer,
        propsSchema: chartPropsSchema,
      });
      
      // Verify registration
      expect(renderer.hasComponent('chart')).toBe(true);
      
      // Test rendering custom component
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'chart',
          id: 'sales-chart',
          props: {
            title: 'Sales Data',
            data: [
              { label: 'Q1', value: 75 },
              { label: 'Q2', value: 85 },
            ],
          },
        },
      };
      
      const container = document.createElement('div');
      renderer.render(response, container);
      
      expect(container.querySelector('.chart-container')).toBeTruthy();
      expect(container.querySelector('h3')?.textContent).toBe('Sales Data');
      expect(container.querySelectorAll('.bar').length).toBe(2);
    });
  });

  describe('API Consistency Checks', () => {
    it('should validate A2UResponse structure', () => {
      // Ensure the structure shown in examples matches actual types
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'button',
          id: 'test-button',
          props: {
            label: 'Click Me',
          },
        },
      };
      
      expect(response.version).toBe('1.0');
      expect(response.type).toBe('ui');
      expect(response.ui).toBeDefined();
    });

    it('should validate A2UComponent structure', () => {
      const component: A2UComponent = {
        type: 'card',
        id: 'test-card',
        props: {
          title: 'Test Card',
        },
        children: [
          {
            type: 'text',
            id: 'text-1',
            props: {
              content: 'Hello',
            },
          },
        ],
      };
      
      expect(component.type).toBe('card');
      expect(component.id).toBe('test-card');
      expect(component.props).toBeDefined();
      expect(component.children).toHaveLength(1);
    });

    it('should validate event payload structures', () => {
      const eventBus = new AGUIEventBus();
      const handler = vi.fn();
      
      eventBus.on('generation:start', handler);
      
      // Validate payload structure from examples
      eventBus.emit('generation:start', {
        requestId: 'test-req',
        prompt: 'Test prompt',
        memoryContext: {
          resource: 'user-123',
          thread: 'thread-456',
        },
      });
      
      expect(handler).toHaveBeenCalledWith(
        expect.objectContaining({
          payload: expect.objectContaining({
            requestId: 'test-req',
            prompt: 'Test prompt',
            memoryContext: expect.objectContaining({
              resource: 'user-123',
              thread: 'thread-456',
            }),
          }),
        })
      );
      
      eventBus.dispose();
    });
  });

  describe('Built-in Components', () => {
    it('should validate all built-in component types are available', () => {
      const renderer = new A2URenderer();
      
      // From the quickstart examples, these should all be available
      const builtInTypes = ['button', 'text', 'card', 'list', 'form', 'image'];
      
      builtInTypes.forEach((type) => {
        expect(renderer.hasComponent(type)).toBe(true);
      });
    });

    it('should render button component as shown in examples', () => {
      const renderer = new A2URenderer();
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'button',
          id: 'submit-btn',
          props: {
            label: 'Submit',
            variant: 'primary',
          },
        },
      };
      
      const container = document.createElement('div');
      renderer.render(response, container);
      
      const button = container.querySelector('button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Submit');
    });

    it('should render card component as shown in examples', () => {
      const renderer = new A2URenderer();
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          id: 'welcome-card',
          props: {
            title: 'Welcome',
            description: 'Welcome to our app',
          },
        },
      };
      
      const container = document.createElement('div');
      renderer.render(response, container);
      
      expect(container.querySelector('.a2u-card')).toBeTruthy();
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid component types gracefully', () => {
      const renderer = new A2URenderer();
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'nonexistent-type',
          id: 'test',
          props: {},
        } as any,
      };
      
      const container = document.createElement('div');
      
      // Should not throw, should render fallback
      expect(() => {
        renderer.render(response, container);
      }).not.toThrow();
      
      // Should render unknown component placeholder
      expect(container.querySelector('.a2u-unknown-component')).toBeTruthy();
    });
  });
});

