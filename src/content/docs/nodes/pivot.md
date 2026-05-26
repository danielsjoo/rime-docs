---
title: "`pivot`"
description: Wide-format aggregation across a categorical column.
---

```yaml
- id: monthly
  kind: pivot
  inputs: [sales]
  index: [region]
  columns: month
  values: revenue
  agg: sum                        # sum | mean | count, default sum
```
