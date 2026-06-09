---
title: aggregate
description: "Group rows by zero or more keys and reduce with named metrics."
---

Group rows by zero or more keys and reduce with named metrics.

## When to use

Roll-ups for reports (mean / count / sum by category). For more complex windowed reductions, use a `kind: python` node.

## Inputs

1 input. The table to aggregate.

## Outputs

`default`: one row per group, columns = `groupBy:` keys + `metrics:` results.

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

## Common pitfalls

- `groupBy:` can be empty (`[]`) for a global aggregation that produces exactly one row.
- Each metric must be a single named expression: `"[mean_age] = [age].mean()"`. Multiple metrics share one `aggregate` node.

## See also

- [Language node reference](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
