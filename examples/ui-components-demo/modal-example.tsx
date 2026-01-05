/**
 * Modal Component Examples
 * 
 * This file demonstrates various use cases for the Modal component.
 */

import React, { useState } from 'react';
import { Modal } from '@web-agent/react';

export function ModalExamples() {
  const [basicOpen, setBasicOpen] = useState(false);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [sizeDemo, setSizeDemo] = useState<'small' | 'medium' | 'large' | 'fullscreen'>('medium');
  const [sizeOpen, setSizeOpen] = useState(false);

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Modal Component Examples</h1>

      {/* Example 1: Basic Modal */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>1. Basic Modal</h2>
        <p>A simple modal with title and content.</p>
        
        <button onClick={() => setBasicOpen(true)}>
          Open Basic Modal
        </button>

        <Modal
          open={basicOpen}
          title="Welcome!"
          onClose={() => setBasicOpen(false)}
        >
          <p>This is a basic modal with a title and some content.</p>
          <p>You can close it by clicking the X button, pressing Escape, or clicking outside.</p>
        </Modal>
      </section>

      {/* Example 2: Confirmation Dialog */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>2. Confirmation Dialog</h2>
        <p>A modal with custom actions for confirmation.</p>
        
        <button onClick={() => setConfirmOpen(true)}>
          Delete Item
        </button>

        <Modal
          open={confirmOpen}
          title="Confirm Deletion"
          size="small"
          closeOnOverlayClick={false}
          onClose={() => setConfirmOpen(false)}
          actions={[
            {
              label: 'Cancel',
              onClick: () => setConfirmOpen(false),
              variant: 'secondary',
            },
            {
              label: 'Delete',
              onClick: () => {
                console.log('Item deleted!');
                setConfirmOpen(false);
              },
              variant: 'danger',
            },
          ]}
        >
          <p>Are you sure you want to delete this item?</p>
          <p style={{ color: '#d32f2f', fontWeight: 'bold' }}>
            This action cannot be undone.
          </p>
        </Modal>
      </section>

      {/* Example 3: Form Modal */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>3. Form Modal</h2>
        <p>A modal containing a form.</p>
        
        <button onClick={() => setFormOpen(true)}>
          Create New Item
        </button>

        <Modal
          open={formOpen}
          title="Create New Item"
          size="medium"
          onClose={() => setFormOpen(false)}
          actions={[
            {
              label: 'Cancel',
              onClick: () => setFormOpen(false),
              variant: 'secondary',
            },
            {
              label: 'Create',
              onClick: () => {
                console.log('Item created!');
                setFormOpen(false);
              },
              variant: 'primary',
            },
          ]}
        >
          <form style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label htmlFor="item-name">Item Name</label>
              <input
                id="item-name"
                type="text"
                placeholder="Enter item name"
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
            
            <div>
              <label htmlFor="item-description">Description</label>
              <textarea
                id="item-description"
                placeholder="Enter description"
                rows={4}
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              />
            </div>
            
            <div>
              <label htmlFor="item-category">Category</label>
              <select
                id="item-category"
                style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }}
              >
                <option value="">Select a category</option>
                <option value="work">Work</option>
                <option value="personal">Personal</option>
                <option value="other">Other</option>
              </select>
            </div>
          </form>
        </Modal>
      </section>

      {/* Example 4: Different Sizes */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>4. Different Sizes</h2>
        <p>Modals can be small, medium, large, or fullscreen.</p>
        
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <button onClick={() => { setSizeDemo('small'); setSizeOpen(true); }}>
            Small Modal
          </button>
          <button onClick={() => { setSizeDemo('medium'); setSizeOpen(true); }}>
            Medium Modal
          </button>
          <button onClick={() => { setSizeDemo('large'); setSizeOpen(true); }}>
            Large Modal
          </button>
          <button onClick={() => { setSizeDemo('fullscreen'); setSizeOpen(true); }}>
            Fullscreen Modal
          </button>
        </div>

        <Modal
          open={sizeOpen}
          title={`${sizeDemo.charAt(0).toUpperCase() + sizeDemo.slice(1)} Modal`}
          size={sizeDemo}
          onClose={() => setSizeOpen(false)}
        >
          <p>This is a {sizeDemo} modal.</p>
          <p>
            {sizeDemo === 'small' && 'Small modals are great for simple confirmations.'}
            {sizeDemo === 'medium' && 'Medium modals work well for most use cases.'}
            {sizeDemo === 'large' && 'Large modals can contain more complex content.'}
            {sizeDemo === 'fullscreen' && 'Fullscreen modals take up the entire viewport.'}
          </p>
        </Modal>
      </section>

      {/* Example 5: Custom Styling */}
      <section style={{ marginBottom: '2rem' }}>
        <h2>5. Custom Styling</h2>
        <p>Modals can be styled with custom CSS classes and inline styles.</p>
        
        <button onClick={() => setBasicOpen(true)}>
          Open Styled Modal
        </button>

        <Modal
          open={basicOpen}
          title="Styled Modal"
          className="custom-modal"
          style={{
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            backdropFilter: 'blur(4px)',
          }}
          onClose={() => setBasicOpen(false)}
        >
          <p>This modal has custom styling applied.</p>
        </Modal>
      </section>
    </div>
  );
}

export default ModalExamples;

