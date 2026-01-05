/**
 * Tests for Dropdown React wrapper component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Dropdown } from '../Dropdown';
import React from 'react';

describe('Dropdown React Component', () => {
  const mockOptions = [
    { value: 'opt1', label: 'Option 1' },
    { value: 'opt2', label: 'Option 2' },
    { value: 'opt3', label: 'Option 3' },
  ];

  describe('Basic Rendering', () => {
    it('should render dropdown container', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      expect(container.querySelector('.a2u-dropdown')).toBeTruthy();
    });

    it('should render dropdown button', () => {
      const { container } = render(
        <Dropdown label="Select" options={mockOptions} />
      );

      const button = container.querySelector('.a2u-dropdown__button');
      expect(button).toBeTruthy();
      expect(button?.textContent).toBe('Select');
    });

    it('should render dropdown menu', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const menu = container.querySelector('.a2u-dropdown__menu');
      expect(menu).toBeTruthy();
      expect(menu?.getAttribute('role')).toBe('menu');
    });

    it('should render all options', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const menuItems = container.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBe(3);
    });

    it('should render option labels', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const menuItems = container.querySelectorAll('[role="menuitem"]');
      expect(menuItems[0].textContent).toBe('Option 1');
      expect(menuItems[1].textContent).toBe('Option 2');
      expect(menuItems[2].textContent).toBe('Option 3');
    });

    it('should render options with icons', () => {
      const optionsWithIcons = [
        { value: 'edit', label: 'Edit', icon: '✏️' },
        { value: 'delete', label: 'Delete', icon: '🗑️' },
      ];

      const { container } = render(<Dropdown options={optionsWithIcons} />);

      const menuItems = container.querySelectorAll('[role="menuitem"]');
      expect(menuItems[0].textContent).toContain('✏️');
      expect(menuItems[0].textContent).toContain('Edit');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Dropdown options={mockOptions} className="custom-dropdown" />
      );

      const dropdown = container.querySelector('.a2u-dropdown');
      expect(dropdown?.classList.contains('custom-dropdown')).toBe(true);
    });

    it('should apply custom styles', () => {
      const { container } = render(
        <Dropdown options={mockOptions} style={{ width: '200px' }} />
      );

      const dropdown = container.querySelector('.a2u-dropdown') as HTMLElement;
      expect(dropdown?.style.width).toBe('200px');
    });
  });

  describe('Placeholder', () => {
    it('should show placeholder when no value selected', () => {
      const { container } = render(
        <Dropdown
          placeholder="Choose an option"
          options={mockOptions}
        />
      );

      const button = container.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Choose an option');
    });
  });

  describe('Selected Value', () => {
    it('should show selected option label', () => {
      const { container } = render(
        <Dropdown options={mockOptions} value="opt2" />
      );

      const button = container.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Option 2');
    });

    it('should mark selected option as active', () => {
      const { container } = render(
        <Dropdown options={mockOptions} value="opt2" />
      );

      const menuItems = container.querySelectorAll('[role="menuitem"]');
      expect(menuItems[1].classList.contains('a2u-dropdown__menu-item--active')).toBe(true);
      expect(menuItems[1].getAttribute('aria-current')).toBe('true');
    });

    it('should update when value prop changes', () => {
      const { container, rerender } = render(
        <Dropdown options={mockOptions} value="opt1" />
      );

      let button = container.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Option 1');

      rerender(<Dropdown options={mockOptions} value="opt3" />);

      button = container.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Option 3');
    });
  });

  describe('Disabled Options', () => {
    it('should render disabled options', () => {
      const optionsWithDisabled = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2', disabled: true },
      ];

      const { container } = render(<Dropdown options={optionsWithDisabled} />);

      const menuItems = container.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
      expect(menuItems[1].disabled).toBe(true);
      expect(menuItems[1].getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Dividers', () => {
    it('should render dividers', () => {
      const optionsWithDivider = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'div', label: '', divider: true },
        { value: 'opt2', label: 'Option 2' },
      ];

      const { container } = render(<Dropdown options={optionsWithDivider} />);

      const divider = container.querySelector('[role="separator"]');
      expect(divider).toBeTruthy();
    });
  });

  describe('Interactions', () => {
    it('should call onChange when option is selected', async () => {
      const handleChange = vi.fn();

      const { container } = render(
        <Dropdown options={mockOptions} onChange={handleChange} />
      );

      // Open dropdown
      const button = container.querySelector('.a2u-dropdown__button') as HTMLButtonElement;
      button.click();

      // Click option
      const menuItems = container.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
      menuItems[1].click();

      await waitFor(() => {
        expect(handleChange).toHaveBeenCalledWith('opt2', 'Option 2');
      });
    });

    it('should not call onChange for disabled option', async () => {
      const handleChange = vi.fn();
      const optionsWithDisabled = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2', disabled: true },
      ];

      const { container } = render(
        <Dropdown options={optionsWithDisabled} onChange={handleChange} />
      );

      // Open dropdown
      const button = container.querySelector('.a2u-dropdown__button') as HTMLButtonElement;
      button.click();

      // Try to click disabled option
      const menuItems = container.querySelectorAll('[role="menuitem"]') as NodeListOf<HTMLButtonElement>;
      menuItems[1].click();

      // Wait a bit to ensure no call was made
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(handleChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on button', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const button = container.querySelector('.a2u-dropdown__button');
      expect(button?.getAttribute('aria-haspopup')).toBe('true');
      expect(button?.getAttribute('aria-expanded')).toBe('false');
    });

    it('should have proper ARIA attributes on menu', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const menu = container.querySelector('.a2u-dropdown__menu');
      expect(menu?.getAttribute('role')).toBe('menu');
      expect(menu?.getAttribute('aria-labelledby')).toBeTruthy();
    });

    it('should have proper role on menu items', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const menuItem = container.querySelector('[role="menuitem"]');
      expect(menuItem?.getAttribute('role')).toBe('menuitem');
    });
  });

  describe('Menu Visibility', () => {
    it('should hide menu by default', () => {
      const { container } = render(<Dropdown options={mockOptions} />);

      const menu = container.querySelector('.a2u-dropdown__menu') as HTMLElement;
      expect(menu.style.display).toBe('none');
    });
  });

  describe('Re-rendering', () => {
    it('should update when options prop changes', () => {
      const { container, rerender } = render(<Dropdown options={mockOptions} />);

      let menuItems = container.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBe(3);

      const newOptions = [
        { value: 'opt1', label: 'Option 1' },
        { value: 'opt2', label: 'Option 2' },
      ];

      rerender(<Dropdown options={newOptions} />);

      menuItems = container.querySelectorAll('[role="menuitem"]');
      expect(menuItems.length).toBe(2);
    });

    it('should update when label prop changes', () => {
      const { container, rerender } = render(
        <Dropdown label="First Label" options={mockOptions} />
      );

      let button = container.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('First Label');

      rerender(<Dropdown label="Second Label" options={mockOptions} />);

      button = container.querySelector('.a2u-dropdown__button');
      expect(button?.textContent).toBe('Second Label');
    });
  });
});

