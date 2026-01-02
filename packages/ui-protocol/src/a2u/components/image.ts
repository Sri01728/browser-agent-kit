/**
 * Image Component Renderer
 *
 * Renders an image with alt text.
 *
 * @module a2u/components/image
 */

import type { A2UComponent, RenderContext, ImageProps } from '../types';
import { imagePropsSchema } from '../types';

/**
 * CSS class names for image component styling.
 */
const CSS_CLASSES = {
  image: 'a2u-image',
  imageContainer: 'a2u-image__container',
};

/**
 * Renders an image component.
 *
 * @param component - Image component definition
 * @param context - Render context
 * @returns HTMLElement for the image
 *
 * @example A2U JSON for an image
 * ```json
 * {
 *   "type": "image",
 *   "props": {
 *     "src": "https://example.com/flight.jpg",
 *     "alt": "Flight destination",
 *     "width": 400,
 *     "height": 300
 *   }
 * }
 * ```
 */
export function renderImage(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = imagePropsSchema.parse(component.props || { src: '', alt: '' }) as ImageProps;

  // Create container
  const container = document.createElement('figure');
  container.className = CSS_CLASSES.imageContainer;

  if (component.id) {
    container.id = component.id;
    container.setAttribute('data-component-id', component.id);
  }

  // Create image element
  const img = document.createElement('img');
  img.className = CSS_CLASSES.image;
  img.src = props.src;
  img.alt = props.alt;

  if (props.width) {
    img.width = props.width;
  }

  if (props.height) {
    img.height = props.height;
  }

  // Add loading="lazy" for performance
  img.loading = 'lazy';

  container.appendChild(img);

  // Handle actions (e.g., click to navigate)
  if (component.actions && component.actions.length > 0) {
    container.style.cursor = 'pointer';
    container.addEventListener('click', () => {
      for (const action of component.actions!) {
        context.onAction(action, component.id);
      }
    });
  }

  return container;
}

