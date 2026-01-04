/**
 * Load Model Button Component
 * 
 * Simple button to load the Transformers.js model
 */

interface LoadModelButtonProps {
  onClick: () => void;
  isLoading: boolean;
}

export function LoadModelButton({ onClick, isLoading }: LoadModelButtonProps) {
  return (
    <div className="load-section" style={{
      padding: '16px',
      textAlign: 'center',
      borderBottom: '1px solid #e0e0e0',
    }}>
      <button
        onClick={onClick}
        disabled={isLoading}
        style={{
          padding: '12px 24px',
          fontSize: '16px',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '6px',
          cursor: isLoading ? 'not-allowed' : 'pointer',
          fontWeight: '500',
          opacity: isLoading ? 0.6 : 1,
        }}
      >
        {isLoading ? 'Loading...' : '🚀 Load Model'}
      </button>
      <p style={{
        marginTop: '12px',
        fontSize: '12px',
        color: '#666',
        lineHeight: '1.5',
      }}>
        First load may take a while as the model downloads and initializes.
        Models are cached in your browser for faster subsequent loads.
      </p>
    </div>
  );
}

