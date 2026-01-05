/**
 * Accessibility Tests for A2U Components
 * 
 * Tests WCAG 2.1 compliance using axe-core
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { axe, toHaveNoViolations } from 'jest-axe';
import { A2URenderer } from '../renderer';
import type { A2UResponse } from '../types';

expect.extend(toHaveNoViolations);

describe('A2U Accessibility Tests', () => {
  let renderer: A2URenderer;
  let container: HTMLElement;

  beforeEach(() => {
    renderer = new A2URenderer();
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Button Component', () => {
    it('should have no accessibility violations', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'button',
          id: 'test-button',
          props: {
            label: 'Click Me',
            ariaLabel: 'Click me to submit',
          },
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible name', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'button',
          id: 'test-button',
          props: {
            label: 'Submit Form',
          },
        },
      };

      renderer.render(response, container);
      const button = container.querySelector('button');
      expect(button?.textContent).toBe('Submit Form');
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should support disabled state accessibly', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'button',
          id: 'test-button',
          props: {
            label: 'Disabled Button',
            disabled: true,
          },
        },
      };

      renderer.render(response, container);
      const button = container.querySelector('button');
      expect(button?.disabled).toBe(true);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Text Component', () => {
    it('should have no accessibility violations', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'text',
          id: 'test-text',
          props: {
            content: 'This is accessible text content',
          },
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Card Component', () => {
    it('should have no accessibility violations', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          id: 'test-card',
          props: {
            title: 'Card Title',
            description: 'Card description text',
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
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('List Component', () => {
    it('should have no accessibility violations for unordered list', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'list',
          id: 'test-list',
          props: {
            ordered: false,
          },
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
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have no accessibility violations for ordered list', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'list',
          id: 'test-list',
          props: {
            ordered: true,
          },
          children: [
            {
              type: 'text',
              id: 'item-1',
              props: { content: 'First step' },
            },
            {
              type: 'text',
              id: 'item-2',
              props: { content: 'Second step' },
            },
          ],
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Form Component', () => {
    it('should have no accessibility violations', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'form',
          id: 'test-form',
          props: {
            title: 'Contact Form',
            fields: [
              {
                name: 'email',
                label: 'Email Address',
                type: 'email',
                required: true,
              },
              {
                name: 'message',
                label: 'Message',
                type: 'textarea',
                required: false,
              },
            ],
          },
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });

    it('should have accessible labels for form fields', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'form',
          id: 'test-form',
          props: {
            fields: [
              {
                name: 'username',
                label: 'Username',
                type: 'text',
                required: true,
              },
            ],
          },
        },
      };

      renderer.render(response, container);
      const label = container.querySelector('label');
      const input = container.querySelector('input');
      
      expect(label?.textContent).toContain('Username');
      expect(label?.getAttribute('for')).toBe(input?.id);
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Image Component', () => {
    it('should have no accessibility violations with alt text', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'image',
          id: 'test-image',
          props: {
            src: 'https://example.com/image.jpg',
            alt: 'A descriptive alt text for the image',
          },
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Complex Nested Components', () => {
    it('should have no accessibility violations for nested structure', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          id: 'main-card',
          props: {
            title: 'Flight Booking',
          },
          children: [
            {
              type: 'text',
              id: 'description',
              props: {
                content: 'Book your flight to Paris',
              },
            },
            {
              type: 'list',
              id: 'flight-details',
              props: {},
              children: [
                {
                  type: 'text',
                  id: 'detail-1',
                  props: { content: 'Departure: 10:00 AM' },
                },
                {
                  type: 'text',
                  id: 'detail-2',
                  props: { content: 'Arrival: 2:00 PM' },
                },
              ],
            },
            {
              type: 'button',
              id: 'book-button',
              props: {
                label: 'Book Now',
                ariaLabel: 'Book flight to Paris',
              },
            },
          ],
        },
      };

      renderer.render(response, container);
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Keyboard Navigation', () => {
    it('should have focusable interactive elements', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          id: 'interactive-card',
          props: {
            title: 'Interactive Elements',
          },
          children: [
            {
              type: 'button',
              id: 'button-1',
              props: { label: 'Button 1' },
            },
            {
              type: 'button',
              id: 'button-2',
              props: { label: 'Button 2' },
            },
          ],
        },
      };

      renderer.render(response, container);
      
      const buttons = container.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      
      // Check that buttons are in the tab order
      buttons.forEach((button) => {
        expect(button.tabIndex).toBeGreaterThanOrEqual(0);
      });
      
      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  describe('Color Contrast', () => {
    it('should pass color contrast checks', async () => {
      const response: A2UResponse = {
        version: '1.0',
        type: 'ui',
        ui: {
          type: 'card',
          id: 'contrast-card',
          props: {
            title: 'High Contrast Card',
          },
          children: [
            {
              type: 'text',
              id: 'contrast-text',
              props: {
                content: 'This text should have sufficient contrast',
              },
            },
          ],
        },
      };

      renderer.render(response, container);
      const results = await axe(container, {
        rules: {
          'color-contrast': { enabled: true },
        },
      });
      expect(results).toHaveNoViolations();
    });
  });
});

