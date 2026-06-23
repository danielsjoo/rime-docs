---
title: language nodes
description: "Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits."
---

Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits.

## Mental model

A language node is the escape hatch. The YAML declares slots and outputs; Python, R, JavaScript, or SQL owns the computation.

## When to use

When the 14 core nodes don't cover your transform. See the per-language pages — [Python](/rime-docs/scripts/python/), [R](/rime-docs/scripts/r/), [JavaScript](/rime-docs/scripts/javascript/), [SQL](/rime-docs/scripts/sql/) — for function-signature details.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `kind` | yes | `python`, `r`, `javascript`, or `sql`. Legacy `kind: script` also carries `language`. |
| `source` | run-time required | Project-relative script/query path. The editor can create an unfinished node, but a run needs a source file. |
| `in` | no | Named slot map: slot name to `nodeId`, `nodeId.output`, or `params.name`. |
| `out` | no | Declared output map or list. Omit for the manifest/default output. |
| `entrypoint` | no | Function/export name for languages that need one. |

## Inputs

Variable — declare named slots in `in:`. Each slot can be a dataframe ref or a `params.*` reference.

## Outputs

`default` by default, or multiple named outputs declared in `out:`.

## Editor and report behavior

- The editor should show named slots as real edges and show the source file beside the selected node preview.
- Multiple outputs should be visible as named outputs in both the canvas and report.

## Warnings and assumptions

- A script node without `source` fails with `NODE_PARAM_INVALID` at run time.
- If script execution is disabled or no executor is registered for the language, the node fails with `NODE_UNSUPPORTED`.

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

## Modeling notes

- Multi-output nodes (`out:`) require the language function to return a dict / list / object whose keys match.
- No `params.*` slots → no params at all. To pass a top-level param to a language node, you must wire it through the YAML.

## See also

- [Python language nodes](/rime-docs/scripts/python/) — pandas-based transforms
- [R language nodes](/rime-docs/scripts/r/) — tibble-based transforms
- [JavaScript language nodes](/rime-docs/scripts/javascript/) — Node-based transforms
- [SQL language nodes](/rime-docs/scripts/sql/) — DuckDB-backed transforms
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
