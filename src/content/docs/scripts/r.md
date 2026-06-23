---
title: R language nodes
description: How R language nodes work in Rime, including function signatures, outputs, environments, and plot capture.
---

An R language node uses `kind: r`. You write a top-level `run <- function(...)`
or `transform <- function(...)`, and Rime calls it with named arguments from the
YAML `in:` map.

## Minimum Example

```yaml
- id: efficiency
  kind: r
  source: scripts/efficiency.R
  in:
    cohort: features
    threshold: params.threshold
```

```r
# scripts/efficiency.R
run <- function(cohort, threshold) {
  cohort$flag <- cohort$score > as.numeric(threshold)
  cohort
}
```

There is no Rime-specific registration call. The function name and YAML slots
are the contract.

## Function Signature

| YAML `in:` slot | R value |
|---|---|
| Upstream node ref, for example `cohort: features` | `data.frame`/tibble-like table |
| Param ref, for example `threshold: params.threshold` | native scalar/list |

The default entrypoint is `run`. `transform` is accepted for older scripts. To
use another function, set `entrypoint:` on the node.

```r
run <- function(cohort, lookup, threshold) {
  # cohort and lookup are tabular values.
  # threshold came from params.threshold.
}
```

If your function declares `params`, Rime passes the resolved params object.

## Outputs

### Single Output

Return a `data.frame` or tibble:

```r
run <- function(orders) {
  orders[orders$total > 0, ]
}
```

Downstream nodes reference the default output by the node ID.

### Multiple Outputs

Declare named outputs in YAML and return a named list with matching values:

```yaml
- id: split
  kind: r
  source: scripts/split.R
  in: { cohort: features }
  out: { train: table, test: table }
```

```r
run <- function(cohort) {
  set.seed(42)
  train_idx <- sample(seq_len(nrow(cohort)), size = floor(nrow(cohort) * 0.8))
  list(
    train = cohort[train_idx, ],
    test = cohort[-train_idx, ]
  )
}
```

Downstream refs are `split.train` and `split.test`.

### Non-Tabular Output

For model summaries, fitted parameters, or compact JSON-like values, declare an
`any` output:

```yaml
out: { result: any }
```

```r
run <- function(cohort) {
  fit <- lm(score ~ age + treatment, data = cohort)
  list(
    coefficients = as.list(coef(fit)),
    r_squared = summary(fit)$r.squared
  )
}
```

## Plot Capture

Rime captures R plot candidates returned by the entrypoint, including ggplot
objects, recorded plots, grobs, and gTrees.

For a plot-only diagnostic node:

```yaml
- id: score_plot
  kind: r
  source: scripts/score_plot.R
  in: { cohort: features }
  out: { result: any }
```

```r
run <- function(cohort) {
  library(ggplot2)
  ggplot(cohort, aes(x = age, y = score)) + geom_point()
}
```

For table-producing analysis, keep the returned value tabular. If you need a
publishable plot and a table, use separate nodes so each output has a clear
type.

## Runtime Model

R nodes run in a warm R runner session for the selected `Rscript` during a
CLI/editor run. The runner is isolated from the host Node process, but startup
is amortized across R nodes that share the same interpreter.

Inputs and outputs move through Rime's Arrow-backed artifact path. The runner
reads upstream tables into R tabular values, calls your function, and returns
tables or JSON-like objects to the runtime.

## Environment

Required: R 4.0+ with `arrow`, `jsonlite`, and `tibble`.

```r
install.packages(c("arrow", "jsonlite", "tibble"))
```

Point Rime at a specific Rscript:

```bash
rime run pipeline.dag.yaml --rscript-bin "$(which Rscript)"
```

Or inline in the DAG:

```yaml
interpreters:
  r: /usr/local/bin/Rscript
```

## See Also

- [Python language nodes](/scripts/python/) - same slot protocol, pandas native
- [JavaScript language nodes](/scripts/javascript/) - `defineNode` and row arrays
- [SQL language nodes](/scripts/sql/) - DuckDB temp tables
- [Language node reference](/nodes/script/) - full field list
- [Polyglot runtime overview](/concepts/polyglot/) - cross-language design
