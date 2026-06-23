---
title: subgraph
description: "Embed an external `.dag.yaml` file as a node, with named bindings and exposed outputs."
---

Embed an external `.dag.yaml` file as a node, with named bindings and exposed outputs.

## Mental model

A `subgraph` node is a pipeline boundary. It hides an external DAG behind explicit bindings and exposed outputs.

## When to use

Reusing a complete sub-pipeline across multiple projects, or composing one big DAG out of multiple smaller files. Subgraphs are opaque from the outside (good for encapsulation).

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `source` | yes | External `.dag.yaml` file. |
| `bindings` | no | Map from inner slot name to outer input ref. |
| `outputs` | no | Map from exposed output name to inner node ref. |
| `inputs` | derived | Optional compatibility field; bindings are the real contract. |

## Inputs

Variable — driven by the `bindings:` map.

## Outputs

Variable — driven by the `outputs:` map.

## Editor and report behavior

- The editor should render subgraphs as boxed composition, with clear exposed inputs/outputs.
- Condense/expand should preserve external references and make boundary bindings inspectable.

## Warnings and assumptions

- Subgraph editing helpers report structured violations such as `EMPTY_SELECTION`, `UNKNOWN_NODE_ID`, `NON_CONVEX`, `CONTAINS_SOURCE`, and `UNRESOLVED_REF`.
- The runtime executes subgraphs through the engine, not the leaf node executor.

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

## Modeling notes

- `bindings:` maps outer node refs to inner slot names; `outputs:` maps exposed names to inner node refs. Mismatches caught at validate time.
- Subgraphs don't share cache with their parent — running the same subgraph twice in one DAG produces two cached results, not one.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
