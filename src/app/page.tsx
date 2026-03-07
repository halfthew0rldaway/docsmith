import type { Metadata } from "next";
import ToolCard from "@/components/ToolCard";

export const metadata: Metadata = {
    title: "Docsmith — PDF Toolbox",
    description: "Free, browser-first PDF tools. Merge, split, rotate, extract, and compress PDFs.",
};

const TOOLS = [
    {
        href: "/merge",
        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="8 6 2 12 8 18" /><polyline points="16 6 22 12 16 18" /><line x1="2" y1="12" x2="22" y2="12" /></svg>,
        title: "Merge PDF",
        description: "Combine multiple PDFs into a single document. Drag to reorder before merging.",
        accentColor: "var(--accent-teal)",
        tapeColor: "var(--tape-green)",
        rotation: "rotate(-1.2deg)",
        tag: "combine",
    },
    {
        href: "/split",
        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M16 3h5v5M8 3H3v5M3 16v5h5M16 21h5v-5" /><line x1="12" y1="3" x2="12" y2="21" /></svg>,
        title: "Split PDF",
        description: "Split pages into individual files or extract a custom range of pages.",
        accentColor: "var(--accent-navy)",
        tapeColor: "var(--tape-blue)",
        rotation: "rotate(1deg)",
        tag: "separate",
    },
    {
        href: "/rotate",
        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21.5 2v6h-6M2.5 22v-6h6M2 11.5a10 10 0 0 1 18.8-4.3M22 12.5a10 10 0 0 1-18.8 4.3" /></svg>,
        title: "Rotate Pages",
        description: "Rotate all or specific pages by 90°, 180°, or 270° in either direction.",
        accentColor: "var(--accent-purple)",
        tapeColor: "var(--tape-pink)",
        rotation: "rotate(-0.5deg)",
        tag: "orient",
    },
    {
        href: "/extract",
        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /><line x1="12" y1="12" x2="12" y2="18" /><polyline points="9 15 12 18 15 15" /></svg>,
        title: "Extract Pages",
        description: "Pull out specific pages to create a new PDF from your selection.",
        accentColor: "var(--accent-orange)",
        tapeColor: "var(--tape-yellow)",
        rotation: "rotate(1.4deg)",
        tag: "extract",
    },
    {
        href: "/compress",
        icon: <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /><polyline points="7.5 4.21 12 6.81 16.5 4.21" /><line x1="12" y1="22.08" x2="12" y2="12" /><polyline points="3.27 6.96 12 12.01 20.73 6.96" /></svg>,
        title: "Compress PDF",
        description: "Shrink large PDFs with quality presets or hit an exact target file size.",
        accentColor: "var(--accent-red)",
        tapeColor: "var(--tape-pink)",
        rotation: "rotate(-1deg)",
        tag: "shrink",
    },
];

export default function HomePage() {
    return (
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
            {/* Hero */}
            <section className="mb-14 fade-in-up">
                <div className="mb-4">
                    <span className="ink-label stagger-1">Free · Private · Fast</span>
                </div>
                <h1 className="font-display" style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", color: "var(--ink)", letterSpacing: "-0.03em", lineHeight: 1.05, marginBottom: 16 }}>
                    Your PDF{" "}
                    <span style={{ borderBottom: "5px solid var(--tape-yellow)", paddingBottom: "2px" }}>
                        Toolbox
                    </span>
                    .
                </h1>
                <p className="font-body text-base" style={{ color: "var(--ink-muted)", lineHeight: 1.8, maxWidth: 560, marginBottom: 32 }}>
                    Merge, split, rotate, extract pages, and compress PDFs — all in the browser.
                    No uploads to third-party servers for most operations. Fast, free, and private.
                </p>
                <div className="section-divider" />
            </section>

            {/* Grid */}
            <section>
                <div className="flex items-center gap-4 mb-8">
                    <h2 className="font-display text-2xl" style={{ color: "var(--ink)", letterSpacing: "-0.02em" }}>Pick a tool</h2>
                    <div className="flex-1 section-divider" />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6 pb-10">
                    {TOOLS.map((t, i) => <ToolCard key={t.href} {...t} index={i} />)}
                </div>
            </section>

            <footer className="mt-12 pt-5 font-mono text-xs" style={{ borderTop: "2px solid var(--ink-muted)", color: "var(--ink-muted)" }}>
                Docsmith — open-source PDF toolbox. Client-side operations run entirely in your browser.
            </footer>
        </div>
    );
}
