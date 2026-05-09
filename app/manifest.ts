import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
    return {
        name: "CNA Shop",
        short_name: "CNA Shop",
        description: "Magazin online cu produse de calitate",
        start_url: "/",
        display: "standalone",
        background_color: "#f9fafb",
        theme_color: "#111827",
        icons: [
            { src: "/icon-192.png", sizes: "192x192", type: "image/png" },
            { src: "/icon-512.png", sizes: "512x512", type: "image/png" },
        ],
    };
}
