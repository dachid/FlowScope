// Content script for FlowScope browser extension
// Runs in the context of web pages to intercept LLM interactions

class FlowScopeContentScript {
    constructor() {
        this.isTracing = false;
        this.platform = this.detectPlatform();
        this.observers = [];
        this.traceBuffer = [];
        
        this.setupMessageListener();
        this.injectPageScript();
        this.setupPlatformIntegration();
        
        console.log(`FlowScope content script loaded for ${this.platform}`);
    }
    
    setupMessageListener() {
        chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
            switch (message.type) {
                case 'START_TRACING':
                    this.startTracing();
                    sendResponse({ success: true });
                    break;
                    
                case 'STOP_TRACING':
                    this.stopTracing();
                    sendResponse({ success: true });
                    break;
                    
                case 'GET_PLATFORM':
                    sendResponse({ platform: this.platform });
                    break;
                    
                default:
                    sendResponse({ error: 'Unknown message type' });
            }
            
            return true;
        });
    }
    
    detectPlatform() {
        const url = window.location.href;
        
        if (url.includes('chat.openai.com')) return 'ChatGPT';
        if (url.includes('claude.ai')) return 'Claude';
        if (url.includes('bard.google.com')) return 'Bard';
        if (url.includes('huggingface.co')) return 'Hugging Face';
        if (url.includes('replicate.com')) return 'Replicate';
        
        return 'Unknown';
    }
    
    injectPageScript() {
        // Inject a script that runs in the page context to intercept API calls
        const script = document.createElement('script');
        script.src = chrome.runtime.getURL('injected.js');
        script.onload = function() {
            this.remove();
        };
        (document.head || document.documentElement).appendChild(script);
        
        // Listen for messages from the injected script
        window.addEventListener('flowscope_trace', (event) => {
            if (this.isTracing) {
                this.handleTrace(event.detail);
            }
        });
    }
    
    setupPlatformIntegration() {
        switch (this.platform) {
            case 'ChatGPT':
                this.setupChatGPTIntegration();
                break;
            case 'Claude':
                this.setupClaudeIntegration();
                break;
            case 'Bard':
                this.setupBardIntegration();
                break;
            case 'Hugging Face':
                this.setupHuggingFaceIntegration();
                break;
            case 'Replicate':
                this.setupReplicateIntegration();
                break;
        }
    }
    
    setupChatGPTIntegration() {
        // Monitor for new messages in ChatGPT
        const messageObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for message containers
                            const messages = node.querySelectorAll('[data-message-author-role]');
                            messages.forEach((messageEl) => {
                                this.processChatGPTMessage(messageEl);
                            });
                        }
                    });
                }
            });
        });
        
        messageObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(messageObserver);
    }
    
    processChatGPTMessage(messageEl) {
        const role = messageEl.getAttribute('data-message-author-role');
        const messageContent = messageEl.querySelector('.markdown');
        
        if (messageContent && this.isTracing) {
            const trace = {
                type: 'llm_interaction',
                platform: 'ChatGPT',
                role: role,
                content: messageContent.textContent,
                timestamp: Date.now(),
                metadata: {
                    elementId: messageEl.id,
                    messageIndex: this.getMessageIndex(messageEl)
                }
            };
            
            this.sendTrace(trace);
        }
    }
    
    setupClaudeIntegration() {
        // Monitor for Claude conversations
        const conversationObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for message bubbles in Claude
                            const messages = node.querySelectorAll('[data-testid*="message"]');
                            messages.forEach((messageEl) => {
                                this.processClaudeMessage(messageEl);
                            });
                        }
                    });
                }
            });
        });
        
        conversationObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(conversationObserver);
    }
    
    processClaudeMessage(messageEl) {
        if (!this.isTracing) return;
        
        const content = messageEl.textContent;
        const isAssistant = messageEl.closest('[data-testid*="assistant"]');
        
        const trace = {
            type: 'llm_interaction',
            platform: 'Claude',
            role: isAssistant ? 'assistant' : 'user',
            content: content,
            timestamp: Date.now(),
            metadata: {
                elementSelector: this.getElementSelector(messageEl)
            }
        };
        
        this.sendTrace(trace);
    }
    
    setupBardIntegration() {
        // Monitor for Bard responses
        const responseObserver = new MutationObserver((mutations) => {
            mutations.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    mutation.addedNodes.forEach((node) => {
                        if (node.nodeType === Node.ELEMENT_NODE) {
                            // Look for response containers in Bard
                            const responses = node.querySelectorAll('.model-response-text');
                            responses.forEach((responseEl) => {
                                this.processBardResponse(responseEl);
                            });
                        }
                    });
                }
            });
        });
        
        responseObserver.observe(document.body, {
            childList: true,
            subtree: true
        });
        
        this.observers.push(responseObserver);
    }
    
    processBardResponse(responseEl) {
        if (!this.isTracing) return;
        
        const trace = {
            type: 'llm_interaction',
            platform: 'Bard',
            role: 'assistant',
            content: responseEl.textContent,
            timestamp: Date.now(),
            metadata: {
                responseId: responseEl.id || 'unknown'
            }
        };
        
        this.sendTrace(trace);
    }
    
    setupHuggingFaceIntegration() {
        // Monitor Hugging Face model interactions
        document.addEventListener('click', (event) => {
            if (event.target.matches('button[type="submit"]') && this.isTracing) {
                // Look for nearby input fields
                const form = event.target.closest('form');
                if (form) {
                    this.captureHuggingFaceInteraction(form);
                }
            }
        });
    }
    
    captureHuggingFaceInteraction(form) {
        const inputs = form.querySelectorAll('input, textarea');
        const inputData = {};
        
        inputs.forEach((input, index) => {
            inputData[`input_${index}`] = input.value;
        });
        
        const trace = {
            type: 'llm_interaction',
            platform: 'Hugging Face',
            role: 'user',
            content: JSON.stringify(inputData),
            timestamp: Date.now(),
            metadata: {
                formSelector: this.getElementSelector(form),
                modelPath: this.extractModelPath()
            }
        };
        
        this.sendTrace(trace);
    }
    
    setupReplicateIntegration() {
        // Monitor Replicate model runs
        document.addEventListener('submit', (event) => {
            if (this.isTracing && event.target.tagName === 'FORM') {
                this.captureReplicateRun(event.target);
            }
        });
    }
    
    captureReplicateRun(form) {
        const formData = new FormData(form);
        const inputData = {};
        
        for (let [key, value] of formData.entries()) {
            inputData[key] = value;
        }
        
        const trace = {
            type: 'llm_interaction',
            platform: 'Replicate',
            role: 'user',
            content: JSON.stringify(inputData),
            timestamp: Date.now(),
            metadata: {
                modelUrl: window.location.href,
                formData: inputData
            }
        };
        
        this.sendTrace(trace);
    }
    
    startTracing() {
        this.isTracing = true;
        console.log('FlowScope tracing started');
        
        // Add visual indicator
        this.addTracingIndicator();
    }
    
    stopTracing() {
        this.isTracing = false;
        console.log('FlowScope tracing stopped');
        
        // Remove visual indicator
        this.removeTracingIndicator();
    }
    
    addTracingIndicator() {
        const indicator = document.createElement('div');
        indicator.id = 'flowscope-indicator';
        indicator.innerHTML = '🔍 FlowScope Tracing Active';
        indicator.style.cssText = `
            position: fixed;
            top: 10px;
            right: 10px;
            background: #2563eb;
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 12px;
            z-index: 10000;
            font-family: system-ui, -apple-system, sans-serif;
        `;
        
        document.body.appendChild(indicator);
    }
    
    removeTracingIndicator() {
        const indicator = document.getElementById('flowscope-indicator');
        if (indicator) {
            indicator.remove();
        }
    }
    
    handleTrace(traceData) {
        // Handle traces from injected script
        this.sendTrace(traceData);
    }
    
    sendTrace(trace) {
        // Send trace to background script
        chrome.runtime.sendMessage({
            type: 'NEW_TRACE',
            trace: trace
        }).catch(error => {
            console.error('Failed to send trace:', error);
        });
    }
    
    getMessageIndex(messageEl) {
        const parent = messageEl.parentElement;
        return Array.from(parent.children).indexOf(messageEl);
    }
    
    getElementSelector(element) {
        let selector = element.tagName.toLowerCase();
        
        if (element.id) {
            selector += `#${element.id}`;
        }
        
        if (element.className) {
            selector += `.${element.className.split(' ').join('.')}`;
        }
        
        return selector;
    }
    
    extractModelPath() {
        // Try to extract model path from URL or page content
        const pathMatch = window.location.pathname.match(/\/([^\/]+\/[^\/]+)/);
        return pathMatch ? pathMatch[1] : 'unknown';
    }
    
    cleanup() {
        this.observers.forEach(observer => observer.disconnect());
        this.removeTracingIndicator();
    }
}

// Initialize content script
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        new FlowScopeContentScript();
    });
} else {
    new FlowScopeContentScript();
}
