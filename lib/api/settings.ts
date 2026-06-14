import { authFetch } from "./http";

const BASE = process.env.NEXT_PUBLIC_API_URL;

export interface AboutPageSection {
    heading: string;
    content: string;
    imageUrl?: string;
}

export interface AboutPageContent {
    title: string;
    subtitle: string;
    sections: AboutPageSection[];
}

export const DEFAULT_ABOUT_CONTENT: AboutPageContent = {
    title: "Despre noi",
    subtitle: "",
    sections: [],
};

export async function getAboutPage(): Promise<AboutPageContent> {
    const res = await fetch(`${BASE}/api/settings/about-page`, { cache: "no-store" });
    if (!res.ok) return DEFAULT_ABOUT_CONTENT;
    return res.json();
}

export async function setAboutPage(token: string, content: AboutPageContent): Promise<void> {
    const res = await authFetch(`${BASE}/api/settings/about-page`, {
        method: "PUT",
        headers: {
            "Content-Type": "application/json",
        },
        body: JSON.stringify({ contentJson: JSON.stringify(content) }),
    }, token);
    if (!res.ok) throw new Error("Nu s-a putut salva conținutul.");
}
