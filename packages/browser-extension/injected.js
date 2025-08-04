// Injected script that runs in the page context to intercept API calls
// This script has access to the page's JavaScript context

(function() {
    'use strict';
    
    console.log('FlowScope injected script loaded');
    
    // Store original fetch and XMLHttpRequest
    const originalFetch = window.fetch;
    const originalXHR = window.XMLHttpRequest;
    
    // Intercept fetch requests
    window.fetch = function(...args) {
        const [url, options] = args;
        
        // Check if this is an LLM API call
        if (isLLMApiCall(url, options)) {
            const traceData = {
                type: 'api_request',
                method: options?.method || 'GET',
                url: url,
                headers: options?.headers || {},
                body: options?.body,
                timestamp: Date.now()
            };
            
            // Send trace event to content script
            window.dispatchEvent(new CustomEvent('flowscope_trace', {
                detail: traceData
            }));
        }
        
        // Call original fetch and intercept response
        return originalFetch.apply(this, args).then(response => {
            if (isLLMApiCall(url, options)) {
                // Clone response to read body without consuming it
                const responseClone = response.clone();
                
                responseClone.text().then(responseText => {
                    const responseTrace = {
                        type: 'api_response',
                        url: url,
                        status: response.status,
                        statusText: response.statusText,
                        headers: Object.fromEntries(response.headers.entries()),
                        body: responseText,
                        timestamp: Date.now()
                    };
                    
                    window.dispatchEvent(new CustomEvent('flowscope_trace', {
                        detail: responseTrace
                    }));
                }).catch(error => {
                    console.warn('Failed to read response body:', error);
                });
            }
            
            return response;
        });
    };
    
    // Intercept XMLHttpRequest
    class InterceptedXMLHttpRequest extends originalXHR {
        constructor() {
            super();
            this._url = null;
            this._method = null;
            this._headers = {};
            this._requestBody = null;
        }
        
        open(method, url, ...args) {
            this._method = method;
            this._url = url;
            
            if (isLLMApiCall(url)) {
                const traceData = {
                    type: 'xhr_open',
                    method: method,
                    url: url,
                    timestamp: Date.now()
                };
                
                window.dispatchEvent(new CustomEvent('flowscope_trace', {
                    detail: traceData
                }));
            }
            
            return super.open(method, url, ...args);
        }
        
        setRequestHeader(name, value) {
            this._headers[name] = value;
            return super.setRequestHeader(name, value);
        }
        
        send(body) {
            this._requestBody = body;
            
            if (isLLMApiCall(this._url)) {
                const traceData = {
                    type: 'xhr_request',
                    method: this._method,
                    url: this._url,
                    headers: this._headers,
                    body: body,
                    timestamp: Date.now()
                };
                
                window.dispatchEvent(new CustomEvent('flowscope_trace', {
                    detail: traceData
                }));
                
                // Listen for response
                this.addEventListener('readystatechange', () => {
                    if (this.readyState === 4) {
                        const responseTrace = {
                            type: 'xhr_response',
                            url: this._url,
                            status: this.status,
                            statusText: this.statusText,
                            responseText: this.responseText,
                            timestamp: Date.now()
                        };
                        
                        window.dispatchEvent(new CustomEvent('flowscope_trace', {
                            detail: responseTrace
                        }));
                    }
                });
            }
            
            return super.send(body);
        }
    }
    
    window.XMLHttpRequest = InterceptedXMLHttpRequest;
    
    // Intercept WebSocket connections for streaming responses
    const originalWebSocket = window.WebSocket;
    
    class InterceptedWebSocket extends originalWebSocket {
        constructor(url, protocols) {
            super(url, protocols);
            
            if (isLLMWebSocket(url)) {
                const traceData = {
                    type: 'websocket_connection',
                    url: url,
                    protocols: protocols,
                    timestamp: Date.now()
                };
                
                window.dispatchEvent(new CustomEvent('flowscope_trace', {
                    detail: traceData
                }));
                
                // Intercept messages
                this.addEventListener('message', (event) => {
                    const messageTrace = {
                        type: 'websocket_message',
                        url: url,
                        data: event.data,
                        timestamp: Date.now()
                    };
                    
                    window.dispatchEvent(new CustomEvent('flowscope_trace', {
                        detail: messageTrace
                    }));
                });
            }
        }
    }
    
    window.WebSocket = InterceptedWebSocket;
    
    // Helper functions to identify LLM-related requests
    function isLLMApiCall(url, options) {
        if (typeof url !== 'string') {
            url = url.toString();
        }
        
        const llmPatterns = [
            // OpenAI
            /api\.openai\.com/,
            /chat\.openai\.com.*\/conversation/,
            
            // Anthropic Claude
            /api\.anthropic\.com/,
            /claude\.ai.*\/api/,
            
            // Google Bard/Gemini
            /bard\.google\.com.*\/api/,
            /generativelanguage\.googleapis\.com/,
            
            // Hugging Face
            /api-inference\.huggingface\.co/,
            /huggingface\.co.*\/pipeline/,
            
            // Replicate
            /api\.replicate\.com/,
            
            // Local development
            /localhost.*\/chat|completion|generate/,
            
            // Common LLM endpoints
            /\/v1\/chat\/completions/,
            /\/v1\/completions/,
            /\/api\/generate/,
            /\/api\/chat/
        ];
        
        return llmPatterns.some(pattern => pattern.test(url));
    }
    
    function isLLMWebSocket(url) {
        const wsPatterns = [
            /chat\.openai\.com/,
            /claude\.ai/,
            /bard\.google\.com/,
            /localhost.*\/ws/
        ];
        
        return wsPatterns.some(pattern => pattern.test(url));
    }
    
    // Intercept specific platform APIs
    interceptChatGPTSpecific();
    interceptClaudeSpecific();
    interceptBardSpecific();
    
    function interceptChatGPTSpecific() {
        if (!window.location.href.includes('chat.openai.com')) return;
        
        // Monitor for ChatGPT-specific events
        document.addEventListener('click', (event) => {
            if (event.target.matches('[data-testid="send-button"]')) {
                const messageInput = document.querySelector('[data-testid="prompt-textarea"]');
                if (messageInput) {
                    const traceData = {
                        type: 'chatgpt_message_sent',
                        message: messageInput.value,
                        timestamp: Date.now()
                    };
                    
                    window.dispatchEvent(new CustomEvent('flowscope_trace', {
                        detail: traceData
                    }));
                }
            }
        });
    }
    
    function interceptClaudeSpecific() {
        if (!window.location.href.includes('claude.ai')) return;
        
        // Monitor for Claude-specific events
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Enter' && !event.shiftKey) {
                const messageInput = event.target.closest('[contenteditable="true"]');
                if (messageInput) {
                    const traceData = {
                        type: 'claude_message_sent',
                        message: messageInput.textContent,
                        timestamp: Date.now()
                    };
                    
                    window.dispatchEvent(new CustomEvent('flowscope_trace', {
                        detail: traceData
                    }));
                }
            }
        });
    }
    
    function interceptBardSpecific() {
        if (!window.location.href.includes('bard.google.com')) return;
        
        // Monitor for Bard-specific events
        document.addEventListener('click', (event) => {
            if (event.target.matches('button[aria-label*="Send"]')) {
                const messageInput = document.querySelector('textarea[aria-label*="Enter a prompt"]');
                if (messageInput) {
                    const traceData = {
                        type: 'bard_message_sent',
                        message: messageInput.value,
                        timestamp: Date.now()
                    };
                    
                    window.dispatchEvent(new CustomEvent('flowscope_trace', {
                        detail: traceData
                    }));
                }
            }
        });
    }
    
    console.log('FlowScope API interception initialized');
})();
