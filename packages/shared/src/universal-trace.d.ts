/**
 * Universal Trace Format v1.0
 * Standardized trace format for multi-language support
 */
export interface UniversalTraceData {
    id: string;
    session_id: string;
    parent_id?: string;
    operation: string;
    framework: 'langchain' | 'llamaindex' | 'custom' | 'autogen' | 'crewai' | 'flowise';
    language: 'javascript' | 'python' | 'go' | 'java' | 'csharp' | 'rust';
    start_time: string;
    end_time?: string;
    duration_ms?: number;
    input: any;
    output?: any;
    metadata?: Record<string, any>;
    session_metadata?: Record<string, any>;
    status: 'success' | 'error' | 'pending' | 'cancelled';
    error?: string;
    error_type?: string;
    stack_trace?: string;
    protocol_version: string;
    language_metadata?: LanguageMetadata;
    performance?: PerformanceMetrics;
    context?: TraceContext;
}
export interface LanguageMetadata {
    node_version?: string;
    npm_version?: string;
    python_version?: string;
    pip_version?: string;
    virtual_env?: string;
    go_version?: string;
    go_mod?: string;
    java_version?: string;
    maven_version?: string;
    gradle_version?: string;
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
    sessionId: string;
    id: string;
    name?: string;
    start_time: string;
    end_time?: string;
    status: 'active' | 'completed' | 'failed' | 'cancelled';
    language: UniversalTraceData['language'];
    framework: UniversalTraceData['framework'];
    context?: TraceContext;
    metadata?: Record<string, any>;
    session_metadata?: Record<string, any>;
    traces: UniversalTraceData[];
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
export interface TraceDataAdapter {
    fromLegacy(legacyTrace: any): UniversalTraceData;
    toLegacy(universalTrace: UniversalTraceData): any;
    getVersion(): string;
}
export declare const PROTOCOL_VERSIONS: {
    readonly V1_0: "1.0";
    readonly CURRENT: "1.0";
};
export type ProtocolVersion = typeof PROTOCOL_VERSIONS[keyof typeof PROTOCOL_VERSIONS];
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
