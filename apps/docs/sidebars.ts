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
        'architecture/frontend',
        'architecture/backend',
        'architecture/database',
        'architecture/authentication',
        'architecture/admin-crud',
      ],
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
      label: 'Guides',
      items: [
        'guides/contributing',
        'guides/claude-code',
        'guides/admin-crud-quick-start',
        'guides/type-safety',
        'guides/testing',
        'guides/changelog',
      ],
    },
  ],
};

export default sidebars;
