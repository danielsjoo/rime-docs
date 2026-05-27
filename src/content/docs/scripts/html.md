---
title: HTML output
description: Produce custom HTML from a Rime DAG — for users who want to drive everything up to and including presentation. Covers the recommended report.yaml path plus the JS-emits-HTML escape hatch.
---

> **HTML is not one of Rime's four script languages.** The script enum is strictly `python | r | javascript | sql`. This page covers how to *produce* HTML output as the final artifact of a Rime pipeline — for users who want to drive the whole stack, ingestion through presentation, inside one DAG.

There are two paths to HTML output. Pick based on how much control you need.

## Path A — `report.yaml` (recommended)

The supported, opinionated path. Pair your DAG with a [`report.yaml`](/concepts/reports/) and `rime build` renders a publishable HTML document automatically.

```yaml
# report.yaml
specification_version: "1.0"
pipeline: pipeline.dag.yaml
title: "Adult cohort"
output:
  format: html
  path: outputs/cohort_report.html
sections:
  - heading: "Summary"
    blocks:
      - markdown: |
          ## Adult cohort
          Filtered to patients aged 18+, aggregated by site.
      - table:
          source: by_site
          title: "Site-level summary"
      - stat:
          source: age_t_test
          show: [t_statistic, p_value, n]
```

```bash
rime build pipeline.dag.yaml --report report.yaml
open outputs/cohort_report.html
```

You get:

- Inline CSS, no external stylesheet, no JS framework
- Clean semantic HTML for tables and stat callouts
- Captured matplotlib figures from Python script nodes
- Section navigation if you have multiple sections
- Reproducible — same DAG outputs + same `report.yaml` = byte-identical HTML

**Use this path for 90% of cases.** Reports, papers, internal dashboards, anything where the goal is "communicate the analysis." See [Concepts → Reports](/concepts/reports/) for the full block reference.

## Path B — JavaScript emits HTML (escape hatch)

When the [three report block kinds](/concepts/reports/#block-kinds) (markdown / table / stat) aren't enough — custom D3 visualizations, bespoke layouts, embedded interactive widgets — write a JavaScript script node that returns an HTML string and writes it to a file.

```yaml
- id: d3_narrative
  kind: script
  language: javascript
  source: scripts/d3_narrative.mjs
  in:
    cohort: by_site
    summary: age_t_test
```

```js
// scripts/d3_narrative.mjs
import { defineNode } from '@rimekit/runtime'
import { writeFile } from 'node:fs/promises'

export default defineNode({
  in:  { cohort: 'table', summary: 'any' },
  out: { default: 'any' },          // file path or summary object
  run: async ({ cohort, summary }) => {
    const html = renderHtml(cohort.rows, summary)
    const path = 'outputs/d3_narrative/index.html'
    await writeFile(path, html)
    return { rendered_to: path, byte_size: html.length }
  },
})

function renderHtml(rows, summary) {
  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>Narrative</title>
<style>
  body { font: 16px/1.5 system-ui; max-width: 720px; margin: 2rem auto; }
  table { border-collapse: collapse; width: 100%; }
  th, td { padding: 6px 12px; border-bottom: 1px solid #e5e7eb; text-align: left; }
  .stat { font-variant-numeric: tabular-nums; }
</style></head>
<body>
  <h1>Site summary</h1>
  <p>t-statistic: <span class="stat">${summary.t_statistic.toFixed(3)}</span>
     · p = <span class="stat">${summary.p_value.toExponential(2)}</span></p>
  <table>
    <thead><tr><th>Site</th><th>Mean age</th><th>n</th></tr></thead>
    <tbody>${rows.map(r => `<tr>
      <td>${r.site}</td>
      <td class="stat">${r.mean_age.toFixed(2)}</td>
      <td class="stat">${r.n}</td>
    </tr>`).join('')}</tbody>
  </table>
</body></html>`
}
```

The node writes the HTML to `outputs/d3_narrative/index.html` as a side effect; the function's return value is a small metadata record (path + size). Downstream nodes can chain on the metadata if they want — but most "emit HTML" nodes are terminal.

### When this path makes sense

- **D3 / Observable Plot / Vega visualizations** that need to ship with the report
- **Custom layouts** that don't fit markdown + table + stat (a multi-column dashboard, a card grid, a tabbed interface)
- **Embedded interactive widgets** (form controls, filters that work without a server)
- **Pre-rendered HTML for handoff** to a CMS, email template, or static site

### Combining with `report.yaml`

The `report.yaml` schema doesn't currently have an `html:` or `iframe:` block — you can't natively embed a Path-B HTML file inside the Path-A report. Options:

1. **Stand it up as a separate page.** The JS-emitted HTML lives at its own path (e.g. `outputs/d3_narrative/index.html`); the `report.yaml` output is the canonical landing. Link between them.
2. **Reverse the structure.** Make the JS-emitted HTML the canonical output, and pre-render a section of it from the report renderer (use markdown blocks in the JS output to mirror the report's prose).
3. **Wait for an HTML-block feature.** This is a real gap; a future report-schema revision is likely to add a way to embed JS-emitted HTML chunks.

## Limitations to know about

### HTML can't be rendered without a browser

Rime produces HTML files. It does not:

- **Render them to PNG / PDF.** No headless screenshot step. For that, add a separate Playwright / Puppeteer step downstream of `rime build`.
- **Run client-side JavaScript** during the build. If your D3 viz computes things at page load, those computations happen when a user opens the file in a browser — not at `rime run` time.
- **Validate the HTML.** No linter, no rendering check, no accessibility audit. Bad markup will silently render as broken UI.

### No live preview from the CLI

`rime build` writes the file and exits. To view it, open the `.html` in a browser, or serve the output directory:

```bash
cd outputs
python3 -m http.server 8000   # or `npx serve .`
open http://localhost:8000/cohort_report.html
```

The Rime Editor will show an inline preview of the rendered report, but the CLI itself doesn't ship a preview server.

### Reproducibility caveats for Path B

The official report renderer (Path A) is deterministic: same DAG outputs + same `report.yaml` → byte-identical HTML. JS-emitted HTML is **only as deterministic as your JS code**:

- Avoid `Date.now()`, `Math.random()`, unsorted `Object.keys(...)`, or any source of non-determinism in your render function.
- If you need a timestamp, accept it as a `params.now` value wired from the YAML — that way the input is captured in the cache key.

### Embedded assets

Path B HTML files are self-contained only if you inline everything (CSS in `<style>`, JS in `<script>`, fonts as `data:` URIs, images as base64). External `<link>` / `<script src>` / `<img src>` references will fail when you email the file or open it from a different directory.

For the simplest distribution story: **inline everything**, ship one `.html` file.

## When to choose which path

| Need | Use |
|---|---|
| Standard report with tables, stats, prose | **Path A** (`report.yaml`) |
| Single statistical narrative for publication | **Path A** |
| Custom D3 viz, bespoke layout, interactive widget | **Path B** (JS emits HTML) |
| Both a clean report AND a rich viz | **Path A + Path B**, linked from each other |
| End-to-end ETL → presentation in one DAG | Whichever fits the presentation — both run inside the same `rime build` |

## See also

- [Concepts → Reports](/concepts/reports/) — the full `report.yaml` schema reference
- [JavaScript script nodes](/scripts/javascript/) — function signature, in-process execution model, async support
- [Outputs & caching](/concepts/outputs/) — how Rime writes artifacts to disk
