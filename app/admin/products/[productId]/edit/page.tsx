"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminGetProductById, adminGetCategories, adminUpdateProduct } from "@/lib/api/admin";

interface Category { categoryId: string; name: string; }

interface FormState {
    name: string;
    description: string;
    brand: string;
    categoryId: string;
    isActive: boolean;
    isShippable: boolean;
    isDigital: boolean;
    isReturnable: boolean;
}

const inputClass = "px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
    return (
        <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
                type="checkbox"
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
                className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
            />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{label}</span>
        </label>
    );
}

export default function AdminEditProductPage() {
    const { token } = useAuth();
    const router = useRouter();
    const params = useParams();
    const productId = params.productId as string;

    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<FormState>({
        name: "", description: "", brand: "", categoryId: "",
        isActive: true, isShippable: true, isDigital: false, isReturnable: true,
    });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token || !productId) return;
        Promise.all([
            adminGetProductById(token, productId),
            adminGetCategories(token),
        ])
            .then(([product, cats]) => {
                setCategories(cats);
                setForm({
                    name: product.name ?? "",
                    description: product.description ?? "",
                    brand: product.brand ?? "",
                    categoryId: product.categoryId ?? "",
                    isActive: product.isActive ?? true,
                    isShippable: product.isShippable ?? true,
                    isDigital: product.isDigital ?? false,
                    isReturnable: product.isReturnable ?? true,
                });
            })
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token, productId]);

    function setField<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm((prev) => ({ ...prev, [key]: value }));
    }

    async function handleSave() {
        if (!token) return;
        if (!form.name.trim() || !form.description.trim() || !form.categoryId) {
            setError("Completează câmpurile obligatorii: nume, descriere și categorie.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            await adminUpdateProduct(token, productId, {
                name: form.name,
                description: form.description,
                brand: form.brand,
                categoryId: form.categoryId,
                isActive: form.isActive,
                isShippable: form.isShippable,
                isDigital: form.isDigital,
                isReturnable: form.isReturnable,
            });
            router.push("/admin/products");
        } catch (e) {
            console.error(e);
            setError("Salvarea a eșuat. Încearcă din nou.");
        } finally {
            setSaving(false);
        }
    }

    if (loading) {
        return (
            <div className="flex flex-col gap-6">
                <div className="flex items-center gap-4">
                    <Link href="/admin/products" className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors">
                        <ArrowLeft size={18} />
                    </Link>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Editează produs</h1>
                </div>
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <p className="text-gray-400 dark:text-gray-500">Se încarcă...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
                <Link
                    href="/admin/products"
                    className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-900 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors"
                >
                    <ArrowLeft size={18} />
                </Link>
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Editează produs</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{form.name}</p>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                <div className="flex flex-col gap-4 max-w-2xl">
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nume <span className="text-red-500">*</span>
                        </label>
                        <input
                            type="text"
                            value={form.name}
                            onChange={(e) => setField("name", e.target.value)}
                            className={inputClass}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                            Descriere <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={form.description}
                            onChange={(e) => setField("description", e.target.value)}
                            rows={4}
                            className={`${inputClass} resize-none`}
                        />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Brand</label>
                            <input
                                type="text"
                                value={form.brand}
                                onChange={(e) => setField("brand", e.target.value)}
                                className={inputClass}
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                Categorie <span className="text-red-500">*</span>
                            </label>
                            <select
                                value={form.categoryId}
                                onChange={(e) => setField("categoryId", e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Selectează o categorie</option>
                                {categories.map((c) => (
                                    <option key={c.categoryId} value={c.categoryId}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    <div className="flex flex-col gap-3 pt-2">
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Setări produs</p>
                        <div className="grid grid-cols-2 gap-3">
                            <Toggle checked={form.isActive} onChange={(v) => setField("isActive", v)} label="Activ" />
                            <Toggle checked={form.isShippable} onChange={(v) => setField("isShippable", v)} label="Cu livrare" />
                            <Toggle checked={form.isDigital} onChange={(v) => setField("isDigital", v)} label="Digital" />
                            <Toggle checked={form.isReturnable} onChange={(v) => setField("isReturnable", v)} label="Returnabil" />
                        </div>
                    </div>

                    {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <Check size={15} />
                            {saving ? "Se salvează..." : "Salvează modificările"}
                        </button>
                        <Link
                            href="/admin/products"
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Anulează
                        </Link>
                    </div>
                </div>
            </div>
        </div>
    );
}
