---
title: "`script`"
description: Custom logic in Python / R / JavaScript / SQL.
---

**v2.1**: script nodes use a named **`in:`** map instead of positional `inputs:`. The
slot keys must match the script's declared/inferred parameters (Python signature, R
`register()` / function args, JS `defineNode`, SQL `FROM`/`JOIN` table identifiers).
Top-level scalars come from the [top-level `params:` block](#top-level-params-block-v21)
and are wired via `params.<name>` refs.

```yaml
specification_version: "2.1"

params:
  threshold: { type: float, default: 0.5 }

nodes:
  - id: features
    kind: script
    language: python              # python | r | javascript | sql
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
name=value` or `RIME_PARAM_<NAME>` env). Reachable from any script node's `in:` slot
via `params.<name>`. Per-node param refs are tracked precisely — overriding `--param
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
