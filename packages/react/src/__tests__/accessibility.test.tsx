/**
 * Accessibility Tests for React Components
 * 
 * Tests WCAG 2.1 compliance using axe-core
 */

import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { axe, toHaveNoViolations } from 'jest-axe';
import { AgentChat } from '../components/AgentChat';
import { A2UComponent } from '../components/A2UComponent';
import type { A2UResponse } from '@web-agent/ui-protocol/a2u';

expect.extend(toHaveNoViolations);

describe('React Components Accessibility', () => {
  describe('AgentChat Component', () => {
    it('should have no accessibility violations', async () => {
      const mockAgent = {
        id: 'test-agent',
        generate: vi.fn(),
        stream: vi.fn(),
      };

      const { container } = render(
        <AgentChat 
          agent={mockAgent as any}
          placeholder="Type your message..."
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible form elements', async () => {
      const mockAgent = {
        id: 'test-agent',
        generate: vi.fn(),
        stream: vi.fn(),
      };

      const { container, getByRole } = render(
        <AgentChat agent={mockAgent as any} />
      );

      // Check that textarea is accessible
      const textarea = getByRole('textbox');
      expect(textarea).toBeTruthy();

      // Check that submit button is accessible
      const button = getByRole('button', { name: /send/i });
      expect(button).toBeTruthy();

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible loading state', async () => {
      const mockAgent = {
        id: 'test-agent',
        generate: vi.fn().mockImplementation(() => new Promise(() => {})),
        stream: vi.fn(),
      };

      const { container } = render(
        <AgentChat agent={mockAgent as any} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('A2UComponent Wrapper', () => {
    it('should have no accessibility violations for button', async () => {
      const component = {
        type: 'button' as const,
        id: 'test-button',
        props: {
          label: 'Click Me',
          ariaLabel: 'Click me to submit',
        },
      };

      const { container } = render(
        <A2UComponent component={component} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for card', async () => {
      const component = {
        type: 'card' as const,
        id: 'test-card',
        props: {
          title: 'Accessible Card',
          description: 'This card is accessible',
        },
        children: [
          {
            type: 'text' as const,
            id: 'card-text',
            props: {
              content: 'Card content text',
            },
          },
        ],
      };

      const { container } = render(
        <A2UComponent component={component} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for form', async () => {
      const component = {
        type: 'form' as const,
        id: 'test-form',
        props: {
          title: 'Contact Form',
          fields: [
            {
              name: 'email',
              label: 'Email Address',
              type: 'email' as const,
              required: true,
            },
          ],
        },
      };

      const { container } = render(
        <A2UComponent component={component} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for list', async () => {
      const component = {
        type: 'list' as const,
        id: 'test-list',
        props: {
          ordered: true,
        },
        children: [
          {
            type: 'text' as const,
            id: 'item-1',
            props: { content: 'First item' },
          },
          {
            type: 'text' as const,
            id: 'item-2',
            props: { content: 'Second item' },
          },
        ],
      };

      const { container } = render(
        <A2UComponent component={component} />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should handle action callbacks accessibly', async () => {
      const mockOnAction = vi.fn();
      const component = {
        type: 'button' as const,
        id: 'action-button',
        props: {
          label: 'Submit',
        },
        actions: [
          {
            type: 'call_tool' as const,
            params: {
              tool: 'submitForm',
              args: {},
            },
          },
        ],
      };

      const { container } = render(
        <A2UComponent 
          component={component} 
          onAction={mockOnAction}
        />
      );

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should support keyboard navigation in AgentChat', async () => {
      const mockAgent = {
        id: 'test-agent',
        generate: vi.fn(),
        stream: vi.fn(),
      };

      const { container, getByRole } = render(
        <AgentChat agent={mockAgent as any} />
      );

      const textarea = getByRole('textbox');
      const button = getByRole('button');

      // Check tab order
      expect(textarea.tabIndex).toBeGreaterThanOrEqual(0);
      expect(button.tabIndex).toBeGreaterThanOrEqual(0);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('ARIA Attributes', () => {
    it('should have proper ARIA labels', async () => {
      const mockAgent = {
        id: 'test-agent',
        generate: vi.fn(),
        stream: vi.fn(),
      };

      const { container, getByRole } = render(
        <AgentChat 
          agent={mockAgent as any}
          placeholder="Ask me anything..."
        />
      );

      const textarea = getByRole('textbox');
      expect(textarea.getAttribute('placeholder')).toBe('Ask me anything...');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible button labels', async () => {
      const component = {
        type: 'button' as const,
        id: 'labeled-button',
        props: {
          label: 'Submit Form',
          ariaLabel: 'Submit the contact form',
        },
      };

      const { container, getByRole } = render(
        <A2UComponent component={component} />
      );

      const button = getByRole('button');
      expect(button.getAttribute('aria-label')).toBe('Submit the contact form');

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Screen Reader Support', () => {
    it('should provide semantic HTML structure', async () => {
      const component = {
        type: 'card' as const,
        id: 'semantic-card',
        props: {
          title: 'Semantic Structure',
        },
        children: [
          {
            type: 'list' as const,
            id: 'semantic-list',
            props: { ordered: true },
            children: [
              {
                type: 'text' as const,
                id: 'item-1',
                props: { content: 'First' },
              },
              {
                type: 'text' as const,
                id: 'item-2',
                props: { content: 'Second' },
              },
            ],
          },
        ],
      };

      const { container } = render(
        <A2UComponent component={component} />
      );

      // Check for semantic HTML elements
      expect(container.querySelector('ol')).toBeTruthy();
      expect(container.querySelectorAll('li').length).toBe(2);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });
});

