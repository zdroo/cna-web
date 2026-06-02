"use client";

import { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { getCategoriesWithProducts } from "@/lib/api/categories";
import { getVariantsFiltered } from "@/lib/api/products";
import VariantCard from "@/components/products/VariantCard";
import { CategoryWithProducts } from "@/types/category";
import { ProductSummary, ProductVariant } from "@/types/product";
import { SlidersHorizontal, ArrowUpDown, ChevronDown, ChevronLeft, ChevronRight, X } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";

// ─── types ────────────────────────────────────────────────────────────────────

type SortOption = "relevant" | "price-asc" | "price-desc" | "name-asc" | "name-desc" | "rating" | "reviews-count";

const SORT_LABELS: Record<SortOption, string> = {
    relevant:        "Relevanță",
    "price-asc":     "Preț: crescător",
    "price-desc":    "Preț: descrescător",
    "name-asc":      "Nume: A–Z",
    "name-desc":     "Nume: Z–A",
    "rating":        "Cel mai bun rating",
    "reviews-count": "Cele mai multe recenzii",
};

const SORT_TO_API: Record<SortOption, string | undefined> = {
    relevant:        undefined,
    "price-asc":     "PriceAsc",
    "price-desc":    "PriceDesc",
    "name-asc":      "NameAsc",
    "name-desc":     "NameDesc",
    "rating":        "Rating",
    "reviews-count": "ReviewsCount",
};

interface AttrMeta {
    name: string;
    values: string[];
    isNumeric: boolean;
    absMin: number;
    absMax: number;
}

// ─── helpers ──────────────────────────────────────────────────────────────────

function extractAttrs(variants: ProductVariant[]): AttrMeta[] {
    const map: Record<string, Set<string>> = {};
    for (const v of variants) {
        for (const [k, val] of Object.entries(v.attributes ?? {})) {
            if (!map[k]) map[k] = new Set();
            map[k].add(val);
        }
    }
    return Object.entries(map).map(([name, set]) => {
        const values = [...set].sort((a, b) => {
            const na = Number(a), nb = Number(b);
            return !isNaN(na) && !isNaN(nb) ? na - nb : a.localeCompare(b);
        });
        const isNumeric = values.length > 0 && values.every(v => !isNaN(parseFloat(v)) && isFinite(Number(v)));
        const nums = isNumeric ? values.map(Number) : [0];
        return { name, values, isNumeric, absMin: Math.min(...nums), absMax: Math.max(...nums) };
    });
}

// ─── small reusables ──────────────────────────────────────────────────────────

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                {title}
            </p>
            {children}
        </div>
    );
}

