---
title: "`anova`"
description: One-way ANOVA across N groups.
---

```yaml
- id: a
  kind: anova
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupLabels: [a, b, c]          # optional
```
