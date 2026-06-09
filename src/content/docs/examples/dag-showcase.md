---
title: DAG showcase
description: A multi-branch demo pipeline mixing SQL, Python, R, and built-in operators.
---

The repo's [`examples/dag-showcase/`](https://github.com/rimekit/rime/tree/main/examples/dag-showcase) is the broadest demo: a self-contained DAG-file-mode project that exercises sources, transforms, joins, stat nodes, and language nodes in all four supported languages.

## What's inside

- **Sources:** `data/patients.csv` (demographics) and `data/lab_visits.parquet` (longitudinal labs), wired inline on each source node via `path:` in `pipeline.dag.yaml`
- **DAG:** multi-branch pipeline — aggregate labs per patient → **SQL** join to patients → derives (lab load, risk index) → **SQL** cohort filter → host-free **derive** steps that mirror the linked Python/R scripts → site rollup + **correlation** + **chi-square** → **parquet** persist on `site_outcomes`
- **Linked scripts (human-edited reference):**
  - `scripts/python_biomarker_features.py` — `n_visits ** 1.2` feature
  - `scripts/risk_adjust.R` — baseline z-score + flag
  - `scripts/cohort_refine.sql` and `scripts/sql/patient_lab_join.sql` — kept in sync with inline SQL on the `sql_*` nodes

## Running it

From the repo root:

```bash
# Validate
rime validate examples/dag-showcase/pipeline.dag.yaml

# Run (data outputs only)
rime run examples/dag-showcase/pipeline.dag.yaml

# Build (run + render auto-report -> HTML)
rime build examples/dag-showcase/pipeline.dag.yaml
```

Or open the folder in Rime Editor — it detects the `pipeline.dag.yaml` and treats the directory as the project root.

## Why this example matters

It's the smallest pipeline that hits every interesting Rime feature:

| Feature | Demonstrated by |
|---|---|
| Multiple source kinds | `patients` (CSV) + `lab_visits` (Parquet) |
| Built-in transforms | `filter` / `derive` / `aggregate` chains |
| SQL nodes (with inputs) | `sql_patient_lab` joining cohort + labs |
| SQL nodes (ingress-only) | `sql_cohort_refine` reading from parquet directly |
| Python language node | `py_biomarker_features` |
| R language node | `r_risk_adjust` |
| Stat nodes | `correlation` + `chi_square` over the rolled-up site outcomes |
| Multi-branch graph | independent feature + risk branches that converge at the site rollup |
| Report rendering | Auto-report includes DAG nodes unless `metadata.report: false` |

If you want a smaller starting point, see [`examples/single-file/`](https://github.com/rimekit/rime/tree/main/examples/single-file).
