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
   - In the new window, connect to your remote machine via SSH
   - Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) to trigger the folder opening
   - Or use Command Palette → "Open Configured Remote Folder"

## Configuration

### Option 1: Simple Path (Recommended for your use case)

Since your projects are in `/local/src/<project>`, set:

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

### Option 2: Host-Specific Mapping

If you connect to different servers with different projects:

```json
{
  "autoOpenRemoteFolder.projectMapping": {
    "server1": "/local/src/digital-dashboard-frontend-v2",
    "server2": "/local/src/another-project"
  }
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

**Note**: The folder must be a git repository (contain a `.git` directory). The extension will show an error if it's not.

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

After connecting to your remote machine:
- Press `Ctrl+Shift+O` (or `Cmd+Shift+O` on Mac) to open the configured folder
- Or use Command Palette (`Ctrl+Shift+P`) → "Open Configured Remote Folder"

## Troubleshooting

- **Extension doesn't activate**: Make sure you're connected via Remote SSH and trigger the command manually
- **Wrong folder opens**: Check your `defaultPath` setting
- **Folder doesn't exist**: Verify the path exists on the remote machine
- **"Not a git repository" error**: The folder must be a git repository (contain a `.git` directory). Initialize it with `git init` if needed.
- **Keyboard shortcut doesn't work**: Make sure you're connected to a remote machine (shortcut only works when `remoteName != undefined`)

