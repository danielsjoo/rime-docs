---
title: R language nodes
description: How R language nodes work in Rime — function signature, tibbles in, dataframes out, Arrow IPC under the hood.
---

An R language node uses `kind: r`. You write a function via `rime::register(...)`; the runtime hands it tibbles as named arguments and captures whatever you return.

## Minimum example

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
rime::register(
  function(cohort, threshold) {
    cohort$flag <- cohort$score > as.numeric(threshold)
    cohort
  },
  in_slots  = list(cohort = "table", threshold = "any"),
  out_slots = list(default = "table")
)
```

The `rime::register(...)` call wires your function into the runtime's named-slot protocol. The function's argument names must match the YAML's `in:` keys.

## Function signature

The runtime calls your registered function with named arguments matching the slot keys.

> The default entrypoint is `run` (or `transform`, which the Editor emits — both
> are accepted). To use a different name, set `entrypoint:` on the node.

| YAML `in:` slot | Native R type |
|---|---|
| Upstream node ID (e.g. `cohort: features`) | **`tibble`** (`tbl_df`) |
| `params.<name>` (e.g. `threshold: params.threshold`) | Native R scalar (numeric, character, logical, list) |

`in_slots` and `out_slots` in `rime::register(...)` are how R communicates the schema back to the runtime — they enable type checking and editor autocomplete. Use `"table"` for tibbles and `"any"` for non-tabular values.

## Outputs

### Single output (default)

Return a tibble (or any data.frame; the runtime coerces). The runtime writes it to the node's `default` output:

```r
rime::register(
  function(orders) {
    dplyr::filter(orders, total > 0)
  },
  in_slots  = list(orders = "table"),
  out_slots = list(default = "table")
)
```

### Multiple named outputs

Return a named list of tibbles. Each name becomes an output:

```r
rime::register(
  function(cohort) {
    n     <- nrow(cohort)
    train <- dplyr::slice_sample(cohort, prop = 0.8)
    test  <- dplyr::anti_join(cohort, train, by = colnames(cohort))
    list(train = train, test = test)
  },
  in_slots  = list(cohort = "table"),
  out_slots = list(train = "table", test = "table")
)
```

YAML must declare matching outputs:

```yaml
- id: split
  kind: r
  source: scripts/split.R
  in:  { cohort: features }
  out: { train: table, test: table }
```

Downstream references: `split.train`, `split.test`.

### Non-tabular outputs

Return a list / vector / scalar with `out_slots = list(result = "any")`. The runtime serializes the value to JSON via `jsonlite::toJSON`. Use this for fit summaries, lists of parameters, or anything not naturally tabular.

```r
rime::register(
  function(cohort) {
    fit <- lm(score ~ age + treatment, data = cohort)
    list(
      coefficients = coef(fit),
      r_squared    = summary(fit)$r.squared
    )
  },
  in_slots  = list(cohort = "table"),
  out_slots = list(result = "any")
)
```

## What happens under the hood

When the runtime calls into R:

1. **Inputs are written as Arrow IPC streams.** The runtime serializes each upstream output with `pyarrow` and writes the IPC stream to a per-node temp file.
2. **R reads them as tibbles** via `arrow::read_ipc_stream(...)`. The Arrow → tibble cast is **near-constant-time** for numeric and character columns — the Arrow C++ library shares buffers with R's altrep / ALTREP mechanism where possible, deferring the materialization until you actually touch the column. (For data types arrow doesn't natively altrep, you'll see a one-time materialization cost, but it's still O(n) with a small constant.)
3. **Your registered function runs** in a fresh `Rscript` subprocess.
4. **Outputs go back the same way** — your tibble is written as Arrow IPC, read back by the runtime, written as Parquet for the next node.
5. **stdout (`print`, `cat`) and warnings are captured** in the audit trail.

## Subprocess model

Each script-node run spawns a fresh `Rscript` process — no warm session, no shared `.GlobalEnv` across nodes. Cold-start cost is real (~500ms for R, larger than Python). If your node needs to load a big model or library, do all the work in one node; don't split across many small R nodes.

## Environment

Required: R 4.0+ with the `rime` R package (provides `rime::register`), `arrow`, `jsonlite`, and `tibble`.

```r
install.packages(c("arrow", "jsonlite", "tibble", "rime"))
```

(The `rime` R package ships with the Rime runtime; it's installed automatically when the runtime is set up via the bundled `runtimes/r/` sidecar.)

Point Rime at a specific Rscript:

```bash
export RIME_RSCRIPT_BIN=$(which Rscript)
rime run pipeline.dag.yaml
```

Or inline in the DAG:

```yaml
interpreters:
  r: /Library/Frameworks/R.framework/Resources/bin/Rscript
```

## Capturing plots

For ggplot or base R graphics, save to a temp file and the runtime will pick it up:

```r
rime::register(
  function(cohort) {
    library(ggplot2)
    p <- ggplot(cohort, aes(x = age, y = score)) + geom_point()
    rime::display_figure(p)   # captured into the audit trail
    cohort
  },
  in_slots  = list(cohort = "table"),
  out_slots = list(default = "table")
)
```

`rime::display_figure(p)` works with grid-based graphics (ggplot, lattice) and base R plots.

## See also

- [Python language nodes](/scripts/python/) — same protocol, pandas instead of tibble
- [JavaScript language nodes](/scripts/javascript/) — runs in Node 22+, in-process
- [SQL language nodes](/scripts/sql/) — runs against DuckDB
- [Language node reference](/nodes/script/) — full field list
- [Polyglot runtime overview](/concepts/polyglot/) — the cross-cutting design
