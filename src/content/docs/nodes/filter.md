---
title: "`filter`"
description: Keep rows matching a boolean expression.
---

```yaml
- id: adults
  kind: filter
  inputs: [patients]            # length 1
  expr: "[age] >= 18"
```
