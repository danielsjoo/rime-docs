---
title: Install
description: Install the Rime CLI and its language sidecars.
---

Rime ships in two flavors: a single-file binary (no Node required) and a set of npm packages (for programmatic use). Pick whichever fits your workflow.

## Binary (recommended for end users)

Coming soon. The release pipeline is in place but the first tagged version hasn't shipped yet. Once available:

```bash
# macOS / Linux (Homebrew)
brew install rimekit/tap/rime

# Manual download
curl -L https://github.com/rimekit/rime/releases/latest/download/rime-$(uname -s)-$(uname -m) -o /usr/local/bin/rime
chmod +x /usr/local/bin/rime
```

## npm (for programmatic use)

```bash
npm install @rimekit/core         # DAG schema + engine
npm install @rimekit/lineage      # lineage utilities
npm install @rimekit/runtime      # CLI + script executors (provides the `rime` bin)
```

After installing `@rimekit/runtime`, the `rime` command will be available via `npx`:

```bash
npx rime --help
```

## Language sidecars

If your DAG includes Python or R script nodes, you need a working interpreter on PATH (or pointed at via `--python-bin` / `--rscript-bin`) with the required packages installed.

### Python

Minimum: Python 3.11. Required packages: `pyarrow` (data interchange), plus whatever your scripts import.

```bash
# Recommended: use uv to manage an isolated environment
uv venv .venv
source .venv/bin/activate
uv pip install pyarrow pandas

# Or stock pip
python3 -m venv .venv
source .venv/bin/activate
pip install pyarrow pandas
```

Point Rime at it:

```bash
rime run pipeline.dag.yaml --python-bin .venv/bin/python
# or
export RIME_PYTHON_BIN=$(pwd)/.venv/bin/python
```

### R

Minimum: R 4.0. Required packages: `arrow`, `jsonlite`, plus whatever your scripts use.

```r
install.packages(c("arrow", "jsonlite", "tibble"))
```

Point Rime at it:

```bash
rime run pipeline.dag.yaml --rscript-bin $(which Rscript)
# or
export RIME_RSCRIPT_BIN=$(which Rscript)
```

## Verifying the install

```bash
rime --help
rime --version
rime validate examples/single-file/pipeline.dag.yaml
```

If all three succeed, you're ready. Move on to the [Quick start](/get-started/quick-start/).
