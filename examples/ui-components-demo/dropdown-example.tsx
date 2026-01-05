/**
 * Dropdown Component Examples
 * 
 * This file demonstrates various use cases for the Dropdown component.
 */

import React, { useState } from 'react';
import { Dropdown } from '@web-agent/react';

export function DropdownExamples() {
  const [sortBy, setSortBy] = useState('price-low');
  const [filterBy, setFilterBy] = useState('');
  const [actionValue, setActionValue] = useState('');

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Dropdown Component Examples</h1>

      {/* Example 1: Basic Dropdown */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>1. Basic Dropdown</h2>
        <p>A simple dropdown for selecting options.</p>
        
        <Dropdown
          label="Sort by"
          placeholder="Select an option"
          options={[
            { value: 'name', label: 'Name' },
            { value: 'date', label: 'Date' },
            { value: 'size', label: 'Size' },
          ]}
          value={sortBy}
          onChange={(value, label) => {
            console.log(`Selected: ${label} (${value})`);
            setSortBy(value);
          }}
        />
        
        <p style={{ marginTop: '1rem', color: '#666' }}>
          Selected: {sortBy || 'None'}
        </p>
      </section>

      {/* Example 2: Dropdown with Icons */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>2. Dropdown with Icons</h2>
        <p>Options can include icons for better visual clarity.</p>
        
        <Dropdown
          label="Sort by"
          placeholder="Select sorting option"
          options={[
            { value: 'price-low', label: 'Price: Low to High', icon: '💰' },
            { value: 'price-high', label: 'Price: High to Low', icon: '💎' },
            { value: 'duration', label: 'Duration', icon: '⏱️' },
            { value: 'rating', label: 'Rating', icon: '⭐' },
            { value: 'popularity', label: 'Popularity', icon: '🔥' },
          ]}
          value={sortBy}
          onChange={(value) => setSortBy(value)}
        />
      </section>

      {/* Example 3: Dropdown with Dividers */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>3. Dropdown with Dividers</h2>
        <p>Use dividers to group related options.</p>
        
        <Dropdown
          label="Filter by"
          placeholder="Select filter"
          options={[
            { value: 'all', label: 'All Items', icon: '📦' },
            { value: 'divider-1', label: '', divider: true },
            { value: 'active', label: 'Active', icon: '✅' },
            { value: 'pending', label: 'Pending', icon: '⏳' },
            { value: 'completed', label: 'Completed', icon: '🎉' },
            { value: 'divider-2', label: '', divider: true },
            { value: 'archived', label: 'Archived', icon: '📁' },
          ]}
          value={filterBy}
          onChange={(value) => setFilterBy(value)}
        />
      </section>

      {/* Example 4: Action Menu */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>4. Action Menu</h2>
        <p>Dropdown can be used as an action menu.</p>
        
        <Dropdown
          label="Actions"
          placeholder="Select an action"
          options={[
            { value: 'edit', label: 'Edit', icon: '✏️' },
            { value: 'duplicate', label: 'Duplicate', icon: '📋' },
            { value: 'share', label: 'Share', icon: '🔗' },
            { value: 'divider', label: '', divider: true },
            { value: 'archive', label: 'Archive', icon: '📁' },
            { value: 'delete', label: 'Delete', icon: '🗑️' },
          ]}
          value={actionValue}
          onChange={(value, label) => {
            console.log(`Action selected: ${label}`);
            setActionValue(value);
            
            // Perform action
            switch (value) {
              case 'edit':
                alert('Opening editor...');
                break;
              case 'duplicate':
                alert('Duplicating item...');
                break;
              case 'share':
                alert('Opening share dialog...');
                break;
              case 'archive':
                alert('Archiving item...');
                break;
              case 'delete':
                if (confirm('Are you sure you want to delete this item?')) {
                  alert('Item deleted!');
                }
                break;
            }
            
            // Reset selection
            setActionValue('');
          }}
        />
      </section>

      {/* Example 5: Dropdown with Disabled Options */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>5. Dropdown with Disabled Options</h2>
        <p>Some options can be disabled based on conditions.</p>
        
        <Dropdown
          label="Export as"
          placeholder="Select format"
          options={[
            { value: 'pdf', label: 'PDF', icon: '📄' },
            { value: 'csv', label: 'CSV', icon: '📊' },
            { value: 'json', label: 'JSON', icon: '📋' },
            { value: 'xml', label: 'XML', icon: '📝', disabled: true },
            { value: 'divider', label: '', divider: true },
            { value: 'docx', label: 'Word Document', icon: '📘', disabled: true },
            { value: 'xlsx', label: 'Excel Spreadsheet', icon: '📗', disabled: true },
          ]}
          onChange={(value, label) => {
            console.log(`Exporting as ${label}...`);
          }}
        />
        
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          Note: Some formats are disabled. Upgrade to access all export options.
        </p>
      </section>

      {/* Example 6: Custom Styling */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>6. Custom Styling</h2>
        <p>Dropdowns can be styled with custom CSS.</p>
        
        <Dropdown
          label="Theme"
          className="custom-dropdown"
          style={{
            width: '300px',
            fontFamily: 'monospace',
          }}
          options={[
            { value: 'light', label: 'Light Theme', icon: '☀️' },
            { value: 'dark', label: 'Dark Theme', icon: '🌙' },
            { value: 'auto', label: 'Auto (System)', icon: '🔄' },
          ]}
        />
      </section>

      {/* Example 7: Multiple Dropdowns */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>7. Multiple Dropdowns</h2>
        <p>Multiple dropdowns working together.</p>
        
        <FilterPanel />
      </section>
    </div>
  );
}

function FilterPanel() {
  const [category, setCategory] = useState('');
  const [status, setStatus] = useState('');
  const [priority, setPriority] = useState('');

  return (
    <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '8px' }}>
      <Dropdown
        label="Category"
        placeholder="All categories"
        options={[
          { value: 'work', label: 'Work', icon: '💼' },
          { value: 'personal', label: 'Personal', icon: '👤' },
          { value: 'shopping', label: 'Shopping', icon: '🛒' },
          { value: 'health', label: 'Health', icon: '🏥' },
        ]}
        value={category}
        onChange={(value) => setCategory(value)}
      />
      
      <Dropdown
        label="Status"
        placeholder="All statuses"
        options={[
          { value: 'todo', label: 'To Do', icon: '📝' },
          { value: 'in-progress', label: 'In Progress', icon: '⏳' },
          { value: 'done', label: 'Done', icon: '✅' },
        ]}
        value={status}
        onChange={(value) => setStatus(value)}
      />
      
      <Dropdown
        label="Priority"
        placeholder="All priorities"
        options={[
          { value: 'high', label: 'High', icon: '🔴' },
          { value: 'medium', label: 'Medium', icon: '🟡' },
          { value: 'low', label: 'Low', icon: '🟢' },
        ]}
        value={priority}
        onChange={(value) => setPriority(value)}
      />
      
      <div style={{ marginTop: 'auto' }}>
        <button
          onClick={() => {
            setCategory('');
            setStatus('');
            setPriority('');
          }}
          style={{ padding: '0.5rem 1rem', cursor: 'pointer' }}
        >
          Clear Filters
        </button>
      </div>
    </div>
  );
}

export default DropdownExamples;

