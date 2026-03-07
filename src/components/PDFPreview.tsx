"use client";
import { useEffect, useState } from "react";

interface PDFPreviewProps {
    file: File | Blob;
    maxPages?: number;
}

const IconLoader = () => (
    <svg className="spin" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <path d="M12 2v4M12 18v4M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M2 12h4M18 12h4M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
    </svg>
);

export default function PDFPreview({ file, maxPages = 8 }: PDFPreviewProps) {
    const [pages, setPages] = useState<string[]>([]);
    const [totalPages, setTotalPages] = useState(0);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");

    useEffect(() => {
        if (!file) return;
        let cancelled = false;

        const render = async () => {
            setLoading(true);
            setError("");
            setPages([]);
            setTotalPages(0);

            try {
                // Use legacy build which has better compatibility in various bundlers
                const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
                pdfjsLib.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";

                const buf = await file.arrayBuffer();
                const loadingTask = pdfjsLib.getDocument({ data: new Uint8Array(buf) });
                const pdf = await loadingTask.promise;

                const total = pdf.numPages;
                if (cancelled) return;
                setTotalPages(total);

                const limit = Math.min(total, maxPages);
                const rendered: string[] = [];

                for (let i = 1; i <= limit; i++) {
                    if (cancelled) break;
                    const page = await pdf.getPage(i);
                    const viewport = page.getViewport({ scale: 1.0 });
                    const canvas = document.createElement("canvas");
                    const ctx = canvas.getContext("2d")!;
                    canvas.width = viewport.width;
                    canvas.height = viewport.height;

                    await page.render({
                        canvasContext: ctx,
                        viewport,
                        // pdfjs 5 legacy build might still prefer the canvas reference
                        canvas: canvas as any
                    }).promise;

                    rendered.push(canvas.toDataURL("image/jpeg", 0.75));
                }

                if (!cancelled) setPages(rendered);
            } catch (e: any) {
                if (!cancelled) {
                    setError("Could not render preview.");
                    console.error("PDF Preview Error:", e);
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        render();
        return () => { cancelled = true; };
    }, [file, maxPages]);

    return (
        <div className="paper-card" style={{ overflow: "hidden", maxHeight: 520, display: "flex", flexDirection: "column" }}>
            {/* Header bar */}
            <div style={{
                backgroundColor: "var(--ink)", color: "var(--paper)",
                padding: "7px 14px", display: "flex", alignItems: "center",
                justifyContent: "space-between", flexShrink: 0,
            }}>
                <span className="font-mono" style={{ fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase" }}>
                    PREVIEW
                </span>
                {totalPages > 0 && (
                    <span className="font-mono" style={{ fontSize: "0.68rem", color: "var(--tape-yellow)" }}>
                        {totalPages} page{totalPages !== 1 ? "s" : ""}
                    </span>
                )}
            </div>

            {/* Scroll area */}
            <div style={{ overflowY: "auto", padding: 10, display: "flex", flexDirection: "column", gap: 10 }}>
                {loading && (
                    <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "32px 0", justifyContent: "center", color: "var(--ink-muted)" }}>
                        <IconLoader />
                        <span className="font-mono" style={{ fontSize: "0.78rem" }}>Rendering…</span>
                    </div>
                )}
                {error && (
                    <p className="font-mono" style={{ color: "var(--accent-red)", textAlign: "center", padding: "24px 0", fontSize: "0.8rem" }}>{error}</p>
                )}
                {pages.map((src, i) => (
                    <div key={i} style={{ position: "relative" }}>
                        <div
                            className="font-mono"
                            style={{
                                position: "absolute", top: 4, left: 4,
                                backgroundColor: "var(--ink)", color: "var(--paper)",
                                fontSize: "0.6rem", fontWeight: 700, padding: "1px 6px",
                            }}
                        >
                            {i + 1}
                        </div>
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={src} alt={`Page ${i + 1}`} style={{ width: "100%", display: "block", border: "1.5px solid var(--ink-muted)" }} />
                    </div>
                ))}
            </div>
        </div>
    );
}
