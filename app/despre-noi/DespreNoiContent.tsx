"use client";

import { useRef, useState } from "react";
import Image from "next/image";
import { useAuth } from "@/context/AuthContext";
import { AboutPageContent, AboutPageSection, setAboutPage } from "@/lib/api/settings";
import { adminUploadImage } from "@/lib/api/admin";
import { Pencil, X, Check, Plus, Trash2, Loader2, ImagePlus } from "lucide-react";

function emptySection(): AboutPageSection {
    return { heading: "", content: "", imageUrl: undefined };
}

export default function DespreNoiContent({ initialContent }: { initialContent: AboutPageContent }) {
    const { user, token } = useAuth();
    const isAdmin = user?.role === "Admin";

    const [editing, setEditing] = useState(false);
    const [draft, setDraft] = useState<AboutPageContent>(initialContent);
    const [live, setLive] = useState<AboutPageContent>(initialContent);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [uploadingIdx, setUploadingIdx] = useState<number | null>(null);
    const fileRefs = useRef<(HTMLInputElement | null)[]>([]);

    function startEdit() {
        setDraft(live);
        setError(null);
        setEditing(true);
    }

    function cancelEdit() {
        setDraft(live);
        setEditing(false);
        setError(null);
    }

    async function handleSave() {
        if (!token) return;
        setSaving(true);
        setError(null);
        try {
            await setAboutPage(token, draft);
            setLive(draft);
            setEditing(false);
        } catch {
            setError("Nu s-a putut salva conținutul.");
        } finally {
            setSaving(false);
        }
    }

    function updateSection(i: number, field: keyof AboutPageSection, value: string | undefined) {
        setDraft((prev) => {
            const sections = [...prev.sections];
            sections[i] = { ...sections[i], [field]: value };
            return { ...prev, sections };
        });
    }

    function addSection() {
        setDraft((prev) => ({ ...prev, sections: [...prev.sections, emptySection()] }));
    }

    function removeSection(i: number) {
        setDraft((prev) => ({ ...prev, sections: prev.sections.filter((_, idx) => idx !== i) }));
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

    const content = editing ? draft : live;

    return (
        <div className="max-w-2xl mx-auto py-16 px-4">
            {/* Title row */}
            <div className="flex items-start justify-between gap-4 mb-4">
                {editing ? (
                    <input
                        type="text"
                        value={draft.title}
                        onChange={(e) => setDraft((p) => ({ ...p, title: e.target.value }))}
                        placeholder="Despre noi"
                        className="flex-1 text-3xl font-bold text-gray-900 dark:text-gray-100 bg-transparent border-b-2 border-indigo-400 focus:outline-none pb-1"
                    />
                ) : (
                    <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
                        {content.title || "Despre noi"}
                    </h1>
                )}

                {isAdmin && (
                    <div className="flex items-center gap-2 shrink-0 mt-1">
                        {editing ? (
                            <>
                                <button
                                    onClick={cancelEdit}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                                >
                                    <X size={13} />
                                    Anulează
                                </button>
                                <button
                                    onClick={handleSave}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 hover:bg-gray-700 dark:hover:bg-gray-300 disabled:opacity-60 transition-colors"
                                >
                                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Check size={13} />}
                                    {saving ? "Se salvează..." : "Salvează"}
                                </button>
                            </>
                        ) : (
                            <button
                                onClick={startEdit}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                            >
                                <Pencil size={13} />
                                Editează
                            </button>
                        )}
                    </div>
                )}
            </div>

            {/* Subtitle */}
            {editing ? (
                <textarea
                    value={draft.subtitle}
                    onChange={(e) => setDraft((p) => ({ ...p, subtitle: e.target.value }))}
                    placeholder="O scurtă descriere introductivă..."
                    rows={3}
                    className="w-full text-lg text-gray-500 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none mb-8"
                />
            ) : (
                content.subtitle && (
                    <p className="text-lg text-gray-500 dark:text-gray-400 mb-10 leading-relaxed">
                        {content.subtitle}
                    </p>
                )
            )}

            {/* Empty state */}
            {!editing && content.sections.length === 0 && !content.subtitle && (
                <p className="text-gray-400 dark:text-gray-500">Pagină în construcție.</p>
            )}

            {/* Sections */}
            <div className="flex flex-col gap-10">
                {(editing ? draft : live).sections.map((section, i) => (
                    <div key={i} className={editing ? "flex flex-col gap-3 p-4 rounded-xl border border-dashed border-gray-200 dark:border-gray-700" : "flex flex-col gap-3"}>
                        {editing && (
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-medium text-gray-400 dark:text-gray-500">Secțiunea {i + 1}</span>
                                <button
                                    onClick={() => removeSection(i)}
                                    className="p-1 rounded-lg text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-950 transition-colors"
                                >
                                    <Trash2 size={14} />
                                </button>
                            </div>
                        )}

                        {/* Heading */}
                        {editing ? (
                            <input
                                type="text"
                                value={section.heading}
                                onChange={(e) => updateSection(i, "heading", e.target.value)}
                                placeholder="Titlu secțiune (opțional)"
                                className="text-xl font-semibold text-gray-900 dark:text-gray-100 bg-transparent border-b border-gray-200 dark:border-gray-700 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 pb-1"
                            />
                        ) : (
                            section.heading && (
                                <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                                    {section.heading}
                                </h2>
                            )
                        )}

                        {/* Image */}
                        {editing ? (
                            <div>
                                {section.imageUrl ? (
                                    <div className="relative rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
                                        <Image
                                            src={section.imageUrl}
                                            alt={section.heading || `Imagine ${i + 1}`}
                                            width={800}
                                            height={450}
                                            className="w-full object-cover max-h-72"
                                            unoptimized
                                        />
                                        <button
                                            onClick={() => updateSection(i, "imageUrl", undefined)}
                                            className="absolute top-2 right-2 p-1.5 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
                                        >
                                            <X size={13} />
                                        </button>
                                    </div>
                                ) : (
                                    <button
                                        onClick={() => fileRefs.current[i]?.click()}
                                        disabled={uploadingIdx === i}
                                        className="w-full flex items-center justify-center gap-2 py-4 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors disabled:opacity-50"
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
                        ) : (
                            section.imageUrl && (
                                <div className="rounded-xl overflow-hidden">
                                    <Image
                                        src={section.imageUrl}
                                        alt={section.heading || `Imagine ${i + 1}`}
                                        width={800}
                                        height={450}
                                        className="w-full object-cover"
                                        unoptimized
                                    />
                                </div>
                            )
                        )}

                        {/* Content */}
                        {editing ? (
                            <textarea
                                value={section.content}
                                onChange={(e) => updateSection(i, "content", e.target.value)}
                                placeholder="Conținut secțiune..."
                                rows={5}
                                className="w-full text-gray-600 dark:text-gray-400 leading-relaxed bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl px-3 py-2 focus:outline-none focus:border-gray-400 dark:focus:border-gray-500 resize-none"
                            />
                        ) : (
                            section.content && (
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
                                    {section.content}
                                </p>
                            )
                        )}
                    </div>
                ))}

                {/* Add section button (edit mode only) */}
                {editing && (
                    <button
                        onClick={addSection}
                        className="flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 text-sm text-gray-400 dark:text-gray-500 hover:border-gray-400 dark:hover:border-gray-500 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                    >
                        <Plus size={15} />
                        Adaugă secțiune
                    </button>
                )}
            </div>

            {error && (
                <p className="mt-4 text-sm text-red-500 dark:text-red-400">{error}</p>
            )}
        </div>
    );
}
