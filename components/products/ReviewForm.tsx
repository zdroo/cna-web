"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Star, ShoppingBag } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { addReview, checkCanReview } from "@/lib/api/reviews";

const RATING_LABELS = ["", "Foarte slab", "Slab", "Decent", "Bun", "Excelent"];

interface Props {
    variantId: string;
    existingReviews: { userId: string }[];
}

export default function ReviewForm({ variantId, existingReviews }: Props) {
    const { user, token } = useAuth();
    const router = useRouter();

    const [canReview, setCanReview]     = useState<boolean | null>(null);
    const [rating, setRating]           = useState(0);
    const [hovered, setHovered]         = useState(0);
    const [comment, setComment]         = useState("");
    const [submitting, setSubmitting]   = useState(false);
    const [submitted, setSubmitted]     = useState(false);
    const [error, setError]             = useState<string | null>(null);

    const alreadyReviewed = !!user && existingReviews.some(r => r.userId === user.userId);

    useEffect(() => {
        if (!user || !token || alreadyReviewed) return;
        checkCanReview(token, variantId).then(setCanReview);
    }, [user, token, variantId, alreadyReviewed]);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!rating || !comment.trim() || !token) return;
        setSubmitting(true);
        setError(null);
        try {
            await addReview(token, variantId, rating, comment.trim());
            setSubmitted(true);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare la adăugarea recenziei");
        } finally {
            setSubmitting(false);
        }
    }

    if (!user) {
        return (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center justify-between gap-4">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    Conectează-te pentru a lăsa o recenzie.
                </p>
                <Link
                    href="/auth/login"
                    className="shrink-0 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                    Conectează-te
                </Link>
            </div>
        );
    }

    if (alreadyReviewed) {
        return (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-6 py-5">
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Ai adăugat deja o recenzie pentru acest produs.
                </p>
            </div>
        );
    }

    if (canReview === null) {
        return (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-6 py-5 h-16 animate-pulse" />
        );
    }

    if (!canReview) {
        return (
            <div className="rounded-xl bg-gray-50 dark:bg-gray-900/60 border border-gray-200 dark:border-gray-800 px-6 py-5 flex items-center gap-3">
                <ShoppingBag size={18} className="text-gray-400 dark:text-gray-500 shrink-0" />
                <p className="text-sm text-gray-500 dark:text-gray-400">
                    Poți lăsa o recenzie doar după ce ai primit comanda.
                </p>
            </div>
        );
    }

    if (submitted) {
        return (
            <div className="rounded-xl bg-green-50 dark:bg-green-950/40 border border-green-200 dark:border-green-800 px-6 py-5">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">Recenzia ta a fost trimisă. Mulțumim!</p>
            </div>
        );
    }

    const active = hovered || rating;

    return (
        <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-xl p-6 shadow-sm flex flex-col gap-5"
        >
            <h3 className="font-semibold text-gray-900 dark:text-gray-100">Adaugă o recenzie</h3>

            <div className="flex items-center gap-1">
                {[1, 2, 3, 4, 5].map(star => (
                    <button
                        key={star}
                        type="button"
                        onClick={() => setRating(star)}
                        onMouseEnter={() => setHovered(star)}
                        onMouseLeave={() => setHovered(0)}
                        className="p-0.5 transition-transform hover:scale-110"
                    >
                        <Star
                            size={28}
                            className={
                                star <= active
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "text-gray-200 dark:text-gray-700"
                            }
                        />
                    </button>
                ))}
                <span className={`ml-2 text-sm transition-opacity ${active ? "opacity-100 text-gray-500 dark:text-gray-400" : "opacity-0"}`}>
                    {RATING_LABELS[active]}
                </span>
            </div>

            <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="Descrie experiența ta cu acest produs..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 text-sm resize-none focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
            />

            {error && <p className="text-sm text-red-500 -mt-2">{error}</p>}

            <button
                type="submit"
                disabled={!rating || !comment.trim() || submitting}
                className="self-start bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2.5 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
                {submitting ? "Se trimite..." : "Trimite recenzia"}
            </button>
        </form>
    );
}
