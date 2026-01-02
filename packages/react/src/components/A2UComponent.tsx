/**
 * A2UComponent
 *
 * React wrapper for rendering A2U components.
 *
 * @example Basic Usage
 * ```tsx
 * import { A2UComponent } from '@web-agent/react';
 *
 * function MessageUI({ ui }) {
 *   return (
 *     <A2UComponent
 *       component={ui}
 *       onAction={(action) => console.log('Action:', action)}
 *     />
 *   );
 * }
 * ```
 *
 * @module components/A2UComponent
 */

import { useEffect, useRef, useMemo } from 'react';
import { A2URenderer } from '@web-agent/ui-protocol';
import type { A2UComponentProps } from '../types';

/**
 * React component for rendering A2U UI components.
 *
 * Uses the A2URenderer from @web-agent/ui-protocol under the hood.
 *
 * @param props - Component props
 * @returns React element containing rendered A2U component
 *
 * @example With Custom Styling
 * ```tsx
 * <A2UComponent
 *   component={agentResponse.ui}
 *   className="my-ui-container"
 *   style={{ padding: '1rem' }}
 *   onAction={handleAction}
 * />
 * ```
 */
export function A2UComponent({
  component,
  onAction,
  className,
  style,
}: A2UComponentProps): JSX.Element {
  const containerRef = useRef<HTMLDivElement>(null);

  // Create renderer instance (memoized)
  const renderer = useMemo(() => new A2URenderer(), []);

  // Render component when it changes
  useEffect(() => {
    if (!containerRef.current || !component) return;

    // Create A2U response structure
    const response = {
      version: '1.0' as const,
      type: 'ui' as const,
      ui: component,
    };

    // Render to container
    renderer.render(response, containerRef.current, {
      onAction: (action, componentId) => {
        onAction?.(action, componentId);
      },
    });
  }, [component, renderer, onAction]);

  return (
    <div
      ref={containerRef}
      className={className ? `a2u-component ${className}` : 'a2u-component'}
      style={style}
      data-testid="a2u-component"
    />
  );
}

export default A2UComponent;

