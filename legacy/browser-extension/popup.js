// Popup script for FlowScope browser extension

class FlowScopePopup {
    constructor() {
        this.isConnected = false;
        this.isTracing = false;
        this.serverUrl = 'http://localhost:3001';
        this.sessionStartTime = null;
        this.traceCount = 0;
        this.platform = 'Unknown';
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadInitialState();
        this.startSessionTimer();
    }
    
    initializeElements() {
        this.elements = {
            status: document.getElementById('status'),
            toggleTracing: document.getElementById('toggleTracing'),
            openPanel: document.getElementById('openPanel'),
            exportTraces: document.getElementById('exportTraces'),
            connectServer: document.getElementById('connectServer'),
            serverUrl: document.getElementById('serverUrl'),
            traceCount: document.getElementById('traceCount'),
            sessionTime: document.getElementById('sessionTime'),
            platform: document.getElementById('platform')
        };
    }
    
    setupEventListeners() {
        this.elements.toggleTracing.addEventListener('click', () => {
            this.toggleTracing();
        });
        
        this.elements.openPanel.addEventListener('click', () => {
            this.openDebugPanel();
        });
        
        this.elements.exportTraces.addEventListener('click', () => {
            this.exportTraces();
        });
        
        this.elements.connectServer.addEventListener('click', () => {
            this.connectToServer();
        });
        
        this.elements.serverUrl.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.connectToServer();
            }
        });
    }
    
    async loadInitialState() {
        try {
            // Get connection status
            const connectionStatus = await this.sendMessage({ type: 'GET_CONNECTION_STATUS' });
            this.isConnected = connectionStatus.isConnected;
            this.serverUrl = connectionStatus.serverUrl;
            
            // Get platform info
            const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
            if (tab) {
                const platformInfo = await this.sendMessage({ type: 'GET_PLATFORM_INFO' });
                this.platform = platformInfo.platform;
            }
            
            // Get trace count
            const tracesData = await this.sendMessage({ type: 'GET_TRACES' });
            this.traceCount = tracesData.traces.length;
            
            this.updateUI();
        } catch (error) {
            console.error('Failed to load initial state:', error);
        }
    }
    
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else if (response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }
    
    async toggleTracing() {
        try {
            if (this.isTracing) {
                await this.sendMessage({ type: 'STOP_TRACING' });
                this.isTracing = false;
            } else {
                await this.sendMessage({ type: 'START_TRACING' });
                this.isTracing = true;
                this.sessionStartTime = Date.now();
            }
            
            this.updateUI();
        } catch (error) {
            console.error('Failed to toggle tracing:', error);
            this.showError('Failed to toggle tracing');
        }
    }
    
    async openDebugPanel() {
        try {
            // Create a new tab with the debug panel
            const panelUrl = chrome.runtime.getURL('panel.html');
            await chrome.tabs.create({ url: panelUrl });
        } catch (error) {
            console.error('Failed to open debug panel:', error);
            this.showError('Failed to open debug panel');
        }
    }
    
    async exportTraces() {
        try {
            const exportData = await this.sendMessage({ type: 'EXPORT_TRACES' });
            
            // Create and download the export file
            const blob = new Blob([JSON.stringify(exportData.data, null, 2)], {
                type: 'application/json'
            });
            
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `flowscope-traces-${new Date().toISOString().split('T')[0]}.json`;
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
            
            this.showSuccess('Traces exported successfully');
        } catch (error) {
            console.error('Failed to export traces:', error);
            this.showError('Failed to export traces');
        }
    }
    
    async connectToServer() {
        const serverUrl = this.elements.serverUrl.value.trim() || this.serverUrl;
        
        try {
            this.elements.connectServer.disabled = true;
            this.elements.connectServer.textContent = 'Connecting...';
            
            const result = await this.sendMessage({ 
                type: 'CONNECT_TO_SERVER',
                serverUrl: serverUrl
            });
            
            if (result.success) {
                this.isConnected = true;
                this.serverUrl = result.serverUrl;
                this.showSuccess('Connected to FlowScope server');
            } else {
                throw new Error('Connection failed');
            }
        } catch (error) {
            this.isConnected = false;
            console.error('Failed to connect to server:', error);
            this.showError('Failed to connect to server');
        } finally {
            this.elements.connectServer.disabled = false;
            this.elements.connectServer.textContent = 'Connect';
            this.updateUI();
        }
    }
    
    updateUI() {
        // Update connection status
        if (this.isConnected) {
            this.elements.status.className = 'status connected';
            this.elements.status.textContent = 'Connected to FlowScope server';
        } else {
            this.elements.status.className = 'status disconnected';
            this.elements.status.textContent = 'Disconnected from FlowScope server';
        }
        
        // Update server URL input
        this.elements.serverUrl.value = this.serverUrl;
        
        // Update tracing button
        if (this.isTracing) {
            this.elements.toggleTracing.textContent = 'Stop Tracing';
            this.elements.toggleTracing.className = 'btn btn-secondary';
        } else {
            this.elements.toggleTracing.textContent = 'Start Tracing';
            this.elements.toggleTracing.className = 'btn btn-primary';
        }
        
        // Enable/disable buttons based on connection status
        this.elements.toggleTracing.disabled = !this.isConnected;
        this.elements.exportTraces.disabled = this.traceCount === 0;
        
        // Update stats
        this.elements.traceCount.textContent = this.traceCount;
        this.elements.platform.textContent = this.platform;
    }
    
    startSessionTimer() {
        setInterval(() => {
            if (this.sessionStartTime) {
                const elapsed = Date.now() - this.sessionStartTime;
                const minutes = Math.floor(elapsed / 60000);
                const seconds = Math.floor((elapsed % 60000) / 1000);
                this.elements.sessionTime.textContent = `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
    }
    
    showSuccess(message) {
        this.showNotification(message, 'success');
    }
    
    showError(message) {
        this.showNotification(message, 'error');
    }
    
    showNotification(message, type) {
        // Create a simple notification (could be enhanced with a proper notification system)
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 10px;
            left: 50%;
            transform: translateX(-50%);
            padding: 8px 16px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 1000;
            ${type === 'success' ? 'background: #10b981; color: white;' : 'background: #ef4444; color: white;'}
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 3000);
    }
}

// Initialize popup when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlowScopePopup();
});
