export interface CurrencyFormatOptions {
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  locale?: string;
  showSymbol?: boolean;
  showDecimals?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}

/**
 * Format number as currency (Indian Rupee by default)
 *
 * @param amount - The amount to format (number or string)
 * @param options - Formatting options
 * @returns Formatted currency string
 *
 * @example
 * formatCurrency(45230) // '₹45,230'
 * formatCurrency(45230.50, { showDecimals: true }) // '₹45,230.50'
 * formatCurrency(1000, { currency: 'USD' }) // '$1,000'
 */
export function formatCurrency(
  amount: number | string,
  options: CurrencyFormatOptions = {},
): string {
  const {
    currency = 'INR',
    locale = 'en-IN',
    showSymbol = true,
    showDecimals = false,
    minimumFractionDigits = showDecimals ? 2 : 0,
    maximumFractionDigits = showDecimals ? 2 : 0,
  } = options;

  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return currency === 'INR' ? '₹0' : '$0';
  }

  if (showSymbol) {
    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(numericAmount);
  }

  return new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(numericAmount);
}

/**
 * Format Indian Rupee (shorthand)
 *
 * @param amount - The amount to format
 * @param showDecimals - Whether to show decimal places (default: false)
 * @returns Formatted INR string
 *
 * @example
 * formatINR(1000) // '₹1,000'
 * formatINR(1234.56, true) // '₹1,234.56'
 */
export function formatINR(amount: number | string, showDecimals = false): string {
  return formatCurrency(amount, { currency: 'INR', showDecimals });
}

/**
 * Format currency in compact notation (e.g., "₹1.2K", "₹3.5M")
 *
 * @param amount - The amount to format
 * @param options - Formatting options (excluding fraction digits)
 * @returns Compact currency string
 *
 * @example
 * formatCurrencyCompact(1500) // '₹1.5K'
 * formatCurrencyCompact(1500000) // '₹15L' (Indian numbering system)
 * formatCurrencyCompact(1500000, { locale: 'en-US' }) // '₹1.5M'
 */
export function formatCurrencyCompact(
  amount: number | string,
  options: Omit<CurrencyFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits'> = {},
): string {
  const { currency = 'INR', locale = 'en-IN' } = options;
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return currency === 'INR' ? '₹0' : '$0';
  }

  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(numericAmount);
}

/**
 * Parse currency string to number
 *
 * @param value - Currency string to parse
 * @returns Numeric value
 *
 * @example
 * parseCurrency('₹45,230') // 45230
 * parseCurrency('₹45,230.50') // 45230.50
 * parseCurrency('$1,234.56') // 1234.56
 */
export function parseCurrency(value: string): number {
  const cleaned = value.replace(/[₹$€£,\s]/g, '');
  return parseFloat(cleaned) || 0;
}

/**
 * Format number with commas (no currency symbol)
 *
 * @param amount - The amount to format
 * @param decimals - Number of decimal places (default: 0)
 * @returns Formatted number string
 *
 * @example
 * formatNumber(45230) // '45,230'
 * formatNumber(45230.567, 2) // '45,230.57'
 */
export function formatNumber(amount: number | string, decimals = 0): string {
  const numericAmount = typeof amount === 'string' ? parseFloat(amount) : amount;

  if (isNaN(numericAmount)) {
    return '0';
  }

  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(numericAmount);
}
