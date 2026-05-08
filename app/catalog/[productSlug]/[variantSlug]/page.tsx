import { redirect } from "next/navigation";

export default async function CatalogVariantPage({ params }: { params: Promise<{ productSlug: string; variantSlug: string }> }) {
    const { productSlug, variantSlug } = await params;
    redirect(`/produse/${productSlug}/${variantSlug}`);
}
