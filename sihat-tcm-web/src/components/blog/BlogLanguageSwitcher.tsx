"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Languages } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const languages = [
  { code: "en", label: "English" },
  { code: "ms", label: "Bahasa Malaysia" },
  { code: "zh", label: "中文" },
];

export function BlogLanguageSwitcher() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentLang = searchParams.get("lang") || "en";

  const handleLanguageChange = (langCode: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (langCode === "en") {
      params.delete("lang"); // Clean URL for default
    } else {
      params.set("lang", langCode);
    }
    router.push(`${pathname}?${params.toString()}`);
  };

  const currentLanguageLabel = languages.find((l) => l.code === currentLang)?.label || "English";

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Languages className="h-4 w-4" />
          <span>{currentLanguageLabel}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {languages.map((lang) => (
          <DropdownMenuItem
            key={lang.code}
            onClick={() => handleLanguageChange(lang.code)}
            className={cn("cursor-pointer", currentLang === lang.code && "bg-accent font-medium")}
          >
            {lang.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
