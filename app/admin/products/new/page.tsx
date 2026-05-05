"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";
import { adminGetCategories, adminCreateProduct } from "@/lib/api/admin";

interface Category { categoryId: string; name: string; }

interface FormState {
    name: string;
    description: string;
    brand: string;
    categoryId: string;
}

const inputClass = "px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

export default function AdminNewProductPage() {
    const { token } = useAuth();
    const router = useRouter();
    const [categories, setCategories] = useState<Category[]>([]);
    const [form, setForm] = useState<FormState>({ name: "", description: "", brand: "", categoryId: "" });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        adminGetCategories(token)
            .then((cats: Category[]) => {
                setCategories(cats);
                if (cats.length > 0) setForm((f) => ({ ...f, categoryId: cats[0].categoryId }));
            })
            .catch(console.error);
    }, [token]);

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
            await adminCreateProduct(token, {
                name: form.name,
                description: form.description,
                brand: form.brand,
                categoryId: form.categoryId,
            });
            router.push("/admin/products");
        } catch (e) {
            console.error(e);
            setError("Crearea produsului a eșuat. Încearcă din nou.");
        } finally {
            setSaving(false);
        }
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Produs nou</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">Adaugă un produs nou în catalog</p>
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
                            placeholder="ex. Tricou Sport"
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
                            placeholder="Descriere produs..."
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
                                placeholder="ex. Nike"
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

                    {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}

                    <div className="flex items-center gap-3 pt-2">
                        <button
                            onClick={handleSave}
                            disabled={saving}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <Check size={15} />
                            {saving ? "Se salvează..." : "Creează produsul"}
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
