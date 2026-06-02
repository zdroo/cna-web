"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getAboutPage, setAboutPage, AboutPageContent, AboutPageSection } from "@/lib/api/settings";
import { adminUploadImage } from "@/lib/api/admin";
import { FileText, Plus, Trash2, Loader2, Check, ImagePlus, X } from "lucide-react";
import Image from "next/image";

function emptySection(): AboutPageSection {
    return { heading: "", content: "", imageUrl: undefined };
}

export default function AdminDespreNoiPage() {
    const { user, token, isLoaded } = useAuth();
    const router = useRouter();

    const [content, setContent] = useState<AboutPageContent>({ title: "", subtitle: "", sections: [] });
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [saved, setSaved] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

    useEffect(() => {
        if (!isLoaded) return;
        if (!user || user.role !== "Admin") {
            setLoading(false);
            router.replace("/admin");
            return;
        }
        getAboutPage()
            .then(setContent)
            .catch(() => setError("Nu s-au putut încărca datele."))
            .finally(() => setLoading(false));
    }, [isLoaded, user, router]);

    async function handleSave() {
        if (!token) return;
        setSaving(true);
        setError(null);
        setSaved(false);
        try {
            await setAboutPage(token, content);
            setSaved(true);
            setTimeout(() => setSaved(false), 3000);
        } catch {
            setError("Nu s-a putut salva conținutul.");
        } finally {
            setSaving(false);
        }
    }

    function updateSection(i: number, field: keyof AboutPageSection, value: string | undefined) {
        setContent((prev) => {
            const sections = [...prev.sections];
            sections[i] = { ...sections[i], [field]: value };
            return { ...prev, sections };
        });
    }

    function addSection() {
        setContent((prev) => ({ ...prev, sections: [...prev.sections, emptySection()] }));
    }

    function removeSection(i: number) {
        setContent((prev) => ({ ...prev, sections: prev.sections.filter((_, idx) => idx !== i) }));
    }

    async function handleImageSelect(i: number, file: File) {
        if (!token) return;
        setUploadingIdx(i);
        try {
            const { url } = await adminUploadImage(token, file);
            updateSection(i, "imageUrl", url);
        } catch {
            setError("Nu s-a putut încărca imaginea.");
        } finally {
            setUploadingIdx(null);
        }
    }

    if (!isLoaded || loading) {
        return (
            <div className="flex items-center justify-center py-24">
                <Loader2 size={28} className="animate-spin text-gray-400" />
            </div>
        );
    }

    return (
        <div className="flex flex-col gap-6 max-w-2xl">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Pagina „Despre noi"</h1>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Conținut afișat pe pagina publică /despre-noi</p>
                </div>
                <div className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950">
                    <FileText size={22} className="text-indigo-600 dark:text-indigo-400" />
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 flex flex-col gap-5">
                {/* Title */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Titlu</label>
                    <input
                        type="text"
                        value={content.title}
                        onChange={(e) => setContent((prev) => ({ ...prev, title: e.target.value }))}
                        placeholder="Despre noi"
                        className="px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                    />
                </div>

                {/* Subtitle */}
                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subtitlu</label>
                    <textarea
                        value={content.subtitle}
                        onChange={(e) => setContent((prev) => ({ ...prev, subtitle: e.target.value }))}
                        placeholder="O scurtă descriere introductivă..."
                        rows={3}
                        className="px-3.5 py-2.5 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors resize-none"
                    />
                </div>

                {/* Sections */}
                <div className="flex flex-col gap-4">
                    <div className="flex items-center justify-between">
                        <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Secțiuni</span>
                        <button
                            onClick={addSection}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        >
                            <Plus size={13} />
                            Adaugă secțiune
                        </button>
                    </div>

                    {content.sections.length === 0 && (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">Nicio secțiune adăugată.</p>
                    )}

                    {content.sections.map((section, i) => (
                        <div key={i} className="flex flex-col gap-3 p-4 rounded-xl border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Secțiunea {i + 1}</span>
                                <button
                                    onClick={() => removeSection(i)}
                                    className="p-1 rounded-lg text-gray-400 dark:text-gray-500 hover:text-red-500 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                    title="Șterge secțiunea"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>

                            {/* Heading */}
                            <input
                                type="text"
                                value={section.heading}
                                onChange={(e) => updateSection(i, "heading", e.target.value)}
                                placeholder="Titlu secțiune (opțional)"
                                className="px-3.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors"
                            />

                            {/* Image */}
                            <div className="flex flex-col gap-2">
                                {section.imageUrl ? (
                                    <div className="relative rounded-lg overflow-hidden border border-gray-200 dark:border-gray-700 bg-gray-100 dark:bg-gray-800">
                                        <Image
                                            src={section.imageUrl}
                                            alt={section.heading || `Imagine secțiunea ${i + 1}`}
                                            width={640}
                                            height={360}
                                            className="w-full object-cover max-h-60"
                                            unoptimized
                                        />
                                        <button
                                            onClick={() => updateSection(i, "imageUrl", undefined)}
                                            className="absolute top-2 right-2 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                            title="Elimină imaginea"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileRefs.current[i]?.click()}
                                        disabled={uploadingIdx === i}
                                        className="flex items-center justify-center gap-2 py-3 rounded-lg border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
                                    >
                                        {uploadingIdx === i
                                            ? <><Loader2 size={15} className="animate-spin" /> Se încarcă...</>
                                            : <><ImagePlus size={15} /> Adaugă imagine</>
                                        }
                                    </button>
                                )}
                                <input
                                    ref={(el) => { fileRefs.current[i] = el; }}
                                    type="file"
                                    accept="image/*"
                                    className="hidden"
                                    onChange={(e) => {
                                        const file = e.target.files?.[0];
                                        if (file) handleImageSelect(i, file);
                                        e.target.value = "";
                                    }}
                                />
                            </div>

                            {/* Content */}
                            <textarea
                                value={section.content}
                                onChange={(e) => updateSection(i, "content", e.target.value)}
                                placeholder="Conținut secțiune..."
                                rows={4}
                                className="px-3.5 py-2 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 transition-colors resize-none"
                            />
                        </div>
                    ))}
                </div>
            </div>

            {/* Footer actions */}
            <div className="flex items-center gap-3">
                <button
                    onClick={handleSave}
                    disabled={saving}
                    className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium rounded-xl bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-50 transition-colors"
                >
                    {saving ? <Loader2 size={15} className="animate-spin" /> : saved ? <Check size={15} /> : null}
                    {saving ? "Se salvează..." : saved ? "Salvat!" : "Salvează"}
                </button>

                {error && <p className="text-sm text-red-500 dark:text-red-400">{error}</p>}
            </div>
        </div>
    );
}
