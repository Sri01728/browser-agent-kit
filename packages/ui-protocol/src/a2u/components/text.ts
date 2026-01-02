/**
 * Text Component Renderer
 *
 * Renders text content with optional formatting.
 *
 * @module a2u/components/text
 */

import DOMPurify from 'dompurify';
import type { A2UComponent, RenderContext, TextProps } from '../types';
import { textPropsSchema } from '../types';

/**
 * CSS class names for text component styling.
 */
const CSS_CLASSES = {
  text: 'a2u-text',
  textBody: 'a2u-text--body',
  textHeading: 'a2u-text--heading',
  textCaption: 'a2u-text--caption',
  textCode: 'a2u-text--code',
};

/**
 * Renders a text component.
 *
 * @param component - Text component definition
 * @param context - Render context
 * @returns HTMLElement for the text
 *
 * @example A2U JSON for text
 * ```json
 * {
 *   "type": "text",
 *   "props": {
 *     "content": "Hello, world!",
 *     "variant": "heading"
 *   }
 * }
 * ```
 */
export function renderText(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = textPropsSchema.parse(component.props || { content: '' }) as TextProps;

  // Choose element based on variant
  let element: HTMLElement;
  switch (props.variant) {
    case 'heading':
      element = document.createElement('h2');
      element.classList.add(CSS_CLASSES.textHeading);
      break;
    case 'caption':
      element = document.createElement('small');
      element.classList.add(CSS_CLASSES.textCaption);
      break;
    case 'code':
      element = document.createElement('code');
      element.classList.add(CSS_CLASSES.textCode);
      break;
    case 'body':
    default:
      element = document.createElement('p');
      element.classList.add(CSS_CLASSES.textBody);
      break;
  }

  element.classList.add(CSS_CLASSES.text);

  if (component.id) {
    element.id = component.id;
    element.setAttribute('data-component-id', component.id);
  }

  // Set content (sanitize if HTML is allowed)
  if (props.allowHtml && context.config.sanitizeHtml) {
    element.innerHTML = DOMPurify.sanitize(props.content);
  } else if (props.allowHtml && !context.config.sanitizeHtml) {
    element.innerHTML = props.content;
  } else {
    element.textContent = props.content;
  }

  return element;
}

