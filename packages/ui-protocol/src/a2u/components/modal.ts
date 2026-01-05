/**
 * Modal Component Renderer
 *
 * Renders an accessible modal dialog with overlay, close button, and keyboard navigation.
 *
 * @module a2u/components/modal
 */

import type { A2UComponent, RenderContext, ModalProps } from '../types';
import { modalPropsSchema } from '../types';

/**
 * CSS class names for modal component styling.
 */
const CSS_CLASSES = {
  overlay: 'a2u-modal-overlay',
  modal: 'a2u-modal',
  modalSmall: 'a2u-modal--small',
  modalMedium: 'a2u-modal--medium',
  modalLarge: 'a2u-modal--large',
  modalFullscreen: 'a2u-modal--fullscreen',
  header: 'a2u-modal__header',
  title: 'a2u-modal__title',
  closeButton: 'a2u-modal__close',
  content: 'a2u-modal__content',
  footer: 'a2u-modal__footer',
};

/**
 * Renders a modal component.
 *
 * @param component - Modal component definition
 * @param context - Render context
 * @returns HTMLElement for the modal (overlay + modal)
 *
 * @example A2U JSON for a modal
 * ```json
 * {
 *   "type": "modal",
 *   "props": {
 *     "title": "Confirm Booking",
 *     "open": true,
 *     "size": "medium",
 *     "closeOnOverlayClick": true,
 *     "closeOnEscape": true
 *   },
 *   "children": [
 *     { "type": "text", "props": { "content": "Are you sure you want to book this flight?" } }
 *   ],
 *   "actions": [
 *     { "type": "call_tool", "params": { "tool": "confirm_booking" } }
 *   ]
 * }
 * ```
 */
export function renderModal(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = modalPropsSchema.parse(component.props || {}) as ModalProps;

  // Create overlay container
  const overlay = document.createElement('div');
  overlay.className = CSS_CLASSES.overlay;
  overlay.setAttribute('role', 'presentation');
  overlay.setAttribute('data-component-id', component.id || '');

  // Hide modal if not open
  if (!props.open) {
    overlay.style.display = 'none';
  }

  // Create modal dialog
  const modal = document.createElement('div');
  modal.className = CSS_CLASSES.modal;
  modal.setAttribute('role', 'dialog');
  modal.setAttribute('aria-modal', 'true');
  
  if (props.title) {
    modal.setAttribute('aria-labelledby', `${component.id}-title`);
  }

  if (component.id) {
    modal.id = component.id;
  }

  // Apply size variant
  switch (props.size) {
    case 'small':
      modal.classList.add(CSS_CLASSES.modalSmall);
      break;
    case 'large':
      modal.classList.add(CSS_CLASSES.modalLarge);
      break;
    case 'fullscreen':
      modal.classList.add(CSS_CLASSES.modalFullscreen);
      break;
    case 'medium':
    default:
      modal.classList.add(CSS_CLASSES.modalMedium);
      break;
  }

  // Apply custom className
  if (props.className) {
    modal.classList.add(props.className);
  }

  // Apply custom styles
  if (props.style) {
    Object.assign(modal.style, props.style);
  }

  // Create header with title and close button
  if (props.title || !props.hideCloseButton) {
    const header = document.createElement('div');
    header.className = CSS_CLASSES.header;

    if (props.title) {
      const title = document.createElement('h2');
      title.className = CSS_CLASSES.title;
      title.id = `${component.id}-title`;
      title.textContent = props.title;
      header.appendChild(title);
    }

    if (!props.hideCloseButton) {
      const closeButton = document.createElement('button');
      closeButton.className = CSS_CLASSES.closeButton;
      closeButton.type = 'button';
      closeButton.setAttribute('aria-label', 'Close modal');
      closeButton.textContent = '×';
      
      // Close modal on button click
      closeButton.addEventListener('click', (e) => {
        e.stopPropagation();
        overlay.style.display = 'none';
        
        // Emit close action
        if (context.onAction && component.id) {
          context.onAction({ type: 'modal_close', params: {} }, component.id);
        }
      });
      
      header.appendChild(closeButton);
    }

    modal.appendChild(header);
  }

  // Create content area
  const content = document.createElement('div');
  content.className = CSS_CLASSES.content;

  // Render children
  if (component.children) {
    for (const child of component.children) {
      content.appendChild(context.renderChild(child));
    }
  }

  modal.appendChild(content);

  // Create footer with actions
  if (component.actions && component.actions.length > 0) {
    const footer = document.createElement('div');
    footer.className = CSS_CLASSES.footer;

    for (const action of component.actions) {
      const button = document.createElement('button');
      button.className = 'a2u-button';
      button.textContent = (action.params?.label as string) || 'Action';
      button.type = 'button';

      button.addEventListener('click', () => {
        if (context.onAction && component.id) {
          context.onAction(action, component.id);
        }
      });

      footer.appendChild(button);
    }

    modal.appendChild(footer);
  }

  // Handle overlay click to close
  if (props.closeOnOverlayClick !== false) {
    overlay.addEventListener('click', (e) => {
      if (e.target === overlay) {
        overlay.style.display = 'none';
        
        if (context.onAction && component.id) {
          context.onAction({ type: 'modal_close', params: {} }, component.id);
        }
      }
    });
  }

  // Handle escape key to close
  if (props.closeOnEscape !== false) {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && overlay.style.display !== 'none') {
        overlay.style.display = 'none';
        
        if (context.onAction && component.id) {
          context.onAction({ type: 'modal_close', params: {} }, component.id);
        }
        
        document.removeEventListener('keydown', handleEscape);
      }
    };
    
    document.addEventListener('keydown', handleEscape);
  }

  // Focus management: trap focus within modal when open
  if (props.open) {
    const focusableElements = modal.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    
    if (focusableElements.length > 0) {
      // Focus first focusable element
      setTimeout(() => {
        (focusableElements[0] as HTMLElement).focus();
      }, 0);

      // Trap focus within modal
      modal.addEventListener('keydown', (e) => {
        if (e.key === 'Tab') {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      });
    }
  }

  overlay.appendChild(modal);
  return overlay;
}

