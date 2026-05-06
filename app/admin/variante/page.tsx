"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, ExternalLink, SlidersHorizontal } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetVariants,
    adminGetProducts,
    adminCreateVariant,
    adminUpdateVariant,
    adminDeleteVariant,
    adminGetMeasurementUnits,
    VariantAttribute,
    MeasurementUnit,
} from "@/lib/api/admin";

interface Variant {
    variantId: string;
    sku: string;
    price: number;
    stockQuantity: number;
    isActive: boolean;
    productName: string;
    productSlug: string;
    variantSlug: string;
}

interface Product {
    productId: string;
    name: string;
}

interface FormState {
    productId: string;
    sku: string;
    price: string;
    quantity: string;
    brand: string;
    description: string;
    attributes: VariantAttribute[];
    isActive: boolean;
}

const emptyForm: FormState = {
    productId: "",
    sku: "",
    price: "",
    quantity: "",
    brand: "",
    description: "",
    attributes: [],
    isActive: true,
};

export default function AdminVariantePage() {
    const { token } = useAuth();
    const [variants, setVariants] = useState<Variant[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [units, setUnits] = useState<MeasurementUnit[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        Promise.all([adminGetVariants(token), adminGetProducts(token), adminGetMeasurementUnits(token)])
            .then(([v, p, u]) => {
                setVariants(v);
                setProducts(p);
                setUnits(u);
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    function openCreate() {
        setEditingId(null);
        setForm({ ...emptyForm, productId: products[0]?.productId ?? "" });
        setError(null);
        setShowForm(true);
    }

    function openEdit(variant: Variant) {
        const product = products.find((p) => p.name === variant.productName);
        setEditingId(variant.variantId);
        setForm({
            productId: product?.productId ?? "",
            sku: variant.sku,
            price: String(variant.price),
            quantity: String(variant.stockQuantity),
            brand: "",
            description: "",
            attributes: [],
            isActive: variant.isActive,
        });
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
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

    const groupedUnits = Object.entries(
        units.reduce<Record<string, MeasurementUnit[]>>((acc, u) => {
            (acc[u.measures] ??= []).push(u);
            return acc;
        }, {})
    ).sort(([a], [b]) => a.localeCompare(b));

    async function handleSave() {
        if (!token) return;
        if (!form.productId || !form.sku.trim() || !form.price || !form.quantity) {
            setError("Completează câmpurile obligatorii: produs, SKU, preț și cantitate.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            const price = parseFloat(form.price);
            const quantity = parseInt(form.quantity, 10);
            if (editingId) {
                await adminUpdateVariant(token, editingId, {
                    productId: form.productId,
                    sku: form.sku,
                    name: form.sku,
                    price,
                    quantity,
                    variantAttributes: form.attributes,
                    isActive: form.isActive,
                });
                setVariants((prev) =>
                    prev.map((v) =>
                        v.variantId === editingId
                            ? {
                                ...v,
                                sku: form.sku,
                                price,
                                stockQuantity: quantity,
                                isActive: form.isActive,
                                productName: products.find((p) => p.productId === form.productId)?.name ?? v.productName,
                            }
                            : v
                    )
                );
            } else {
                await adminCreateVariant(token, {
                    productId: form.productId,
                    sku: form.sku,
                    price,
                    description: form.description,
                    brand: form.brand,
                    quantity,
                    variantAttributes: form.attributes,
                });
                const updated = await adminGetVariants(token);
                setVariants(updated);
            }
            closeForm();
        } catch (e) {
            setError("Operațiunea a eșuat. Încearcă din nou.");
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
        } catch (e) {
            console.error(e);
            alert("Ștergerea a eșuat.");
        } finally {
            setDeletingId(null);
        }
    }

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Variante</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{variants.length} variante în catalog</p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                    >
                        <Plus size={16} />
                        Variantă nouă
                    </button>
                )}
            </div>

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
                        <div className="w-80 xl:w-96 flex-shrink-0 p-6 flex flex-col gap-3">
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
                                            <div className="flex gap-2">
                                                <input
                                                    type="text"
                                                    value={attr.value}
                                                    onChange={(e) => updateAttribute(i, "value", e.target.value)}
                                                    placeholder="Valoare"
                                                    className="flex-1 min-w-0 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                                />
                                                <select
                                                    value={attr.unitId ?? ""}
                                                    onChange={(e) => updateAttribute(i, "unitId", e.target.value)}
                                                    title="Unitate de măsură (opțional)"
                                                    className="w-24 px-2 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                                >
                                                    <option value="">—</option>
                                                    {groupedUnits.map(([measures, grpUnits]) => (
                                                        <optgroup key={measures} label={measures}>
                                                            {grpUnits.map((u) => (
                                                                <option key={u.unitId} value={u.unitId}>
                                                                    {u.symbol}
                                                                </option>
                                                            ))}
                                                        </optgroup>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>

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
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Se încarcă...</div>
                ) : variants.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Nicio variantă găsită.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-6 py-4 font-semibold">Produs</th>
                                <th className="px-6 py-4 font-semibold">SKU</th>
                                <th className="px-6 py-4 font-semibold">Preț</th>
                                <th className="px-6 py-4 font-semibold">Stoc</th>
                                <th className="px-6 py-4 font-semibold">Activ</th>
                                <th className="px-6 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {variants.map((variant) => (
                                <tr key={variant.variantId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-6 py-4">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{variant.productName}</span>
                                        <span className="text-gray-400 dark:text-gray-500 text-xs block mt-0.5">{variant.variantSlug}</span>
                                    </td>
                                    <td className="px-6 py-4 font-mono text-xs text-gray-700 dark:text-gray-300">{variant.sku}</td>
                                    <td className="px-6 py-4 text-gray-900 dark:text-gray-100 font-medium">{variant.price.toFixed(2)} lei</td>
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
                                                href={`/products/${variant.productSlug}/${variant.variantSlug}`}
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
