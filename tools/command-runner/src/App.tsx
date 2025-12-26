import { useState, useEffect, useRef } from 'react'
import { Terminal, Play, Square, Smartphone, Globe, Database, Wrench, Package, Folder, ChevronRight } from 'lucide-react'

// Define the electron API input
declare global {
    interface Window {
        electron: {
            runCommand: (cmd: string | { cmd: string; cwd?: string }) => void
            onOutput: (callback: (data: string) => void) => void
            offOutput: () => void
            getProjectRoot: () => Promise<string>
        }
    }
}

interface Command {
    label: string
    cmd: string
    description: string
    color: string
    icon: any
    cwd?: string
    needsPort?: boolean
}

interface CommandCategory {
    name: string
    icon: any
    commands: Record<string, Command>
}

function App() {
    const [logs, setLogs] = useState<string[]>([])
    const [isRunning, setIsRunning] = useState(false)
    const [activeCategory, setActiveCategory] = useState<'web' | 'mobile' | 'database' | 'utils'>('web')
    const [activeCommand, setActiveCommand] = useState<string>('dev')
    const [port, setPort] = useState<string>('3100')
    const [projectRoot, setProjectRoot] = useState<string>('')
    const terminalEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Load project root path
        window.electron.getProjectRoot().then(setProjectRoot)

        window.electron.onOutput((data) => {
            setLogs((prev) => [...prev, data])
            // Auto-scroll
            if (terminalEndRef.current) {
                terminalEndRef.current.scrollIntoView({ behavior: 'smooth' })
            }

            // Simple logic to detect stop (not perfect but visual enough)
            if (data.includes('exited with code')) {
                setIsRunning(false)
            }
        })

        return () => {
            window.electron.offOutput()
        }
    }, [])

    const handleCommand = (cmd: string, cwd?: string) => {
        setIsRunning(true)
        setLogs([]) // Clear logs on new run

        // Send command with working directory
        window.electron.runCommand({ cmd, cwd })
    }

    const categories: Record<string, CommandCategory> = {
        web: {
            name: 'Web App',
            icon: Globe,
            commands: {
                dev: {
                    label: 'Start Dev Server',
                    cmd: `npm run dev -- -p ${port}`,
                    description: `Starts the Next.js development server on localhost:${port}`,
                    color: 'bg-emerald-600 hover:bg-emerald-700',
                    icon: Play,
                    cwd: 'sihat-tcm',
                    needsPort: true
                },
                devTina: {
                    label: 'Start Dev + Tina',
                    cmd: `npx tinacms dev -c "npm run dev -- -p ${port}"`,
                    description: `Starts Next.js with Tina CMS admin panel on port ${port}`,
                    color: 'bg-teal-600 hover:bg-teal-700',
                    icon: Play,
                    cwd: 'sihat-tcm',
                    needsPort: true
                },
                build: {
                    label: 'Build Production',
                    cmd: 'npm run build',
                    description: 'Builds the web app for production deployment',
                    color: 'bg-blue-600 hover:bg-blue-700',
                    icon: Package,
                    cwd: 'sihat-tcm'
                },
                lint: {
                    label: 'Run Linting',
                    cmd: 'npm run lint',
                    description: 'Checks code for TypeScript and ESLint errors',
                    color: 'bg-purple-600 hover:bg-purple-700',
                    icon: Wrench,
                    cwd: 'sihat-tcm'
                }
            }
        },
        mobile: {
            name: 'Mobile App',
            icon: Smartphone,
            commands: {
                start: {
                    label: 'Start Expo',
                    cmd: 'npx expo start --clear',
                    description: 'Starts the Expo development server for mobile app',
                    color: 'bg-cyan-600 hover:bg-cyan-700',
                    icon: Play,
                    cwd: 'sihat-tcm-mobile'
                },
                android: {
                    label: 'Run on Android',
                    cmd: 'npx expo start --android',
                    description: 'Launches the app on connected Android device/emulator',
                    color: 'bg-green-600 hover:bg-green-700',
                    icon: Smartphone,
                    cwd: 'sihat-tcm-mobile'
                },
                buildApk: {
                    label: 'Build APK',
                    cmd: 'eas build --platform android --profile preview',
                    description: 'Builds Android APK using EAS Build',
                    color: 'bg-orange-600 hover:bg-orange-700',
                    icon: Package,
                    cwd: 'sihat-tcm-mobile'
                }
            }
        },
        database: {
            name: 'Database',
            icon: Database,
            commands: {
                studio: {
                    label: 'Open Supabase Studio',
                    cmd: 'start https://supabase.com/dashboard/project/jvokcruuowmvpthubjqh',
                    description: 'Opens Supabase dashboard in browser',
                    color: 'bg-teal-600 hover:bg-teal-700',
                    icon: Database
                },
                migrate: {
                    label: 'Run Migrations',
                    cmd: 'supabase db push',
                    description: 'Pushes local database migrations to Supabase',
                    color: 'bg-indigo-600 hover:bg-indigo-700',
                    icon: Database
                }
            }
        },
        utils: {
            name: 'Utilities',
            icon: Wrench,
            commands: {
                install: {
                    label: 'Install Dependencies',
                    cmd: 'npm install',
                    description: 'Installs all npm dependencies for the web app',
                    color: 'bg-gray-600 hover:bg-gray-700',
                    icon: Package,
                    cwd: 'sihat-tcm'
                },
                clean: {
                    label: 'Clean Build',
                    cmd: 'Remove-Item -Recurse -Force .next -ErrorAction SilentlyContinue; npm run build',
                    description: 'Removes .next folder and rebuilds the project',
                    color: 'bg-red-600 hover:bg-red-700',
                    icon: Wrench,
                    cwd: 'sihat-tcm'
                },
                explorer: {
                    label: 'Open in Explorer',
                    cmd: 'start .',
                    description: 'Opens the project folder in Windows Explorer',
                    color: 'bg-yellow-600 hover:bg-yellow-700',
                    icon: Folder
                }
            }
        }
    }

    const currentCategory = categories[activeCategory]
    const currentCommand = currentCategory.commands[activeCommand]

    return (
        <div className="flex flex-col h-screen select-none">
            {/* Title Bar */}
            <div className="h-9 bg-gradient-to-r from-gray-900 to-gray-800 flex items-center justify-between px-4 border-b border-gray-700" style={{ WebkitAppRegion: 'drag' } as any}>
                <div className="flex items-center gap-2 text-xs font-bold text-gray-300">
                    <Terminal size={16} className="text-emerald-400" />
                    <span>SIHAT TCM COMMAND CENTER</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-gray-500">
                    <div className={`w-2 h-2 rounded-full ${isRunning ? 'bg-emerald-400 animate-pulse' : 'bg-gray-600'}`} />
                    {isRunning ? 'RUNNING' : 'IDLE'}
                </div>
            </div>

            <div className="flex-1 flex overflow-hidden">
                {/* Category Sidebar */}
                <div className="w-56 bg-gray-900 border-r border-gray-800 flex flex-col">
                    <div className="p-3 border-b border-gray-800">
                        <div className="text-xs font-bold text-gray-500 mb-3">CATEGORIES</div>
                        <div className="space-y-1">
                            {(Object.keys(categories) as Array<keyof typeof categories>).map((key) => {
                                const CategoryIcon = categories[key].icon
                                return (
                                    <button
                                        key={key}
                                        onClick={() => {
                                            setActiveCategory(key as 'web' | 'mobile' | 'database' | 'utils')
                                            setActiveCommand(Object.keys(categories[key].commands)[0])
                                        }}
                                        className={`w-full text-left px-3 py-2 rounded text-sm font-medium transition-all flex items-center gap-2
                      ${activeCategory === key
                                                ? 'bg-emerald-600 text-white shadow-lg'
                                                : 'text-gray-400 hover:bg-gray-800/50 hover:text-gray-200'}`}
                                    >
                                        <CategoryIcon size={16} />
                                        {categories[key].name}
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    {/* Commands List for Active Category */}
                    <div className="flex-1 p-3 overflow-y-auto">
                        <div className="text-xs font-bold text-gray-500 mb-2">COMMANDS</div>
                        <div className="space-y-1">
                            {Object.keys(currentCategory.commands).map((key) => {
                                const cmd = currentCategory.commands[key]
                                return (
                                    <button
                                        key={key}
                                        onClick={() => setActiveCommand(key)}
                                        className={`w-full text-left px-3 py-2 rounded text-xs transition-colors flex items-center justify-between
                      ${activeCommand === key
                                                ? 'bg-gray-800 text-white'
                                                : 'text-gray-400 hover:bg-gray-800/30 hover:text-gray-200'}`}
                                    >
                                        <span className="truncate">{cmd.label}</span>
                                        <ChevronRight size={14} className={activeCommand === key ? 'text-emerald-400' : 'text-gray-600'} />
                                    </button>
                                )
                            })}
                        </div>
                    </div>

                    <div className="p-3 border-t border-gray-800">
                        <div className="text-xs text-gray-600 mb-2">Command Runner v1.0.0</div>
                        {projectRoot && (
                            <div className="text-xs">
                                <div className="text-gray-600 mb-1">Project Root:</div>
                                <div className="bg-gray-950 p-2 rounded text-emerald-400 font-mono break-all text-[10px] leading-tight">
                                    {projectRoot}
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 flex flex-col bg-gray-950">
                    {/* Command Header */}
                    <div className="p-6 border-b border-gray-900 bg-gradient-to-br from-gray-900 to-gray-950">
                        <div className="flex items-start justify-between">
                            <div>
                                <h1 className="text-2xl font-bold flex items-center gap-3">
                                    {currentCommand.label}
                                    {isRunning && (
                                        <span className="text-xs bg-emerald-500/10 text-emerald-400 px-3 py-1 rounded-full border border-emerald-500/20 animate-pulse">
                                            ● RUNNING
                                        </span>
                                    )}
                                </h1>
                                <p className="text-gray-400 text-sm mt-2">{currentCommand.description}</p>
                                <div className="mt-3 flex items-center gap-2 text-xs">
                                    <span className="text-gray-600">Command:</span>
                                    <code className="bg-gray-900/50 px-2 py-1 rounded text-emerald-400 font-mono">
                                        {currentCommand.cmd}
                                    </code>
                                    {currentCommand.cwd && (
                                        <>
                                            <span className="text-gray-600">|</span>
                                            <span className="text-gray-600">Directory:</span>
                                            <code className="bg-gray-900/50 px-2 py-1 rounded text-cyan-400 font-mono">
                                                {currentCommand.cwd}
                                            </code>
                                        </>
                                    )}
                                </div>

                                {/* Port Input for Dev Server Commands */}
                                {currentCommand.needsPort && (
                                    <div className="mt-4 flex items-center gap-3">
                                        <label htmlFor="port" className="text-sm text-gray-400">
                                            Port:
                                        </label>
                                        <input
                                            id="port"
                                            type="number"
                                            value={port}
                                            onChange={(e) => setPort(e.target.value)}
                                            disabled={isRunning}
                                            className="bg-gray-900/50 border border-gray-700 rounded px-3 py-2 text-white text-sm w-24 focus:outline-none focus:border-emerald-500 disabled:opacity-50 disabled:cursor-not-allowed"
                                            placeholder="3100"
                                        />
                                        <span className="text-xs text-gray-600">
                                            Server will run on localhost:{port}
                                        </span>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="mt-5 flex gap-3">
                            <button
                                onClick={() => handleCommand(currentCommand.cmd, currentCommand.cwd)}
                                disabled={isRunning}
                                className={`flex items-center gap-2 px-6 py-3 rounded-lg font-bold shadow-xl transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed
                  ${currentCommand.color} text-white`}
                            >
                                <Play size={18} fill="currentColor" />
                                RUN COMMAND
                            </button>

                            {isRunning && (
                                <button
                                    onClick={() => setIsRunning(false)}
                                    className="flex items-center gap-2 px-5 py-3 rounded-lg font-medium bg-red-900/30 text-red-400 border border-red-900/50 hover:bg-red-900/50 transition-colors"
                                >
                                    <Square size={16} fill="currentColor" />
                                    STOP
                                </button>
                            )}

                            <button
                                onClick={() => setLogs([])}
                                className="ml-auto px-4 py-3 rounded-lg text-sm text-gray-400 hover:text-white hover:bg-gray-800/50 transition-colors"
                            >
                                Clear Logs
                            </button>
                        </div>
                    </div>

                    {/* Terminal Output */}
                    <div className="flex-1 p-4 overflow-hidden flex flex-col">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-mono text-gray-500 flex items-center gap-2">
                                <Terminal size={12} />
                                CONSOLE OUTPUT
                            </span>
                            <span className="text-xs text-gray-600">{logs.length} lines</span>
                        </div>

                        <div className="flex-1 bg-black rounded-lg border border-gray-800 p-4 font-mono text-xs overflow-y-auto scrollbar-thin text-gray-300 shadow-inner">
                            {logs.length === 0 ? (
                                <div className="h-full flex flex-col items-center justify-center text-gray-700">
                                    <Terminal size={56} strokeWidth={1} className="mb-3 opacity-30" />
                                    <p className="text-sm">No output yet. Run a command to see logs here.</p>
                                </div>
                            ) : (
                                logs.map((log, i) => (
                                    <div key={i} className="whitespace-pre-wrap break-all leading-relaxed hover:bg-gray-900/20">
                                        {log}
                                    </div>
                                ))
                            )}
                            <div ref={terminalEndRef} />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default App
