import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
    title: "Page Not Found",
    description: "The page you're looking for doesn't exist or has been moved.",
    robots: {
        index: false,
        follow: true,
    },
};

export default function NotFound() {
    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center px-4 py-16 bg-gradient-to-b from-background via-background to-muted/30">
            {/* Decorative elements */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="absolute top-1/4 left-1/4 w-72 h-72 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-chart-2/5 rounded-full blur-3xl" />
            </div>

            {/* Content */}
            <div className="relative z-10 text-center max-w-2xl mx-auto">
                {/* 404 Number with gradient */}
                <div className="mb-8">
                    <h1 className="text-[10rem] sm:text-[12rem] font-bold leading-none bg-gradient-to-br from-primary via-muted-foreground to-primary/50 bg-clip-text text-transparent select-none">
                        404
                    </h1>
                </div>

                {/* Error Message */}
                <h2 className="text-2xl sm:text-3xl font-semibold text-foreground mb-4">
                    Page Not Found
                </h2>

                {/* Specific Tina CMS Guidance */}
                <div id="tina-admin-hint" className="hidden mb-8 p-6 bg-amber-50 border border-amber-200 rounded-xl text-left animate-in fade-in slide-in-from-top-4 duration-700">
                    <h3 className="text-amber-800 font-bold flex items-center gap-2 mb-2">
                        <span className="text-lg">🦙</span> Tina CMS Troubleshooting
                    </h3>
                    <p className="text-amber-700 text-sm mb-4">
                        It looks like you&apos;re trying to access the blog editor. If you see this 404 page, it usually means the Tina CMS engine is not running.
                    </p>
                    <div className="bg-amber-100/50 p-3 rounded-lg border border-amber-200/50">
                        <p className="text-xs font-mono text-amber-900 mb-2">To fix this, stop your current server and run:</p>
                        <code className="block bg-black text-white p-2 rounded text-xs">npm run dev:tina</code>
                    </div>
                </div>

                <script dangerouslySetInnerHTML={{
                    __html: `
                        if (window.location.pathname.includes('tina-admin')) {
                            document.getElementById('tina-admin-hint').classList.remove('hidden');
                        }
                    `
                }} />

                <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                    Oops! The page you&apos;re looking for seems to have wandered off the
                    path. It might have been moved, deleted, or perhaps never existed.
                </p>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                    <Button asChild size="lg" className="min-w-[160px]">
                        <Link href="/">Return Home</Link>
                    </Button>
                    <Button asChild variant="outline" size="lg" className="min-w-[160px]">
                        <Link href="/patient/diagnosis">Start Diagnosis</Link>
                    </Button>
                </div>

                {/* Suggested Pages */}
                <div className="pt-8 border-t border-border/50">
                    <p className="text-sm text-muted-foreground mb-4">
                        Or explore these popular pages:
                    </p>
                    <div className="flex flex-wrap items-center justify-center gap-3">
                        <Link
                            href="/blog"
                            className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                        >
                            Blog
                        </Link>
                        <span className="text-muted-foreground/30">•</span>
                        <Link
                            href="/about"
                            className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                        >
                            About Us
                        </Link>
                        <span className="text-muted-foreground/30">•</span>
                        <Link
                            href="/login"
                            className="text-sm text-primary hover:text-primary/80 hover:underline underline-offset-4 transition-colors"
                        >
                            Login
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
