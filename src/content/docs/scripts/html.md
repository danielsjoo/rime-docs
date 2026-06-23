---
title: HTML output
description: Produce HTML from a Rime DAG, either with the built-in report or a JavaScript html_artifact output.
---

> **HTML is not one of Rime's four script languages.** The script enum is
> strictly `python | r | javascript | sql`. This page covers how to produce HTML
> artifacts from a Rime pipeline.

There are two paths. Use the built-in report unless you need a fully custom
interactive page.

## Path A - DAG-driven report

The default path is `rime build`:

```bash
rime build pipeline.dag.yaml
open outputs/run_report.html
```

Rime renders one section per included node. Each node card shows status, cache
state, warnings, stdout, figures, and one output cell per runtime output.

Hide raw or noisy nodes with `metadata.report: false`:

```yaml
- id: raw_events
  kind: source
  path: data/events.csv
  metadata:
    report: false

- id: by_region
  kind: aggregate
  inputs: [clean_events]
  groupBy: ["[region]"]
  metrics:
    - "[revenue] = [revenue].sum()"
```

You get:

- Inline CSS, no external stylesheet, no JS framework
- Clean semantic HTML for tables and stat/object outputs
- Captured stdout and matplotlib figures shown once per node
- Multi-output nodes rendered as one node with multiple output cells
- Reproducible output driven by the DAG and cached artifacts

## Path B — JavaScript emits an HTML artifact

When the built-in report layout is not enough - custom D3 visualizations, bespoke
layouts, embedded interactive widgets — write a JavaScript language node that
returns an `html_artifact` object.

```yaml
- id: d3_narrative
  kind: javascript
  source: scripts/d3_narrative.mjs
  in:
    cohort: by_site
    summary: age_t_test
  out:
    default: any
```

```js
// scripts/d3_narrative.mjs
import { defineNode } from '@rimekit/runtime'

export default defineNode({
  in: { cohort: 'table', summary: 'any' },
  out: { default: 'any' },
  run: ({ cohort, summary }) => {
    const html = renderHtml(cohort.rows, summary)
    return { type: 'html_artifact', html }
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
  <p>t-statistic: <span class="stat">${summary.t_statistic.toFixed(3)}</span></p>
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

The built-in report renders `html_artifact` objects in an iframe on that node's
output cell.

## When Path B makes sense

- D3 / Observable Plot / Vega visualizations
- custom layouts that do not fit the node-card report
- embedded interactive widgets
- pre-rendered HTML for handoff to a CMS, email template, or static site

## Limitations

Rime produces HTML files. It does not render them to PNG/PDF, run browser-side
JavaScript during the build, or lint/accessibility-check custom markup.

To view CLI output:

```bash
cd outputs
python3 -m http.server 8000
open http://localhost:8000/run_report.html
```

## Reproducibility caveats for custom HTML

JS-emitted HTML is only as deterministic as your JS code:

- avoid `Date.now()`, `Math.random()`, unsorted `Object.keys(...)`, or other
  nondeterministic inputs
- if you need a timestamp, accept it as a `params.now` value wired from YAML so
  the input is captured in the cache key
- inline CSS, JS, fonts, and images when you need a single portable file

## See also

- [Concepts -> Reports](/rime-docs/concepts/reports/) - report behavior and `metadata.report`
- [JavaScript language nodes](/rime-docs/scripts/javascript/) - `defineNode`, row inputs, and async support
- [Outputs & caching](/rime-docs/concepts/outputs/) - how Rime writes artifacts to disk
