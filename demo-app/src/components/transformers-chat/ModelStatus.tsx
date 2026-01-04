/**
 * Model Status Component
 * 
 * Shows the current status of the model (loading, ready, error, etc.)
 */

interface ModelStatusProps {
  isReady: boolean;
  isLoading: boolean;
  loadProgress: number;
  modelName?: string;
  error?: Error | null;
}

export function ModelStatus({ isReady, isLoading, loadProgress, modelName, error }: ModelStatusProps) {
  if (error) {
    return (
      <div className="model-status">
        <div className="status-info status-error" style={{
          fontSize: '14px',
          padding: '8px',
          borderRadius: '4px',
          background: '#ffebee',
          color: '#c62828',
        }}>
          ⚠️ Error: {error.message}
        </div>
      </div>
    );
  }

  if (isReady) {
    return (
      <div className="model-status">
        <div className="status-info status-ready" style={{
          fontSize: '14px',
          padding: '8px',
          borderRadius: '4px',
          background: '#e8f5e9',
          color: '#2e7d32',
        }}>
          ✅ Model loaded: {modelName || 'Ready'}
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="model-status">
        <div className="status-info status-loading" style={{
          fontSize: '14px',
          padding: '8px',
          borderRadius: '4px',
          background: '#fff3e0',
          color: '#e65100',
        }}>
          ⏳ Loading model... {loadProgress > 0 && `${loadProgress}%`}
        </div>
      </div>
    );
  }

  return (
    <div className="model-status">
      <div className="status-info status-idle" style={{
        fontSize: '14px',
        padding: '8px',
        borderRadius: '4px',
        background: '#f5f5f5',
        color: '#666',
      }}>
        ⚠️ Model not loaded. Click "Load Model" to start.
      </div>
    </div>
  );
}

