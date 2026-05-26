const BASE = process.env.NEXT_PUBLIC_API_URL;

function authHeaders(token: string) {
    return { "Content-Type": "application/json", Authorization: `Bearer ${token}` };
}

// ── Orders ──────────────────────────────────────────────────
export interface OrderItemAdmin {
    productVariantId: string;
    quantity: number;
    price: number;
    total: number;
    productName: string;
    variantSlug: string;
    productSlug: string;
}

export type OrderStatus = "Pending" | "Confirmed" | "Shipped" | "Delivered" | "Cancelled";

export interface OrderAdmin {
    orderId: string;
    totalAmount: number;
    status: OrderStatus;
    items: OrderItemAdmin[];
    isPaid: boolean;
    createdAt: string;
    awbNumber?: string;
    carrierName?: string;
    trackingUrl?: string;
}

export type RevenueGranularity = "Hour" | "Day" | "Week" | "Month" | "Year";

export interface RevenuePoint {
    label: string;
    revenue: number;
    orderCount: number;
}

export interface TopVariantPoint {
    variantId: string;
    productName: string;
    variantSlug: string;
    productSlug: string;
    revenue: number;
    quantitySold: number;
    orderCount: number;
}

export interface MonthlyProductSalesRow {
    variantId: string;
    productName: string;
    variantSlug: string;
    monthlyRevenue: number[];
    monthlyQuantity: number[];
    totalRevenue: number;
    totalQuantity: number;
}

export interface MonthlyProductSales {
    monthLabels: string[];
    rows: MonthlyProductSalesRow[];
}

export async function adminGetMonthlyProductSales(
    token: string,
    months: number = 12,
    top: number = 5,
): Promise<MonthlyProductSales> {
    const res = await fetch(
        `${BASE}/api/order/admin/monthly-product-sales?months=${months}&top=${top}`,
        { headers: authHeaders(token), cache: "no-store" },
    );
    if (!res.ok) throw new Error("Failed to fetch monthly product sales");
    return res.json();
}

