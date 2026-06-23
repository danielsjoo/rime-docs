---
title: rime build
description: Execute a DAG and render the HTML report.
---

```bash
rime build <pipeline.dag.yaml> [--out out.html] [--report report.yaml]
```

`rime build` runs the DAG exactly like `rime run`, then writes an HTML report.
By default, the report is generated from the DAG and each node's
`metadata.report` value.

## Common Usage

```bash
# Run + write outputs/run_report.html
rime build pipeline.dag.yaml

# Write to a specific file
rime build pipeline.dag.yaml --out outputs/review.html

# Compatibility path for a hand-authored report spec
rime build pipeline.dag.yaml --report report.yaml
```

## Output

The command streams lifecycle events, prints the same summary table as
`rime run`, then reports the HTML path:

```text
penguins: pending
penguins: cached cache=hit elapsedMs=24
penguins: success cache=hit rowsOut=10
Run summary:
Node         Status   Cache  Rows In  Rows Out
-----------  -------  -----  -------  --------
penguins     SUCCESS  hit    -        10
adelie_only  SUCCESS  hit    10       5
by_island    SUCCESS  hit    5        3
Report written: /path/to/project/outputs/run_report.html
```

`rime build` does not render a report over a failed or skipped run. If any node
fails, the command exits nonzero.

## Report Inclusion

Reports include nodes by default. Hide raw or noisy nodes with:

```yaml
metadata:
  report: false
```

See [Reports](/concepts/reports/) for report layout and output
rendering details.

## Related Commands

- [`rime run`](/cli/run/) - execute without rendering HTML.
- [`rime check`](/cli/check/) - validate report wiring without running.

