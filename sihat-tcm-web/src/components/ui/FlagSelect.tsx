import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { PatientFlag } from "@/types/database";
import { FlagBadge } from "./FlagBadge";

interface FlagSelectProps {
    value?: PatientFlag;
    onValueChange: (value: PatientFlag) => void;
    disabled?: boolean;
    placeholder?: string;
}

const FLAG_OPTIONS: PatientFlag[] = ['Normal', 'Critical', 'High Priority', 'Watch'];

export function FlagSelect({ value, onValueChange, disabled, placeholder = "Set Status" }: FlagSelectProps) {
    return (
        <Select
            value={value || 'Normal'}
            onValueChange={(val) => onValueChange(val as PatientFlag)}
            disabled={disabled}
        >
            <SelectTrigger className="w-[160px]">
                <SelectValue placeholder={placeholder} />
            </SelectTrigger>
            <SelectContent>
                {FLAG_OPTIONS.map((option) => (
                    <SelectItem key={option} value={option || 'Normal'}>
                        <div className="flex items-center gap-2">
                            {option === 'Normal' ? (
                                <span className="text-muted-foreground">Normal</span>
                            ) : (
                                <FlagBadge flag={option} showIcon={false} />
                            )}
                        </div>
                    </SelectItem>
                ))}
            </SelectContent>
        </Select>
    );
}
