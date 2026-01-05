/**
 * Tests for Tabs component
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderTabs } from '../tabs';
import type { A2UComponent, RenderContext } from '../../types';

describe('Tabs Component', () => {
  let mockContext: RenderContext;

  beforeEach(() => {
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
        el.textContent = `Panel content: ${child.type}`;
        return el;
      }),
      onAction: vi.fn(),
    };
  });

  describe('Basic Rendering', () => {
    it('should render tabs container', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      expect(tabs.className).toContain('a2u-tabs');
    });

    it('should render tab list with correct role', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabList = tabs.querySelector('.a2u-tabs__list');
      expect(tabList?.getAttribute('role')).toBe('tablist');
    });

    it('should render all tabs', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
            { id: 'tab3', label: 'Tab 3' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]');
      expect(tabButtons.length).toBe(3);
    });

    it('should render tab panels', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const panels = tabs.querySelectorAll('[role="tabpanel"]');
      expect(panels.length).toBe(2);
    });

    it('should render tab labels', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'First Tab' },
            { id: 'tab2', label: 'Second Tab' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]');
      expect(tabButtons[0].textContent).toBe('First Tab');
      expect(tabButtons[1].textContent).toBe('Second Tab');
    });

    it('should render tabs with icons', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Home', icon: '🏠' },
            { id: 'tab2', label: 'Settings', icon: '⚙️' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]');
      expect(tabButtons[0].textContent).toContain('🏠');
      expect(tabButtons[0].textContent).toContain('Home');
    });
  });

  describe('Active State', () => {
    it('should mark first tab as active by default', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const firstTab = tabs.querySelector('[role="tab"]');
      expect(firstTab?.getAttribute('aria-selected')).toBe('true');
      expect(firstTab?.classList.contains('a2u-tabs__tab--active')).toBe(true);
    });

    it('should mark specified tab as active', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
          activeTab: 'tab2',
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]');
      expect(tabButtons[0].getAttribute('aria-selected')).toBe('false');
      expect(tabButtons[1].getAttribute('aria-selected')).toBe('true');
    });

    it('should show active panel', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const panels = tabs.querySelectorAll('[role="tabpanel"]') as NodeListOf<HTMLElement>;
      expect(panels[0].style.display).not.toBe('none');
      expect(panels[1].style.display).toBe('none');
    });
  });

  describe('Disabled State', () => {
    it('should render disabled tabs', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2', disabled: true },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      expect(tabButtons[1].disabled).toBe(true);
      expect(tabButtons[1].getAttribute('aria-disabled')).toBe('true');
    });
  });

  describe('Orientation', () => {
    it('should default to horizontal orientation', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabList = tabs.querySelector('[role="tablist"]');
      expect(tabList?.getAttribute('aria-orientation')).toBe('horizontal');
    });

    it('should apply vertical orientation', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
          orientation: 'vertical',
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabList = tabs.querySelector('[role="tablist"]');
      expect(tabList?.getAttribute('aria-orientation')).toBe('vertical');
      expect(tabs.classList.contains('a2u-tabs--vertical')).toBe(true);
    });
  });

  describe('Children Rendering', () => {
    it('should render children in panels', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
        children: [
          { type: 'text', props: { content: 'Content 1' } },
          { type: 'text', props: { content: 'Content 2' } },
        ],
      };

      const tabs = renderTabs(component, mockContext);
      expect(mockContext.renderChild).toHaveBeenCalledTimes(2);
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes on tabs', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tab = tabs.querySelector('[role="tab"]');
      
      expect(tab?.getAttribute('role')).toBe('tab');
      expect(tab?.getAttribute('id')).toBe('test-tabs-tab-tab1');
      expect(tab?.getAttribute('aria-controls')).toBe('test-tabs-panel-tab1');
    });

    it('should have proper ARIA attributes on panels', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const panel = tabs.querySelector('[role="tabpanel"]');
      
      expect(panel?.getAttribute('role')).toBe('tabpanel');
      expect(panel?.getAttribute('id')).toBe('test-tabs-panel-tab1');
      expect(panel?.getAttribute('aria-labelledby')).toBe('test-tabs-tab-tab1');
    });

    it('should set tabindex correctly for active tab', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]');
      
      expect(tabButtons[0].getAttribute('tabindex')).toBe('0');
      expect(tabButtons[1].getAttribute('tabindex')).toBe('-1');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
          className: 'custom-tabs',
        },
      };

      const tabs = renderTabs(component, mockContext);
      expect(tabs.classList.contains('custom-tabs')).toBe(true);
    });

    it('should apply custom styles', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
          ],
          style: {
            backgroundColor: 'blue',
            padding: '10px',
          },
        },
      };

      const tabs = renderTabs(component, mockContext) as HTMLElement;
      expect(tabs.style.backgroundColor).toBe('blue');
      expect(tabs.style.padding).toBe('10px');
    });
  });

  describe('Interactions', () => {
    it('should call onAction when tab is clicked', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2' },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      
      tabButtons[1].click();

      expect(mockContext.onAction).toHaveBeenCalledWith(
        { type: 'tab_change', params: { tabId: 'tab2' } },
        'test-tabs'
      );
    });

    it('should not call onAction for disabled tab', () => {
      const component: A2UComponent = {
        type: 'tabs',
        id: 'test-tabs',
        props: {
          tabs: [
            { id: 'tab1', label: 'Tab 1' },
            { id: 'tab2', label: 'Tab 2', disabled: true },
          ],
        },
      };

      const tabs = renderTabs(component, mockContext);
      const tabButtons = tabs.querySelectorAll('[role="tab"]') as NodeListOf<HTMLButtonElement>;
      
      tabButtons[1].click();

      expect(mockContext.onAction).not.toHaveBeenCalled();
    });
  });
});

