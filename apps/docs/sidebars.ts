import type { SidebarsConfig } from '@docusaurus/plugin-content-docs';

// This runs in Node.js - Don't use client-side code here (browser APIs, JSX...)

/**
 * Creating a sidebar enables you to:
 - create an ordered group of docs
 - render a sidebar for each doc of that group
 - provide next/previous navigation

 The sidebars can be generated from the filesystem, or explicitly defined here.

 Create as many sidebars as you want.
 */
const sidebars: SidebarsConfig = {
  // Getting Started Sidebar
  gettingStartedSidebar: [
    {
      type: 'category',
      label: 'Getting Started',
      items: [
        'getting-started/introduction',
        'getting-started/quick-start',
        'getting-started/project-structure',
        'getting-started/development-workflow',
      ],
    },
  ],

  // Architecture Sidebar
  architectureSidebar: [
    {
      type: 'category',
      label: 'Architecture',
      items: [
        'architecture/overview',
        'architecture/nx-monorepo',
        'architecture/nx-dependency-graph',
        'architecture/frontend',
        'architecture/backend',
        'architecture/database',
        'architecture/authentication',
        'architecture/row-level-security',
        'architecture/admin-crud',
      ],
    },
    {
      type: 'category',
      label: 'Architecture Decisions',
      items: ['architecture/architecture-decisions/no-frontend-libraries'],
    },
  ],

  // API Reference Sidebar
  apiSidebar: [
    {
      type: 'category',
      label: 'API Reference',
      items: ['api/overview', 'api/authentication', 'api/admin', 'api/health'],
    },
  ],

  // Guides Sidebar
  guidesSidebar: [
    {
      type: 'category',
      label: 'Development',
      items: ['guides/contributing', 'guides/claude-code', 'guides/development-workflows'],
    },
    {
      type: 'category',
      label: 'Admin CRUD System',
      items: ['guides/admin-crud-quick-start', 'guides/admin-crud-detailed'],
    },
    {
      type: 'category',
      label: 'Testing & Quality',
      items: ['guides/type-safety', 'guides/testing'],
    },
    {
      type: 'category',
      label: 'Security & Authentication',
      items: [
        'guides/authentication',
        'guides/frontend-api-integration',
        'guides/environment-variables',
      ],
    },
    {
      type: 'category',
      label: 'Database',
      items: ['guides/database-quick-reference', 'guides/backup-restore'],
    },
    {
      type: 'category',
      label: 'Project Information',
      items: ['guides/changelog'],
    },
  ],

  // Operations Sidebar
  operationsSidebar: [
    {
      type: 'category',
      label: 'Operations',
      items: ['operations/grafana-cloud-setup'],
    },
  ],

  // Migration Sidebar
  migrationSidebar: [
    {
      type: 'category',
      label: 'Migration Guides',
      items: [
        'migration/csrf-migration',
        'migration/grafana-cloud-migration',
        'migration/cloud-migration-summary',
      ],
    },
  ],

  // Development Sidebar
  developmentSidebar: [
    {
      type: 'category',
      label: 'Development',
      items: ['development/strategic-roadmap', 'development/typescript-strictness'],
    },
  ],

  // References Sidebar
  referencesSidebar: [
    {
      type: 'category',
      label: 'References',
      items: ['references/technology-stack', 'references/claude-code-reference'],
    },
  ],
};

export default sidebars;
