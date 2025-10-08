import nx from '@nx/eslint-plugin';

export default [
  ...nx.configs['flat/base'],
  ...nx.configs['flat/typescript'],
  ...nx.configs['flat/javascript'],
  {
    ignores: ['**/dist', '**/vite.config.*.timestamp*', '**/vitest.config.*.timestamp*'],
  },
  {
    files: ['**/*.ts', '**/*.tsx', '**/*.js', '**/*.jsx'],
    rules: {
      '@nx/enforce-module-boundaries': [
        'error',
        {
          enforceBuildableLibDependency: false, // We don't use buildable libs
          allow: ['^.*/eslint(\\.base)?\\.config\\.[cm]?[jt]s$'],
          depConstraints: [
            // Applications can depend on any library
            {
              sourceTag: 'type:app',
              onlyDependOnLibsWithTags: ['*'],
            },
            // Feature libraries can depend on anything
            {
              sourceTag: 'type:feature',
              onlyDependOnLibsWithTags: ['*'],
            },
            // UI libraries can only depend on UI and util libraries
            {
              sourceTag: 'type:ui',
              onlyDependOnLibsWithTags: ['type:ui', 'type:util'],
            },
            // Data-access libraries can only depend on data-access and util libraries
            {
              sourceTag: 'type:data-access',
              onlyDependOnLibsWithTags: ['type:data-access', 'type:util'],
            },
            // Util libraries can only depend on other util libraries
            {
              sourceTag: 'type:util',
              onlyDependOnLibsWithTags: ['type:util'],
            },
            // Shared scope can be used by anyone
            {
              sourceTag: 'scope:shared',
              onlyDependOnLibsWithTags: ['*'],
            },
            // Domain-specific scopes can use shared libraries
            {
              sourceTag: 'scope:appointments',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:appointments'],
            },
            {
              sourceTag: 'scope:clients',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:clients'],
            },
            {
              sourceTag: 'scope:billing',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:billing'],
            },
            {
              sourceTag: 'scope:staff',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:staff'],
            },
            {
              sourceTag: 'scope:auth',
              onlyDependOnLibsWithTags: ['scope:shared', 'scope:auth'],
            },
            // Platform isolation - prevent cross-platform imports
            {
              sourceTag: 'platform:client',
              onlyDependOnLibsWithTags: ['platform:client', 'platform:shared'],
            },
            {
              sourceTag: 'platform:server',
              onlyDependOnLibsWithTags: ['platform:server', 'platform:shared'],
            },
          ],
        },
      ],
    },
  },
  {
    // Ban console.log in backend code (use logger instead)
    files: [
      'apps/backend/**/*.ts',
      'libs/backend/**/*.ts',
      'libs/shared/**/!(*.spec).ts', // Shared libs except tests
    ],
    rules: {
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: [
      '**/*.ts',
      '**/*.tsx',
      '**/*.cts',
      '**/*.mts',
      '**/*.js',
      '**/*.jsx',
      '**/*.cjs',
      '**/*.mjs',
    ],
    // Override or add rules here
    rules: {},
  },
];
