---
title: source
description: "File-based ingress: read a CSV / JSON / NDJSON / Parquet file into a tabular value."
---

File-based ingress: read a CSV / JSON / NDJSON / Parquet file into a tabular value.

## Mental model

A `source` node is the boundary between external bytes and the Rime DAG. After the source loads, downstream nodes should treat the data as a typed table owned by the runtime.

## When to use

Whenever your data starts as a file on disk. For SQL-only pipelines, consider a `kind: sql` node in ingress mode instead — it reads files directly via DuckDB and is often faster for large Parquet.

## Fields

| Field | Required | Notes |
| --- | --- | --- |
| `id` | yes | Source binding key. Runtime source overrides and editor file bindings are keyed by this id. |
| `kind` | yes | Always `source`. |
| `path` | run-time required | Project-relative CSV, JSON, NDJSON, or Parquet path. The editor may hold an unfinished source without a path, but a run needs one or a runtime source override. |
| `metadata.report` | no | Often `false` for raw files so reports start at the first meaningful transform. |

## Inputs

None — `source` is a root node.

## Outputs

`default`: the loaded table. Schema is inferred from the file (`.parquet` preserves types; `.csv` infers headers; `.json` / `.ndjson` infer field types).

## Editor and report behavior

- The editor should show the bound path, inferred shape, column profiles, and sampled rows immediately after a run.
- If the path is missing, the app should disable run-dependent preview rather than making the user probe manually.

## Warnings and assumptions

- Missing source values surface as `NODE_INPUT_MISSING` at run time.
- CSV cells are converted to primitive number/boolean/string values when possible; empty cells become null.

## Example

```yaml
- id: patients
  kind: source
  path: data/patients.csv         # project-relative; under dataDir/ by convention
```

## Modeling notes

- CSV header inference is best-effort — if column names contain non-ASCII or special characters, explicitly cast in a downstream `derive`.
- JSON files load as a single table — for ndjson (one record per line), use the `.ndjson` extension.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node is not enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
