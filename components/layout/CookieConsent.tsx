"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Cookie, X } from "lucide-react";

const STORAGE_KEY = "cookieConsent";

export default function CookieConsent() {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (!saved) setVisible(true);
        } catch {
            // localStorage unavailable (private browsing, etc.)
        }
    }, []);

    function accept() {
        try { localStorage.setItem(STORAGE_KEY, "accepted"); } catch { /* noop */ }
        setVisible(false);
    }

    function decline() {
        try { localStorage.setItem(STORAGE_KEY, "necessary"); } catch { /* noop */ }
        setVisible(false);
    }

    if (!visible) return null;

    return (
        <div className="fixed bottom-0 left-0 right-0 z-50 p-4 sm:p-6">
            <div className="max-w-2xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl p-5 flex flex-col sm:flex-row gap-4 items-start sm:items-center">

                <div className="flex items-start gap-3 flex-1">
                    <Cookie size={22} className="text-orange-500 shrink-0 mt-0.5" />
                    <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                        Folosim cookie-uri pentru a asigura funcționarea corectă a site-ului și pentru a îmbunătăți experiența dumneavoastră. Consultați{" "}
                        <Link href="/confidentialitate" className="underline text-gray-800 dark:text-gray-200 hover:text-gray-900 dark:hover:text-white transition-colors">
                            politica de confidențialitate
                        </Link>
                        {" "}pentru detalii.
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    <button
                        onClick={decline}
                        className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white px-4 py-2 rounded-xl border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Doar necesare
                    </button>
                    <button
                        onClick={accept}
                        className="text-sm bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
                    >
                        Accept toate
                    </button>
                    <button
                        onClick={decline}
                        aria-label="Închide"
                        className="text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 p-1 transition-colors"
                    >
                        <X size={16} />
                    </button>
                </div>

            </div>
        </div>
    );
}
