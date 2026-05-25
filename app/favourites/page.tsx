"use client";

import Link from "next/link";
import Image from "next/image";
import { Heart, Trash2 } from "lucide-react";
import { useFavorites } from "@/context/FavoritesContext";

export default function FavouritesPage() {
    const { items, removeItem, isLoaded } = useFavorites();

    if (!isLoaded) {
        return (
            <div className="flex justify-center py-24 text-gray-400 dark:text-gray-500">
                <p>Se încarcă...</p>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-8">

            <div className="flex items-center gap-3">
                <Heart size={28} className="text-red-500 fill-red-500" />
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Favorite</h1>
                <span className="text-gray-400 dark:text-gray-500 text-sm mt-1">({items.length} produse)</span>
            </div>

            {items.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-24 gap-4 text-gray-400 dark:text-gray-500">
                    <Heart size={48} className="text-gray-300 dark:text-gray-600" />
                    <p className="text-lg font-medium">Nu ai niciun produs la favorite</p>
                    <Link
                        href="/produse"
                        className="mt-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors text-sm"
                    >
                        Explorează produse
                    </Link>
                </div>
            ) : (
                <div className="flex flex-wrap gap-6">
                    {items.map((item) => (
                        <div
                            key={item.favoriteItemId}
                            className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-transparent dark:border-gray-800 overflow-hidden w-56 flex flex-col"
                        >
                            <Link href={`/produse/${item.productSlug}/${item.variantSlug}`}>
                                <div className="relative aspect-square bg-gray-100 dark:bg-gray-800">
                                    {item.primaryImageUrl ? (
                                        <Image
                                            src={item.primaryImageUrl}
                                            alt={item.name}
                                            fill
                                            className="object-cover hover:scale-105 transition-transform duration-300"
                                        />
                                    ) : (
                                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-800" />
                                    )}
                                    {item.stockQuantity === 0 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white text-xs font-semibold">Stoc epuizat</span>
                                        </div>
                                    )}
                                    {item.stockQuantity > 0 && item.discountedPrice != null && (
                                        <div className="absolute top-2 left-2">
                                            <span className="bg-orange-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">
                                                -{Math.round((1 - item.discountedPrice / item.price) * 100)}%
                                            </span>
                                        </div>
                                    )}
                                </div>
                            </Link>

                            <div className="p-4 flex flex-col gap-2 flex-1">
                                {item.brand && (
                                    <p className="text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">{item.brand}</p>
                                )}
                                <Link href={`/produse/${item.productSlug}/${item.variantSlug}`}>
                                    <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 hover:text-gray-600 dark:hover:text-gray-400 transition-colors line-clamp-2">
                                        {item.name}
                                    </h3>
                                </Link>
                                <div className="flex items-center justify-between mt-auto pt-2">
                                    {item.discountedPrice != null ? (
                                        <div className="flex flex-col gap-0.5">
                                            <span className="font-bold text-orange-600 dark:text-orange-400">{item.discountedPrice.toFixed(2)} lei</span>
                                            <span className="text-xs text-gray-400 line-through">{item.price.toFixed(2)} lei</span>
                                        </div>
                                    ) : (
                                        <span className="font-bold text-gray-900 dark:text-gray-100">{item.price.toFixed(2)} lei</span>
                                    )}
                                    <button
                                        onClick={() => removeItem(item.favoriteItemId, item.productVariantId)}
                                        className="flex items-center justify-center w-8 h-8 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-red-50 dark:hover:bg-red-950 hover:border-red-200 dark:hover:border-red-800 transition-colors group"
                                        aria-label="Elimină de la favorite"
                                    >
                                        <Trash2 size={14} className="text-gray-400 dark:text-gray-500 group-hover:text-red-500 transition-colors" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
