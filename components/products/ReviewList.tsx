"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Star, Pencil, Trash2, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { updateReview, deleteReview } from "@/lib/api/reviews";
import type { Review } from "@/types/product";

interface Props {
    reviews: Review[];
    variantId: string;
}

export default function ReviewList({ reviews: initial }: Props) {
    const { token, user } = useAuth();
    const router = useRouter();
    const [reviews, setReviews] = useState(initial);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editRating, setEditRating] = useState(0);
    const [editComment, setEditComment] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    function startEdit(r: Review) {
        setEditingId(r.reviewId);
        setEditRating(r.rating);
        setEditComment(r.comment ?? "");
    }

    async function handleSave(reviewId: string) {
        if (!token) return;
        setSaving(true);
        setError(null);
        try {
            await updateReview(token, reviewId, editRating, editComment);
            setReviews((prev) => prev.map((r) =>
                r.reviewId === reviewId ? { ...r, rating: editRating, comment: editComment } : r
            ));
            setEditingId(null);
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare la salvarea recenziei");
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(reviewId: string) {
        if (!token) return;
        if (!window.confirm("Ești sigur că vrei să ștergi această recenzie?")) return;
        setError(null);
        try {
            await deleteReview(token, reviewId);
            setReviews((prev) => prev.filter((r) => r.reviewId !== reviewId));
            router.refresh();
        } catch (err) {
            setError(err instanceof Error ? err.message : "Eroare la ștergerea recenziei");
        }
    }

    if (reviews.length === 0) {
        return (
            <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                Nicio recenzie încă. Fii primul care recenzează acest produs.
            </p>
        );
    }

    return (
        <div className="flex flex-col gap-4">
            {error && (
                <p className="text-sm text-red-500 dark:text-red-400 px-1">{error}</p>
            )}
            {reviews.map((review) => {
                const isOwn = user?.userId === review.userId;
                const isEditing = editingId === review.reviewId;
                return (
                    <div key={review.reviewId} className="bg-white dark:bg-gray-900 dark:border dark:border-gray-800 rounded-xl p-6 shadow-sm">
                        <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center gap-3">
                                <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center shrink-0">
                                    <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
                                        {review.userName?.charAt(0).toUpperCase() ?? "?"}
                                    </span>
                                </div>
                                <span className="font-medium text-gray-900 dark:text-gray-100">
                                    {review.userName || "Anonim"}
                                </span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-sm text-gray-400 dark:text-gray-500">
                                    {new Date(review.createdAt).toLocaleDateString("ro-RO")}
                                </span>
                                {isOwn && !isEditing && (
                                    <>
                                        <button
                                            onClick={() => startEdit(review)}
                                            className="p-1 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            title="Editează"
                                        >
                                            <Pencil size={14} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(review.reviewId)}
                                            className="p-1 rounded-lg text-gray-400 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                                            title="Șterge"
                                        >
                                            <Trash2 size={14} />
                                        </button>
                                    </>
                                )}
                                {isEditing && (
                                    <>
                                        <button
                                            onClick={() => handleSave(review.reviewId)}
                                            disabled={saving}
                                            className="p-1 rounded-lg text-green-500 hover:bg-green-50 dark:hover:bg-green-950/30 transition-colors disabled:opacity-50"
                                            title="Salvează"
                                        >
                                            <Check size={14} />
                                        </button>
                                        <button
                                            onClick={() => setEditingId(null)}
                                            className="p-1 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                                            title="Anulează"
                                        >
                                            <X size={14} />
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>

                        {isEditing ? (
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center gap-0.5">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <button key={star} onClick={() => setEditRating(star)}>
                                            <Star
                                                size={18}
                                                className={star <= editRating
                                                    ? "fill-yellow-400 text-yellow-400"
                                                    : "text-gray-200 dark:text-gray-700 hover:text-yellow-300"
                                                }
                                            />
                                        </button>
                                    ))}
                                </div>
                                <textarea
                                    rows={3}
                                    value={editComment}
                                    onChange={(e) => setEditComment(e.target.value)}
                                    className="w-full border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 resize-none focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
                                />
                            </div>
                        ) : (
                            <>
                                <div className="flex items-center gap-0.5 mb-3">
                                    {[1, 2, 3, 4, 5].map((star) => (
                                        <Star
                                            key={star}
                                            size={14}
                                            className={star <= review.rating
                                                ? "fill-yellow-400 text-yellow-400"
                                                : "text-gray-200 dark:text-gray-700"
                                            }
                                        />
                                    ))}
                                </div>
                                {review.comment && (
                                    <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed">{review.comment}</p>
                                )}
                            </>
                        )}
                    </div>
                );
            })}
        </div>
    );
}
