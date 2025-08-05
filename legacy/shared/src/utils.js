"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateId = generateId;
exports.getCurrentTimestamp = getCurrentTimestamp;
exports.isValidEmail = isValidEmail;
exports.createError = createError;
exports.deepClone = deepClone;
exports.isEmpty = isEmpty;
exports.formatDuration = formatDuration;
exports.formatFileSize = formatFileSize;
exports.debounce = debounce;
exports.throttle = throttle;
const uuid_1 = require("uuid");
/**
 * Generates a unique identifier
 */
function generateId() {
    return (0, uuid_1.v4)();
}
/**
 * Gets current timestamp in milliseconds
 */
function getCurrentTimestamp() {
    return Date.now();
}
/**
 * Validates email format
 */
function isValidEmail(email) {
    // Email validation that allows + character and other common patterns
    const emailRegex = /^[a-zA-Z0-9]([a-zA-Z0-9._+-]*[a-zA-Z0-9])?@[a-zA-Z0-9]([a-zA-Z0-9.-]*[a-zA-Z0-9])?\.[a-zA-Z]{2,}$/;
    return emailRegex.test(email) && !email.includes('..') && !email.includes('.-') && !email.includes('-.');
}
/**
 * Creates a standardized error object
 */
function createError(message, code) {
    const error = new Error(message);
    if (code) {
        error.code = code;
    }
    return error;
}
/**
 * Deep clones an object
 */
function deepClone(obj) {
    return JSON.parse(JSON.stringify(obj));
}
/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 */
function isEmpty(value) {
    if (value === null || value === undefined)
        return true;
    if (typeof value === 'string')
        return value.trim().length === 0;
    if (Array.isArray(value))
        return value.length === 0;
    if (typeof value === 'object')
        return Object.keys(value).length === 0;
    return false;
}
/**
 * Formats duration in milliseconds to human readable string
 */
function formatDuration(milliseconds) {
    if (milliseconds < 1000) {
        return `${milliseconds}ms`;
    }
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    if (hours > 0) {
        return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
        return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
}
/**
 * Formats file size in bytes to human readable string
 */
function formatFileSize(bytes) {
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    if (bytes === 0)
        return '0 B';
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const size = bytes / Math.pow(1024, i);
    return `${Math.round(size * 100) / 100} ${sizes[i]}`;
}
/**
 * Debounce function to limit function calls
 */
function debounce(func, wait) {
    let timeout;
    return (...args) => {
        clearTimeout(timeout);
        timeout = setTimeout(() => func(...args), wait);
    };
}
/**
 * Throttle function to limit function calls
 */
function throttle(func, limit) {
    let inThrottle;
    return (...args) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
}
