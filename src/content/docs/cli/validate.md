---
title: rime validate
description: Validate a DAG (or DAG + report) without running it.
---

```bash
rime validate <pipeline.dag.yaml> [--source source_id=path]
```

Parse the DAG, verify the schema, and check graph integrity. No nodes execute.

## What it checks

1. **YAML parse** — file must be valid YAML
2. **Schema** — every node matches its `kind`'s Zod schema; unknown fields rejected
3. **Unique ids** — no duplicate `id:` across the DAG
4. **Input ref resolution** — every `inputs:` ref points at a known node (`nodeId` or `nodeId.outputName`)
5. **Acyclic** — no cycles; if one is found, the offending node id is in the error
6. **Source paths** — `kind: source` `path:` must be resolvable from the DAG directory (unless overridden by `--source`)
7. **Report metadata** - node `metadata.report` values are checked by the closed DAG schema

## Flags

| Flag | Description |
|---|---|
| `--source <id>=<path>` | Override a `source` node's `path:` for this validation. Repeatable. |
| `--project <dir>` | Legacy: walk up to a `rime.project.yaml` marker for project-mode validation |

## Output

On success:

```
Root: /path/to/project
Spec: /path/to/project/pipeline.dag.yaml
Sources resolved: 1
Validation OK
```

On failure, structured errors use stable prefixes:

```
[V2_DAG_SCHEMA pipeline.dag.yaml:nodes[3].kind]
  expected one of: source | filter | derive | aggregate | select | sort | ...
  got: 'transform'

[V2_DAG_GRAPH pipeline.dag.yaml:nodes[7].inputs[0]]
  references unknown node 'cohorts' — did you mean 'cohort'?
```

Error codes have stable prefixes: `V2_DAG_SCHEMA`, `V2_DAG_GRAPH`, `V2_REPORT_REF`, `V2_PARAM`.

## Related Commands

- [`rime check`](/cli/check/) - validate DAG plus optional report wiring.
- [`rime run`](/cli/run/) - execute the DAG after validation passes.

## Exit codes

| Code | Meaning |
|---|---|
| 0 | Validation passed |
| 1 | Validation failed (one or more errors printed to stderr) |
| 2 | Usage / invocation error |
