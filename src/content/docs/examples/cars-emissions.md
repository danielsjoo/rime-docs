---
title: Cars x CO2 emissions
description: "A flagship polyglot Rime pipeline: SQL source, JavaScript fetch, Python UMAP, R regression, and report output."
---

This is the flagship polyglot example. It stitches public vehicle data to a
CO2 concentration series, fans the unified table into Python, R, and built-in
stat nodes, then renders an HTML narrative.

Source fixture:
[`packages/core/test/fixtures/experiments/cars-emissions-narrative`](https://github.com/danielsjoo/rime/tree/main/packages/core/test/fixtures/experiments/cars-emissions-narrative).

## What it Teaches

- SQL ingress can read public JSON directly through DuckDB.
- JavaScript nodes can fetch and normalize external API/CSV data.
- A single feature table can feed Python, R, and terminal stat nodes.
- Python and R nodes can emit diagnostics and return tabular results.
- Stat nodes are terminal report artifacts, not dataframe transforms.

## DAG Shape

```text
sql_cars_source ─┐
                 ├─► js_feature_build ─┬─► python_umap_embed
js_co2_fetch ────┘                     ├─► r_efficiency_trends
                                       ├─► t_test_us_vs_japan
                                       └─► anova_cylinders
```

`js_feature_build` is the apex dataframe. Everything downstream consumes the
same vehicle-plus-CO2 feature table.

## Important Nodes

```yaml
specification_version: "2.1"
nodes:
  - id: sql_cars_source
    kind: sql
    source: scripts/sql_cars_source.sql

  - id: js_co2_fetch
    kind: javascript
    source: scripts/js_co2_fetch.js

  - id: js_feature_build
    kind: javascript
    in:
      cars: sql_cars_source
      co2_yearly: js_co2_fetch
    source: scripts/js_feature_build.js

  - id: python_umap_embed
    kind: python
    in:
      features: js_feature_build
    source: scripts/python_umap.py

  - id: r_efficiency_trends
    kind: r
    in:
      features: js_feature_build
    source: scripts/r_efficiency_trends.R

  - id: t_test_us_vs_japan
    kind: t_test
    inputs: [js_feature_build]
    valueColumn: miles_per_gallon
    groupColumn: origin
    groupA: USA
    groupB: Japan
    equalVariance: false
```

The SQL source is a DuckDB query:

```sql
SELECT
  CAST(Name AS VARCHAR) AS name,
  CAST(Miles_per_Gallon AS DOUBLE) AS miles_per_gallon,
  CAST(Cylinders AS INTEGER) AS cylinders,
  CAST(Horsepower AS DOUBLE) AS horsepower,
  CAST(Year AS VARCHAR) AS year_str,
  CAST(Origin AS VARCHAR) AS origin
FROM read_json_auto(
  'https://raw.githubusercontent.com/vega/vega-datasets/main/data/cars.json'
)
WHERE Miles_per_Gallon IS NOT NULL
  AND Horsepower IS NOT NULL
```

The JavaScript CO2 fetch node is ingress-style: it has no `in:` slots and
returns a named table output.

```js
export default defineNode({
  in: {},
  out: { co2_by_year: 'table' },
  async run() {
    const response = await fetch(DEFAULT_URL)
    const text = await response.text()
    return { co2_by_year: parseAnnualRows(text) }
  },
})
```

## Run It

Python and R sidecars are required for the full run:

```bash
git clone https://github.com/danielsjoo/rime
cd rime

export RIME_PYTHON_BIN=/path/to/python
export RIME_RSCRIPT_BIN=/path/to/Rscript

rime validate packages/core/test/fixtures/experiments/cars-emissions-narrative/pipeline.dag.yaml
rime run packages/core/test/fixtures/experiments/cars-emissions-narrative/pipeline.dag.yaml
```

The fixture also includes a hand-authored report spec:

```bash
rime build \
  packages/core/test/fixtures/experiments/cars-emissions-narrative/pipeline.dag.yaml \
  --report packages/core/test/fixtures/experiments/cars-emissions-narrative/report.yaml
```

The run writes:

- `outputs/js_co2_fetch/co2_by_year.parquet`
- `outputs/js_feature_build/features.parquet`
- `outputs/python_umap_embed/default.parquet`
- `outputs/r_efficiency_trends/default.parquet`
- `outputs/t_test_us_vs_japan/default.json`
- `outputs/anova_cylinders/default.json`
- `outputs/d3_umap_scatter/default.html`
- `outputs/cars-emissions-narrative-report.html`

## What To Inspect

- `scripts/sql_cars_source.sql` for DuckDB URL ingress.
- `scripts/js_co2_fetch.js` for a JavaScript API/CSV fetch node.
- `scripts/python_umap.py` for a Python diagnostic transform.
- `scripts/r_efficiency_trends.R` for an R statistical transform.
- `report.yaml` to see the compatibility path for hand-authored report prose and ordering.

## Requirements

Install the packages expected by the fixture before running the Python/R nodes:

| Runtime | Packages |
|---|---|
| Python | `pandas`, `numpy`, `pyarrow`, `matplotlib`, `scikit-learn`, `umap-learn` |
| R | `jsonlite`, `arrow`, `ggplot2`, `dplyr`, `boot` |

For a no-sidecar example, start with [DuckDB single source](/examples/sql-only/)
or [Single-file pipeline](/examples/single-file/).
