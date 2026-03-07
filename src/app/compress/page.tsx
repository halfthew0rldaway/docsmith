"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import FileUploader from "@/components/FileUploader";
import CompressionOptions, { CompressionMode, PresetLevel } from "@/components/CompressionOptions";
import DownloadButton from "@/components/DownloadButton";
import { formatBytes } from "@/utils/fileReader";
import { compressPDFAction } from "@/app/actions/compressAction";

const PDFPreview = dynamic(() => import("@/components/PDFPreview"), { ssr: false });

const RATIOS: Record<PresetLevel, number> = { low: 0.72, medium: 0.48, high: 0.28 };

export default function CompressPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [mode, setMode] = useState<CompressionMode>("preset");
    const [preset, setPreset] = useState<PresetLevel>("medium");
    const [targetMB, setTargetMB] = useState("");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [progressLabel, setProgressLabel] = useState("");
    const [result, setResult] = useState<{ blob: Blob; originalSize: number; compressedSize: number } | null>(null);
    const [error, setError] = useState("");

    const file = files[0];
    const originalSizeMB = file ? file.size / (1024 * 1024) : null;
    const estimatedSize = file && mode === "preset" ? file.size * RATIOS[preset] : null;

    const handleCompress = async () => {
        if (!file) return;
        setProcessing(true); setProgress(15); setProgressLabel("Uploading to server…"); setError(""); setResult(null);
        try {
            const formData = new FormData();
            formData.append("file", file);
            formData.append("mode", mode);
            if (mode === "preset") formData.append("preset", preset);
            else formData.append("targetMB", targetMB);

            setProgress(40); setProgressLabel("Compressing (this takes a moment)…");

            // Use Server Action instead of standard fetch to bypass 4MB limit
            const res = await compressPDFAction(formData);

            setProgress(90); setProgressLabel("Finalizing…");

            // Convert base64 back to Blob
            const byteCharacters = atob(res.base64);
            const byteNumbers = new Array(byteCharacters.length);
            for (let i = 0; i < byteCharacters.length; i++) {
                byteNumbers[i] = byteCharacters.charCodeAt(i);
            }
            const byteArray = new Uint8Array(byteNumbers);
            const pdfBlob = new Blob([byteArray], { type: "application/pdf" });

            setResult({
                blob: pdfBlob,
                originalSize: res.originalSize,
                compressedSize: res.compressedSize
            });
            setProgress(100); setProgressLabel("Done!");
        } catch (e: any) {
            console.error(e);
            let msg = e.message || "Compression failed.";
            if (msg.includes("fetch")) msg = "File too large for server limits. Try a smaller file or a different hosting plan.";
            setError(msg);
        } finally { setProcessing(false); }
    };

    const reset = () => { setFiles([]); setResult(null); setError(""); setProgress(0); setProgressLabel(""); };
    const reduction = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : null;
    const previewFile = result ? result.blob : file;
    const downloadName = file ? file.name.replace(/\.pdf$/i, "_compressed.pdf") : "compressed.pdf";

    return (
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
            <div style={{ marginBottom: 32, position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-pink)", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-1.8deg)", width: "110%", height: 18 }} />
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-red)", position: "relative", zIndex: 11 }}>shrink</span>
                </div>
                <h1 className="font-display fade-in-up" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>Compress PDF</h1>
                <p className="font-body fade-in-up stagger-1" style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>Reduce file size using Ghostscript — by quality preset or target file size.</p>
                <div className="section-divider fade-in-up stagger-1" style={{ marginTop: 20 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Step 1: Upload */}
                <div className="paper-card fade-in-up stagger-1" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <h2 className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)" }}>1. Upload PDF</h2>
                        {files.length > 0 && <button onClick={reset} className="font-mono text-xs underline btn-tactile" style={{ color: "var(--accent-red)" }}>Reset Everything</button>}
                    </div>
                    <FileUploader files={files} onFilesChange={(f) => { setFiles(f); setResult(null); }} label="Drop a PDF here" />

                    {file && !result && (
                        <div className="fade-in-up" style={{ display: "flex", alignItems: "center", gap: 32, padding: "14px 18px", marginTop: 20, backgroundColor: "var(--paper-dark)", border: "2px solid var(--ink)", maxWidth: 600 }}>
                            <div>
                                <p className="font-mono" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 2 }}>Original</p>
                                <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--ink)" }}>{formatBytes(file.size)}</p>
                            </div>
                            {estimatedSize !== null && (
                                <>
                                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ink-muted)" strokeWidth="2"><line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" /></svg>
                                    <div>
                                        <p className="font-mono" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 2 }}>Est. output</p>
                                        <p className="font-display" style={{ fontSize: "1.4rem", color: "var(--accent-teal)" }}>~{formatBytes(estimatedSize)}</p>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>

                {file && (
                    <>
                        {/* Results / Options */}
                        {result ? (
                            <div className="fade-in-up">
                                <div className="paper-card" style={{ padding: "24px", position: "relative", marginBottom: 32 }}>
                                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-green)", top: -11, left: 28, transform: "rotate(2deg)" }} />
                                    <h3 className="font-display" style={{ fontSize: "1.3rem", color: "var(--ink)", marginBottom: 20 }}>
                                        Compressed!{" "}
                                        {reduction !== null && reduction > 0 && <span style={{ color: "var(--accent-teal)" }}>−{reduction}%</span>}
                                    </h3>
                                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 0, border: "2px solid var(--ink)", marginBottom: 16 }}>
                                        <div style={{ padding: "14px 18px", borderRight: "2px solid var(--ink)" }}>
                                            <p className="font-mono" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 4 }}>Before</p>
                                            <p className="font-display" style={{ fontSize: "1.5rem", color: "var(--ink)" }}>{formatBytes(result.originalSize)}</p>
                                        </div>
                                        <div style={{ padding: "14px 18px" }}>
                                            <p className="font-mono" style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink-muted)", marginBottom: 4 }}>After</p>
                                            <p className="font-display" style={{ fontSize: "1.5rem", color: "var(--accent-teal)" }}>{formatBytes(result.compressedSize)}</p>
                                        </div>
                                    </div>
                                    <DownloadButton blob={result.blob} filename={downloadName} label="Download Result" onReset={reset} />
                                </div>
                            </div>
                        ) : (
                            <div className="paper-card fade-in-up stagger-2" style={{ padding: "24px" }}>
                                <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 16, color: "var(--ink)" }}>2. Compression Mode</h2>
                                <CompressionOptions mode={mode} onModeChange={setMode} preset={preset} onPresetChange={setPreset} targetMB={targetMB} onTargetMBChange={setTargetMB} originalSizeMB={originalSizeMB} />
                            </div>
                        )}

                        {/* Step 3: Preview */}
                        <div className="paper-card fade-in-up stagger-3" style={{ padding: "24px" }}>
                            <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 18, color: "var(--ink)" }}>3. Preview {result ? "Result" : "Original"}</h2>
                            <PDFPreview file={previewFile!} />
                        </div>

                        {/* Action */}
                        {!result && (
                            <div className="fade-in-up stagger-4">
                                <button className="btn-accent btn-tactile" style={{ backgroundColor: "var(--accent-red)", padding: "12px 32px", fontSize: "0.9rem" }} onClick={handleCompress} disabled={processing}>
                                    {processing ? progressLabel || "Processing…" : "Compress PDF"}
                                </button>
                                {processing && (
                                    <div style={{ marginTop: 16 }}>
                                        <div className="progress-bar-track" style={{ height: 24 }}><div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: "var(--accent-red)" }} /></div>
                                        <p className="font-mono" style={{ fontSize: "0.75rem", marginTop: 4, color: "var(--ink-muted)" }}>{progressLabel}</p>
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
