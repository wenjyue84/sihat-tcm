
import { Button } from '@/components/ui/button'
import { SwitchCamera, Eye, EyeOff, Camera } from 'lucide-react'

interface CameraControlsProps {
    onSwitchCamera: () => void
    onToggleQuality: () => void
    onToggleGuide: () => void
    showQualityOverlay: boolean
}

export function CameraControls({
    onSwitchCamera,
    onToggleQuality,
    onToggleGuide,
    showQualityOverlay
}: CameraControlsProps) {
    return (
        <div className="absolute top-2 right-2 z-10 flex flex-col gap-2 pointer-events-auto">
            <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none h-10 w-10"
                onClick={onSwitchCamera}
                title="Switch Camera"
            >
                <SwitchCamera className="w-5 h-5" />
            </Button>

            <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none h-10 w-10"
                onClick={onToggleQuality}
                title="Toggle Quality Feedback"
            >
                {showQualityOverlay ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
            </Button>

            <Button
                type="button"
                variant="secondary"
                size="icon"
                className="rounded-full bg-black/50 hover:bg-black/70 text-white border-none h-10 w-10"
                onClick={onToggleGuide}
                title="Toggle Composition Guide"
            >
                <Camera className="w-5 h-5" />
            </Button>
        </div>
    )
}
