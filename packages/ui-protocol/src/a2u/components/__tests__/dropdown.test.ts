/**
 * Tests for Dropdown component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderDropdown } from '../dropdown';
import type { A2UComponent, RenderContext } from '../../types';

describe('Dropdown Component', () => {
  let mockContext: RenderContext;
  let container: HTMLElement;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);

    mockContext = {
      depth: 0,
      componentCount: 0,
      config: {
        maxDepth: 10,
        maxComponents: 100,
        logLevel: 'warn',
        sanitizeHtml: true,
      },
      renderChild: vi.fn((child) => {
        const el = document.createElement('div');
        el.textContent = 'Child content';
        return el;
      }),
      onAction: vi.fn(),
    };
  });

  afterEach(() => {
    document.body.removeChild(container);
  });

  describe('Basic Rendering', () => {
    it('should render dropdown container', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      expect(dropdown.className).toContain('a2u-dropdown');
    });

    it('should render dropdown button', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          label: 'Select',
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const button = dropdown.querySelector('.a2u-dropdown__button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Select');
    });

    it('should render dropdown menu', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menu = dropdown.querySelector('.a2u-dropdown__menu');
      expect(menu).toBeTruthy();
      expect(menu?.getAttribute('role')).toBe('menu');
    });

    it('should render all options', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
            { value: 'opt3', label: 'Option 3' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBe(3);
    });

    it('should render option labels', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'First Option' },
            { value: 'opt2', label: 'Second Option' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
      expect(menuItems[0].textContent).toBe('First Option');
      expect(menuItems[1].textContent).toBe('Second Option');
    });

    it('should render options with icons', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'edit', label: 'Edit', icon: '✏️' },
            { value: 'delete', label: 'Delete', icon: '🗑️' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
      expect(menuItems[0].textContent).toContain('✏️');
      expect(menuItems[0].textContent).toContain('Edit');
    });
  });

  describe('Menu Visibility', () => {
    it('should hide menu by default', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menu = dropdown.querySelector('.a2u-dropdown__menu') as HTMLElement;
      expect(menu.style.display).toBe('none');
    });
  });

  describe('Selected Value', () => {
    it('should show placeholder when no value selected', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          placeholder: 'Choose an option',
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const button = dropdown.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Choose an option');
    });

    it('should show selected option label', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          value: 'opt2',
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const button = dropdown.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Option 2');
    });

    it('should mark selected option as active', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          value: 'opt2',
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]');
      expect(menuItems[1].classList.contains('a2u-dropdown__menu-item--active')).toBe(true);
      expect(menuItems[1].getAttribute('aria-current')).toBe('true');
    });
  });

  describe('Disabled Options', () => {
    it('should render disabled options', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2', disabled: true },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
      expect(menuItems[1].disabled).toBe(true);
      expect(menuItems[1].getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Dividers', () => {
    it('should render dividers', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'div', label: '', divider: true },
            { value: 'opt2', label: 'Option 2' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const divider = dropdown.querySelector('[role="separator"]');
      expect(divider).toBeTruthy();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on button', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const button = dropdown.querySelector('.a2u-dropdown__button');
      
      expect(button?.getAttribute('aria-haspopup')).toBe('true');
      expect(button?.getAttribute('aria-expanded')).toBe('false');
      expect(button?.getAttribute('id')).toBe('test-dropdown-button');
    });

    it('should have proper ARIA attributes on menu', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menu = dropdown.querySelector('.a2u-dropdown__menu');
      
      expect(menu?.getAttribute('role')).toBe('menu');
      expect(menu?.getAttribute('aria-labelledby')).toBe('test-dropdown-button');
    });

    it('should have proper role on menu items', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      const menuItem = dropdown.querySelector('[role="menuitem"]');
      expect(menuItem?.getAttribute('role')).toBe('menuitem');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
          className: 'custom-dropdown',
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      expect(dropdown.classList.contains('custom-dropdown')).toBe(true);
    });

    it('should apply custom styles', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
          ],
          style: {
            width: '200px',
            margin: '10px',
          },
        },
      };

      const dropdown = renderDropdown(component, mockContext) as HTMLElement;
      expect(dropdown.style.width).toBe('200px');
      expect(dropdown.style.margin).toBe('10px');
    });
  });

  describe('Interactions', () => {
    it('should call onAction when option is selected', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2' },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      container.appendChild(dropdown);
      
      // Open dropdown
      const button = dropdown.querySelector('.a2u-dropdown__button') as HTMLButtonElement;
      button.click();
      
      // Click option
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
      menuItems[1].click();

      expect(mockContext.onAction).toHaveBeenCalledWith(
        { type: 'dropdown_select', params: { value: 'opt2', label: 'Option 2' } },
        'test-dropdown'
      );
    });

    it('should not call onAction for disabled option', () => {
      const component: A2UComponent = {
        type: 'dropdown',
        id: 'test-dropdown',
        props: {
          options: [
            { value: 'opt1', label: 'Option 1' },
            { value: 'opt2', label: 'Option 2', disabled: true },
          ],
        },
      };

      const dropdown = renderDropdown(component, mockContext);
      container.appendChild(dropdown);
      
      // Open dropdown
      const button = dropdown.querySelector('.a2u-dropdown__button') as HTMLButtonElement;
      button.click();
      
      // Try to click disabled option
      const menuItems = dropdown.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
      menuItems[1].click();

      expect(mockContext.onAction).not.toHaveBeenCalled();
    });
  });
});

