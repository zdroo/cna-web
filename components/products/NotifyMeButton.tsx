"use client";

import { useState } from "react";
import { Bell } from "lucide-react";
import { subscribeToStockNotification } from "@/lib/api/reviews";

export default function NotifyMeButton({ variantId }: { variantId: string }) {
    const [email, setEmail] = useState("");
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [open, setOpen] = useState(false);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!email.trim()) return;
        setLoading(true);
        setError(null);
        try {
            await subscribeToStockNotification(variantId, email.trim());
            setSent(true);
            setOpen(false);
        } catch (err) {
            setError((err as Error).message);
        } finally {
            setLoading(false);
        }
    }

    if (sent) {
        return (
            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                <Bell size={15} /> Vei fi notificat când produsul revine în stoc.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-2">
            {!open ? (
                <button
                    onClick={() => setOpen(true)}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                    <Bell size={15} />
                    Notifică-mă când revine în stoc
                </button>
            ) : (
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="Email-ul tău..."
                        className="flex-1 px-3 py-2 text-sm border border-gray-200 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                    />
                    <button
                        type="submit"
                        disabled={loading}
                        className="px-4 py-2 rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:bg-gray-800 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                    >
                        {loading ? "..." : "Trimite"}
                    </button>
                    <button
                        type="button"
                        onClick={() => setOpen(false)}
                        className="px-3 py-2 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                        Anulează
                    </button>
                </form>
            )}
            {error && <p className="text-xs text-red-500 dark:text-red-400">{error}</p>}
        </div>
    );
}
