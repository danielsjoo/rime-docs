---
title: Editor Python and R setup
description: Preview how the coming Rime Editor should resolve Python and R interpreters for script nodes.
---

Rime Editor is coming soon. This page previews the intended interpreter
configuration model; use CLI flags or environment variables for Python and R
selection today.

Rime Editor uses the same interpreter model as the CLI. Python and R nodes run through configured local interpreters; SQL and JavaScript run through the built-in runtime paths.

## Resolution Order

When the editor runs a DAG, Python and R interpreter paths resolve in this order:

1. project/editor selection
2. DAG `interpreters:` block
3. environment variables such as `RIME_PYTHON_BIN` and `RIME_RSCRIPT_BIN`
4. system fallback (`python3`, `Rscript`)

The important rule is that interpreter choice is execution configuration, not pipeline structure. The DAG can declare defaults, but local machines and CI can override them.

```yaml
specification_version: "2.1"

interpreters:
  python: .venv/bin/python
  r: /usr/local/bin/Rscript
```

## What The Editor Should Show

The environment surface should stay lightweight:

- selected Python path
- selected R path
- automatic status after a path changes or before a DAG run
- missing package messages when a script node cannot run
- raw interpreter output only when something fails

There should not be a separate “probe” ritual for normal use. If the user tries to run the DAG with default paths, the editor can check automatically and surface the result in context.

## Script Nodes

Language nodes declare named data slots in YAML:

```yaml
- id: features
  kind: python
  source: scripts/features.py
  in:
    cohort: repeat_visitors
    threshold: params.threshold
```

The editor should render `cohort` as an input edge and keep scalar `params.*` bindings visible in the spec/config surface.

## CLI Equivalent

```bash
export RIME_PYTHON_BIN=.venv/bin/python
export RIME_RSCRIPT_BIN=/usr/local/bin/Rscript
rime run pipeline.dag.yaml
```

For runtime behavior, see [Polyglot runtime](/concepts/polyglot/).
