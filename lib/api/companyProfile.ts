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
    const res = await fetch(`${BASE}/api/company-profile`, {
        headers: { Authorization: `Bearer ${token}` },
        cache: "no-store",
    });
    if (res.status === 404) return null;
    if (!res.ok) throw new Error("Nu s-a putut încărca profilul de companie");
    return res.json();
}

export async function upsertCompanyProfile(token: string, data: Omit<CompanyProfile, "id">): Promise<void> {
    const res = await fetch(`${BASE}/api/company-profile`, {
        method: "PUT",
        headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("Nu s-a putut salva profilul de companie");
}

export async function deleteCompanyProfile(token: string): Promise<void> {
    const res = await fetch(`${BASE}/api/company-profile`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) throw new Error("Nu s-a putut șterge profilul de companie");
}
