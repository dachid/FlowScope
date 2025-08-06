// Cloud Platform Backend Utilities
// Independent utility functions for the backend

import { UniversalTraceData, ValidationResult, LanguageDetectionResult, TraceData } from '../types';

export const traceValidator = {
  validate(trace: UniversalTraceData): ValidationResult {
    const errors: string[] = [];
    
    if (!trace.id) errors.push('Trace ID is required');
    if (!trace.sessionId) errors.push('Session ID is required');
    if (!trace.operation) errors.push('Operation is required');
    if (!trace.startedAt) errors.push('Start time is required');
    if (!trace.framework) errors.push('Framework is required');
    
    return {
      isValid: errors.length === 0,
      errors,
    };
  }
};

export const languageDetector = {
  detect(trace: any): LanguageDetectionResult {
    // Simple language detection based on framework
    const framework = trace.framework?.toLowerCase() || '';
    
    if (framework.includes('python') || framework.includes('langchain')) {
      return { language: 'python', confidence: 0.9, framework };
    }
    
    if (framework.includes('javascript') || framework.includes('node')) {
      return { language: 'javascript', confidence: 0.9, framework };
    }
    
    if (framework.includes('typescript')) {
      return { language: 'typescript', confidence: 0.9, framework };
    }
    
    return { language: 'unknown', confidence: 0.1 };
  }
};

export const legacyTraceAdapter = {
  toUniversal(legacyTrace: TraceData): UniversalTraceData {
    return {
      id: legacyTrace.id,
      sessionId: legacyTrace.sessionId,
      operation: legacyTrace.type,
      startedAt: new Date(legacyTrace.timestamp),
      status: legacyTrace.status,
      framework: 'legacy',
      data: legacyTrace.data,
      metadata: legacyTrace.metadata,
      tags: legacyTrace.tags,
    };
  },
  
  fromUniversal(universalTrace: UniversalTraceData): TraceData {
    return {
      id: universalTrace.id,
      sessionId: universalTrace.sessionId,
      timestamp: universalTrace.startedAt.getTime(),
      type: universalTrace.operation,
      status: universalTrace.status,
      data: universalTrace.data,
      metadata: universalTrace.metadata,
      tags: universalTrace.tags,
    };
  }
};
