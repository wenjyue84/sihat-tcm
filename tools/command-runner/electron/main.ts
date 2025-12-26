import { app, BrowserWindow, ipcMain } from 'electron'
import path from 'node:path'
import { spawn, exec } from 'node:child_process'
import { existsSync } from 'node:fs'

process.env.DIST = path.join(__dirname, '../dist')
// Ensure VITE_PUBLIC is a string or fallback to a sensible default (though in this context it should be set)
process.env.VITE_PUBLIC = app.isPackaged
    ? process.env.DIST
    : path.join(process.env.DIST, '../public')

let win: BrowserWindow | null
// Use a secure way to reference the project root (../../ from tools/command-runner)
const PROJECT_ROOT = path.resolve(__dirname, '../../../../')

const VITE_DEV_SERVER_URL = process.env.VITE_DEV_SERVER_URL

function createWindow() {
    const publicDir = process.env.VITE_PUBLIC || '';
    const distDir = process.env.DIST || '';

    win = new BrowserWindow({
        icon: path.join(publicDir, 'electron-vite.svg'),
        webPreferences: {
            preload: path.join(__dirname, 'preload.js'),
        },
        width: 900,
        height: 600,
        autoHideMenuBar: true,
        titleBarStyle: 'hidden',
        titleBarOverlay: {
            color: '#030712',
            symbolColor: '#ffffff',
            height: 30
        }
    })

    // Test active push message to Renderer-process.
    win.webContents.on('did-finish-load', () => {
        win?.webContents.send('main-process-message', (new Date).toLocaleString())
    })

    if (VITE_DEV_SERVER_URL) {
        win.loadURL(VITE_DEV_SERVER_URL)
    } else {
        // win.loadFile('dist/index.html')
        win.loadFile(path.join(distDir, 'index.html'))
    }
}

// IPC Handler for running commands
let activeCommand: any = null;

ipcMain.on('run-command', (event, commandData) => {
    if (activeCommand) {
        activeCommand.kill();
        activeCommand = null;
        event.sender.send('command-output', '\n--- Previous command terminated ---\n');
    }

    // Parse the command data (can be string or object)
    let commandStr: string;
    let workingDir: string = PROJECT_ROOT;

    if (typeof commandData === 'string') {
        commandStr = commandData;
    } else {
        commandStr = commandData.cmd;
        workingDir = commandData.cwd ? path.join(PROJECT_ROOT, commandData.cwd) : PROJECT_ROOT;
    }

    event.sender.send('command-output', `\n$ ${commandStr}\n`);
    event.sender.send('command-output', `Working directory: ${workingDir}\n\n`);

    try {
        const isWindows = process.platform === 'win32';
        
        if (isWindows) {
            // FINAL SOLUTION: Use shell: true with comprehensive environment
            // This is the most reliable method - Node.js automatically finds cmd.exe
            // We ensure PATH and ComSpec are set for maximum compatibility
            
            // Build comprehensive environment
            const systemPath = process.env.PATH || process.env.Path || process.env.path || '';
            const systemComSpec = process.env.ComSpec || process.env.COMSPEC || 'C:\\Windows\\system32\\cmd.exe';
            
            const env = {
                ...process.env,
                PATH: systemPath,
                Path: systemPath, // Windows sometimes uses different case
                ComSpec: systemComSpec,
                COMSPEC: systemComSpec,
                FORCE_COLOR: 'true'
            };
            
            // Use shell: true - this is the most reliable method
            // Node.js will automatically use cmd.exe from PATH
            activeCommand = spawn(commandStr, [], {
                cwd: workingDir,
                env: env,
                shell: true, // Critical: lets Node.js find shell automatically
                windowsHide: false
            });
        } else {
            // Unix-like systems
            activeCommand = spawn('/bin/sh', ['-c', commandStr], {
                cwd: workingDir,
                env: { ...process.env, FORCE_COLOR: 'true' },
                windowsHide: false
            });
        }

        // Attach handlers only if activeCommand was successfully created
        if (activeCommand) {
            activeCommand.stdout.on('data', (data: any) => {
                event.sender.send('command-output', data.toString());
            });

            activeCommand.stderr.on('data', (data: any) => {
                event.sender.send('command-output', data.toString());
            });

            activeCommand.on('close', (code: any) => {
                event.sender.send('command-output', `\n[Process exited with code ${code}]\n`);
                activeCommand = null;
            });
        }
    } catch (err: any) {
        event.sender.send('command-output', `Error starting command: ${err.message}`);
    }
});

// IPC Handler to get PROJECT_ROOT
ipcMain.handle('get-project-root', () => {
    return PROJECT_ROOT;
});

app.on('window-all-closed', () => {
    if (activeCommand) {
        activeCommand.kill();
    }
    win = null
    if (process.platform !== 'darwin') {
        app.quit()
    }
})

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow()
    }
})

app.whenReady().then(createWindow)
