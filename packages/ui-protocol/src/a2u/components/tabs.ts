/**
 * Tabs Component Renderer
 *
 * Renders an accessible tabs component with keyboard navigation.
 *
 * @module a2u/components/tabs
 */

import type { A2UComponent, RenderContext, TabsProps, TabItem } from '../types';
import { tabsPropsSchema } from '../types';

/**
 * CSS class names for tabs component styling.
 */
const CSS_CLASSES = {
  tabs: 'a2u-tabs',
  tabsVertical: 'a2u-tabs--vertical',
  tabList: 'a2u-tabs__list',
  tab: 'a2u-tabs__tab',
  tabActive: 'a2u-tabs__tab--active',
  tabDisabled: 'a2u-tabs__tab--disabled',
  tabPanels: 'a2u-tabs__panels',
  tabPanel: 'a2u-tabs__panel',
  tabPanelActive: 'a2u-tabs__panel--active',
};

/**
 * Renders a tabs component.
 *
 * @param component - Tabs component definition
 * @param context - Render context
 * @returns HTMLElement for the tabs
 *
 * @example A2U JSON for tabs
 * ```json
 * {
 *   "type": "tabs",
 *   "props": {
 *     "tabs": [
 *       { "id": "tab1", "label": "Overview", "disabled": false },
 *       { "id": "tab2", "label": "Details", "disabled": false }
 *     ],
 *     "activeTab": "tab1",
 *     "orientation": "horizontal"
 *   },
 *   "children": [
 *     { "type": "text", "props": { "content": "Overview content" } },
 *     { "type": "text", "props": { "content": "Details content" } }
 *   ]
 * }
 * ```
 */
