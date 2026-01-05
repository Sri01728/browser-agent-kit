import { describe, it, expect, beforeEach, vi } from 'vitest';
import { A2URenderer } from '../renderer';
import type { A2UComponent, ComponentRenderer, A2UResponse } from '../types';

describe('Component Registry', () => {
  let renderer: A2URenderer;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    renderer = new A2URenderer();
  });

  const createResponse = (component: A2UComponent): A2UResponse => ({
    version: '1.0',
    type: 'ui',
    ui: component,
  });

  it('should register a custom component', () => {
    const customRenderer: ComponentRenderer = (component, context) => {
      const el = document.createElement('div');
      el.className = 'custom-component';
      el.textContent = 'Custom Component';
      return el;
    };

    renderer.registerComponent({
      type: 'custom',
      renderer: customRenderer,
    });

    const response = createResponse({
      type: 'custom',
      id: 'test-custom',
      props: {},
    });

    renderer.render(response, container);

    const element = container.querySelector('.custom-component');
    expect(element).toBeTruthy();
    expect(element?.textContent).toBe('Custom Component');
  });

  it('should use custom renderer for registered type', () => {
    const mockRenderer = vi.fn((component, context) => {
      const el = document.createElement('div');
      el.className = 'mock-custom';
      return el;
    });

    renderer.registerComponent({
      type: 'mockType',
      renderer: mockRenderer,
    });

    const response = createResponse({
      type: 'mockType',
      id: 'test-mock',
      props: {},
    });

    renderer.render(response, container);

    expect(mockRenderer).toHaveBeenCalledOnce();
    expect(mockRenderer).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'mockType' }),
      expect.objectContaining({
        renderChild: expect.any(Function),
        onAction: expect.any(Function),
        depth: expect.any(Number),
        componentCount: expect.any(Number),
        config: expect.any(Object),
      })
    );
  });

  it('should override built-in component with custom renderer', () => {
    const customButtonRenderer: ComponentRenderer = (component, context) => {
      const el = document.createElement('button');
      el.className = 'custom-button-override';
      el.textContent = 'Custom Button';
      return el;
    };

    renderer.registerComponent({
      type: 'button',
      renderer: customButtonRenderer,
    });

    const response = createResponse({
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Original Button',
      },
    });

    renderer.render(response, container);

    const element = container.querySelector('.custom-button-override');
    expect(element).toBeTruthy();
    expect(element?.textContent).toBe('Custom Button');
  });

  it('should handle multiple custom component registrations', () => {
    const customRenderer1: ComponentRenderer = (component) => {
      const el = document.createElement('div');
      el.className = 'custom-1';
      return el;
    };

    const customRenderer2: ComponentRenderer = (component) => {
      const el = document.createElement('div');
      el.className = 'custom-2';
      return el;
    };

    renderer.registerComponent({
      type: 'custom1',
      renderer: customRenderer1,
    });
    renderer.registerComponent({
      type: 'custom2',
      renderer: customRenderer2,
    });

    const response1 = createResponse({
      type: 'custom1',
      id: 'test-1',
      props: {},
    });

    const response2 = createResponse({
      type: 'custom2',
      id: 'test-2',
      props: {},
    });

    renderer.render(response1, container);
    expect(container.querySelector('.custom-1')).toBeTruthy();

    renderer.render(response2, container);
    expect(container.querySelector('.custom-2')).toBeTruthy();
  });

  it('should pass context to custom renderer', () => {
    let capturedContext: any = null;

    const customRenderer: ComponentRenderer = (component, context) => {
      capturedContext = context;
      return document.createElement('div');
    };

    renderer.registerComponent({
      type: 'contextTest',
      renderer: customRenderer,
    });

    const response = createResponse({
      type: 'contextTest',
      id: 'test-context',
      props: {},
    });

    renderer.render(response, container);

    expect(capturedContext).toBeTruthy();
    expect(capturedContext.renderChild).toBeTypeOf('function');
    expect(capturedContext.onAction).toBeTypeOf('function');
    expect(capturedContext.depth).toBeTypeOf('number');
    expect(capturedContext.componentCount).toBeTypeOf('number');
    expect(capturedContext.config).toBeTruthy();
  });

  it('should allow custom renderer to render nested components', () => {
    const customRenderer: ComponentRenderer = (component, context) => {
      const el = document.createElement('div');
      el.className = 'custom-container';

      if (component.children) {
        component.children.forEach((child) => {
          const childEl = context.renderChild(child);
          el.appendChild(childEl);
        });
      }

      return el;
    };

    renderer.registerComponent({
      type: 'customContainer',
      renderer: customRenderer,
    });

    const response = createResponse({
      type: 'customContainer',
      id: 'test-container',
      props: {},
      children: [
        {
          type: 'text',
          id: 'child-1',
          props: { content: 'Child 1' },
        },
        {
          type: 'text',
          id: 'child-2',
          props: { content: 'Child 2' },
        },
      ],
    });

    renderer.render(response, container);

    const element = container.querySelector('.custom-container');
    expect(element).toBeTruthy();
    expect(element?.children.length).toBe(2);
  });

  it('should allow custom renderer to handle actions', () => {
    const mockActionHandler = vi.fn();

    const customRenderer: ComponentRenderer = (component, context) => {
      const el = document.createElement('button');
      el.textContent = 'Custom Action Button';
      el.onclick = () => {
        if (component.actions) {
          component.actions.forEach((action) => {
            context.onAction(action, component.id);
          });
        }
      };
      return el;
    };

    renderer.registerComponent({
      type: 'customAction',
      renderer: customRenderer,
    });

    const response = createResponse({
      type: 'customAction',
      id: 'test-action',
      props: {},
      actions: [
        {
          type: 'call_tool',
          params: { tool: 'testTool', args: {} },
        },
      ],
    });

    renderer.render(response, container, {
      onAction: mockActionHandler,
    });

    const button = container.querySelector('button') as HTMLButtonElement;
    button.click();

    expect(mockActionHandler).toHaveBeenCalledOnce();
  });

  it('should render fallback for unregistered component type', () => {
    const response = createResponse({
      type: 'unknownType',
      id: 'test-unknown',
      props: {},
    });

    renderer.render(response, container);
    
    // Should render unknown component placeholder
    const fallback = container.querySelector('.a2u-unknown-component');
    expect(fallback).toBeTruthy();
    expect(fallback?.getAttribute('data-component-type')).toBe('unknownType');
  });

  it('should allow unregistering a component', () => {
    const customRenderer: ComponentRenderer = (component) => {
      return document.createElement('div');
    };

    renderer.registerComponent({
      type: 'temporary',
      renderer: customRenderer,
    });

    const response = createResponse({
      type: 'temporary',
      id: 'test-temp',
      props: {},
    });

    // Should work before unregistering
    renderer.render(response, container);
    expect(container.querySelector('div')).toBeTruthy();
    
    // Clear container
    container.innerHTML = '';

    // Unregister
    renderer.unregisterComponent('temporary');

    // Should render unknown component placeholder after unregistering
    renderer.render(response, container);
    const fallback = container.querySelector('.a2u-unknown-component');
    expect(fallback).toBeTruthy();
  });

  it('should check if component is registered', () => {
    expect(renderer.hasComponent('button')).toBe(true);
    expect(renderer.hasComponent('text')).toBe(true);
    expect(renderer.hasComponent('nonexistent')).toBe(false);

    renderer.registerComponent({
      type: 'newType',
      renderer: () => document.createElement('div'),
    });
    expect(renderer.hasComponent('newType')).toBe(true);
  });

  it('should list all registered component types', () => {
    const types = renderer.getRegisteredTypes();

    expect(types).toContain('button');
    expect(types).toContain('text');
    expect(types).toContain('card');
    expect(types).toContain('list');
    expect(types).toContain('image');
    expect(types).toContain('form');

    renderer.registerComponent({
      type: 'custom',
      renderer: () => document.createElement('div'),
    });
    const updatedTypes = renderer.getRegisteredTypes();
    expect(updatedTypes).toContain('custom');
  });

  it('should handle component with props validation in custom renderer', () => {
    const customRenderer: ComponentRenderer = (component) => {
      const props = component.props as any;
      if (!props.required) {
        throw new Error('Required prop missing');
      }
      const el = document.createElement('div');
      el.textContent = props.required;
      return el;
    };

    renderer.registerComponent({
      type: 'validated',
      renderer: customRenderer,
    });

    const validResponse = createResponse({
      type: 'validated',
      id: 'test-valid',
      props: {
        required: 'value',
      },
    });

    const invalidResponse = createResponse({
      type: 'validated',
      id: 'test-invalid',
      props: {},
    });

    // Valid response should render successfully
    renderer.render(validResponse, container);
    expect(container.querySelector('div')?.textContent).toBe('value');
    
    // Clear container
    container.innerHTML = '';
    
    // Invalid response should render fallback
    renderer.render(invalidResponse, container);
    const fallback = container.querySelector('.a2u-render-error');
    expect(fallback).toBeTruthy();
  });

  it('should handle custom renderer that returns complex elements', () => {
    const customRenderer: ComponentRenderer = (component) => {
      const wrapper = document.createElement('div');
      wrapper.className = 'complex-wrapper';

      const header = document.createElement('h3');
      header.textContent = 'Complex Component';
      wrapper.appendChild(header);

      const content = document.createElement('p');
      content.textContent = (component.props as any).text || 'Default text';
      wrapper.appendChild(content);

      return wrapper;
    };

    renderer.registerComponent({
      type: 'complex',
      renderer: customRenderer,
    });

    const response = createResponse({
      type: 'complex',
      id: 'test-complex',
      props: {
        text: 'Custom text',
      },
    });

    renderer.render(response, container);

    const element = container.querySelector('.complex-wrapper');
    expect(element).toBeTruthy();
    expect(element?.querySelector('h3')?.textContent).toBe('Complex Component');
    expect(element?.querySelector('p')?.textContent).toBe('Custom text');
  });
});
