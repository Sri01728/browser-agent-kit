/**
 * Dropdown Component Renderer
 *
 * Renders an accessible dropdown menu with keyboard navigation.
 *
 * @module a2u/components/dropdown
 */

import type { A2UComponent, RenderContext, DropdownProps, DropdownOption } from '../types';
import { dropdownPropsSchema } from '../types';

/**
 * CSS class names for dropdown component styling.
 */
const CSS_CLASSES = {
  dropdown: 'a2u-dropdown',
  button: 'a2u-dropdown__button',
  buttonOpen: 'a2u-dropdown__button--open',
  menu: 'a2u-dropdown__menu',
  menuOpen: 'a2u-dropdown__menu--open',
  menuItem: 'a2u-dropdown__menu-item',
  menuItemActive: 'a2u-dropdown__menu-item--active',
  menuItemDisabled: 'a2u-dropdown__menu-item--disabled',
  menuItemDivider: 'a2u-dropdown__menu-divider',
};

/**
 * Renders a dropdown component.
 *
 * @param component - Dropdown component definition
 * @param context - Render context
 * @returns HTMLElement for the dropdown
 *
 * @example A2U JSON for a dropdown
 * ```json
 * {
 *   "type": "dropdown",
 *   "props": {
 *     "label": "Actions",
 *     "options": [
 *       { "value": "edit", "label": "Edit", "icon": "✏️" },
 *       { "value": "delete", "label": "Delete", "icon": "🗑️", "disabled": false }
 *     ],
 *     "placeholder": "Select an action"
 *   },
 *   "actions": [
 *     { "type": "call_tool", "params": { "tool": "handle_action" } }
 *   ]
 * }
 * ```
 */
