// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://rime-docs.pages.dev', // placeholder — update when domain is wired
  integrations: [
    starlight({
      title: 'Rime',
      description: 'Polyglot data pipelines and reproducible narratives',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      favicon: './src/assets/favicon.svg',
      customCss: ['./src/styles/custom.css'],
      // Top-bar nav (Docs / Editor / Examples) is rendered by SiteTitle override.
      components: {
        SiteTitle: './src/components/SiteTitle.astro',
      },
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/danielsjoo/rime' },
      ],
      sidebar: [
        {
          label: 'Get Started',
          items: [
            { label: 'What is Rime?', slug: 'get-started/what-is-rime' },
            { label: 'Install', slug: 'get-started/install' },
            { label: 'Quick start', slug: 'get-started/quick-start' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'DAG specification', slug: 'concepts/dag' },
            { label: 'Nodes', slug: 'concepts/nodes' },
            { label: 'Polyglot runtime', slug: 'concepts/polyglot' },
            { label: 'Outputs & caching', slug: 'concepts/outputs' },
            { label: 'Reports', slug: 'concepts/reports' },
          ],
        },
        {
          label: 'Script nodes (per language)',
          items: [
            { label: 'Python', slug: 'scripts/python' },
            { label: 'R', slug: 'scripts/r' },
            { label: 'JavaScript', slug: 'scripts/javascript' },
            { label: 'SQL', slug: 'scripts/sql' },
            { label: 'HTML output', slug: 'scripts/html' },
          ],
        },
        {
          label: 'Core Nodes',
          items: [{ autogenerate: { directory: 'nodes' } }],
        },
        {
          label: 'CLI',
          items: [
            { label: 'rime validate', slug: 'cli/validate' },
            { label: 'rime run', slug: 'cli/run' },
          ],
        },
        {
          label: 'Rime Editor',
          items: [
            { label: 'Overview', slug: 'editor/overview' },
            { label: 'Install', slug: 'editor/install' },
            { label: 'UI tour', slug: 'editor/ui-tour' },
            { label: 'Python & R setup', slug: 'editor/languages' },
          ],
        },
        {
          label: 'Examples',
          items: [{ autogenerate: { directory: 'examples' } }],
        },
      ],
    }),
  ],
});
