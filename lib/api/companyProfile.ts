import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface CompanyProfile {
    id: string;
    companyName: string;
    cui: string;
    jNumber?: string;
    isVATRegistered: boolean;
    vatNumber?: string;
    billingAddressLine1: string;
    billingAddressLine2?: string;
    billingCity: string;
    billingRegion: string;
    billingPostalCode: string;
    billingCountryCode: string;
}

export async function getCompanyProfile(token: string): Promise<CompanyProfile | null> {
    const res = await authFetch(`${BASE}/api/company-profile`, {
        cache: "no-store",
    }, token);
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Nu s-a putut încărca profilul de companie");
    return res.json();
}

export async function upsertCompanyProfile(token: string, data: Omit<CompanyProfile, "id">): Promise<void> {
    const res = await authFetch(`${BASE}/api/company-profile`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut salva profilul de companie");
}

export async function deleteCompanyProfile(token: string): Promise<void> {
    const res = await authFetch(`${BASE}/api/company-profile`, {
        method: "DELETE",
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut șterge profilul de companie");
}