export function renderDropdown(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = dropdownPropsSchema.parse(component.props || { options: [] }) as DropdownProps;

  // Create dropdown container
  const container = document.createElement('div');
  container.className = CSS_CLASSES.dropdown;

  if (component.id) {
    container.id = component.id;
    container.setAttribute('data-component-id', component.id);
  }

  // Apply custom className
  if (props.className) {
    container.classList.add(props.className);
  }

  // Apply custom styles
  if (props.style) {
    Object.assign(container.style, props.style);
  }

  // Create dropdown button
  const button = document.createElement('button');
  button.className = CSS_CLASSES.button;
  button.type = 'button';
  button.setAttribute('aria-haspopup', 'true');
  button.setAttribute('aria-expanded', 'false');
  button.setAttribute('id', `${component.id}-button`);

  // Set button label
  const selectedOption = props.options.find(opt => opt.value === props.value);
  if (selectedOption) {
    button.textContent = selectedOption.icon 
      ? `${selectedOption.icon} ${selectedOption.label}`
      : selectedOption.label;
  } else {
    button.textContent = props.label || props.placeholder || 'Select';
  }

  // Create dropdown menu
  const menu = document.createElement('div');
  menu.className = CSS_CLASSES.menu;
  menu.setAttribute('role', 'menu');
  menu.setAttribute('aria-labelledby', `${component.id}-button`);
  menu.style.display = 'none';

  let activeIndex = -1;
  const menuItems: HTMLButtonElement[] = [];

  // Create menu items
  props.options.forEach((option: DropdownOption, index: number) => {
    if (option.divider) {
      const divider = document.createElement('div');
      divider.className = CSS_CLASSES.menuItemDivider;
      divider.setAttribute('role', 'separator');
      menu.appendChild(divider);
      return;
    }

    const menuItem = document.createElement('button');
    menuItem.className = CSS_CLASSES.menuItem;
    menuItem.setAttribute('role', 'menuitem');
    menuItem.type = 'button';

    // Set menu item content
    if (option.icon) {
      menuItem.textContent = `${option.icon} ${option.label}`;
    } else {
      menuItem.textContent = option.label;
    }

    // Handle active state
    if (option.value === props.value) {
      menuItem.classList.add(CSS_CLASSES.menuItemActive);
      menuItem.setAttribute('aria-current', 'true');
    }

    // Handle disabled state
    if (option.disabled) {
      menuItem.classList.add(CSS_CLASSES.menuItemDisabled);
      menuItem.disabled = true;
      menuItem.setAttribute('aria-disabled', 'true');
    }

    // Menu item click handler
    menuItem.addEventListener('click', (e) => {
      e.stopPropagation();
      if (!option.disabled) {
        // Update button label
        button.textContent = option.icon 
          ? `${option.icon} ${option.label}`
          : option.label;

        // Close menu
        closeMenu();

        // Emit selection action
        if (context.onAction && component.id) {
          context.onAction(
            { type: 'dropdown_select', params: { value: option.value, label: option.label } },
            component.id
          );
        }
      }
    });

    menuItems.push(menuItem);
    menu.appendChild(menuItem);
  });

  // Toggle dropdown on button click
  button.addEventListener('click', (e) => {
    e.stopPropagation();
    const isOpen = menu.style.display !== 'none';
    if (isOpen) {
      closeMenu();
    } else {
      openMenu();
    }
  });

  // Close dropdown when clicking outside
  document.addEventListener('click', (e) => {
    if (!container.contains(e.target as Node)) {
      closeMenu();
    }
  });

  // Keyboard navigation
  container.addEventListener('keydown', (e) => {
    const isOpen = menu.style.display !== 'none';

    switch (e.key) {
      case 'Enter':
      case ' ':
        if (document.activeElement === button) {
          e.preventDefault();
          if (isOpen) {
            closeMenu();
          } else {
            openMenu();
          }
        } else if (isOpen && activeIndex >= 0) {
          e.preventDefault();
          menuItems[activeIndex].click();
        }
        break;

      case 'Escape':
        if (isOpen) {
          e.preventDefault();
          closeMenu();
          button.focus();
        }
        break;

      case 'ArrowDown':
        e.preventDefault();
        if (!isOpen) {
          openMenu();
        } else {
          // Move to next non-disabled item
          let nextIndex = activeIndex + 1;
          while (nextIndex < menuItems.length && menuItems[nextIndex].disabled) {
            nextIndex++;
          }
          if (nextIndex < menuItems.length) {
            setActiveItem(nextIndex);
          }
        }
        break;

      case 'ArrowUp':
        e.preventDefault();
        if (isOpen) {
          // Move to previous non-disabled item
          let prevIndex = activeIndex - 1;
          while (prevIndex >= 0 && menuItems[prevIndex].disabled) {
            prevIndex--;
          }
          if (prevIndex >= 0) {
            setActiveItem(prevIndex);
          }
        }
        break;

      case 'Home':
        if (isOpen) {
          e.preventDefault();
          // Move to first non-disabled item
          let firstIndex = 0;
          while (firstIndex < menuItems.length && menuItems[firstIndex].disabled) {
            firstIndex++;
          }
          if (firstIndex < menuItems.length) {
            setActiveItem(firstIndex);
          }
        }
        break;

      case 'End':
        if (isOpen) {
          e.preventDefault();
          // Move to last non-disabled item
          let lastIndex = menuItems.length - 1;
          while (lastIndex >= 0 && menuItems[lastIndex].disabled) {
            lastIndex--;
          }
          if (lastIndex >= 0) {
            setActiveItem(lastIndex);
          }
        }
        break;

      case 'Tab':
        if (isOpen) {
          closeMenu();
        }
        break;
    }
  });

  function openMenu() {
    menu.style.display = '';
    button.classList.add(CSS_CLASSES.buttonOpen);
    menu.classList.add(CSS_CLASSES.menuOpen);
    button.setAttribute('aria-expanded', 'true');

    // Focus first non-disabled item
    const firstEnabledIndex = menuItems.findIndex(item => !item.disabled);
    if (firstEnabledIndex >= 0) {
      setActiveItem(firstEnabledIndex);
    }
  }

  function closeMenu() {
    menu.style.display = 'none';
    button.classList.remove(CSS_CLASSES.buttonOpen);
    menu.classList.remove(CSS_CLASSES.menuOpen);
    button.setAttribute('aria-expanded', 'false');
    activeIndex = -1;
  }

  function setActiveItem(index: number) {
    // Remove focus from all items
    menuItems.forEach(item => {
      item.setAttribute('tabindex', '-1');
    });

    // Set focus on active item
    if (index >= 0 && index < menuItems.length) {
      activeIndex = index;
      menuItems[index].setAttribute('tabindex', '0');
      menuItems[index].focus();
    }
  }

  container.appendChild(button);
  container.appendChild(menu);

  return container;
}

