---
title: HTML output
description: Produce HTML from a Rime DAG with the built-in report, an HTML artifact node, or a JavaScript html_artifact output.
---

> **HTML is not one of Rime's four script languages.** The script enum is
> strictly `python | r | javascript | sql`. Use `kind: html` when you have an
> authored HTML file that should become a DAG artifact.

There are three paths. Use the built-in report unless you need a custom
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

## Path B - HTML artifact node

Use `kind: html` when the custom page already exists as an HTML file. Rime will
not render it during the run. It injects DAG inputs as JSON, writes the artifact,
and the report embeds it in an iframe.

```yaml
params:
  caption: { type: string, default: "Revenue by region" }

nodes:
  - id: by_region
    kind: aggregate
    inputs: [clean_events]
    groupBy: ["[region]"]
    metrics:
      - "[revenue] = [revenue].sum()"

  - id: region_chart
    kind: html
    source: reports/region_chart.html
    in:
      rows: by_region
      caption: params.caption
```

Rime writes:

```text
outputs/region_chart/default.html
```

Inside `reports/region_chart.html`, read the injected payload from
`#rime-inputs`:

```html
<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <title>Region chart</title>
  </head>
  <body>
    <h1 id="title"></h1>
    <div id="chart"></div>

    <script>
      const payload = JSON.parse(document.getElementById('rime-inputs').textContent)
      document.getElementById('title').textContent = payload.inputs.caption
      renderChart(payload.inputs.rows)
    </script>
  </body>
</html>
```

The injected payload has this shape:

```ts
{
  version: 1,
  nodeId: "region_chart",
  inputRefs: { rows: "by_region", caption: "params.caption" },
  inputs: {
    rows: [{ region: "West", revenue: 1234 }],
    caption: "Revenue by region"
  }
}
```

The HTML file itself participates in the cache key. Changing markup, CSS, or
browser-side JavaScript reruns the node.

## Path C - JavaScript emits an HTML artifact

Use a JavaScript language node when the HTML must be generated programmatically
instead of authored as a file.

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
```

The built-in report renders `html_artifact` objects in an iframe on that node's
output cell.

## When custom HTML makes sense

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

Custom HTML is only as deterministic as its source and browser-side code:

- avoid `Date.now()`, `Math.random()`, unsorted `Object.keys(...)`, or other
  nondeterministic inputs
- if you need a timestamp, accept it as a `params.now` value wired from YAML so
  the input is captured in the cache key
- inline CSS, JS, fonts, and images when you need a single portable file

## See also

- [html node](/nodes/html/) - node contract and payload shape
- [Concepts -> Reports](/concepts/reports/) - report behavior and `metadata.report`
- [JavaScript language nodes](/scripts/javascript/) - `defineNode`, row inputs, and async support
- [Outputs & caching](/concepts/outputs/) - how Rime writes artifacts to disk
