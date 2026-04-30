const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string) {
    return {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    };
}

// ── Products ──────────────────────────────────────────────

export async function adminGetProducts(token: string) {
    const res = await fetch(`${BASE}/api/products`, {
        headers: authHeaders(token),
        cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch products");
    return res.json();
}

export async function adminCreateProduct(token: string, data: {
    name: string;
    description: string;
    brand: string;
    categoryId: string;
}) {
    const res = await fetch(`${BASE}/api/seller/products`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create product");
    return res.json();
}

export async function adminUpdateProduct(token: string, productId: string, data: {
    name: string;
    description: string;
    brand: string;
    categoryId: string;
    isActive: boolean;
    isShippable: boolean;
    isDigital: boolean;
    isReturnable: boolean;
}) {
    const res = await fetch(`${BASE}/api/seller/products/${productId}`, {
        method: "PUT",
        headers: authHeaders(token),
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update product");
}

export async function adminDeleteProduct(token: string, productId: string) {
    const res = await fetch(`${BASE}/api/seller/products/${productId}`, {
        method: "DELETE",
        headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete product");
}
