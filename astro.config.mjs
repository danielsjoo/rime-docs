// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  site: 'https://danielsjoo.github.io',
  base: '/rime-docs',
  integrations: [
    starlight({
      title: 'Rime',
      description: 'Polyglot data pipelines and reproducible narratives',
      favicon: '/favicon.svg',
      customCss: ['./src/styles/custom.css'],
      // Top-bar nav (Docs / Editor / Examples) is rendered beside the text title.
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
            { label: 'Two ways to use Rime', slug: 'get-started/two-ways-to-use-rime' },
            { label: 'Install', slug: 'get-started/install' },
            { label: 'Quick start', slug: 'get-started/quick-start' },
          ],
        },
        {
          label: 'Workshops',
          items: [
            { label: 'Build a first pipeline', slug: 'workshops/first-pipeline' },
          ],
        },
        {
          label: 'Concepts',
          items: [
            { label: 'DAG specification', slug: 'concepts/dag' },
            { label: 'Nodes', slug: 'concepts/nodes' },
            { label: 'Expression language', slug: 'concepts/expressions' },
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
            { label: 'Product page', link: '/rime-docs/editor/' },
            { label: 'Getting started', slug: 'editor/getting-started' },
            { label: 'Dataset scanning', slug: 'editor/dataset-scanning' },
            { label: 'Reports', slug: 'editor/reports' },
            { label: 'Example: dag-showcase', slug: 'editor/dag-showcase' },
            { label: 'Install', slug: 'editor/install' },
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
