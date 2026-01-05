/**
 * Tests for Tabs React wrapper component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { Tabs } from '../Tabs';
import React from 'react';

describe('Tabs React Component', () => {
  const mockTabs = [
    { id: 'tab1', label: 'Tab 1' },
    { id: 'tab2', label: 'Tab 2' },
    { id: 'tab3', label: 'Tab 3' },
  ];

  describe('Basic Rendering', () => {
    it('should render tabs container', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      expect(container.querySelector('.a2u-tabs')).toBeTruthy();
    });

    it('should render all tabs', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements.length).toBe(3);
    });

    it('should render tab labels', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements[0].textContent).toBe('Tab 1');
      expect(tabElements[1].textContent).toBe('Tab 2');
      expect(tabElements[2].textContent).toBe('Tab 3');
    });

    it('should render tabs with icons', () => {
      const tabsWithIcons = [
        { id: 'tab1', label: 'Home', icon: '🏠' },
        { id: 'tab2', label: 'Settings', icon: '⚙️' },
      ];

      const { container } = render(<Tabs tabs={tabsWithIcons} />);

      const tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements[0].textContent).toContain('🏠');
      expect(tabElements[0].textContent).toContain('Home');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Tabs tabs={mockTabs} className="custom-tabs" />
      );

      const tabs = container.querySelector('.a2u-tabs');
      expect(tabs?.classList.contains('custom-tabs')).toBe(true);
    });

    it('should apply custom styles', () => {
      const { container } = render(
        <Tabs tabs={mockTabs} style={{ backgroundColor: 'blue' }} />
      );

      const tabs = container.querySelector('.a2u-tabs') as HTMLElement;
      expect(tabs?.style.backgroundColor).toBe('blue');
    });
  });

  describe('Active State', () => {
    it('should mark first tab as active by default', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const firstTab = container.querySelector('[role="tab"]');
      expect(firstTab?.getAttribute('aria-selected')).toBe('true');
    });

    it('should mark specified tab as active', () => {
      const { container } = render(
        <Tabs tabs={mockTabs} activeTab="tab2" />
      );

      const tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements[0].getAttribute('aria-selected')).toBe('false');
      expect(tabElements[1].getAttribute('aria-selected')).toBe('true');
      expect(tabElements[2].getAttribute('aria-selected')).toBe('false');
    });

    it('should update active tab when prop changes', () => {
      const { container, rerender } = render(
        <Tabs tabs={mockTabs} activeTab="tab1" />
      );

      let tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements[0].getAttribute('aria-selected')).toBe('true');

      rerender(<Tabs tabs={mockTabs} activeTab="tab3" />);

      tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements[2].getAttribute('aria-selected')).toBe('true');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled tabs', () => {
      const tabsWithDisabled = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2', disabled: true },
      ];

      const { container } = render(<Tabs tabs={tabsWithDisabled} />);

      const tabElements = container.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      expect(tabElements[1].disabled).toBe(true);
    });
  });

  describe('Orientation', () => {
    it('should default to horizontal orientation', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const tabList = container.querySelector('[role="tablist"]');
      expect(tabList?.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should apply vertical orientation', () => {
      const { container } = render(
        <Tabs tabs={mockTabs} orientation="vertical" />
      );

      const tabList = container.querySelector('[role="tablist"]');
      expect(tabList?.getAttribute('aria-orientation')).toBe('vertical');
      
      const tabs = container.querySelector('.a2u-tabs');
      expect(tabs?.classList.contains('a2u-tabs--vertical')).toBe(true);
    });
  });

  describe('Interactions', () => {
    it('should call onTabChange when tab is clicked', async () => {
      const handleTabChange = vi.fn();

      const { container } = render(
        <Tabs tabs={mockTabs} onTabChange={handleTabChange} />
      );

      const tabElements = container.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      tabElements[1].click();

      await waitFor(() => {
        expect(handleTabChange).toHaveBeenCalledWith('tab2');
      });
    });

    it('should not call onTabChange for disabled tab', async () => {
      const handleTabChange = vi.fn();
      const tabsWithDisabled = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2', disabled: true },
      ];

      const { container } = render(
        <Tabs tabs={tabsWithDisabled} onTabChange={handleTabChange} />
      );

      const tabElements = container.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      tabElements[1].click();

      // Wait a bit to ensure no call was made
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(handleTabChange).not.toHaveBeenCalled();
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA roles', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      expect(container.querySelector('[role="tablist"]')).toBeTruthy();
      expect(container.querySelector('[role="tab"]')).toBeTruthy();
      expect(container.querySelector('[role="tabpanel"]')).toBeTruthy();
    });

    it('should have proper tabindex for active tab', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements[0].getAttribute('tabindex')).toBe('0');
      expect(tabElements[1].getAttribute('tabindex')).toBe('-1');
      expect(tabElements[2].getAttribute('tabindex')).toBe('-1');
    });

    it('should link tabs to panels with aria-controls', () => {
      const { container } = render(<Tabs tabs={mockTabs} />);

      const firstTab = container.querySelector('[role="tab"]');
      const ariaControls = firstTab?.getAttribute('aria-controls');
      expect(ariaControls).toBeTruthy();

      const panel = container.querySelector(`#${ariaControls}`);
      expect(panel).toBeTruthy();
    });
  });

  describe('Re-rendering', () => {
    it('should update when tabs prop changes', () => {
      const { container, rerender } = render(<Tabs tabs={mockTabs} />);

      let tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements.length).toBe(3);

      const newTabs = [
        { id: 'tab1', label: 'Tab 1' },
        { id: 'tab2', label: 'Tab 2' },
      ];

      rerender(<Tabs tabs={newTabs} />);

      tabElements = container.querySelectorAll('[role="tab"]');
      expect(tabElements.length).toBe(2);
    });
  });
});

