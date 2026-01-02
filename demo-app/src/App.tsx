/**
 * @web-agent Demo App
 * 
 * Demonstrates framework hooks and components:
 * - SmartAgentProvider / useSmartAgent / useRegisterData
 * - Model utilities (checkWebGPUSupport, isModelCached)
 */

import { useState, useEffect } from 'react';
import {
  // Smart Agent Provider
  SmartAgentProvider,
  useSmartAgent,
  useRegisterData,

  // Model utilities
  checkWebGPUSupport,
  isModelCached,
} from '@web-agent/react';

// =============================================================================
// Demo Data (simulates your app's data)
// =============================================================================

const DEMO_PRODUCTS = [
  { id: 1, name: 'Laptop Pro', price: 1299, category: 'Electronics', stock: 15 },
  { id: 2, name: 'Wireless Mouse', price: 49, category: 'Electronics', stock: 100 },
  { id: 3, name: 'Standing Desk', price: 599, category: 'Furniture', stock: 8 },
  { id: 4, name: 'Ergonomic Chair', price: 399, category: 'Furniture', stock: 12 },
  { id: 5, name: 'USB-C Hub', price: 79, category: 'Electronics', stock: 50 },
];


// =============================================================================
// Main App
// =============================================================================

export default function App() {
  const [webGPUStatus, setWebGPUStatus] = useState<{ supported: boolean; reason?: string } | null>(null);
  const [modelCached, setModelCached] = useState<boolean | null>(null);

  // Check WebGPU support on mount
  useEffect(() => {
    const status = checkWebGPUSupport();
    setWebGPUStatus(status);

    // Check if model is cached
    isModelCached().then(setModelCached);
  }, []);

  // Show WebGPU check
  if (webGPUStatus === null) {
    return <LoadingScreen message="Checking browser compatibility..." />;
  }

  if (!webGPUStatus.supported) {
    return <ErrorScreen message={webGPUStatus.reason || 'WebGPU not supported'} />;
  }

  // Keep persona SHORT - Gemma 2B only has 1024 token limit!
  const GENERAL_PERSONA = `You are a helpful AI assistant. Be concise.`;

  return (
    <SmartAgentProvider
      persona={GENERAL_PERSONA}
      modelPath="/models/gemma-2b-it-gpu-int4.bin"
      autoLoad={true}
      includeDOM={false}
      includeForms={false}
      includeTables={false}
      maxContextLength={500}
    >
      <div className="app">
        <Header modelCached={modelCached} />
        <main className="main-content">
          <DataPanel />
          <ChatPanel />
        </main>
        <Footer />
      </div>
    </SmartAgentProvider>
  );
}

// =============================================================================
// Components
// =============================================================================

function Header({ modelCached }: { modelCached: boolean | null }) {
  const { isReady, isLoading, modelLoadProgress, status } = useSmartAgent();

  return (
    <header className="header">
      <div className="header-left">
        <h1>🤖 @web-agent Demo</h1>
        <span className="subtitle">Browser-native AI</span>
      </div>
      <div className="header-right">
        <StatusBadge 
          label="Model" 
          status={isReady ? 'ready' : isLoading ? 'loading' : 'idle'}
          detail={isLoading ? `${modelLoadProgress}%` : modelCached ? 'Cached' : 'Not cached'}
        />
        <StatusBadge 
          label="Agent" 
          status={status === 'ready' ? 'ready' : status === 'thinking' ? 'loading' : 'idle'}
          detail={status}
        />
      </div>
    </header>
  );
}

function StatusBadge({ label, status, detail }: { label: string; status: 'ready' | 'loading' | 'idle'; detail?: string }) {
  const colors = {
    ready: '#10b981',
    loading: '#f59e0b',
    idle: '#6b7280',
  };

  return (
    <div className="status-badge">
      <span className="status-dot" style={{ backgroundColor: colors[status] }} />
      <span className="status-label">{label}</span>
      {detail && <span className="status-detail">({detail})</span>}
    </div>
  );
}

interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  stock: number;
}

