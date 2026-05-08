import { ProductSummary, ProductVariant, ProductVariantDetail, VariantsFilter } from "@/types/product";

export async function getProducts(category?: string): Promise<ProductSummary[]> {
    const params = new URLSearchParams();
    if (category) params.append("category", category);

    const queryString = params.toString();
    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/products${queryString ? `?${queryString}` : ""}`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok)
        throw new Error("Failed to fetch products");

    return response.json();
}

export async function getProductVariants(productSlug: string): Promise<ProductVariant[]> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productSlug}/variants`,
        { cache: "no-store" }
    );

    if (!response.ok)
        throw new Error("Failed to fetch variants");

    return response.json();
}

export async function getVariantsFiltered(filter: VariantsFilter = {}): Promise<ProductVariant[]> {
    const params = new URLSearchParams();

    if (filter.searchText) params.append("searchText", filter.searchText);
    if (filter.categoryId) params.append("categoryId", filter.categoryId);
    if (filter.productId) params.append("productId", filter.productId);
    if (filter.brand) params.append("brand", filter.brand);
    if (filter.onlyActive) params.append("onlyActive", "true");
    if (filter.onlyInStock) params.append("onlyInStock", "true");
    if (filter.featured) params.append("featured", "true");
    params.append("pageSize", "200");

    const url = `${process.env.NEXT_PUBLIC_API_URL}/api/products/variants-filtered?${params.toString()}`;

    const response = await fetch(url, { cache: "no-store" });

    if (!response.ok)
        throw new Error("Failed to fetch variants");

    return response.json();
}

export async function getVariantDetail(productSlug: string, variantSlug: string): Promise<ProductVariantDetail> {
    const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/products/${productSlug}/${variantSlug}`,
        { cache: "no-store" }
    );

    if (!response.ok)
        throw new Error("Failed to fetch variant detail");

    return response.json();
}
