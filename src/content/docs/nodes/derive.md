---
title: "`derive`"
description: Add a computed column from existing columns.
---

```yaml
- id: lab_load
  kind: derive
  inputs: [patient_lab]         # length 1
  as: lab_load                   # new column name
  expr: "[crp_mean] * [ldl_max] / 1000.0"
```
