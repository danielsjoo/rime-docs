---
title: rime verify
description: Check whether cached outputs still match the current DAG and inputs.
---

```bash
rime verify <pipeline.dag.yaml> [--source id=path] [--param name=value] [--isolated dir] [--json]
```

`rime verify` recomputes cache keys and output digests without executing the
DAG. Use it when you want to know whether `outputs/` is still current for a
given DAG, source binding, and param set.

## Common Usage

```bash
rime verify pipeline.dag.yaml
rime verify pipeline.dag.yaml --param threshold=0.7
rime verify pipeline.dag.yaml --source patients=data/patients-q2.csv
rime verify pipeline.dag.yaml --json
```

## Output

```text
Verify summary:
Node         Status   Reason
-----------  -------  -----------------------------------
penguins     CURRENT  cache key and artifact digest match
adelie_only  CURRENT  cache key and artifact digest match
by_island    CURRENT  cache key and artifact digest match
```

If any node is stale, missing, or has a digest mismatch, the command exits
nonzero. Use `--json` when a CI job or editor integration needs structured
status.

## When To Use It

- before publishing a report from existing outputs
- in CI to detect stale checked-in artifacts
- after changing params or source overrides
- when debugging whether a cache hit is expected

## Related Commands

- [`rime run`](/cli/run/) - recompute stale nodes.
- [`rime build`](/cli/build/) - run and render a report.

