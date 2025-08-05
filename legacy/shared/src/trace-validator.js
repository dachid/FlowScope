"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.traceValidator = exports.DefaultTraceValidator = void 0;
const universal_trace_1 = require("./universal-trace");
class DefaultTraceValidator {
    validate(trace) {
        const errors = [];
        const warnings = [];
        // Required fields validation
        if (!trace.id) {
            errors.push('Missing required field: id');
        }
        if (!trace.session_id) {
            errors.push('Missing required field: session_id');
        }
        if (!trace.operation) {
            errors.push('Missing required field: operation');
        }
        if (!trace.framework) {
            errors.push('Missing required field: framework');
        }
        if (!trace.language) {
            errors.push('Missing required field: language');
        }
        if (!trace.start_time) {
            errors.push('Missing required field: start_time');
        }
        if (!trace.status) {
            errors.push('Missing required field: status');
        }
        if (!trace.protocol_version) {
            errors.push('Missing required field: protocol_version');
        }
        // Format validation
        if (trace.start_time && !this.isValidISO8601(trace.start_time)) {
            errors.push('Invalid start_time format: must be ISO 8601');
        }
        if (trace.end_time && !this.isValidISO8601(trace.end_time)) {
            errors.push('Invalid end_time format: must be ISO 8601');
        }
        // Enum validation
        const validFrameworks = ['langchain', 'llamaindex', 'custom', 'autogen', 'crewai', 'flowise'];
        if (trace.framework && !validFrameworks.includes(trace.framework)) {
            errors.push(`Invalid framework: ${trace.framework}. Must be one of: ${validFrameworks.join(', ')}`);
        }
        const validLanguages = ['javascript', 'python', 'go', 'java', 'csharp', 'rust'];
        if (trace.language && !validLanguages.includes(trace.language)) {
            errors.push(`Invalid language: ${trace.language}. Must be one of: ${validLanguages.join(', ')}`);
        }
        const validStatuses = ['success', 'error', 'pending', 'cancelled'];
        if (trace.status && !validStatuses.includes(trace.status)) {
            errors.push(`Invalid status: ${trace.status}. Must be one of: ${validStatuses.join(', ')}`);
        }
        // Protocol version validation
        if (trace.protocol_version && !Object.values(universal_trace_1.PROTOCOL_VERSIONS).includes(trace.protocol_version)) {
            errors.push(`Unsupported protocol version: ${trace.protocol_version}`);
        }
        // Logical validation
        if (trace.start_time && trace.end_time) {
            const startTime = new Date(trace.start_time);
            const endTime = new Date(trace.end_time);
            if (endTime < startTime) {
                errors.push('end_time cannot be before start_time');
            }
        }
        if (trace.duration_ms && trace.duration_ms < 0) {
            errors.push('duration_ms cannot be negative');
        }
        // Warnings
        if (trace.status === 'pending' && trace.end_time) {
            warnings.push('Trace marked as pending but has end_time');
        }
        if (trace.status === 'success' && trace.error) {
            warnings.push('Trace marked as success but has error message');
        }
        if (trace.status === 'error' && !trace.error) {
            warnings.push('Trace marked as error but missing error message');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    validateBatch(batch) {
        const errors = [];
        const warnings = [];
        // Batch-level validation
        if (!batch.batch_id) {
            errors.push('Missing required field: batch_id');
        }
        if (!batch.traces || !Array.isArray(batch.traces)) {
            errors.push('Missing or invalid traces array');
            return { valid: false, errors, warnings };
        }
        if (batch.traces.length === 0) {
            warnings.push('Empty trace batch');
        }
        if (batch.traces.length > 1000) {
            warnings.push('Large batch size (>1000 traces) may impact performance');
        }
        // Validate each trace in the batch
        const sessionIds = new Set();
        for (let i = 0; i < batch.traces.length; i++) {
            const trace = batch.traces[i];
            const traceValidation = this.validate(trace);
            if (!traceValidation.valid) {
                errors.push(`Trace ${i} (${trace.id || 'unknown'}): ${traceValidation.errors.join(', ')}`);
            }
            if (traceValidation.warnings.length > 0) {
                warnings.push(`Trace ${i} (${trace.id || 'unknown'}): ${traceValidation.warnings.join(', ')}`);
            }
            // Collect session IDs for consistency check
            if (trace.session_id) {
                sessionIds.add(trace.session_id);
            }
        }
        // Check for consistency within batch
        if (sessionIds.size > 10) {
            warnings.push(`Batch contains traces from ${sessionIds.size} different sessions, consider splitting`);
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    validateSession(session) {
        const errors = [];
        const warnings = [];
        // Required fields validation
        if (!session.id) {
            errors.push('Missing required field: id');
        }
        if (!session.start_time) {
            errors.push('Missing required field: start_time');
        }
        if (!session.status) {
            errors.push('Missing required field: status');
        }
        // Format validation
        if (session.start_time && !this.isValidISO8601(session.start_time)) {
            errors.push('Invalid start_time format: must be ISO 8601');
        }
        if (session.end_time && !this.isValidISO8601(session.end_time)) {
            errors.push('Invalid end_time format: must be ISO 8601');
        }
        // Enum validation
        const validStatuses = ['active', 'completed', 'failed', 'cancelled'];
        if (session.status && !validStatuses.includes(session.status)) {
            errors.push(`Invalid status: ${session.status}. Must be one of: ${validStatuses.join(', ')}`);
        }
        // Logical validation
        if (session.start_time && session.end_time) {
            const startTime = new Date(session.start_time);
            const endTime = new Date(session.end_time);
            if (endTime < startTime) {
                errors.push('end_time cannot be before start_time');
            }
        }
        // Warnings
        if (session.status === 'active' && session.end_time) {
            warnings.push('Session marked as active but has end_time');
        }
        if (session.status !== 'active' && !session.end_time) {
            warnings.push('Completed session missing end_time');
        }
        return {
            valid: errors.length === 0,
            errors,
            warnings
        };
    }
    isValidISO8601(dateString) {
        try {
            const date = new Date(dateString);
            return date.toISOString() === dateString;
        }
        catch {
            return false;
        }
    }
}
exports.DefaultTraceValidator = DefaultTraceValidator;
// Export singleton instance
exports.traceValidator = new DefaultTraceValidator();
