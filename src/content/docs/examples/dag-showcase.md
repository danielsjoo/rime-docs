---
title: DAG showcase
description: A multi-branch demo pipeline mixing SQL, Python, R, and built-in operators.
---

The repo's [`examples/dag-showcase/`](https://github.com/danielsjoo/rime/tree/main/examples/dag-showcase) is a compact multi-branch project over a mid-scale synthetic cohort: 720 patients and 3,037 lab visits. It exercises file sources, SQL nodes, derive/filter/aggregate chains, terminal stat nodes, report metadata, and cache behavior.

![Rime Editor DAG focus screenshot showing the dag-showcase pipeline and node inspector.](/editor/assets/hero-dag-focus.jpg)

## What's inside

- **Sources:** `data/patients.csv` (720 demographic rows) and `data/lab_visits.parquet` (3,037 longitudinal lab rows), wired inline on each source node via `path:` in `pipeline.dag.yaml`
- **DAG:** multi-branch pipeline - aggregate labs per patient, join to patients in SQL, derive composite lab/risk features, refine the cohort, roll up by site, and finish with correlation and chi-square statistics
- **Linked scripts (human-edited reference):**
  - `scripts/generate_demo_data.mjs` — deterministic synthetic data generator
  - `scripts/python_biomarker_features.py` — visit-intensity feature
  - `scripts/risk_adjust.R` — baseline z-score + flag
  - `queries/patient_lab_wide.sql` and `queries/sql_cohort_refine.sql` — SQL source files used by the runnable DAG

## Shape

```text
patients_source ─┐
                 ├─► patient_lab_wide ─► lab_load ─► risk_index
labs_source ─► lab_agg ┘                                  │
                                                          ▼
repeat_visitors ─► sql_cohort_refine ─► py_biomarker_features
                                              │
                                              ▼
                                      r_risk_adjust ─► r_risk_flag
                                              │
                   ┌──────────────────────────┼────────────────────┐
                   ▼                          ▼                    ▼
            site_outcomes              crp_vs_baseline       site_age_chisq
```

The `py_biomarker_features` and `r_risk_adjust` nodes are implemented as
core `derive` nodes in this example so it can run without Python/R sidecars.
The adjacent scripts show the equivalent language-node logic.

## Running it

From the repo root:

```bash
# Validate
rime validate examples/dag-showcase/pipeline.dag.yaml

# Run (data outputs only)
rime run examples/dag-showcase/pipeline.dag.yaml

# Build (run + render the generated HTML report)
rime build examples/dag-showcase/pipeline.dag.yaml
```

The report is written to `examples/dag-showcase/outputs/run_report.html`.

## Why this example matters

It is the smallest checked-in pipeline that touches several Rime surfaces at
once:

| Feature | Demonstrated by |
|---|---|
| Multiple source kinds | `patients` (CSV) + `lab_visits` (Parquet) |
| Built-in transforms | `filter` / `derive` / `aggregate` chains |
| SQL nodes (with inputs) | `patient_lab_wide` joining cohort + labs, `sql_cohort_refine` sorting the analysis cohort |
| Language-node migration pattern | `derive` nodes mirror the checked-in Python/R scripts |
| Stat nodes | `correlation` + `chi_square` over the refined cohort |
| Multi-branch graph | independent feature + risk branches that converge at the site rollup |
| Report rendering | Generated report includes DAG nodes unless `metadata.report: false` |

## What To Inspect

- `pipeline.canvas.json` to see the saved editor layout for this project.
- `scripts/generate_demo_data.mjs` to see how the synthetic cohort is produced.
- `queries/patient_lab_wide.sql` to see SQL named slots in action.
- `outputs/site_outcomes/default.parquet` for the final reporting rollup.
- `outputs/crp_vs_baseline/default.json` and `outputs/site_age_chisq/default.json` for terminal stat-node objects.
- `outputs/run_report.html` for output sizes, warnings, and table previews.

If you want a smaller starting point, see [`examples/single-file/`](https://github.com/danielsjoo/rime/tree/main/examples/single-file).
