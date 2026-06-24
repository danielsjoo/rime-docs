---
title: html
description: "Package an authored HTML file as a cached `html_artifact` and embed it in the generated report."
---

`html` packages a project HTML file as a cached output. Rime does not render the page during the run; it injects a JSON payload, writes the HTML artifact, and lets the generated report embed it in an iframe.

Use it when the report needs a custom browser-side visualization or interactive narrative, but the data and cache boundary should still be owned by the DAG.

## Artifact contract

| Field | Required | Notes |
| --- | --- | --- |
| `source` | yes | Project-relative HTML file, usually under `reportsDir/` such as `reports/chart.html`. |
| `in` | no | Named slot map: slot name to `nodeId`, `nodeId.output`, or `params.name`. |
| `inputs` | derived | Synthesized from `in:` for DAG traversal; do not write it by hand. |
| `metadata.report` | no | `true` by default; set `false` when you want the artifact on disk but out of the auto report. |

## Input payload

`in` is a named map from payload slot to a node ref, named output ref, or `params.name` scalar. Table refs become arrays of row objects; scalar params keep their scalar values.

The runtime injects one inert JSON script tag into the HTML: `<script type="application/json" id="rime-inputs">...</script>`. Browser-side code reads and parses that tag when the report or artifact opens.

## Output behavior

- `default` is an `html_artifact` written to `outputs/<nodeId>/default.html`.
- Auto reports render the artifact in an iframe output cell.
- The HTML source file is part of the cache key, so editing markup, CSS, or browser-side JS reruns the node.

## When not to use it

- Use `rime build` alone when the standard DAG report is enough.
- Use a JavaScript language node when the HTML itself must be generated programmatically from code instead of authored as a file.
- Use an external browser test when you need accessibility, visual regression, or screenshot assertions; Rime only writes the artifact.

## Example

```yaml
- id: site_chart
  kind: html
  source: reports/site_chart.html
  in:
    rows: by_site
    caption: params.caption
```

## Related

- [HTML output](/scripts/html/) - report output paths and JavaScript-generated alternatives
- [Reports](/concepts/reports/) - how `html_artifact` outputs render in reports
- [Outputs & caching](/concepts/outputs/) - where artifact files are written
