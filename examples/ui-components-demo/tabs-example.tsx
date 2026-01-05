/**
 * Tabs Component Examples
 * 
 * This file demonstrates various use cases for the Tabs component.
 */

import React, { useState } from 'react';
import { Tabs } from '@web-agent/react';

export function TabsExamples() {
  const [basicTab, setBasicTab] = useState('tab1');
  const [iconTab, setIconTab] = useState('overview');
  const [verticalTab, setVerticalTab] = useState('profile');
  const [settingsTab, setSettingsTab] = useState('general');

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Tabs Component Examples</h1>

      {/* Example 1: Basic Tabs */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>1. Basic Tabs</h2>
        <p>Simple horizontal tabs with text labels.</p>
        
        <Tabs
          tabs={[
            { id: 'tab1', label: 'First Tab' },
            { id: 'tab2', label: 'Second Tab' },
            { id: 'tab3', label: 'Third Tab' },
          ]}
          activeTab={basicTab}
          onTabChange={setBasicTab}
        >
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderTop: 'none' }}>
            {basicTab === 'tab1' && <p>Content for the first tab.</p>}
            {basicTab === 'tab2' && <p>Content for the second tab.</p>}
            {basicTab === 'tab3' && <p>Content for the third tab.</p>}
          </div>
        </Tabs>
      </section>

      {/* Example 2: Tabs with Icons */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>2. Tabs with Icons</h2>
        <p>Tabs can include icons for better visual clarity.</p>
        
        <Tabs
          tabs={[
            { id: 'overview', label: 'Overview', icon: '📋' },
            { id: 'details', label: 'Details', icon: '📝' },
            { id: 'analytics', label: 'Analytics', icon: '📊' },
            { id: 'settings', label: 'Settings', icon: '⚙️' },
          ]}
          activeTab={iconTab}
          onTabChange={setIconTab}
        >
          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderTop: 'none' }}>
            {iconTab === 'overview' && (
              <div>
                <h3>Overview</h3>
                <p>Welcome to the overview section. Here you'll find a summary of key metrics.</p>
              </div>
            )}
            {iconTab === 'details' && (
              <div>
                <h3>Details</h3>
                <p>Detailed information about your project.</p>
              </div>
            )}
            {iconTab === 'analytics' && (
              <div>
                <h3>Analytics</h3>
                <p>View analytics and insights.</p>
              </div>
            )}
            {iconTab === 'settings' && (
              <div>
                <h3>Settings</h3>
                <p>Configure your preferences.</p>
              </div>
            )}
          </div>
        </Tabs>
      </section>

      {/* Example 3: Vertical Tabs */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>3. Vertical Tabs</h2>
        <p>Tabs can be oriented vertically for sidebar navigation.</p>
        
        <div style={{ display: 'flex', minHeight: '300px' }}>
          <Tabs
            tabs={[
              { id: 'profile', label: 'Profile', icon: '👤' },
              { id: 'security', label: 'Security', icon: '🔒' },
              { id: 'notifications', label: 'Notifications', icon: '🔔' },
              { id: 'billing', label: 'Billing', icon: '💳' },
            ]}
            activeTab={verticalTab}
            onTabChange={setVerticalTab}
            orientation="vertical"
          >
            <div style={{ flex: 1, padding: '1.5rem', border: '1px solid #ddd', borderLeft: 'none' }}>
              {verticalTab === 'profile' && (
                <div>
                  <h3>Profile Settings</h3>
                  <p>Manage your profile information.</p>
                  <form style={{ marginTop: '1rem' }}>
                    <div style={{ marginBottom: '1rem' }}>
                      <label>Name</label>
                      <input type="text" placeholder="Your name" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
                    </div>
                    <div style={{ marginBottom: '1rem' }}>
                      <label>Email</label>
                      <input type="email" placeholder="your@email.com" style={{ width: '100%', padding: '0.5rem', marginTop: '0.25rem' }} />
                    </div>
                  </form>
                </div>
              )}
              {verticalTab === 'security' && (
                <div>
                  <h3>Security Settings</h3>
                  <p>Manage your security preferences.</p>
                  <ul>
                    <li>Two-factor authentication</li>
                    <li>Password management</li>
                    <li>Active sessions</li>
                  </ul>
                </div>
              )}
              {verticalTab === 'notifications' && (
                <div>
                  <h3>Notification Settings</h3>
                  <p>Configure how you receive notifications.</p>
                  <div style={{ marginTop: '1rem' }}>
                    <label>
                      <input type="checkbox" defaultChecked /> Email notifications
                    </label>
                    <br />
                    <label>
                      <input type="checkbox" defaultChecked /> Push notifications
                    </label>
                    <br />
                    <label>
                      <input type="checkbox" /> SMS notifications
                    </label>
                  </div>
                </div>
              )}
              {verticalTab === 'billing' && (
                <div>
                  <h3>Billing Settings</h3>
                  <p>Manage your billing and subscription.</p>
                  <div style={{ marginTop: '1rem', padding: '1rem', backgroundColor: '#f5f5f5', borderRadius: '4px' }}>
                    <strong>Current Plan:</strong> Pro Plan ($29/month)
                    <br />
                    <strong>Next Billing Date:</strong> January 15, 2026
                  </div>
                </div>
              )}
            </div>
          </Tabs>
        </div>
      </section>

      {/* Example 4: Tabs with Disabled State */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>4. Tabs with Disabled State</h2>
        <p>Some tabs can be disabled based on conditions.</p>
        
        <Tabs
          tabs={[
            { id: 'general', label: 'General' },
            { id: 'advanced', label: 'Advanced' },
            { id: 'premium', label: 'Premium', icon: '⭐', disabled: true },
          ]}
          activeTab={settingsTab}
          onTabChange={setSettingsTab}
        >
          <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderTop: 'none' }}>
            {settingsTab === 'general' && (
              <div>
                <h3>General Settings</h3>
                <p>Basic configuration options.</p>
              </div>
            )}
            {settingsTab === 'advanced' && (
              <div>
                <h3>Advanced Settings</h3>
                <p>Advanced configuration for power users.</p>
              </div>
            )}
            {settingsTab === 'premium' && (
              <div>
                <h3>Premium Features</h3>
                <p>Upgrade to access premium features.</p>
              </div>
            )}
          </div>
        </Tabs>
        
        <p style={{ marginTop: '1rem', color: '#666', fontSize: '0.9rem' }}>
          Note: The "Premium" tab is disabled. Upgrade your account to access it.
        </p>
      </section>

      {/* Example 5: Dynamic Tabs */}
      <section style={{ marginBottom: '3rem' }}>
        <h2>5. Dynamic Tabs</h2>
        <p>Tabs can be dynamically added or removed.</p>
        
        <DynamicTabsExample />
      </section>
    </div>
  );
}

