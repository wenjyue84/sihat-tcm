import { ColorClasses } from "./types";

export const COLOR_CLASSES: Record<string, ColorClasses> = {
  emerald: {
    bg: "hover:bg-emerald-50",
    border: "border-gray-200 hover:border-emerald-300",
    text: "group-hover:text-emerald-700",
    iconBg: "bg-emerald-600 group-hover:bg-emerald-700",
  },
  amber: {
    bg: "hover:bg-amber-50",
    border: "border-gray-200 hover:border-amber-300",
    text: "group-hover:text-amber-700",
    iconBg: "bg-amber-600 group-hover:bg-amber-700",
  },
  slate: {
    bg: "hover:bg-slate-50",
    border: "border-gray-200 hover:border-slate-400",
    text: "group-hover:text-slate-700",
    iconBg: "bg-slate-600 group-hover:bg-slate-700",
  },
  violet: {
    bg: "hover:bg-violet-50",
    border: "border-gray-200 hover:border-violet-300",
    text: "group-hover:text-violet-700",
    iconBg: "bg-violet-600 group-hover:bg-violet-700",
  },
};

export function getColorClasses(color: string): ColorClasses {
  return COLOR_CLASSES[color] || COLOR_CLASSES.slate;
}
