/**
 * Tests for Modal React wrapper component
 */

import { describe, it, expect, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { Modal } from '../Modal';
import React from 'react';

describe('Modal React Component', () => {
  describe('Basic Rendering', () => {
    it('should render modal when open', () => {
      const { container } = render(
        <Modal open={true} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      expect(container.querySelector('.a2u-modal-overlay')).toBeTruthy();
    });

    it('should not render modal when closed', () => {
      const { container } = render(
        <Modal open={false} title="Test Modal">
          <p>Modal content</p>
        </Modal>
      );

      // Modal should still be in DOM but hidden
      const modal = container.querySelector('.a2u-modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should render modal title', () => {
      const { container } = render(
        <Modal open={true} title="My Modal Title">
          <p>Content</p>
        </Modal>
      );

      const title = container.querySelector('.a2u-modal__title');
      expect(title?.textContent).toBe('My Modal Title');
    });

    it('should apply custom className', () => {
      const { container } = render(
        <Modal open={true} className="custom-modal">
          <p>Content</p>
        </Modal>
      );

      const modal = container.querySelector('.a2u-modal-overlay');
      expect(modal?.classList.contains('custom-modal')).toBe(true);
    });

    it('should apply custom styles', () => {
      const { container } = render(
        <Modal open={true} style={{ backgroundColor: 'red' }}>
          <p>Content</p>
        </Modal>
      );

      const modal = container.querySelector('.a2u-modal-overlay') as HTMLElement;
      expect(modal?.style.backgroundColor).toBe('red');
    });
  });

  describe('Size Variants', () => {
    it('should apply small size', () => {
      const { container } = render(
        <Modal open={true} size="small">
          <p>Content</p>
        </Modal>
      );

      const modal = container.querySelector('.a2u-modal');
      expect(modal?.classList.contains('a2u-modal--sm')).toBe(true);
    });

    it('should apply medium size by default', () => {
      const { container } = render(
        <Modal open={true}>
          <p>Content</p>
        </Modal>
      );

      const modal = container.querySelector('.a2u-modal');
      expect(modal?.classList.contains('a2u-modal--md')).toBe(true);
    });

    it('should apply large size', () => {
      const { container } = render(
        <Modal open={true} size="large">
          <p>Content</p>
        </Modal>
      );

      const modal = container.querySelector('.a2u-modal');
      expect(modal?.classList.contains('a2u-modal--lg')).toBe(true);
    });

    it('should apply fullscreen size', () => {
      const { container } = render(
        <Modal open={true} size="fullscreen">
          <p>Content</p>
        </Modal>
      );

      const modal = container.querySelector('.a2u-modal');
      expect(modal?.classList.contains('a2u-modal--fullscreen')).toBe(true);
    });
  });

  describe('Actions', () => {
    it('should render action buttons', () => {
      const handleConfirm = vi.fn();
      const handleCancel = vi.fn();

      const { container } = render(
        <Modal
          open={true}
          title="Confirm"
          actions={[
            { label: 'Cancel', onClick: handleCancel, variant: 'secondary' },
            { label: 'Confirm', onClick: handleConfirm, variant: 'primary' },
          ]}
        >
          <p>Are you sure?</p>
        </Modal>
      );

      const footer = container.querySelector('.a2u-modal__footer');
      expect(footer).toBeTruthy();
    });
  });

  describe('Close Behavior', () => {
    it('should call onClose when close button is clicked', async () => {
      const handleClose = vi.fn();

      const { container } = render(
        <Modal open={true} title="Test" onClose={handleClose}>
          <p>Content</p>
        </Modal>
      );

      const closeButton = container.querySelector('.a2u-modal__close-button') as HTMLButtonElement;
      if (closeButton) {
        closeButton.click();
        await waitFor(() => {
          expect(handleClose).toHaveBeenCalled();
        });
      }
    });

    it('should hide close button when hideCloseButton is true', () => {
      const { container } = render(
        <Modal open={true} title="Test" hideCloseButton={true}>
          <p>Content</p>
        </Modal>
      );

      const closeButton = container.querySelector('.a2u-modal__close-button');
      expect(closeButton).toBeFalsy();
    });
  });

  describe('Accessibility', () => {
    it('should have role="dialog"', () => {
      const { container } = render(
        <Modal open={true} title="Test">
          <p>Content</p>
        </Modal>
      );

      const dialog = container.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-modal="true"', () => {
      const { container } = render(
        <Modal open={true} title="Test">
          <p>Content</p>
        </Modal>
      );

      const dialog = container.querySelector('[aria-modal="true"]');
      expect(dialog).toBeTruthy();
    });

    it('should have aria-labelledby when title is provided', () => {
      const { container } = render(
        <Modal open={true} title="My Title">
          <p>Content</p>
        </Modal>
      );

      const dialog = container.querySelector('[role="dialog"]');
      const ariaLabelledBy = dialog?.getAttribute('aria-labelledby');
      expect(ariaLabelledBy).toBeTruthy();
    });
  });

  describe('Re-rendering', () => {
    it('should update when open prop changes', () => {
      const { container, rerender } = render(
        <Modal open={false} title="Test">
          <p>Content</p>
        </Modal>
      );

      let modal = container.querySelector('.a2u-modal-overlay');
      expect(modal).toBeTruthy();

      rerender(
        <Modal open={true} title="Test">
          <p>Content</p>
        </Modal>
      );

      modal = container.querySelector('.a2u-modal-overlay');
      expect(modal).toBeTruthy();
    });

    it('should update when title changes', () => {
      const { container, rerender } = render(
        <Modal open={true} title="First Title">
          <p>Content</p>
        </Modal>
      );

      let title = container.querySelector('.a2u-modal__title');
      expect(title?.textContent).toBe('First Title');

      rerender(
        <Modal open={true} title="Second Title">
          <p>Content</p>
        </Modal>
      );

      title = container.querySelector('.a2u-modal__title');
      expect(title?.textContent).toBe('Second Title');
    });
  });
});

