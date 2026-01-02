/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi } from 'vitest';
import { renderCard } from '../card';
import type { A2UComponent, RenderContext, RendererConfig } from '../../types';

describe('renderCard', () => {
  const createContext = (overrides: Partial<RenderContext> = {}): RenderContext => ({
    depth: 0,
    componentCount: 0,
    config: {
      maxDepth: 10,
      maxComponents: 100,
      logLevel: 'warn',
      sanitizeHtml: true,
    } as RendererConfig,
    renderChild: vi.fn((child) => {
      const el = document.createElement('div');
      el.setAttribute('data-child-type', child.type);
      return el;
    }),
    onAction: vi.fn(),
    ...overrides,
  });

  it('should render basic card', () => {
    const component: A2UComponent = {
      type: 'card',
    };

    const element = renderCard(component, createContext());

    expect(element.tagName).toBe('DIV');
    expect(element.className).toContain('a2u-card');
  });

  it('should render card with title and subtitle', () => {
    const component: A2UComponent = {
      type: 'card',
      props: {
        title: 'Test Title',
        subtitle: 'Test Subtitle',
      },
    };

    const element = renderCard(component, createContext());

    expect(element.querySelector('.a2u-card__title')?.textContent).toBe('Test Title');
    expect(element.querySelector('.a2u-card__subtitle')?.textContent).toBe('Test Subtitle');
  });

  it('should apply variant styling', () => {
    const outlinedCard: A2UComponent = {
      type: 'card',
      props: { variant: 'outlined' },
    };

    const elevatedCard: A2UComponent = {
      type: 'card',
      props: { variant: 'elevated' },
    };

    const outlinedElement = renderCard(outlinedCard, createContext());
    const elevatedElement = renderCard(elevatedCard, createContext());

    expect(outlinedElement.className).toContain('a2u-card--outlined');
    expect(elevatedElement.className).toContain('a2u-card--elevated');
  });

  it('should set component id', () => {
    const component: A2UComponent = {
      type: 'card',
      id: 'my-card',
    };

    const element = renderCard(component, createContext());

    expect(element.id).toBe('my-card');
    expect(element.getAttribute('data-component-id')).toBe('my-card');
  });

  it('should render children', () => {
    const renderChild = vi.fn((child: A2UComponent) => {
      const el = document.createElement('span');
      el.textContent = child.type;
      return el;
    });

    const component: A2UComponent = {
      type: 'card',
      children: [
        { type: 'text', props: { content: 'Hello' } },
        { type: 'button', props: { label: 'Click' } },
      ],
    };

    const element = renderCard(component, createContext({ renderChild }));

    expect(renderChild).toHaveBeenCalledTimes(2);
    expect(element.querySelector('.a2u-card__content')).not.toBeNull();
    expect(element.querySelector('.a2u-card__content')?.children.length).toBe(2);
  });

  it('should render actions as buttons', () => {
    const onAction = vi.fn();

    const component: A2UComponent = {
      type: 'card',
      id: 'card-1',
      actions: [
        { type: 'call_tool', params: { label: 'Book', tool: 'book' } },
      ],
    };

    const element = renderCard(component, createContext({ onAction }));

    const button = element.querySelector('.a2u-card__actions button');
    expect(button).not.toBeNull();
    expect(button?.textContent).toBe('Book');

    // Click the button
    button?.dispatchEvent(new Event('click'));
    expect(onAction).toHaveBeenCalledWith(
      { type: 'call_tool', params: { label: 'Book', tool: 'book' } },
      'card-1'
    );
  });
});

