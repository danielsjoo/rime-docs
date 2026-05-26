---
title: "`t_test`"
description: Two-sample t-test (Welch or equal-variance).
---

```yaml
- id: tt
  kind: t_test
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupA: control
  groupB: treatment
  equalVariance: false            # default true
```
