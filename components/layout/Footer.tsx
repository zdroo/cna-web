import Link from "next/link";

export default function Footer() {
    return (
        <footer className="mt-16 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
            <div className="max-w-7xl mx-auto px-4 py-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-sm text-gray-500 dark:text-gray-400">
                <p>© {new Date().getFullYear()} CNA Shop. Toate drepturile rezervate.</p>
                <nav className="flex items-center gap-5">
                    <Link href="/termeni" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        Termeni și condiții
                    </Link>
                    <Link href="/confidentialitate" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        Confidențialitate
                    </Link>
                    <Link href="/contact" className="hover:text-gray-900 dark:hover:text-gray-100 transition-colors">
                        Contact
                    </Link>
                </nav>
            </div>
        </footer>
    );
}
