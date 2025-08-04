"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.testHttpTraceAPI = testHttpTraceAPI;
exports.checkBackendHealth = checkBackendHealth;
// Test function to send traces via HTTP API
async function testHttpTraceAPI() {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Backend URL
    try {
        console.log('🚀 Testing HTTP Trace API...');
        // Test single trace
        const sessionId = 'http-test-session-' + Date.now();
        const testTrace = {
            id: 'http-test-trace-1',
            sessionId,
            chainId: 'http-test-chain',
            timestamp: Date.now(),
            type: 'prompt',
            status: 'completed',
            data: {
                prompt: 'Test prompt via HTTP API',
                model: 'test-model',
            },
        };
        const response = await fetch(`${baseUrl}/api/traces`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(testTrace),
        });
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        const result = await response.json();
        console.log('✅ Single trace sent successfully:', result);
        // Test batch traces
        const batchTraces = [
            {
                id: 'http-batch-trace-1',
                sessionId,
                chainId: 'http-test-chain',
                timestamp: Date.now(),
                type: 'function_call',
                status: 'completed',
                data: {
                    name: 'test_function',
                    arguments: { param: 'value' },
                },
            },
            {
                id: 'http-batch-trace-2',
                sessionId,
                chainId: 'http-test-chain',
                timestamp: Date.now() + 1000,
                type: 'response',
                status: 'completed',
                data: {
                    response: 'Batch test response',
                },
            },
        ];
        const batchResponse = await fetch(`${baseUrl}/api/traces/batch`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ traces: batchTraces }),
        });
        if (!batchResponse.ok) {
            throw new Error(`HTTP ${batchResponse.status}: ${batchResponse.statusText}`);
        }
        const batchResult = await batchResponse.json();
        console.log('✅ Batch traces sent successfully:', batchResult);
        return true;
    }
    catch (error) {
        console.error('❌ HTTP API test failed:', error);
        return false;
    }
}
// Simple health check
async function checkBackendHealth() {
    const baseUrl = import.meta.env.VITE_BACKEND_URL || 'http://localhost:3001'; // Backend URL
    try {
        const response = await fetch(`${baseUrl}/api/health`, {
            method: 'GET',
        });
        if (response.ok) {
            console.log('✅ Backend health check passed');
            return true;
        }
        else {
            console.warn('⚠️ Backend health check failed:', response.status);
            return false;
        }
    }
    catch (error) {
        console.error('❌ Backend not reachable:', error);
        return false;
    }
}
