/**
 * Form Component Renderer
 *
 * Renders a form with input fields and submit action.
 *
 * @module a2u/components/form
 */

import type { A2UComponent, RenderContext, FormProps, FormField } from '../types';
import { formPropsSchema } from '../types';

/**
 * CSS class names for form component styling.
 */
const CSS_CLASSES = {
  form: 'a2u-form',
  field: 'a2u-form__field',
  label: 'a2u-form__label',
  input: 'a2u-form__input',
  select: 'a2u-form__select',
  textarea: 'a2u-form__textarea',
  required: 'a2u-form__required',
  submitButton: 'a2u-form__submit',
};

/**
 * Renders a single form field.
 */
function renderField(field: FormField): HTMLElement {
  const container = document.createElement('div');
  container.className = CSS_CLASSES.field;

  // Label
  const label = document.createElement('label');
  label.className = CSS_CLASSES.label;
  label.htmlFor = field.name;
  label.textContent = field.label;

  if (field.required) {
    const asterisk = document.createElement('span');
    asterisk.className = CSS_CLASSES.required;
    asterisk.textContent = ' *';
    label.appendChild(asterisk);
  }

  container.appendChild(label);

  // Input element based on type
  let input: HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement;

  switch (field.type) {
    case 'select':
      const select = document.createElement('select');
      select.className = CSS_CLASSES.select;
      select.name = field.name;
      select.id = field.name;
      select.required = field.required || false;

      // Add placeholder option
      const placeholder = document.createElement('option');
      placeholder.value = '';
      placeholder.textContent = `Select ${field.label}`;
      placeholder.disabled = true;
      placeholder.selected = true;
      select.appendChild(placeholder);

      // Add options
      if (field.options) {
        for (const option of field.options) {
          const opt = document.createElement('option');
          opt.value = option;
          opt.textContent = option;
          select.appendChild(opt);
        }
      }
      input = select;
      break;

    case 'textarea':
      const textarea = document.createElement('textarea');
      textarea.className = CSS_CLASSES.textarea;
      textarea.name = field.name;
      textarea.id = field.name;
      textarea.required = field.required || false;
      textarea.rows = 4;
      input = textarea;
      break;

    case 'text':
    case 'email':
    case 'number':
    default:
      const textInput = document.createElement('input');
      textInput.className = CSS_CLASSES.input;
      textInput.type = field.type;
      textInput.name = field.name;
      textInput.id = field.name;
      textInput.required = field.required || false;
      input = textInput;
      break;
  }

  container.appendChild(input);
  return container;
}

/**
 * Renders a form component.
 *
 * @param component - Form component definition
 * @param context - Render context
 * @returns HTMLElement for the form
 *
 * @example A2U JSON for a form
 * ```json
 * {
 *   "type": "form",
 *   "props": {
 *     "fields": [
 *       { "name": "email", "type": "email", "label": "Email", "required": true },
 *       { "name": "passengers", "type": "number", "label": "Passengers" },
 *       { "name": "class", "type": "select", "label": "Class", "options": ["Economy", "Business", "First"] }
 *     ],
 *     "submitLabel": "Book Flight"
 *   },
 *   "actions": [
 *     { "type": "submit" }
 *   ]
 * }
 * ```
 */
export function renderForm(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = formPropsSchema.parse(component.props || { fields: [] }) as FormProps;

  const form = document.createElement('form');
  form.className = CSS_CLASSES.form;

  if (component.id) {
    form.id = component.id;
    form.setAttribute('data-component-id', component.id);
  }

  // Render fields
  for (const field of props.fields) {
    form.appendChild(renderField(field));
  }

  // Render children (for custom content within form)
  if (component.children) {
    for (const child of component.children) {
      form.appendChild(context.renderChild(child));
    }
  }

  // Submit button
  const submitButton = document.createElement('button');
  submitButton.type = 'submit';
  submitButton.className = `a2u-button a2u-button--primary ${CSS_CLASSES.submitButton}`;
  submitButton.textContent = props.submitLabel || 'Submit';
  form.appendChild(submitButton);

  // Handle form submission
  form.addEventListener('submit', (event) => {
    event.preventDefault();

    // Collect form data
    const formData = new FormData(form);
    const data: Record<string, unknown> = {};

    for (const [key, value] of formData.entries()) {
      data[key] = value;
    }

    // Find submit action or use default
    const submitAction = component.actions?.find((a) => a.type === 'submit');
    if (submitAction) {
      // Merge form data with action params
      const mergedAction = {
        ...submitAction,
        params: { ...submitAction.params, formData: data },
      };
      context.onAction(mergedAction, component.id);
    } else {
      // Default submit action
      context.onAction({ type: 'submit', params: data }, component.id);
    }
  });

  return form;
}

