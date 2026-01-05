/**
 * Modal Component - React Wrapper
 * 
 * A React wrapper around the A2U Modal component that provides
 * a declarative API for rendering accessible modal dialogs.
 * 
 * @example
 * ```tsx
 * import { Modal } from '@web-agent/react';
 * 
 * function MyComponent() {
 *   const [isOpen, setIsOpen] = useState(false);
 *   
 *   return (
 *     <>
 *       <button onClick={() => setIsOpen(true)}>Open Modal</button>
 *       
 *       <Modal
 *         open={isOpen}
 *         title="Confirm Action"
 *         size="medium"
 *         onClose={() => setIsOpen(false)}
 *       >
 *         <p>Are you sure you want to proceed?</p>
 *       </Modal>
 *     </>
 *   );
 * }
 * ```
 */

import React, { useEffect, useRef } from 'react';
import { A2URenderer } from '@web-agent/ui-protocol/a2u';
import type { A2UComponent, A2UAction } from '@web-agent/ui-protocol/a2u';

export interface ModalProps {
  /** Whether the modal is open */
  open?: boolean;
  
  /** Modal title */
  title?: string;
  
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'fullscreen';
  
  /** Close modal when clicking overlay */
  closeOnOverlayClick?: boolean;
  
  /** Close modal when pressing Escape */
  closeOnEscape?: boolean;
  
  /** Hide the close button */
  hideCloseButton?: boolean;
  
  /** Custom CSS class */
  className?: string;
  
  /** Custom inline styles */
  style?: React.CSSProperties;
  
  /** Modal content */
  children?: React.ReactNode;
  
  /** Actions to display in footer */
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'secondary' | 'danger';
  }>;
  
  /** Callback when modal is closed */
  onClose?: () => void;
}

/**
 * Modal component for displaying content in an overlay dialog.
 * 
 * Features:
 * - Accessible (WCAG 2.1 AA compliant)
 * - Focus trap when open
 * - Keyboard navigation (Escape to close, Tab trap)
 * - Configurable sizes
 * - Custom actions in footer
 */
export const Modal: React.FC<ModalProps> = ({
  open = false,
  title,
  size = 'medium',
  closeOnOverlayClick = true,
  closeOnEscape = true,
  hideCloseButton = false,
  className,
  style,
  children,
  actions,
  onClose,
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
    const childComponents: A2UComponent[] = [];
    if (children) {
      // For now, wrap children in a text component
      // In a real implementation, you'd want to recursively convert React elements
      childComponents.push({
        type: 'text',
        props: {
          content: typeof children === 'string' ? children : '',
          allowHtml: true,
        },
      });
    }

    // Convert actions to A2U actions
    const a2uActions: A2UAction[] = actions?.map(action => ({
      type: 'call_tool',
      params: {
        label: action.label,
        variant: action.variant,
      },
    })) || [];

    // Create A2U component
    const component: A2UComponent = {
      type: 'modal',
      id: 'react-modal',
      props: {
        title,
        open,
        size,
        closeOnOverlayClick,
        closeOnEscape,
        hideCloseButton,
        className,
        style: style as Record<string, string>,
      },
      children: childComponents,
      actions: a2uActions,
    };

    // Render the modal
    const modalElement = rendererRef.current.renderComponent(
      component,
      (action, componentId) => {
        if (action.type === 'modal_close') {
          onClose?.();
        } else if (action.type === 'call_tool' && actions) {
          const actionIndex = a2uActions.findIndex(a => a === action);
          if (actionIndex >= 0 && actions[actionIndex]) {
            actions[actionIndex].onClick();
          }
        }
      }
    );

    // Clear container and append modal
    containerRef.current.innerHTML = '';
    containerRef.current.appendChild(modalElement);

    // Cleanup
    return () => {
      if (containerRef.current) {
        containerRef.current.innerHTML = '';
      }
    };
  }, [open, title, size, closeOnOverlayClick, closeOnEscape, hideCloseButton, className, style, children, actions, onClose]);

  return <div ref={containerRef} />;
};

Modal.displayName = 'Modal';

