---
title: rime run
description: Execute a DAG and persist outputs.
---

```bash
rime run <pipeline.dag.yaml> [options]
```

Run the DAG end-to-end. Reads cache where keys match, executes nodes whose
inputs have changed, and persists outputs under `outputs/`. It does not render
a report; use [`rime build`](/rime-docs/cli/build/) for that.

## Common usage

```bash
# Fresh run, default everything
rime run pipeline.dag.yaml

# Point at a specific Python interpreter (overrides RIME_PYTHON_BIN)
rime run pipeline.dag.yaml --python-bin ~/conda/envs/foo/bin/python

# Override a source node's data file
rime run pipeline.dag.yaml --source patients=data/patients-q2.csv

# Pass a top-level param
rime run pipeline.dag.yaml --param threshold=0.7

# Recompute everything but keep writing cache
rime run pipeline.dag.yaml --no-cache-read

# Cache-free run (verifying someone else's pipeline)
rime run pipeline.dag.yaml --lean

# Isolated run that doesn't touch your live outputs/
rime run pipeline.dag.yaml --isolated $TMPDIR/rime-ci
```

## Flags

### Interpreter

| Flag | Default | Description |
|---|---|---|
| `--python-bin <path>` | `$RIME_PYTHON_BIN` or `python3` on PATH | Python interpreter for `kind: python` language nodes |
| `--rscript-bin <path>` | `$RIME_RSCRIPT_BIN` or `Rscript` on PATH | Rscript binary for `kind: r` language nodes |

### Inputs

| Flag | Description |
|---|---|
| `--source <id>=<path>` | Override a `kind: source` node's `path:` (repeatable) |
| `--param <name>=<value>` | Override a top-level param value (repeatable) |

### Cache control

| Flag | Effect |
|---|---|
| `--lean` | No cache reads, no cache writes — recompute everything, leave no artifacts |
| `--no-cache-read` | Recompute everything, but write fresh cache entries |
| `--no-cache-write` | Read cache where possible, don't persist new entries |
| `--isolated <dir>` | Treat `<dir>` as the outputs root; doesn't touch the live `outputs/` |

See [Outputs & caching](/rime-docs/concepts/outputs/) for the full semantics.

## Output

Per-node lifecycle events are streamed to stdout, followed by a summary table:

```
penguins: pending
penguins: planning
penguins: cached cache=hit elapsedMs=24
penguins: success cache=hit rowsOut=10
Run started: 2026-06-23T06:21:48.068Z
Run completed: 2026-06-23T06:21:48.124Z
Run summary:
Node         Status   Cache  Rows In  Rows Out
-----------  -------  -----  -------  --------
penguins     SUCCESS  hit    -        10
adelie_only  SUCCESS  hit    10       5
by_island    SUCCESS  hit    5        3
```

Failures abort the run and print the relevant validation error, script
traceback, or executor error to stderr.

## Related commands

- [`rime validate`](/rime-docs/cli/validate/) — pre-flight checks without executing
- [`rime check`](/rime-docs/cli/check/) — pre-flight checks plus optional report spec validation
- [`rime build`](/rime-docs/cli/build/) — `rime run` plus render the DAG-driven HTML report
- [`rime verify`](/rime-docs/cli/verify/) — check whether existing cached outputs are still current
- `rime freeze` — snapshot the current `outputs/` for archival

## Exit codes

| Code | Meaning |
|---|---|
| 0 | All nodes succeeded |
| 1 | One or more node failures (full traceback printed to stderr) |
| 2 | Usage / invocation error (bad flag, missing file) |
