import { ImageResponse } from "next/og";

export const alt = "CNA Shop – Magazin online";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Image() {
    return new ImageResponse(
        (
            <div
                style={{
                    background: "linear-gradient(135deg, #111827 0%, #1f2937 100%)",
                    width: "100%",
                    height: "100%",
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "center",
                }}
            >
                <div
                    style={{
                        fontSize: 88,
                        fontWeight: 800,
                        color: "#f9fafb",
                        letterSpacing: "-4px",
                        lineHeight: 1,
                    }}
                >
                    CNA Shop
                </div>
                <div
                    style={{
                        fontSize: 30,
                        color: "#9ca3af",
                        marginTop: 24,
                        letterSpacing: "0.02em",
                    }}
                >
                    Magazin online cu produse de calitate
                </div>
            </div>
        ),
        { ...size }
    );
}
