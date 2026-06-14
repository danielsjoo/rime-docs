---
title: Editor — Python & R setup
description: How Rime Editor discovers your Python and R interpreters.
---

:::caution
Placeholder. The editor's interpreter discovery + env management UI is in active development. This page will be filled in with the full setup walkthrough once it ships.
:::

The short version: Rime Editor discovers Python and R interpreters on your system at launch, lists them in Preferences → Interpreters, and lets you pick which to use per project. Behind the scenes, this maps to the same `RIME_PYTHON_BIN` / `RIME_RSCRIPT_BIN` mechanism the CLI uses.

For the CLI-equivalent semantics, see [ENV_MANAGEMENT.md in the repo](https://github.com/rimekit/rime/blob/main/ENV_MANAGEMENT.md) and [Polyglot runtime](/rime-docs/concepts/polyglot/).
