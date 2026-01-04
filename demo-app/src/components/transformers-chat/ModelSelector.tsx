/**
 * Model Selector Component
 * 
 * Simple dropdown to select which Transformers.js model to use
 */

interface Model {
  readonly id: string;
  readonly name: string;
  readonly path: string;
}

interface ModelSelectorProps {
  selectedModel: string;
  models: readonly Model[];
  onChange: (modelId: string) => void;
  disabled?: boolean;
}

export function ModelSelector({ selectedModel, models, onChange, disabled }: ModelSelectorProps) {
  return (
    <div className="model-selector">
      <label htmlFor="model-select">Model:</label>
      <select
        id="model-select"
        value={selectedModel}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        style={{
          padding: '6px 12px',
          border: '1px solid #ccc',
          borderRadius: '4px',
          fontSize: '14px',
        }}
      >
        {models.map(model => (
          <option key={model.id} value={model.id}>
            {model.name}
          </option>
        ))}
      </select>
    </div>
  );
}

