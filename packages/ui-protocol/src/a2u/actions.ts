/**
 * A2U Action Handlers
 *
 * Handles user interactions with A2U components.
 *
 * @example
 * ```typescript
 * import { createActionHandler } from '@web-agent/ui-protocol/a2u';
 *
 * const handler = createActionHandler({
 *   onNavigate: (url) => window.location.href = url,
 *   onCallTool: async (tool, args) => {
 *     return await agent.executeTool(tool, args);
 *   }
 * });
 *
 * // Execute an action
 * handler.execute(action, componentId);
 * ```
 *
 * @module a2u/actions
 */

import { createLogger } from '../logger';
import type { A2UAction, ActionType } from './types';
import { ActionError } from './errors';

const logger = createLogger('A2UActions');

/**
 * Action handler callbacks.
 */
export interface ActionHandlerCallbacks {
  /** Handle navigate action */
  onNavigate?: (url: string, componentId?: string) => void;
  /** Handle submit action (form submission) */
  onSubmit?: (data: Record<string, unknown>, componentId?: string) => void;
  /** Handle update action (state update) */
  onUpdate?: (updates: Record<string, unknown>, componentId?: string) => void;
  /** Handle call_tool action */
  onCallTool?: (
    tool: string,
    args: Record<string, unknown>,
    componentId?: string
  ) => void | Promise<void>;
  /** Fallback handler for any action */
  onAction?: (action: A2UAction, componentId?: string) => void;
}

/**
 * Action handler interface.
 */
export interface ActionHandler {
  /** Execute an action */
  execute(action: A2UAction, componentId?: string): void;
}

/**
 * Creates an action handler with the provided callbacks.
 *
 * @param callbacks - Handler callbacks for each action type
 * @returns ActionHandler instance
 *
 * @example
 * ```typescript
 * const handler = createActionHandler({
 *   onNavigate: (url) => {
 *     if (url.startsWith('http')) {
 *       window.open(url, '_blank');
 *     } else {
 *       router.push(url);
 *     }
 *   },
 *   onCallTool: async (tool, args) => {
 *     console.log('Calling tool:', tool, args);
 *   }
 * });
 * ```
 */
export function createActionHandler(callbacks: ActionHandlerCallbacks): ActionHandler {
  return {
    execute(action: A2UAction, componentId?: string): void {
      logger.debug('Executing action', { type: action.type, componentId });

      try {
        switch (action.type) {
          case 'navigate':
            if (!action.target) {
              throw new ActionError('Navigate action requires target URL', 'navigate', componentId);
            }
            if (callbacks.onNavigate) {
              callbacks.onNavigate(action.target, componentId);
            } else if (callbacks.onAction) {
              callbacks.onAction(action, componentId);
            } else {
              // Default: use window.location
              logger.info('Default navigate handler', { target: action.target });
              if (typeof window !== 'undefined') {
                window.location.href = action.target;
              }
            }
            break;

          case 'submit':
            if (callbacks.onSubmit) {
              callbacks.onSubmit(action.params || {}, componentId);
            } else if (callbacks.onAction) {
              callbacks.onAction(action, componentId);
            } else {
              logger.warn('No submit handler registered');
            }
            break;

          case 'update':
            if (callbacks.onUpdate) {
              callbacks.onUpdate(action.params || {}, componentId);
            } else if (callbacks.onAction) {
              callbacks.onAction(action, componentId);
            } else {
              logger.warn('No update handler registered');
            }
            break;

          case 'call_tool':
            const tool = action.params?.tool as string | undefined;
            const args = (action.params?.args as Record<string, unknown>) || {};

            if (!tool) {
              throw new ActionError(
                'call_tool action requires params.tool',
                'call_tool',
                componentId
              );
            }

            if (callbacks.onCallTool) {
              callbacks.onCallTool(tool, args, componentId);
            } else if (callbacks.onAction) {
              callbacks.onAction(action, componentId);
            } else {
              logger.warn('No call_tool handler registered');
            }
            break;

          default:
            // Unknown action type - use fallback
            if (callbacks.onAction) {
              callbacks.onAction(action, componentId);
            } else {
              logger.warn('Unknown action type', { type: action.type });
            }
        }
      } catch (error) {
        if (error instanceof ActionError) {
          throw error;
        }
        throw new ActionError(
          (error as Error).message,
          action.type,
          componentId,
          error as Error
        );
      }
    },
  };
}

/**
 * Default action handler that logs actions but doesn't execute them.
 */
export const noopActionHandler: ActionHandler = {
  execute(action: A2UAction, componentId?: string): void {
    logger.debug('Action received (no-op)', { action, componentId });
  },
};

