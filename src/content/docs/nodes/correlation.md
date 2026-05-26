---
title: "`correlation`"
description: Pearson / Spearman correlation between two columns.
---

```yaml
- id: cor
  kind: correlation
  inputs: [data]
  columnA: x
  columnB: y
  method: pearson                 # pearson | spearman, default pearson
```
