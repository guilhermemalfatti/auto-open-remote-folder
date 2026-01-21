import * as vscode from 'vscode';
import * as path from 'path';
import * as os from 'os';

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Open Remote Folder extension is now active');

    // Function to check if a path is a default/system folder
    const isDefaultFolder = (folderPath: string): boolean => {
        const normalizedPath = path.normalize(folderPath);
        const homeDir = os.homedir();
        
        // Check for common default folders
        const defaultFolders = [
            '/root',
            '/home',
            '/',
            homeDir,
            path.join(homeDir, 'Documents'),
            path.join(homeDir, 'Desktop'),
        ];
        
        return defaultFolders.some(defaultFolder => {
            const normalizedDefault = path.normalize(defaultFolder);
            return normalizedPath === normalizedDefault || normalizedPath === path.dirname(normalizedDefault);
        });
    };

    // Function to detect project name from various sources
    // If pathPattern contains {project}, it will check the parent directory for a single folder
    // Throws an error if zero or multiple folders are found when {project} is in the pattern
    const detectProjectName = async (pathPattern?: string): Promise<string> => {
        // Priority 1: If pathPattern contains {project}, check parent directory for a single folder
        // Example: /local/src/{project} -> check /local/src for a single folder
        if (pathPattern && pathPattern.includes('{project}')) {
            // Extract parent directory by removing {project} and any trailing slashes
            const parentPath = pathPattern.replace(/\{project\}.*$/, '').replace(/\/+$/, '');
            if (!parentPath) {
                throw new Error('Invalid path pattern: cannot extract parent directory from path pattern');
            }
            
            const resolvedParent = resolvePath(parentPath);
            const parentUri = vscode.Uri.file(resolvedParent);
            
            // Check if parent directory exists
            try {
                const parentStat = await vscode.workspace.fs.stat(parentUri);
                if (parentStat.type !== vscode.FileType.Directory) {
                    throw new Error(`Path ${resolvedParent} exists but is not a directory`);
                }
                
                // List all items in the parent directory
                const entries = await vscode.workspace.fs.readDirectory(parentUri);
                
                // Filter to only directories (exclude files)
                const folders = entries.filter(([name, type]) => type === vscode.FileType.Directory);
                
                // If there's exactly one folder, use its name
                if (folders.length === 1) {
                    return folders[0][0];
                } else if (folders.length === 0) {
                    // No folders found - throw error with details
                    throw new Error(
                        `No folders found in ${resolvedParent}. ` +
                        `The path pattern requires exactly one folder in the parent directory.`
                    );
                } else {
                    // Multiple folders found - throw error with details
                    const folderNames = folders.map(([name]) => name).join(', ');
                    throw new Error(
                        `Multiple folders found in ${resolvedParent} (${folders.length} folders: ${folderNames}). ` +
                        `The path pattern requires exactly one folder in the parent directory. ` +
                        `Please specify the exact folder path in settings.`
                    );
                }
            } catch (error) {
                // Re-throw if it's already our custom error
                if (error instanceof Error && (error.message.includes('folders found') || error.message.includes('not a directory'))) {
                    throw error;
                }
                // Parent directory doesn't exist or can't be accessed
                throw new Error(
                    `Cannot access parent directory: ${resolvedParent}. ` +
                    `Please ensure the directory exists and is accessible.`
                );
            }
        }
        
        // Fallback: Try to get from workspace folder name (if not a default folder)
        // This is only used when pathPattern doesn't contain {project}
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const currentFolder = workspaceFolders[0].uri.fsPath;
            if (!isDefaultFolder(currentFolder)) {
                const folderName = path.basename(currentFolder);
                // Only return if it looks like a project name (not just a single character or very short)
                if (folderName.length > 1) {
                    return folderName;
                }
            }
        }
        
        // Try to get from remote name (SSH hostname) - only if connected remotely
        const remoteName = vscode.env.remoteName;
        if (remoteName && remoteName !== 'ssh-remote') {
            return remoteName;
        }
        
        // Try to get from machine name or hostname as last resort
        try {
            const hostname = os.hostname();
            if (hostname && hostname !== 'localhost' && hostname !== '127.0.0.1') {
                return hostname;
            }
        } catch {
            // Ignore errors getting hostname
        }
        
        // If we get here and pathPattern contains {project}, we should have thrown an error already
        // This is a fallback for when pathPattern doesn't contain {project}
        throw new Error('Cannot detect project name. Please configure a specific path in settings.');
    };

    // Function to resolve path with home directory and environment variables
    const resolvePath = (inputPath: string): string => {
        // Handle ~ for home directory
        if (inputPath.startsWith('~')) {
            return inputPath.replace('~', os.homedir());
        }
        
        // Handle environment variables (basic support)
        if (inputPath.includes('${HOME}') || inputPath.includes('$HOME')) {
            inputPath = inputPath.replace(/\$\{HOME\}/g, os.homedir()).replace(/\$HOME/g, os.homedir());
        }
        
        // Resolve relative paths
        if (!path.isAbsolute(inputPath)) {
            return path.resolve(inputPath);
        }
        
        return inputPath;
    };

    // Function to get the resolved default path (used for UI)
    // Note: This doesn't resolve {project} placeholder - that happens when opening the folder
    const getResolvedDefaultPath = (): string => {
        const config = vscode.workspace.getConfiguration('autoOpenRemoteFolder');
        const defaultPath = config.get<string>('defaultPath', '/local/src');
        
        // Resolve path (handle ~, environment variables, relative paths)
        // Note: {project} placeholder is kept as-is for UI display
        return resolvePath(defaultPath);
    };

    // Function to open the configured folder
    const openConfiguredFolder = async (customPath?: string) => {
        try {
            const config = vscode.workspace.getConfiguration('autoOpenRemoteFolder');
            const defaultPath = config.get<string>('defaultPath', '/local/src');
            let targetPath = customPath || defaultPath;
            
            // Replace {project} placeholder if present (works for both custom and default paths)
            if (targetPath.includes('{project}')) {
                try {
                    const projectName = await detectProjectName(targetPath);
                    targetPath = targetPath.replace('{project}', projectName);
                } catch (error) {
                    // Show detailed error message to user
                    const errorMessage = error instanceof Error ? error.message : 'Cannot detect project name';
                    vscode.window.showErrorMessage(errorMessage);
                    console.error('Error detecting project name:', error);
                    return;
                }
            }
            
            // Resolve path (handle ~, environment variables, relative paths)
            targetPath = resolvePath(targetPath);

            // Check if the folder exists
            const folderUri = vscode.Uri.file(targetPath);
            
            try {
                await vscode.workspace.fs.stat(folderUri);
                
                // Check if we're already in this folder
                const currentFolders = vscode.workspace.workspaceFolders;
                const alreadyOpen = currentFolders?.some(
                    folder => folder.uri.fsPath === targetPath
                );

                if (!alreadyOpen) {
                    // If we're in a default folder or have only one folder, replace the workspace
                    // This ensures the workspace name matches the folder name (like native "Open Folder")
                    if (currentFolders && currentFolders.length === 1) {
                        const currentPath = currentFolders[0].uri.fsPath;
                        if (isDefaultFolder(currentPath)) {
                            // Replace the current workspace folder - this will set workspace name to folder name
                            await vscode.commands.executeCommand('vscode.openFolder', folderUri, false);
                            vscode.window.showInformationMessage(`Opened folder: ${targetPath}`);
                            return;
                        }
                    }
                    
                    // If no folders are open, open as new workspace (sets workspace name to folder name)
                    if (!currentFolders || currentFolders.length === 0) {
                        await vscode.commands.executeCommand('vscode.openFolder', folderUri, false);
                        vscode.window.showInformationMessage(`Opened folder: ${targetPath}`);
                        return;
                    }
                    
                    // Otherwise, add as a new workspace folder (multi-root workspace)
                    vscode.workspace.updateWorkspaceFolders(
                        vscode.workspace.workspaceFolders?.length || 0,
                        null,
                        { uri: folderUri }
                    );
                    vscode.window.showInformationMessage(`Added folder: ${targetPath}`);
                } else {
                    vscode.window.showInformationMessage(`Folder ${targetPath} is already open.`);
                }
            } catch (error) {
                // Folder doesn't exist, show a warning
                console.log(`Folder ${targetPath} does not exist`);
                vscode.window.showErrorMessage(
                    `Configured folder does not exist: ${targetPath}. Please check your settings.`
                );
            }
        } catch (error) {
            console.error('Error opening configured folder:', error);
            vscode.window.showErrorMessage(`Failed to open configured folder: ${error}`);
        }
    };

    // Register command for manual trigger
    const commandDisposable = vscode.commands.registerCommand(
        'autoOpenRemoteFolder.openConfiguredFolder',
        () => openConfiguredFolder()
    );

    context.subscriptions.push(commandDisposable);

    // Create and register the sidebar view
    class FolderOpenerViewProvider implements vscode.WebviewViewProvider {
        public static readonly viewType = 'autoOpenRemoteFolder.folderOpenerView';
        private _view?: vscode.WebviewView;

        constructor(
            private readonly _extensionUri: vscode.Uri,
            private readonly _extensionContext: vscode.ExtensionContext
        ) {}

        public resolveWebviewView(
            webviewView: vscode.WebviewView,
            context: vscode.WebviewViewResolveContext,
            _token: vscode.CancellationToken,
        ) {
            this._view = webviewView;

            webviewView.webview.options = {
                enableScripts: true,
                localResourceRoots: [this._extensionUri]
            };

            webviewView.webview.html = this._getHtmlForWebview(webviewView.webview);

            // Handle messages from the webview
            webviewView.webview.onDidReceiveMessage(
                async (data) => {
                    switch (data.type) {
                        case 'openFolder':
                            await openConfiguredFolder(data.path);
                            break;
                        case 'getDefaultPath':
                            const defaultPath = getResolvedDefaultPath();
                            webviewView.webview.postMessage({
                                type: 'defaultPath',
                                path: defaultPath
                            });
                            break;
                    }
                },
                null,
                this._extensionContext.subscriptions
            );

            // Update the path when view becomes visible
            webviewView.onDidChangeVisibility(() => {
                if (webviewView.visible) {
                    const defaultPath = getResolvedDefaultPath();
                    webviewView.webview.postMessage({
                        type: 'defaultPath',
                        path: defaultPath
                    });
                }
            });
        }

        private _getHtmlForWebview(webview: vscode.Webview) {
            return `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Folder Opener</title>
    <style>
        body {
            padding: 10px;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
            color: var(--vscode-foreground);
            background-color: var(--vscode-editor-background);
        }
        .input-container {
            margin-bottom: 10px;
        }
        label {
            display: block;
            margin-bottom: 5px;
            font-size: 12px;
            color: var(--vscode-descriptionForeground);
        }
        input[type="text"] {
            width: 100%;
            padding: 6px;
            box-sizing: border-box;
            background-color: var(--vscode-input-background);
            color: var(--vscode-input-foreground);
            border: 1px solid var(--vscode-input-border);
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        input[type="text"]:focus {
            outline: 1px solid var(--vscode-focusBorder);
            outline-offset: -1px;
        }
        button {
            width: 100%;
            padding: 8px;
            background-color: var(--vscode-button-background);
            color: var(--vscode-button-foreground);
            border: none;
            cursor: pointer;
            font-family: var(--vscode-font-family);
            font-size: var(--vscode-font-size);
        }
        button:hover {
            background-color: var(--vscode-button-hoverBackground);
        }
        button:active {
            background-color: var(--vscode-button-activeBackground);
        }
        .info {
            margin-top: 10px;
            padding: 8px;
            background-color: var(--vscode-textBlockQuote-background);
            border-left: 3px solid var(--vscode-textBlockQuote-border);
            font-size: 11px;
            color: var(--vscode-descriptionForeground);
        }
    </style>
</head>
<body>
    <div class="input-container">
        <label for="folderPath">Folder Path:</label>
        <input type="text" id="folderPath" placeholder="Enter folder path..." />
    </div>
    <button id="openButton">Open Folder</button>
    <div class="info">
        Use ~ for home directory or $HOME for environment variables.
    </div>
    <script>
        const vscode = acquireVsCodeApi();
        const folderPathInput = document.getElementById('folderPath');
        const openButton = document.getElementById('openButton');

        // Request default path when page loads
        vscode.postMessage({ type: 'getDefaultPath' });

        // Handle messages from extension
        window.addEventListener('message', event => {
            const message = event.data;
            switch (message.type) {
                case 'defaultPath':
                    folderPathInput.value = message.path;
                    break;
            }
        });

        // Open folder on button click
        openButton.addEventListener('click', () => {
            const path = folderPathInput.value.trim();
            if (path) {
                vscode.postMessage({
                    type: 'openFolder',
                    path: path
                });
            }
        });

        // Open folder on Enter key
        folderPathInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                openButton.click();
            }
        });
    </script>
</body>
</html>`;
        }
    }

    // Register the view provider
    const viewProvider = new FolderOpenerViewProvider(context.extensionUri, context);
    const viewDisposable = vscode.window.registerWebviewViewProvider(
        FolderOpenerViewProvider.viewType,
        viewProvider
    );

    context.subscriptions.push(viewDisposable);
}

export function deactivate() {}

