"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, ExternalLink, SlidersHorizontal, ImagePlus } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetVariants,
    adminGetProducts,
    adminCreateVariant,
    adminUpdateVariant,
    adminDeleteVariant,
    adminDeleteVariantsBatch,
    adminGetMeasurementUnits,
    adminCreateMeasurementUnit,
    adminUploadImage,
    VariantAttribute,
    MeasurementUnit,
} from "@/lib/api/admin";

interface Variant {
    variantId: string;
    productId: string;
    sku: string;
    name: string;
    price: number;
    discountedPrice: number | null;
    stockQuantity: number;
    isActive: boolean;
    brand: string | null;
    description: string | null;
    productName: string;
    productSlug: string;
    variantSlug: string;
    imageUrls: string[];
    attributes?: Record<string, string>;
    editableAttributes?: { name: string; value: string; unitId?: string | null }[];
    rowVersion?: string;
}

interface Product {
    productId: string;
    name: string;
}

interface FormState {
    productId: string;
    sku: string;
    name: string;
    price: string;
    discountedPrice: string;
    quantity: string;
    brand: string;
    description: string;
    attributes: VariantAttribute[];
    imageUrls: string[];
    isActive: boolean;
}

const emptyForm: FormState = {
    productId: "",
    sku: "",
    name: "",
    price: "",
    discountedPrice: "",
    quantity: "",
    brand: "",
    description: "",
    attributes: [],
    imageUrls: [],
    isActive: true,
};

function DiscountSection({
    price,
    discountedPrice,
    onChange,
}: {
    price: string;
    discountedPrice: string;
    onChange: (val: string) => void;
}) {
    const basePrice = parseFloat(price);
    const discPrice = parseFloat(discountedPrice);

    const computedPercent =
        !isNaN(basePrice) && basePrice > 0 && !isNaN(discPrice) && discPrice > 0
            ? Math.round((1 - discPrice / basePrice) * 100)
            : null;

    function handlePercentChange(e: React.ChangeEvent<HTMLInputElement>) {
        const pct = parseFloat(e.target.value);
        if (!isNaN(pct) && !isNaN(basePrice) && basePrice > 0 && pct > 0 && pct < 100) {
            onChange((basePrice * (1 - pct / 100)).toFixed(2));
        } else if (e.target.value === "") {
            onChange("");
        }
    }

    const inputCls = "px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

    return (
        <div className="flex flex-col gap-2 p-4 rounded-xl bg-orange-50 dark:bg-orange-950/30 border border-orange-100 dark:border-orange-900/40">
            <div className="flex items-center justify-between">
                <p className="text-xs font-semibold text-orange-700 dark:text-orange-400 uppercase tracking-wider">
                    Reducere
                </p>
                {discountedPrice && (
                    <button
                        type="button"
                        onClick={() => onChange("")}
                        className="text-xs text-orange-500 dark:text-orange-400 hover:text-orange-700 dark:hover:text-orange-200 transition-colors"
                    >
                        Elimină reducerea
                    </button>
                )}
            </div>
            <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Preț redus (lei)</label>
                    <input
                        type="number"
                        min="0"
                        step="0.01"
                        value={discountedPrice}
                        onChange={(e) => onChange(e.target.value)}
                        placeholder={!isNaN(basePrice) ? `< ${basePrice.toFixed(2)}` : "0.00"}
                        className={inputCls}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label className="text-xs text-gray-500 dark:text-gray-400">Reducere (%)</label>
                    <input
                        type="number"
                        min="1"
                        max="99"
                        step="1"
                        value={computedPercent ?? ""}
                        onChange={handlePercentChange}
                        placeholder="ex. 20"
                        className={inputCls}
                    />
                </div>
            </div>
            {computedPercent !== null && !isNaN(discPrice) && (
                <p className="text-xs text-orange-600 dark:text-orange-400">
                    Prețul original {!isNaN(basePrice) ? basePrice.toFixed(2) : "–"} lei va apărea tăiat, iar prețul redus va fi{" "}
                    <strong>{discPrice.toFixed(2)} lei</strong> (−{computedPercent}%).
                </p>
            )}
        </div>
    );
}