export function renderTabs(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = tabsPropsSchema.parse(component.props || { tabs: [] }) as TabsProps;

  // Create tabs container
  const container = document.createElement('div');
  container.className = CSS_CLASSES.tabs;

  if (component.id) {
    container.id = component.id;
    container.setAttribute('data-component-id', component.id);
  }

  // Apply orientation
  if (props.orientation === 'vertical') {
    container.classList.add(CSS_CLASSES.tabsVertical);
  }

  // Apply custom className
  if (props.className) {
    container.classList.add(props.className);
  }

  // Apply custom styles
  if (props.style) {
    Object.assign(container.style, props.style);
  }

  // Create tab list (ARIA tablist)
  const tabList = document.createElement('div');
  tabList.className = CSS_CLASSES.tabList;
  tabList.setAttribute('role', 'tablist');
  tabList.setAttribute('aria-orientation', props.orientation || 'horizontal');

  // Track active tab index
  let activeTabIndex = 0;
  const tabs: HTMLButtonElement[] = [];

  // Create tabs
  props.tabs.forEach((tab: TabItem, index: number) => {
    const tabButton = document.createElement('button');
    tabButton.className = CSS_CLASSES.tab;
    tabButton.setAttribute('role', 'tab');
    tabButton.setAttribute('id', `${component.id}-tab-${tab.id}`);
    tabButton.setAttribute('aria-controls', `${component.id}-panel-${tab.id}`);
    tabButton.type = 'button';

    // Set tab content
    if (tab.icon) {
      tabButton.textContent = `${tab.icon} ${tab.label}`;
    } else {
      tabButton.textContent = tab.label;
    }

    // Handle active state
    const isActive = props.activeTab === tab.id || (index === 0 && !props.activeTab);
    if (isActive) {
      tabButton.classList.add(CSS_CLASSES.tabActive);
      tabButton.setAttribute('aria-selected', 'true');
      tabButton.setAttribute('tabindex', '0');
      activeTabIndex = index;
    } else {
      tabButton.setAttribute('aria-selected', 'false');
      tabButton.setAttribute('tabindex', '-1');
    }

    // Handle disabled state
    if (tab.disabled) {
      tabButton.classList.add(CSS_CLASSES.tabDisabled);
      tabButton.disabled = true;
      tabButton.setAttribute('aria-disabled', 'true');
    }

    // Tab click handler
    tabButton.addEventListener('click', () => {
      if (!tab.disabled) {
        activateTab(index);
        
        // Emit tab change action
        if (context.onAction && component.id) {
          context.onAction(
            { type: 'tab_change', params: { tabId: tab.id } },
            component.id
          );
        }
      }
    });

    tabs.push(tabButton);
    tabList.appendChild(tabButton);
  });

  // Keyboard navigation
  tabList.addEventListener('keydown', (e) => {
    const currentIndex = tabs.findIndex(tab => tab === document.activeElement);
    if (currentIndex === -1) return;

    let nextIndex = currentIndex;
    const isHorizontal = props.orientation !== 'vertical';

    switch (e.key) {
      case isHorizontal ? 'ArrowRight' : 'ArrowDown':
        e.preventDefault();
        nextIndex = (currentIndex + 1) % tabs.length;
        // Skip disabled tabs
        while (tabs[nextIndex].disabled && nextIndex !== currentIndex) {
          nextIndex = (nextIndex + 1) % tabs.length;
        }
        break;
      case isHorizontal ? 'ArrowLeft' : 'ArrowUp':
        e.preventDefault();
        nextIndex = (currentIndex - 1 + tabs.length) % tabs.length;
        // Skip disabled tabs
        while (tabs[nextIndex].disabled && nextIndex !== currentIndex) {
          nextIndex = (nextIndex - 1 + tabs.length) % tabs.length;
        }
        break;
      case 'Home':
        e.preventDefault();
        nextIndex = 0;
        while (tabs[nextIndex].disabled && nextIndex < tabs.length - 1) {
          nextIndex++;
        }
        break;
      case 'End':
        e.preventDefault();
        nextIndex = tabs.length - 1;
        while (tabs[nextIndex].disabled && nextIndex > 0) {
          nextIndex--;
        }
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      tabs[nextIndex].focus();
      activateTab(nextIndex);
    }
  });

  container.appendChild(tabList);

  // Create tab panels container
  const panelsContainer = document.createElement('div');
  panelsContainer.className = CSS_CLASSES.tabPanels;

  // Create tab panels
  props.tabs.forEach((tab: TabItem, index: number) => {
    const panel = document.createElement('div');
    panel.className = CSS_CLASSES.tabPanel;
    panel.setAttribute('role', 'tabpanel');
    panel.setAttribute('id', `${component.id}-panel-${tab.id}`);
    panel.setAttribute('aria-labelledby', `${component.id}-tab-${tab.id}`);

    // Handle active state
    const isActive = props.activeTab === tab.id || (index === 0 && !props.activeTab);
    if (isActive) {
      panel.classList.add(CSS_CLASSES.tabPanelActive);
      panel.setAttribute('tabindex', '0');
    } else {
      panel.style.display = 'none';
      panel.setAttribute('tabindex', '-1');
    }

    // Render panel content
    if (component.children && component.children[index]) {
      panel.appendChild(context.renderChild(component.children[index]));
    }

    panelsContainer.appendChild(panel);
  });

  container.appendChild(panelsContainer);

  // Function to activate a tab
  function activateTab(index: number) {
    // Update tabs
    tabs.forEach((tab, i) => {
      if (i === index) {
        tab.classList.add(CSS_CLASSES.tabActive);
        tab.setAttribute('aria-selected', 'true');
        tab.setAttribute('tabindex', '0');
      } else {
        tab.classList.remove(CSS_CLASSES.tabActive);
        tab.setAttribute('aria-selected', 'false');
        tab.setAttribute('tabindex', '-1');
      }
    });

    // Update panels
    const panels = panelsContainer.querySelectorAll(`.${CSS_CLASSES.tabPanel}`);
    panels.forEach((panel, i) => {
      if (i === index) {
        (panel as HTMLElement).classList.add(CSS_CLASSES.tabPanelActive);
        (panel as HTMLElement).style.display = '';
        panel.setAttribute('tabindex', '0');
      } else {
        (panel as HTMLElement).classList.remove(CSS_CLASSES.tabPanelActive);
        (panel as HTMLElement).style.display = 'none';
        panel.setAttribute('tabindex', '-1');
      }
    });

    activeTabIndex = index;
  }

  return container;
}

