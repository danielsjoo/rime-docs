---
title: "Example: dag-showcase"
description: A preview of how the coming Rime Editor should review the dag-showcase project.
---

Rime Editor is coming soon. When it is available, `dag-showcase` should be the
best first project to open because it is small enough to understand in one
sitting and real enough to show the product. The checked-in synthetic cohort has
720 patients, 3,037 longitudinal lab visits, six sites, demographic groups,
missing lab coverage, and report-ready statistical outputs.

![Rime Editor canvas focused on the dag-showcase DAG.](/editor/assets/hero-dag-focus.jpg)

## Project Shape

The example starts with patient demographics and longitudinal lab visits:

```yaml
- id: patients_source
  kind: source
  path: data/patients.csv

- id: labs_source
  kind: source
  path: data/lab_visits.parquet
```

It then rolls labs up per patient, joins demographics to lab features with SQL, builds expression-derived risk features, filters to a 386-patient analysis cohort, and ends with report-friendly statistical nodes.

## Why It Shows The Editor Well

| Workflow | Where to look |
| --- | --- |
| File ingress | `patients_source`, `labs_source` |
| Expression language | `lab_load`, `risk_index`, `repeat_visitors` |
| SQL with named inputs | `patient_lab_wide`, `sql_cohort_refine` |
| Dataset scanning | `patient_lab_wide`, `risk_index`, `site_outcomes` |
| Statistical outputs | `crp_vs_baseline`, `site_age_chisq` |
| Report preview | the generated report tab |

## Walkthrough

1. Open `examples/dag-showcase` in the Editor.
2. Run the DAG.
3. Select `patient_lab_wide`.
4. Confirm the preview shows a joined patient/lab table and the SQL source.
5. Select `lab_load` and inspect the derived feature column.
6. Select `site_outcomes` and check that the aggregate output is one row per site.
7. Open the report preview and inspect the output sizes and statistical sections.

![Rime Editor table preview for the joined patient/lab dataset.](/editor/assets/table-scan-focus.jpg)

## What To Notice

The point of the example is not the medical story. The point is the review loop:

- graph structure tells you where data came from
- table previews show what each step produced
- YAML/spec remains available when visual controls are not enough
- statistical nodes produce reportable object outputs
- the report collects the same run evidence into a shareable artifact

## Expression Nodes In The Demo

The feature-building nodes are deliberately readable:

```yaml
- id: risk_index
  kind: derive
  inputs: [lab_load]
  as: risk_index
  expr: coalesce([baseline_score], 0) * 0.55 + coalesce([lab_load], 0) * 1.4 + coalesce([prior_event], 0) * 4.0
```

This is a good dividing line for Rime Editor: if a formula is readable in the [expression language](/concepts/expressions/), keep it as a core node so reviewers can inspect it directly. If it becomes multi-step logic, promote it to SQL/Python/R/JavaScript.

## Report Output

![Rime Editor report preview for dag-showcase.](/editor/assets/report-dag-focus.jpg)

The report should make the pipeline reviewable without reopening the editor:

- DAG overview with output sizes
- table sections for data-producing nodes
- stat blocks for object-producing nodes
- warnings near statistical results
- browser-openable HTML artifact
