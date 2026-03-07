import type { Metadata } from "next";
import "./globals.css";
import Navbar from "@/components/Navbar";
import WelcomeModal from "@/components/WelcomeModal";

export const metadata: Metadata = {
    title: "Docsmith — PDF Toolbox",
    description: "A browser-first PDF utility. Merge, split, rotate, extract, and compress PDFs — free and private.",
    keywords: ["PDF", "merge PDF", "split PDF", "compress PDF", "rotate PDF", "extract pages"],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
        <html lang="en" suppressHydrationWarning>
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
                <link
                    href="https://fonts.googleapis.com/css2?family=Archivo+Black&family=IBM+Plex+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&display=swap"
                    rel="stylesheet"
                />
                <link rel="icon" href="/icon.png" />
            </head>
            <body className="min-h-screen">
                <Navbar />
                <main>{children}</main>
                <WelcomeModal />
            </body>
        </html>
    );
}
