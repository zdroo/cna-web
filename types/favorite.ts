export interface FavoriteItem {
    favoriteItemId: string;
    productVariantId: string;
    variantSlug: string;
    productSlug: string;
    name: string;
    brand: string | null;
    price: number;
    discountedPrice: number | null;
    primaryImageUrl: string | null;
    stockQuantity: number;
}
