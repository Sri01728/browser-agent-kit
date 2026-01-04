/**
 * @web-agent Demo App
 * 
 * Minimal integration - only wrap components that use LLM!
 * 
 * Components inside SmartAgentProvider:
 * - DataPanel: Registers data with LLM (useRegisterData)
 * - ChatPanel: Uses LLM for chat (useSmartAgent)
 * 
 * Components outside (no LLM interaction):
 * - Header: Optional status display (works without provider)
 * - Footer: Static UI (no hooks needed)
 * 
 * Model Providers:
 * - MediaPipe (default): Uses local model files, requires WebGPU
 * - Transformers.js: Uses Hugging Face models, works with WASM fallback
 * 
 * To use Transformers.js instead:
 * ```tsx
 * import { SmartAgentProvider, TRANSFORMERS_MODELS } from '@web-agent/react';
 * 
 * <SmartAgentProvider
 *   persona={GENERAL_PERSONA}
 *   modelPath={TRANSFORMERS_MODELS.gpt2} // or gemma2b, phi2, etc.
 * />
 * ```
 */

import { useState } from 'react';
// MediaPipe imports commented out for Transformers.js testing
// import { SmartAgentProvider } from '@web-agent/react';
// import { DEMO_PRODUCTS, GENERAL_PERSONA } from './constants';
import {
  Header,
  Footer,
  // DataPanel, // Commented out - requires SmartAgentProvider
  // ChatPanel, // Commented out - requires SmartAgentProvider
  TransformersChat,
  TranslationPanel,
  TranslationTest,
} from './components';

type Tab = 'mediapipe' | 'transformers' | 'translation' | 'translation-test';

export default function App() {
  // Testing Transformers.js - MediaPipe commented out
  // Set to 'translation-test' to test transformers.js directly
  const [activeTab, setActiveTab] = useState<Tab>('translation-test');

  return (
    <div className="app">
      <Header />
      <main className="main-content">
        {/* Tab selector */}
        <div className="tab-selector" style={{ 
          display: 'flex', 
          gap: '8px', 
          padding: '16px', 
          borderBottom: '1px solid #e0e0e0',
          background: '#fafafa'
        }}>
          {/* MediaPipe tab commented out for Transformers.js testing */}
          {/* <button
            onClick={() => setActiveTab('mediapipe')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: activeTab === 'mediapipe' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'mediapipe' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: activeTab === 'mediapipe' ? '600' : '400',
            }}
          >
            MediaPipe (Gemma)
          </button> */}
          <button
            onClick={() => setActiveTab('transformers')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: activeTab === 'transformers' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'transformers' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: activeTab === 'transformers' ? '600' : '400',
            }}
          >
            Transformers.js Chat
          </button>
          <button
            onClick={() => setActiveTab('translation')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: activeTab === 'translation' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'translation' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: activeTab === 'translation' ? '600' : '400',
            }}
          >
            Translation (Adapter)
          </button>
          <button
            onClick={() => setActiveTab('translation-test')}
            style={{
              padding: '8px 16px',
              border: 'none',
              borderRadius: '4px',
              background: activeTab === 'translation-test' ? '#1976d2' : '#e0e0e0',
              color: activeTab === 'translation-test' ? 'white' : '#333',
              cursor: 'pointer',
              fontWeight: activeTab === 'translation-test' ? '600' : '400',
            }}
          >
            Translation Test (Direct)
          </button>
        </div>

        {/* MediaPipe usage commented out for Transformers.js testing */}
        {/* {activeTab === 'mediapipe' && (
        <SmartAgentProvider
          persona={GENERAL_PERSONA}
          modelPath="/models/gemma-2b-it-gpu-int4.bin"
        >
          <div className="panels-container">
            <DataPanel initialProducts={DEMO_PRODUCTS} />
            <ChatPanel />
          </div>
        </SmartAgentProvider>
        )} */}

        {activeTab === 'transformers' && (
          <div className="panels-container" style={{ 
            padding: '16px',
            height: 'calc(100vh - 200px)'
          }}>
            {/* DataPanel commented out - requires SmartAgentProvider (MediaPipe) */}
            {/* <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ marginBottom: '16px', padding: '12px', background: '#f5f5f5', borderRadius: '4px' }}>
                  📊 Data Panel
                </h3>
                <DataPanel initialProducts={DEMO_PRODUCTS} />
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
                <TransformersChat />
              </div>
            </div> */}
            <TransformersChat />
          </div>
        )}

        {activeTab === 'translation' && (
          <div className="panels-container" style={{ 
            padding: '16px',
            height: 'calc(100vh - 200px)'
          }}>
            <TranslationPanel />
          </div>
        )}

        {activeTab === 'translation-test' && (
          <div className="panels-container" style={{ 
            padding: '16px',
            height: 'calc(100vh - 200px)',
            overflow: 'auto',
          }}>
            <TranslationTest />
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
