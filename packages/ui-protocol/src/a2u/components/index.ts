/**
 * Built-in A2U Component Renderers
 *
 * This module exports all built-in component renderers and provides
 * utilities for registering custom components.
 *
 * @module a2u/components
 */

import type { ComponentRenderer, ComponentRegistryEntry } from '../types';
import { renderCard } from './card';
import { renderList } from './list';
import { renderButton } from './button';
import { renderText } from './text';
import { renderImage } from './image';
import { renderForm } from './form';
import { cardPropsSchema, listPropsSchema, buttonPropsSchema, textPropsSchema, imagePropsSchema, formPropsSchema } from '../types';

export { renderCard } from './card';
export { renderList } from './list';
export { renderButton } from './button';
export { renderText } from './text';
export { renderImage } from './image';
export { renderForm } from './form';

/**
 * Built-in component registry entries.
 */
export const builtInComponents: ComponentRegistryEntry[] = [
  { type: 'card', renderer: renderCard, propsSchema: cardPropsSchema },
  { type: 'list', renderer: renderList, propsSchema: listPropsSchema },
  { type: 'button', renderer: renderButton, propsSchema: buttonPropsSchema },
  { type: 'text', renderer: renderText, propsSchema: textPropsSchema },
  { type: 'image', renderer: renderImage, propsSchema: imagePropsSchema },
  { type: 'form', renderer: renderForm, propsSchema: formPropsSchema },
];

/**
 * Get built-in component types as a set.
 */
export const builtInComponentTypes = new Set(
  builtInComponents.map((c) => c.type)
);

/**
 * Get a built-in renderer by type.
 */
export function getBuiltInRenderer(type: string): ComponentRenderer | undefined {
  const entry = builtInComponents.find((c) => c.type === type);
  return entry?.renderer;
}

