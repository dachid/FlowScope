// Debug panel script for FlowScope browser extension

class FlowScopeDebugPanel {
    constructor() {
        this.traces = [];
        this.filteredTraces = [];
        this.selectedTrace = null;
        
        this.initializeElements();
        this.setupEventListeners();
        this.loadTraces();
        
        // Auto-refresh traces every 5 seconds
        setInterval(() => {
            this.loadTraces();
        }, 5000);
    }
    
    initializeElements() {
        this.elements = {
            refreshTraces: document.getElementById('refreshTraces'),
            clearTraces: document.getElementById('clearTraces'),
            exportTraces: document.getElementById('exportTraces'),
            totalTraces: document.getElementById('totalTraces'),
            searchInput: document.getElementById('searchInput'),
            platformFilter: document.getElementById('platformFilter'),
            traceList: document.getElementById('traceList'),
            emptyState: document.getElementById('emptyState'),
            traceDetails: document.getElementById('traceDetails'),
            traceTitle: document.getElementById('traceTitle'),
            traceMetadata: document.getElementById('traceMetadata'),
            traceContent: document.getElementById('traceContent'),
            traceHeaders: document.getElementById('traceHeaders'),
            traceRawData: document.getElementById('traceRawData')
        };
    }
    
    setupEventListeners() {
        this.elements.refreshTraces.addEventListener('click', () => {
            this.loadTraces();
        });
        
        this.elements.clearTraces.addEventListener('click', () => {
            this.clearAllTraces();
        });
        
        this.elements.exportTraces.addEventListener('click', () => {
            this.exportTraces();
        });
        
        this.elements.searchInput.addEventListener('input', () => {
            this.filterTraces();
        });
        
        this.elements.platformFilter.addEventListener('change', () => {
            this.filterTraces();
        });
    }
    
    async loadTraces() {
        try {
            const response = await this.sendMessage({ type: 'GET_TRACES' });
            this.traces = response.traces || [];
            this.filterTraces();
            this.updateStats();
        } catch (error) {
            console.error('Failed to load traces:', error);
        }
    }
    
    filterTraces() {
        const searchTerm = this.elements.searchInput.value.toLowerCase();
        const platformFilter = this.elements.platformFilter.value;
        
        this.filteredTraces = this.traces.filter(trace => {
            const matchesSearch = !searchTerm || 
                trace.type.toLowerCase().includes(searchTerm) ||
                (trace.content && trace.content.toLowerCase().includes(searchTerm)) ||
                (trace.url && trace.url.toLowerCase().includes(searchTerm));
            
            const matchesPlatform = !platformFilter || trace.platform === platformFilter;
            
            return matchesSearch && matchesPlatform;
        });
        
        this.renderTraceList();
    }
    
    renderTraceList() {
        const traceList = this.elements.traceList;
        traceList.innerHTML = '';
        
        if (this.filteredTraces.length === 0) {
            const emptyItem = document.createElement('li');
            emptyItem.className = 'trace-item';
            emptyItem.innerHTML = '<div style="text-align: center; color: #6b7280;">No traces found</div>';
            traceList.appendChild(emptyItem);
            return;
        }
        
        this.filteredTraces.forEach(trace => {
            const traceItem = this.createTraceItem(trace);
            traceList.appendChild(traceItem);
        });
    }
    
    createTraceItem(trace) {
        const item = document.createElement('li');
        item.className = 'trace-item';
        item.dataset.traceId = trace.id;
        
        const timestamp = new Date(trace.timestamp).toLocaleTimeString();
        
        item.innerHTML = `
            <div class="trace-header">
                <span class="trace-type ${trace.type}">${trace.type}</span>
                <span class="trace-timestamp">${timestamp}</span>
            </div>
            <div class="trace-platform">${trace.platform || 'Unknown'}</div>
            ${trace.url ? `<div style="font-size: 11px; color: #6b7280; margin-top: 4px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;">${trace.url}</div>` : ''}
        `;
        
        item.addEventListener('click', () => {
            this.selectTrace(trace);
        });
        
        return item;
    }
    
    selectTrace(trace) {
        // Update selection in UI
        document.querySelectorAll('.trace-item').forEach(item => {
            item.classList.remove('selected');
        });
        
        document.querySelector(`[data-trace-id="${trace.id}"]`)?.classList.add('selected');
        
        // Show trace details
        this.selectedTrace = trace;
        this.renderTraceDetails(trace);
    }
    
    renderTraceDetails(trace) {
        this.elements.emptyState.style.display = 'none';
        this.elements.traceDetails.style.display = 'block';
        
        // Title
        this.elements.traceTitle.textContent = `${trace.type} - ${trace.platform}`;
        
        // Metadata
        const metadata = {
            id: trace.id,
            type: trace.type,
            platform: trace.platform,
            timestamp: new Date(trace.timestamp).toISOString(),
            url: trace.url,
            tabId: trace.tabId
        };
        
        if (trace.metadata) {
            Object.assign(metadata, trace.metadata);
        }
        
        this.elements.traceMetadata.textContent = JSON.stringify(metadata, null, 2);
        
        // Content
        let content = '';
        if (trace.content) {
            content = trace.content;
        } else if (trace.body) {
            content = typeof trace.body === 'string' ? trace.body : JSON.stringify(trace.body, null, 2);
        } else if (trace.message) {
            content = trace.message;
        } else {
            content = 'No content available';
        }
        
        this.elements.traceContent.textContent = content;
        
        // Headers
        let headers = {};
        if (trace.headers) {
            headers = trace.headers;
        }
        
        this.elements.traceHeaders.textContent = JSON.stringify(headers, null, 2);
        
        // Raw data
        this.elements.traceRawData.textContent = JSON.stringify(trace, null, 2);
    }
    
    updateStats() {
        this.elements.totalTraces.textContent = this.traces.length;
    }
    
    async clearAllTraces() {
        if (confirm('Are you sure you want to clear all traces? This action cannot be undone.')) {
            try {
                await this.sendMessage({ type: 'CLEAR_TRACES' });
                this.traces = [];
                this.filteredTraces = [];
                this.selectedTrace = null;
                
                this.renderTraceList();
                this.updateStats();
                
                // Hide trace details
                this.elements.traceDetails.style.display = 'none';
                this.elements.emptyState.style.display = 'block';
            } catch (error) {
                console.error('Failed to clear traces:', error);
                alert('Failed to clear traces');
            }
        }
    }
    
    async exportTraces() {
        try {
            const response = await this.sendMessage({ type: 'EXPORT_TRACES' });
            
            // Create and download the export file
            const blob = new Blob([JSON.stringify(response.data, null, 2)], {
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
            
            this.showNotification('Traces exported successfully', 'success');
        } catch (error) {
            console.error('Failed to export traces:', error);
            this.showNotification('Failed to export traces', 'error');
        }
    }
    
    async sendMessage(message) {
        return new Promise((resolve, reject) => {
            chrome.runtime.sendMessage(message, (response) => {
                if (chrome.runtime.lastError) {
                    reject(chrome.runtime.lastError);
                } else if (response && response.error) {
                    reject(new Error(response.error));
                } else {
                    resolve(response);
                }
            });
        });
    }
    
    showNotification(message, type) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 16px;
            border-radius: 6px;
            font-size: 14px;
            z-index: 1000;
            ${type === 'success' ? 'background: #10b981; color: white;' : 'background: #ef4444; color: white;'}
            box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            if (notification.parentElement) {
                notification.parentElement.removeChild(notification);
            }
        }, 4000);
    }
}

// Initialize debug panel when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new FlowScopeDebugPanel();
});
