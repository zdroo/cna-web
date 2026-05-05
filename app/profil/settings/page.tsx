"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/context/AuthContext";
import { getUserProfile, updateProfile, changePassword, UserProfile } from "@/lib/api/user";
import { ArrowLeft, Loader2, User, Lock, CheckCircle } from "lucide-react";
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

    const [currentPassword, setCurrentPassword] = useState("");
    const [newPassword, setNewPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [passwordSaving, setPasswordSaving] = useState(false);
    const [passwordSuccess, setPasswordSuccess] = useState(false);
    const [passwordError, setPasswordError] = useState<string | null>(null);

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

    async function handlePasswordSave(e: React.FormEvent) {
        e.preventDefault();
        setPasswordError(null);
        setPasswordSuccess(false);
        if (newPassword !== confirmPassword) {
            setPasswordError("Parolele nu coincid.");
            return;
        }
        if (newPassword.length < 6) {
            setPasswordError("Parola nouă trebuie să aibă cel puțin 6 caractere.");
            return;
        }
        setPasswordSaving(true);
        try {
            await changePassword(token!, currentPassword, newPassword);
            setPasswordSuccess(true);
            setCurrentPassword("");
            setNewPassword("");
            setConfirmPassword("");
            setTimeout(() => setPasswordSuccess(false), 3000);
        } catch (err: unknown) {
            setPasswordError(err instanceof Error ? err.message : "Eroare necunoscută");
        } finally {
            setPasswordSaving(false);
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
                    {/* Profil */}
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

                    {/* Schimbare parolă */}
                    {profile && !profile.isGoogleUser && (
                        <form
                            onSubmit={handlePasswordSave}
                            className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl p-5 flex flex-col gap-4"
                        >
                            <div className="flex items-center gap-2 mb-1">
                                <Lock size={18} className="text-gray-500 dark:text-gray-400" />
                                <h2 className="font-semibold text-gray-900 dark:text-gray-100">Schimbă parola</h2>
                            </div>

                            <InputField label="Parola curentă" value={currentPassword} onChange={setCurrentPassword} type="password" required />
                            <InputField label="Parola nouă" value={newPassword} onChange={setNewPassword} type="password" required />
                            <InputField label="Confirmă parola nouă" value={confirmPassword} onChange={setConfirmPassword} type="password" required />

                            {passwordError && <p className="text-sm text-red-500">{passwordError}</p>}
                            {passwordSuccess && (
                                <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-1.5">
                                    <CheckCircle size={14} /> Parola a fost schimbată.
                                </p>
                            )}

                            <button
                                type="submit"
                                disabled={passwordSaving}
                                className="w-full bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 py-2.5 rounded-xl font-semibold hover:bg-gray-700 dark:hover:bg-gray-300 transition-colors disabled:opacity-60"
                            >
                                {passwordSaving ? "Se salvează..." : "Schimbă parola"}
                            </button>
                        </form>
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
