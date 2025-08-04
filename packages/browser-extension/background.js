// Background service worker for FlowScope browser extension

class FlowScopeBackground {
    constructor() {
        this.isConnected = false;
        this.serverUrl = 'http://localhost:3001';
        this.traces = new Map();
        
        this.setupEventListeners();
        this.loadConfig();
    }
    
    setupEventListeners() {
        // Handle extension installation
        chrome.runtime.onInstalled.addListener(() => {
            console.log('FlowScope extension installed');
        });
        
        // Handle messages from content scripts and popup
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            this.handleMessage(message, sender, sendResponse);
            return true; // Keep the message channel open for async responses
        });
        
        // Handle tab updates to inject content scripts
        chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
            if (changeInfo.status === 'complete' && this.isSupportedUrl(tab.url)) {
                this.injectContentScript(tabId);
            }
        });
    }
    
    async handleMessage(message, sender, sendResponse) {
        try {
            switch (message.type) {
                case 'GET_CONNECTION_STATUS':
                    sendResponse({ 
                        isConnected: this.isConnected,
                        serverUrl: this.serverUrl 
                    });
                    break;
                    
                case 'CONNECT_TO_SERVER':
                    await this.connectToServer(message.serverUrl);
                    sendResponse({ 
                        success: this.isConnected,
                        serverUrl: this.serverUrl 
                    });
                    break;
                    
                case 'START_TRACING':
                    await this.startTracing(sender.tab.id);
                    sendResponse({ success: true });
                    break;
                    
                case 'STOP_TRACING':
                    await this.stopTracing(sender.tab.id);
                    sendResponse({ success: true });
                    break;
                    
                case 'NEW_TRACE':
                    await this.handleNewTrace(message.trace, sender.tab);
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_TRACES':
                    const traces = Array.from(this.traces.values());
                    sendResponse({ traces });
                    break;
                    
                case 'EXPORT_TRACES':
                    const exportData = await this.exportTraces();
                    sendResponse({ data: exportData });
                    break;
                    
                case 'GET_PLATFORM_INFO':
                    const platform = this.detectPlatform(sender.tab.url);
                    sendResponse({ platform });
                    break;
                    
                default:
                    console.warn('Unknown message type:', message.type);
                    sendResponse({ error: 'Unknown message type' });
            }
        } catch (error) {
            console.error('Error handling message:', error);
            sendResponse({ error: error.message });
        }
    }
    
    async loadConfig() {
        try {
            const result = await chrome.storage.sync.get(['serverUrl']);
            if (result.serverUrl) {
                this.serverUrl = result.serverUrl;
            }
        } catch (error) {
            console.error('Error loading config:', error);
        }
    }
    
    async saveConfig() {
        try {
            await chrome.storage.sync.set({ 
                serverUrl: this.serverUrl 
            });
        } catch (error) {
            console.error('Error saving config:', error);
        }
    }
    
    async connectToServer(serverUrl) {
        try {
            this.serverUrl = serverUrl || this.serverUrl;
            
            // Test connection with a simple ping
            const response = await fetch(`${this.serverUrl}/api/health`);
            
            if (response.ok) {
                this.isConnected = true;
                await this.saveConfig();
                console.log('Connected to FlowScope server');
            } else {
                throw new Error(`Server responded with status: ${response.status}`);
            }
        } catch (error) {
            this.isConnected = false;
            console.error('Failed to connect to server:', error);
            throw error;
        }
    }
    
    isSupportedUrl(url) {
        if (!url) return false;
        
        const supportedDomains = [
            'chat.openai.com',
            'claude.ai',
            'bard.google.com',
            'huggingface.co',
            'replicate.com'
        ];
        
        return supportedDomains.some(domain => url.includes(domain));
    }
    
    detectPlatform(url) {
        if (!url) return 'Unknown';
        
        if (url.includes('chat.openai.com')) return 'ChatGPT';
        if (url.includes('claude.ai')) return 'Claude';
        if (url.includes('bard.google.com')) return 'Bard';
        if (url.includes('huggingface.co')) return 'Hugging Face';
        if (url.includes('replicate.com')) return 'Replicate';
        
        return 'Unknown';
    }
    
    async injectContentScript(tabId) {
        try {
            await chrome.scripting.executeScript({
                target: { tabId },
                files: ['content.js']
            });
        } catch (error) {
            console.error('Failed to inject content script:', error);
        }
    }
    
    async startTracing(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, { 
                type: 'START_TRACING' 
            });
        } catch (error) {
            console.error('Failed to start tracing:', error);
        }
    }
    
    async stopTracing(tabId) {
        try {
            await chrome.tabs.sendMessage(tabId, { 
                type: 'STOP_TRACING' 
            });
        } catch (error) {
            console.error('Failed to stop tracing:', error);
        }
    }
    
    async handleNewTrace(trace, tab) {
        if (!this.isConnected) {
            console.warn('Not connected to server, storing trace locally');
        }
        
        // Store trace locally
        const traceId = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        const enrichedTrace = {
            ...trace,
            id: traceId,
            tabId: tab.id,
            url: tab.url,
            platform: this.detectPlatform(tab.url),
            timestamp: Date.now()
        };
        
        this.traces.set(traceId, enrichedTrace);
        
        // Send to server if connected
        if (this.isConnected) {
            try {
                await fetch(`${this.serverUrl}/api/traces`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(enrichedTrace)
                });
            } catch (error) {
                console.error('Failed to send trace to server:', error);
            }
        }
        
        // Update badge with trace count
        await this.updateBadge();
    }
    
    async updateBadge() {
        const count = this.traces.size;
        await chrome.action.setBadgeText({
            text: count > 0 ? count.toString() : ''
        });
        await chrome.action.setBadgeBackgroundColor({
            color: '#2563eb'
        });
    }
    
    async exportTraces() {
        const traces = Array.from(this.traces.values());
        const exportData = {
            version: '1.0',
            timestamp: new Date().toISOString(),
            traceCount: traces.length,
            traces: traces
        };
        
        return exportData;
    }
}

// Initialize the background service
const flowScopeBackground = new FlowScopeBackground();
