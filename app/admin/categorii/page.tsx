"use client";

import { useEffect, useRef, useState } from "react";
import { Plus, Pencil, Trash2, X, Check, Upload, FileText, AlertCircle, CheckCircle2, Download } from "lucide-react";
import PageSpinner from "@/components/ui/PageSpinner";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetCategories,
    adminCreateCategory,
    adminUpdateCategory,
    adminDeleteCategory,
    adminDeleteCategoriesBatch,
    adminImportCategories,
    type CategoryImportRow,
    type CategoryImportResult,
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

const inputClass = "px-3 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 text-sm placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-gray-900 dark:focus:ring-gray-100";

function toSlug(value: string) {
    return value
        .toLowerCase()
        .replace(/[ăâ]/g, "a").replace(/î/g, "i")
        .replace(/[șş]/g, "s").replace(/[țţ]/g, "t")
        .replace(/\s+/g, "-")
        .replace(/[^a-z0-9-]/g, "")
        .replace(/-+/g, "-")
        .replace(/^-|-$/g, "");
}

const SAMPLE_CSV = `name,slug
Îmbrăcăminte,imbracaminte
Încălțăminte,incaltaminte
Electronice,electronice
Sport,sport
`;

function downloadSampleCsv() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "categorii-exemplu.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function parseCsv(text: string): CategoryImportRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    const firstLower = lines[0].toLowerCase();
    const hasHeader = firstLower.startsWith("name") || firstLower.startsWith("slug") || firstLower.startsWith("nume");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const [rawName = "", rawSlug = ""] = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
            const name = rawName;
            const slug = rawSlug || toSlug(name);
            return { name, slug };
        })
        .filter(row => row.name);
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

    // Selection state
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);

    // Import state
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importRows, setImportRows] = useState<CategoryImportRow[] | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<CategoryImportResult | null>(null);

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
        setImportRows(null);
        setImportResult(null);
    }

    function openEdit(cat: Category) {
        setEditingId(cat.categoryId);
        setForm({ name: cat.name, slug: cat.slug });
        setError(null);
        setShowForm(true);
        setImportRows(null);
        setImportResult(null);
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
            setSelected((prev) => { const s = new Set(prev); s.delete(cat.categoryId); return s; });
        } catch (e) {
            console.error(e);
            alert("Ștergerea a eșuat.");
        } finally {
            setDeletingId(null);
        }
    }

    async function handleBatchDelete() {
        if (!token || selected.size === 0) return;
        if (!window.confirm(`Ștergi ${selected.size} ${selected.size === 1 ? "categorie" : "categorii"}?`)) return;
        setBatchDeleting(true);
        try {
            await adminDeleteCategoriesBatch(token, Array.from(selected));
            setCategories((prev) => prev.filter((c) => !selected.has(c.categoryId)));
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
        setSelected(selected.size === categories.length ? new Set() : new Set(categories.map(c => c.categoryId)));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            const rows = parseCsv(text);
            setImportRows(rows);
            setImportResult(null);
        };
        reader.readAsText(file, "utf-8");
        e.target.value = "";
    }

    function openImport() {
        setShowForm(false);
        setImportRows(null);
        setImportResult(null);
        fileInputRef.current?.click();
    }

    function cancelImport() {
        setImportRows(null);
        setImportResult(null);
    }

    async function handleImport() {
        if (!token || !importRows) return;
        setImporting(true);
        try {
            const result = await adminImportCategories(token, importRows);
            setImportResult(result);
            if (result.created > 0) {
                const fresh = await adminGetCategories(token);
                setCategories(fresh);
            }
            setImportRows(null);
        } catch (e) {
            console.error(e);
            alert("Importul a eșuat. Încearcă din nou.");
        } finally {
            setImporting(false);
        }
    }

    return (
        <div className="flex flex-col gap-6">

            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Categorii</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{categories.length} categorii în catalog</p>
                </div>
                {!showForm && !importRows && !importResult && (
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
                        <input
                            ref={fileInputRef}
                            type="file"
                            accept=".csv,text/csv"
                            className="hidden"
                            onChange={handleFileChange}
                        />
                        <button
                            onClick={downloadSampleCsv}
                            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            title="Descarcă CSV de exemplu"
                        >
                            <Download size={15} />
                            Exemplu CSV
                        </button>
                        <button
                            onClick={openImport}
                            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2.5 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Upload size={15} />
                            Import CSV
                        </button>
                        <button
                            onClick={openCreate}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                        >
                            <Plus size={16} />
                            Categorie nouă
                        </button>
                    </div>
                )}
            </div>

            {/* Create / Edit form */}
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
                                    className={inputClass}
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Slug</label>
                                <input
                                    type="text"
                                    value={form.slug}
                                    onChange={(e) => setForm((prev) => ({ ...prev, slug: toSlug(e.target.value) }))}
                                    placeholder="ex. imbracaminte"
                                    className={inputClass}
                                />
                            </div>
                        </div>
                        {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
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

            {/* Import preview */}
            {importRows && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-blue-50 dark:bg-blue-950 flex items-center justify-center">
                                <FileText size={18} className="text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">
                                    {importRows.length} {importRows.length === 1 ? "categorie detectată" : "categorii detectate"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Verifică datele înainte de import</p>
                            </div>
                        </div>
                        <button onClick={cancelImport} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    <div className="max-h-64 overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800">
                        <table className="w-full text-sm">
                            <thead className="sticky top-0 bg-gray-50 dark:bg-gray-800">
                                <tr className="text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                    <th className="px-4 py-2.5 font-semibold">#</th>
                                    <th className="px-4 py-2.5 font-semibold">Nume</th>
                                    <th className="px-4 py-2.5 font-semibold">Slug</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {importRows.map((row, i) => (
                                    <tr key={i} className="bg-white dark:bg-gray-900">
                                        <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</td>
                                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{row.slug}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <div className="flex items-center gap-3">
                        <button
                            onClick={handleImport}
                            disabled={importing || importRows.length === 0}
                            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
                        >
                            <Upload size={15} />
                            {importing ? "Se importă..." : `Importă ${importRows.length} ${importRows.length === 1 ? "categorie" : "categorii"}`}
                        </button>
                        <button
                            onClick={cancelImport}
                            disabled={importing}
                            className="px-4 py-2.5 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
                        >
                            Anulează
                        </button>
                    </div>
                </div>
            )}

            {/* Import result */}
            {importResult && (
                <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-4">
                    <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-green-50 dark:bg-green-950 flex items-center justify-center">
                                <CheckCircle2 size={18} className="text-green-600 dark:text-green-400" />
                            </div>
                            <div>
                                <p className="font-semibold text-gray-900 dark:text-gray-100">Import finalizat</p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">
                                    {importResult.created} {importResult.created === 1 ? "categorie creată" : "categorii create"}
                                    {importResult.errors.length > 0 && `, ${importResult.errors.length} ${importResult.errors.length === 1 ? "eroare" : "erori"}`}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => setImportResult(null)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
                            <X size={16} />
                        </button>
                    </div>

                    {importResult.errors.length > 0 && (
                        <div className="flex flex-col gap-2">
                            <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Erori</p>
                            <div className="flex flex-col gap-1.5 max-h-40 overflow-y-auto">
                                {importResult.errors.map((err, i) => (
                                    <div key={i} className="flex items-start gap-2 text-sm text-red-600 dark:text-red-400">
                                        <AlertCircle size={14} className="mt-0.5 flex-shrink-0" />
                                        <span>Rândul {err.row}: {err.message}</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}

                    <div className="flex gap-2">
                        <button
                            onClick={() => { setImportResult(null); fileInputRef.current?.click(); }}
                            className="flex items-center gap-2 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 px-4 py-2 rounded-xl text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <Upload size={14} />
                            Import nou
                        </button>
                        <button
                            onClick={() => setImportResult(null)}
                            className="px-4 py-2 rounded-xl text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
                        >
                            Închide
                        </button>
                    </div>
                </div>
            )}

            {/* Table */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                {loading ? (
                    <PageSpinner className="py-16" />
                ) : categories.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Nicio categorie găsită.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={categories.length > 0 && selected.size === categories.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                    />
                                </th>
                                <th className="px-4 py-4 font-semibold">Nume</th>
                                <th className="px-4 py-4 font-semibold">Slug</th>
                                <th className="px-4 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {categories.map((cat) => (
                                <tr key={cat.categoryId} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selected.has(cat.categoryId) ? "bg-gray-50 dark:bg-gray-800/60" : ""}`}>
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(cat.categoryId)}
                                            onChange={() => toggleSelect(cat.categoryId)}
                                            className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                        />
                                    </td>
                                    <td className="px-4 py-4 font-medium text-gray-900 dark:text-gray-100">{cat.name}</td>
                                    <td className="px-4 py-4 text-gray-500 dark:text-gray-400 font-mono text-xs">{cat.slug}</td>
                                    <td className="px-4 py-4">
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
