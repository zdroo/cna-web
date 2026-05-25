import type { Metadata } from "next";
import Link from "next/link";
import { Home, ShoppingBag } from "lucide-react";

export const metadata: Metadata = {
    title: "Pagina nu a fost găsită",
};

export default function NotFound() {
    return (
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
            <div className="text-9xl font-bold text-gray-100 dark:text-gray-800 select-none leading-none">
                404
            </div>
            <div className="flex flex-col gap-2 -mt-4">
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                    Pagina nu a fost găsită
                </h1>
                <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                    Pagina pe care o cauți nu există sau a fost mutată.
                </p>
            </div>
            <div className="flex gap-3">
                <Link
                    href="/"
                    className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                >
                    <Home size={15} />
                    Acasă
                </Link>
                <Link
                    href="/produse"
                    className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 px-5 py-2.5 rounded-xl font-semibold text-sm hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                >
                    <ShoppingBag size={15} />
                    Produse
                </Link>
            </div>
        </div>
    );
}
