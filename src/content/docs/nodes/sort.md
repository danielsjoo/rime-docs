---
title: sort
description: "Order rows by one or more expressions."
---

`sort` changes row order without changing values or schema. That makes it easy to miss in a DAG unless the node label says why the order matters.

Use it before report tables, deterministic previews, or downstream work where the first rows carry meaning.

## Sort contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly one upstream table. |
| `by` | yes | Ordered list of sort clauses. Earlier clauses are primary keys. |
| `by[].expr` | yes | Expression used as a sort key. |
| `by[].direction` | no | `asc` by default; set `desc` explicitly for descending order. |

## Ordering choices

- `by` is ordered: first clause is primary, second is secondary, and so on.
- `direction` defaults to `asc`. Use `desc` explicitly when descending order is the intent.
- Sort expressions can be computed keys, but simple descending order is clearer as `direction: desc` than as a negated expression.

## Reviewing the result

`default` is the input rows reordered. Because shape does not change, inspect the first rows and the sort keys rather than row counts.

## Example

```yaml
- id: sorted
  kind: sort
  inputs: [data]
  by:
    - { expr: "[total_bill]", direction: desc }
    - { expr: "[date]", direction: asc }
```

## Related

- [Expression language](/rime-docs/concepts/expressions/) - sort key expressions
