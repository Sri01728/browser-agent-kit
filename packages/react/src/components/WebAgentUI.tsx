/**
 * WebAgentUI Component
 *
 * Renders A2U responses from useWebAgent hook.
 * Includes loading states, error handling, and thinking display.
 *
 * @example Basic Usage
 * ```tsx
 * import { useWebAgent, WebAgentUI } from '@web-agent/react';
 *
 * function App() {
 *   const agent = useWebAgent({ persona: 'You are helpful.' });
 *
 *   return (
 *     <div>
 *       <WebAgentUI agent={agent} />
 *       <button onClick={agent.load}>Load Model</button>
 *     </div>
 *   );
 * }
 * ```
 *
 * @module components/WebAgentUI
 */

import React, { useEffect, useRef } from 'react';
import { A2URenderer, type A2UAction } from '@web-agent/ui-protocol/a2u';
import type { UseWebAgentReturn } from '../hooks/use-web-agent';

// =============================================================================
// Types
// =============================================================================

export interface WebAgentUIProps {
  /** Agent state from useWebAgent() */
  agent: UseWebAgentReturn;
  /** Show thinking panel (default: true) */
  showThinking?: boolean;
  /** Custom action handler */
  onAction?: (action: A2UAction, componentId?: string) => void;
  /** Custom class name */
  className?: string;
  /** Custom styles */
  style?: React.CSSProperties;
}

// =============================================================================
// Styles
// =============================================================================

const defaultStyles = `
  .web-agent-ui {
    display: flex;
    flex-direction: column;
    height: 100%;
    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  }

  .web-agent-ui__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
  }

  .web-agent-ui__spinner {
    width: 40px;
    height: 40px;
    border: 3px solid rgba(0, 0, 0, 0.1);
    border-top-color: #3b82f6;
    border-radius: 50%;
    animation: web-agent-spin 1s linear infinite;
    margin-bottom: 1rem;
  }

  @keyframes web-agent-spin {
    to { transform: rotate(360deg); }
  }

  .web-agent-ui__progress {
    color: #6b7280;
    font-size: 0.875rem;
  }

  .web-agent-ui__error {
    background: #fef2f2;
    border: 1px solid #fecaca;
    border-radius: 8px;
    padding: 1rem;
    margin: 1rem;
    color: #dc2626;
  }

  .web-agent-ui__idle {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 2rem;
    text-align: center;
    color: #6b7280;
  }

  .web-agent-ui__idle button {
    margin-top: 1rem;
    padding: 0.75rem 1.5rem;
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
    border: none;
    border-radius: 8px;
    font-weight: 600;
    cursor: pointer;
    transition: transform 0.2s;
  }

  .web-agent-ui__idle button:hover {
    transform: translateY(-2px);
  }

  .web-agent-ui__content {
    flex: 1;
    overflow-y: auto;
    padding: 1rem;
  }

  .web-agent-ui__thinking {
    background: #f3f4f6;
    border-radius: 8px;
    padding: 1rem;
    margin-bottom: 1rem;
    font-family: monospace;
    font-size: 0.85rem;
    white-space: pre-wrap;
    max-height: 200px;
    overflow-y: auto;
  }

  .web-agent-ui__a2u {
    /* A2U components render here */
  }

  /* A2U Component Styles */
  .a2u-card {
    background: white;
    border-radius: 12px;
    padding: 1.25rem;
    margin-bottom: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
    border: 1px solid #e5e7eb;
  }

  .a2u-card--elevated {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
  }

  .a2u-card--outlined {
    box-shadow: none;
    border: 1px solid #d1d5db;
  }

  .a2u-card__title {
    font-size: 1.125rem;
    font-weight: 600;
    margin: 0 0 0.5rem 0;
  }

  .a2u-card__content {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
  }

  .a2u-text {
    margin: 0;
    line-height: 1.5;
  }

  .a2u-text--heading {
    font-size: 1rem;
    font-weight: 600;
  }

  .a2u-text--caption {
    font-size: 0.875rem;
    color: #6b7280;
  }

  .a2u-button {
    padding: 0.625rem 1.25rem;
    border-radius: 8px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s;
    border: none;
  }

  .a2u-button--primary {
    background: linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%);
    color: white;
  }

  .a2u-button--primary:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  .a2u-button--secondary {
    background: #f3f4f6;
    color: #374151;
    border: 1px solid #d1d5db;
  }

  .a2u-button--secondary:hover {
    background: #e5e7eb;
  }

  .a2u-list {
    margin: 0.5rem 0;
    padding-left: 1.25rem;
  }

  .a2u-list li {
    margin: 0.25rem 0;
  }
`;

// =============================================================================
// Component
// =============================================================================

export function WebAgentUI({
  agent,
  showThinking = true,
  onAction,
  className = '',
  style,
}: WebAgentUIProps) {
  const a2uContainerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<A2URenderer | null>(null);

  // Initialize renderer
  useEffect(() => {
    rendererRef.current = new A2URenderer({
      maxDepth: 10,
      maxComponents: 50,
      logLevel: 'warn',
    });
  }, []);

  // Render A2U when UI changes
  useEffect(() => {
    if (!agent.ui || !rendererRef.current || !a2uContainerRef.current) {
      return;
    }

    rendererRef.current.render(agent.ui, a2uContainerRef.current, {
      onAction: onAction || ((action, componentId) => {
        console.log('[WebAgentUI] Action:', action, componentId);
      }),
    });
  }, [agent.ui, onAction]);

  // Render based on status
  const renderContent = () => {
    switch (agent.status) {
      case 'idle':
        return (
          <div className="web-agent-ui__idle">
            <p>🤖 AI Agent Ready</p>
            <p>Load the model to start chatting</p>
            <button onClick={agent.load}>Load AI Model</button>
          </div>
        );

      case 'loading':
      case 'initializing':
        return (
          <div className="web-agent-ui__loading">
            <div className="web-agent-ui__spinner" />
            <div className="web-agent-ui__progress">{agent.progress}</div>
          </div>
        );

      case 'error':
        return (
          <div className="web-agent-ui__error">
            <strong>Error:</strong> {agent.error?.message}
            <br />
            <button
              onClick={agent.load}
              style={{ marginTop: '0.5rem', padding: '0.5rem 1rem' }}
            >
              Retry
            </button>
          </div>
        );

      case 'ready':
        return (
          <div className="web-agent-ui__content">
            {/* Thinking panel */}
            {showThinking && agent.thinking && (
              <div className="web-agent-ui__thinking">{agent.thinking}</div>
            )}
            {/* A2U rendered UI */}
            <div className="web-agent-ui__a2u" ref={a2uContainerRef} />
            {/* Generating indicator */}
            {agent.isGenerating && !agent.thinking && (
              <div className="web-agent-ui__loading">
                <div className="web-agent-ui__spinner" />
                <div className="web-agent-ui__progress">Generating...</div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <>
      <style>{defaultStyles}</style>
      <div className={`web-agent-ui ${className}`} style={style}>
        {renderContent()}
      </div>
    </>
  );
}

