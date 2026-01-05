/**
 * Dropdown Component - React Wrapper
 * 
 * A React wrapper around the A2U Dropdown component that provides
 * a declarative API for rendering accessible dropdown menus.
 * 
 * @example
 * ```tsx
 * import { Dropdown } from '@web-agent/react';
 * 
 * function MyComponent() {
 *   const [value, setValue] = useState('option1');
 *   
 *   return (
 *     <Dropdown
 *       label="Sort by"
 *       placeholder="Select an option"
 *       options={[
 *         { value: 'option1', label: 'Price: Low to High', icon: '💰' },
 *         { value: 'option2', label: 'Price: High to Low', icon: '💎' },
 *         { value: 'divider', divider: true },
 *         { value: 'option3', label: 'Duration', icon: '⏱️' },
 *       ]}
 *       value={value}
 *       onChange={(newValue) => setValue(newValue)}
 *     />
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { A2URenderer } from '@web-agent/ui-protocol/a2u';
import type { A2UComponent } from '@web-agent/ui-protocol/a2u';

export interface DropdownOption {
  /** Option value */
  value: string;
  
  /** Option label */
  label: string;
  
  /** Optional icon */
  icon?: string;
  
  /** Whether option is disabled */
  disabled?: boolean;
  
  /** Whether this is a divider */
  divider?: boolean;
}

export interface DropdownProps {
  /** Dropdown label */
  label?: string;
  
  /** Placeholder text */
  placeholder?: string;
  
  /** Array of options */
  options: DropdownOption[];
  
  /** Selected value */
  value?: string;
  
  /** Custom CSS class */
  className?: string;
  
  /** Custom inline styles */
  style?: React.CSSProperties;
  
  /** Callback when selection changes */
  onChange?: (value: string, label: string) => void;
}

/**
 * Dropdown component for selecting from a list of options.
 * 
 * Features:
 * - Accessible (WCAG 2.1 AA compliant)
 * - Full keyboard navigation
 * - Disabled options support
 * - Divider support
 * - Icon support
 * - Auto-close on selection
 */
export const Dropdown: React.FC<DropdownProps> = ({
  label,
  placeholder,
  options,
  value,
  className,
  style,
  onChange,
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

    // Create A2U component
    const component: A2UComponent = {
      type: 'dropdown',
      id: 'react-dropdown',
      props: {
        label,
        placeholder,
        options: options.map(opt => ({
          value: opt.value,
          label: opt.label,
          icon: opt.icon,
          disabled: opt.disabled || false,
          divider: opt.divider || false,
        })),
        value,
        className,
        style: style as Record<string, string>,
      },
    };

    // Render the dropdown using the A2U protocol
    const a2uResponse = {
      type: 'ui' as const,
      version: '1.0',
      ui: component,
    };

    rendererRef.current.render(a2uResponse, containerRef.current, {
      onAction: (action: any, componentId?: string) => {
        if (action.type === 'dropdown_select' && action.params) {
          const selectedValue = action.params.value as string;
          const selectedLabel = action.params.label as string;
          onChange?.(selectedValue, selectedLabel);
        }
      },
    });

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [label, placeholder, options, value, className, style, onChange]);

  return <div ref={containerRef} />;
};

Dropdown.displayName = 'Dropdown';

