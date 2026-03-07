"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import FileUploader from "@/components/FileUploader";
import DownloadButton from "@/components/DownloadButton";
import { extractPages } from "@/lib/extractPDF";

const PDFPreview = dynamic(() => import("@/components/PDFPreview"), { ssr: false });

export default function ExtractPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [pageInput, setPageInput] = useState("1, 2, 5");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [error, setError] = useState("");
    const file = files[0];

    const handleExtract = async () => {
        if (!file) return;
        setProcessing(true); setProgress(30); setError(""); setResultBlob(null);
        try {
            const nums = pageInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0);
            if (!nums.length) { setError("Enter at least one page number."); setProcessing(false); return; }
            setProgress(65);
            const bytes = await extractPages(file, nums);
            setProgress(100);
            setResultBlob(new Blob([bytes as any], { type: "application/pdf" }));
        } catch (e) { setError("Extraction failed. Check the file is a valid PDF."); console.error(e); }
        finally { setProcessing(false); }
    };

    const reset = () => { setFiles([]); setResultBlob(null); setError(""); setProgress(0); };
    const previewFile = resultBlob || file;

    return (
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
            <div style={{ marginBottom: 32, position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-yellow)", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-1.5deg)", width: "110%", height: 18 }} />
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-orange)", position: "relative", zIndex: 11 }}>extract</span>
                </div>
                <h1 className="font-display fade-in-up" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>Extract Pages</h1>
                <p className="font-body fade-in-up stagger-1" style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>Pick specific page numbers to pull into a new PDF.</p>
                <div className="section-divider fade-in-up stagger-1" style={{ marginTop: 20 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Step 1: Upload */}
                <div className="paper-card fade-in-up stagger-1" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <h2 className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)" }}>1. Upload PDF</h2>
                        {files.length > 0 && <button onClick={reset} className="font-mono text-xs underline btn-tactile" style={{ color: "var(--accent-red)" }}>Reset Everything</button>}
                    </div>
                    <FileUploader files={files} onFilesChange={(f) => { setFiles(f); setResultBlob(null); }} label="Drop a PDF here" />
                </div>

                {file && (
                    <>
                        {/* Step 2: Select / Result */}
                        {resultBlob ? (
                            <div className="fade-in-up">
                                <DownloadButton blob={resultBlob} filename="extracted.pdf" label="Download Extracted PDF" onReset={reset} />
                            </div>
                        ) : (
                            <div className="paper-card fade-in-up stagger-2" style={{ padding: "24px", position: "relative" }}>
                                <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-yellow)", top: -11, left: 20, transform: "rotate(-1.5deg)" }} />
                                <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 16, color: "var(--ink)" }}>2. Select Pages</h2>
                                <div style={{ maxWidth: 500 }}>
                                    <label className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6, color: "var(--ink)" }}>
                                        Page numbers to extract
                                    </label>
                                    <input type="text" value={pageInput} onChange={(e) => setPageInput(e.target.value)} placeholder="e.g. 1, 3, 5, 8" className="ink-input" style={{ marginBottom: 8 }} />
                                    <p className="font-mono" style={{ fontSize: "0.68rem", color: "var(--ink-muted)" }}>
                                        Comma-separated. Output keeps original page order.
                                    </p>
                                </div>
                            </div>
                        )}

                        {/* Step 3: Preview */}
                        <div className="paper-card fade-in-up stagger-3" style={{ padding: "24px" }}>
                            <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 18, color: "var(--ink)" }}>3. Preview {resultBlob ? "Result" : "Original"}</h2>
                            <PDFPreview file={previewFile!} />
                        </div>

                        {/* Action */}
                        {!resultBlob && (
                            <div className="fade-in-up stagger-4">
                                <button className="btn-accent btn-tactile" style={{ backgroundColor: "var(--accent-orange)", padding: "12px 32px", fontSize: "0.9rem" }} onClick={handleExtract} disabled={processing}>
                                    {processing ? "Extracting…" : "Extract Pages"}
                                </button>
                                {processing && (
                                    <div style={{ marginTop: 16 }}>
                                        <div className="progress-bar-track" style={{ height: 24 }}><div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: "var(--accent-orange)" }} /></div>
                                    </div>
                                )}
                            </div>
                        )}
                        {error && <p className="font-mono text-sm mt-3 fade-in-up" style={{ color: "var(--accent-red)" }}>{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
