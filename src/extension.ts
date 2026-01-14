import * as vscode from 'vscode';
import * as path from 'path';

export function activate(context: vscode.ExtensionContext) {
    console.log('Auto Open Remote Folder extension is now active');

    // Function to check if a folder is a git repository
    const isGitRepository = async (folderPath: string): Promise<boolean> => {
        try {
            const gitPath = path.join(folderPath, '.git');
            const gitUri = vscode.Uri.file(gitPath);
            
            // Check if .git exists (file or directory)
            try {
                const stat = await vscode.workspace.fs.stat(gitUri);
                return stat.type === vscode.FileType.Directory || stat.type === vscode.FileType.File;
            } catch {
                return false;
            }
        } catch (error) {
            console.error('Error checking git repository:', error);
            return false;
        }
    };

    // Function to detect project name from various sources
    const detectProjectName = (): string | null => {
        // Try to get from workspace folder name (if not /root or /home)
        const workspaceFolders = vscode.workspace.workspaceFolders;
        if (workspaceFolders && workspaceFolders.length > 0) {
            const currentFolder = workspaceFolders[0].uri.fsPath;
            if (currentFolder !== '/root' && currentFolder !== '/home' && currentFolder !== '/') {
                return path.basename(currentFolder);
            }
        }
        
        // Try to get from remote name (SSH hostname)
        const remoteName = vscode.env.remoteName;
        if (remoteName && remoteName !== 'ssh-remote') {
            return remoteName;
        }
        
        return null;
    };

    // Function to open the configured folder
    const openConfiguredFolder = async () => {
        try {
            const config = vscode.workspace.getConfiguration('autoOpenRemoteFolder');
            const defaultPath = config.get<string>('defaultPath', '/local/src');
            const projectMapping = config.get<Record<string, string>>('projectMapping', {});
            
            // Get remote hostname if available (for SSH connections, this might be the host alias)
            const remoteHostname = vscode.env.remoteName;
            let targetPath = defaultPath;

            // Check if there's a specific mapping for this host
            if (remoteHostname && projectMapping[remoteHostname]) {
                targetPath = projectMapping[remoteHostname];
            } else if (targetPath.includes('{project}')) {
                // Try to detect project name
                const projectName = detectProjectName();
                if (projectName) {
                    targetPath = targetPath.replace('{project}', projectName);
                } else {
                    // If we can't detect project name, show error
                    vscode.window.showErrorMessage(
                        `Cannot detect project name. Please configure a specific path in settings or use projectMapping.`
                    );
                    return;
                }
            }

            // Check if the folder exists
            const folderUri = vscode.Uri.file(targetPath);
            
            try {
                await vscode.workspace.fs.stat(folderUri);
                
                // Check if it's a git repository
                const isGitRepo = await isGitRepository(targetPath);
                if (!isGitRepo) {
                    vscode.window.showErrorMessage(
                        `Folder ${targetPath} is not a git repository. Cannot open.`
                    );
                    return;
                }
                
                // Check if we're already in this folder
                const currentFolders = vscode.workspace.workspaceFolders;
                const alreadyOpen = currentFolders?.some(
                    folder => folder.uri.fsPath === targetPath
                );

                if (!alreadyOpen) {
                    // If we're in /root or another default folder, replace it
                    if (currentFolders && currentFolders.length === 1) {
                        const currentPath = currentFolders[0].uri.fsPath;
                        if (currentPath === '/root' || currentPath === '/home') {
                            // Replace the current workspace folder
                            await vscode.commands.executeCommand('vscode.openFolder', folderUri, false);
                            vscode.window.showInformationMessage(`Opened git repository: ${targetPath}`);
                            return;
                        }
                    }
                    
                    // Otherwise, add as a new workspace folder
                    vscode.workspace.updateWorkspaceFolders(
                        vscode.workspace.workspaceFolders?.length || 0,
                        null,
                        { uri: folderUri }
                    );
                    vscode.window.showInformationMessage(`Added git repository: ${targetPath}`);
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
        openConfiguredFolder
    );

    context.subscriptions.push(commandDisposable);
}

export function deactivate() {}

