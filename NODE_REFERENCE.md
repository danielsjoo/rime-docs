# Node Reference (v2.1)

The node kinds in `@rimekit/core` v2.1. For the canonical Zod schemas see [`packages/core/src/schema.ts`](packages/core/src/schema.ts); the proposal at [`proposals/v2/dag-grammar.md`](proposals/v2/dag-grammar.md) has more design rationale.

Every node has:
- `id: string` — unique within the DAG, identifier-shaped
- `kind: <discriminator>` — picks which fields below are valid
- `inputs?: string[]` — upstream refs (`nodeId` or `nodeId.outputName`) for positional-input nodes; language and HTML nodes use named `in:` maps
- `metadata?: { label?, group?, report?, visual_stats?, cache? }` — optional, strict (no passthrough)

Type-specific fields are **at the top level on the node**, not in a `params:` bag.

---

## `source` — file-based ingress

```yaml
- id: patients
  kind: source
  path: data/patients.csv         # project-relative; under dataDir/ by convention
```

`id` + `kind` + `path:`. Extension picks the loader: `.csv` (header-inferred), `.json` / `.ndjson`, `.parquet` (preserves types). No `inputs:`. A run-time `--source <id>=<file>` flag overrides `path:` for that node.

## `filter` — keep rows matching an expression

```yaml
- id: adults
  kind: filter
  inputs: [patients]            # length 1
  expr: "[age] >= 18"
```

## `derive` — add a computed column

```yaml
- id: lab_load
  kind: derive
  inputs: [patient_lab]         # length 1
  as: lab_load                   # new column name
  expr: "coalesce([crp_mean], 0) * 1.6 + coalesce([ldl_max], 0) * 0.035"
```

## `aggregate` — group + reduce

```yaml
- id: by_site
  kind: aggregate
  inputs: [data]                 # length 1
  groupBy: ["[site]"]
  metrics:
    - "[mean_score] = [score].mean()"
    - "[n] = [score].count()"
```

`groupBy` may be empty for global aggregations.

## `select` — keep specific columns

```yaml
- id: keep_cols
  kind: select
  inputs: [data]
  columns: [a, b, c]
```

## `sort`

```yaml
- id: sorted
  kind: sort
  inputs: [data]
  by:
    - { expr: "[total_bill]", direction: desc }
    - { expr: "[date]", direction: asc }
```

`by[].direction` defaults to `asc`.

## `join` — two-input join

```yaml
- id: enriched
  kind: join
  inputs: [orders, customers]    # length 2
  leftKey: customer_id
  rightKey: id
  how: left                       # inner | left, default inner
```

## `pivot`

```yaml
- id: monthly
  kind: pivot
  inputs: [sales]
  index: [region]
  columns: month
  values: revenue
  agg: sum                        # sum | mean | count, default sum
```

## `concat` — stack tables row-wise with a label column

```yaml
- id: combined
  kind: concat
  inputs: [batch_a, batch_b]     # ≥2
  groupColumn: batch              # added column tagging each row's source
  groupLabels: [a, b]             # optional; defaults to input ref strings
  schemaMode: union               # strict | intersect | union, default strict
```

## Stat nodes (terminal — produce stat-shaped object outputs)

### `t_test`

```yaml
- id: tt
  kind: t_test
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupA: control
  groupB: treatment
  equalVariance: false            # default true
```

### `anova`

```yaml
- id: a
  kind: anova
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupLabels: [a, b, c]          # optional
```

### `mann_whitney_u`

```yaml
- id: mw
  kind: mann_whitney_u
  inputs: [data]
  valueColumn: outcome
  groupColumn: arm
  groupA: control
  groupB: treatment
```

### `chi_square`

```yaml
- id: cs
  kind: chi_square
  inputs: [data]
  columnA: site
  columnB: age_group
```

### `correlation`

```yaml
- id: cor
  kind: correlation
  inputs: [data]
  columnA: x
  columnB: y
  method: pearson                 # pearson | spearman, default pearson
```

### `linear_regression`

```yaml
- id: lr
  kind: linear_regression
  inputs: [training]
  feature: x
  target: y
  testFraction: 0.2               # optional
  seed: 42                        # optional
```

> Stat nodes consume integer columns (polars Int64 ↔ JS BigInt) automatically; `toFiniteNumber()` coerces in the executor.

## `subgraph` — embed a sub-DAG via external file

```yaml
- id: feature_pipeline
  kind: subgraph
  source: subpipelines/features.dag.yaml   # external file (v2 — was inline `graph:` in v1)
  bindings:                                 # alias name → outer ref
    raw_input: outer_node_id
  outputs:                                  # exposed name → inner ref
    feature_a: inner_node_a
    feature_b: inner_node_b.train
```

The inner spec parses as a v2 DAG. Lineage / engine treat the subgraph as opaque from the outside; bindings/outputs are the contract.

## `html` — file-backed HTML artifact

```yaml
- id: site_chart
  kind: html
  source: reports/site_chart.html
  in:
    rows: by_site
    caption: params.caption
```

