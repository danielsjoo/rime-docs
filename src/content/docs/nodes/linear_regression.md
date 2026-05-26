---
title: "`linear_regression`"
description: Single-feature OLS, optional train/test split.
---

```yaml
- id: lr
  kind: linear_regression
  inputs: [training]
  feature: x
  target: y
  testFraction: 0.2               # optional
  seed: 42                        # optional
```

> Stat nodes consume integer columns (polars Int64 ↔ JS BigInt) automatically; `toFiniteNumber()` coerces in the executor.
