'use client';

import { useLanguage } from '@/contexts/LanguageContext';
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
    DialogClose
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Smartphone, Bell } from 'lucide-react';

export function AppDownloadSection() {
    const { t } = useLanguage();

    const ComingSoonDialog = ({ children }: { children: React.ReactNode }) => (
        <Dialog>
            <DialogTrigger asChild>
                {children}
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2 text-emerald-700">
                        <Smartphone className="w-6 h-6" />
                        {t.appDownload.comingSoonTitle}
                    </DialogTitle>
                    <DialogDescription className="pt-2 text-base">
                        {t.appDownload.comingSoonDesc}
                    </DialogDescription>
                </DialogHeader>
                <DialogFooter className="sm:justify-between items-center gap-4 mt-4">
                    <Button variant="outline" className="w-full sm:w-auto" disabled>
                        <Bell className="w-4 h-4 mr-2" />
                        {t.appDownload.notifyMe}
                    </Button>
                    <DialogClose asChild>
                        <Button variant="default" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700">
                            {t.appDownload.close}
                        </Button>
                    </DialogClose>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );

    return (
        <section id="app-download-section" className="relative overflow-hidden bg-emerald-900 text-white py-16 px-4 md:px-6 mt-8">
            <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] pointer-events-none"></div>

            {/* Decorative circles */}
            <div className="absolute -top-24 -left-24 w-64 h-64 rounded-full bg-emerald-500/10 blur-3xl pointer-events-none"></div>
            <div className="absolute bottom-0 right-0 w-96 h-96 rounded-full bg-teal-500/10 blur-3xl pointer-events-none"></div>


            <div className="relative z-10 max-w-5xl mx-auto flex flex-col md:flex-row items-center gap-8 md:gap-16">

                {/* Text Content */}
                <div className="flex-1 text-center md:text-left space-y-6">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-emerald-100 to-white">
                        {t.appDownload.title}
                    </h2>
                    <p className="text-lg md:text-xl text-emerald-100/90 leading-relaxed max-w-2xl">
                        {t.appDownload.subtitle}
                    </p>

                    <div className="flex flex-col sm:flex-row items-center justify-center md:justify-start gap-4 mt-8">
                        {/* App Store Button */}
                        <ComingSoonDialog>
                            <button className="group flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl border border-white/20 hover:bg-black/80 hover:scale-105 transition-all duration-300 shadow-xl w-full sm:w-auto justify-center">
                                <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.74 1.18 0 2.21-.84 3.67-.84 1.54 0 2.72.63 3.45 1.77-3.11 1.66-2.57 6.47.66 7.97-.53 1.65-1.33 3.26-2.86 5.33zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.16 2.39-2.11 4.21-3.74 4.25z" />
                                </svg>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[10px] uppercase font-medium tracking-wide opacity-80 leading-none mb-0.5">Download on the</span>
                                    <span className="text-lg font-bold leading-none">App Store</span>
                                </div>
                            </button>
                        </ComingSoonDialog>

                        {/* Google Play Button */}
                        <ComingSoonDialog>
                            <button className="group flex items-center gap-3 bg-black text-white px-6 py-3 rounded-xl border border-white/20 hover:bg-black/80 hover:scale-105 transition-all duration-300 shadow-xl w-full sm:w-auto justify-center">
                                <svg className="w-7 h-7 fill-current" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path d="M3,20.5V3.5C3,2.91,3.34,2.39,3.84,2.15L13.2,12L3.84,21.85C3.34,21.6,3,21.09,3,20.5M14.63,12L4.8,1.64c0.61-0.25,1.26-0.25,1.88,0l12.87,7.15C19.86,9.15,20,9.58,20,10s-0.14,0.85-0.45,1.21l-12.87,7.15c-0.61,0.25-1.26,0.25-1.88,0L14.63,12Z" />
                                </svg>
                                <div className="flex flex-col items-start text-left">
                                    <span className="text-[10px] uppercase font-medium tracking-wide opacity-80 leading-none mb-0.5">Get it on</span>
                                    <span className="text-lg font-bold leading-none">Google Play</span>
                                </div>
                            </button>
                        </ComingSoonDialog>
                    </div>
                </div>

                {/* Mockup Image - CSS Representation of a Phone */}
                <div className="hidden md:flex justify-center flex-1 relative perspective-[1000px]">
                    <div className="relative w-[280px] h-[580px] bg-gray-900 rounded-[3rem] border-8 border-gray-900 shadow-2xl overflow-hidden ring-4 ring-emerald-500/30 transform rotate-y-[-10deg] rotate-x-[5deg] hover:rotate-0 transition-all duration-700 ease-out-expo group">
                        {/* Status Bar */}
                        <div className="absolute top-0 left-0 right-0 h-6 bg-black z-20 flex justify-between items-center px-6 text-[10px] text-white font-medium">
                            <span>9:41</span>
                            <div className="flex gap-1.5">
                                <div className="w-3 h-3 bg-white rounded-full opacity-100"></div>
                                <div className="w-3 h-3 bg-white rounded-full opacity-50"></div>
                            </div>
                        </div>
                        {/* Dynamic Island / Notch */}
                        <div className="absolute top-6 left-1/2 -translate-x-1/2 w-28 h-7 bg-black rounded-b-2xl z-20"></div>

                        {/* Screen Content */}
                        <div className="w-full h-full bg-stone-50 relative overflow-hidden flex flex-col pt-12">
                            {/* App Header */}
                            <div className="px-5 pt-4 pb-6 bg-gradient-to-br from-emerald-800 to-emerald-700 text-white rounded-b-[2rem] shadow-lg mb-4">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center backdrop-blur-sm">
                                        <div className="w-6 h-6 rounded-full border-2 border-white/60"></div>
                                    </div>
                                    <div>
                                        <div className="h-3 w-24 bg-white/20 rounded-full mb-1.5"></div>
                                        <div className="h-2 w-16 bg-white/10 rounded-full"></div>
                                    </div>
                                </div>
                                <div className="h-20 bg-emerald-600/50 rounded-2xl border border-white/10 backdrop-blur-sm p-3 flex items-center justify-between">
                                    <div className="space-y-2">
                                        <div className="h-2 w-12 bg-white/40 rounded-full"></div>
                                        <div className="h-4 w-20 bg-white/90 rounded-full"></div>
                                    </div>
                                    <div className="w-12 h-12 bg-white/20 rounded-full animate-pulse"></div>
                                </div>
                            </div>

                            {/* App Body */}
                            <div className="px-5 space-y-3 flex-1 overflow-hidden">
                                <div className="flex justify-between items-center mb-1">
                                    <div className="h-3 w-24 bg-gray-300 rounded-full"></div>
                                    <div className="h-3 w-12 bg-emerald-100 text-emerald-600 text-[10px] flex items-center justify-center rounded-full font-bold">View All</div>
                                </div>

                                <div className="h-28 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-20 h-20 bg-orange-100 rounded-full -mr-6 -mt-6 opacity-50"></div>
                                    <div className="relative z-10">
                                        <div className="h-3 w-32 bg-gray-800 rounded-full mb-2"></div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full mb-2"></div>
                                        <div className="h-2 w-2/3 bg-gray-100 rounded-full"></div>
                                    </div>
                                </div>

                                <div className="h-28 bg-white rounded-2xl shadow-sm border border-gray-100 p-4 relative overflow-hidden">
                                    <div className="absolute right-0 top-0 w-20 h-20 bg-blue-100 rounded-full -mr-6 -mt-6 opacity-50"></div>
                                    <div className="relative z-10">
                                        <div className="h-3 w-28 bg-gray-800 rounded-full mb-2"></div>
                                        <div className="h-2 w-full bg-gray-100 rounded-full mb-2"></div>
                                        <div className="h-2 w-3/4 bg-gray-100 rounded-full"></div>
                                    </div>
                                </div>
                            </div>

                            {/* Bottom Nav */}
                            <div className="h-16 bg-white border-t border-gray-100 flex justify-around items-center px-2">
                                <div className="w-10 h-10 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-600">●</div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300">●</div>
                                <div className="w-12 h-12 rounded-full bg-emerald-600 shadow-lg -mt-8 flex items-center justify-center text-white border-4 border-stone-50">+</div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300">●</div>
                                <div className="w-10 h-10 rounded-full flex items-center justify-center text-gray-300">●</div>
                            </div>

                            {/* Home Bar */}
                            <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-32 h-1 bg-black rounded-full z-20"></div>
                        </div>
                    </div>
                </div>

            </div>
        </section>
    );
}
