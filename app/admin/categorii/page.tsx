"use client";

import { useEffect, useState } from "react";
import { Plus, Pencil, Trash2, X, Check } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetCategories,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
} from "@/lib/api/admin";

interface Category {
    categoryId: string;
    name: string;
    slug: string;
}

interface FormState {
    name: string;
    slug: string;
}

const emptyForm: FormState = { name: "", slug: "" };

function toSlug(value: string) {
    return value.toLowerCase().replace(/\s+/g, "-").replace(/[^a-z0-9-]/g, "");
}

export default function AdminCategoriiPage() {
    const { token } = useAuth();
    const [categories, setCategories] = useState<Category[]>([]);
    const [loading, setLoading] = useState(true);
    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [form, setForm] = useState<FormState>(emptyForm);
    const [saving, setSaving] = useState(false);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!token) return;
        adminGetCategories(token)
            .then(setCategories)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    function openCreate() {
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
        setShowForm(true);
    }

    function openEdit(cat: Category) {
        setEditingId(cat.categoryId);
        setForm({ name: cat.name, slug: cat.slug });
        setError(null);
        setShowForm(true);
    }

    function closeForm() {
        setShowForm(false);
        setEditingId(null);
        setForm(emptyForm);
        setError(null);
    }

    function handleNameChange(value: string) {
        setForm((prev) => ({
            name: value,
            slug: editingId ? prev.slug : toSlug(value),
        }));
    }

    async function handleSave() {
        if (!token) return;
        if (!form.name.trim() || !form.slug.trim()) {
            setError("Completează toate câmpurile.");
            return;
        }
        setSaving(true);
        setError(null);
        try {
            if (editingId) {
                await adminUpdateCategory(token, editingId, { name: form.name, slug: form.slug });
                setCategories((prev) =>
                    prev.map((c) =>
                        c.categoryId === editingId ? { ...c, name: form.name, slug: form.slug } : c
                    )
                );
            } else {
                const id = await adminCreateCategory(token, { name: form.name, slug: form.slug });
                setCategories((prev) => [...prev, { categoryId: id, name: form.name, slug: form.slug }]);
            }
            closeForm();
        } catch (e) {
            setError("Operațiunea a eșuat. Încearcă din nou.");
            console.error(e);
        } finally {
            setSaving(false);
        }
    }

    async function handleDelete(cat: Category) {
        if (!token) return;
        if (!window.confirm(`Ștergi categoria "${cat.name}"?`)) return;
        setDeletingId(cat.categoryId);
        try {
            await adminDeleteCategory(token, cat.categoryId);
            setCategories((prev) => prev.filter((c) => c.categoryId !== cat.categoryId));
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
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Categorii</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{categories.length} categorii în catalog</p>
                </div>
                {!showForm && (
                    <button
                        onClick={openCreate}
                        className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                    >
                        <Plus size={16} />
                        Categorie nouă
                    </button>
                )}
            </div>

            {showForm && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6">
                    <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100 mb-4">
                        {editingId ? "Editează categoria" : "Categorie nouă"}
                    </h2>
                    <div className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Nume</label>
                                <input
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    placeholder="ex. Îmbrăcăminte"
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => setForm((prev) => ({ ...prev, slug: toSlug(e.target.value) }))}
                                    placeholder="ex. imbracaminte"
                                    className="px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100"
                                />
                            </div>
                        </div>
                        {error && (
                            <p className="text-sm text-red-500 dark:text-red-400">{error}</p>
                        )}
                        <div className="flex items-center gap-3">
                            <button
                                onClick={handleSave}
                                disabled={saving}
                                className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                            >
                                <Check size={15} />
                                {saving ? "Se salvează..." : "Salvează"}
                            </button>
                            <button
                                onClick={closeForm}
                                disabled={saving}
                                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                            >
                                <X size={15} />
                                Anulează
                            </button>
                        </div>
                    </div>
                </div>
            )}

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Se încarcă...</div>
                ) : categories.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Nicio categorie găsită.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-6 py-4 font-semibold">Nume</th>
                                <th className="px-6 py-4 font-semibold">Slug</th>
                                <th className="px-6 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {categories.map((cat) => (
                                <tr key={cat.categoryId} className="hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                                    <td className="px-6 py-4 font-medium text-gray-900 dark:text-gray-100">{cat.name}</td>
                                    <td className="px-6 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{cat.slug}</td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <button
                                                onClick={() => openEdit(cat)}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                                                title="Editează"
                                            >
                                                <Pencil size={15} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(cat)}
                                                disabled={deletingId === cat.categoryId}
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
