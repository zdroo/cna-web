"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Plus, Pencil, Trash2, ExternalLink, Upload, FileText, AlertCircle, CheckCircle2, Download, X } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
    adminGetProducts,
    adminDeleteProduct,
    adminDeleteProductsBatch,
    adminImportProducts,
    type ProductImportRow,
    type ProductImportResult,
} from "@/lib/api/admin";

interface Product {
    productId: string;
    productSlug: string;
    name: string;
    categoryName: string;
    minPrice: number;
    maxPrice: number;
    isActive?: boolean;
}

const SAMPLE_CSV = `name,slug,description,categorySlug
Tricou Sport,tricou-sport,Tricou din bumbac 100% pentru activități sportive,sport
Pantaloni Jogging,pantaloni-jogging,Pantaloni confortabili pentru alergare și sport,sport
Adidași Running,adidasi-running,Încălțăminte ușoară pentru alergare,incaltaminte
`;

function downloadSampleCsv() {
    const blob = new Blob([SAMPLE_CSV], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "produse-exemplu.csv";
    a.click();
    URL.revokeObjectURL(url);
}

function parseCsv(text: string): ProductImportRow[] {
    const lines = text.trim().split(/\r?\n/);
    if (lines.length === 0) return [];
    const firstLower = lines[0].toLowerCase();
    const hasHeader = firstLower.startsWith("name") || firstLower.startsWith("nume");
    const dataLines = hasHeader ? lines.slice(1) : lines;
    return dataLines
        .map(line => line.trim())
        .filter(Boolean)
        .map(line => {
            const parts = line.split(",").map(s => s.trim().replace(/^"|"$/g, ""));
            const [name = "", slug = "", description = "", categorySlug = ""] = parts;
            return { name, slug, description, categorySlug };
        })
        .filter(row => row.name);
}

export default function AdminProductsPage() {
    const { token } = useAuth();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingId, setDeletingId] = useState<string | null>(null);

    const [selected, setSelected] = useState<Set<string>>(new Set());
    const [batchDeleting, setBatchDeleting] = useState(false);

    const fileInputRef = useRef<HTMLInputElement>(null);
    const [importRows, setImportRows] = useState<ProductImportRow[] | null>(null);
    const [importing, setImporting] = useState(false);
    const [importResult, setImportResult] = useState<ProductImportResult | null>(null);

    useEffect(() => {
        if (!token) return;
        adminGetProducts(token)
            .then(setProducts)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, [token]);

    async function handleDelete(productId: string, name: string) {
        if (!token) return;
        if (!confirm(`Ștergi produsul "${name}"?`)) return;
        setDeletingId(productId);
        try {
            await adminDeleteProduct(token, productId);
            setProducts((prev) => prev.filter((p) => p.productId !== productId));
            setSelected((prev) => { const s = new Set(prev); s.delete(productId); return s; });
        } catch (e) {
            console.error(e);
            alert("Ștergerea a eșuat.");
        } finally {
            setDeletingId(null);
        }
    }

    async function handleBatchDelete() {
        if (!token || selected.size === 0) return;
        if (!confirm(`Ștergi ${selected.size} ${selected.size === 1 ? "produs" : "produse"}?`)) return;
        setBatchDeleting(true);
        try {
            await adminDeleteProductsBatch(token, Array.from(selected));
            setProducts((prev) => prev.filter((p) => !selected.has(p.productId)));
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
        setSelected(selected.size === products.length ? new Set() : new Set(products.map(p => p.productId)));
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (ev) => {
            const text = ev.target?.result as string;
            setImportRows(parseCsv(text));
            setImportResult(null);
        };
        reader.readAsText(file, "utf-8");
        e.target.value = "";
    }

    function openImport() {
        setImportRows(null);
        setImportResult(null);
        fileInputRef.current?.click();
    }

    async function handleImport() {
        if (!token || !importRows) return;
        setImporting(true);
        try {
            const result = await adminImportProducts(token, importRows);
            setImportResult(result);
            if (result.created > 0) {
                const fresh = await adminGetProducts(token);
                setProducts(fresh);
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

            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Produse</h1>
                    <p className="text-gray-500 dark:text-gray-400 mt-1">{products.length} produse în catalog</p>
                </div>
                {!importRows && !importResult && (
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
                        <Link
                            href="/admin/products/new"
                            className="flex items-center gap-2 bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 rounded-xl text-sm font-semibold hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors"
                        >
                            <Plus size={16} />
                            Produs nou
                        </Link>
                    </div>
                )}
            </div>

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
                                    {importRows.length} {importRows.length === 1 ? "produs detectat" : "produse detectate"}
                                </p>
                                <p className="text-sm text-gray-500 dark:text-gray-400">Verifică datele înainte de import</p>
                            </div>
                        </div>
                        <button onClick={() => setImportRows(null)} className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
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
                                    <th className="px-4 py-2.5 font-semibold">Descriere</th>
                                    <th className="px-4 py-2.5 font-semibold">Categorie</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {importRows.map((row, i) => (
                                    <tr key={i} className="bg-white dark:bg-gray-900">
                                        <td className="px-4 py-2.5 text-gray-400 dark:text-gray-500 tabular-nums">{i + 1}</td>
                                        <td className="px-4 py-2.5 font-medium text-gray-900 dark:text-gray-100">{row.name}</td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{row.slug || <span className="italic text-gray-300 dark:text-gray-600">auto</span>}</td>
                                        <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 max-w-xs truncate">{row.description}</td>
                                        <td className="px-4 py-2.5 font-mono text-xs text-gray-500 dark:text-gray-400">{row.categorySlug}</td>
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
                            {importing ? "Se importă..." : `Importă ${importRows.length} ${importRows.length === 1 ? "produs" : "produse"}`}
                        </button>
                        <button
                            onClick={() => setImportRows(null)}
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
                                    {importResult.created} {importResult.created === 1 ? "produs creat" : "produse create"}
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
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Se încarcă...</div>
                ) : products.length === 0 ? (
                    <div className="py-16 text-center text-gray-400 dark:text-gray-500">Niciun produs găsit.</div>
                ) : (
                    <table className="w-full text-sm">
                        <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-800 text-left text-xs text-gray-400 dark:text-gray-500 uppercase tracking-wide">
                                <th className="px-4 py-4 w-10">
                                    <input
                                        type="checkbox"
                                        checked={products.length > 0 && selected.size === products.length}
                                        onChange={toggleSelectAll}
                                        className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                    />
                                </th>
                                <th className="px-4 py-4 font-semibold">Produs</th>
                                <th className="px-4 py-4 font-semibold">Categorie</th>
                                <th className="px-4 py-4 font-semibold">Preț</th>
                                <th className="px-4 py-4 font-semibold text-right">Acțiuni</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                            {products.map((product) => (
                                <tr key={product.productId} className={`hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${selected.has(product.productId) ? "bg-gray-50 dark:bg-gray-800/60" : ""}`}>
                                    <td className="px-4 py-4">
                                        <input
                                            type="checkbox"
                                            checked={selected.has(product.productId)}
                                            onChange={() => toggleSelect(product.productId)}
                                            className="w-4 h-4 rounded accent-gray-900 dark:accent-gray-100"
                                        />
                                    </td>
                                    <td className="px-4 py-4">
                                        <span className="font-medium text-gray-900 dark:text-gray-100">{product.name}</span>
                                        <span className="text-gray-400 dark:text-gray-500 text-xs block mt-0.5">{product.productSlug}</span>
                                    </td>
                                    <td className="px-4 py-4 text-gray-600 dark:text-gray-400">{product.categoryName}</td>
                                    <td className="px-4 py-4 text-gray-900 dark:text-gray-100 font-medium">
                                        {product.minPrice === product.maxPrice
                                            ? `${product.minPrice.toFixed(2)} lei`
                                            : `${product.minPrice.toFixed(2)} – ${product.maxPrice.toFixed(2)} lei`}
                                    </td>
                                    <td className="px-4 py-4">
                                        <div className="flex items-center justify-end gap-2">
                                            <Link
                                                href={`/products/${product.productSlug}`}
                                                target="_blank"
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg transition-colors"
                                                title="Vezi în magazin"
                                            >
                                                <ExternalLink size={15} />
                                            </Link>
                                            <Link
                                                href={`/admin/products/${product.productId}/edit`}
                                                className="p-2 text-gray-400 dark:text-gray-500 hover:text-blue-600 dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-950 rounded-lg transition-colors"
                                                title="Editează"
                                            >
                                                <Pencil size={15} />
                                            </Link>
                                            <button
                                                onClick={() => handleDelete(product.productId, product.name)}
                                                disabled={deletingId === product.productId}
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