`kind: html` packages an authored HTML file as a reproducible `html_artifact`.
Rime does not render the page during the run. It reads `source:`, injects a JSON
payload into the document, writes `outputs/<nodeId>/default.html`, and embeds the
artifact in generated HTML reports.

The injected payload is an inert JSON script tag:

```html
<script type="application/json" id="rime-inputs">{ ... }</script>
```

Its shape is:

```ts
{
  version: 1,
  nodeId: "site_chart",
  inputRefs: { rows: "by_site", caption: "params.caption" },
  inputs: {
    rows: [{ site: "A", n: 10 }],
    caption: "Sites by cohort"
  }
}
```

Inside `reports/site_chart.html`, browser-side code can read it:

```html
<script>
  const payload = JSON.parse(document.getElementById('rime-inputs').textContent)
  renderChart(payload.inputs.rows, payload.inputs.caption)
</script>
```

Use this when the last mile is custom HTML, D3/Observable/Vega, or an interactive
widget. If the standard report layout is enough, use `rime build` without an HTML
node. If the HTML itself must be generated by code, use a JavaScript language node
that returns an `html_artifact`.

## Language nodes — Python / R / JavaScript / SQL

Language nodes use the language as their `kind:`: `python`, `r`, `javascript`, or
`sql`. They use a named **`in:`** map instead of positional `inputs:`. The
slot keys must match the language node's declared/inferred parameters (Python signature, R
`register()` / function args, JS `defineNode`, SQL `FROM`/`JOIN` table identifiers).
Top-level scalars come from the [top-level `params:` block](#top-level-params-block-v21)
and are wired via `params.<name>` refs.

```yaml
specification_version: "2.1"

params:
  threshold: { type: float, default: 0.5 }

nodes:
  - id: features
    kind: python                  # python | r | javascript | sql
    source: scripts/features.py
    in:                           # named slot map: slot → ref
      cohort:    upstream_node    # node ref → resolves to a Table
      threshold: params.threshold # params.<name> → resolves to a scalar
    out:                          # optional; declared overrides inferred
      default: table
    entrypoint: run               # optional; default `run` for python/r, `main` for js
```

Schema-qualified SQL refs keep the dot in the slot key (the YAML must quote it):

```yaml
in:
  "main.patients": upstream_a
  "staging.labs":  upstream_b
```

Empty `in:` is permitted in **any** language for ingress (SQL reads external files via
DuckDB; Python/R/JS scripts may fetch their own data).

### Top-level `params:` block (v2.1)

Scalars only: `float`, `int`, `string`, `bool`, `date`, `timestamp`. Immutable for the
run; defaults at declaration; CLI/env overrides at run-start (`rime run --param
name=value` or `RIME_PARAM_<NAME>` env). Reachable from any language or HTML node's
`in:` slot via `params.<name>`. Per-node param refs are tracked precisely — overriding `--param
threshold=0.7` only busts caches of nodes that actually wire `params.threshold`.

```yaml
params:
  threshold:   { type: float, default: 0.5 }
  cohort_date: { type: date,  required: true }
```

Per-node `params:` blocks (e.g. `params: { random_seed: 20260505 }`) are deprecated in
2.1 — declare the value at the top level and reference it via `params.random_seed`.

See [`CUSTOM_SCRIPT.md`](CUSTOM_SCRIPT.md) for per-language protocols.

---

## Removed in v2

| v1 kind | v2 replacement |
|---|---|
| `custom_script` | `kind: python`, `kind: r`, `kind: javascript`, or `kind: sql` |
| `sql` | `kind: sql` (with inputs) |
| `sql_source` | `kind: sql` (no inputs) |
| `predict` | use `kind: python` (sklearn) — see [`proposals/v2/dag-grammar.md`](proposals/v2/dag-grammar.md#removed-deferred--see-note-below-predict) |
| `table` | generated automatically in the HTML report; set `metadata.report: false` to hide a node |
| `html_block` | `kind: html` |
| `drop` / `rename` / `distinct` / `window` | `select` + a language node |

## Metadata

```yaml
metadata:
  label: "Friendly node label"     # editor display
  group: "feature_engineering"     # editor grouping
  report: false                    # optional; omit or true to include in auto-report
  visual_stats: ["row_count"]      # engine emits these on each run
  cache:                            # per-node cache override
    policy: ttl
    seconds: 3600
```

`metadata` is closed (no passthrough). v1's `includeInConsort`, `outputConsort`, `export`, `customScriptIo`, `inputAliases` are all gone — those were presentation/script concerns, now controlled by `metadata.report` or derived from script `out:`.

## Validation rules (graph-level)

`validateDagSpec`:
1. Per-kind structural validation (Zod discriminated union)
2. Unique node ids
3. All input refs resolve to a known node (`kind: source` has no `inputs:`; its `path:` is checked at run time, not by the schema)
4. Acyclic (cycle errors include the offending node id)

Errors carry a `[V2_DAG_SCHEMA file:path]` or `[V2_DAG_GRAPH file:path]` code that downstream tooling parses.
