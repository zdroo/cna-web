export interface CartItem {
    cartItemId: string;
    variantId: string;
    variantSlug: string;
    productSlug: string;
    name: string;
    brand: string | null;
    price: number;
    quantity: number;
    primaryImageUrl: string | null;
    stockQuantity: number;
}
