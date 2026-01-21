# Auto Open Remote Folder

A VS Code extension that opens a configured folder on local or remote machines via command or keyboard shortcut.

## Problem

When working in VS Code, whether locally or on a remote machine via SSH, you often need to navigate to a specific project folder. When connecting to a remote machine, VS Code often defaults to opening `/root` or `/home`, but your source code typically lives in a different location. This extension automates opening your preferred folder on both local and remote machines.

## Features

- Opens a configured folder via command or keyboard shortcut (works on both local and remote machines)
- Supports project name detection using `{project}` placeholder
- Host-specific folder mappings (works for both remote SSH hostnames and local machine hostnames)
- OS-aware path handling (supports `~` for home directory, environment variables, and cross-platform paths)
- Keyboard shortcut: `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) - works everywhere

## Installation

### From Source

1. Clone or copy this extension to your local machine
2. Open the extension folder in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to open a new Extension Development Host window
5. Test the extension by pressing `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) or using the Command Palette
6. For remote testing, connect to your remote machine via SSH in the Extension Development Host window

### Packaging for Distribution

1. Install `vsce`: `npm install -g @vscode/vsce`
2. Package the extension: `vsce package`
3. Install the `.vsix` file: `code --install-extension auto-open-remote-folder-1.0.0.vsix`

## Configuration

Open VS Code settings (File > Preferences > Settings) and search for "Auto Open Remote Folder":

### Settings

- **`autoOpenRemoteFolder.defaultPath`** (default: `/local/src`)
  - Default folder path to open (works on both local and remote machines)
  - Use `{project}` placeholder to automatically detect project name
  - Supports `~` for home directory (e.g., `~/projects/{project}`)
  - Supports environment variables like `$HOME` (e.g., `$HOME/projects/{project}`)
  - Example: `/local/src/{project}` will open `/local/src/my-project` if there's exactly one folder in `/local/src`
  - Example (local): `~/projects/{project}` will open `~/projects/my-project` on your local machine

## Usage Examples

### Example 1: Simple Path
Set `defaultPath` to `/local/src/my-project` to always open that folder.

### Example 2: Project Name Detection
Set `defaultPath` to `/local/src/{project}`. The extension will automatically detect the single folder in `/local/src` and use its name. For example, if `/local/src` contains only `project01`, it will open `/local/src/project01`.

## Usage

### Keyboard Shortcut
Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) to open the configured folder. Works on both local and remote machines.

### Command Palette
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run the command: `Open Configured Folder`

## How It Works

1. The extension activates when you trigger the command (via keyboard shortcut or command palette)
2. It resolves the target folder path based on your configuration (supports `~`, environment variables, and `{project}` placeholder)
3. It checks if the folder exists
4. If valid, it opens the folder (replaces default folders like `/root`, `/home`, or user home directory if currently open, otherwise adds as workspace folder)
5. Shows an error message if the folder doesn't exist

## Requirements

- VS Code 1.74.0 or higher
- Remote SSH extension (only needed for remote connections)

## Development

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run compile

# Watch for changes
npm run watch
```

## License

MIT


