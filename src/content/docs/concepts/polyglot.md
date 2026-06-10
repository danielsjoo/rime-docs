---
title: Polyglot runtime
description: How Rime mixes SQL, Python, R, and JavaScript inside one DAG. Same protocol across all four languages.
---

Rime's defining property is its polyglot runtime: a single DAG can use four languages for transforms, each with native-feeling APIs and zero glue code between them.

## The protocol in one sentence

Each language node declares **named input slots** in YAML; the runtime materializes each upstream output as a **native value** in the target language (pandas DataFrame, R tibble, Arrow Table, DuckDB temp table) and passes it as a named function argument; the script returns either a single tabular value (default output `default`) or a map of named outputs.

Tabular handoffs use **Arrow IPC** — the on-wire format is the same across all four languages. Decoding to the native type is constant-time for most numeric/string columns (zero-copy where the language has Arrow-aware buffer sharing).

## The four languages

| Language | Native input type | Runtime model | Cold start |
|---|---|---|---|
| **Python** | `pandas.DataFrame` | Subprocess (one per node) | ~200ms |
| **R** | `tibble` | Subprocess (one per node) | ~500ms |
| **JavaScript** | `{ schema, rows }` + raw `arrow.Table` access | **In-process** (no subprocess) | ~0 |
| **SQL** | Temp table named by slot key | DuckDB in-memory (warm across nodes) | ~0 |

JavaScript and SQL are effectively free to call (no cold start). Python and R pay a per-node interpreter startup cost — keep that in mind when designing the DAG: prefer one fat Python node over many small ones.

## Per-language pages

Each language has a dedicated guide describing function signature, input/output handling, and what the YAML node needs to declare:

- **[Python language nodes](/scripts/python/)** — pandas DataFrame in, dataframe out, matplotlib capture
- **[R language nodes](/scripts/r/)** — tibble in, dataframe out, ggplot capture, `rime::register` protocol
- **[JavaScript language nodes](/scripts/javascript/)** — row arrays or Arrow Table in, in-process execution, ideal for API fetches
- **[SQL language nodes](/scripts/sql/)** — runs on warm DuckDB, ingress mode for reading files directly
- **[HTML output](/scripts/html/)** — *not a script language*, but a guide to producing custom HTML artifacts from a JS node

## Per-call subprocess model (Python + R)

Each Python or R script-node run spawns a fresh subprocess. No warm pool, no shared interpreter state across nodes. This trades raw throughput for isolation and reproducibility.

If you need warm state (loaded ML model, big initialized session), keep the work inside **one** language node.

## Interpreter resolution

The CLI resolves Python and R via env vars (or inline `interpreters:` in the DAG):

```bash
export RIME_PYTHON_BIN=/path/to/conda/envs/myenv/bin/python
export RIME_RSCRIPT_BIN=$(which Rscript)
rime run pipeline.dag.yaml
```

CLI flags override env vars: `--python-bin` and `--rscript-bin`. When neither is set, defaults are `python3` and `Rscript` on PATH.

You can also declare interpreters inline in the DAG (handy for one-machine pipelines):

```yaml
specification_version: "2.1"
interpreters:
  python: /Users/me/conda/envs/foo/bin/python
  r:      /Library/Frameworks/R.framework/Resources/bin/Rscript
nodes: [...]
```

CLI / env / flags always override inline `interpreters:`.

## Captured side effects

The runtime captures per node:

- **stdout** — `print()`, `cat()`, `console.log()` output, available via `auditTrail.get(nodeId).stats.captured_stdout`
- **matplotlib figures** (Python) — call `rime_runner.display_figure(fig)` to embed a PNG in the audit
- **ggplot / lattice / base R plots** — call `rime::display_figure(p)` from R
- **error tracebacks** — full subprocess stderr on non-zero exit

These surface in the rendered HTML report on that node's card.

## Why Arrow IPC

Three reasons Rime chose Arrow IPC as the wire format across language boundaries:

1. **Constant-time decode.** Arrow is columnar with a fixed binary layout. Decoding to pandas / tibble / DuckDB table is a metadata read + pointer-bind for compatible types — independent of row count.
2. **Zero-copy where possible.** Python's buffer protocol, R's altrep, and DuckDB's Arrow adapter all let the in-memory representation share buffers with Arrow. You pay one allocation, not one-per-column-per-language.
3. **Type fidelity.** Arrow's type system is rich enough to round-trip pandas `Categorical`, R factors, DuckDB enum types, and timestamps with timezones — none of the lossiness of CSV/JSON.

For non-tabular outputs (`out: { result: any }`), the runtime falls back to JSON encode/decode. Use `any` sparingly — it's the only place you pay JSON costs.
