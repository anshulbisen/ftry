# util-formatters

Currency and number formatting utilities for the ftry application, with a focus on Indian market formatting (INR, lakhs, crores).

## Features

- **INR formatting** with Indian numbering system (lakhs, crores)
- **Multi-currency support** (INR, USD, EUR, GBP)
- **Compact notation** for large numbers (1.5K, 15L, 1.5Cr)
- **Flexible decimal handling**
- **Type-safe** with full TypeScript support
- **Well-tested** with comprehensive test coverage

## Installation

This library is part of the ftry monorepo. Import it using the path alias:

```typescript
import { formatINR, formatCurrency, formatCurrencyCompact } from '@ftry/shared/util-formatters';
```

## API Reference

### `formatCurrency(amount, options?)`

Format a number as currency with full customization.

**Parameters:**

- `amount: number | string` - The amount to format
- `options?: CurrencyFormatOptions` - Formatting options

**Options:**

- `currency?: 'INR' | 'USD' | 'EUR' | 'GBP'` - Currency code (default: 'INR')
- `locale?: string` - Locale for formatting (default: 'en-IN')
- `showSymbol?: boolean` - Whether to show currency symbol (default: true)
- `showDecimals?: boolean` - Whether to show decimal places (default: false)
- `minimumFractionDigits?: number` - Minimum decimal places
- `maximumFractionDigits?: number` - Maximum decimal places

**Examples:**

```typescript
formatCurrency(45230);
// '₹45,230'

formatCurrency(45230.5, { showDecimals: true });
// '₹45,230.50'

formatCurrency(1000, { currency: 'USD', locale: 'en-US' });
// '$1,000'

formatCurrency(45230, { showSymbol: false });
// '45,230'
```

### `formatINR(amount, showDecimals?)`

Shorthand for formatting Indian Rupees.

**Parameters:**

- `amount: number | string` - The amount to format
- `showDecimals?: boolean` - Whether to show decimal places (default: false)

**Examples:**

```typescript
formatINR(1000);
// '₹1,000'

formatINR(1234.56, true);
// '₹1,234.56'
```

### `formatCurrencyCompact(amount, options?)`

Format currency in compact notation (K for thousands, L for lakhs, Cr for crores in Indian locale).

**Parameters:**

- `amount: number | string` - The amount to format
- `options?: Omit<CurrencyFormatOptions, 'minimumFractionDigits' | 'maximumFractionDigits'>` - Formatting options

**Examples:**

```typescript
formatCurrencyCompact(1500);
// '₹1.5K'

formatCurrencyCompact(150000);
// '₹1.5L' (Indian numbering)

formatCurrencyCompact(15000000);
// '₹1.5Cr' (Indian numbering)

formatCurrencyCompact(1500000, { locale: 'en-US' });
// '₹1.5M' (Western numbering)
```

### `parseCurrency(value)`

Parse a currency string to a number.

**Parameters:**

- `value: string` - Currency string to parse

**Returns:** `number`

**Examples:**

```typescript
parseCurrency('₹45,230');
// 45230

parseCurrency('$1,234.56');
// 1234.56

parseCurrency('invalid');
// 0
```

### `formatNumber(amount, decimals?)`

Format a number with commas (no currency symbol).

**Parameters:**

- `amount: number | string` - The amount to format
- `decimals?: number` - Number of decimal places (default: 0)

**Examples:**

```typescript
formatNumber(45230);
// '45,230'

formatNumber(45230.567, 2);
// '45,230.57'

formatNumber(1000000);
// '10,00,000' (Indian numbering)
```

## Usage in Components

### Dashboard Stats

```typescript
import { formatINR } from '@ftry/shared/util-formatters';

const stats = [
  {
    title: 'Revenue',
    value: formatINR(45230),
    change: '+23%',
  },
];
```

### Invoice Display

```typescript
import { formatINR } from '@ftry/shared/util-formatters';

function Invoice({ amount }: { amount: number }) {
  return (
    <div>
      <h2>Total: {formatINR(amount, true)}</h2>
      <p>Amount: {formatINR(amount)}</p>
    </div>
  );
}
```

### Analytics Dashboard

```typescript
import { formatCurrencyCompact } from '@ftry/shared/util-formatters';

function RevenueChart({ revenue }: { revenue: number }) {
  return (
    <div>
      <span>{formatCurrencyCompact(revenue)}</span>
    </div>
  );
}
```

## Indian Numbering System

When using the `en-IN` locale (default), numbers are formatted according to the Indian numbering system:

| Range               | Format | Example |
| ------------------- | ------ | ------- |
| Thousands           | K      | ₹1.5K   |
| Lakhs (100,000)     | L      | ₹15L    |
| Crores (10,000,000) | Cr     | ₹1.5Cr  |

For Western notation, use `en-US` locale:

```typescript
formatCurrencyCompact(1500000, { locale: 'en-US' });
// '₹1.5M' instead of '₹15L'
```

## Testing

Run the test suite:

```bash
nx test util-formatters
```

All functions handle edge cases:

- Invalid input returns '₹0' or '0'
- Negative numbers are supported
- String and number inputs both work
- NaN and undefined are handled gracefully

## Type Safety

All functions are fully typed with TypeScript:

```typescript
interface CurrencyFormatOptions {
  currency?: 'INR' | 'USD' | 'EUR' | 'GBP';
  locale?: string;
  showSymbol?: boolean;
  showDecimals?: boolean;
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
}
```

## License

This library is part of the ftry project.
