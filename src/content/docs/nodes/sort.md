---
title: "`sort`"
description: Order rows by one or more expressions.
---

```yaml
- id: sorted
  kind: sort
  inputs: [data]
  by:
    - { expr: "[total_bill]", direction: desc }
    - { expr: "[date]", direction: asc }
```

`by[].direction` defaults to `asc`.
