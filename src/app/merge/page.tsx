"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import FileUploader from "@/components/FileUploader";
import DownloadButton from "@/components/DownloadButton";
import { mergePDFs } from "@/lib/mergePDF";
import { formatBytes } from "@/utils/fileReader";

const PDFPreview = dynamic(() => import("@/components/PDFPreview"), { ssr: false });

const IconGrip = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <circle cx="9" cy="6" r="1.5" /><circle cx="15" cy="6" r="1.5" />
        <circle cx="9" cy="12" r="1.5" /><circle cx="15" cy="12" r="1.5" />
        <circle cx="9" cy="18" r="1.5" /><circle cx="15" cy="18" r="1.5" />
    </svg>
);

export default function MergePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [error, setError] = useState("");
    const [dragIdx, setDragIdx] = useState<number | null>(null);
    const [overIdx, setOverIdx] = useState<number | null>(null);

    const handleMerge = async () => {
        if (files.length < 2) return;
        setProcessing(true); setProgress(15); setError(""); setResultBlob(null);
        try {
            setProgress(50);
            const bytes = await mergePDFs(files);
            setProgress(95);
            setResultBlob(new Blob([bytes as any], { type: "application/pdf" }));
            setProgress(100);
        } catch (e) { setError("Merge failed. Ensure all files are valid PDFs."); console.error(e); }
        finally { setProcessing(false); }
    };

    const reset = () => { setFiles([]); setResultBlob(null); setError(""); setProgress(0); };

    const handleDrop = (i: number) => {
        if (dragIdx === null || dragIdx === i) { setDragIdx(null); setOverIdx(null); return; }
        const next = [...files];
        const [m] = next.splice(dragIdx, 1);
        next.splice(i, 0, m);
        setFiles(next); setDragIdx(null); setOverIdx(null);
    };

    const previewFile = resultBlob || files[0];

    return (
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
            {/* Header */}
            <div style={{ marginBottom: 32, position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-green)", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-2deg)", width: "110%", height: 18 }} />
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-teal)", position: "relative", zIndex: 11 }}>combine</span>
                </div>
                <h1 className="font-display fade-in-up" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>
                    Merge PDF
                </h1>
                <p className="font-body fade-in-up stagger-1" style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>
                    Upload multiple PDFs, drag to reorder, then merge into one file.
                </p>
                <div className="section-divider fade-in-up stagger-1" style={{ marginTop: 20 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Step 1: Upload */}
                <div className="paper-card fade-in-up stagger-1" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <h2 className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)" }}>1. Upload Files</h2>
                        {files.length > 0 && <button onClick={reset} className="font-mono text-xs underline btn-tactile" style={{ color: "var(--accent-red)" }}>Reset Everything</button>}
                    </div>
                    <FileUploader multiple files={files} onFilesChange={(f) => { setFiles(f); setResultBlob(null); }} label="Drop PDF files here" />
                </div>

                {files.length > 0 && (
                    <>
                        {/* Step 2: Order */}
                        {files.length > 1 && (
                            <div className="paper-card fade-in-up stagger-2" style={{ padding: "24px", position: "relative" }}>
                                <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-yellow)", top: -11, right: 40 }} />
                                <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 6, color: "var(--ink)" }}>2. Set Order</h2>
                                <p className="font-mono" style={{ fontSize: "0.68rem", color: "var(--ink-muted)", marginBottom: 14 }}>Drag rows to reorder</p>
                                <ul style={{ border: "2px solid var(--ink)" }}>
                                    {files.map((f, i) => (
                                        <li
                                            key={`${f.name}-${i}`}
                                            draggable={!resultBlob}
                                            onDragStart={() => setDragIdx(i)}
                                            onDragOver={(e) => { e.preventDefault(); setOverIdx(i); }}
                                            onDrop={() => handleDrop(i)}
                                            style={{
                                                display: "flex", alignItems: "center", gap: 12, padding: "10px 16px", cursor: resultBlob ? "default" : "grab",
                                                backgroundColor: overIdx === i ? "var(--tape-yellow)" : i % 2 === 0 ? "var(--paper)" : "var(--paper-dark)",
                                                borderBottom: i < files.length - 1 ? "1px solid var(--paper-mid)" : undefined,
                                                opacity: dragIdx === i ? 0.4 : 1,
                                            }}
                                        >
                                            <span className="drag-handle"><IconGrip /></span>
                                            <span className="font-mono" style={{ fontSize: "0.75rem", fontWeight: 700, backgroundColor: "var(--ink)", color: "var(--paper)", padding: "1px 8px", minWidth: 26, textAlign: "center" }}>{i + 1}</span>
                                            <span className="font-mono" style={{ fontSize: "0.85rem", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", flex: 1, color: "var(--ink)" }}>{f.name}</span>
                                            <span className="size-badge">{formatBytes(f.size)}</span>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}

                        {/* Step 3: Result / Download */}
                        {resultBlob && (
                            <div className="fade-in-up">
                                <DownloadButton blob={resultBlob} filename="merged.pdf" label="Download Merged PDF" onReset={reset} />
                            </div>
                        )}

                        {/* Step 4: Preview */}
                        <div className="paper-card fade-in-up stagger-3" style={{ padding: "24px" }}>
                            <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 18, color: "var(--ink)" }}>
                                {resultBlob ? "3. Preview Merged Result" : files.length > 1 ? "3. Preview First File" : "2. Preview File"}
                            </h2>
                            <PDFPreview file={previewFile} />
                        </div>

                        {/* Action */}
                        {!resultBlob && (
                            <div className="fade-in-up stagger-4" style={{ display: "flex", flexDirection: "column", gap: 16 }}>
                                <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: 16 }}>
                                    <button className="btn-accent btn-tactile" style={{ backgroundColor: "var(--accent-teal)", padding: "12px 32px", fontSize: "0.9rem" }} onClick={handleMerge} disabled={files.length < 2 || processing}>
                                        {processing ? "Merging…" : `Merge ${files.length} file${files.length !== 1 ? "s" : ""}`}
                                    </button>
                                    {files.length < 2 && <span className="font-mono" style={{ fontSize: "0.75rem", color: "var(--ink-muted)" }}>Add at least 2 PDFs to merge</span>}
                                </div>

                                {processing && (
                                    <div className="progress-bar-track" style={{ height: 24, marginTop: -8 }}><div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: "var(--accent-teal)" }} /></div>
                                )}
                            </div>
                        )}
                    </>
                )}

                {error && <p className="font-mono fade-in-up" style={{ fontSize: "0.85rem", color: "var(--accent-red)", marginTop: 4 }}>{error}</p>}
            </div>
        </div>
    );
}
