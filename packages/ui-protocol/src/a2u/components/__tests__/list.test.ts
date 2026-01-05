import { describe, it, expect, beforeEach } from 'vitest';
import { renderList } from '../list';
import type { A2UComponent } from '../../types';

describe('List Component Renderer', () => {
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  it('should render an empty list', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'test-list',
      props: {},
      children: [],
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.tagName).toBe('UL');
    expect(element.classList.contains('a2u-list')).toBe(true);
    expect(element.children.length).toBe(0);
  });

  it('should render list with children', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'test-list',
      props: {},
      children: [
        {
          type: 'text',
          id: 'item-1',
          props: { content: 'Item 1' },
        },
        {
          type: 'text',
          id: 'item-2',
          props: { content: 'Item 2' },
        },
        {
          type: 'text',
          id: 'item-3',
          props: { content: 'Item 3' },
        },
      ],
    };

    const mockRenderChild = (child: A2UComponent) => {
      const el = document.createElement('span');
      el.textContent = (child.props as any).content || '';
      return el;
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: mockRenderChild,
      onAction: () => {},
    });

    expect(element.children.length).toBe(3);
    expect(element.children[0].tagName).toBe('LI');
    expect(element.children[1].tagName).toBe('LI');
    expect(element.children[2].tagName).toBe('LI');
  });

  it('should apply ordered list style when specified', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'test-list',
      props: {
        ordered: true,
      },
      children: [],
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.tagName).toBe('OL');
    expect(element.classList.contains('a2u-list')).toBe(true);
  });

  it('should apply custom className from props', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'test-list',
      props: {
        className: 'custom-list-class',
      },
      children: [],
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.classList.contains('custom-list-class')).toBe(true);
  });

  it('should apply custom styles from props', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'test-list',
      props: {
        style: {
          padding: '20px',
          margin: '10px',
        },
      },
      children: [],
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.style.padding).toBe('20px');
    expect(element.style.margin).toBe('10px');
  });

  it('should handle nested lists', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'outer-list',
      props: {},
      children: [
        {
          type: 'text',
          id: 'item-1',
          props: { content: 'Item 1' },
        },
        {
          type: 'list',
          id: 'inner-list',
          props: {},
          children: [
            {
              type: 'text',
              id: 'nested-item-1',
              props: { content: 'Nested Item 1' },
            },
          ],
        },
      ],
    };

    const mockRenderChild = (child: A2UComponent): HTMLElement => {
      if (child.type === 'text') {
        const el = document.createElement('span');
        el.textContent = (child.props as any).content || '';
        return el;
      } else if (child.type === 'list') {
        return renderList(child, {
          depth: 1,
          componentCount: 0,
          config: { maxNestingDepth: 10, maxComponentCount: 100 },
          renderChild: mockRenderChild,
          onAction: () => {},
        });
      }
      return document.createElement('div');
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: mockRenderChild,
      onAction: () => {},
    });

    expect(element.children.length).toBe(2);
    expect(element.children[1].querySelector('ul')).toBeTruthy();
  });

  it('should set data-component-id attribute', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'test-list-123',
      props: {},
      children: [],
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.getAttribute('data-component-id')).toBe('test-list-123');
  });

  it('should handle list with mixed component types', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'mixed-list',
      props: {},
      children: [
        {
          type: 'text',
          id: 'text-item',
          props: { content: 'Text Item' },
        },
        {
          type: 'button',
          id: 'button-item',
          props: { label: 'Click Me' },
        },
        {
          type: 'card',
          id: 'card-item',
          props: { title: 'Card Title' },
        },
      ],
    };

    const mockRenderChild = (child: A2UComponent) => {
      const el = document.createElement('div');
      el.className = `mock-${child.type}`;
      return el;
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: mockRenderChild,
      onAction: () => {},
    });

    expect(element.children.length).toBe(3);
    expect(element.children[0].querySelector('.mock-text')).toBeTruthy();
    expect(element.children[1].querySelector('.mock-button')).toBeTruthy();
    expect(element.children[2].querySelector('.mock-card')).toBeTruthy();
  });

  it('should handle empty children array gracefully', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'empty-list',
      props: {},
      children: [],
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.children.length).toBe(0);
    expect(element.tagName).toBe('UL');
  });

  it('should handle undefined children', () => {
    const component: A2UComponent = {
      type: 'list',
      id: 'no-children-list',
      props: {},
    };

    const element = renderList(component, {
      depth: 0,
      componentCount: 0,
      config: { maxNestingDepth: 10, maxComponentCount: 100 },
      renderChild: () => document.createElement('div'),
      onAction: () => {},
    });

    expect(element.children.length).toBe(0);
  });
});

