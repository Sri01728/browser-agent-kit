/**
 * A2U Protocol Schema Contracts
 * 
 * These Zod schemas define the A2U protocol structure.
 * Implementation MUST match these contracts exactly.
 */

import { z } from 'zod';

// =============================================================================
// Action Types
// =============================================================================

export const actionTypeSchema = z.enum([
  'navigate',
  'submit', 
  'update',
  'call_tool',
]);

export type ActionType = z.infer<typeof actionTypeSchema>;

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

export const builtInComponentTypeSchema = z.enum([
  'card',
  'list',
  'button',
  'text',
  'image',
  'form',
]);

export type BuiltInComponentType = z.infer<typeof builtInComponentTypeSchema>;

/** Base component schema - recursive structure */
export const a2uComponentSchema: z.ZodType<A2UComponent> = z.lazy(() =>
  z.object({
    /** Component type identifier */
    type: z.string().min(1),
    /** Unique identifier for the component */
    id: z.string().optional(),
    /** Component-specific properties */
    props: z.record(z.unknown()).optional(),
    /** Nested child components */
    children: z.array(a2uComponentSchema).optional(),
    /** Available user interactions */
    actions: z.array(a2uActionSchema).optional(),
  })
);

export type A2UComponent = {
  type: string;
  id?: string;
  props?: Record<string, unknown>;
  children?: A2UComponent[];
  actions?: A2UAction[];
};

// =============================================================================
// Response Types
// =============================================================================

export const a2uResponseTypeSchema = z.enum(['ui', 'text']);

export type A2UResponseType = z.infer<typeof a2uResponseTypeSchema>;

export const a2uResponseSchema = z.object({
  /** Protocol version (e.g., "1.0") */
  version: z.string().regex(/^\d+\.\d+$/, 'Version must be in format X.Y'),
  /** Response type discriminator */
  type: a2uResponseTypeSchema,
  /** Root UI component (when type="ui") */
  ui: a2uComponentSchema.optional(),
  /** Text content (when type="text") */
  text: z.string().optional(),
}).refine(
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

export const cardPropsSchema = z.object({
  title: z.string().optional(),
  subtitle: z.string().optional(),
  variant: z.enum(['default', 'outlined', 'elevated']).optional(),
});

export type CardProps = z.infer<typeof cardPropsSchema>;

export const listPropsSchema = z.object({
  ordered: z.boolean().optional(),
  separator: z.boolean().optional(),
});

export type ListProps = z.infer<typeof listPropsSchema>;

export const buttonPropsSchema = z.object({
  label: z.string(),
  variant: z.enum(['primary', 'secondary', 'danger']).optional(),
  disabled: z.boolean().optional(),
});

export type ButtonProps = z.infer<typeof buttonPropsSchema>;

export const textPropsSchema = z.object({
  content: z.string(),
  variant: z.enum(['body', 'heading', 'caption', 'code']).optional(),
  allowHtml: z.boolean().optional(),
});

export type TextProps = z.infer<typeof textPropsSchema>;

export const imagePropsSchema = z.object({
  src: z.string().url(),
  alt: z.string(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export type ImageProps = z.infer<typeof imagePropsSchema>;

export const formPropsSchema = z.object({
  fields: z.array(z.object({
    name: z.string(),
    type: z.enum(['text', 'email', 'number', 'select', 'textarea']),
    label: z.string(),
    required: z.boolean().optional(),
    options: z.array(z.string()).optional(), // for select type
  })),
  submitLabel: z.string().optional(),
});

export type FormProps = z.infer<typeof formPropsSchema>;

// =============================================================================
// Renderer Configuration
// =============================================================================

export const rendererConfigSchema = z.object({
  /** Maximum nesting depth for components */
  maxDepth: z.number().int().positive().default(10),
  /** Maximum total component count per response */
  maxComponents: z.number().int().positive().default(100),
  /** Log level for debugging */
  logLevel: z.enum(['debug', 'info', 'warn', 'error']).default('warn'),
  /** Whether to sanitize HTML content */
  sanitizeHtml: z.boolean().default(true),
});

export type RendererConfig = z.infer<typeof rendererConfigSchema>;

// =============================================================================
// Component Renderer Interface
// =============================================================================

export type ComponentRenderer = (
  component: A2UComponent,
  context: RenderContext
) => HTMLElement;

export type RenderContext = {
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
};

