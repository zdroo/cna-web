"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateProfile, UserProfile } from "@/lib/api/user";
import { forgotPassword } from "@/lib/api/auth";
import { ArrowLeft, Loader2, User, Lock, CheckCircle, Mail } from "lucide-react";
import Link from "next/link";

export default function SettingsPage() {
    const { user, token, isLoaded } = useAuth();
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const [firstName, setFirstName] = useState("");
    const [lastName, setLastName] = useState("");
    const [profileSaving, setProfileSaving] = useState(false);
    const [profileSuccess, setProfileSuccess] = useState(false);
    const [profileError, setProfileError] = useState<string | null>(null);

    const [resetSending, setResetSending] = useState(false);
    const [resetSent, setResetSent] = useState(false);
    const [resetError, setResetError] = useState<string | null>(null);

    useEffect(() => {
        if (!isLoaded || !user || !token) return;
        getUserProfile(token)
            .then((p) => {
                setProfile(p);
                setFirstName(p.firstName ?? "");
                setLastName(p.lastName ?? "");
            })
            .catch(() => {})
            .finally(() => setLoading(false));
    }, [isLoaded, user, token]);

    async function handleProfileSave(e: React.FormEvent) {
        e.preventDefault();
        setProfileSaving(true);
        setProfileError(null);
        setProfileSuccess(false);
        try {
            await updateProfile(token!, firstName, lastName);
            setProfileSuccess(true);
            setTimeout(() => setProfileSuccess(false), 3000);
        } catch (err: unknown) {
            setProfileError(err instanceof Error ? err.message : "Eroare necunoscută");
        } finally {
            setProfileSaving(false);
        }
    }

    async function handleSendResetEmail() {
        if (!profile?.email) return;
        setResetSending(true);
        setResetError(null);
        setResetSent(false);
        try {
            await forgotPassword(profile.email);
            setResetSent(true);
        } catch {
            setResetError("Nu s-a putut trimite emailul. Încearcă din nou.");
        } finally {
            setResetSending(false);
        }
    }

    if (!isLoaded) return null;

    return (
        <div className="max-w-lg mx-auto flex flex-col gap-6">
            <div className="flex items-center gap-3">
                <Link href="/profil" className="text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors">
                    <ArrowLeft size={20} />
                </Link>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Setări cont</h1>
            </div>

            {loading ? (
                <div className="flex justify-center py-12">
                    <Loader2 size={24} className="animate-spin text-gray-400" />
                </div>
            ) : (
                <>
                    {/* Personal info */}
                    <form
                        onSubmit={handleProfileSave}
                        className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4"
                    >
                        <div className="flex items-center gap-2 mb-1">
                            <User size={18} className="text-gray-500 dark:text-gray-400" />
                            <h2 className="font-semibold text-gray-900 dark:text-gray-100">Informații personale</h2>
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Prenume" value={firstName} onChange={setFirstName} />
                            <InputField label="Nume" value={lastName} onChange={setLastName} />
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">Email</label>
                            <p className="text-sm text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 bg-gray-50 dark:bg-gray-800">
                                {profile?.email}
                            </p>
                        </div>

                        {profileError && <p className="text-sm text-red-500">{profileError}</p>}
                        {profileSuccess && (
                            <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                <CheckCircle size={14} /> Profil actualizat cu succes.
                            </p>
                        )}

                        <button
                            type="submit"
                            disabled={profileSaving}
                            className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60"
                        >
                            {profileSaving ? "Se salvează..." : "Salvează"}
                        </button>
                    </form>

                    {/* Password reset via email */}
                    {profile && !profile.isGoogleUser && (
                        <div className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4">
                            <div className="flex items-center gap-2 mb-1">
                                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Schimbă parola</h2>
                            </div>

                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                Îți vom trimite un link de resetare la adresa{" "}
                                <span className="font-medium text-gray-700 dark:text-gray-300">{profile.email}</span>.
                                Linkul este valabil 1 oră.
                            </p>

                            {resetSent ? (
                                <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-xl px-4 py-3">
                                    <CheckCircle size={16} className="text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                                    <p className="text-sm text-green-700 dark:text-green-300">
                                        Emailul a fost trimis. Verifică căsuța de intrare și urmează instrucțiunile.
                                    </p>
                                </div>
                            ) : (
                                <>
                                    {resetError && (
                                        <p className="text-sm text-red-500 bg-red-50 dark:bg-red-950 border border-red-200 dark:border-red-800 rounded-xl px-4 py-3">
                                            {resetError}
                                        </p>
                                    )}
                                    <button
                                        onClick={handleSendResetEmail}
                                        disabled={resetSending}
                                        className="w-full flex items-center justify-center gap-2 border border-gray-200 dark:border-gray-700 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-60"
                                    >
                                        {resetSending ? (
                                            <Loader2 size={15} className="animate-spin" />
                                        ) : (
                                            <Mail size={15} />
                                        )}
                                        {resetSending ? "Se trimite..." : "Trimite link de resetare"}
                                    </button>
                                </>
                            )}
                        </div>
                    )}

                    {profile?.isGoogleUser && (
                        <div className="bg-blue-50 dark:bg-blue-950 border border-blue-100 dark:border-blue-900 rounded-2xl p-4 text-sm text-blue-700 dark:text-blue-300">
                            Contul tău este autentificat prin Google. Parola se gestionează din contul tău Google.
                        </div>
                    )}
                </>
            )}
        </div>
    );
}

function InputField({
    label,
    value,
    onChange,
    type = "text",
    required,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    type?: string;
    required?: boolean;
}) {
    return (
        <div className="flex flex-col gap-1">
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
            <input
                type={type}
                value={value}
                onChange={(e) => onChange(e.target.value)}
                required={required}
                className="border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-300 dark:focus:ring-gray-600"
            />
        </div>
    );
}
