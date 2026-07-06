"use client";

import { useEffect } from "react";

export default function Error({
    error,
    reset,
}: {
    error: Error & { digest?: string };
    reset: () => void;
}) {
    useEffect(() => {
        console.error(error);
    }, [error]);

    return (
        <div className="flex flex-col items-center justify-center py-32 gap-4 text-center">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Ceva a mers prost.
            </h2>
            <p className="text-gray-500 dark:text-gray-400 max-w-sm">
                A apărut o eroare neașteptată. Poți încerca din nou sau reveni mai târziu.
            </p>
            <button
                onClick={reset}
                className="px-5 py-2.5 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors"
            >
                Încearcă din nou
            </button>
        </div>
    );
}