function Pill({ active, onClick, count, children }: { active: boolean; onClick: () => void; count?: number; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-colors ${
                active
                    ? "bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900 font-medium"
                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-500 dark:hover:border-gray-500"
            }`}
        >
            {children}
            {count !== undefined && (
                <span className={`text-xs leading-none tabular-nums translate-y-px ${active ? "opacity-60" : "text-gray-400 dark:text-gray-500"}`}>
                    {count}
                </span>
            )}
        </button>
    );
}

function ActiveChip({ label, onRemove }: { label: string; onRemove: () => void }) {
    return (
        <span className="flex items-center gap-1 px-2.5 py-1 rounded-full bg-gray-100 dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-300 select-none">
            {label}
            <button onClick={onRemove} className="ml-0.5 text-gray-400 hover:text-gray-700 dark:hover:text-gray-100">
                <X size={11} />
            </button>
        </span>
    );
}

function NumericRangeFilter({
    attr,
    value,
    onChange,
}: {
    attr: AttrMeta;
    value: [number, number];
    onChange: (r: [number, number]) => void;
}) {
    return (
        <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Min</span>
                <input
                    type="number"
                    value={value[0]}
                    min={attr.absMin}
                    max={value[1]}
                    onChange={e => onChange([Number(e.target.value), value[1]])}
                    className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500"
                />
            </div>
            <span className="text-gray-300 dark:text-gray-600">–</span>
            <div className="flex items-center gap-2">
                <span className="text-xs text-gray-400">Max</span>
                <input
                    type="number"
                    value={value[1]}
                    min={value[0]}
                    max={attr.absMax}
                    onChange={e => onChange([value[0], Number(e.target.value)])}
                    className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500"
                />
            </div>
        </div>
    );
}

// ─── pagination ────────────────────────────────────────────────────────────────

function Pagination({ page, totalPages, onChange }: { page: number; totalPages: number; onChange: (p: number) => void }) {
    if (totalPages <= 1) return null;

    const pages: (number | "...")[] = [];
    if (totalPages <= 7) {
        for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else if (page <= 4) {
        pages.push(1, 2, 3, 4, 5, "...", totalPages);
    } else if (page >= totalPages - 3) {
        pages.push(1, "...", totalPages - 4, totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
    } else {
        pages.push(1, "...", page - 1, page, page + 1, "...", totalPages);
    }

    return (
        <div className="flex items-center justify-center gap-1 mt-8">
            <button
                onClick={() => onChange(page - 1)}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Pagina anterioară"
            >
                <ChevronLeft size={16} />
            </button>
            {pages.map((p, i) =>
                p === "..." ? (
                    <span key={`e-${i}`} className="px-2 py-1 text-sm text-gray-400 dark:text-gray-500">…</span>
                ) : (
                    <button
                        key={p}
                        onClick={() => onChange(p as number)}
                        className={`min-w-[36px] h-9 px-2 rounded-lg border text-sm font-medium transition-colors ${
                            p === page
                                ? "bg-gray-900 dark:bg-gray-100 border-gray-900 dark:border-gray-100 text-white dark:text-gray-900"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                        }`}
                    >
                        {p}
                    </button>
                )
            )}
            <button
                onClick={() => onChange(page + 1)}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-400 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                aria-label="Pagina următoare"
            >
                <ChevronRight size={16} />
            </button>
        </div>
    );
}

// ─── filter overlay ───────────────────────────────────────────────────────────

interface OverlayProps {
    categories: CategoryWithProducts[];
    productsInCategory: ProductSummary[];
    attrMeta: AttrMeta[];
    variants: ProductVariant[];
    resultCount: number;
    selectedCategoryId: string;
    selectedProductSlug: string;
    onlyInStock: boolean;
    onlyDiscounted: boolean;
    minPrice?: number;
    maxPrice?: number;
    textAttrFilters: Record<string, string[]>;
    numAttrFilters: Record<string, [number, number]>;
    onCategorySelect: (id: string) => void;
    onProductSelect: (id: string) => void;
    onInStockChange: (v: boolean) => void;
    onDiscountedChange: (v: boolean) => void;
    onPriceChange: (min?: number, max?: number) => void;
    onTextAttrToggle: (name: string, value: string) => void;
    onNumRangeChange: (name: string, range: [number, number]) => void;
    onClearAll: () => void;
    onClose: () => void;
}

function FilterOverlay({
    categories,
    productsInCategory,
    attrMeta,
    variants,
    resultCount,
    selectedCategoryId,
    selectedProductSlug,
    onlyInStock,
    onlyDiscounted,
    minPrice,
    maxPrice,
    textAttrFilters,
    numAttrFilters,
    onCategorySelect,
    onProductSelect,
    onInStockChange,
    onDiscountedChange,
    onPriceChange,
    onTextAttrToggle,
    onNumRangeChange,
    onClearAll,
    onClose,
}: OverlayProps) {
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => { document.body.style.overflow = ""; };
    }, []);

    const [minInput, setMinInput] = useState<string>(minPrice !== undefined ? String(minPrice) : "");
    const [maxInput, setMaxInput] = useState<string>(maxPrice !== undefined ? String(maxPrice) : "");

    // Sync local price state if parent clears the filter (e.g. "Resetează tot")
    useEffect(() => { setMinInput(minPrice !== undefined ? String(minPrice) : ""); }, [minPrice]);
    useEffect(() => { setMaxInput(maxPrice !== undefined ? String(maxPrice) : ""); }, [maxPrice]);

    function flushPrice() {
        onPriceChange(
            minInput !== "" ? Number(minInput) : undefined,
            maxInput !== "" ? Number(maxInput) : undefined,
        );
    }

    const showAttributes = !!selectedProductSlug && attrMeta.length > 0;

    const attrValueCounts = useMemo(() => {
        const result: Record<string, Record<string, number>> = {};
        for (const attr of attrMeta) {
            if (attr.isNumeric) continue;
            result[attr.name] = {};
            for (const v of attr.values) {
                result[attr.name][v] = variants.filter(variant => {
                    for (const [key, selected] of Object.entries(textAttrFilters)) {
                        if (key === attr.name) continue;
                        if (!selected.length) continue;
                        if (!selected.includes(variant.attributes?.[key])) return false;
                    }
                    for (const [key, [mn, mx]] of Object.entries(numAttrFilters)) {
                        const num = parseFloat(variant.attributes?.[key]);
                        if (isNaN(num) || num < mn || num > mx) return false;
                    }
                    return variant.attributes?.[attr.name] === v;
                }).length;
            }
        }
        return result;
    }, [variants, attrMeta, textAttrFilters, numAttrFilters]);

    return (
        <div className="fixed inset-0 z-50 flex flex-col bg-white dark:bg-gray-950">

            {/* Header */}
            <div className="shrink-0 flex items-center justify-between px-8 h-14 border-b border-gray-200 dark:border-gray-800">
                <span className="text-base font-bold text-gray-900 dark:text-gray-100">Filtre</span>
                <button
                    onClick={onClose}
                    className="p-2 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                    aria-label="Închide"
                >
                    <X size={18} />
                </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-8 py-8">
                <div className="max-w-5xl mx-auto space-y-10">

                    {/* ── Primary filters ── */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-10">

                        {/* Left column */}
                        <div className="space-y-7">

                            <FilterSection title="Disponibilitate">
                                <div className="flex flex-col gap-2">
                                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={onlyInStock}
                                            onChange={e => onInStockChange(e.target.checked)}
                                            className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">Doar în stoc</span>
                                    </label>
                                    <label className="inline-flex items-center gap-2.5 cursor-pointer select-none">
                                        <input
                                            type="checkbox"
                                            checked={onlyDiscounted}
                                            onChange={e => onDiscountedChange(e.target.checked)}
                                            className="w-4 h-4 rounded accent-orange-500 cursor-pointer"
                                        />
                                        <span className="text-sm text-gray-700 dark:text-gray-300">La reducere</span>
                                    </label>
                                </div>
                            </FilterSection>

                            <FilterSection title="Preț (RON)">
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Min</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={minInput}
                                            placeholder="0"
                                            onChange={e => setMinInput(e.target.value)}
                                            onBlur={flushPrice}
                                            className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500"
                                        />
                                    </div>
                                    <span className="text-gray-300 dark:text-gray-600">–</span>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-gray-400">Max</span>
                                        <input
                                            type="number"
                                            min={0}
                                            value={maxInput}
                                            placeholder="∞"
                                            onChange={e => setMaxInput(e.target.value)}
                                            onBlur={flushPrice}
                                            className="w-24 px-2 py-1.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 focus:outline-none focus:border-gray-500"
                                        />
                                    </div>
                                </div>
                            </FilterSection>

                            <FilterSection title="Categorie">
                                <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                                    {categories.map(c => (
                                        <button
                                            key={c.categoryId}
                                            onClick={() => onCategorySelect(selectedCategoryId === c.categoryId ? "" : c.categoryId)}
                                            className={`min-h-11 py-2.5 px-3 rounded-xl border text-sm font-medium leading-snug text-center transition-all ${
                                                selectedCategoryId === c.categoryId
                                                    ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                                                    : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-transparent"
                                            }`}
                                        >
                                            {c.name}
                                        </button>
                                    ))}
                                </div>
                            </FilterSection>
                        </div>

                        {/* Right column: Tip produs */}
                        <div>
                            {selectedCategoryId && productsInCategory.length > 0 ? (
                                <FilterSection title="Tip produs">
                                    <div className="grid gap-2" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(130px, 1fr))" }}>
                                        {productsInCategory.map(p => (
                                            <button
                                                key={p.productId}
                                                onClick={() => onProductSelect(selectedProductSlug === p.productSlug ? "" : p.productSlug)}
                                                className={`min-h-11 py-2.5 px-3 rounded-xl border text-sm font-medium leading-snug text-center transition-all ${
                                                    selectedProductSlug === p.productSlug
                                                        ? "bg-gray-900 dark:bg-white border-gray-900 dark:border-white text-white dark:text-gray-900"
                                                        : "border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500 bg-white dark:bg-transparent"
                                                }`}
                                            >
                                                {p.name}
                                            </button>
                                        ))}
                                    </div>
                                </FilterSection>
                            ) : (
                                <div className="h-full flex items-start pt-6">
                                    <p className="text-sm text-gray-300 dark:text-gray-600 italic">
                                        Selectează o categorie pentru a vedea tipurile de produs.
                                    </p>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* ── Attributes section (only when a product type is selected) ── */}
                    {showAttributes && (
                        <div className="space-y-8">

                            <div className="flex items-center gap-4">
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                                <span className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 px-1">
                                    Atribute
                                </span>
                                <div className="flex-1 h-px bg-gray-200 dark:bg-gray-800" />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                                {attrMeta.map(attr => (
                                    <FilterSection key={attr.name} title={attr.name}>
                                        {attr.isNumeric ? (
                                            <NumericRangeFilter
                                                attr={attr}
                                                value={numAttrFilters[attr.name] ?? [attr.absMin, attr.absMax]}
                                                onChange={range => onNumRangeChange(attr.name, range)}
                                            />
                                        ) : (
                                            <div className="flex flex-wrap gap-2">
                                                {attr.values.map(v => (
                                                    <Pill
                                                        key={v}
                                                        active={(textAttrFilters[attr.name] ?? []).includes(v)}
                                                        onClick={() => onTextAttrToggle(attr.name, v)}
                                                        count={attrValueCounts[attr.name]?.[v]}
                                                    >
                                                        {v}
                                                    </Pill>
                                                ))}
                                            </div>
                                        )}
                                    </FilterSection>
                                ))}
                            </div>
                        </div>
                    )}

                </div>
            </div>

            {/* Footer */}
            <div className="shrink-0 border-t border-gray-200 dark:border-gray-800 px-8 py-4 flex items-center justify-between">
                <button
                    onClick={onClearAll}
                    className="text-sm font-medium text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                >
                    Resetează tot
                </button>
                <button
                    onClick={onClose}
                    className="bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-6 py-2 rounded-lg text-sm font-semibold hover:opacity-90 transition-opacity"
                >
                    {selectedProductSlug
                        ? `Arată ${resultCount} ${resultCount === 1 ? "produs" : "produse"}`
                        : "Gata"}
                </button>
            </div>
        </div>
    );
}

// ─── main page ────────────────────────────────────────────────────────────────

function ProduseContent() {
    const searchParams = useSearchParams();
    const router = useRouter();

    const [categories, setCategories] = useState<CategoryWithProducts[]>([]);
    const [items, setItems]           = useState<ProductVariant[]>([]);
    const [totalPages, setTotalPages] = useState(1);
    const [totalCount, setTotalCount] = useState(0);
    const [loading, setLoading]       = useState(true);
    const [filterOpen, setFilterOpen] = useState(false);
    const [sortOpen, setSortOpen]     = useState(false);
    const sortRef = useRef<HTMLDivElement>(null);

    // ── All filter state lives in the URL ──────────────────────────────
    const categorySlug        = searchParams.get("category") ?? "";
    const selectedProductSlug = searchParams.get("prod") ?? "";
    const onlyInStock         = searchParams.get("instock") === "1";
    const onlyDiscounted      = searchParams.get("discounted") === "1";
    const sortBy              = (searchParams.get("sort") as SortOption) ?? "relevant";
    const search              = searchParams.get("search") ?? "";
    const page                = Number(searchParams.get("p") ?? "1");
    const minPrice            = searchParams.get("min") ? Number(searchParams.get("min")) : undefined;
    const maxPrice            = searchParams.get("max") ? Number(searchParams.get("max")) : undefined;

    const textAttrFilters = useMemo(() => {
        const r: Record<string, string[]> = {};
        searchParams.forEach((v, k) => {
            if (k.startsWith("a_")) r[k.slice(2)] = v.split("|").filter(Boolean);
        });
        return r;
    }, [searchParams]);

    const numAttrFilters = useMemo(() => {
        const r: Record<string, [number, number]> = {};
        searchParams.forEach((v, k) => {
            if (k.startsWith("n_")) {
                const [mn, mx] = v.split("|").map(Number);
                r[k.slice(2)] = [mn, mx];
            }
        });
        return r;
    }, [searchParams]);

    // ── Data fetching ──────────────────────────────────────────────────
    useEffect(() => {
        getCategoriesWithProducts().then(setCategories).catch(() => {});
    }, []);

    const selectedCategoryId = useMemo(
        () => categories.find(c => c.slug === categorySlug)?.categoryId ?? "",
        [categories, categorySlug]
    );

    const productsInCategory = useMemo(
        () => categories.find(c => c.categoryId === selectedCategoryId)?.products ?? [],
        [categories, selectedCategoryId]
    );

    const selectedProductId = useMemo(
        () => productsInCategory.find(p => p.productSlug === selectedProductSlug)?.productId ?? "",
        [productsInCategory, selectedProductSlug]
    );

    useEffect(() => {
        if (categorySlug && !selectedCategoryId) return;
        if (selectedProductSlug && !selectedProductId) return;

        let cancelled = false;
        setLoading(true);
        getVariantsFiltered({
            categoryId:     selectedCategoryId || undefined,
            productId:      selectedProductId  || undefined,
            onlyInStock:    onlyInStock || undefined,
            onlyDiscounted: onlyDiscounted || undefined,
            searchText:     search || undefined,
            onlyActive:     true,
            sortBy:         SORT_TO_API[sortBy],
            minPrice,
            maxPrice,
            // When a product is selected load all its variants (small set) for client-side attr filtering
            page:     selectedProductSlug ? 1 : page,
            pageSize: selectedProductSlug ? 100 : 24,
        })
            .then(data => {
                if (!cancelled) {
                    setItems(data.items);
                    setTotalPages(data.totalPages);
                    setTotalCount(data.totalCount);
                }
            })
            .finally(() => { if (!cancelled) setLoading(false); });
        return () => { cancelled = true; };
    }, [categorySlug, selectedCategoryId, selectedProductSlug, selectedProductId, onlyInStock, onlyDiscounted, search, sortBy, minPrice, maxPrice, page]);

    useEffect(() => {
        const h = (e: MouseEvent) => {
            if (sortRef.current && !sortRef.current.contains(e.target as Node))
                setSortOpen(false);
        };
        document.addEventListener("mousedown", h);
        return () => document.removeEventListener("mousedown", h);
    }, []);

    // ── Derived ────────────────────────────────────────────────────────
    const attrMeta = useMemo(() => extractAttrs(items), [items]);

    // Server handles sort & pagination; client-side attr filter only applies when a product is selected
    const displayed = useMemo(() => {
        if (!selectedProductSlug) return items;
        return items.filter(v => {
            for (const [key, selected] of Object.entries(textAttrFilters)) {
                if (!selected.length) continue;
                if (!selected.includes(v.attributes?.[key])) return false;
            }
            for (const [key, [mn, mx]] of Object.entries(numAttrFilters)) {
                const val = parseFloat(v.attributes?.[key]);
                if (isNaN(val) || val < mn || val > mx) return false;
            }
            return true;
        });
    }, [items, selectedProductSlug, textAttrFilters, numAttrFilters]);

    // ── URL update helper ──────────────────────────────────────────────
    // Any patch that doesn't explicitly set 'p' resets page to 1
    function patch(updates: Record<string, string | null>) {
        const p = new URLSearchParams(searchParams.toString());
        for (const [key, val] of Object.entries(updates)) {
            if (val === null) p.delete(key);
            else p.set(key, val);
        }
        if (!("p" in updates)) p.delete("p");
        const qs = p.toString();
        router.replace(`/produse${qs ? `?${qs}` : ""}`);
    }

    // ── Handlers ───────────────────────────────────────────────────────
    function handleCategorySelect(id: string) {
        const slug = id ? (categories.find(c => c.categoryId === id)?.slug ?? "") : "";
        const p = new URLSearchParams();
        if (slug) p.set("category", slug);
        if (onlyInStock) p.set("instock", "1");
        if (onlyDiscounted) p.set("discounted", "1");
        if (sortBy !== "relevant") p.set("sort", sortBy);
        if (search) p.set("search", search);
        if (minPrice !== undefined) p.set("min", String(minPrice));
        if (maxPrice !== undefined) p.set("max", String(maxPrice));
        const qs = p.toString();
        router.replace(`/produse${qs ? `?${qs}` : ""}`);
    }

    function handleProductSelect(slug: string) {
        const p = new URLSearchParams();
        if (categorySlug) p.set("category", categorySlug);
        if (slug) p.set("prod", slug);
        if (onlyInStock) p.set("instock", "1");
        if (onlyDiscounted) p.set("discounted", "1");
        if (sortBy !== "relevant") p.set("sort", sortBy);
        if (search) p.set("search", search);
        if (minPrice !== undefined) p.set("min", String(minPrice));
        if (maxPrice !== undefined) p.set("max", String(maxPrice));
        const qs = p.toString();
        router.replace(`/produse${qs ? `?${qs}` : ""}`);
    }

    function handlePriceChange(min?: number, max?: number) {
        patch({
            min: min !== undefined ? String(min) : null,
            max: max !== undefined ? String(max) : null,
        });
    }

    function toggleTextAttr(name: string, value: string) {
        const cur = textAttrFilters[name] ?? [];
        const updated = cur.includes(value) ? cur.filter(v => v !== value) : [...cur, value];
        patch({ [`a_${name}`]: updated.length ? updated.join("|") : null });
    }

    function setNumRange(name: string, range: [number, number]) {
        patch({ [`n_${name}`]: `${range[0]}|${range[1]}` });
    }

    function handleClearAll() {
        router.replace("/produse");
    }

    function handlePageChange(newPage: number) {
        patch({ p: newPage > 1 ? String(newPage) : null });
        window.scrollTo({ top: 0, behavior: "smooth" });
    }

    // ── Active chips ───────────────────────────────────────────────────
    const selectedCategoryName = categories.find(c => c.categoryId === selectedCategoryId)?.name;
    const selectedProductName  = productsInCategory.find(p => p.productSlug === selectedProductSlug)?.name;

    const activeChips: { label: string; onRemove: () => void }[] = [
        ...(search ? [{ label: `Căutare: "${search}"`, onRemove: () => patch({ search: null }) }] : []),
        ...(selectedCategoryName ? [{ label: `Categorie: ${selectedCategoryName}`, onRemove: () => handleCategorySelect("") }] : []),
        ...(selectedProductName  ? [{ label: `Produs: ${selectedProductName}`,  onRemove: () => handleProductSelect("")  }] : []),
        ...(onlyInStock ? [{ label: "În stoc", onRemove: () => patch({ instock: null }) }] : []),
        ...(onlyDiscounted ? [{ label: "La reducere", onRemove: () => patch({ discounted: null }) }] : []),
        ...(minPrice !== undefined ? [{ label: `Preț min: ${minPrice} RON`, onRemove: () => patch({ min: null }) }] : []),
        ...(maxPrice !== undefined ? [{ label: `Preț max: ${maxPrice} RON`, onRemove: () => patch({ max: null }) }] : []),
        ...Object.entries(textAttrFilters).flatMap(([key, vals]) =>
            vals.map(v => ({ label: `${key}: ${v}`, onRemove: () => toggleTextAttr(key, v) }))
        ),
        ...attrMeta
            .filter(a => a.isNumeric && numAttrFilters[a.name] &&
                (numAttrFilters[a.name][0] > a.absMin || numAttrFilters[a.name][1] < a.absMax))
            .map(a => ({
                label: `${a.name}: ${numAttrFilters[a.name][0]}–${numAttrFilters[a.name][1]}`,
                onRemove: () => patch({ [`n_${a.name}`]: null }),
            })),
    ];

    const displayedCount = selectedProductSlug ? displayed.length : totalCount;
    const title = search
        ? `Rezultate pentru "${search}"`
        : selectedProductName ?? selectedCategoryName ?? "Toate produsele";

    return (
        <div className="flex flex-col gap-4">

            {/* Top bar */}
            <div className="flex items-end justify-between gap-4">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{title}</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        {loading
                            ? "Se încarcă..."
                            : `${displayedCount} ${displayedCount === 1 ? "produs găsit" : "produse găsite"}`}
                    </p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                    {/* Filter button */}
                    <button
                        onClick={() => setFilterOpen(true)}
                        className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                            activeChips.length > 0
                                ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                        }`}
                    >
                        <SlidersHorizontal size={15} />
                        Filtrare
                        {activeChips.length > 0 && (
                            <span className="bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center leading-none">
                                {activeChips.length}
                            </span>
                        )}
                    </button>

                    {/* Sort dropdown */}
                    <div className="relative" ref={sortRef}>
                        <button
                            onClick={() => setSortOpen(p => !p)}
                            className={`flex items-center gap-2 px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                                sortBy !== "relevant"
                                    ? "border-gray-900 dark:border-gray-100 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900"
                                    : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-gray-400"
                            }`}
                        >
                            <ArrowUpDown size={15} />
                            {SORT_LABELS[sortBy]}
                            <ChevronDown size={14} className={`transition-transform duration-200 ${sortOpen ? "rotate-180" : ""}`} />
                        </button>

                        {sortOpen && (
                            <div className="absolute right-0 top-full mt-1 w-48 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-lg z-20 py-1">
                                {(Object.entries(SORT_LABELS) as [SortOption, string][]).map(([value, label]) => (
                                    <button
                                        key={value}
                                        onClick={() => { patch({ sort: value !== "relevant" ? value : null }); setSortOpen(false); }}
                                        className={`w-full text-left px-4 py-2.5 text-sm transition-colors ${
                                            sortBy === value
                                                ? "bg-gray-100 dark:bg-gray-800 font-semibold text-gray-900 dark:text-gray-100"
                                                : "text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        {label}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Active filter chips */}
            {activeChips.length > 0 && (
                <div className="flex flex-wrap gap-2 items-center">
                    {activeChips.map(chip => (
                        <ActiveChip key={chip.label} label={chip.label} onRemove={chip.onRemove} />
                    ))}
                    <button
                        onClick={handleClearAll}
                        className="text-xs text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 underline ml-1 transition-colors"
                    >
                        Șterge tot
                    </button>
                </div>
            )}

            {/* Grid */}
            {loading ? (
                <PageSpinner />
            ) : displayed.length > 0 ? (
                <>
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                        {displayed.map(v => (
                            <VariantCard key={v.variantId} variant={v} productSlug={v.productSlug} />
                        ))}
                    </div>
                    {!selectedProductSlug && (
                        <Pagination page={page} totalPages={totalPages} onChange={handlePageChange} />
                    )}
                </>
            ) : (
                <div className="flex flex-col items-center justify-center py-24 text-gray-400">
                    <p className="text-lg font-medium">Niciun produs găsit</p>
                    <p className="text-sm mt-1">Încearcă să modifici filtrele.</p>
                </div>
            )}

            {/* Full-page filter overlay */}
            {filterOpen && (
                <FilterOverlay
                    categories={categories}
                    productsInCategory={productsInCategory}
                    attrMeta={attrMeta}
                    variants={items}
                    resultCount={selectedProductSlug ? displayed.length : totalCount}
                    selectedCategoryId={selectedCategoryId}
                    selectedProductSlug={selectedProductSlug}
                    onlyInStock={onlyInStock}
                    onlyDiscounted={onlyDiscounted}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    textAttrFilters={textAttrFilters}
                    numAttrFilters={numAttrFilters}
                    onCategorySelect={handleCategorySelect}
                    onProductSelect={handleProductSelect}
                    onInStockChange={(v) => patch({ instock: v ? "1" : null })}
                    onDiscountedChange={(v) => patch({ discounted: v ? "1" : null })}
                    onPriceChange={handlePriceChange}
                    onTextAttrToggle={toggleTextAttr}
                    onNumRangeChange={setNumRange}
                    onClearAll={handleClearAll}
                    onClose={() => setFilterOpen(false)}
                />
            )}
        </div>
    );
}

export default function ProduseePage() {
    return (
        <Suspense>
            <ProduseContent />
        </Suspense>
    );
}
