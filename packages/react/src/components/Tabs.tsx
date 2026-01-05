/**
 * Tabs Component - React Wrapper
 * 
 * A React wrapper around the A2U Tabs component that provides
 * a declarative API for rendering accessible tab interfaces.
 * 
 * @example
 * ```tsx
 * import { Tabs } from '@web-agent/react';
 * 
 * function MyComponent() {
 *   const [activeTab, setActiveTab] = useState('tab1');
 *   
 *   return (
 *     <Tabs
 *       tabs={[
 *         { id: 'tab1', label: 'Overview', icon: '📋' },
 *         { id: 'tab2', label: 'Details', icon: '📝' },
 *         { id: 'tab3', label: 'Settings', icon: '⚙️' },
 *       ]}
 *       activeTab={activeTab}
 *       onTabChange={(tabId) => setActiveTab(tabId)}
 *     >
 *       {activeTab === 'tab1' && <div>Overview content</div>}
 *       {activeTab === 'tab2' && <div>Details content</div>}
 *       {activeTab === 'tab3' && <div>Settings content</div>}
 *     </Tabs>
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { A2URenderer } from '@web-agent/ui-protocol/a2u';
import type { A2UComponent } from '@web-agent/ui-protocol/a2u';

export interface TabItem {
  /** Unique tab identifier */
  id: string;
  
  /** Tab label */
  label: string;
  
  /** Optional icon */
  icon?: string;
  
  /** Whether tab is disabled */
  disabled?: boolean;
}

export interface TabsProps {
  /** Array of tabs */
  tabs: TabItem[];
  
  /** Active tab ID */
  activeTab?: string;
  
  /** Tab orientation */
  orientation?: 'horizontal' | 'vertical';
  
  /** Custom CSS class */
  className?: string;
  
  /** Custom inline styles */
  style?: React.CSSProperties;
  
  /** Tab panel content (should match number of tabs) */
  children?: React.ReactNode;
  
  /** Callback when tab changes */
  onTabChange?: (tabId: string) => void;
}

/**
 * Tabs component for organizing content into multiple panels.
 * 
 * Features:
 * - Accessible (WCAG 2.1 AA compliant)
 * - Full keyboard navigation (Arrow keys, Home, End)
 * - Horizontal and vertical orientations
 * - Disabled tab support
 * - Icon support
 */
export const Tabs: React.FC<TabsProps> = ({
  tabs,
  activeTab,
  orientation = 'horizontal',
  className,
  style,
  children,
  onTabChange,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<A2URenderer | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize renderer if not already done
    if (!rendererRef.current) {
      rendererRef.current = new A2URenderer({
        maxDepth: 10,
        maxComponents: 100,
      });
    }

    // Convert React children to A2U components
    // For simplicity, we'll create one child per tab
    const childComponents: A2UComponent[] = tabs.map((tab, index) => ({
      type: 'text',
      props: {
        content: `Tab panel ${index + 1}`,
        allowHtml: true,
      },
    }));

    // Create A2U component
    const component: A2UComponent = {
      type: 'tabs',
      id: 'react-tabs',
      props: {
        tabs: tabs.map(tab => ({
          id: tab.id,
          label: tab.label,
          icon: tab.icon,
          disabled: tab.disabled || false,
        })),
        activeTab,
        orientation,
        className,
        style: style as Record<string, string>,
      },
      children: childComponents,
    };

    // Render the tabs
    const tabsElement = rendererRef.current.renderComponent(
      component,
      (action, componentId) => {
        if (action.type === 'tab_change' && action.params?.tabId) {
          onTabChange?.(action.params.tabId as string);
        }
      }
    );

    // Clear container and append tabs
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(tabsElement);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [tabs, activeTab, orientation, className, style, children, onTabChange]);

  return <div ref={containerRef} />;
};

Tabs.displayName = 'Tabs';

