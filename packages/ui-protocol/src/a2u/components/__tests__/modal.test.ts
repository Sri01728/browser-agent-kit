/**
 * Tests for Modal component
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { renderModal } from '../modal';
import type { A2UComponent, RenderContext } from '../../types';

describe('Modal Component', () => {
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
    it('should render modal with overlay', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          title: 'Test Modal',
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      expect(modal.className).toContain('a2u-modal-overlay');
      expect(modal.querySelector('.a2u-modal')).toBeTruthy();
    });

    it('should render modal title', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          title: 'Test Title',
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      const title = modal.querySelector('.a2u-modal__title');
      expect(title).toBeTruthy();
      expect(title?.textContent).toBe('Test Title');
    });

    it('should render close button by default', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      const closeButton = modal.querySelector('.a2u-modal__close');
      expect(closeButton).toBeTruthy();
    });

    it('should hide close button when hideCloseButton is true', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
          hideCloseButton: true,
        },
      };

      const modal = renderModal(component, mockContext);
      const closeButton = modal.querySelector('.a2u-modal__close');
      expect(closeButton).toBeFalsy();
    });

    it('should render children', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
        children: [
          { type: 'text', props: { content: 'Modal content' } },
        ],
      };

      const modal = renderModal(component, mockContext);
      expect(mockContext.renderChild).toHaveBeenCalledTimes(1);
      expect(modal.querySelector('.a2u-modal__content')).toBeTruthy();
    });
  });

  describe('Size Variants', () => {
    it('should apply small size class', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
          size: 'small',
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal');
      expect(modalEl?.classList.contains('a2u-modal--small')).toBe(true);
    });

    it('should apply medium size class by default', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal');
      expect(modalEl?.classList.contains('a2u-modal--medium')).toBe(true);
    });

    it('should apply large size class', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
          size: 'large',
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal');
      expect(modalEl?.classList.contains('a2u-modal--large')).toBe(true);
    });

    it('should apply fullscreen size class', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
          size: 'fullscreen',
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal');
      expect(modalEl?.classList.contains('a2u-modal--fullscreen')).toBe(true);
    });
  });

  describe('Visibility', () => {
    it('should be visible when open is true', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      expect(modal.style.display).not.toBe('none');
    });

    it('should be hidden when open is false', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: false,
        },
      };

      const modal = renderModal(component, mockContext);
      expect(modal.style.display).toBe('none');
    });
  });

  describe('Actions', () => {
    it('should render action buttons in footer', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
        actions: [
          { type: 'call_tool', params: { label: 'Confirm' } },
          { type: 'call_tool', params: { label: 'Cancel' } },
        ],
      };

      const modal = renderModal(component, mockContext);
      const footer = modal.querySelector('.a2u-modal__footer');
      expect(footer).toBeTruthy();
      
      const buttons = footer?.querySelectorAll('button');
      expect(buttons?.length).toBe(2);
      expect(buttons?.[0].textContent).toBe('Confirm');
      expect(buttons?.[1].textContent).toBe('Cancel');
    });

    it('should call onAction when action button is clicked', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
        actions: [
          { type: 'call_tool', params: { label: 'Confirm', tool: 'confirm' } },
        ],
      };

      const modal = renderModal(component, mockContext);
      container.appendChild(modal);
      
      const button = modal.querySelector('.a2u-modal__footer button') as HTMLButtonElement;
      button.click();

      expect(mockContext.onAction).toHaveBeenCalledWith(
        { type: 'call_tool', params: { label: 'Confirm', tool: 'confirm' } },
        'test-modal'
      );
    });

    it('should call onAction when close button is clicked', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      container.appendChild(modal);
      
      const closeButton = modal.querySelector('.a2u-modal__close') as HTMLButtonElement;
      closeButton.click();

      expect(mockContext.onAction).toHaveBeenCalledWith(
        { type: 'modal_close', params: {} },
        'test-modal'
      );
    });
  });

  describe('Accessibility', () => {
    it('should have proper ARIA attributes', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          title: 'Test Modal',
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal');
      
      expect(modalEl?.getAttribute('role')).toBe('dialog');
      expect(modalEl?.getAttribute('aria-modal')).toBe('true');
      expect(modalEl?.getAttribute('aria-labelledby')).toBe('test-modal-title');
    });

    it('should have accessible close button', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      const closeButton = modal.querySelector('.a2u-modal__close');
      
      expect(closeButton?.getAttribute('aria-label')).toBe('Close modal');
      expect(closeButton?.getAttribute('type')).toBe('button');
    });

    it('should have presentation role on overlay', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
        },
      };

      const modal = renderModal(component, mockContext);
      expect(modal.getAttribute('role')).toBe('presentation');
    });
  });

  describe('Custom Styling', () => {
    it('should apply custom className', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
          className: 'custom-modal',
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal');
      expect(modalEl?.classList.contains('custom-modal')).toBe(true);
    });

    it('should apply custom styles', () => {
      const component: A2UComponent = {
        type: 'modal',
        id: 'test-modal',
        props: {
          open: true,
          style: {
            backgroundColor: 'red',
            padding: '20px',
          },
        },
      };

      const modal = renderModal(component, mockContext);
      const modalEl = modal.querySelector('.a2u-modal') as HTMLElement;
      expect(modalEl?.style.backgroundColor).toBe('red');
      expect(modalEl?.style.padding).toBe('20px');
    });
  });
});

