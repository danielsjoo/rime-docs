---
title: Editor — Install
description: How to install Rime Editor.
---

:::caution
Coming soon. Rime Editor is in closed beta; the public download isn't available yet.
:::

Once the first public build ships, install paths will be:

## macOS

```bash
brew install --cask rimekit/tap/rime-editor   # tap not yet published
```

Or download the `.dmg` from the GitHub release page and drag to `/Applications`.

## Windows

Download the `.exe` installer from the GitHub release page.

## Linux

Download the `.AppImage` from the GitHub release page, mark it executable, and run.

```bash
chmod +x Rime-Editor-*.AppImage
./Rime-Editor-*.AppImage
```

## Auto-updates

The editor checks for updates on launch (toggleable in Preferences). New releases install on next quit.

## Verifying

Open the app and look for "Rime Editor" in the window title bar. The About dialog (menu: Rime Editor → About) shows the version and the bundled `@rimekit/runtime` version.
