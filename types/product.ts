export interface ProductSummary {
    productSlug: string;
    productId: string;
    categoryId: string;
    categoryName: string;
    name: string;
    description: string;
    imageUrl: string;
    minPrice: number;
    maxPrice: number;
    averageRating: number | null;
    reviewsCount: number;
}

export interface ProductVariant {
    variantId: string;
    variantSlug: string;
    productSlug: string;
    productId: string;
    categoryId: string;
    categoryName: string;
    productName: string;
    sku: string;
    name: string;
    brand: string | null;
    description: string | null;
    price: number;
    stockQuantity: number;
    averageRating: number | null;
    primaryImageUrl: string | null;
    imageUrls: string[];
    attributes: Record<string, string>;
}

export interface ProductVariantDetail {
    variantId: string;
    variantSlug: string;
    productSlug: string;
    productId: string;
    categoryId: string;
    categoryName: string;
    productName: string;
    sku: string;
    name: string;
    brand: string | null;
    description: string | null;
    price: number;
    stockQuantity: number;
    averageRating: number | null;
    primaryImageUrl: string | null;
    imageUrls: string[];
    attributes: Record<string, string>;
    reviews: Review[];
}

export interface Review {
    reviewId: string;
    userId: string;
    userName: string;
    rating: number;
    comment: string | null;
    createdAt: string;
}

export interface VariantsFilter {
    searchText?: string;
    categoryId?: string;
    brand?: string;
    onlyActive?: boolean;
    onlyInStock?: boolean;
    featured?: boolean;
}
