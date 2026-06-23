---
title: source
description: "File-based ingress: read a CSV / JSON / NDJSON / Parquet file into a tabular value."
---

A `source` node is where bytes on disk become a Rime table. Keep this node boring: name the file, load it, and let downstream nodes do cleanup or interpretation.

That separation makes reports easier to read. A raw CSV source can stay out of the report while the first meaningful transform gets the review attention.

## Use it at the edge

Use `source` when the project starts from a local CSV, JSON, NDJSON, or Parquet file. It has no parents and usually sits at the top of the DAG.

If a SQL query should read a file directly with DuckDB, use a `kind: sql` language node instead. That path is often better for large Parquet or SQL-first ingestion.

## Source contract

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Source binding key. Runtime source overrides and editor file bindings are keyed by this id. |
| `kind` | yes | Always `source`. |
| `path` | run-time required | Project-relative CSV, JSON, NDJSON, or Parquet path. The editor may hold an unfinished source without a path, but a run needs one or a runtime source override. |
| `metadata.report` | no | Often `false` for raw files so reports start at the first meaningful transform. |

## What to inspect

- The path is project-relative and can be replaced at run time with `--source <id>=<file>`.
- Parquet preserves types best. CSV and JSON inference are convenient, but worth checking in the editor preview.
- Set `metadata.report: false` for noisy raw inputs when the report should begin at a cleaned or joined table.

## Small example

```yaml
- id: patients
  kind: source
  path: data/patients.csv         # project-relative; under dataDir/ by convention
```

## Related

- [SQL language nodes](/scripts/sql/) - use DuckDB when ingestion is query-shaped
- [Dataset scanning](/editor/dataset-scanning/) - how the editor previews loaded tables
