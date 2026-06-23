---
title: Install
description: Install the Rime CLI and its language sidecars.
---

Rime is still pre-release. The supported path today is to run the CLI from a
local checkout. Tagged binaries and published npm packages are planned, but
they are not available yet.

## Current Source Install

```bash
git clone https://github.com/danielsjoo/rime
cd rime
npm install
npm run build:all
```

Run the built CLI with Node:

```bash
node packages/runtime/dist/cli.js validate examples/single-file/pipeline.dag.yaml
```

Expected output:

```text
Root: /path/to/rime/examples/single-file
Spec: /path/to/rime/examples/single-file/pipeline.dag.yaml
Sources resolved: 1
Validation OK
```

For day-to-day local work, add a shell alias:

```bash
alias rime="node /path/to/rime/packages/runtime/dist/cli.js"
```

Then verify the alias:

```bash
rime validate examples/single-file/pipeline.dag.yaml
rime check examples/single-file/pipeline.dag.yaml
```

## Planned Release Installs

The intended release channels are:

- a single-file CLI binary for macOS, Linux, and Windows
- published `@rimekit/*` npm packages for programmatic use
- packaged Rime Editor builds that bundle the compatible runtime

Until those channels exist, avoid docs, scripts, or deployment steps that assume
Homebrew, published runtime packages, or version-reporting CLI flags work from
a clean machine.

## Language Sidecars

Core nodes and SQL nodes work after the Node build. If your DAG includes Python
or R language nodes, point Rime at an interpreter with the required packages
installed.

### Python

Minimum: Python 3.11. Required packages: `pyarrow` and `pandas`, plus whatever
your scripts import.

```bash
uv venv .venv
source .venv/bin/activate
uv pip install pyarrow pandas
```

Or with stock `venv`:

```bash
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

Minimum: R 4.0. Required packages: `arrow`, `jsonlite`, and `tibble`, plus
whatever your scripts import.

```r
install.packages(c("arrow", "jsonlite", "tibble"))
```

Point Rime at it:

```bash
rime run pipeline.dag.yaml --rscript-bin "$(which Rscript)"
# or
export RIME_RSCRIPT_BIN="$(which Rscript)"
```

## Smoke Test

After the source install, use the smallest checked-in example:

```bash
rime validate examples/single-file/pipeline.dag.yaml
rime build examples/single-file/pipeline.dag.yaml --out /tmp/rime-single-file-report.html
```

If both commands succeed, continue to the
[Quick start](/rime-docs/get-started/quick-start/).
