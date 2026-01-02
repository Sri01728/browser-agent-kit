/**
 * Button Component Renderer
 *
 * Renders an interactive button with actions.
 *
 * @module a2u/components/button
 */

import type { A2UComponent, RenderContext, ButtonProps } from '../types';
import { buttonPropsSchema } from '../types';

/**
 * CSS class names for button component styling.
 */
const CSS_CLASSES = {
  button: 'a2u-button',
  buttonPrimary: 'a2u-button--primary',
  buttonSecondary: 'a2u-button--secondary',
  buttonDanger: 'a2u-button--danger',
  buttonDisabled: 'a2u-button--disabled',
};

/**
 * Renders a button component.
 *
 * @param component - Button component definition
 * @param context - Render context
 * @returns HTMLElement for the button
 *
 * @example A2U JSON for a button
 * ```json
 * {
 *   "type": "button",
 *   "props": {
 *     "label": "Book Flight",
 *     "variant": "primary"
 *   },
 *   "actions": [
 *     { "type": "call_tool", "params": { "tool": "book", "args": { "id": "123" } } }
 *   ]
 * }
 * ```
 */
export function renderButton(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = buttonPropsSchema.parse(component.props || { label: 'Button' }) as ButtonProps;

  const button = document.createElement('button');
  button.className = CSS_CLASSES.button;
  button.textContent = props.label;

  if (component.id) {
    button.id = component.id;
    button.setAttribute('data-component-id', component.id);
  }

  // Apply variant styling
  switch (props.variant) {
    case 'primary':
      button.classList.add(CSS_CLASSES.buttonPrimary);
      break;
    case 'secondary':
      button.classList.add(CSS_CLASSES.buttonSecondary);
      break;
    case 'danger':
      button.classList.add(CSS_CLASSES.buttonDanger);
      break;
  }

  // Handle disabled state
  if (props.disabled) {
    button.disabled = true;
    button.classList.add(CSS_CLASSES.buttonDisabled);
  }

  // Attach action handlers
  if (component.actions && component.actions.length > 0) {
    button.addEventListener('click', (event) => {
      event.preventDefault();
      // Execute all actions
      for (const action of component.actions!) {
        context.onAction(action, component.id);
      }
    });
  }

  return button;
}

