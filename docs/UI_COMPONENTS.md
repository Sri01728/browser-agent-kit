# UI Components Guide

This guide covers the accessible UI components available in the Web Agent Framework, including both A2U protocol components and React wrappers.

---

## Table of Contents

1. [Overview](#overview)
2. [Modal Component](#modal-component)
3. [Tabs Component](#tabs-component)
4. [Dropdown Component](#dropdown-component)
5. [Accessibility Features](#accessibility-features)
6. [Usage Patterns](#usage-patterns)
7. [Styling](#styling)
8. [Best Practices](#best-practices)

---

## Overview

The Web Agent Framework provides three new accessible UI components:

- **Modal**: Accessible dialog for displaying content in an overlay
- **Tabs**: Tab interface for organizing content into multiple panels
- **Dropdown**: Menu for selecting from a list of options

All components are:
- ✅ **WCAG 2.1 AA compliant**
- ✅ **Fully keyboard accessible**
- ✅ **Screen reader friendly**
- ✅ **Available as both A2U protocol and React components**

---

## Modal Component

### Overview

The Modal component displays content in an overlay dialog with focus management and keyboard navigation.

### Features

- Focus trap when open
- Escape key to close
- Configurable sizes (small, medium, large, fullscreen)
- Custom actions in footer
- Overlay click to close (configurable)
- Accessible (ARIA compliant)

### React Usage

```tsx
import { Modal } from '@web-agent/react';
import { useState } from 'react';

function MyComponent() {
  const [isOpen, setIsOpen] = useState(false);
  
  return (
    <>
      <button onClick={() => setIsOpen(true)}>
        Open Modal
      </button>
      
      <Modal
        open={isOpen}
        title="Confirm Action"
        size="medium"
        onClose={() => setIsOpen(false)}
        actions={[
          {
            label: 'Cancel',
            onClick: () => setIsOpen(false),
            variant: 'secondary',
          },
          {
            label: 'Confirm',
            onClick: () => {
              console.log('Confirmed!');
              setIsOpen(false);
            },
            variant: 'primary',
          },
        ]}
      >
        <p>Are you sure you want to proceed?</p>
      </Modal>
    </>
  );
}
```

### A2U Protocol Usage

```json
{
  "type": "ui",
  "version": "1.0",
  "component": {
    "type": "modal",
    "id": "confirm-modal",
    "props": {
      "title": "Confirm Action",
      "open": true,
      "size": "medium",
      "closeOnOverlayClick": true,
      "closeOnEscape": true
    },
    "children": [
      {
        "type": "text",
        "props": {
          "content": "Are you sure you want to proceed?"
        }
      }
    ],
    "actions": [
      {
        "type": "modal_close",
        "params": { "label": "Cancel" }
      },
      {
        "type": "call_tool",
        "params": { "label": "Confirm", "toolName": "confirmAction" }
      }
    ]
  }
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `open` | `boolean` | `false` | Whether the modal is open |
| `title` | `string` | - | Modal title |
| `size` | `'small' \| 'medium' \| 'large' \| 'fullscreen'` | `'medium'` | Modal size |
| `closeOnOverlayClick` | `boolean` | `true` | Close when clicking overlay |
| `closeOnEscape` | `boolean` | `true` | Close when pressing Escape |
| `hideCloseButton` | `boolean` | `false` | Hide the close button |
| `className` | `string` | - | Custom CSS class |
| `style` | `React.CSSProperties` | - | Custom inline styles |
| `children` | `React.ReactNode` | - | Modal content |
| `actions` | `Action[]` | - | Actions to display in footer |
| `onClose` | `() => void` | - | Callback when modal is closed |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Escape` | Close modal (if `closeOnEscape` is true) |
| `Tab` | Navigate forward within modal (trapped) |
| `Shift+Tab` | Navigate backward within modal (trapped) |

---

## Tabs Component

### Overview

The Tabs component provides an accessible tab interface for organizing content into multiple panels.

### Features

- ARIA tablist with proper roles
- Full keyboard navigation
- Horizontal and vertical orientations
- Disabled tab support
- Icon support
- Roving tabindex pattern

### React Usage

```tsx
import { Tabs } from '@web-agent/react';
import { useState } from 'react';

function MyComponent() {
  const [activeTab, setActiveTab] = useState('overview');
  
  return (
    <Tabs
      tabs={[
        { id: 'overview', label: 'Overview', icon: '📋' },
        { id: 'details', label: 'Details', icon: '📝' },
        { id: 'settings', label: 'Settings', icon: '⚙️' },
      ]}
      activeTab={activeTab}
      onTabChange={(tabId) => setActiveTab(tabId)}
      orientation="horizontal"
    >
      {activeTab === 'overview' && <div>Overview content</div>}
      {activeTab === 'details' && <div>Details content</div>}
      {activeTab === 'settings' && <div>Settings content</div>}
    </Tabs>
  );
}
```

### A2U Protocol Usage

```json
{
  "type": "ui",
  "version": "1.0",
  "component": {
    "type": "tabs",
    "id": "main-tabs",
    "props": {
      "tabs": [
        { "id": "overview", "label": "Overview", "icon": "📋" },
        { "id": "details", "label": "Details", "icon": "📝" },
        { "id": "settings", "label": "Settings", "icon": "⚙️", "disabled": false }
      ],
      "activeTab": "overview",
      "orientation": "horizontal"
    },
    "children": [
      {
        "type": "text",
        "props": { "content": "Overview content" }
      },
      {
        "type": "text",
        "props": { "content": "Details content" }
      },
      {
        "type": "text",
        "props": { "content": "Settings content" }
      }
    ]
  }
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `tabs` | `TabItem[]` | - | Array of tabs |
| `activeTab` | `string` | - | Active tab ID |
| `orientation` | `'horizontal' \| 'vertical'` | `'horizontal'` | Tab orientation |
| `className` | `string` | - | Custom CSS class |
| `style` | `React.CSSProperties` | - | Custom inline styles |
| `children` | `React.ReactNode` | - | Tab panel content |
| `onTabChange` | `(tabId: string) => void` | - | Callback when tab changes |

### TabItem

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `id` | `string` | Yes | Unique tab identifier |
| `label` | `string` | Yes | Tab label |
| `icon` | `string` | No | Optional icon |
| `disabled` | `boolean` | No | Whether tab is disabled |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Arrow Left/Right` | Previous/Next tab (horizontal) |
| `Arrow Up/Down` | Previous/Next tab (vertical) |
| `Home` | First tab |
| `End` | Last tab |
| `Tab` | Move focus out of tablist |

---

## Dropdown Component

### Overview

The Dropdown component provides an accessible menu for selecting from a list of options.

### Features

- ARIA menu with proper roles
- Full keyboard navigation
- Disabled options support
- Divider support
- Icon support
- Auto-close on selection
- Selected state management

### React Usage

```tsx
import { Dropdown } from '@web-agent/react';
import { useState } from 'react';

function MyComponent() {
  const [sortBy, setSortBy] = useState('price-low');
  
  return (
    <Dropdown
      label="Sort by"
      placeholder="Select an option"
      options={[
        { value: 'price-low', label: 'Price: Low to High', icon: '💰' },
        { value: 'price-high', label: 'Price: High to Low', icon: '💎' },
        { value: 'divider', label: '', divider: true },
        { value: 'duration', label: 'Duration', icon: '⏱️' },
        { value: 'rating', label: 'Rating', icon: '⭐' },
      ]}
      value={sortBy}
      onChange={(value, label) => {
        console.log(`Selected: ${label} (${value})`);
        setSortBy(value);
      }}
    />
  );
}
```

### A2U Protocol Usage

```json
{
  "type": "ui",
  "version": "1.0",
  "component": {
    "type": "dropdown",
    "id": "sort-dropdown",
    "props": {
      "label": "Sort by",
      "placeholder": "Select an option",
      "options": [
        { "value": "price-low", "label": "Price: Low to High", "icon": "💰" },
        { "value": "price-high", "label": "Price: High to Low", "icon": "💎" },
        { "value": "divider", "label": "", "divider": true },
        { "value": "duration", "label": "Duration", "icon": "⏱️" },
        { "value": "rating", "label": "Rating", "icon": "⭐" }
      ],
      "value": "price-low"
    }
  }
}
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | `string` | - | Dropdown label |
| `placeholder` | `string` | - | Placeholder text |
| `options` | `DropdownOption[]` | - | Array of options |
| `value` | `string` | - | Selected value |
| `className` | `string` | - | Custom CSS class |
| `style` | `React.CSSProperties` | - | Custom inline styles |
| `onChange` | `(value: string, label: string) => void` | - | Callback when selection changes |

### DropdownOption

| Property | Type | Required | Description |
|----------|------|----------|-------------|
| `value` | `string` | Yes | Option value |
| `label` | `string` | Yes | Option label |
| `icon` | `string` | No | Optional icon |
| `disabled` | `boolean` | No | Whether option is disabled |
| `divider` | `boolean` | No | Whether this is a divider |

### Keyboard Navigation

| Key | Action |
|-----|--------|
| `Enter` / `Space` | Open/close dropdown or select option |
| `Arrow Down` | Next option |
| `Arrow Up` | Previous option |
| `Home` | First option |
| `End` | Last option |
| `Escape` | Close dropdown |

---

## Accessibility Features

All components follow WAI-ARIA Authoring Practices and are WCAG 2.1 Level AA compliant.

### Modal Accessibility

- ✅ `role="dialog"` and `aria-modal="true"`
- ✅ Focus trap (Tab/Shift+Tab constrained)
- ✅ Escape key to close
- ✅ `aria-labelledby` linking to title
- ✅ Focus returns to trigger element on close

### Tabs Accessibility

- ✅ `role="tablist"`, `role="tab"`, `role="tabpanel"`
- ✅ `aria-selected` state management
- ✅ `aria-controls` linking tabs to panels
- ✅ Roving tabindex for keyboard navigation
- ✅ Arrow keys for tab switching
- ✅ Home/End for first/last tab

### Dropdown Accessibility

- ✅ `role="menu"` and `role="menuitem"`
- ✅ `aria-haspopup` and `aria-expanded`
- ✅ Arrow keys for option navigation
- ✅ Escape to close
- ✅ Auto-close on selection
- ✅ Disabled state management

---

## Usage Patterns

### Confirmation Dialogs

```tsx
function ConfirmDialog({ onConfirm, onCancel }) {
  return (
    <Modal
      open={true}
      title="Confirm Action"
      size="small"
      actions={[
        { label: 'Cancel', onClick: onCancel, variant: 'secondary' },
        { label: 'Confirm', onClick: onConfirm, variant: 'danger' },
      ]}
    >
      <p>This action cannot be undone. Are you sure?</p>
    </Modal>
  );
}
```

### Settings Tabs

```tsx
function SettingsPanel() {
  const [tab, setTab] = useState('general');
  
  return (
    <Tabs
      tabs={[
        { id: 'general', label: 'General' },
        { id: 'security', label: 'Security' },
        { id: 'notifications', label: 'Notifications' },
      ]}
      activeTab={tab}
      onTabChange={setTab}
    >
      {/* Tab content */}
    </Tabs>
  );
}
```

### Action Menus

```tsx
function ActionMenu() {
  return (
    <Dropdown
      label="Actions"
      options={[
        { value: 'edit', label: 'Edit', icon: '✏️' },
        { value: 'duplicate', label: 'Duplicate', icon: '📋' },
        { value: 'divider', label: '', divider: true },
        { value: 'delete', label: 'Delete', icon: '🗑️' },
      ]}
      onChange={(value) => handleAction(value)}
    />
  );
}
```

---

## Styling

### CSS Classes

All components use BEM-style CSS classes:

**Modal:**
- `.a2u-modal-overlay` - Overlay container
- `.a2u-modal` - Modal container
- `.a2u-modal__header` - Header section
- `.a2u-modal__title` - Title text
- `.a2u-modal__close-button` - Close button
- `.a2u-modal__content` - Content section
- `.a2u-modal__footer` - Footer section
- `.a2u-modal--sm`, `.a2u-modal--md`, `.a2u-modal--lg`, `.a2u-modal--fullscreen` - Size modifiers

**Tabs:**
- `.a2u-tabs` - Tabs container
- `.a2u-tabs__list` - Tab list
- `.a2u-tabs__tab` - Individual tab
- `.a2u-tabs__tab--active` - Active tab
- `.a2u-tabs__tab--disabled` - Disabled tab
- `.a2u-tabs__panel` - Tab panel
- `.a2u-tabs--vertical` - Vertical orientation

**Dropdown:**
- `.a2u-dropdown` - Dropdown container
- `.a2u-dropdown__button` - Trigger button
- `.a2u-dropdown__menu` - Menu container
- `.a2u-dropdown__menu-item` - Menu item
- `.a2u-dropdown__menu-item--active` - Selected item
- `.a2u-dropdown__menu-item--disabled` - Disabled item
- `.a2u-dropdown__divider` - Divider

### Custom Styling

You can apply custom styles in two ways:

**1. CSS Classes:**

```tsx
<Modal className="my-custom-modal" />
```

```css
.my-custom-modal .a2u-modal {
  border-radius: 12px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
}
```

**2. Inline Styles:**

```tsx
<Modal
  style={{
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    backdropFilter: 'blur(4px)',
  }}
/>
```

---

## Best Practices

### Modal Best Practices

1. **Always provide a title** for screen readers
2. **Use appropriate sizes** - don't make modals too large
3. **Limit actions** - 2-3 actions maximum in footer
4. **Focus management** - ensure focus returns to trigger element
5. **Avoid nested modals** - use a single modal at a time

### Tabs Best Practices

1. **Keep tab labels short** - 1-2 words ideal
2. **Use icons sparingly** - only when they add clarity
3. **Don't use too many tabs** - 5-7 tabs maximum
4. **Disable appropriately** - use disabled state for unavailable tabs
5. **Persist active tab** - remember user's selection

### Dropdown Best Practices

1. **Use clear labels** - describe what the dropdown controls
2. **Group related options** - use dividers to separate groups
3. **Limit options** - consider search for >10 options
4. **Show selected state** - make it clear what's selected
5. **Provide placeholders** - help users understand the purpose

---

## Examples

See the `examples/` directory for complete working examples:

- `examples/modal-demo/` - Modal component examples
- `examples/tabs-demo/` - Tabs component examples
- `examples/dropdown-demo/` - Dropdown component examples
- `examples/combined-ui/` - All components together

---

## Further Reading

- [A2U Protocol Specification](./A2U_PROTOCOL.md)
- [Accessibility Guide](./ACCESSIBILITY.md)
- [WAI-ARIA Authoring Practices](https://www.w3.org/WAI/ARIA/apg/)
- [WCAG 2.1 Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

