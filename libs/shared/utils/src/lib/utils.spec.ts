import { getErrorMessage } from './utils';

describe('getErrorMessage', () => {
  it('should return the message from an Error object', () => {
    const error = new Error('Custom error message');
    expect(getErrorMessage(error)).toBe('Custom error message');
  });

  it('should return the message from an API error response', () => {
    const error = {
      response: {
        data: {
          message: 'API error message',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('API error message');
  });

  it('should return the error field from an API error response', () => {
    const error = {
      response: {
        data: {
          error: 'API error field',
        },
      },
    };
    expect(getErrorMessage(error)).toBe('API error field');
  });

  it('should return string errors directly', () => {
    const error = 'String error';
    expect(getErrorMessage(error)).toBe('String error');
  });

  it('should return message from plain object with message property', () => {
    const error = { message: 'Plain object message' };
    expect(getErrorMessage(error)).toBe('Plain object message');
  });

  it('should return default message for unknown error types', () => {
    const error = { someField: 'value' };
    expect(getErrorMessage(error)).toBe('An unexpected error occurred');
  });

  it('should return custom default message when provided', () => {
    const error = null;
    expect(getErrorMessage(error, 'Custom default')).toBe('Custom default');
  });

  it('should handle undefined errors', () => {
    expect(getErrorMessage(undefined)).toBe('An unexpected error occurred');
  });
});
