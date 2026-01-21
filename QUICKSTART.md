# Quick Start Guide

## Installation Steps

1. **Install dependencies:**
   ```bash
   cd /local/src/auto-open-remote-folder
   npm install
   ```

2. **Compile the extension:**
   ```bash
   npm run compile
   ```

3. **Test the extension:**
   - Open the extension folder in VS Code
   - Press `F5` to launch Extension Development Host
   - Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) to trigger the folder opening
   - Or use Command Palette → "Open Configured Folder"
   - For remote testing, connect to your remote machine via SSH in the Extension Development Host window

## Configuration

### Option 1: Simple Path

For remote machines (e.g., projects in `/local/src/<project>`):

```json
{
  "autoOpenRemoteFolder.defaultPath": "/local/src/digital-dashboard-frontend-v2"
}
```

Or use the `{project}` placeholder:

```json
{
  "autoOpenRemoteFolder.defaultPath": "/local/src/{project}"
}
```

For local machines, you can use home directory shortcuts:

```json
{
  "autoOpenRemoteFolder.defaultPath": "~/projects/{project}"
}
```

Or with environment variables:

```json
{
  "autoOpenRemoteFolder.defaultPath": "$HOME/projects/{project}"
}
```

## How to Configure

1. Open VS Code Settings (`Ctrl+,` or `Cmd+,`)
2. Search for "Auto Open Remote Folder"
3. Set `autoOpenRemoteFolder.defaultPath` to your desired path
4. Save settings

Or edit `settings.json` directly:

```json
{
  "autoOpenRemoteFolder.defaultPath": "/local/src/digital-dashboard-frontend-v2"
}
```


## Packaging for Installation

To create a `.vsix` file for easy installation:

```bash
npm install -g @vscode/vsce
vsce package
```

Then install it:
```bash
code --install-extension auto-open-remote-folder-1.0.0.vsix
```

## Usage

The extension works on both local and remote machines:
- Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) to open the configured folder
- Or use Command Palette (`Ctrl+Shift+P`) → "Open Configured Folder"

## Troubleshooting

- **Extension doesn't activate**: Trigger the command manually via Command Palette or keyboard shortcut
- **Wrong folder opens**: Check your `defaultPath` setting and verify it's correct for your machine (local vs remote)
- **Folder doesn't exist**: Verify the path exists on the current machine (local or remote)
- **Project name not detected**: Make sure your workspace folder is not a default folder (like `/root`, `/home`, or your home directory). The extension detects project names from workspace folder names.
- **Path resolution issues**: On local machines, use `~` for home directory or `$HOME` environment variable. On Windows, use proper Windows paths (e.g., `C:\\Users\\YourName\\projects`).

