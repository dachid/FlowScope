"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.legacyTraceAdapter = exports.languageDetector = exports.LegacyTraceAdapter = exports.LanguageDetector = void 0;
class LanguageDetector {
    detectFromTrace(trace) {
        const evidence = [];
        let language = 'javascript'; // default
        let confidence = 0;
        // Check for explicit language field
        if (trace.language) {
            evidence.push(`explicit language field: ${trace.language}`);
            language = trace.language;
            confidence = 1.0;
            return { language, confidence, evidence };
        }
        // Check metadata for language indicators
        if (trace.metadata || trace.language_metadata) {
            const metadata = trace.metadata || trace.language_metadata;
            // Python indicators
            if (metadata.python_version || metadata.pip_version || metadata.virtual_env) {
                evidence.push('Python metadata detected');
                language = 'python';
                confidence = 0.9;
            }
            // Node.js indicators
            if (metadata.node_version || metadata.npm_version) {
                evidence.push('Node.js metadata detected');
                language = 'javascript';
                confidence = 0.9;
            }
            // Go indicators
            if (metadata.go_version || metadata.go_mod) {
                evidence.push('Go metadata detected');
                language = 'go';
                confidence = 0.9;
            }
            // Java indicators
            if (metadata.java_version || metadata.maven_version || metadata.gradle_version) {
                evidence.push('Java metadata detected');
                language = 'java';
                confidence = 0.9;
            }
        }
        // Check stack trace patterns
        if (trace.stack_trace || trace.error) {
            const stackTrace = trace.stack_trace || trace.error;
            if (typeof stackTrace === 'string') {
                // Python stack trace patterns
                if (stackTrace.includes('Traceback (most recent call last)') ||
                    stackTrace.includes('File "') ||
                    stackTrace.includes('.py", line')) {
                    evidence.push('Python stack trace pattern');
                    language = 'python';
                    confidence = Math.max(confidence, 0.8);
                }
                // JavaScript/Node.js stack trace patterns
                if (stackTrace.includes('at ') &&
                    (stackTrace.includes('.js:') || stackTrace.includes('.ts:'))) {
                    evidence.push('JavaScript stack trace pattern');
                    language = 'javascript';
                    confidence = Math.max(confidence, 0.8);
                }
                // Java stack trace patterns
                if (stackTrace.includes('Exception in thread') ||
                    stackTrace.includes('at java.') ||
                    stackTrace.includes('.java:')) {
                    evidence.push('Java stack trace pattern');
                    language = 'java';
                    confidence = Math.max(confidence, 0.8);
                }
            }
        }
        // Check operation names for language-specific patterns
        if (trace.operation) {
            const operation = trace.operation.toLowerCase();
            // Python naming conventions
            if (operation.includes('_') && !operation.includes('-')) {
                evidence.push('Python naming convention (snake_case)');
                language = 'python';
                confidence = Math.max(confidence, 0.3);
            }
            // JavaScript naming conventions
            if (operation.match(/[a-z][A-Z]/)) { // camelCase
                evidence.push('JavaScript naming convention (camelCase)');
                language = 'javascript';
                confidence = Math.max(confidence, 0.3);
            }
        }
        // Check framework patterns
        if (trace.framework) {
            const framework = trace.framework.toLowerCase();
            // LangChain is primarily Python but also has JS version
            if (framework === 'langchain') {
                // Look for more specific indicators
                if (confidence < 0.5) {
                    evidence.push('LangChain framework (language ambiguous)');
                    // Default to Python for LangChain unless other evidence suggests otherwise
                    language = 'python';
                    confidence = Math.max(confidence, 0.4);
                }
            }
            // LlamaIndex is primarily Python
            if (framework === 'llamaindex') {
                evidence.push('LlamaIndex framework (typically Python)');
                language = 'python';
                confidence = Math.max(confidence, 0.7);
            }
        }
        // If still low confidence, try to infer from data structure patterns
        if (confidence < 0.5) {
            // Python often uses snake_case in dict keys
            if (this.hasSnakeCaseKeys(trace)) {
                evidence.push('snake_case keys suggest Python');
                language = 'python';
                confidence = Math.max(confidence, 0.2);
            }
            // JavaScript often uses camelCase
            if (this.hasCamelCaseKeys(trace)) {
                evidence.push('camelCase keys suggest JavaScript');
                language = 'javascript';
                confidence = Math.max(confidence, 0.2);
            }
        }
        return { language, confidence, evidence };
    }
    hasSnakeCaseKeys(obj) {
        if (typeof obj !== 'object' || obj === null)
            return false;
        const keys = Object.keys(obj);
        const snakeCaseKeys = keys.filter(key => key.includes('_') && !key.includes('-') && key === key.toLowerCase());
        return snakeCaseKeys.length > keys.length * 0.3; // 30% threshold
    }
    hasCamelCaseKeys(obj) {
        if (typeof obj !== 'object' || obj === null)
            return false;
        const keys = Object.keys(obj);
        const camelCaseKeys = keys.filter(key => /^[a-z][a-zA-Z0-9]*$/.test(key) && /[A-Z]/.test(key));
        return camelCaseKeys.length > keys.length * 0.3; // 30% threshold
    }
}
exports.LanguageDetector = LanguageDetector;
// Legacy trace adapter for backward compatibility
class LegacyTraceAdapter {
    getVersion() {
        return '0.1.0'; // Legacy version
    }
    fromLegacy(legacyTrace) {
        const detector = new LanguageDetector();
        const detection = detector.detectFromTrace(legacyTrace);
        return {
            id: legacyTrace.id,
            session_id: legacyTrace.sessionId,
            parent_id: legacyTrace.parentId,
            operation: this.mapOperation(legacyTrace),
            framework: this.mapFramework(legacyTrace),
            language: detection.language,
            start_time: new Date(legacyTrace.timestamp).toISOString(),
            end_time: legacyTrace.duration ?
                new Date(legacyTrace.timestamp + legacyTrace.duration).toISOString() :
                undefined,
            duration_ms: legacyTrace.duration,
            input: legacyTrace.data,
            output: undefined, // Legacy format doesn't separate input/output
            metadata: legacyTrace.metadata,
            status: this.mapStatus(legacyTrace.status),
            error: legacyTrace.status === 'failed' ? 'Operation failed' : undefined,
            protocol_version: '1.0',
            language_metadata: this.extractLanguageMetadata(legacyTrace),
            context: this.extractContext(legacyTrace)
        };
    }
    toLegacy(universalTrace) {
        return {
            id: universalTrace.id,
            timestamp: new Date(universalTrace.start_time).getTime(),
            sessionId: universalTrace.session_id,
            chainId: universalTrace.session_id, // Use session_id as chainId for compatibility
            type: this.mapTraceEventType(universalTrace),
            data: universalTrace.input || universalTrace.output,
            metadata: universalTrace.metadata,
            parentId: universalTrace.parent_id,
            duration: universalTrace.duration_ms,
            status: this.mapLegacyStatus(universalTrace.status)
        };
    }
    mapOperation(legacyTrace) {
        if (legacyTrace.type) {
            return legacyTrace.type;
        }
        if (legacyTrace.metadata?.operation) {
            return legacyTrace.metadata.operation;
        }
        return 'unknown_operation';
    }
    mapFramework(legacyTrace) {
        if (legacyTrace.metadata?.framework) {
            const framework = legacyTrace.metadata.framework;
            if (['langchain', 'llamaindex', 'autogen', 'crewai', 'flowise'].includes(framework)) {
                return framework;
            }
        }
        return 'custom';
    }
    mapStatus(status) {
        switch (status) {
            case 'completed': return 'success';
            case 'failed': return 'error';
            case 'cancelled': return 'cancelled';
            case 'pending': return 'pending';
            default: return 'pending';
        }
    }
    mapLegacyStatus(status) {
        switch (status) {
            case 'success': return 'completed';
            case 'error': return 'failed';
            case 'cancelled': return 'cancelled';
            case 'pending': return 'pending';
            default: return 'pending';
        }
    }
    mapTraceEventType(universalTrace) {
        const operation = universalTrace.operation.toLowerCase();
        if (operation.includes('chain'))
            return 'chain_start';
        if (operation.includes('prompt'))
            return 'prompt';
        if (operation.includes('response'))
            return 'response';
        if (operation.includes('function') || operation.includes('tool'))
            return 'function_call';
        if (operation.includes('agent'))
            return 'agent_step';
        if (universalTrace.status === 'error')
            return 'error';
        return 'chain_start'; // default
    }
    extractLanguageMetadata(legacyTrace) {
        if (legacyTrace.metadata?.language_metadata) {
            return legacyTrace.metadata.language_metadata;
        }
        return undefined;
    }
    extractContext(legacyTrace) {
        const metadata = legacyTrace.metadata;
        if (!metadata)
            return undefined;
        return {
            user_id: metadata.user_id,
            request_id: metadata.request_id,
            correlation_id: metadata.correlation_id,
            environment: metadata.environment,
            tags: metadata.tags,
            custom_attributes: metadata.custom_attributes
        };
    }
}
exports.LegacyTraceAdapter = LegacyTraceAdapter;
// Export singleton instances
exports.languageDetector = new LanguageDetector();
exports.legacyTraceAdapter = new LegacyTraceAdapter();
