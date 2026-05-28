import type { Metadata } from "next";
import { getAboutPage } from "@/lib/api/settings";
import DespreNoiContent from "./DespreNoiContent";

export const metadata: Metadata = {
    title: "Despre noi",
    description: "Află mai multe despre CNA Shop, misiunea noastră și valorile care ne ghidează.",
    alternates: { canonical: "/despre-noi" },
};

export default async function DespreNoiPage() {
    const initialContent = await getAboutPage();
    return <DespreNoiContent initialContent={initialContent} />;
}
