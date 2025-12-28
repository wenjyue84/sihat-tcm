import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import type { PatientFlag } from "@/types/database";
import { AlertTriangle, AlertCircle, Eye, CheckCircle2 } from "lucide-react";

interface FlagBadgeProps {
    flag?: PatientFlag;
    className?: string;
    showIcon?: boolean;
}

export function FlagBadge({ flag, className, showIcon = true }: FlagBadgeProps) {
    if (!flag || flag === 'Normal') return null;

    const getVariantStyles = (flag: PatientFlag) => {
        switch (flag) {
            case 'Critical':
                return "bg-red-500/10 text-red-600 hover:bg-red-500/20 border-red-200";
            case 'High Priority':
                return "bg-orange-500/10 text-orange-600 hover:bg-orange-500/20 border-orange-200";
            case 'Watch':
                return "bg-blue-500/10 text-blue-600 hover:bg-blue-500/20 border-blue-200";
            default:
                return "bg-slate-100 text-slate-600 hover:bg-slate-200 border-slate-200";
        }
    };

    const getIcon = (flag: PatientFlag) => {
        switch (flag) {
            case 'Critical':
                return AlertCircle;
            case 'High Priority':
                return AlertTriangle;
            case 'Watch':
                return Eye;
            default:
                return null;
        }
    };

    const Icon = showIcon ? getIcon(flag) : null;

    return (
        <Badge
            variant="outline"
            className={cn("gap-1.5 font-medium border", getVariantStyles(flag), className)}
        >
            {Icon && <Icon className="w-3.5 h-3.5" />}
            {flag}
        </Badge>
    );
}
