import Link from "next/link";

export function Footer() {
    return (
        <footer className="w-full py-6 bg-gray-100 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 mt-auto">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center text-sm text-gray-600 dark:text-gray-400">
                <div className="mb-4 md:mb-0">
                    <p>&copy; {new Date().getFullYear()} Sihat TCM. All rights reserved.</p>
                </div>
                <div className="flex items-center space-x-4">
                    <span>Developed by Prisma Technology Solution Sdn Bhd</span>
                    <Link href="/about" className="hover:text-gray-900 dark:hover:text-gray-200 underline">
                        Company Profile
                    </Link>
                </div>
            </div>
        </footer>
    );
}
