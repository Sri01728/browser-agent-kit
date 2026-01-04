/**
 * Welcome Message Component
 * 
 * Shows a welcome message when the model is ready but no messages yet
 */

interface WelcomeMessageProps {
  modelName: string;
}

export function WelcomeMessage({ modelName }: WelcomeMessageProps) {
  return (
    <div className="welcome-message" style={{
      padding: '24px',
      textAlign: 'center',
      color: '#666',
      lineHeight: '1.6',
    }}>
      <p>👋 Hello! I'm running on <strong>{modelName}</strong></p>
      <p>Ask me anything! I'm running entirely in your browser using Transformers.js.</p>
      <p style={{
        marginTop: '16px',
        fontSize: '12px',
        fontStyle: 'italic',
      }}>
        💡 Tip: Start with simple questions. Transformers.js models work best with concise prompts.
      </p>
    </div>
  );
}

