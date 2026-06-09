---
title: language nodes
description: "Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits."
---

Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits.

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
    kind: python
    source: scripts/features.py
    in:
      cohort: upstream_node
      threshold: params.threshold
    out:
      default: table
    entrypoint: run
```

## Common pitfalls

- Multi-output nodes (`out:`) require the language function to return a dict / list / object whose keys match.
- No `params.*` slots → no params at all. To pass a top-level param to a language node, you must wire it through the YAML.

## See also

- [Python language nodes](/scripts/python/) — pandas-based transforms
- [R language nodes](/scripts/r/) — tibble-based transforms
- [JavaScript language nodes](/scripts/javascript/) — Node-based transforms
- [SQL language nodes](/scripts/sql/) — DuckDB-backed transforms
- [Concepts → Nodes](/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
