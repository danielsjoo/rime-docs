---
title: aggregate
description: "Group rows by zero or more keys and reduce with named metrics."
---

Group rows by zero or more keys and reduce with named metrics.

## Mental model

An `aggregate` node turns many rows into one row per group, or one global summary row when `groupBy: []`.

## When to use

Roll-ups for reports (mean / count / sum by category). For more complex windowed reductions, use a `kind: python` node.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `groupBy` | yes | Array of expressions. Empty array means one global summary row. |
| `metrics` | yes | One or more alias expressions like `"[mean_age] = [age].mean()"`. |

## Inputs

1 input. The table to aggregate.

## Outputs

`default`: one row per group, columns = `groupBy:` keys + `metrics:` results.

## Expression language

- `groupBy` entries and `metrics` entries use the Rime expression language.
- Metrics should be alias expressions: `"[mean_score] = [score].mean()"`.
- Common reducers include `.sum()`, `.mean()`, `.count()`, `.min()`, `.max()`, `.n_unique()`, and `.distinct()`.

## Editor and report behavior

- The preview should lead with the output shape because aggregation usually collapses rows.
- Metric names should be visible as output columns; unreadable aliases are a smell.

## Warnings and assumptions

- Metrics without aliases produce hard-to-read output columns; use alias expressions for report-quality results.
- Global aggregation (`groupBy: []`) is valid and should produce one row.

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

## Modeling notes

- `groupBy:` can be empty (`[]`) for a global aggregation that produces exactly one row.
- Each metric must be a single named expression: `"[mean_age] = [age].mean()"`. Multiple metrics share one `aggregate` node.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Expression language](/rime-docs/concepts/expressions/) — group and metric expressions
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
