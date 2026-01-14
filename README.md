# Auto Open Remote Folder

A VS Code extension that automatically opens a configured folder when connecting to a remote machine via SSH.

## Problem

When connecting to a remote machine via SSH in VS Code, it often defaults to opening `/root` or `/home`, but your source code typically lives in a different location like `/local/src/<project>`. This extension automates opening your preferred folder.

## Features

- Opens a configured folder via command or keyboard shortcut (no automatic activation)
- **Git repository validation** - Only opens folders that are git repositories
- Supports project name detection using `{project}` placeholder
- Host-specific folder mappings
- Keyboard shortcut: `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) when connected remotely

## Installation

### From Source

1. Clone or copy this extension to your local machine
2. Open the extension folder in VS Code
3. Run `npm install` to install dependencies
4. Press `F5` to open a new Extension Development Host window
5. In the new window, connect to your remote machine via SSH
6. The extension will automatically open your configured folder

### Packaging for Distribution

1. Install `vsce`: `npm install -g @vscode/vsce`
2. Package the extension: `vsce package`
3. Install the `.vsix` file: `code --install-extension auto-open-remote-folder-1.0.0.vsix`

## Configuration

Open VS Code settings (File > Preferences > Settings) and search for "Auto Open Remote Folder":

### Settings

- **`autoOpenRemoteFolder.defaultPath`** (default: `/local/src`)
  - Default folder path to open when connecting to a remote machine
  - Use `{project}` placeholder to automatically detect project name
  - Example: `/local/src/{project}` will open `/local/src/my-project` if your workspace folder is named `my-project`

- **`autoOpenRemoteFolder.projectMapping`** (default: `{}`)
  - Map specific remote hostnames to project folders
  - Format: `{"hostname": "/path/to/project"}`
  - Example:
    ```json
    {
      "my-server": "/local/src/digital-dashboard-frontend-v2",
      "dev-server": "/local/src/my-dev-project"
    }
    ```

## Usage Examples

### Example 1: Simple Path
Set `defaultPath` to `/local/src/my-project` to always open that folder.

### Example 2: Project Name Detection
Set `defaultPath` to `/local/src/{project}`. If your workspace folder is named `digital-dashboard-frontend-v2`, it will open `/local/src/digital-dashboard-frontend-v2`.

### Example 3: Host-Specific Mapping
```json
{
  "autoOpenRemoteFolder.projectMapping": {
    "server1": "/local/src/project-a",
    "server2": "/local/src/project-b"
  }
}
```

## Usage

### Keyboard Shortcut
Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) when connected to a remote machine to open the configured folder.

### Command Palette
1. Open the Command Palette (`Ctrl+Shift+P` / `Cmd+Shift+P`)
2. Run the command: `Open Configured Remote Folder`

### Git Repository Requirement
**Important**: The extension will only open folders that are git repositories. If the configured folder is not a git repository, you'll see an error message.

## How It Works

1. The extension activates when you trigger the command (via keyboard shortcut or command palette)
2. It resolves the target folder path based on your configuration
3. It checks if the folder exists
4. **It verifies the folder is a git repository** (checks for `.git` directory/file)
5. If valid, it opens the folder (replaces `/root` or `/home` if currently open, otherwise adds as workspace folder)
6. Shows an error message if the folder is not a git repository

## Requirements

- VS Code 1.74.0 or higher
- Remote SSH extension (for remote connections)

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


