"use client"

import * as React from "react"
import { cn } from "@/lib/utils"

interface SliderProps {
    value: number[]
    max?: number
    step?: number
    onValueChange?: (value: number[]) => void
    disabled?: boolean
    className?: string
}

export function Slider({ value, max = 100, step = 1, onValueChange, disabled, className }: SliderProps) {
    const val = value[0] ?? 0

    return (
        <div className={cn("relative flex w-full touch-none select-none items-center", className)}>
            <input
                type="range"
                min={0}
                max={max}
                step={step}
                value={val}
                disabled={disabled}
                onChange={(e) => onValueChange?.([parseFloat(e.target.value)])}
                className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-primary"
            />
        </div>
    )
}
