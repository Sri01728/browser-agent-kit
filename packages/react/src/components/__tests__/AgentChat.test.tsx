/**
 * @vitest-environment jsdom
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AgentChat } from '../AgentChat';

// Mock agent
const createMockAgent = () => ({
  id: 'test-agent',
  name: 'Test Agent',
  instructions: 'Test instructions',
  model: {} as any,
  tools: {},
  generate: vi.fn(),
  stream: vi.fn(),
});

describe('AgentChat', () => {
  let mockAgent: ReturnType<typeof createMockAgent>;

  beforeEach(() => {
    mockAgent = createMockAgent();
    vi.clearAllMocks();
  });

  it('should render chat container', () => {
    render(<AgentChat agent={mockAgent as any} />);

    expect(screen.getByTestId('agent-chat')).toBeInTheDocument();
  });

  it('should render title when provided', () => {
    render(<AgentChat agent={mockAgent as any} title="AI Assistant" />);

    expect(screen.getByText('AI Assistant')).toBeInTheDocument();
  });

  it('should render input field', () => {
    render(<AgentChat agent={mockAgent as any} />);

    expect(screen.getByTestId('chat-input')).toBeInTheDocument();
  });

  it('should render send button', () => {
    render(<AgentChat agent={mockAgent as any} />);

    expect(screen.getByTestId('send-button')).toBeInTheDocument();
  });

  it('should render placeholder text', () => {
    render(<AgentChat agent={mockAgent as any} placeholder="Ask me anything..." />);

    expect(screen.getByPlaceholderText('Ask me anything...')).toBeInTheDocument();
  });

  it('should render initial messages', () => {
    const initialMessages = [
      { id: '1', role: 'user' as const, content: 'Hello', timestamp: Date.now() },
      { id: '2', role: 'assistant' as const, content: 'Hi there!', timestamp: Date.now() },
    ];

    render(<AgentChat agent={mockAgent as any} initialMessages={initialMessages} />);

    expect(screen.getByText('Hello')).toBeInTheDocument();
    expect(screen.getByText('Hi there!')).toBeInTheDocument();
  });

  it('should disable send button when input is empty', () => {
    render(<AgentChat agent={mockAgent as any} />);

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).toBeDisabled();
  });

  it('should enable send button when input has text', () => {
    render(<AgentChat agent={mockAgent as any} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });

    const sendButton = screen.getByTestId('send-button');
    expect(sendButton).not.toBeDisabled();
  });

  it('should send message on button click', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    render(<AgentChat agent={mockAgent as any} streaming={false} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });

    const sendButton = screen.getByTestId('send-button');
    fireEvent.click(sendButton);

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should send message on Enter key', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    render(<AgentChat agent={mockAgent as any} streaming={false} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.keyPress(input, { key: 'Enter', charCode: 13 });

    await waitFor(() => {
      expect(screen.getByText('Hello')).toBeInTheDocument();
    });
  });

  it('should clear input after sending', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    render(<AgentChat agent={mockAgent as any} streaming={false} />);

    const input = screen.getByTestId('chat-input') as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(input.value).toBe('');
    });
  });

  it('should apply custom className', () => {
    render(<AgentChat agent={mockAgent as any} className="custom-chat" />);

    expect(screen.getByTestId('agent-chat')).toHaveClass('custom-chat');
  });

  it('should apply custom style', () => {
    render(
      <AgentChat
        agent={mockAgent as any}
        style={{ backgroundColor: 'red' }}
      />
    );

    expect(screen.getByTestId('agent-chat')).toHaveStyle({ backgroundColor: 'red' });
  });

  it('should call onSend when message is sent', async () => {
    mockAgent.generate.mockResolvedValueOnce({
      text: 'Response',
      steps: 1,
      finishReason: 'stop',
      usage: { promptTokens: 1, completionTokens: 1, totalTokens: 2 },
    });

    const onSend = vi.fn();
    render(<AgentChat agent={mockAgent as any} streaming={false} onSend={onSend} />);

    const input = screen.getByTestId('chat-input');
    fireEvent.change(input, { target: { value: 'Hello' } });
    fireEvent.click(screen.getByTestId('send-button'));

    await waitFor(() => {
      expect(onSend).toHaveBeenCalledWith(
        expect.objectContaining({
          role: 'user',
          content: 'Hello',
        })
      );
    });
  });
});

