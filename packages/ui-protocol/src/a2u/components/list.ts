/**
 * List Component Renderer
 *
 * Renders a list of items (ordered or unordered).
 *
 * @module a2u/components/list
 */

import type { A2UComponent, RenderContext, ListProps } from '../types';
import { listPropsSchema } from '../types';

/**
 * CSS class names for list component styling.
 */
const CSS_CLASSES = {
  list: 'a2u-list',
  listOrdered: 'a2u-list--ordered',
  listSeparator: 'a2u-list--separator',
  item: 'a2u-list__item',
};

/**
 * Renders a list component.
 *
 * @param component - List component definition
 * @param context - Render context
 * @returns HTMLElement for the list
 *
 * @example A2U JSON for a list
 * ```json
 * {
 *   "type": "list",
 *   "props": { "ordered": false, "separator": true },
 *   "children": [
 *     { "type": "text", "props": { "content": "Item 1" } },
 *     { "type": "text", "props": { "content": "Item 2" } }
 *   ]
 * }
 * ```
 */
export function renderList(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = listPropsSchema.parse(component.props || {}) as ListProps;

  // Create list element (ul or ol)
  const list = document.createElement(props.ordered ? 'ol' : 'ul');
  list.className = CSS_CLASSES.list;

  if (component.id) {
    list.id = component.id;
    list.setAttribute('data-component-id', component.id);
  }

  if (props.ordered) {
    list.classList.add(CSS_CLASSES.listOrdered);
  }

  if (props.separator) {
    list.classList.add(CSS_CLASSES.listSeparator);
  }

  // Render children as list items
  if (component.children) {
    for (const child of component.children) {
      const item = document.createElement('li');
      item.className = CSS_CLASSES.item;
      item.appendChild(context.renderChild(child));
      list.appendChild(item);
    }
  }

  return list;
}

