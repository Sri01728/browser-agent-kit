/**
 * Message List Component
 * 
 * Displays the chat messages between user and assistant
 */

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}

interface MessageListProps {
  messages: Message[];
  isGenerating: boolean;
}

export function MessageList({ messages, isGenerating }: MessageListProps) {
  return (
    <div className="messages-container" style={{
      flex: 1,
      overflowY: 'auto',
      padding: '16px',
      display: 'flex',
      flexDirection: 'column',
      gap: '12px',
    }}>
      {messages.map((msg, i) => (
        <div key={i} className={`message ${msg.role}`} style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
          flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
        }}>
          <div className="message-avatar" style={{
            fontSize: '24px',
            flexShrink: 0,
          }}>
            {msg.role === 'user' ? '👤' : '🤖'}
          </div>
          <div className="message-content" style={{
            maxWidth: '70%',
            padding: '10px 14px',
            borderRadius: '12px',
            background: msg.role === 'user' ? '#1976d2' : '#f5f5f5',
            color: msg.role === 'user' ? 'white' : '#333',
            lineHeight: '1.5',
            whiteSpace: 'pre-wrap',
          }}>
            {msg.content}
          </div>
        </div>
      ))}

      {isGenerating && (
        <div className="message assistant" style={{
          display: 'flex',
          gap: '12px',
          alignItems: 'flex-start',
        }}>
          <div className="message-avatar" style={{
            fontSize: '24px',
            flexShrink: 0,
          }}>
            🤖
          </div>
          <div className="message-content" style={{
            maxWidth: '70%',
            padding: '10px 14px',
            borderRadius: '12px',
            background: '#f5f5f5',
            color: '#999',
            fontStyle: 'italic',
          }}>
            Thinking...
          </div>
        </div>
      )}
    </div>
  );
}

