---
title: "`subgraph`"
description: Embed an external DAG file with named bindings + outputs.
---

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

The inner spec parses as a v2 DAG. Lineage / engine treat the subgraph as opaque from the outside; bindings/outputs are the contract.
