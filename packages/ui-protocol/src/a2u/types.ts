/**
 * A2U Protocol Type Definitions
 *
 * Zod schemas and TypeScript types for the A2U (Agent-to-UI) protocol.
 * These types define the structure of agent-generated UI components.
 *
 * @example
 * ```typescript
 * import { a2uResponseSchema, type A2UComponent } from '@web-agent/ui-protocol/a2u';
 *
 * // Validate an A2U response
 * const result = a2uResponseSchema.safeParse(agentOutput);
 * if (result.success) {
 *   const component: A2UComponent = result.data.ui;
 *   console.log('Valid A2U response:', component);
 * }
 * ```
 *
 * @module a2u/types
 */

import { z } from 'zod';

// =============================================================================
// Action Types
// =============================================================================

/**
 * Supported action types for A2U components.
 *
 * - `navigate` - Navigate to a URL (requires target)
 * - `submit` - Submit form data (params contains form data)
 * - `update` - Update component state (params contains updates)
 * - `call_tool` - Invoke agent tool (params.tool, params.args)
 */
export const actionTypeSchema = z.enum([
  'navigate',
  'submit',
  'update',
  'call_tool',
]);

export type ActionType = z.infer<typeof actionTypeSchema>;

/**
 * A2U Action schema - represents a user interaction.
 */
export const a2uActionSchema = z.object({
  /** Action type identifier */
  type: actionTypeSchema,
  /** Navigation URL or element ID (required for navigate) */
  target: z.string().optional(),
  /** Action parameters */
  params: z.record(z.unknown()).optional(),
});

export type A2UAction = z.infer<typeof a2uActionSchema>;

// =============================================================================
// Component Types
// =============================================================================

/**
 * Built-in component types that ship with the renderer.
 */
export const builtInComponentTypeSchema = z.enum([
  'card',
  'list',
  'button',
  'text',
  'image',
  'form',
]);

export type BuiltInComponentType = z.infer<typeof builtInComponentTypeSchema>;

/**
 * A2U Component - recursive structure for UI elements.
 */
export interface A2UComponent {
  /** Component type identifier */
  type: string;
  /** Unique identifier for the component */
  id?: string;
  /** Component-specific properties */
  props?: Record<string, unknown>;
  /** Nested child components */
  children?: A2UComponent[];
  /** Available user interactions */
  actions?: A2UAction[];
}

/** Zod schema for A2UComponent (recursive) */
export const a2uComponentSchema: z.ZodType<A2UComponent> = z.lazy(() =>
  z.object({
    type: z.string().min(1),
    id: z.string().optional(),
    props: z.record(z.unknown()).optional(),
    children: z.array(a2uComponentSchema).optional(),
    actions: z.array(a2uActionSchema).optional(),
  })
);

// =============================================================================
// Response Types
// =============================================================================

/**
 * A2U Response type discriminator.
 */
export const a2uResponseTypeSchema = z.enum(['ui', 'text']);

export type A2UResponseType = z.infer<typeof a2uResponseTypeSchema>;

/**
 * A2U Response - top-level response from agent.
 *
 * @example UI Response
 * ```json
 * {
 *   "version": "1.0",
 *   "type": "ui",
 *   "ui": { "type": "card", "props": { "title": "Flight" } }
 * }
 * ```
 *
 * @example Text Response
 * ```json
 * {
 *   "version": "1.0",
 *   "type": "text",
 *   "text": "I can help you with that!"
 * }
 * ```
 */
export const a2uResponseSchema = z
  .object({
    /** Protocol version (e.g., "1.0") */
    version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y'),
    /** Response type discriminator */
    type: a2uResponseTypeSchema,
    /** Root UI component (when type="ui") */
    ui: a2uComponentSchema.optional(),
    /** Text content (when type="text") */
    text: z.string().optional(),
  })
  .refine(
    (data) => {
      if (data.type === 'ui') return data.ui !== undefined;
      if (data.type === 'text') return data.text !== undefined;
      return true;
    },
    {
      message: 'ui field required when type="ui", text field required when type="text"',
    }
  );

export type A2UResponse = z.infer<typeof a2uResponseSchema>;

// =============================================================================
// Component Props Schemas (for built-in components)
// =============================================================================

/** Card component props */
export const cardPropsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  variant: z.enum(['default', 'outlined', 'elevated']).optional(),
});

export type CardProps = z.infer<typeof cardPropsSchema>;

/** List component props */
export const listPropsSchema = z.object({
  ordered: z.boolean().optional(),
  separator: z.boolean().optional(),
  className: z.string().optional(),
  style: z.record(z.string()).optional(),
});

export type ListProps = z.infer<typeof listPropsSchema>;

/** Button component props */
export const buttonPropsSchema = z.object({
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'danger', 'success']).optional(),
  disabled: z.boolean().optional(),
  className: z.string().optional(),
  style: z.record(z.string()).optional(),
  buttonType: z.enum(['button', 'submit', 'reset']).optional(),
  icon: z.string().optional(),
  ariaLabel: z.string().optional(),
});

export type ButtonProps = z.infer<typeof buttonPropsSchema>;

/** Text component props */
export const textPropsSchema = z.object({
  content: z.string(),
  variant: z.enum(['body', 'heading', 'caption', 'code']).optional(),
  allowHtml: z.boolean().optional(),
});

export type TextProps = z.infer<typeof textPropsSchema>;

/** Image component props */
export const imagePropsSchema = z.object({
  src: z.string().url(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ImageProps = z.infer<typeof imagePropsSchema>;

/** Form field schema */
export const formFieldSchema = z.object({
  name: z.string(),
  type: z.enum(['text', 'email', 'number', 'select', 'textarea']),
  label: z.string(),
  required: z.boolean().optional(),
  options: z.array(z.string()).optional(), // for select type
});

export type FormField = z.infer<typeof formFieldSchema>;

/** Form component props */
export const formPropsSchema = z.object({
  fields: z.array(formFieldSchema),
  submitLabel: z.string().optional(),
});

export type FormProps = z.infer<typeof formPropsSchema>;

// =============================================================================
// Renderer Configuration
// =============================================================================

/**
 * Renderer configuration options.
 */
export const rendererConfigSchema = z.object({
  /** Maximum nesting depth for components (default: 10) */
  maxDepth: z.number().int().positive().default(10),
  /** Maximum total component count per response (default: 100) */
  maxComponents: z.number().int().positive().default(100),
  /** Log level for debugging */
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
  /** Whether to sanitize HTML content (default: true) */
  sanitizeHtml: z.boolean().default(true),
});

export type RendererConfig = z.infer<typeof rendererConfigSchema>;

// =============================================================================
// Component Renderer Interface
// =============================================================================

/**
 * Context passed to component renderers.
 */
export interface RenderContext {
  /** Current nesting depth */
  depth: number;
  /** Total components rendered so far */
  componentCount: number;
  /** Renderer configuration */
  config: RendererConfig;
  /** Callback for rendering child components */
  renderChild: (child: A2UComponent) => HTMLElement;
  /** Callback for handling actions */
  onAction: (action: A2UAction, componentId?: string) => void;
}

/**
 * Function signature for custom component renderers.
 */
export type ComponentRenderer = (
  component: A2UComponent,
  context: RenderContext
) => HTMLElement;

/**
 * Component registry entry for custom components.
 */
export interface ComponentRegistryEntry {
  /** Component type identifier */
  type: string;
  /** Renderer function */
  renderer: ComponentRenderer;
  /** Optional Zod schema for props validation */
  propsSchema?: z.ZodType<unknown>;
}

