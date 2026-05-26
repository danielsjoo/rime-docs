---
title: "`aggregate`"
description: Group rows and reduce with named metrics.
---

```yaml
- id: by_site
  kind: aggregate
  inputs: [data]                 # length 1
  groupBy: ["[site]"]
  metrics:
    - "[mean_score] = [score].mean()"
    - "[n] = [score].count()"
```

`groupBy` may be empty for global aggregations.
