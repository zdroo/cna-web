import { redirect } from "next/navigation";

export default async function CatalogProductPage({ params }: { params: Promise<{ productSlug: string }> }) {
    const { productSlug } = await params;
    redirect(`/produse/${productSlug}`);
}
