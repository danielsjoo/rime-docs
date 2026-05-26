---
title: "`source`"
description: File-based ingress (CSV / JSON / NDJSON / Parquet).
---

```yaml
- id: patients
  kind: source
  path: data/patients.csv         # project-relative; under dataDir/ by convention
```

`id` + `kind` + `path:`. Extension picks the loader: `.csv` (header-inferred), `.json` / `.ndjson`, `.parquet` (preserves types). No `inputs:`. A run-time `--source <id>=<file>` flag overrides `path:` for that node.
