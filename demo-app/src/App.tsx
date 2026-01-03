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
  // But make it clear to use ALL provided data for ANY questions
  const GENERAL_PERSONA = `You are a helpful assistant. Always use the data provided to you to answer questions about it.`;

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
  const [activeTab, setActiveTab] = useState<'products' | 'add' | 'api'>('products');
  
  // Form state for adding new product
  const [newName, setNewName] = useState('');
  const [newPrice, setNewPrice] = useState('');
  const [newCategory, setNewCategory] = useState('');
  const [newStock, setNewStock] = useState('');

  // API data state
  const [apiData, setApiData] = useState<any[]>([]);
  const [apiLoading, setApiLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [lastFetchTime, setLastFetchTime] = useState<Date | null>(null);
  const [apiType, setApiType] = useState<'crypto' | 'weather' | 'news'>('crypto');

  // Register data in COMPACT format to save tokens
  // Make it VERY explicit for LLM - include count and numbered list
  const compactProducts = products.length > 0
    ? `Total Products: ${products.length}. Products: ${products.map((p, idx) => `${idx + 1}. ${p.name} - $${p.price}`).join(', ')}`
    : 'Total Products: 0. No products available.';
  useRegisterData('products', compactProducts);

  // Register API data in compact format - make it VERY clear for LLM
  const compactApiData = apiData.length > 0 
    ? apiData.map((item: any, idx: number) => {
        // Handle different API response formats
        if (item.symbol && item.current_price !== undefined) {
          // CoinGecko crypto format - explicit format for LLM
          const change = item.price_change_24h >= 0 ? '+' : '';
          const changePercent = item.price_change_24h ? `${change}${item.price_change_24h.toFixed(2)}%` : 'N/A';
          return `Cryptocurrency ${idx + 1}: ${item.name} (${item.symbol.toUpperCase()}) costs $${item.current_price.toLocaleString()} USD, 24h change: ${changePercent}`;
        } else if (item.name && item.temp !== undefined) {
          // Weather format - make it VERY explicit for LLM
          const condition = item.condition || 'unknown';
          const humidity = item.humidity ? `, humidity: ${item.humidity}%` : '';
          const wind = item.windSpeed ? `, wind speed: ${item.windSpeed} km/h` : '';
          return `Weather Data: The current weather in ${item.name} is ${item.temp}°C (${item.temp * 9/5 + 32}°F), conditions are ${condition}${humidity}${wind}`;
        } else if (item.title && (item.source || item.description)) {
          // News format - make it VERY explicit for LLM
          // Include full title (don't truncate) and more description to preserve names/entities
          const source = item.source || 'Unknown Source';
          const cleanDescription = item.description 
            ? item.description.replace(/<[^>]*>/g, '').replace(/\s+/g, ' ').trim().substring(0, 250) // Increased to 250 chars
            : '';
          const date = item.pubDate ? ` (${new Date(item.pubDate).toLocaleDateString()})` : '';
          // Format: Full title first (contains main info), then description with details
          // This ensures names like "Anthony Joshua" in title are always included
          return `News ${idx + 1}: "${item.title}" from ${source}${date}. ${cleanDescription ? `Details: ${cleanDescription}` : ''}`;
        } else if (item.title && item.userId) {
          // JSONPlaceholder posts format
          return `Post ${item.id}: ${item.title.substring(0, 40)}`;
        } else if (item.name && item.email) {
          // JSONPlaceholder users format
          return `User ${item.id}: ${item.name} (${item.email})`;
        } else if (item.name && item.price) {
          // Generic product format
          return `${item.name}: $${item.price}`;
        }
        return `Item ${item.id || idx + 1}`;
      }).join('; ')
    : ''; // Empty string when no data
  
  // Register API data - ensure it updates immediately when apiData changes
  // Use direct registration to avoid timing issues
  const { registerData } = useSmartAgent();
  
  useEffect(() => {
    if (compactApiData && compactApiData.length > 0) {
      console.log('🔄 API Data changed, registering:', compactApiData.substring(0, 150));
      registerData('api_data', compactApiData);
    }
    // Note: We don't unregister when empty to avoid clearing data between fetches
  }, [compactApiData, registerData]);

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

  // Fetch live data from API
  const fetchApiData = async () => {
    setApiLoading(true);
    setApiError(null);
    
    try {
      let url = '';
      let transformData = (data: any) => data;

      switch (apiType) {
        case 'crypto':
          // CoinGecko API - Live cryptocurrency prices (no API key needed)
          url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false';
          transformData = (data: any[]) => 
            data.map(coin => ({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              current_price: coin.current_price,
              price_change_24h: coin.price_change_percentage_24h,
              market_cap: coin.market_cap,
            }));
          break;
        
        case 'weather':
          // OpenWeatherMap API - Using a demo city (you can change this)
          // Note: This requires an API key, so we'll use a free alternative
          // Using wttr.in as a free weather API
          url = 'https://wttr.in/NewYork?format=j1';
          transformData = (data: any) => {
            const current = data.current_condition[0];
            return [{
              id: 'weather-ny',
              name: 'New York',
              temp: current.temp_C,
              condition: current.weatherDesc[0].value,
              humidity: current.humidity,
              windSpeed: current.windspeedKmph,
            }];
          };
          break;
        
        case 'news':
          // Using RSS2JSON API with BBC News RSS feed
          // Fallback: Try alternative RSS feeds if BBC fails
          url = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://feeds.bbci.co.uk/news/rss.xml');
          transformData = (data: any) => {
            // Handle RSS2JSON response format
            if (data.status === 'ok' && data.items && Array.isArray(data.items)) {
              return data.items.slice(0, 5).map((item: any, idx: number) => {
                const cleanDesc = (item.description || item.content || '')
                  .replace(/<[^>]*>/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .substring(0, 300); // Increased to 300 chars to preserve more context
                return {
                  id: `news-${idx}`,
                  title: item.title || 'No title',
                  description: cleanDesc,
                  link: item.link || '',
                  pubDate: item.pubDate || new Date().toISOString(),
                  source: item.author || data.feed?.title || 'BBC News',
                };
              });
            }
            
            // Fallback: Handle direct items array
            if (data.items && Array.isArray(data.items)) {
              return data.items.slice(0, 5).map((item: any, idx: number) => {
                const cleanDesc = (item.description || item.content || '')
                  .replace(/<[^>]*>/g, '')
                  .replace(/\s+/g, ' ')
                  .trim()
                  .substring(0, 300); // Increased to 300 chars
                return {
                  id: `news-${idx}`,
                  title: item.title || 'No title',
                  description: cleanDesc,
                  link: item.link || '',
                  pubDate: item.pubDate || new Date().toISOString(),
                  source: item.author || 'News Source',
                };
              });
            }
            
            return [];
          };
          break;
        
        default:
          url = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false';
      }
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }
      
      const rawData = await response.json();
      const transformedData = transformData(rawData);
      
      setApiData(transformedData);
      setLastFetchTime(new Date());
      console.log('✅ Live API data fetched:', transformedData);
    } catch (error: any) {
      console.error('❌ API fetch failed:', error);
      
      // Special fallback for news API
      if (apiType === 'news') {
        try {
          console.log('🔄 Trying alternative news source...');
          // Try alternative RSS feed (CNN)
          const fallbackUrl = 'https://api.rss2json.com/v1/api.json?rss_url=' + encodeURIComponent('https://rss.cnn.com/rss/edition.rss');
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            if (fallbackData.status === 'ok' && fallbackData.items) {
              const transformedData = fallbackData.items.slice(0, 5).map((item: any, idx: number) => ({
                id: `news-${idx}`,
                title: item.title || 'No title',
                description: (item.description || item.content || '').replace(/<[^>]*>/g, '').substring(0, 200),
                link: item.link || '',
                pubDate: item.pubDate || new Date().toISOString(),
                source: fallbackData.feed?.title || 'CNN News',
              }));
              setApiData(transformedData);
              setLastFetchTime(new Date());
              setApiError(null);
              console.log('✅ Fallback news data loaded from CNN');
              return;
            }
          }
        } catch (fallbackError) {
          console.error('❌ Fallback news API also failed:', fallbackError);
        }
      }
      
      setApiError(error.message || 'Failed to fetch live API data');
      
      // Fallback to crypto if other APIs fail
      if (apiType !== 'crypto' && apiType !== 'news') {
        try {
          const fallbackUrl = 'https://api.coingecko.com/api/v3/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=5&page=1&sparkline=false';
          const fallbackResponse = await fetch(fallbackUrl);
          if (fallbackResponse.ok) {
            const fallbackData = await fallbackResponse.json();
            setApiData(fallbackData.map((coin: any) => ({
              id: coin.id,
              name: coin.name,
              symbol: coin.symbol,
              current_price: coin.current_price,
              price_change_24h: coin.price_change_percentage_24h,
            })));
            setLastFetchTime(new Date());
            setApiError(null);
            console.log('✅ Fallback crypto data loaded');
          }
        } catch (fallbackError) {
          // Ignore fallback errors
        }
      }
    } finally {
      setApiLoading(false);
    }
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
        <button 
          className={`tab ${activeTab === 'api' ? 'active' : ''}`}
          onClick={() => setActiveTab('api')}
        >
          🌐 API Data ({apiData.length})
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

      {activeTab === 'api' && (
        <div className="api-panel">
          <div className="api-controls">
            <div className="api-type-selector">
              <label>API Type:</label>
              <select 
                value={apiType} 
                onChange={(e) => {
                  setApiType(e.target.value as 'crypto' | 'weather' | 'news');
                  setApiData([]); // Clear previous data when switching
                }}
                className="api-select"
                disabled={apiLoading}
              >
                <option value="crypto">💰 Cryptocurrency Prices</option>
                <option value="weather">🌤️ Weather Data</option>
                <option value="news">📰 News Headlines</option>
              </select>
            </div>
            <button 
              className="fetch-btn"
              onClick={fetchApiData}
              disabled={apiLoading}
            >
              {apiLoading ? '⏳ Fetching Live Data...' : '🔄 Fetch Live Data'}
            </button>
            {lastFetchTime && (
              <span className="fetch-time">
                Last fetched: {lastFetchTime.toLocaleTimeString()}
              </span>
            )}
          </div>

          {apiError && (
            <div className="api-error">
              ⚠️ {apiError}
            </div>
          )}

          {apiData.length > 0 && (
            <>
              <div className="api-results">
                <h3>
                  {apiType === 'crypto' && '💰 Live Cryptocurrency Prices'}
                  {apiType === 'weather' && '🌤️ Weather Data'}
                  {apiType === 'news' && '📰 News Headlines'}
                  {' '}({apiData.length} items)
                </h3>
                <div className="api-list">
                  {apiData.map((item: any, idx: number) => (
                    <div key={item.id || idx} className="api-item">
                      {item.symbol && item.current_price ? (
                        // Crypto format
                        <>
                          <div className="api-item-header">
                            <strong>{item.name} ({item.symbol.toUpperCase()})</strong>
                            <span className={`price-change ${item.price_change_24h >= 0 ? 'positive' : 'negative'}`}>
                              {item.price_change_24h >= 0 ? '📈' : '📉'} {item.price_change_24h?.toFixed(2)}%
                            </span>
                          </div>
                          <div className="api-price">${item.current_price.toLocaleString()}</div>
                          {item.market_cap && (
                            <div className="api-detail">Market Cap: ${(item.market_cap / 1e9).toFixed(2)}B</div>
                          )}
                        </>
                      ) : item.temp !== undefined ? (
                        // Weather format
                        <>
                          <strong>{item.name}</strong>
                          <div className="api-weather">
                            <div className="api-temp">{item.temp}°C</div>
                            <div className="api-condition">{item.condition}</div>
                            {item.humidity && <div className="api-detail">Humidity: {item.humidity}%</div>}
                            {item.windSpeed && <div className="api-detail">Wind: {item.windSpeed} km/h</div>}
                          </div>
                        </>
                      ) : item.title && item.source ? (
                        // News format
                        <>
                          <div className="api-item-header">
                            <strong>{item.title}</strong>
                            {item.pubDate && (
                              <span className="api-date">{new Date(item.pubDate).toLocaleDateString()}</span>
                            )}
                          </div>
                          <div className="api-source">Source: {item.source}</div>
                          {item.description && (
                            <div className="api-body">{item.description.replace(/<[^>]*>/g, '').substring(0, 150)}...</div>
                          )}
                        </>
                      ) : (
                        // Generic format
                        <>
                          <strong>#{item.id || idx + 1}</strong>
                          {item.title && <div className="api-title">{item.title}</div>}
                          {item.name && <div className="api-name">{item.name}</div>}
                          {item.body && <div className="api-body">{item.body.substring(0, 100)}...</div>}
                        </>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="data-context">
                <strong>🤖 LLM sees this API data (updates automatically):</strong>
                <code className="data-code">
                  {compactApiData || 'No API data registered'}
                </code>
                <p className="data-count">({apiData.length} API items registered)</p>
                <p className="hint">
                  💡 Try asking: 
                  {apiType === 'crypto' && ' "What are the current crypto prices?" or "Which cryptocurrency is most expensive?"'}
                  {apiType === 'weather' && ' "What is the weather like?" or "Tell me about the weather data"'}
                  {apiType === 'news' && ' "What news do you have?" or "Summarize the headlines"'}
                </p>
              </div>
            </>
          )}

          {apiData.length === 0 && !apiLoading && !apiError && (
            <div className="api-empty">
              <p>👆 Click "Fetch Live Data" to load real-time data from a live API</p>
              <p className="hint">
                {apiType === 'crypto' && 'Fetches live cryptocurrency prices from CoinGecko API (no API key needed)'}
                {apiType === 'weather' && 'Fetches current weather data (requires API key for production)'}
                {apiType === 'news' && 'Fetches latest news headlines (requires API key for production)'}
              </p>
            </div>
          )}
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

