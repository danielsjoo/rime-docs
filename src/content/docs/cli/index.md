---
title: CLI overview
description: The Rime CLI commands for validating, running, reporting, and checking cache freshness.
---

The Rime CLI works against a `pipeline.dag.yaml` file. Relative source paths,
script paths, and outputs resolve from the directory that contains that DAG.

## Command Map

| Command | Use it for |
|---|---|
| [`rime validate`](/cli/validate/) | Parse the DAG, validate node schemas, resolve graph references, and check source bindings without executing nodes. |
| [`rime check`](/cli/check/) | Do everything `validate` does, plus validate an optional `report.yaml` against the DAG. |
| [`rime run`](/cli/run/) | Execute nodes and persist outputs under `outputs/`. |
| [`rime build`](/cli/build/) | Run the DAG and render an HTML report. |
| [`rime verify`](/cli/verify/) | Check whether cached artifacts still match the current DAG, source files, params, and output digests. |
| [`rime introspect`](/cli/introspect/) | Generate a starter node block from a Python, R, JavaScript, or SQL script. |

## Common Flow

```bash
rime validate pipeline.dag.yaml
rime check pipeline.dag.yaml
rime run pipeline.dag.yaml
rime build pipeline.dag.yaml
rime verify pipeline.dag.yaml
```

Use `--source node_id=path/to/file` to override a source file for a single
command. Use `--param name=value` on run-like commands to override top-level
DAG params.

## Exit Codes

| Code | Meaning |
|---|---|
| `0` | Command completed successfully. |
| `1` | Validation, execution, report, or cache verification failed. |
| `2` | Invocation error such as a missing command or malformed flag. |

