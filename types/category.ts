import { ProductSummary } from "./product";

export interface Category {
    categoryId: string;
    name: string;
    slug: string;
    isActive: boolean;
    imageUrl: string | null;
}

export interface CategoryWithProducts extends Category {
    products: ProductSummary[];
}