function DynamicTabsExample() {
  const [tabs, setTabs] = useState([
    { id: 'tab-1', label: 'Tab 1' },
    { id: 'tab-2', label: 'Tab 2' },
  ]);
  const [activeTab, setActiveTab] = useState('tab-1');
  const [nextId, setNextId] = useState(3);

  const addTab = () => {
    const newTab = { id: `tab-${nextId}`, label: `Tab ${nextId}` };
    setTabs([...tabs, newTab]);
    setActiveTab(newTab.id);
    setNextId(nextId + 1);
  };

  const removeTab = (tabId: string) => {
    const newTabs = tabs.filter(t => t.id !== tabId);
    setTabs(newTabs);
    if (activeTab === tabId && newTabs.length > 0) {
      setActiveTab(newTabs[0].id);
    }
  };

  return (
    <div>
      <button onClick={addTab} style={{ marginBottom: '1rem' }}>
        Add Tab
      </button>
      
      <Tabs
        tabs={tabs}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      >
        <div style={{ padding: '1.5rem', border: '1px solid #ddd', borderTop: 'none' }}>
          <p>Content for {tabs.find(t => t.id === activeTab)?.label}</p>
          
          {tabs.length > 1 && (
            <button
              onClick={() => removeTab(activeTab)}
              style={{ marginTop: '1rem', backgroundColor: '#d32f2f', color: 'white', border: 'none', padding: '0.5rem 1rem', cursor: 'pointer' }}
            >
              Remove This Tab
            </button>
          )}
        </div>
      </Tabs>
    </div>
  );
}

export default TabsExamples;