function ImageSection({
    imageUrls,
    onChange,
    onUpload,
}: {
    imageUrls: string[];
    onChange: (urls: string[]) => void;
    onUpload: (file: File) => Promise<string>;
}) {
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadError, setUploadError] = useState<string | null>(null);

    async function handleFiles(files: FileList) {
        setUploadError(null);
        setUploading(true);
        try {
            const uploaded = await Promise.all(
                Array.from(files).map((f) => onUpload(f))
            );
            onChange([...imageUrls, ...uploaded]);
        } catch {
            setUploadError("Uploadul a eșuat. Încearcă din nou.");
        } finally {
            setUploading(false);
            if (fileInputRef.current) fileInputRef.current.value = "";
        }
    }

    function removeUrl(index: number) {
        onChange(imageUrls.filter((_, i) => i !== index));
    }

    return (
        <div className="px-6 py-5 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                    Imagini
                    {imageUrls.length > 0 && (
                        <span className="ml-1.5 font-normal normal-case text-gray-300 dark:text-gray-600">
                            ({imageUrls.length})
                        </span>
                    )}
                </p>
                {uploadError && (
                    <p className="text-xs text-red-500 dark:text-red-400">{uploadError}</p>
                )}
            </div>

            <div className="flex flex-wrap gap-3">
                {imageUrls.map((url, i) => (
                    <div key={i} className="relative group shrink-0">
                        <div className={`w-20 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 border-2 ${i === 0 ? "border-blue-400 dark:border-blue-500" : "border-transparent"}`}>
                            <img
                                src={url}
                                alt=""
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                            />
                        </div>
                        {i === 0 && (
                            <span className="absolute bottom-0 left-0 right-0 bg-blue-500/80 text-white text-[9px] font-semibold text-center py-0.5 rounded-b-xl pointer-events-none">
                                Primară
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={() => removeUrl(i)}
                            className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 hover:bg-red-600 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-sm"
                            tabIndex={-1}
                        >
                            <X size={10} />
                        </button>
                    </div>
                ))}

                <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="w-20 h-20 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 flex flex-col items-center justify-center gap-1 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50 shrink-0"
                >
                    {uploading ? (
                        <span className="text-[10px] text-center px-1">Se încarcă...</span>
                    ) : (
                        <>
                            <ImagePlus size={18} />
                            <span className="text-[10px]">Adaugă</span>
                        </>
                    )}
                </button>

                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    className="hidden"
                    onChange={(e) => { if (e.target.files?.length) handleFiles(e.target.files); }}
                />
            </div>
        </div>
    );
}

function UnitCombobox({
    unitId,
    units,
    onChange,
    onAdd,
}: {
    unitId: string | undefined;
    units: MeasurementUnit[];
    onChange: (unitId: string | undefined) => void;
    onAdd: (symbol: string) => Promise<string>;
}) {
    const selectedUnit = units.find((u) => u.unitId === unitId);
    const [inputValue, setInputValue] = useState(selectedUnit?.symbol ?? "");
    const [open, setOpen] = useState(false);
    const [adding, setAdding] = useState(false);
    const [addError, setAddError] = useState<string | null>(null);
    const [dropdownPos, setDropdownPos] = useState<{ top: number; left: number; width: number } | null>(null);
    const containerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(selectedUnit?.symbol ?? "");
    }, [unitId, units]);

    useEffect(() => {
        function onMouseDown(e: MouseEvent) {
            if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener("mousedown", onMouseDown);
        return () => document.removeEventListener("mousedown", onMouseDown);
    }, []);

    function openDropdown() {
        if (containerRef.current) {
            const rect = containerRef.current.getBoundingClientRect();
            setDropdownPos({ top: rect.bottom + 4, left: rect.left, width: rect.width });
        }
        setOpen(true);
    }

    const query = inputValue.trim().toLowerCase();
    const filtered = query
        ? units.filter(
              (u) =>
                  u.symbol.toLowerCase().includes(query) ||
                  u.name.toLowerCase().includes(query)
          )
        : units;

    const exactMatch = units.find((u) => u.symbol.toLowerCase() === query);
    const showAdd = query.length > 0 && !exactMatch;

    const grouped = Object.entries(
        filtered.reduce<Record<string, MeasurementUnit[]>>((acc, u) => {
            (acc[u.measures] ??= []).push(u);
            return acc;
        }, {})
    ).map(([measures, items]) => ({
        measures,
        items: [...items].sort((a, b) => b.usageCount - a.usageCount),
        maxUsage: Math.max(...items.map((i) => i.usageCount)),
    })).sort((a, b) => {
        const diff = b.maxUsage - a.maxUsage;
        return diff !== 0 ? diff : a.measures.localeCompare(b.measures);
    });

    async function handleAdd() {
        if (!inputValue.trim() || adding) return;
        setAdding(true);
        setAddError(null);
        try {
            const newId = await onAdd(inputValue.trim());
            onChange(newId);
            setOpen(false);
        } catch {
            setAddError("Nu s-a putut adăuga unitatea.");
        } finally {
            setAdding(false);
        }
    }

    function select(u: MeasurementUnit) {
        setInputValue(u.symbol);
        onChange(u.unitId);
        setOpen(false);
    }

    function clear() {
        setInputValue("");
        onChange(undefined);
        setOpen(false);
    }

    const inputCls = "w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

    return (
        <div ref={containerRef} className="relative">
            <input
                type="text"
                value={inputValue}
                onChange={(e) => {
                    setInputValue(e.target.value);
                    if (unitId) onChange(undefined);
                    openDropdown();
                }}
                onFocus={openDropdown}
                placeholder="Unitate de măsură (opțional)"
                className={inputCls}
                autoComplete="off"
            />
            {unitId && (
                <button
                    type="button"
                    onClick={clear}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-0.5 text-gray-300 dark:text-gray-600 hover:text-gray-500 dark:hover:text-gray-400 transition-colors"
                    tabIndex={-1}
                >
                    <X size={12} />
                </button>
            )}

            {open && dropdownPos && (
                <div
                    style={{ position: "fixed", top: dropdownPos.top, left: dropdownPos.left, width: dropdownPos.width, zIndex: 9999 }}
                    className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl shadow-xl overflow-hidden"
                >
                    <div className="max-h-56 overflow-y-auto">
                        {addError && (
                            <p className="px-3 py-2 text-xs text-red-500 dark:text-red-400 border-b border-gray-100 dark:border-gray-800">{addError}</p>
                        )}
                        {showAdd && (
                            <button
                                type="button"
                                onClick={handleAdd}
                                disabled={adding}
                                className="w-full text-left px-3 py-2.5 text-sm text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 flex items-center gap-2 border-b border-gray-100 dark:border-gray-800 disabled:opacity-50"
                            >
                                <Plus size={13} className="shrink-0" />
                                {adding ? "Se adaugă..." : `Adaugă „${inputValue.trim()}"`}
                            </button>
                        )}

                        {filtered.length === 0 && !showAdd && (
                            <p className="px-3 py-3 text-xs text-gray-400 dark:text-gray-500">
                                Nicio unitate găsită.
                            </p>
                        )}

                        {unitId && (
                            <button
                                type="button"
                                onClick={clear}
                                className="w-full text-left px-3 py-2 text-sm text-gray-400 dark:text-gray-500 hover:bg-gray-50 dark:hover:bg-gray-800 border-b border-gray-100 dark:border-gray-800"
                            >
                                — Fără unitate —
                            </button>
                        )}

                        {grouped.map(({ measures, items: grpUnits }) => (
                            <div key={measures}>
                                <p className="px-3 pt-2.5 pb-1 text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                                    {measures}
                                </p>
                                {grpUnits.map((u) => (
                                    <button
                                        key={u.unitId}
                                        type="button"
                                        onClick={() => select(u)}
                                        className={`w-full text-left px-3 py-1.5 text-sm flex items-center gap-2.5 transition-colors ${
                                            unitId === u.unitId
                                                ? "bg-gray-100 dark:bg-gray-800"
                                                : "hover:bg-gray-50 dark:hover:bg-gray-800"
                                        }`}
                                    >
                                        <span className="font-mono text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 px-1.5 py-0.5 rounded w-10 text-center shrink-0">
                                            {u.symbol}
                                        </span>
                                        <span className="text-gray-600 dark:text-gray-400 truncate">
                                            {u.name}
                                        </span>
                                    </button>
                                ))}
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}

export default function AdminVariantePage() {
    const { token } = useAuth();
    const [variants, setVariants] = useState<Variant[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [units, setUnits] = useState<MeasurementUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editingRowVersion, setEditingRowVersion] = useState<string | undefined>(undefined);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);

    useEffect(() => {
        if (!token) return;
        Promise.all([adminGetVariants(token), adminGetProducts(token), adminGetMeasurementUnits(token)])
            .then(([v, p, u]) => {
                setVariants(v as Variant[]);
                setProducts(p as Product[]);
                setUnits(u as MeasurementUnit[]);
            })
            .catch(() => setError("Nu s-au putut încărca variantele."))
            .finally(() => setLoading(false));
    }, [token]);

    function openCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, productId: products[0]?.productId ?? "" });
        setError(null);
        setShowForm(true);
    }

    function openEdit(variant: Variant) {
        setEditingId(variant.variantId);
        setEditingRowVersion(variant.rowVersion);
        setForm({
            productId: variant.productId,
            sku: variant.sku,
            name: variant.name ?? "",
            price: String(variant.price),
            discountedPrice: variant.discountedPrice != null ? String(variant.discountedPrice) : "",
            quantity: String(variant.stockQuantity),
            brand: variant.brand ?? "",
            description: variant.description ?? "",
            attributes: variant.editableAttributes
                ? variant.editableAttributes.map((a) => ({ name: a.name, value: a.value, unitId: a.unitId ?? undefined }))
                : Object.entries(variant.attributes ?? {}).map(([name, value]) => ({ name, value, unitId: undefined })),
            imageUrls: variant.imageUrls ?? [],
            isActive: variant.isActive,
        });
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setEditingRowVersion(undefined);
        setForm(emptyForm);
        setError(null);
    }

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    function addAttribute() {
        setForm((prev) => ({ ...prev, attributes: [...prev.attributes, { name: "", value: "", unitId: undefined }] }));
    }

    function removeAttribute(index: number) {
        setForm((prev) => ({ ...prev, attributes: prev.attributes.filter((_, i) => i !== index) }));
    }

    function updateAttribute(index: number, key: keyof VariantAttribute, val: string) {
        setForm((prev) => {
            const updated = [...prev.attributes];
            updated[index] = { ...updated[index], [key]: key === "unitId" ? (val || undefined) : val };
            return { ...prev, attributes: updated };
        });
    }

    async function handleUploadImage(file: File): Promise<string> {
        if (!token) throw new Error("Not authenticated");
        const { url } = await adminUploadImage(token, file);
        return url;
    }

    async function handleAddUnit(symbol: string): Promise<string> {
        if (!token) throw new Error("Not authenticated");
        const { id } = await adminCreateMeasurementUnit(token, {
            name: symbol,
            symbol,
            measures: "Personalizat",
        });
        setUnits((prev) => [...prev, { unitId: id, name: symbol, symbol, measures: "Personalizat", isSystem: false, usageCount: 0 }]);
        return id;
    }

    async function handleSave() {
        if (!token) return;
        if (!form.productId || !form.sku.trim() || !form.name.trim() || !form.price || !form.quantity) {
            setError("Completează câmpurile obligatorii: produs, nume, SKU, preț și cantitate.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const price = parseFloat(form.price);
            const quantity = parseInt(form.quantity, 10);
            const discountedPrice = form.discountedPrice ? parseFloat(form.discountedPrice) : null;
            if (editingId) {
                await adminUpdateVariant(token, editingId, {
                    productId: form.productId,
                    sku: form.sku,
                    name: form.name,
                    price,
                    quantity,
                    brand: form.brand,
                    description: form.description,
                    variantAttributes: form.attributes,
                    imageUrls: form.imageUrls.filter(Boolean),
                    isActive: form.isActive,
                    discountedPrice,
                    rowVersion: editingRowVersion,
                });
                const updated = await adminGetVariants(token);
                setVariants(updated as Variant[]);
            } else {
                await adminCreateVariant(token, {
                    productId: form.productId,
                    sku: form.sku,
                    name: form.name,
                    price,
                    description: form.description,
                    brand: form.brand,
                    quantity,
                    variantAttributes: form.attributes,
                    imageUrls: form.imageUrls.filter(Boolean),
                });
                const updated = await adminGetVariants(token);
                setVariants(updated as Variant[]);
            }
            closeForm();
        } catch (e) {
            setError(
                e instanceof Error && e.message.includes("reîncarcă pagina")
                    ? e.message
                    : "Operațiunea a eșuat. Încearcă din nou."
            );
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(variant: Variant) {
        if (!token) return;
        if (!window.confirm(`Ștergi varianta "${variant.sku}"?`)) return;
        setDeletingId(variant.variantId);
        try {
            await adminDeleteVariant(token, variant.variantId);
            setVariants((prev) => prev.filter((v) => v.variantId !== variant.variantId));
            setSelected((prev) => { const s = new Set(prev); s.delete(variant.variantId); return s; });
        } catch (e) {
            console.error(e);
            alert("Ștergerea a eșuat.");
        } finally {
            setDeletingId(null);
        }
    }

    async function handleBatchDelete() {
        if (!token || selected.size === 0) return;
        if (!window.confirm(`Ștergi ${selected.size} ${selected.size === 1 ? "variantă" : "variante"}?`)) return;
        setBatchDeleting(true);
        try {
            await adminDeleteVariantsBatch(token, Array.from(selected));
            setVariants((prev) => prev.filter((v) => !selected.has(v.variantId)));
            setSelected(new Set());
        } catch (e) {
            console.error(e);
            alert("Ștergerea în lot a eșuat.");
        } finally {
            setBatchDeleting(false);
        }
    }

    function toggleSelect(id: string) {
        setSelected((prev) => {
            const s = new Set(prev);
            s.has(id) ? s.delete(id) : s.add(id);
            return s;
        });
    }

    function toggleSelectAll() {
        setSelected(selected.size === variants.length ? new Set() : new Set(variants.map((v) => v.variantId)));
    }

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Variante</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{variants.length} variante în catalog</p>
                </div>
                {!showForm && (
                    <div className="flex items-center gap-2">
                        {selected.size > 0 && (
                            <button
                                onClick={handleBatchDelete}
                                disabled={batchDeleting}
                                className="flex items-center gap-2 bg-red-500 hover:bg-red-600 text-white px-4 py-2.5 rounded-xl text-sm font-semibold transition-colors disabled:opacity-50"
                            >
                                <Trash2 size={15} />
                                {batchDeleting ? "Se șterge..." : `Șterge selecția (${selected.size})`}
                            </button>
                        )}
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                        >
                            <Plus size={16} />
                            Variantă nouă
                        </button>
                    </div>
                )}
            </div>

            {!showForm && error && (
                <p className="text-sm text-red-500 dark:text-red-400 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                    {error}
                </p>
            )}

            {showForm && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">

                    {/* Header */}
                    <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-800">
                        <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">
                            {editingId ? "Editează varianta" : "Variantă nouă"}
                        </h2>
                        <button
                            onClick={closeForm}
                            className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="flex divide-x divide-gray-100 dark:divide-gray-800">

                        {/* Left — basic info */}
                        <div className="flex-1 p-6 flex flex-col gap-4 min-w-0">
                            <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">Informații generale</p>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Produs <span className="text-red-500">*</span></label>
                                <select
                                    value={form.productId}
                                    onChange={(e) => setField("productId", e.target.value)}
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                >
                                    <option value="">Selectează un produs</option>
                                    {products.map((p) => (
                                        <option key={p.productId} value={p.productId}>{p.name}</option>
                                    ))}
                                </select>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nume <span className="text-red-500">*</span></label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => setField("name", e.target.value)}
                                    placeholder="ex. Tricou roșu mărime M"
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-3">
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">SKU <span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        value={form.sku}
                                        onChange={(e) => setField("sku", e.target.value)}
                                        placeholder="ex. PROD-001-RED"
                                        className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Preț (lei) <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="0.01"
                                        value={form.price}
                                        onChange={(e) => setField("price", e.target.value)}
                                        placeholder="149.99"
                                        className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Stoc <span className="text-red-500">*</span></label>
                                    <input
                                        type="number"
                                        min="0"
                                        step="1"
                                        value={form.quantity}
                                        onChange={(e) => setField("quantity", e.target.value)}
                                        placeholder="50"
                                        className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                                    <input
                                        type="text"
                                        value={form.brand}
                                        onChange={(e) => setField("brand", e.target.value)}
                                        placeholder="ex. Nike"
                                        className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Descriere</label>
                                <input
                                    type="text"
                                    value={form.description}
                                    onChange={(e) => setField("description", e.target.value)}
                                    placeholder="ex. Mărime M, culoare roșu"
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                />
                            </div>

                            {editingId && (
                                <DiscountSection
                                    price={form.price}
                                    discountedPrice={form.discountedPrice}
                                    onChange={(val) => setField("discountedPrice", val)}
                                />
                            )}

                            {editingId && (
                                <label className="flex items-center gap-2 cursor-pointer select-none w-fit">
                                    <input
                                        type="checkbox"
                                        checked={form.isActive}
                                        onChange={(e) => setField("isActive", e.target.checked)}
                                        className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                    />
                                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">Activă</span>
                                </label>
                            )}
                        </div>

                        {/* Right — attributes */}
                        <div className="w-80 xl:w-96 shrink-0 p-6 flex flex-col gap-3">
                            <div className="flex items-center justify-between">
                                <p className="text-xs font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-wider">
                                    Atribute
                                    {form.attributes.length > 0 && (
                                        <span className="ml-1.5 text-gray-300 dark:text-gray-600 font-normal normal-case">
                                            ({form.attributes.length})
                                        </span>
                                    )}
                                </p>
                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="flex items-center gap-1.5 text-xs font-medium text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100 transition-colors"
                                >
                                    <Plus size={13} />
                                    Adaugă
                                </button>
                            </div>

                            {form.attributes.length === 0 ? (
                                <button
                                    type="button"
                                    onClick={addAttribute}
                                    className="flex flex-col items-center justify-center gap-2 py-10 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                >
                                    <SlidersHorizontal size={20} />
                                    <span className="text-xs">Adaugă primul atribut</span>
                                </button>
                            ) : (
                                <div className="flex flex-col gap-2 overflow-y-auto max-h-80 pr-0.5">
                                    {form.attributes.map((attr, i) => (
                                        <div key={i} className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 flex flex-col gap-2">
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">
                                                    Atribut {i + 1}
                                                </span>
                                                <button
                                                    type="button"
                                                    onClick={() => removeAttribute(i)}
                                                    className="p-0.5 text-gray-300 dark:text-gray-600 hover:text-red-500 dark:hover:text-red-400 transition-colors rounded"
                                                >
                                                    <X size={13} />
                                                </button>
                                            </div>
                                            <input
                                                type="text"
                                                value={attr.name}
                                                onChange={(e) => updateAttribute(i, "name", e.target.value)}
                                                placeholder="Nume (ex. Culoare)"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                            />
                                            <input
                                                type="text"
                                                value={attr.value}
                                                onChange={(e) => updateAttribute(i, "value", e.target.value)}
                                                placeholder="Valoare"
                                                className="w-full px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                            />
                                            <UnitCombobox
                                                unitId={attr.unitId}
                                                units={units}
                                                onChange={(uid) => updateAttribute(i, "unitId", uid ?? "")}
                                                onAdd={handleAddUnit}
                                            />
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Images */}
                    <ImageSection
                        imageUrls={form.imageUrls}
                        onChange={(urls) => setField("imageUrls", urls)}
                        onUpload={handleUploadImage}
                    />

                    {/* Footer */}
                    <div className="flex items-center justify-between px-6 py-4 border-t border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/40">
                        <div className="flex-1">
                            {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
                        </div>
                        <div className="flex items-center gap-3">
                            <button
                                onClick={closeForm}
                                disabled={saving}
                                className="px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
                            >
                                Anulează
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Check size={14} />
                                {saving ? "Se salvează..." : "Salvează"}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <PageSpinner className="py-16" />
                ) : variants.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Nicio variantă găsită.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={variants.length > 0 && selected.size === variants.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                    />
                                </th>
                                <th className="px-4 py-4 w-14"></th>
                                <th className="px-6 py-4 font-semibold">Produs</th>
                                <th className="px-6 py-4 font-semibold">Nume</th>
                                <th className="px-6 py-4 font-semibold">SKU</th>
                                <th className="px-6 py-4 font-semibold">Preț</th>
                                <th className="px-6 py-4 font-semibold">Stoc</th>
                                <th className="px-6 py-4 font-semibold">Activ</th>
                                <th className="px-6 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {variants.map((variant) => (
                                <tr key={variant.variantId} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selected.has(variant.variantId) ? "bg-gray-50 dark:bg-gray-800/60" : ""}`}>
                                    <td className="px-4 py-3">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(variant.variantId)}
                                            onChange={() => toggleSelect(variant.variantId)}
                                            className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                        />
                                    </td>
                                    <td className="px-4 py-3">
                                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-800 shrink-0">
                                            {variant.imageUrls?.[0] ? (
                                                <img
                                                    src={variant.imageUrls[0]}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                    onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                                                />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center">
                                                    <ImagePlus size={14} className="text-gray-300 dark:text-gray-600" />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{variant.productName}</span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className="text-gray-800 dark:text-gray-200">{variant.name}</span>
                                        <span className="text-gray-400 dark:text-gray-500 text-xs block mt-0.5">{variant.variantSlug}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{variant.sku}</td>
                                    <td className="px-6 py-4">
                                        {variant.discountedPrice != null ? (
                                            <div className="flex flex-col gap-0.5">
                                                <span className="font-semibold text-orange-600 dark:text-orange-400">{variant.discountedPrice.toFixed(2)} lei</span>
                                                <span className="text-xs text-gray-400 line-through">{variant.price.toFixed(2)} lei</span>
                                            </div>
                                        ) : (
                                            <span className="font-medium text-gray-900 dark:text-gray-100">{variant.price.toFixed(2)} lei</span>
                                        )}
                                    </td>
                                    <td className="px-6 py-4 text-gray-600 dark:text-gray-400">{variant.stockQuantity}</td>
                                    <td className="px-6 py-4">
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                            variant.isActive
                                                ? "bg-green-50 dark:bg-green-950 text-green-600 dark:text-green-400"
                                                : "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400"
                                        }`}>
                                            {variant.isActive ? "Da" : "Nu"}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/produse/${variant.productSlug}/${variant.variantSlug}`}
                                                target="_blank"
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                title="Vezi în magazin"
                                            >
                                                <ExternalLink size={15} />
                                            </Link>
                                            <button
                                                onClick={() => openEdit(variant)}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                                                title="Editează"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(variant)}
                                                disabled={deletingId === variant.variantId}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg transition-colors disabled:opacity-40"
                                                title="Șterge"
                                            >
                                                <Trash2 size={15} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
}
