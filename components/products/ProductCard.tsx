import Link from "next/link";
import Image from "next/image";
import { Star } from "lucide-react";
import { ProductSummary } from "@/types/product";

export default function ProductCard({ product }: { product: ProductSummary }) {
    return (
        <Link
            href={`/produse/${product.productSlug}`}
            className="group bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow dark:border dark:border-gray-800"
        >
            {/* Image */}
            <div className="relative aspect-square overflow-hidden bg-gray-100 dark:bg-gray-800">
                {product.imageUrl ? (
                    <Image
                        src={product.imageUrl}
                        alt={product.name ?? ""}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                ) : (
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-200 to-gray-300" />
                )}
            </div>

            {/* Info */}
            <div className="p-4 flex flex-col gap-2">
                <p className="text-sm text-gray-500 dark:text-gray-400">{product.categoryName}</p>
                <h3 className="font-semibold text-gray-900 dark:text-gray-100 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                    {product.name}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">{product.description}</p>

                {/* Rating */}
                <div className="flex items-center gap-1">
                    <Star size={14} className="fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {(product.averageRating ?? 0).toFixed(1)}
                    </span>
                    <span className="text-sm text-gray-400 dark:text-gray-500">({product.reviewsCount})</span>
                </div>

                {/* Price */}
                <div className="mt-1">
                    {product.minPrice === product.maxPrice ? (
                        <span className="font-bold text-gray-900 dark:text-gray-100">{product.minPrice.toFixed(2)} lei</span>
                    ) : (
                        <span className="font-bold text-gray-900 dark:text-gray-100">
                            {product.minPrice.toFixed(2)} – {product.maxPrice.toFixed(2)} lei
                        </span>
                    )}
                </div>
            </div>
        </Link>
    );
}
