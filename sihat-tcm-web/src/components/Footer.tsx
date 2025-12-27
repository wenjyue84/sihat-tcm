"use client";

import Link from "next/link";
import { useLanguage } from "@/stores/useAppStore";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Smartphone, Bell } from "lucide-react";

export function Footer() {
  const { t, language } = useLanguage();

  const downloadText = {
    en: "Download App",
    ms: "Muat Turun App",
    zh: "下载应用",
  }[language];

  return (
    <footer className="w-full py-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
      <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
        <div className="mb-4 md:mb-0">
          <p>{t.common.copyright.replace("{year}", new Date().getFullYear().toString())}</p>
        </div>
        <nav
          aria-label="Footer navigation"
          className="flex items-center space-x-4 flex-wrap justify-center md:justify-end gap-y-2"
        >
          <span>{t.common.developedBy}</span>
          <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-200 underline">
            {t.common.companyProfile}
          </Link>
          <Link href="/blog" className="hover:text-gray-900 dark:hover:text-gray-200 underline">
            {t.nav.blog}
          </Link>

          {/* App Download Dialog */}
          <Dialog>
            <DialogTrigger asChild>
              <button className="hover:text-gray-900 dark:hover:text-gray-200 underline font-medium text-emerald-600 dark:text-emerald-400">
                {downloadText}
              </button>
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
                  <Button
                    variant="default"
                    className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700"
                  >
                    {t.appDownload.close}
                  </Button>
                </DialogClose>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </nav>
      </div>
    </footer>
  );
}
