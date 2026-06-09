---
title: Reports
description: Pair your DAG with a report.yaml to render a publishable HTML document.
---

A Rime pipeline doesn't have to render anything — `rime run` just produces data outputs. But when you want a publishable narrative around those outputs, pair the DAG with a **`report.yaml`** and run `rime build`.

## The shape

```yaml
# report.yaml
specification_version: "1.0"
pipeline: pipeline.dag.yaml
title: "Cohort overview"

output:
  format: html
  path: outputs/run_report.html

sections:
  - heading: "Cohort summary"
    blocks:
      - markdown: |
          ## Adult cohort
          Filtered to patients aged 18 and over, then aggregated by site.

      - table:
          source: by_site
          title: "Site-level mean age"
          columns: [site, mean_age, n]
          decimals: 2

      - stat:
          source: age_corr
          title: "Age vs score (Pearson)"
          show: [coefficient, p_value, n]
          decimals: 3
```

## Block kinds

There are three:

### `markdown:`

Standard markdown — headings, **bold**, _italic_, lists, code fences, and inline `code`. Use it for prose narration around the data blocks.

### `table:`

```yaml
- table:
    source: by_site
    title: "Site-level mean age"
    columns: [site, mean_age, n]
    decimals: 2
    rowLimit: 50
```

The `source:` must point at a DAG node whose output is tabular (i.e. not a `t_test` / `correlation` / etc.).

### `stat:`

```yaml
- stat:
    source: age_corr
    title: "Age vs score (Pearson)"
    show: [coefficient, p_value, n]
    decimals: 3
```

The `source:` must point at one of the stat nodes (`t_test`, `anova`, `mann_whitney_u`, `chi_square`, `correlation`, `linear_regression`).

## Building

```bash
rime build pipeline.dag.yaml --report report.yaml
```

This is `rime run` plus the report-render step, atomic per invocation. The output HTML embeds:

- Inline CSS (no external stylesheet)
- A small navigation sidebar if you have multiple sections
- Tables rendered to clean semantic HTML
- Stat callouts as styled blocks
- Captured matplotlib figures (Python language nodes only — see [Polyglot runtime](/concepts/polyglot/))

## Cross-file validation

Validate the report alongside its DAG by passing it with `--report`:

```bash
rime validate pipeline.dag.yaml --report report.yaml
```

This checks:

- `source:` references on every `table:` and `stat:` block resolve to a node in the linked DAG
- The referenced node's output shape matches the block kind (tabular vs stat)
- Column names referenced in `columns:` exist on the source's output schema

Catch broken references at validate time, not run time.

`stat:` `show:` keys that don't exist on the stat node's output aren't a hard
validation error (the renderer can't always know the exact runtime shape), but
they're easy to typo — `df` instead of `dof`, `mean_a` instead of `meanA`. When
the rendered report meets a `show:` key the stat object never emitted, it prints
an inline warning in the stat block listing the unknown keys and the available
ones, so a typo shows up in the output instead of silently dropping a row. The
exact keys per stat node are listed under [Outputs](/nodes/t_test/) in each
node's reference page.
