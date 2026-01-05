import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { A2UComponent } from '../A2UComponent';
import type { A2UComponent as A2UComponentType } from '@web-agent/core';

describe('A2UComponent', () => {
  it('should render text component', () => {
    const component: A2UComponentType = {
      type: 'text',
      id: 'test-text',
      props: {
        content: 'Hello World',
      },
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByText('Hello World')).toBeInTheDocument();
  });

  it('should render button component', () => {
    const component: A2UComponentType = {
      type: 'button',
      id: 'test-button',
      props: {
        label: 'Click Me',
      },
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
  });

  it('should render card component with children', () => {
    const component: A2UComponentType = {
      type: 'card',
      id: 'test-card',
      props: {
        title: 'Test Card',
      },
      children: [
        {
          type: 'text',
          id: 'card-text',
          props: {
            content: 'Card content',
          },
        },
      ],
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByText('Test Card')).toBeInTheDocument();
    expect(screen.getByText('Card content')).toBeInTheDocument();
  });

  it('should render list component', () => {
    const component: A2UComponentType = {
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
      ],
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByText('Item 1')).toBeInTheDocument();
    expect(screen.getByText('Item 2')).toBeInTheDocument();
  });

  it('should handle button actions', () => {
    const onAction = vi.fn();
    
    const component: A2UComponentType = {
      type: 'button',
      id: 'action-button',
      props: {
        label: 'Action Button',
      },
      actions: [
        {
          type: 'call_tool',
          params: {
            tool: 'testTool',
            args: { test: 'data' },
          },
        },
      ],
    };

    render(<A2UComponent component={component} onAction={onAction} />);

    const button = screen.getByRole('button', { name: 'Action Button' });
    button.click();

    expect(onAction).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'call_tool',
        params: expect.objectContaining({
          tool: 'testTool',
        }),
      }),
      'action-button'
    );
  });

  it('should render nested components', () => {
    const component: A2UComponentType = {
      type: 'card',
      id: 'outer-card',
      props: {
        title: 'Outer Card',
      },
      children: [
        {
          type: 'card',
          id: 'inner-card',
          props: {
            title: 'Inner Card',
          },
          children: [
            {
              type: 'text',
              id: 'nested-text',
              props: {
                content: 'Nested content',
              },
            },
          ],
        },
      ],
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByText('Outer Card')).toBeInTheDocument();
    expect(screen.getByText('Inner Card')).toBeInTheDocument();
    expect(screen.getByText('Nested content')).toBeInTheDocument();
  });

  it('should apply custom className', () => {
    const component: A2UComponentType = {
      type: 'text',
      id: 'custom-text',
      props: {
        content: 'Custom Text',
        className: 'custom-class',
      },
    };

    const { container } = render(<A2UComponent component={component} />);

    expect(container.querySelector('.custom-class')).toBeInTheDocument();
  });

  it('should handle image component', () => {
    const component: A2UComponentType = {
      type: 'image',
      id: 'test-image',
      props: {
        src: 'https://example.com/image.jpg',
        alt: 'Test Image',
      },
    };

    render(<A2UComponent component={component} />);

    const image = screen.getByRole('img', { name: 'Test Image' });
    expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
  });

  it('should handle form component', () => {
    const component: A2UComponentType = {
      type: 'form',
      id: 'test-form',
      props: {
        fields: [
          {
            name: 'email',
            type: 'email',
            label: 'Email',
            required: true,
          },
        ],
      },
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByLabelText('Email')).toBeInTheDocument();
  });

  it('should handle unknown component type gracefully', () => {
    const component: A2UComponentType = {
      type: 'unknown-type',
      id: 'unknown',
      props: {},
    };

    // Should not throw
    const { container } = render(<A2UComponent component={component} />);
    
    // Should render something (fallback or placeholder)
    expect(container.firstChild).toBeTruthy();
  });

  it('should handle component without id', () => {
    const component: A2UComponentType = {
      type: 'text',
      props: {
        content: 'No ID',
      },
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByText('No ID')).toBeInTheDocument();
  });

  it('should handle component without children', () => {
    const component: A2UComponentType = {
      type: 'card',
      id: 'empty-card',
      props: {
        title: 'Empty Card',
      },
    };

    render(<A2UComponent component={component} />);

    expect(screen.getByText('Empty Card')).toBeInTheDocument();
  });

  it('should handle component without actions', () => {
    const component: A2UComponentType = {
      type: 'button',
      id: 'no-action-button',
      props: {
        label: 'No Action',
      },
    };

    render(<A2UComponent component={component} />);

    const button = screen.getByRole('button', { name: 'No Action' });
    
    // Should not throw when clicked
    expect(() => button.click()).not.toThrow();
  });

  it('should pass custom props to renderer', () => {
    const component: A2UComponentType = {
      type: 'button',
      id: 'custom-button',
      props: {
        label: 'Custom Button',
        variant: 'primary',
        disabled: false,
      },
    };

    render(<A2UComponent component={component} />);

    const button = screen.getByRole('button', { name: 'Custom Button' });
    expect(button).not.toBeDisabled();
  });

  it('should handle multiple actions on same component', () => {
    const onAction = vi.fn();
    
    const component: A2UComponentType = {
      type: 'button',
      id: 'multi-action-button',
      props: {
        label: 'Multi Action',
      },
      actions: [
        {
          type: 'call_tool',
          params: { tool: 'tool1', args: {} },
        },
        {
          type: 'navigate',
          params: { url: '/test' },
        },
      ],
    };

    render(<A2UComponent component={component} onAction={onAction} />);

    const button = screen.getByRole('button', { name: 'Multi Action' });
    button.click();

    // Should call onAction for each action
    expect(onAction).toHaveBeenCalledTimes(2);
  });

  it('should render with custom wrapper className', () => {
    const component: A2UComponentType = {
      type: 'text',
      id: 'wrapped-text',
      props: {
        content: 'Wrapped',
      },
    };

    const { container } = render(
      <A2UComponent component={component} className="wrapper-class" />
    );

    expect(container.querySelector('.wrapper-class')).toBeInTheDocument();
  });
});

