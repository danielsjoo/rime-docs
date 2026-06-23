---
title: subgraph
description: "Embed an external `.dag.yaml` file as a node, with named bindings and exposed outputs."
---

`subgraph` wraps another `.dag.yaml` file behind an explicit boundary. From the parent DAG, the inner pipeline behaves like one composed node.

Use it when a cluster of steps has a reusable contract: a feature pipeline, a standardized cleaning pass, or a shared project module.

## Boundary contract

| Field | Required | Notes |
| --- | --- | --- |
| `source` | yes | External `.dag.yaml` file. |
| `bindings` | no | Map from inner slot name to outer input ref. |
| `outputs` | no | Map from exposed output name to inner node ref. |
| `inputs` | derived | Optional compatibility field; bindings are the real contract. |

## Bindings and outputs

- `bindings` maps names expected inside the sub-DAG to refs in the parent DAG.
- `outputs` maps public output names to inner node refs.
- The subgraph is intentionally opaque from the outside. That is useful for encapsulation, but it makes the boundary names important documentation.

## Editor behavior

Condense/expand UI should preserve external refs and make bindings inspectable. Structured violations include `EMPTY_SELECTION`, `UNKNOWN_NODE_ID`, `NON_CONVEX`, `CONTAINS_SOURCE`, and `UNRESOLVED_REF`.

## Example

```yaml
- id: feature_pipeline
  kind: subgraph
  source: subpipelines/features.dag.yaml   # external file (v2 — was inline `graph:` in v1)
  bindings:                                 # alias name → outer ref
    raw_input: outer_node_id
  outputs:                                  # exposed name → inner ref
    feature_a: inner_node_a
    feature_b: inner_node_b.train
```

## Related

- [Concepts: DAG specification](/rime-docs/concepts/dag/) - how refs and DAG boundaries work
