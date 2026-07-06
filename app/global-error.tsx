"use client";

import { useEffect } from "react";

export default function GlobalError({
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
        <html lang="ro">
            <body className="bg-gray-50 text-gray-900 antialiased flex flex-col items-center justify-center min-h-screen gap-4 text-center px-4">
                <h1 className="text-3xl font-bold">CNA Shop</h1>
                <h2 className="text-xl font-semibold text-gray-700">Ceva a mers prost.</h2>
                <p className="text-gray-500 max-w-sm">
                    A apărut o eroare neașteptată. Poți încerca din nou sau reveni mai târziu.
                </p>
                <button
                    onClick={reset}
                    className="px-5 py-2.5 bg-gray-900 text-white rounded-xl font-semibold hover:bg-gray-700 transition-colors"
                >
                    Încearcă din nou
                </button>
            </body>
        </html>
    );
}
