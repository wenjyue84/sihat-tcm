import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Input } from '@/components/ui/input'
import { Plus, Minus } from 'lucide-react'
import { MobileNumericInputProps } from './types'

export function MobileNumericInput({
    id,
    value,
    onChange,
    placeholder,
    icon,
    min,
    max,
    step = 1,
    unit,
    quickValues,
    required = false
}: MobileNumericInputProps) {
    const [showSlider, setShowSlider] = useState(false)
    const sliderRef = useRef<HTMLDivElement>(null)
    const numValue = parseFloat(value) || 0

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (sliderRef.current && !sliderRef.current.contains(e.target as Node)) {
                setShowSlider(false)
            }
        }
        document.addEventListener('mousedown', handleClickOutside)
        return () => document.removeEventListener('mousedown', handleClickOutside)
    }, [])

    const handleIncrement = () => {
        const newValue = Math.min(max, numValue + step)
        onChange(step < 1 ? newValue.toFixed(1) : String(Math.round(newValue)))
    }

    const handleDecrement = () => {
        const newValue = Math.max(min, numValue - step)
        onChange(step < 1 ? newValue.toFixed(1) : String(Math.round(newValue)))
    }

    const handleSliderChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = parseFloat(e.target.value)
        onChange(step < 1 ? newValue.toFixed(1) : String(Math.round(newValue)))
    }

    const handleQuickSelect = (val: number) => {
        onChange(step < 1 ? val.toFixed(1) : String(val))
        setShowSlider(false)
    }

    const percentage = ((numValue - min) / (max - min)) * 100

    return (
        <div className="relative" ref={sliderRef}>
            <div className="flex items-stretch gap-1">
                <button
                    type="button"
                    onClick={handleDecrement}
                    disabled={numValue <= min}
                    className="flex items-center justify-center w-11 h-12 rounded-l-lg border border-r-0 border-border bg-muted/20 hover:bg-accent hover:border-primary/50 active:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
                    aria-label="Decrease"
                >
                    <Minus className="w-4 h-4 text-muted-foreground" />
                </button>

                <div className="relative flex-1">
                    <div className="absolute left-3 top-3.5 h-4 w-4 text-primary pointer-events-none">
                        {icon}
                    </div>
                    <Input
                        id={id}
                        type="number"
                        inputMode="decimal"
                        min={min}
                        max={max}
                        step={step}
                        value={value ?? ''}
                        onChange={(e) => onChange(e.target.value)}
                        onFocus={() => setShowSlider(true)}
                        placeholder={placeholder}
                        className="pl-10 pr-10 h-12 border-border focus-visible:ring-ring focus-visible:border-primary bg-muted/20 rounded-none text-center text-lg font-semibold text-foreground [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        required={required}
                        suppressHydrationWarning
                    />
                    {unit && (
                        <span className="absolute right-3 top-3.5 text-muted-foreground/50 text-sm pointer-events-none">
                            {unit}
                        </span>
                    )}
                </div>

                <button
                    type="button"
                    onClick={handleIncrement}
                    disabled={numValue >= max}
                    className="flex items-center justify-center w-11 h-12 rounded-r-lg border border-l-0 border-border bg-muted/20 hover:bg-accent hover:border-primary/50 active:bg-primary/10 disabled:opacity-40 disabled:cursor-not-allowed transition-all touch-manipulation"
                    aria-label="Increase"
                >
                    <Plus className="w-4 h-4 text-muted-foreground" />
                </button>
            </div>

            {showSlider && (
                <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute left-0 right-0 mt-2 p-4 bg-popover border border-border rounded-xl shadow-lg z-20"
                >
                    <div className="mb-4">
                        <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                            <div
                                className="absolute h-full bg-gradient-to-r from-primary/70 to-primary rounded-full transition-all"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <input
                            type="range"
                            min={min}
                            max={max}
                            step={step}
                            value={numValue || min}
                            onChange={handleSliderChange}
                            className="absolute top-0 left-0 right-0 w-full h-2 opacity-0 cursor-pointer"
                            style={{ marginTop: '0px' }}
                        />
                        <div className="flex justify-between mt-1">
                            <span className="text-xs text-muted-foreground/50">{min}{unit}</span>
                            <span className="text-sm font-semibold text-primary">{value || '—'}{unit && value ? unit : ''}</span>
                            <span className="text-xs text-muted-foreground/50">{max}{unit}</span>
                        </div>
                    </div>

                    {quickValues && quickValues.length > 0 && (
                        <div className="flex flex-wrap gap-2">
                            {quickValues.map((qv) => (
                                <button
                                    key={qv}
                                    type="button"
                                    onClick={() => handleQuickSelect(qv)}
                                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all touch-manipulation min-h-[40px] ${numValue === qv
                                        ? 'bg-primary/20 text-primary border-2 border-primary/50'
                                        : 'bg-muted/50 text-muted-foreground border border-border hover:bg-accent hover:border-primary/50'
                                        }`}
                                >
                                    {qv}{unit}
                                </button>
                            ))}
                        </div>
                    )}
                </motion.div>
            )}
        </div>
    )
}
