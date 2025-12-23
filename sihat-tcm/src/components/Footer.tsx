'use client';

import Link from "next/link";
import { useLanguage } from "@/contexts/LanguageContext";

export function Footer() {
    const { t } = useLanguage();

    return (
        <footer className="w-full py-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="mb-4 md:mb-0">
                    <p>{t.common.copyright.replace('{year}', new Date().getFullYear().toString())}</p>
                </div>
                <div className="flex items-center space-x-4">
                    <span>{t.common.developedBy}</span>
                    <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-200 underline">
                        {t.common.companyProfile}
                    </Link>
                </div>
            </div>
        </footer>
    );
}
