import { describe, it, expect } from 'vitest';
import {
  formatCurrency,
  formatINR,
  formatCurrencyCompact,
  parseCurrency,
  formatNumber,
} from './currency';

describe('Currency Formatters', () => {
  describe('formatCurrency', () => {
    it('should format INR by default', () => {
      expect(formatCurrency(45230)).toBe('₹45,230');
    });

    it('should handle decimals when showDecimals is true', () => {
      expect(formatCurrency(45230.5, { showDecimals: true })).toBe('₹45,230.50');
      expect(formatCurrency(45230.567, { showDecimals: true })).toBe('₹45,230.57');
    });

    it('should format without decimals by default', () => {
      expect(formatCurrency(45230.99)).toBe('₹45,231');
    });

    it('should format without symbol when showSymbol is false', () => {
      expect(formatCurrency(45230, { showSymbol: false })).toBe('45,230');
    });

    it('should format USD currency', () => {
      expect(formatCurrency(1000, { currency: 'USD', locale: 'en-US' })).toBe('$1,000');
    });

    it('should handle string input', () => {
      expect(formatCurrency('45230')).toBe('₹45,230');
      expect(formatCurrency('45230.50', { showDecimals: true })).toBe('₹45,230.50');
    });

    it('should handle zero', () => {
      expect(formatCurrency(0)).toBe('₹0');
    });

    it('should handle negative numbers', () => {
      expect(formatCurrency(-1000)).toBe('-₹1,000');
    });

    it('should handle invalid input', () => {
      expect(formatCurrency('invalid')).toBe('₹0');
      expect(formatCurrency(NaN)).toBe('₹0');
    });

    it('should respect custom fraction digits', () => {
      expect(
        formatCurrency(45230.567, {
          minimumFractionDigits: 3,
          maximumFractionDigits: 3,
        }),
      ).toBe('₹45,230.567');
    });
  });

  describe('formatINR', () => {
    it('should be shorthand for INR formatting', () => {
      expect(formatINR(1000)).toBe('₹1,000');
      expect(formatINR(45230)).toBe('₹45,230');
    });

    it('should handle decimals when specified', () => {
      expect(formatINR(1000.5, true)).toBe('₹1,000.50');
      expect(formatINR(1234.567, true)).toBe('₹1,234.57');
    });

    it('should handle string input', () => {
      expect(formatINR('1000')).toBe('₹1,000');
      expect(formatINR('1234.56', true)).toBe('₹1,234.56');
    });
  });

  describe('formatCurrencyCompact', () => {
    it('should format thousands with K', () => {
      expect(formatCurrencyCompact(1500)).toBe('₹1.5K');
      expect(formatCurrencyCompact(45000)).toBe('₹45K');
    });

    it('should format lakhs with L (Indian numbering)', () => {
      expect(formatCurrencyCompact(150000)).toBe('₹1.5L');
      expect(formatCurrencyCompact(4500000)).toBe('₹45L');
    });

    it('should format crores with Cr (Indian numbering)', () => {
      expect(formatCurrencyCompact(15000000)).toBe('₹1.5Cr');
    });

    it('should handle small numbers', () => {
      expect(formatCurrencyCompact(500)).toBe('₹500');
      expect(formatCurrencyCompact(999)).toBe('₹999');
    });

    it('should handle zero', () => {
      expect(formatCurrencyCompact(0)).toBe('₹0');
    });

    it('should handle negative numbers', () => {
      const result = formatCurrencyCompact(-1500);
      expect(result).toContain('-');
      expect(result).toContain('1.5K');
    });

    it('should handle string input', () => {
      expect(formatCurrencyCompact('1500')).toBe('₹1.5K');
    });

    it('should handle invalid input', () => {
      expect(formatCurrencyCompact('invalid')).toBe('₹0');
    });

    it('should format USD in compact notation', () => {
      const result = formatCurrencyCompact(1500000, {
        currency: 'USD',
        locale: 'en-US',
      });
      expect(result).toBe('$1.5M');
    });
  });

  describe('parseCurrency', () => {
    it('should parse INR currency strings', () => {
      expect(parseCurrency('₹45,230')).toBe(45230);
      expect(parseCurrency('₹45,230.50')).toBe(45230.5);
    });

    it('should parse USD currency strings', () => {
      expect(parseCurrency('$1,234')).toBe(1234);
      expect(parseCurrency('$1,234.56')).toBe(1234.56);
    });

    it('should parse EUR currency strings', () => {
      expect(parseCurrency('€1,234')).toBe(1234);
      expect(parseCurrency('€1,234.56')).toBe(1234.56);
    });

    it('should parse GBP currency strings', () => {
      expect(parseCurrency('£1,234')).toBe(1234);
      expect(parseCurrency('£1,234.56')).toBe(1234.56);
    });

    it('should handle strings with spaces', () => {
      expect(parseCurrency('₹ 45,230')).toBe(45230);
      expect(parseCurrency('$ 1,234.56')).toBe(1234.56);
    });

    it('should handle negative numbers', () => {
      expect(parseCurrency('-₹1,000')).toBe(-1000);
      expect(parseCurrency('-$1,234.56')).toBe(-1234.56);
    });

    it('should handle invalid input', () => {
      expect(parseCurrency('invalid')).toBe(0);
      expect(parseCurrency('')).toBe(0);
    });

    it('should handle plain numbers', () => {
      expect(parseCurrency('45230')).toBe(45230);
      expect(parseCurrency('1234.56')).toBe(1234.56);
    });
  });

  describe('formatNumber', () => {
    it('should format numbers with commas', () => {
      expect(formatNumber(45230)).toBe('45,230');
      expect(formatNumber(1000000)).toBe('10,00,000'); // Indian numbering
    });

    it('should handle decimals when specified', () => {
      expect(formatNumber(45230.567, 2)).toBe('45,230.57');
      expect(formatNumber(1234.5, 3)).toBe('1,234.500');
    });

    it('should handle zero decimals by default', () => {
      expect(formatNumber(45230.99)).toBe('45,231');
    });

    it('should handle string input', () => {
      expect(formatNumber('45230')).toBe('45,230');
      expect(formatNumber('1234.567', 2)).toBe('1,234.57');
    });

    it('should handle zero', () => {
      expect(formatNumber(0)).toBe('0');
    });

    it('should handle negative numbers', () => {
      expect(formatNumber(-1000)).toBe('-1,000');
      expect(formatNumber(-1234.56, 2)).toBe('-1,234.56');
    });

    it('should handle invalid input', () => {
      expect(formatNumber('invalid')).toBe('0');
      expect(formatNumber(NaN)).toBe('0');
    });
  });
});
