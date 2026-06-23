---
title: aggregate
description: "Group rows by zero or more keys and reduce with named metrics."
---

`aggregate` turns row-level data into named summaries. It emits one row per group, or one global summary row when `groupBy: []`.

This is the node to reach for when the output columns are the story: counts by site, mean score by arm, maximum date per account, or a compact table for a report.

## Aggregation contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `groupBy` | yes | Array of expressions. Empty array means one global summary row. |
| `metrics` | yes | One or more alias expressions like `"[mean_age] = [age].mean()"`. |

## Designing metrics

- Each metric should be an alias expression, for example `"[mean_score] = [score].mean()"`.
- Keep metric names report-ready. Anonymous or machine-looking aliases make the resulting table harder to review.
- Common reducers include `.sum()`, `.mean()`, `.count()`, `.min()`, `.max()`, `.n_unique()`, and `.distinct()`.

## What changes

`default` contains the group keys plus metric columns. The row count usually collapses, so output shape is the first thing to inspect.

For more complex windowed reductions or custom statistics, move to a Python, R, JavaScript, or SQL node.

## Example

```yaml
- id: by_site
  kind: aggregate
  inputs: [data]                 # length 1
  groupBy: ["[site]"]
  metrics:
    - "[mean_score] = [score].mean()"
    - "[n] = [score].count()"
```

## Related

- [Expression language](/rime-docs/concepts/expressions/) - group and metric expressions
