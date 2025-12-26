
import React from 'react'

interface CompositionGuideOverlayProps {
    isVisible: boolean
    mode: 'tongue' | 'face' | 'body'
    className?: string
}

export function CompositionGuideOverlay({
    isVisible,
    mode,
    className = ''
}: CompositionGuideOverlayProps) {
    if (!isVisible) {
        return null
    }

    const getGuideForMode = () => {
        switch (mode) {
            case 'tongue':
                return {
                    shape: 'oval',
                    width: '30%',
                    height: '20%',
                    top: '40%',
                    left: '35%',
                    label: 'Position tongue here'
                }
            case 'face':
                return {
                    shape: 'oval',
                    width: '40%',
                    height: '50%',
                    top: '25%',
                    left: '30%',
                    label: 'Center your face here'
                }
            case 'body':
                return {
                    shape: 'rectangle',
                    width: '60%',
                    height: '60%',
                    top: '20%',
                    left: '20%',
                    label: 'Position body area here'
                }
        }
    }

    const guide = getGuideForMode()

    return (
        <div className={`absolute inset-0 pointer-events-none ${className}`}>
            {/* Overlay with cutout */}
            <div className="absolute inset-0 bg-black/20">
                <div
                    className="absolute border-2 border-white/80 border-dashed"
                    style={{
                        width: guide.width,
                        height: guide.height,
                        top: guide.top,
                        left: guide.left,
                        borderRadius: guide.shape === 'oval' ? '50%' : '8px',
                        boxShadow: '0 0 0 9999px rgba(0, 0, 0, 0.3)'
                    }}
                />
            </div>

            {/* Guide Label */}
            <div
                className="absolute bg-white/90 backdrop-blur-sm px-3 py-1 rounded-full text-sm font-medium text-gray-700 border border-white/50"
                style={{
                    top: `calc(${guide.top} + ${guide.height} + 8px)`,
                    left: '50%',
                    transform: 'translateX(-50%)'
                }}
            >
                {guide.label}
            </div>

            {/* Center crosshair */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                <div className="w-4 h-4 border-2 border-white/60 rounded-full bg-white/20" />
                <div className="absolute top-1/2 left-1/2 w-8 h-0.5 bg-white/60 transform -translate-x-1/2 -translate-y-1/2" />
                <div className="absolute top-1/2 left-1/2 w-0.5 h-8 bg-white/60 transform -translate-x-1/2 -translate-y-1/2" />
            </div>
        </div>
    )
}
