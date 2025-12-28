import { useState } from "react";
import { FlagBadge } from "@/components/ui/FlagBadge";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { PatientFlag } from "@/types/database";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface PatientFlagUpdateProps {
    currentFlag: PatientFlag;
    onUpdate: (flag: PatientFlag) => Promise<void>;
    className?: string;
}

export function PatientFlagUpdate({ currentFlag, onUpdate, className }: PatientFlagUpdateProps) {
    const [updating, setUpdating] = useState(false);

    const handleSelect = async (flag: PatientFlag) => {
        if (flag === currentFlag) return;
        setUpdating(true);
        try {
            await onUpdate(flag);
        } catch (error) {
            console.error("Failed to update flag", error);
        } finally {
            setUpdating(false);
        }
    };

    const flags: PatientFlag[] = ['Normal', 'Watch', 'High Priority', 'Critical'];

    return (
        <DropdownMenu>
            <DropdownMenuTrigger disabled={updating} className={cn("focus:outline-none", className)}>
                <div className={cn("cursor-pointer transition-opacity hover:opacity-80", updating && "opacity-50")}>
                    {updating ? (
                        <Loader2 className="w-4 h-4 animate-spin text-slate-400" />
                    ) : (
                        <FlagBadge flag={currentFlag} />
                    )}
                </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
                {flags.map((flag) => (
                    <DropdownMenuItem
                        key={flag || 'null'}
                        onClick={() => handleSelect(flag)}
                        className="cursor-pointer"
                    >
                        <FlagBadge flag={flag} showIcon={true} className="border-none bg-transparent hover:bg-transparent" />
                    </DropdownMenuItem>
                ))}
            </DropdownMenuContent>
        </DropdownMenu>
    );
}
