---
title: rime validate
description: Validate a DAG (or DAG + report) without running it.
---

```bash
rime validate <pipeline.dag.yaml> [--source source_id=path]
```

Parse the DAG, verify the schema, check graph integrity (no cycles, all input refs resolve), and confirm any companion `report.yaml` block references resolve. No execution.

## What it checks

1. **YAML parse** — file must be valid YAML
2. **Schema** — every node matches its `kind`'s Zod schema; unknown fields rejected
3. **Unique ids** — no duplicate `id:` across the DAG
4. **Input ref resolution** — every `inputs:` ref points at a known node (`nodeId` or `nodeId.outputName`)
5. **Acyclic** — no cycles; if one is found, the offending node id is in the error
6. **Source paths** — `kind: source` `path:` must be resolvable from the DAG directory (unless overridden by `--source`)
7. **Report cross-refs** — if a `report.yaml` lives next to the DAG, every `table.source` / `stat.source` is checked

## Flags

| Flag | Description |
|---|---|
| `--source <id>=<path>` | Override a `source` node's `path:` for this validation. Repeatable. |
| `--project <dir>` | Legacy: walk up to a `rime.project.yaml` marker for project-mode validation |

## Output

On success, prints a one-line summary:

```
✅ pipeline.dag.yaml validated (14 nodes, 0 warnings)
```

On failure, structured errors:

```
[V2_DAG_SCHEMA pipeline.dag.yaml:nodes[3].kind]
  expected one of: source | filter | derive | aggregate | select | sort | ...
  got: 'transform'

[V2_DAG_GRAPH pipeline.dag.yaml:nodes[7].inputs[0]]
  references unknown node 'cohorts' — did you mean 'cohort'?
```

Error codes have stable prefixes: `V2_DAG_SCHEMA`, `V2_DAG_GRAPH`, `V2_REPORT_REF`, `V2_PARAM`.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Validation passed |
| 1 | Validation failed (one or more errors printed to stderr) |
| 2 | Usage / invocation error |
