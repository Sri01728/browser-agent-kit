import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AgentChat } from '../components/AgentChat';
import { useAgent } from '../hooks/use-agent';
import type { Agent, AgentResult } from '@web-agent/core';
import { createElement } from 'react';

describe('React Integration Tests', () => {
  let mockAgent: Agent;

  beforeEach(() => {
    mockAgent = {
      id: 'test-agent',
      name: 'Test Agent',
      instructions: 'Test instructions',
      model: {} as any,
      tools: {},
      generate: vi.fn().mockResolvedValue({
        text: 'Test response',
        steps: 1,
        finishReason: 'stop',
        usage: {
          promptTokens: 10,
          completionTokens: 20,
          totalTokens: 30,
        },
      } as AgentResult),
      stream: vi.fn(),
    };
  });

  describe('AgentChat Component', () => {
    it('should render chat interface', () => {
      render(<AgentChat agent={mockAgent} />);

      expect(screen.getByRole('textbox')).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should send message and display response', async () => {
      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Hello')).toBeInTheDocument();
      });

      await waitFor(() => {
        expect(screen.getByText('Test response')).toBeInTheDocument();
      });

      expect(mockAgent.generate).toHaveBeenCalledWith('Hello', expect.any(Object));
    });

    it('should clear input after sending', async () => {
      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox') as HTMLInputElement;
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('should disable input while loading', async () => {
      mockAgent.generate = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          text: 'Response',
          steps: 1,
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        }), 100))
      );

      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      // Should be disabled while loading
      await waitFor(() => {
        expect(input).toBeDisabled();
        expect(sendButton).toBeDisabled();
      });

      // Should be enabled after response
      await waitFor(() => {
        expect(input).not.toBeDisabled();
        expect(sendButton).not.toBeDisabled();
      }, { timeout: 3000 });
    });

    it('should display error message', async () => {
      mockAgent.generate = vi.fn().mockRejectedValue(new Error('Generation failed'));

      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText(/error/i)).toBeInTheDocument();
      });
    });

    it('should render A2U components in messages', async () => {
      mockAgent.generate = vi.fn().mockResolvedValue({
        text: 'Here are the results',
        steps: 1,
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        ui: {
          type: 'card',
          id: 'result-card',
          props: {
            title: 'Result Card',
          },
          children: [
            {
              type: 'text',
              id: 'result-text',
              props: {
                content: 'Card content',
              },
            },
          ],
        },
      } as AgentResult);

      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Show results');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Result Card')).toBeInTheDocument();
        expect(screen.getByText('Card content')).toBeInTheDocument();
      });
    });

    it('should handle memory context', async () => {
      const memoryContext = {
        resource: 'user-123',
        thread: 'thread-1',
      };

      render(<AgentChat agent={mockAgent} memoryContext={memoryContext} />);

      const user = userEvent.setup();
      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(mockAgent.generate).toHaveBeenCalledWith(
          'Hello',
          expect.objectContaining({
            memory: memoryContext,
          })
        );
      });
    });
  });

  describe('useAgent Hook Integration', () => {
    function TestComponent({ agent }: { agent: Agent }) {
      const { messages, sendMessage, isLoading, error } = useAgent(agent);

      return (
        <div>
          <div data-testid="loading">{isLoading ? 'Loading' : 'Ready'}</div>
          {error && <div data-testid="error">{error.message}</div>}
          <div data-testid="messages">
            {messages.map((msg, i) => (
              <div key={i} data-testid={`message-${i}`}>
                {msg.content}
              </div>
            ))}
          </div>
          <button onClick={() => sendMessage('Test')}>Send</button>
        </div>
      );
    }

    it('should manage message state', async () => {
      const user = userEvent.setup();
      render(<TestComponent agent={mockAgent} />);

      const sendButton = screen.getByRole('button', { name: 'Send' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('message-0')).toHaveTextContent('Test');
      });

      await waitFor(() => {
        expect(screen.getByTestId('message-1')).toHaveTextContent('Test response');
      });
    });

    it('should show loading state', async () => {
      mockAgent.generate = vi.fn().mockImplementation(
        () => new Promise(resolve => setTimeout(() => resolve({
          text: 'Response',
          steps: 1,
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        }), 100))
      );

      const user = userEvent.setup();
      render(<TestComponent agent={mockAgent} />);

      expect(screen.getByTestId('loading')).toHaveTextContent('Ready');

      const sendButton = screen.getByRole('button', { name: 'Send' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Loading');
      });

      await waitFor(() => {
        expect(screen.getByTestId('loading')).toHaveTextContent('Ready');
      }, { timeout: 3000 });
    });

    it('should handle errors', async () => {
      mockAgent.generate = vi.fn().mockRejectedValue(new Error('Test error'));

      const user = userEvent.setup();
      render(<TestComponent agent={mockAgent} />);

      const sendButton = screen.getByRole('button', { name: 'Send' });
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByTestId('error')).toHaveTextContent('Test error');
      });
    });
  });

  describe('Full Chat Flow', () => {
    it('should handle complete conversation', async () => {
      let callCount = 0;
      mockAgent.generate = vi.fn().mockImplementation(() => {
        callCount++;
        return Promise.resolve({
          text: `Response ${callCount}`,
          steps: 1,
          finishReason: 'stop',
          usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        } as AgentResult);
      });

      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      // First message
      await user.type(input, 'Hello');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Response 1')).toBeInTheDocument();
      });

      // Second message
      await user.type(input, 'How are you?');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Response 2')).toBeInTheDocument();
      });

      // Should have 4 messages total (2 user + 2 assistant)
      await waitFor(() => {
        const messages = screen.getAllByRole('listitem');
        expect(messages.length).toBeGreaterThanOrEqual(4);
      });
    });

    it('should preserve message history', async () => {
      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'First message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('First message')).toBeInTheDocument();
      });

      await user.type(input, 'Second message');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByText('Second message')).toBeInTheDocument();
      });

      // Both messages should still be visible
      expect(screen.getByText('First message')).toBeInTheDocument();
      expect(screen.getByText('Second message')).toBeInTheDocument();
    });
  });

  describe('A2U Component Interaction', () => {
    it('should handle button actions in A2U components', async () => {
      const onAction = vi.fn();

      mockAgent.generate = vi.fn().mockResolvedValue({
        text: 'Here is a button',
        steps: 1,
        finishReason: 'stop',
        usage: { promptTokens: 10, completionTokens: 20, totalTokens: 30 },
        ui: {
          type: 'button',
          id: 'action-button',
          props: {
            label: 'Click Me',
          },
          actions: [
            {
              type: 'call_tool',
              params: {
                tool: 'testTool',
                args: { test: 'data' },
              },
            },
          ],
        },
      } as AgentResult);

      const user = userEvent.setup();
      render(<AgentChat agent={mockAgent} onAction={onAction} />);

      const input = screen.getByRole('textbox');
      const sendButton = screen.getByRole('button', { name: /send/i });

      await user.type(input, 'Show button');
      await user.click(sendButton);

      await waitFor(() => {
        expect(screen.getByRole('button', { name: 'Click Me' })).toBeInTheDocument();
      });

      const actionButton = screen.getByRole('button', { name: 'Click Me' });
      await user.click(actionButton);

      expect(onAction).toHaveBeenCalled();
    });
  });
});

