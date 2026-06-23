# rime-docs

Documentation site for [Rime](https://github.com/danielsjoo/rime) — polyglot data pipelines and reproducible narratives.

Built with [Astro](https://astro.build) + [Starlight](https://starlight.astro.build).

## Local development

```bash
npm install
npm run dev    # http://localhost:4321
```

## Build

```bash
npm run build       # static output → ./dist/
npm run preview     # serve the built site locally
```

## Auto-generated content

The node reference pages under `src/content/docs/nodes/` are generated from TypeScript node-kind definitions in the upstream `@rimekit/core` package. Re-run with:

```bash
npm run generate:nodes
```

## Deploy

Designed for Cloudflare Pages, Vercel, or Netlify. Build command: `npm run build`. Output directory: `dist`.

Production domains:

- `rimekit.dev` serves the current homepage from `/`.
- `docs.rimekit.dev` is the CLI/docs surface and redirects `/` to `/cli/`.
- `editor.rimekit.dev` serves the Rime Editor landing page at `/` and rewrites guide paths to the existing `/editor/*` pages.
- `www.rimekit.dev` redirects to `rimekit.dev`.

The checked-in `vercel.json` implements these host rules for Vercel. If this site is deployed on Cloudflare Pages or Netlify instead, add equivalent host redirects/rewrites in that provider and attach all three custom domains to the same static build.

## Brand

Brand assets live under `src/assets/` (logo, favicon) and `src/styles/custom.css` (Starlight token overrides). The full design exploration that led to the locked-in combo (wordmark-01 minimal + palette-b slate-tech + hero-01 DAG-frost) is preserved under `src/assets/concepts/` and `src/styles/concepts/`. See [DESIGN_GALLERY.md](DESIGN_GALLERY.md), [BRAND_BRIEF.md](BRAND_BRIEF.md), and [BRAND_INVENTORY.md](BRAND_INVENTORY.md).

## License

Apache-2.0. See [LICENSE](LICENSE).
