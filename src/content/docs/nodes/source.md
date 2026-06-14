---
title: source
description: "File-based ingress: read a CSV / JSON / NDJSON / Parquet file into a tabular value."
---

File-based ingress: read a CSV / JSON / NDJSON / Parquet file into a tabular value.

## When to use

Whenever your data starts as a file on disk. For SQL-only pipelines, consider a `kind: sql` node in ingress mode instead — it reads files directly via DuckDB and is often faster for large Parquet.

## Inputs

None — `source` is a root node.

## Outputs

`default`: the loaded table. Schema is inferred from the file (`.parquet` preserves types; `.csv` infers headers; `.json` / `.ndjson` infer field types).

## Example

```yaml
- id: patients
  kind: source
  path: data/patients.csv         # project-relative; under dataDir/ by convention
```

## Common pitfalls

- CSV header inference is best-effort — if column names contain non-ASCII or special characters, explicitly cast in a downstream `derive`.
- JSON files load as a single table — for ndjson (one record per line), use the `.ndjson` extension.

## See also

- [Language node reference](/rime-docs/nodes/script/) — the escape hatch when this node isn't enough
- [Concepts → Nodes](/rime-docs/concepts/nodes/) — the conceptual tour of the node system
- [`packages/core/src/schema.ts`](https://github.com/danielsjoo/rime/blob/main/packages/core/src/schema.ts) — canonical Zod schema
