/**
 * Pragmatic ESLint Configuration
 *
 * Philosophy: Catch real bugs, enable development velocity
 *
 * TIER 1 (ERROR): 12 rules - Prevents runtime crashes and critical type safety holes
 * TIER 2 (WARN): ~15 rules - Best practices, fix gradually without blocking
 * TIER 3 (OFF): Everything else - Style preferences that don't affect correctness
 *
 * Design Rationale:
 * - Focus on what TypeScript compiler can't catch (promise handling, unsafe operations)
 * - Prevent JavaScript pitfalls (==, switch exhaustiveness, type coercion)
 * - Enable fast iteration by making style rules non-blocking
 * - Reserve ERROR level for bugs that would crash in production
 *
 * See ESLINT_PRAGMATIC.md for detailed justification and migration plan
 */

import tseslint from 'typescript-eslint';

export const typescriptStrictRules = {
  // ============================================================================
  // TIER 1: ERROR - 12 Critical Rules (Prevent Runtime Crashes)
  // ============================================================================

  // 1. Ban loose equality (prevents type coercion bugs: 0 == '0', null == undefined)
  eqeqeq: ['error', 'always'],

  // 2. Require exhaustive switch statements (prevents missed enum cases)
  '@typescript-eslint/switch-exhaustiveness-check': 'error',

  // 3. Ban !. operator (prevents crash on null/undefined optional chains)
  '@typescript-eslint/no-non-null-asserted-optional-chain': 'error',

  // 4. Prevent misuse of 'new' keyword (new Number(), new String(), etc.)
  '@typescript-eslint/no-misused-new': 'error',

  // 5. Prefer as const over literal types (prevents type widening bugs)
  '@typescript-eslint/prefer-as-const': 'error',

  // 6. Ban @ts-ignore, require explanation for @ts-expect-error
  '@typescript-eslint/ban-ts-comment': [
    'error',
    {
      'ts-ignore': true, // Never allow ts-ignore
      'ts-expect-error': 'allow-with-description', // Require explanation
      'ts-nocheck': true,
      'ts-check': false,
      minimumDescriptionLength: 20, // Force meaningful explanations
    },
  ],

  // 7. Enforce consistent type imports (prevents circular dependency issues)
  '@typescript-eslint/consistent-type-imports': [
    'error',
    {
      prefer: 'type-imports',
      disallowTypeAnnotations: true,
      fixStyle: 'separate-type-imports',
    },
  ],

  // 8. Enforce consistent type exports (symmetry with imports)
  '@typescript-eslint/consistent-type-exports': [
    'error',
    {
      fixMixedExportsWithInlineTypeSpecifier: true,
    },
  ],

  // 9-11. Promise handling (WARN for migration, upgrade to ERROR post-MVP)
  // Prevents unhandled promise rejections that crash Node.js
  '@typescript-eslint/no-misused-promises': [
    'warn', // TODO: Upgrade to 'error' in post-MVP cleanup
    {
      checksConditionals: true,
      checksVoidReturn: true,
    },
  ],
  '@typescript-eslint/no-floating-promises': [
    'warn', // TODO: Upgrade to 'error' in post-MVP cleanup
    {
      ignoreVoid: false,
      ignoreIIFE: false,
    },
  ],

  // 12. Ban 'any' type (WARN for migration, upgrade to ERROR post-MVP)
  // Prevents type safety holes
  '@typescript-eslint/no-explicit-any': 'warn', // TODO: Upgrade to 'error' in post-MVP cleanup

  // ============================================================================
  // TIER 2: WARN - ~15 Best Practice Rules (Fix Gradually)
  // ============================================================================

  // Promise best practices
  '@typescript-eslint/promise-function-async': [
    'warn',
    {
      allowAny: false,
    },
  ],

  // Unsafe type operations (gradual migration from 'any' usage)
  '@typescript-eslint/no-unsafe-assignment': 'warn',
  '@typescript-eslint/no-unsafe-member-access': 'warn',
  '@typescript-eslint/no-unsafe-call': 'warn',
  '@typescript-eslint/no-unsafe-return': 'warn',
  '@typescript-eslint/no-unsafe-argument': 'warn',

  // Null safety (allow ! operator with warning for gradual migration)
  '@typescript-eslint/no-non-null-assertion': 'warn',

  // Boolean expressions (warn on implicit coercions like if (str) instead of if (str !== ''))
  '@typescript-eslint/strict-boolean-expressions': [
    'warn',
    {
      allowString: true, // Allow if (str) - too common to forbid
      allowNumber: true, // Allow if (count) - too common to forbid
      allowNullableObject: true, // Allow if (obj) - too common to forbid
      allowNullableBoolean: false,
      allowNullableString: false,
      allowNullableNumber: false,
      allowAny: false,
    },
  ],

  // Unnecessary conditions (dead code detection)
  '@typescript-eslint/no-unnecessary-condition': [
    'warn',
    {
      allowConstantLoopConditions: true,
    },
  ],

  // Modern syntax preferences
  '@typescript-eslint/prefer-nullish-coalescing': [
    'warn',
    {
      ignoreTernaryTests: true, // Allow || in ternaries
      ignoreConditionalTests: true, // Allow || in conditionals
    },
  ],
  '@typescript-eslint/prefer-optional-chain': 'warn',

  // Return await in try-catch (prevents swallowed errors)
  '@typescript-eslint/return-await': ['warn', 'in-try-catch'],

  // ============================================================================
  // TIER 3: OFF - Style & Convention Rules (Deferred)
  // ============================================================================

  // Function annotations (TypeScript infers accurately, verbose without benefit)
  '@typescript-eslint/explicit-function-return-type': 'off',
  '@typescript-eslint/explicit-module-boundary-types': 'off',
  '@typescript-eslint/explicit-member-accessibility': 'off',

  // Naming conventions (style preference, not correctness)
  '@typescript-eslint/naming-convention': 'off',

  // Type style preferences (no impact on correctness)
  '@typescript-eslint/array-type': 'off',
  '@typescript-eslint/consistent-type-definitions': 'off',
  '@typescript-eslint/sort-type-constituents': 'off',

  // Readonly preferences (too strict, many false positives)
  '@typescript-eslint/prefer-readonly': 'off',
  '@typescript-eslint/prefer-readonly-parameter-types': 'off',

  // Code style (handled by Prettier)
  '@typescript-eslint/consistent-type-assertions': 'off',
  '@typescript-eslint/no-inferrable-types': 'off',

  // Template expressions (too strict for common patterns)
  '@typescript-eslint/restrict-template-expressions': 'off',

  // Empty functions (legitimate use in callbacks, event handlers)
  '@typescript-eslint/no-empty-function': 'off',

  // Void type (legitimate in promise chains, event handlers)
  '@typescript-eslint/no-invalid-void-type': 'off',

  // Modern JS features (nice-to-have but not critical)
  '@typescript-eslint/prefer-for-of': 'off',
  '@typescript-eslint/prefer-includes': 'off',
  '@typescript-eslint/prefer-string-starts-ends-with': 'off',

  // DRY enforcement (warn level is too noisy)
  '@typescript-eslint/no-duplicate-type-constituents': 'off',
  '@typescript-eslint/no-redundant-type-constituents': 'off',
  '@typescript-eslint/no-unnecessary-type-arguments': 'off',
  '@typescript-eslint/no-unnecessary-type-constraint': 'off',
  '@typescript-eslint/no-unnecessary-type-parameters': 'off',
  '@typescript-eslint/no-unnecessary-qualifier': 'off',
  '@typescript-eslint/no-unnecessary-template-expression': 'off',

  // Generic constructors (style preference)
  '@typescript-eslint/consistent-generic-constructors': 'off',

  // Indexed object style (style preference)
  '@typescript-eslint/consistent-indexed-object-style': 'off',

  // Type import side effects (advanced use case, rare issue)
  '@typescript-eslint/no-import-type-side-effects': 'off',

  // Destructuring (too opinionated, often less readable)
  'prefer-destructuring': 'off',
};

