/**
 * Message Input Component
 * 
 * Input field and buttons for sending messages
 */

interface MessageInputProps {
  value: string;
  onChange: (value: string) => void;
  onSend: () => void;
  onReset: () => void;
  disabled?: boolean;
  isGenerating?: boolean;
}

export function MessageInput({ value, onChange, onSend, onReset, disabled, isGenerating }: MessageInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      onSend();
    }
  };

  return (
    <div className="input-section" style={{
      display: 'flex',
      gap: '8px',
      padding: '16px',
      borderTop: '1px solid #e0e0e0',
      background: '#fafafa',
    }}>
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="Type your message..."
        disabled={disabled || isGenerating}
        style={{
          flex: 1,
          padding: '10px 14px',
          border: '1px solid #ccc',
          borderRadius: '6px',
          fontSize: '14px',
        }}
      />
      <button
        onClick={onSend}
        disabled={!value.trim() || isGenerating}
        style={{
          padding: '10px 20px',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: 'pointer',
          fontWeight: '500',
          opacity: (!value.trim() || isGenerating) ? 0.5 : 1,
        }}
      >
        Send
      </button>
      <button
        onClick={onReset}
        title="Clear chat"
        style={{
          padding: '10px',
          background: '#f5f5f5',
          border: '1px solid #ccc',
          borderRadius: '6px',
          cursor: 'pointer',
          fontSize: '16px',
        }}
      >
        🗑️
      </button>
    </div>
  );
}

