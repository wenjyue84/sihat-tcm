import { useRouter } from "next/navigation";
import { Terminal, Zap, Home, Menu } from "lucide-react";
import { Button } from "@/components/ui/button";

interface DeveloperHeaderProps {
  currentTime: Date;
  isMobileMenuOpen: boolean;
  onMobileMenuToggle: () => void;
}

export function DeveloperHeader({
  currentTime,
  isMobileMenuOpen,
  onMobileMenuToggle,
}: DeveloperHeaderProps) {
  const router = useRouter();

  return (
    <header className="h-16 border-b border-white/5 bg-[#0f0f11]/80 backdrop-blur-md flex items-center justify-between px-6 shrink-0 z-50">
      <div className="flex items-center gap-3">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-700 flex items-center justify-center shadow-lg shadow-violet-900/20">
          <Terminal className="text-white w-5 h-5" />
        </div>
        <div>
          <h1 className="text-base font-bold text-white tracking-tight leading-none">
            Developer <span className="text-violet-400">Portal</span>
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="flex h-1.5 w-1.5 rounded-full bg-emerald-500"></span>
            <span className="text-[9px] uppercase tracking-widest text-emerald-500/80 font-bold">
              System Online
            </span>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-4">
        {/* Action Bar */}
        <div className="flex items-center bg-white/5 rounded-full p-1 border border-white/5">
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs gap-2 hover:bg-violet-600 hover:text-white transition-colors text-amber-400 font-medium"
            onClick={() => router.push("/test-runner")}
          >
            <Zap className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Runner</span>
          </Button>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          <Button
            variant="ghost"
            size="sm"
            className="h-8 rounded-full px-3 text-xs gap-2 hover:bg-emerald-600 hover:text-white transition-colors text-emerald-400 font-medium"
            onClick={() => router.push("/")}
          >
            <Home className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Diagnosis App</span>
          </Button>
        </div>

        <div className="h-8 w-px bg-white/10 hidden md:block"></div>

        <div className="hidden md:flex flex-col items-end">
          <span className="text-xs text-gray-400 font-mono">
            {currentTime.toLocaleTimeString()}
          </span>
          <span className="text-[10px] text-gray-600 uppercase tracking-wider">
            {currentTime.toLocaleDateString()}
          </span>
        </div>

        <button
          className="md:hidden p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-md"
          onClick={onMobileMenuToggle}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
}


