---
title: join
description: "Two-input inner or left join on column keys."
---

`join` enriches one table with another. The left input is the anchor, especially for `how: left`; the right input supplies matching columns.

Use one join for one relationship. If the explanation has to say "and then it also joins...", chain another join so the row-count effect stays inspectable.

## Join contract

| Field | Required | Notes |
| --- | --- | --- |
| `inputs` | yes | Exactly two upstream tables: left first, right second. |
| `leftKey` | yes | Bare column name or expression evaluated on the left table. |
| `rightKey` | yes | Bare column name or expression evaluated on the right table. |
| `how` | no | `inner` by default; `left` keeps all left rows. |

## Before you join

- Choose `inner` when unmatched rows should disappear. Choose `left` when the left table defines the cohort.
- Watch many-to-many relationships. Rime allows them, but they create one output row for every matching pair.
- If keys need normalization, an upstream `derive` node often makes the matching logic easier to review than expression keys inside the join.

## Result shape

`default` is the joined table. Right-side column names are suffixed when needed to avoid collisions.

The editor/report should make left-vs-right order and row-count expansion visible.

## Example

```yaml
- id: enriched
  kind: join
  inputs: [orders, customers]    # length 2
  leftKey: customer_id
  rightKey: id
  how: left                       # inner | left, default inner
```

## Related

- [derive](/rime-docs/nodes/derive/) - normalize keys before joining
- [Expression language](/rime-docs/concepts/expressions/) - expression join keys
