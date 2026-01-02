/**
 * Card Component Renderer
 *
 * Renders a card component with title, subtitle, content, and actions.
 *
 * @module a2u/components/card
 */

import type { A2UComponent, RenderContext, CardProps } from '../types';
import { cardPropsSchema } from '../types';

/**
 * CSS class names for card component styling.
 */
const CSS_CLASSES = {
  card: 'a2u-card',
  cardOutlined: 'a2u-card--outlined',
  cardElevated: 'a2u-card--elevated',
  header: 'a2u-card__header',
  title: 'a2u-card__title',
  subtitle: 'a2u-card__subtitle',
  content: 'a2u-card__content',
  actions: 'a2u-card__actions',
};

/**
 * Renders a card component.
 *
 * @param component - Card component definition
 * @param context - Render context
 * @returns HTMLElement for the card
 *
 * @example A2U JSON for a card
 * ```json
 * {
 *   "type": "card",
 *   "props": {
 *     "title": "Flight to Paris",
 *     "subtitle": "Departure: 10:30 AM",
 *     "variant": "elevated"
 *   },
 *   "children": [
 *     { "type": "text", "props": { "content": "Price: $450" } }
 *   ],
 *   "actions": [
 *     { "type": "call_tool", "params": { "tool": "book", "args": { "id": "123" } } }
 *   ]
 * }
 * ```
 */
export function renderCard(component: A2UComponent, context: RenderContext): HTMLElement {
  const props = cardPropsSchema.parse(component.props || {}) as CardProps;

  // Create card container
  const card = document.createElement('div');
  card.className = CSS_CLASSES.card;

  if (component.id) {
    card.id = component.id;
    card.setAttribute('data-component-id', component.id);
  }

  // Apply variant styling
  if (props.variant === 'outlined') {
    card.classList.add(CSS_CLASSES.cardOutlined);
  } else if (props.variant === 'elevated') {
    card.classList.add(CSS_CLASSES.cardElevated);
  }

  // Add header if title or subtitle exists
  if (props.title || props.subtitle) {
    const header = document.createElement('div');
    header.className = CSS_CLASSES.header;

    if (props.title) {
      const title = document.createElement('h3');
      title.className = CSS_CLASSES.title;
      title.textContent = props.title;
      header.appendChild(title);
    }

    if (props.subtitle) {
      const subtitle = document.createElement('p');
      subtitle.className = CSS_CLASSES.subtitle;
      subtitle.textContent = props.subtitle;
      header.appendChild(subtitle);
    }

    card.appendChild(header);
  }

  // Render children as content
  if (component.children && component.children.length > 0) {
    const content = document.createElement('div');
    content.className = CSS_CLASSES.content;

    for (const child of component.children) {
      content.appendChild(context.renderChild(child));
    }

    card.appendChild(content);
  }

  // Render actions as buttons
  if (component.actions && component.actions.length > 0) {
    const actionsContainer = document.createElement('div');
    actionsContainer.className = CSS_CLASSES.actions;

    for (const action of component.actions) {
      const button = document.createElement('button');
      button.className = 'a2u-button';
      button.textContent = (action.params?.label as string) || action.type;
      button.addEventListener('click', () => {
        context.onAction(action, component.id);
      });
      actionsContainer.appendChild(button);
    }

    card.appendChild(actionsContainer);
  }

  return card;
}

