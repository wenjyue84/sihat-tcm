"use client";

interface InitializingStateProps {
    connectionStatus: string;
}

/**
 * Initializing state - Loading spinner with connection status
 */
export function InitializingState({ connectionStatus }: InitializingStateProps) {
    return (
        <div className="text-gray-400 flex flex-col items-center gap-3 pointer-events-none">
            <div className="w-20 h-20 rounded-full bg-white shadow-md flex items-center justify-center border-2 border-green-200">
                <div className="w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full animate-spin" />
            </div>
            <span className="text-sm font-medium">{connectionStatus}</span>
        </div>
    );
}