function DataPanel() {
  const [products, setProducts] = useState<Product[]>(DEMO_PRODUCTS);
  const [activeTab, setActiveTab] = useState<'products' | 'add'>('products');
  
  // Form state for adding new product
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newStock, setNewStock] = useState('');

  // Register data in COMPACT format to save tokens
  // Instead of full JSON, use: "Name:$Price" format
  const compactProducts = products.map(p => `${p.name}:$${p.price}`).join(', ');
  useRegisterData('products', compactProducts);

  const handleAddProduct = () => {
    if (!newName.trim() || !newPrice) return;
    
    const newProduct: Product = {
      id: Date.now(),
      name: newName.trim(),
      price: Number(newPrice),
      category: newCategory.trim() || 'Other',
      stock: Number(newStock) || 0,
    };
    
    setProducts([...products, newProduct]);
    
    // Clear form
    setNewName('');
    setNewPrice('');
    setNewCategory('');
    setNewStock('');
    setActiveTab('products');
  };

  const handleDelete = (id: number) => {
    setProducts(products.filter(p => p.id !== id));
  };

  return (
    <div className="data-panel">
      <div className="panel-header">
        <h2>📊 Your Data ({products.length} items)</h2>
        <p className="hint">Add items below, then ask AI about them!</p>
      </div>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'products' ? 'active' : ''}`}
          onClick={() => setActiveTab('products')}
        >
          Products ({products.length})
        </button>
        <button 
          className={`tab ${activeTab === 'add' ? 'active' : ''}`}
          onClick={() => setActiveTab('add')}
        >
          ➕ Add New
        </button>
      </div>

      {activeTab === 'products' && (
        <>
          <table className="data-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Price</th>
                <th>Category</th>
                <th>Stock</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {products.map(p => (
                <tr key={p.id}>
                  <td>{p.name}</td>
                  <td>${p.price}</td>
                  <td>{p.category}</td>
                  <td>{p.stock}</td>
                  <td>
                    <button 
                      className="delete-btn" 
                      onClick={() => handleDelete(p.id)}
                      title="Delete"
                    >
                      🗑️
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div className="data-context">
            <strong>🤖 LLM sees this data (updates automatically):</strong>
            <code className="data-code">
              {compactProducts}
            </code>
            <p className="data-count">({products.length} products registered)</p>
          </div>
        </>
      )}

      {activeTab === 'add' && (
        <div className="add-form">
          <div className="form-row">
            <label>Name *</label>
            <input 
              type="text" 
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="e.g., Gaming Keyboard"
            />
          </div>
          <div className="form-row">
            <label>Price *</label>
            <input 
              type="number" 
              value={newPrice}
              onChange={e => setNewPrice(e.target.value)}
              placeholder="e.g., 150"
            />
          </div>
          <div className="form-row">
            <label>Category</label>
            <input 
              type="text" 
              value={newCategory}
              onChange={e => setNewCategory(e.target.value)}
              placeholder="e.g., Electronics"
            />
          </div>
          <div className="form-row">
            <label>Stock</label>
            <input 
              type="number" 
              value={newStock}
              onChange={e => setNewStock(e.target.value)}
              placeholder="e.g., 25"
            />
          </div>
          <button 
            className="add-btn"
            onClick={handleAddProduct}
            disabled={!newName.trim() || !newPrice}
          >
            ➕ Add Product
          </button>
        </div>
      )}
    </div>
  );
}

function ChatPanel() {
  const { send, messages, isReady, isLoading, status, reset } = useSmartAgent();
  const [input, setInput] = useState('');

  const handleSend = async () => {
    if (!input.trim() || !isReady) return;
    const message = input;
    setInput('');
    
    // Send to AI
    await send(message);
  };

  return (
    <div className="chat-panel">
      <div className="panel-header">
        <h2>💬 AI Assistant</h2>
        <button className="reset-btn" onClick={() => reset()} title="Clear chat">
          🗑️
        </button>
      </div>

      <div className="messages">
        {messages.length === 0 && (
          <div className="welcome-message">
            <p>👋 Hi! I can see your product data!</p>
            <p>Try asking:</p>
            <ul>
              <li>"What is my most expensive product?"</li>
              <li>"How many products do I have?"</li>
              <li>"List all products under $100"</li>
            </ul>
            <p className="note">⚠️ Keep questions short (1024 token limit)</p>
          </div>
        )}

        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <div className="message-avatar">
              {msg.role === 'user' ? '👤' : '🤖'}
            </div>
            <div className="message-content">
              {msg.content}
            </div>
          </div>
        ))}

        {status === 'thinking' && (
          <div className="message agent">
            <div className="message-avatar">🤖</div>
            <div className="message-content thinking">
              <span className="dot">.</span>
              <span className="dot">.</span>
              <span className="dot">.</span>
            </div>
          </div>
        )}
      </div>

      <div className="input-area">
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSend()}
          placeholder={isReady ? "Ask me anything (keep it short)..." : "Loading AI model..."}
          disabled={!isReady}
        />
        <button 
          onClick={handleSend} 
          disabled={!isReady || !input.trim()}
          className="send-btn"
        >
          {isLoading ? '⏳' : '📤'}
        </button>
      </div>
    </div>
  );
}

function Footer() {
  return (
    <footer className="footer">
      <div className="footer-left">
        <span>Built with @web-agent</span>
        <span className="separator">•</span>
        <span>100% Browser</span>
        <span className="separator">•</span>
        <span>Zero API Costs</span>
      </div>
      <div className="footer-right">
        <span className="tech-badge">WebGPU</span>
        <span className="tech-badge">Gemma 2B</span>
        <span className="tech-badge">React</span>
      </div>
    </footer>
  );
}

function LoadingScreen({ message }: { message: string }) {
  return (
    <div className="screen loading-screen">
      <div className="spinner" />
      <p>{message}</p>
    </div>
  );
}

function ErrorScreen({ message }: { message: string }) {
  return (
    <div className="screen error-screen">
      <h2>⚠️ Compatibility Issue</h2>
      <p>{message}</p>
      <p className="hint">Please use Chrome 113+ or Edge 113+</p>
    </div>
  );
}

