---
title: rime check
description: Validate a DAG and optional report spec without executing nodes.
---

```bash
rime check <pipeline.dag.yaml> [--report report.yaml] [--source source_id=path]
```

`rime check` is the launch-readiness preflight. It validates the DAG the same
way `rime validate` does, then checks report wiring if you pass `--report`.

## What It Checks

- YAML syntax and DAG schema
- unique node IDs
- input references and graph cycles
- source nodes are bound by `path:` or `--source`
- project-mode script path guardrails
- optional `report.yaml` references, node IDs, section targets, and columns

## Common Usage

```bash
# DAG only, report is generated from metadata.report
rime check examples/single-file/pipeline.dag.yaml

# DAG plus an explicit legacy report spec
rime check pipeline.dag.yaml --report report.yaml

# Override a source file for this check
rime check pipeline.dag.yaml --source patients=data/patients-q2.csv
```

## Output

For a DAG-driven report:

```text
Root: /path/to/project
Spec: /path/to/project/pipeline.dag.yaml
Sources resolved: 1
Report: auto (metadata.report controls inclusion)
Check OK
```

If an explicit `report.yaml` references a missing node or output, `rime check`
prints report diagnostics and exits nonzero before any node executes.

## Related Commands

- [`rime validate`](/cli/validate/) - DAG-only validation.
- [`rime build`](/cli/build/) - run the DAG and render HTML.

