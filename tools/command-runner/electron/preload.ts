import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('electron', {
    runCommand: (cmd: string | { cmd: string; cwd?: string }) => ipcRenderer.send('run-command', cmd),
    onOutput: (callback: (data: string) => void) => {
        ipcRenderer.on('command-output', (_event, value) => callback(value))
    },
    offOutput: () => {
        ipcRenderer.removeAllListeners('command-output')
    },
    getProjectRoot: () => ipcRenderer.invoke('get-project-root'),
})
