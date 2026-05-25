import type { Metadata } from "next";
import Link from "next/link";
import { Star, ChevronRight, Package } from "lucide-react";
import { getVariantDetail } from "@/lib/api/products";
import ImageGallery from "@/components/products/ImageGallery";
import AddToCartButton from "@/components/products/AddToCartButton";
import ReviewForm from "@/components/products/ReviewForm";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cnashop.ro";

interface VariantDetailPageProps {
    params: Promise<{ productSlug: string; variantSlug: string }>;
}

function slugToTitle(slug: string): string {
    return slug.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
}

export async function generateMetadata({ params }: VariantDetailPageProps): Promise<Metadata> {
    const { productSlug, variantSlug } = await params;
    try {
        const variant = await getVariantDetail(productSlug, variantSlug);
        const image = variant.imageUrls?.[0];
        return {
            title: variant.name,
            description: variant.description
                ? variant.description.slice(0, 155)
                : `Cumpără ${variant.name} de la CNA Shop. Preț: ${(variant.discountedPrice ?? variant.price).toFixed(2)} lei.`,
            openGraph: {
                title: variant.name,
                description: variant.description?.slice(0, 155) ?? `${variant.name} – ${(variant.discountedPrice ?? variant.price).toFixed(2)} lei`,
                images: image ? [{ url: image, alt: variant.name }] : [],
                url: `${SITE_URL}/produse/${productSlug}/${variantSlug}`,
                type: "website",
            },
            alternates: { canonical: `/produse/${productSlug}/${variantSlug}` },
        };
    } catch {
        return { title: slugToTitle(variantSlug) };
    }
}