export async function adminGetTopSellingVariants(
    token: string,
    top: number = 10,
    days: number = 0,
): Promise<TopVariantPoint[]> {
    const qs = new URLSearchParams({ top: String(top) });
    if (days > 0) qs.set("days", String(days));
    const res = await fetch(`${BASE}/api/order/admin/top-variants?${qs}`, {
        headers: authHeaders(token), cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch top selling variants");
    return res.json();
}

export async function adminGetRevenueStats(token: string, granularity: RevenueGranularity): Promise<RevenuePoint[]> {
    const res = await fetch(`${BASE}/api/order/admin/revenue?granularity=${granularity}`, {
        headers: authHeaders(token), cache: "no-store",
    });
    if (!res.ok) throw new Error("Failed to fetch revenue stats");
    return res.json();
}

export interface AdminOrdersPagedResult {
    items: OrderAdmin[];
    totalCount: number;
    page: number;
    pageSize: number;
    totalPages: number;
}

export async function adminGetOrders(
    token: string,
    params?: { status?: OrderStatus; isPaid?: boolean; page?: number; pageSize?: number }
): Promise<AdminOrdersPagedResult> {
    const qs = new URLSearchParams();
    if (params?.status !== undefined) qs.set("orderStatus", params.status);
    if (params?.isPaid !== undefined) qs.set("isPaid", String(params.isPaid));
    qs.set("page", String(Math.max(1, params?.page ?? 1)));
    qs.set("pageSize", String(Math.min(50, Math.max(1, params?.pageSize ?? 20))));
    const res = await fetch(`${BASE}/api/order/admin?${qs}`, { headers: authHeaders(token), cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch orders");
    return res.json();
}

export async function adminUpdateOrderStatus(token: string, orderId: string, newStatus: OrderStatus): Promise<void> {
    const res = await fetch(`${BASE}/api/order/${orderId}/status`, {
        method: "PUT", headers: authHeaders(token),
        body: JSON.stringify({ newStatus }),
    });
    if (!res.ok) throw new Error("Failed to update order status");
}

export async function adminDispatchOrder(token: string, orderId: string): Promise<{ awbNumber: string; carrierName: string }> {
    const res = await fetch(`${BASE}/api/order/admin/${orderId}/dispatch`, {
        method: "PUT", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to dispatch order");
    return res.json();
}

export async function adminCancelOrder(token: string, orderId: string): Promise<void> {
    const res = await fetch(`${BASE}/api/order/admin/${orderId}/cancel`, {
        method: "PUT", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to cancel order");
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

export async function adminDeleteCategoriesBatch(token: string, categoryIds: string[]) {
    const res = await fetch(`${BASE}/api/categories/batch`, {
        method: "DELETE", headers: authHeaders(token),
        body: JSON.stringify({ categoryIds }),
    });
    if (!res.ok) throw new Error("Batch delete failed");
}

export async function adminDeleteCategory(token: string, categoryId: string) {
    const res = await fetch(`${BASE}/api/categories/${categoryId}`, {
        method: "DELETE", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete category");
}

export interface CategoryImportRow { name: string; slug: string; }
export interface CategoryImportResult {
    created: number;
    errors: { row: number; message: string }[];
}

export async function adminImportCategories(token: string, rows: CategoryImportRow[]): Promise<CategoryImportResult> {
    const res = await fetch(`${BASE}/api/categories/import`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ rows }),
    });
    if (!res.ok) throw new Error("Import failed");
    return res.json();
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

export async function adminDeleteProductsBatch(token: string, productIds: string[]) {
    const res = await fetch(`${BASE}/api/products/batch`, {
        method: "DELETE", headers: authHeaders(token),
        body: JSON.stringify({ productIds }),
    });
    if (!res.ok) throw new Error("Batch delete failed");
}

export async function adminDeleteProduct(token: string, productId: string) {
    const res = await fetch(`${BASE}/api/products/${productId}`, {
        method: "DELETE", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete product");
}

export interface ProductImportRow { name: string; slug: string; description: string; categorySlug: string; }
export interface ProductImportResult {
    created: number;
    errors: { row: number; message: string }[];
}

export async function adminImportProducts(token: string, rows: ProductImportRow[]): Promise<ProductImportResult> {
    const res = await fetch(`${BASE}/api/products/import`, {
        method: "POST",
        headers: authHeaders(token),
        body: JSON.stringify({ rows }),
    });
    if (!res.ok) throw new Error("Import failed");
    return res.json();
}

// ── Measurement Units ──────────────────────────────────────────────
export interface MeasurementUnit {
    unitId: string;
    name: string;
    symbol: string;
    measures: string;
    isSystem: boolean;
    usageCount: number;
}

export async function adminGetMeasurementUnits(token: string): Promise<MeasurementUnit[]> {
    const res = await fetch(`${BASE}/api/measurement-units`, { headers: authHeaders(token), cache: "no-store" });
    if (!res.ok) throw new Error("Failed to fetch measurement units");
    return res.json();
}

export async function adminCreateMeasurementUnit(token: string, data: { name: string; symbol: string; measures: string }): Promise<{ id: string }> {
    const res = await fetch(`${BASE}/api/measurement-units`, {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create measurement unit");
    return res.json();
}

export async function adminUpdateMeasurementUnit(token: string, unitId: string, data: { name: string; symbol: string; measures: string }): Promise<void> {
    const res = await fetch(`${BASE}/api/measurement-units/${unitId}`, {
        method: "PUT", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to update measurement unit");
}

export async function adminDeleteMeasurementUnit(token: string, unitId: string): Promise<void> {
    const res = await fetch(`${BASE}/api/measurement-units/${unitId}`, {
        method: "DELETE", headers: authHeaders(token),
    });
    if (!res.ok) throw new Error("Failed to delete measurement unit");
}

// ── Images ──────────────────────────────────────────────
export async function adminUploadImage(token: string, file: File): Promise<{ url: string }> {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${BASE}/api/images/upload`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
    });
    if (!res.ok) throw new Error("Failed to upload image");
    return res.json();
}

// ── Variants ──────────────────────────────────────────────
export interface VariantAttribute { name: string; value: string; unitId?: string; }

export async function adminGetVariants(token: string, productId?: string) {
    const all: unknown[] = [];
    let page = 1;
    while (true) {
        const params = new URLSearchParams({ pageSize: "100", page: String(page) });
        if (productId) params.set("productId", productId);
        const res = await fetch(`${BASE}/api/variants?${params}`, { headers: authHeaders(token), cache: "no-store" });
        if (!res.ok) throw new Error("Failed to fetch variants");
        const data = await res.json();
        const items: unknown[] = data.items ?? [];
        all.push(...items);
        if (all.length >= data.totalCount || items.length < 100) break;
        page++;
    }
    return all;
}

export async function adminCreateVariant(token: string, data: {
    productId: string; sku: string; name: string; price: number; description: string;
    brand: string; quantity: number; variantAttributes: VariantAttribute[]; imageUrls: string[];
}) {
    const res = await fetch(`${BASE}/api/variants`, {
        method: "POST", headers: authHeaders(token), body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Failed to create variant");
    return res.json();
}

export async function adminUpdateVariant(token: string, variantId: string, data: {
    productId: string; sku: string; name: string; price: number; quantity: number;
    variantAttributes: VariantAttribute[]; imageUrls: string[]; isActive: boolean;
    discountedPrice?: number | null;
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

export async function adminDeleteVariantsBatch(token: string, variantIds: string[]) {
    const res = await fetch(`${BASE}/api/variants/batch`, {
        method: "DELETE", headers: authHeaders(token),
        body: JSON.stringify({ variantIds }),
    });
    if (!res.ok) throw new Error("Batch delete failed");
}
