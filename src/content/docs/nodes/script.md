---
title: language nodes
description: "Custom logic in Python, R, JavaScript, or SQL. Use `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` when no core node fits."
---

Language nodes are the escape hatch: `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql`. The YAML declares slots and outputs; the language owns the computation.

Use one when the built-in nodes would hide the real logic, or when you need a package, query, model, visualization, custom file output, or multiple named outputs.

## Slot contract

| Field | Required | Notes |
| --- | --- | --- |
| `kind` | yes | `python`, `r`, `javascript`, or `sql`. Legacy `kind: script` also carries `language`. |
| `source` | run-time required | Project-relative script/query path. The editor can create an unfinished node, but a run needs a source file. |
| `in` | no | Named slot map: slot name to `nodeId`, `nodeId.output`, or `params.name`. |
| `out` | no | Declared output map or list. Omit for the manifest/default output. |
| `entrypoint` | no | Function/export name for languages that need one. |

## Inputs and outputs

`in` is a named map from function/query slot to a node ref, named output ref, or `params.name` scalar. Empty `in` is allowed for ingress scripts.

`out` can declare multiple named outputs. When omitted, the node uses the language manifest or the default output.

## Choosing the language

- Use SQL for DuckDB-backed joins, scans, and relational transforms.
- Use Python/R for statistics, modeling, plotting, or libraries Rime should not rebuild as core nodes.
- Use JavaScript when the project already has JS utilities or when output shaping is easier near web/report code.

## Runtime failure modes

- A language node without `source` fails at run time.
- If script execution is disabled or no executor is registered for the language, the node fails with `NODE_UNSUPPORTED`.
- Multi-output declarations must match what the script actually returns.

## Named-slot example

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

## Related

- [Python language nodes](/scripts/python/) - pandas-based transforms
- [R language nodes](/scripts/r/) - data.frame/tibble-style transforms
- [JavaScript language nodes](/scripts/javascript/) - `defineNode` and row-array transforms
- [SQL language nodes](/scripts/sql/) - DuckDB-backed transforms