export default async function VariantDetailPage({ params }: VariantDetailPageProps) {
    const { productSlug, variantSlug } = await params;
    const variant = await getVariantDetail(productSlug, variantSlug);

    const isOutOfStock = variant.stockQuantity === 0;
    const attributeEntries = Object.entries(variant.attributes ?? {});

    const productJsonLd = {
        "@context": "https://schema.org",
        "@type": "Product",
        name: variant.name,
        description: variant.description ?? undefined,
        sku: variant.sku,
        image: variant.imageUrls ?? [],
        brand: variant.brand ? { "@type": "Brand", name: variant.brand } : undefined,
        offers: {
            "@type": "Offer",
            price: variant.discountedPrice ?? variant.price,
            priceCurrency: "RON",
            availability: isOutOfStock
                ? "https://schema.org/OutOfStock"
                : "https://schema.org/InStock",
            url: `${SITE_URL}/produse/${productSlug}/${variantSlug}`,
            seller: { "@type": "Organization", name: "CNA Shop", url: SITE_URL },
        },
        ...(variant.reviews.length > 0 && {
            aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: (variant.averageRating ?? 0).toFixed(1),
                reviewCount: variant.reviews.length,
                bestRating: 5,
                worstRating: 1,
            },
            review: variant.reviews.map((r) => ({
                "@type": "Review",
                reviewRating: { "@type": "Rating", ratingValue: r.rating, bestRating: 5, worstRating: 1 },
                author: { "@type": "Person", name: r.userName },
                ...(r.comment && { reviewBody: r.comment }),
                datePublished: r.createdAt.split("T")[0],
            })),
        }),
    };

    const breadcrumbJsonLd = {
        "@context": "https://schema.org",
        "@type": "BreadcrumbList",
        itemListElement: [
            { "@type": "ListItem", position: 1, name: "Acasă", item: SITE_URL },
            { "@type": "ListItem", position: 2, name: "Produse", item: `${SITE_URL}/produse` },
            { "@type": "ListItem", position: 3, name: slugToTitle(productSlug), item: `${SITE_URL}/produse/${productSlug}` },
            { "@type": "ListItem", position: 4, name: variant.name, item: `${SITE_URL}/produse/${productSlug}/${variantSlug}` },
        ],
    };

    return (
        <div className="flex flex-col gap-12">
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }} />
            <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }} />

            {/* Breadcrumb */}
            <div className="flex items-center gap-2 text-sm text-gray-500">
                <Link href="/" className="hover:text-gray-900 transition-colors">Acasă</Link>
                <ChevronRight size={14} />
                <Link href="/produse" className="hover:text-gray-900 transition-colors">Produse</Link>
                <ChevronRight size={14} />
                <Link href={`/produse/${productSlug}`} className="hover:text-gray-900 transition-colors">
                    {slugToTitle(productSlug)}
                </Link>
                <ChevronRight size={14} />
                <span className="text-gray-900 font-medium">{variant.name}</span>
            </div>

            {/* Main content */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

                {/* Image */}
                <ImageGallery imageUrls={variant.imageUrls ?? []} name={variant.name} />

                {/* Details */}
                <div className="flex flex-col gap-6">

                    {/* Brand + Name */}
                    {variant.brand && (
                        <p className="text-sm font-semibold text-gray-500 uppercase tracking-widest">
                            {variant.brand}
                        </p>
                    )}
                    <h1 className="text-4xl font-bold text-gray-900 dark:text-gray-100">{variant.name}</h1>

                    {/* Rating */}
                    <div className="flex items-center gap-2">
                        <div className="flex items-center gap-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <Star
                                    key={star}
                                    size={18}
                                    className={star <= Math.round(variant.averageRating ?? 0)
                                        ? "fill-yellow-400 text-yellow-400"
                                        : "text-gray-300"
                                    }
                                />
                            ))}
                        </div>
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            {(variant.averageRating ?? 0).toFixed(1)}
                        </span>
                        <span className="text-sm text-gray-400 dark:text-gray-500">({variant.reviews.length} recenzii)</span>
                    </div>

                    {/* Price */}
                    {variant.discountedPrice != null ? (
                        <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-3">
                                <span className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                                    {variant.discountedPrice.toFixed(2)} lei
                                </span>
                                <span className="bg-orange-500 text-white text-sm font-bold px-2.5 py-1 rounded-full">
                                    -{Math.round((1 - variant.discountedPrice / variant.price) * 100)}%
                                </span>
                            </div>
                            <span className="text-lg text-gray-400 line-through">
                                {variant.price.toFixed(2)} lei
                            </span>
                        </div>
                    ) : (
                        <div className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                            {variant.price.toFixed(2)} lei
                        </div>
                    )}

                    {/* Attributes */}
                    {attributeEntries.length > 0 && (
                        <div className="flex flex-col gap-3">
                            {attributeEntries.map(([name, value]) => (
                                <div key={name} className="flex items-center gap-3">
                                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300 w-16">{name}</span>
                                    <span className="bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-3 py-1 rounded-full text-sm">
                                        {value}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}

                    {/* Stock */}
                    <div className="flex items-center gap-2">
                        <Package size={16} className={isOutOfStock ? "text-red-500" : "text-green-500"} />
                        <span className={`text-sm font-medium ${isOutOfStock ? "text-red-500" : "text-green-500"}`}>
                            {isOutOfStock ? "Stoc epuizat" : `${variant.stockQuantity} în stoc`}
                        </span>
                    </div>

                    {/* Description */}
                    {variant.description && (
                        <p className="text-gray-600 dark:text-gray-400 leading-relaxed">{variant.description}</p>
                    )}

                    {/* Actions */}
                    <div className="flex gap-3 mt-2">
                        <AddToCartButton variant={variant} />
                    </div>

                </div>
            </div>

            {/* Reviews */}
            <div className="flex flex-col gap-6">

                {/* Header */}
                <div className="flex items-center justify-between">
                    <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Recenzii</h2>
                    {variant.reviews.length > 0 && (
                        <div className="flex items-center gap-2">
                            <div className="flex items-center gap-0.5">
                                {[1, 2, 3, 4, 5].map(star => (
                                    <Star
                                        key={star}
                                        size={15}
                                        className={star <= Math.round(variant.averageRating ?? 0)
                                            ? "fill-yellow-400 text-yellow-400"
                                            : "text-gray-200 dark:text-gray-700"
                                        }
                                    />
                                ))}
                            </div>
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                {(variant.averageRating ?? 0).toFixed(1)}
                            </span>
                            <span className="text-sm text-gray-400 dark:text-gray-500">
                                ({variant.reviews.length} {variant.reviews.length === 1 ? "recenzie" : "recenzii"})
                            </span>
                        </div>
                    )}
                </div>

                {/* Submit form */}
                <ReviewForm variantId={variant.variantId} existingReviews={variant.reviews} />

                {/* List */}
                {variant.reviews.length > 0 ? (
                    <div className="flex flex-col gap-4">
                        {variant.reviews.map((review) => (
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
                                    <span className="text-sm text-gray-400 dark:text-gray-500">
                                        {new Date(review.createdAt).toLocaleDateString("ro-RO")}
                                    </span>
                                </div>
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
                            </div>
                        ))}
                    </div>
                ) : (
                    <p className="text-sm text-gray-400 dark:text-gray-500 text-center py-4">
                        Nicio recenzie încă. Fii primul care recenzează acest produs.
                    </p>
                )}

            </div>

        </div>
    );
}
