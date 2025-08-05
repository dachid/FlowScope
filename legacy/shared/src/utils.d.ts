/**
 * Generates a unique identifier
 */
export declare function generateId(): string;
/**
 * Gets current timestamp in milliseconds
 */
export declare function getCurrentTimestamp(): number;
/**
 * Validates email format
 */
export declare function isValidEmail(email: string): boolean;
/**
 * Creates a standardized error object
 */
export declare function createError(message: string, code?: string): Error;
/**
 * Deep clones an object
 */
export declare function deepClone<T>(obj: T): T;
/**
 * Checks if a value is empty (null, undefined, empty string, empty array, empty object)
 */
export declare function isEmpty(value: unknown): boolean;
/**
 * Formats duration in milliseconds to human readable string
 */
export declare function formatDuration(milliseconds: number): string;
/**
 * Formats file size in bytes to human readable string
 */
export declare function formatFileSize(bytes: number): string;
/**
 * Debounce function to limit function calls
 */
export declare function debounce<T extends (...args: any[]) => any>(func: T, wait: number): (...args: Parameters<T>) => void;
/**
 * Throttle function to limit function calls
 */
export declare function throttle<T extends (...args: any[]) => any>(func: T, limit: number): (...args: Parameters<T>) => void;
