---
title: script
description: "Custom logic in Python, R, JavaScript, or SQL. The escape hatch when no core node fits."
---

Custom logic in Python, R, JavaScript, or SQL. The escape hatch when no core node fits.

## When to use

When the 14 core nodes don't cover your transform. See the per-language pages — [Python](/scripts/python/), [R](/scripts/r/), [JavaScript](/scripts/javascript/), [SQL](/scripts/sql/) — for function-signature details.

## Inputs

Variable — declare named slots in `in:`. Each slot can be a dataframe ref or a `params.*` reference.

## Outputs

`default` by default, or multiple named outputs declared in `out:`.

## Example

```yaml
specification_version: "2.1"

params:
  threshold: { type: float, default: 0.5 }

nodes:
  - id: features
    kind: script
    language: python              # python | r | javascript | sql
    source: scripts/features.py
    in:                           # named slot map: slot → ref
      cohort:    upstream_node    # node ref → resolves to a Table
      threshold: params.threshold # params.<name> → resolves to a scalar
    out:                          # optional; declared overrides inferred
      default: table
    entrypoint: run               # optional; default `run` for python/r, `main` for js
```

## Common pitfalls

- Multi-output nodes (`out:`) require the language function to return a dict / list / object whose keys match.
- No `params.*` slots → no params at all. To pass a top-level param to a script, you must wire it through the YAML.

## See also

- [`script` node](/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
