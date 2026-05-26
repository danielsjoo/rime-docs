---
title: "`concat`"
description: Stack tables row-wise with a label column.
---

```yaml
- id: combined
  kind: concat
  inputs: [batch_a, batch_b]     # ≥2
  groupColumn: batch              # added column tagging each row's source
  groupLabels: [a, b]             # optional; defaults to input ref strings
  schemaMode: union               # strict | intersect | union, default strict
```

## Stat nodes (terminal — produce stat-shaped object outputs)
