"use client";

import Link from "next/link";
import Image from "next/image";
import { Star, ShoppingCart } from "lucide-react";
import { ProductVariant } from "@/types/product";
import FavoriteButton from "./FavoriteButton";
import { useCart } from "@/context/CartContext";

const MAX_VISIBLE_ATTRS = 2;

export default function VariantCard({ variant, productSlug }: { variant: ProductVariant, productSlug: string }) {
    const { addItem } = useCart();
    const isOutOfStock = variant.stockQuantity === 0;
    const attributeEntries = Object.entries(variant.attributes ?? {});
    const visibleAttrs = attributeEntries.slice(0, MAX_VISIBLE_ATTRS);
    const hiddenCount = attributeEntries.length - MAX_VISIBLE_ATTRS;
    const imageUrl = variant.primaryImageUrl ?? null;

    return (
        <div className="bg-white rounded-xl shadow-sm hover:shadow-md transition-shadow flex flex-col h-full">

            {/* Image */}
            <Link href={`/products/${productSlug}/${variant.variantSlug}`} className="rounded-t-xl overflow-hidden block">
                <div className="relative aspect-square bg-gray-100">
                    {imageUrl ? (
                        <Image
                            src={imageUrl}
                            alt={variant.name || "Product image"}
                            fill
                            className="object-cover hover:scale-105 transition-transform duration-300"
                        />
                    ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                    )}
                    {isOutOfStock && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                            <span className="text-white font-semibold text-sm">Stoc epuizat</span>
                        </div>
                    )}
                </div>
            </Link>

            {/* Info — flex-col so price row always sticks to bottom */}
            <div className="p-4 flex flex-col gap-2 flex-1">

                {variant.brand && (
                    <p className="text-xs text-gray-400 uppercase tracking-wide">{variant.brand}</p>
                )}

                <Link href={`/products/${productSlug}/${variant.variantSlug}`}>
                    <h3 className="font-semibold text-gray-900 hover:text-gray-600 transition-colors line-clamp-2 text-sm leading-snug">
                        {variant.name}
                    </h3>
                </Link>

                {/* Attributes — max 2 pills + overflow count */}
                <div className="flex flex-wrap gap-1 min-h-[48px] content-start">
                    {attributeEntries.length > 0 && visibleAttrs.map(([name, value]) => (
                        <span
                            key={name}
                            className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full h-fit"
                        >
                            {name}: {value}
                        </span>
                    ))}
                    {hiddenCount > 0 && (
                        <Link
                            href={`/products/${productSlug}/${variant.variantSlug}`}
                            className="text-xs bg-gray-200 text-gray-500 px-2 py-0.5 rounded-full hover:bg-gray-300 transition-colors h-fit"
                        >
                            +{hiddenCount} mai multe
                        </Link>
                    )}
                </div>

                {/* Rating */}
                <div className="flex items-center gap-1">
                    <Star size={13} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-xs font-medium text-gray-600">
                        {(variant.averageRating ?? 0).toFixed(1)}
                    </span>
                </div>

                {/* Price + actions — mt-auto keeps this glued to the bottom */}
                <div className="flex items-center justify-between mt-auto pt-2">
                    <span className="font-bold text-gray-900">${variant.price.toFixed(2)}</span>
                    <div className="flex items-center gap-1.5">
                        <FavoriteButton variantId={variant.variantId} />
                        <div className="relative group/cart">
                            <button
                                disabled={isOutOfStock}
                                onClick={() => addItem({
                                    variantId: variant.variantId,
                                    variantSlug: variant.variantSlug,
                                    productSlug: variant.productSlug,
                                    name: variant.name,
                                    brand: variant.brand,
                                    price: variant.price,
                                    primaryImageUrl: variant.primaryImageUrl,
                                    stockQuantity: variant.stockQuantity,
                                })}
                                className="flex items-center justify-center w-9 h-9 bg-gray-800 text-white rounded-lg hover:bg-gray-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
                            >
                                <ShoppingCart size={16} />
                            </button>
                            <span className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-2 whitespace-nowrap rounded bg-gray-800 px-2 py-1 text-xs text-white opacity-0 transition-opacity group-hover/cart:opacity-100">
                                {isOutOfStock ? "Stoc epuizat" : "Adaugă în coș"}
                            </span>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
}
