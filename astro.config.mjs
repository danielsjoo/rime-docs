// @ts-check
import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';

// https://astro.build/config
export default defineConfig({
  integrations: [
    starlight({
      title: 'Rime',
      description: 'Polyglot data pipelines and reproducible narratives',
      logo: {
        src: './src/assets/logo.svg',
        replacesTitle: false,
      },
      customCss: ['./src/styles/custom.css'],
      social: [
        { icon: 'github', label: 'GitHub', href: 'https://github.com/rimekit/rime' },
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
          label: 'Node Reference',
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
