/**
 * Universal Trace Format v1.0
 * Standardized trace format for multi-language support
 */

export interface UniversalTraceData {
  // Core identifiers
  id: string;
  session_id: string;
  parent_id?: string;
  
  // Operation details
  operation: string;
  framework: 'langchain' | 'llamaindex' | 'custom' | 'autogen' | 'crewai' | 'flowise';
  language: 'javascript' | 'python' | 'go' | 'java' | 'csharp' | 'rust';
  
  // Timing
  start_time: string; // ISO 8601 format
  end_time?: string;  // ISO 8601 format
  duration_ms?: number; // Calculated duration in milliseconds
  
  // Data payload
  input: any;
  output?: any;
  metadata?: Record<string, any>;
  
  // Status and error handling
  status: 'success' | 'error' | 'pending' | 'cancelled';
  error?: string;
  error_type?: string;
  stack_trace?: string;
  
  // Protocol versioning
  protocol_version: string; // '1.0'
  
  // Language-specific extensions
  language_metadata?: LanguageMetadata;
  
  // Performance metrics
  performance?: PerformanceMetrics;
  
  // Context and correlation
  context?: TraceContext;
}

export interface LanguageMetadata {
  // JavaScript/TypeScript specific
  node_version?: string;
  npm_version?: string;
  
  // Python specific
  python_version?: string;
  pip_version?: string;
  virtual_env?: string;
  
  // Go specific
  go_version?: string;
  go_mod?: string;
  
  // Java specific
  java_version?: string;
  maven_version?: string;
  gradle_version?: string;
  
  // Common fields
  runtime_version?: string;
  package_manager?: string;
  dependencies?: Record<string, string>;
}

export interface PerformanceMetrics {
  memory_usage_mb?: number;
  cpu_usage_percent?: number;
  network_calls?: number;
  cache_hits?: number;
  cache_misses?: number;
  tokens_used?: number;
  api_calls?: number;
}

export interface TraceContext {
  user_id?: string;
  request_id?: string;
  correlation_id?: string;
  tenant_id?: string;
  environment?: 'development' | 'staging' | 'production' | 'test';
  region?: string;
  tags?: string[];
  custom_attributes?: Record<string, any>;
}

export interface UniversalSession {
  id: string;
  name?: string;
  start_time: string;
  end_time?: string;
  status: 'active' | 'completed' | 'failed' | 'cancelled';
  language: UniversalTraceData['language'];
  framework: UniversalTraceData['framework'];
  context?: TraceContext;
  metadata?: Record<string, any>;
  trace_count?: number;
  total_duration_ms?: number;
}

export interface TraceBatch {
  batch_id: string;
  traces: UniversalTraceData[];
  language: UniversalTraceData['language'];
  framework: UniversalTraceData['framework'];
  timestamp: string;
  metadata?: Record<string, any>;
}

// Legacy trace data adapter interface
export interface TraceDataAdapter {
  fromLegacy(legacyTrace: any): UniversalTraceData;
  toLegacy(universalTrace: UniversalTraceData): any;
  getVersion(): string;
}

// Protocol version constants
export const PROTOCOL_VERSIONS = {
  V1_0: '1.0',
  CURRENT: '1.0'
} as const;

export type ProtocolVersion = typeof PROTOCOL_VERSIONS[keyof typeof PROTOCOL_VERSIONS];

// Validation utilities
export interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface UniversalTraceValidator {
  validate(trace: UniversalTraceData): ValidationResult;
  validateBatch(batch: TraceBatch): ValidationResult;
  validateSession(session: UniversalSession): ValidationResult;
}
