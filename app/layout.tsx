import type { Metadata, Viewport } from "next";
import "./globals.css";
import Navbar from "@/components/layout/Navbar";
import UnpaidOrderBanner from "@/components/layout/UnpaidOrderBanner";
import Footer from "@/components/layout/Footer";
import CookieConsent from "@/components/layout/CookieConsent";
import { FavoritesProvider } from "@/context/FavoritesContext";
import { CartProvider } from "@/context/CartContext";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import GoogleProvider from "@/components/layout/GoogleProvider";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://cnashop.ro";
const SITE_NAME = "CNA Shop";

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#030712" },
  ],
};

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: SITE_NAME,
    template: `%s | ${SITE_NAME}`,
  },
  description: "CNA Shop – magazin online cu produse de calitate. Livrare rapidă, prețuri competitive.",
  keywords: ["magazin online", "produse", "cumpărături online", "CNA Shop"],
  openGraph: {
    type: "website",
    locale: "ro_RO",
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_NAME,
    description: "CNA Shop – magazin online cu produse de calitate.",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_NAME,
    description: "CNA Shop – magazin online cu produse de calitate.",
  },
  alternates: { canonical: SITE_URL },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ro" suppressHydrationWarning>
      <head>
        {/* Apply theme before first paint to avoid flash */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var t=localStorage.getItem('theme');if(t==='dark')document.documentElement.classList.add('dark');}catch(e){}})();`,
          }}
        />
      </head>
      <body className="bg-gray-50 dark:bg-gray-950 text-gray-900 dark:text-gray-100 antialiased">
        <GoogleProvider>
          <AuthProvider>
            <ThemeProvider>
              <CartProvider>
                <FavoritesProvider>
                  <Navbar />
                  <UnpaidOrderBanner />
                  <main className="max-w-7xl mx-auto px-4 py-8">
                    {children}
                  </main>
                  <Footer />
                  <CookieConsent />
                </FavoritesProvider>
              </CartProvider>
            </ThemeProvider>
          </AuthProvider>
        </GoogleProvider>
      </body>
    </html>
  );
}
