---
title: Outputs & caching
description: How Rime persists data, hashes cache keys, and freezes snapshots.
---

Rime persists every node's output to disk and remembers what produced it. On the next run, anything whose inputs haven't changed is read straight from disk; the engine only re-executes nodes whose cache key has changed.

## Live outputs root

By default, outputs land in `outputs/` next to your `pipeline.dag.yaml`.

```
outputs/
├── <nodeId>/
│   ├── <outputName>.parquet        # tabular outputs
│   ├── <outputName>.parquet.meta.json
│   ├── <outputName>.json           # stat-node outputs
│   └── <outputName>.json.meta.json
└── <reportId>.html                 # built report from `rime build`
```

Operational files live under `.rime/`:

```
.rime/
├── state.lock                       # single-writer lock
└── tmp/                             # atomic-write staging area
```

Both `outputs/` and `.rime/` should be in your `.gitignore`.

## How cache keys are computed

A node's cache key hashes:

- **Node content** — `kind`, `inputs`, `expr`/`metrics`/`columns`/whatever the kind declares, `output`, and `metadata.cache`
- **Parent output digests** — so any upstream change invalidates downstream
- **Spec + runtime versions**
- **Source file digest** (for `source` nodes, the data file's content hash)
- **Language source digest** (for `kind: python`, `kind: r`, `kind: javascript`, and `kind: sql` nodes, the source file + its declared requirements)

Two runs produce identical cache keys iff they would produce identical outputs. Outputs are content-addressable.

## Read / write controls

| Flag | Effect |
|---|---|
| (default) | Read cache when keys match, write fresh outputs otherwise |
| `--lean` | No cache reads, no cache writes — fully recompute, don't persist |
| `--no-cache-read` | Recompute everything, but write fresh cache |
| `--no-cache-write` | Read cache when possible, don't write new entries |
| `--isolated <dir>` | Use `<dir>` as an isolated outputs root (doesn't touch the live `outputs/`) |

Useful patterns:

- **Iterating on a script** — keep default; the engine re-runs only your changed node and its descendants
- **Reproducing someone else's pipeline** — `--lean` to verify the result without leaving cache artifacts
- **CI runs** — `--isolated $TMPDIR/ci-run` to keep CI outputs from polluting your local cache

## Freezing a snapshot

```bash
rime freeze --project ./my-project --to ./snapshots/2026-05-26
```

Copies the entire current `outputs/` tree to `<dest>` as an immutable snapshot. Useful for archiving the exact data behind a published report.

(Freeze requires project mode — a `rime.project.yaml` marker. Single-file DAGs don't have a snapshot concept.)
