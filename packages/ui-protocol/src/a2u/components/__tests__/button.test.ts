import { describe, it, expect, beforeEach, vi } from 'vitest';
import { renderButton } from '../button';
import type { A2UComponent, A2UAction } from '../../types';

describe('Button Component Renderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render a basic button', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Click Me',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.tagName).toBe('BUTTON');
    expect(element.textContent).toBe('Click Me');
    expect(element.classList.contains('a2u-button')).toBe(true);
  });

  it('should set data-component-id attribute', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'button-123',
      props: {
        label: 'Test',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.getAttribute('data-component-id')).toBe('button-123');
  });

  it('should apply custom className from props', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        className: 'custom-button-class',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.classList.contains('custom-button-class')).toBe(true);
    expect(element.classList.contains('a2u-button')).toBe(true);
  });

  it('should apply custom styles from props', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        style: {
          backgroundColor: 'blue',
          color: 'white',
          padding: '10px',
        },
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.style.backgroundColor).toBe('blue');
    expect(element.style.color).toBe('white');
    expect(element.style.padding).toBe('10px');
  });

  it('should apply variant class when specified', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        variant: 'primary',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.classList.contains('a2u-button-primary')).toBe(true);
  });

  it('should handle multiple variants', () => {
    const variants = ['primary', 'secondary', 'danger', 'success'];

    variants.forEach((variant) => {
      const component: A2UComponent = {
        type: 'button',
        id: 'test-button',
        props: {
          label: 'Test',
          variant,
        },
      };

      const element = renderButton(component, {
        renderComponent: () => document.createElement('div'),
        onAction: () => {},
      });

      expect(element.classList.contains(`a2u-button-${variant}`)).toBe(true);
    });
  });

  it('should disable button when disabled prop is true', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        disabled: true,
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.disabled).toBe(true);
  });

  it('should call onAction when button is clicked', () => {
    const mockAction: A2UAction = {
      type: 'call_tool',
      params: {
        tool: 'testTool',
        args: { foo: 'bar' },
      },
    };

    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
      },
      actions: [mockAction],
    };

    const onActionMock = vi.fn();

    const element = renderButton(component, {
      renderComponent: () => document.createElement('div'),
      onAction: onActionMock,
    });

    element.click();

    expect(onActionMock).toHaveBeenCalledWith(mockAction, component.id);
  });

  it('should not call onAction when button is disabled', () => {
    const mockAction: A2UAction = {
      type: 'call_tool',
      params: {
        tool: 'testTool',
        args: {},
      },
    };

    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        disabled: true,
      },
      actions: [mockAction],
    };

    const onActionMock = vi.fn();

    const element = renderButton(component, {
      renderComponent: () => document.createElement('div'),
      onAction: onActionMock,
    });

    element.click();

    expect(onActionMock).not.toHaveBeenCalled();
  });

  it('should handle multiple actions', () => {
    const actions: A2UAction[] = [
      {
        type: 'call_tool',
        params: { tool: 'tool1', args: {} },
      },
      {
        type: 'navigate',
        params: { url: '/test' },
      },
    ];

    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
      },
      actions,
    };

    const onActionMock = vi.fn();

    const element = renderButton(component, {
      renderComponent: () => document.createElement('div'),
      onAction: onActionMock,
    });

    element.click();

    expect(onActionMock).toHaveBeenCalledTimes(2);
    expect(onActionMock).toHaveBeenNthCalledWith(1, actions[0], component.id);
    expect(onActionMock).toHaveBeenNthCalledWith(2, actions[1], component.id);
  });

  it('should handle button with no actions', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
      },
    };

    const onActionMock = vi.fn();

    const element = renderButton(component, {
      renderComponent: () => document.createElement('div'),
      onAction: onActionMock,
    });

    element.click();

    expect(onActionMock).not.toHaveBeenCalled();
  });

  it('should handle empty actions array', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
      },
      actions: [],
    };

    const onActionMock = vi.fn();

    const element = renderButton(component, {
      renderComponent: () => document.createElement('div'),
      onAction: onActionMock,
    });

    element.click();

    expect(onActionMock).not.toHaveBeenCalled();
  });

  it('should set button type attribute', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        buttonType: 'submit',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.type).toBe('submit');
  });

  it('should default to button type', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.type).toBe('button');
  });

  it('should render icon with label when icon prop is provided', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        icon: '🚀',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.textContent).toContain('🚀');
    expect(element.textContent).toContain('Test');
  });

  it('should handle aria-label for accessibility', () => {
    const component: A2UComponent = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Test',
        ariaLabel: 'Accessible button label',
      },
    };

    const element = renderButton(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.getAttribute('aria-label')).toBe('Accessible button label');
  });
});

