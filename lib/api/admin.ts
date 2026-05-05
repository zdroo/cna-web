const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ── Categories ──────────────────────────────────────────────
export async function adminGetCategories(token: string) {
    const res = await fetch(`${BASE}/api/categories`, { headers: authHeaders(token), cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch categories");
    return res.json();
}

export async function adminCreateCategory(token: string, data: { name: string; slug: string }) {
    const res = await fetch(`${BASE}/api/categories`, {
        method: "POST", headers: authHeaders(token), body: JSON.stringify({ ...data, parentCategoryId: null }),
    });
    if (!res.ok) throw new Error("Failed to create category");
    return res.json();
}

export async function adminUpdateCategory(token: string, categoryId: string, data: { name: string; slug: string }) {
    const res = await fetch(`${BASE}/api/categories/${categoryId}`, {
        method: "PUT", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update category");
}

export async function adminDeleteCategory(token: string, categoryId: string) {
    const res = await fetch(`${BASE}/api/categories/${categoryId}`, {
        method: "DELETE", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete category");
}

// ── Products ──────────────────────────────────────────────
export async function adminGetProducts(token: string) {
    const res = await fetch(`${BASE}/api/products`, { headers: authHeaders(token), cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
}

export async function adminGetProductById(token: string, productId: string) {
    const res = await fetch(`${BASE}/api/products/${productId}`, { headers: authHeaders(token), cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch product");
    return res.json();
}

export async function adminCreateProduct(token: string, data: {
    name: string; description: string; brand: string; categoryId: string;
}) {
    const res = await fetch(`${BASE}/api/products`, {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
}

export async function adminUpdateProduct(token: string, productId: string, data: {
    name: string; description: string; brand: string; categoryId: string;
    isActive: boolean; isShippable: boolean; isDigital: boolean; isReturnable: boolean;
}) {
    const res = await fetch(`${BASE}/api/products/${productId}`, {
        method: "PUT", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update product");
}

export async function adminDeleteProduct(token: string, productId: string) {
    const res = await fetch(`${BASE}/api/products/${productId}`, {
        method: "DELETE", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete product");
}

// ── Variants ──────────────────────────────────────────────
export interface VariantAttribute { name: string; value: string; }

export async function adminGetVariants(token: string, productId?: string) {
    const url = productId
        ? `${BASE}/api/variants?productId=${productId}`
        : `${BASE}/api/variants`;
    const res = await fetch(url, { headers: authHeaders(token), cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch variants");
    return res.json();
}

export async function adminCreateVariant(token: string, data: {
    productId: string; sku: string; price: number; description: string;
    brand: string; quantity: number; variantAttributes: VariantAttribute[];
}) {
    const res = await fetch(`${BASE}/api/variants`, {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create variant");
    return res.json();
}

export async function adminUpdateVariant(token: string, variantId: string, data: {
    productId: string; sku: string; name: string; price: number; quantity: number;
    variantAttributes: VariantAttribute[]; isActive: boolean;
}) {
    const res = await fetch(`${BASE}/api/variants/${variantId}`, {
        method: "PUT", headers: authHeaders(token), body: JSON.stringify({ ...data, variantId }),
    });
    if (!res.ok) throw new Error("Failed to update variant");
}

export async function adminDeleteVariant(token: string, variantId: string) {
    const res = await fetch(`${BASE}/api/variants/${variantId}`, {
        method: "DELETE", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete variant");
}
