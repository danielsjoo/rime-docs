# Docs Improvements

Maintain this file as a running backlog for documentation, information architecture, and UI polish ideas that are not worth doing immediately.

## High impact

- Expand "Two ways to use Rime" into its own introduction page. The home page summary works, but the concept deserves a dedicated page comparing core nodes, script nodes, and mixed DAGs with examples.
- Add real screenshots or short GIFs for Rime Editor pages once the public beta UI is stable. Current editor docs are mostly descriptive placeholders.
- Turn the Examples section into a stronger product demo path: each example page should include a DAG preview, expected output, command to run, and "what this teaches" block.

## Medium impact

- Add a "choose your path" guide near the start of the docs: Editor-first, CLI-first, or embedding/runtime-first.
- Add a glossary page for recurring terms such as DAG, node ref, output slot, language node, report metadata, and content-addressed cache.
- Add a troubleshooting page for interpreter setup, missing Python/R packages, path resolution, and report rendering failures.
- Add a deployment note for publishing docs from GitHub Pages, including the required Astro `base` setting.

## UI polish

- Review the home page once real screenshots/assets are available. The current layout is clean, but it would benefit from a concrete product visual above the fold.
- Add compact visual callouts for "core node", "script node", "report", and "cache" concepts across the intro pages.
- Audit mobile navigation after each sidebar/content expansion. The docs are dense enough that mobile scan quality can regress quickly.
