---
title: filter
description: "Keep rows matching a boolean expression."
---

A `filter` node is a named row gate. The schema stays the same; only the set of rows changes.

Good filter nodes read like cohort decisions: adults only, visits after baseline, active accounts, non-null outcomes. If the expression needs a paragraph to explain it, split the logic into an upstream `derive` with a readable feature name.

## Filter shape

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `expr` | yes | Boolean expression evaluated per row. Truthy rows are kept. |
| `metadata.label` | no | Use a readable label such as “Keep visits after baseline”; the expression itself is usually too terse for reviewers. |

## Expression guidance

- Write a boolean expression such as `[age] >= 18` or `[status] == "active"`.
- Use bracketed column refs and plain literals. Row-level functions like `coalesce([score], 0)` are fine.
- Do not hide aggregations inside a filter. Build summaries with `aggregate`, then filter the summarized table.

## Reviewing the result

The important review question is row loss. Compare input rows to output rows and make sure a zero-row result is intentional.

Expression parse or evaluation errors fail the node and downstream dependents. The best UI and report copy should point at the expression, not the whole DAG.

## Example

```yaml
- id: adults
  kind: filter
  inputs: [patients]            # length 1
  expr: "[age] >= 18"
```

## Related

- [Expression language](/rime-docs/concepts/expressions/) - syntax for row predicates
