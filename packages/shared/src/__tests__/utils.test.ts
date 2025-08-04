import {
  generateId,
  getCurrentTimestamp,
  isValidEmail,
  createError,
  deepClone,
  isEmpty,
  formatDuration,
  formatFileSize,
  debounce,
  throttle,
} from '../utils';

describe('Utils', () => {
  describe('generateId', () => {
    it('should generate a unique string ID', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(typeof id1).toBe('string');
      expect(typeof id2).toBe('string');
      expect(id1).not.toBe(id2);
      expect(id1.length).toBeGreaterThan(0);
    });
  });

  describe('getCurrentTimestamp', () => {
    it('should return current timestamp as number', () => {
      const timestamp = getCurrentTimestamp();
      const now = Date.now();
      
      expect(typeof timestamp).toBe('number');
      expect(timestamp).toBeCloseTo(now, -2); // Within 100ms
    });
  });

  describe('isValidEmail', () => {
    it('should validate correct email formats', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('test+label@example.org')).toBe(true);
    });

    it('should reject invalid email formats', () => {
      expect(isValidEmail('invalid-email')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test..test@example.com')).toBe(false);
    });
  });

  describe('createError', () => {
    it('should create error with message', () => {
      const error = createError('Test error');
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
    });

    it('should create error with message and code', () => {
      const error = createError('Test error', 'TEST_CODE') as any;
      
      expect(error).toBeInstanceOf(Error);
      expect(error.message).toBe('Test error');
      expect(error.code).toBe('TEST_CODE');
    });
  });

  describe('deepClone', () => {
    it('should deep clone objects', () => {
      const original = {
        name: 'test',
        nested: {
          value: 42,
          array: [1, 2, 3],
        },
      };
      
      const cloned = deepClone(original);
      
      expect(cloned).toEqual(original);
      expect(cloned).not.toBe(original);
      expect(cloned.nested).not.toBe(original.nested);
      expect(cloned.nested.array).not.toBe(original.nested.array);
    });

    it('should handle primitive values', () => {
      expect(deepClone('string')).toBe('string');
      expect(deepClone(42)).toBe(42);
      expect(deepClone(true)).toBe(true);
      expect(deepClone(null)).toBe(null);
    });
  });

  describe('isEmpty', () => {
    it('should detect empty values', () => {
      expect(isEmpty(null)).toBe(true);
      expect(isEmpty(undefined)).toBe(true);
      expect(isEmpty('')).toBe(true);
      expect(isEmpty('   ')).toBe(true);
      expect(isEmpty([])).toBe(true);
      expect(isEmpty({})).toBe(true);
    });

    it('should detect non-empty values', () => {
      expect(isEmpty('test')).toBe(false);
      expect(isEmpty([1])).toBe(false);
      expect(isEmpty({ key: 'value' })).toBe(false);
      expect(isEmpty(0)).toBe(false);
      expect(isEmpty(false)).toBe(false);
    });
  });

  describe('formatDuration', () => {
    it('should format milliseconds', () => {
      expect(formatDuration(500)).toBe('500ms');
      expect(formatDuration(999)).toBe('999ms');
    });

    it('should format seconds', () => {
      expect(formatDuration(1000)).toBe('1s');
      expect(formatDuration(30000)).toBe('30s');
    });

    it('should format minutes and seconds', () => {
      expect(formatDuration(90000)).toBe('1m 30s');
      expect(formatDuration(125000)).toBe('2m 5s');
    });

    it('should format hours, minutes and seconds', () => {
      expect(formatDuration(3661000)).toBe('1h 1m 1s');
      expect(formatDuration(7200000)).toBe('2h 0m 0s');
    });
  });

  describe('formatFileSize', () => {
    it('should format bytes', () => {
      expect(formatFileSize(0)).toBe('0 B');
      expect(formatFileSize(512)).toBe('512 B');
    });

    it('should format kilobytes', () => {
      expect(formatFileSize(1024)).toBe('1 KB');
      expect(formatFileSize(1536)).toBe('1.5 KB');
    });

    it('should format megabytes', () => {
      expect(formatFileSize(1048576)).toBe('1 MB');
      expect(formatFileSize(2097152)).toBe('2 MB');
    });
  });

  describe('debounce', () => {
    it('should debounce function calls', (done) => {
      let callCount = 0;
      const debouncedFn = debounce(() => {
        callCount++;
      }, 100);

      debouncedFn();
      debouncedFn();
      debouncedFn();

      setTimeout(() => {
        expect(callCount).toBe(1);
        done();
      }, 150);
    });
  });

  describe('throttle', () => {
    it('should throttle function calls', (done) => {
      let callCount = 0;
      const throttledFn = throttle(() => {
        callCount++;
      }, 100);

      throttledFn();
      throttledFn();
      throttledFn();

      expect(callCount).toBe(1);

      setTimeout(() => {
        throttledFn();
        expect(callCount).toBe(2);
        done();
      }, 150);
    });
  });
});