export const typescriptStrictConfig = [
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.mts', '**/*.cts'],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: typescriptStrictRules,
  },
  // Test files: Relax type safety for mocking, keep critical error prevention
  {
    files: [
      '**/*.spec.ts',
      '**/*.spec.tsx',
      '**/*.test.ts',
      '**/*.test.tsx',
      '**/test/**/*.ts',
      '**/test/**/*.tsx',
    ],
    rules: {
      // Allow 'any' and unsafe operations in tests (mocking requires flexibility)
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-unsafe-assignment': 'off',
      '@typescript-eslint/no-unsafe-member-access': 'off',
      '@typescript-eslint/no-unsafe-call': 'off',
      '@typescript-eslint/no-unsafe-return': 'off',
      '@typescript-eslint/no-unsafe-argument': 'off',

      // Allow non-null assertions in tests (test data is often controlled)
      '@typescript-eslint/no-non-null-assertion': 'off',

      // Relax @ts-expect-error requirements in tests
      '@typescript-eslint/ban-ts-comment': [
        'warn',
        {
          'ts-ignore': 'allow-with-description',
          'ts-expect-error': 'allow-with-description',
          minimumDescriptionLength: 10, // Shorter descriptions OK in tests
        },
      ],

      // KEEP ERROR LEVEL: These prevent real bugs even in tests
      eqeqeq: ['error', 'always'], // == still causes bugs in tests
      '@typescript-eslint/switch-exhaustiveness-check': 'error', // Missed cases still bugs
    },
  },
  // Configuration files: Minimal restrictions
  {
    files: ['*.config.ts', '*.config.mjs', '*.config.js', 'eslint.config.mjs'],
    rules: {
      '@typescript-eslint/no-explicit-any': 'off',
      '@typescript-eslint/no-var-requires': 'off', // Allow require() in configs
    },
  },
];

export default typescriptStrictConfig;
