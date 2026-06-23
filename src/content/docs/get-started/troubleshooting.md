---
title: Troubleshooting
description: Common Rime validation, run, cache, language, and report failures.
---

Use this page when a DAG validates differently than expected, a node fails at
run time, or a report looks stale.

## Unbound Source Node

Symptom:

```text
Unbound source node(s): patients. Add path: in the spec or pass --source <nodeId>=<file>.
```

Fix one of these:

```yaml
- id: patients
  kind: source
  path: data/patients.csv
```

```bash
rime run pipeline.dag.yaml --source patients=data/patients-q2.csv
```

Relative paths resolve from the directory that contains `pipeline.dag.yaml`.

## Expression Parse Or Evaluation Error

Core nodes use Rime's expression language, not Python or SQL.

```yaml
expr: "[age] >= 18 and [site] in ('north', 'south')"
```

Check that column names are bracketed, string literals are quoted, and aggregate
metrics use a bracketed alias:

```yaml
metrics:
  - "[mean_age] = [age].mean()"
```

See [Expression language](/concepts/expressions/) for supported
operators and methods.

## Python Dependency Missing

Symptom:

```text
ModuleNotFoundError: No module named 'pyarrow'
```

Install dependencies into the interpreter Rime is using:

```bash
uv venv .venv
source .venv/bin/activate
uv pip install pyarrow pandas
rime run pipeline.dag.yaml --python-bin .venv/bin/python
```

If the editor or CLI still uses another Python, set `RIME_PYTHON_BIN` to the
absolute interpreter path.

## R Dependency Missing

Symptom:

```text
Missing required package: arrow
```

Install the runner dependencies:

```r
install.packages(c("arrow", "jsonlite", "tibble"))
```

Then point Rime at the intended `Rscript`:

```bash
rime run pipeline.dag.yaml --rscript-bin "$(which Rscript)"
```

## JavaScript Script Shape Error

JavaScript nodes must export a `defineNode(...)` bundle:

```js
import { defineNode } from '@rimekit/runtime'

export default defineNode({
  in: { cohort: 'table' },
  out: { default: 'table' },
  run: ({ cohort }) => cohort.rows,
})
```

Bare default functions are rejected in Rime 2.1 because named slots remove the
guesswork around input ordering.

## SQL Slot Name Mismatch

The SQL table name comes from the YAML `in:` key, not the upstream node ID:

```yaml
- id: enriched
  kind: sql
  in:
    orders: clean_orders
  source: queries/enriched.sql
```

```sql
SELECT * FROM orders
```

If your query says `SELECT * FROM clean_orders`, DuckDB will not find that
table unless you named the slot `clean_orders`.

## Empty Output Or Statistical Warning

Filters can produce an empty table. Statistical nodes can also run but emit
warnings when assumptions are weak: small groups, low chi-square expected cell
counts, skewed samples, Pearson/Spearman disagreement, or high residuals.

Do not treat the p-value alone as the result. Check the node warnings in the
HTML report or editor inspector before publishing.

## Cache Looks Stale

Check the current outputs without rerunning:

```bash
rime verify pipeline.dag.yaml
```

Common fixes:

| Goal | Command |
|---|---|
| Recompute everything and write fresh cache | `rime run pipeline.dag.yaml --no-cache-read` |
| Recompute without reading or writing cache | `rime run pipeline.dag.yaml --lean` |
| Test in a separate outputs root | `rime run pipeline.dag.yaml --isolated /tmp/rime-ci` |

If `rime verify` reports a digest mismatch, regenerate the outputs before
building a report.
