---
title: "`join`"
description: Two-input inner / left join on column keys.
---

```yaml
- id: enriched
  kind: join
  inputs: [orders, customers]    # length 2
  leftKey: customer_id
  rightKey: id
  how: left                       # inner | left, default inner
```
