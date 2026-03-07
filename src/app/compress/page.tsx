"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import FileUploader from "@/components/FileUploader";
import CompressionOptions, { CompressionMode, PresetLevel } from "@/components/CompressionOptions";
import DownloadButton from "@/components/DownloadButton";
import { formatBytes } from "@/utils/fileReader";
import { compressPDFClient, compressPDFAggressive } from "@/lib/compressPDF";

const PDFPreview = dynamic(() => import("@/components/PDFPreview"), { ssr: false });

const RATIOS: Record<PresetLevel, number> = { low: 0.85, medium: 0.5, high: 0.25 };

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
        setProcessing(true); setProgress(5); setProgressLabel("Initializing..."); setError(""); setResult(null);
        try {
            let compressedBytes: Uint8Array;

            if (mode === "preset") {
                setProgressLabel("Optimizing structure...");
                // Note: For now, on client, we do structural optimization.
                // If the user chooses 'low' or 'high', we can adjust strategy.
                compressedBytes = await compressPDFClient(file);
                setProgress(100);
            } else {
                setProgressLabel("Processing aggressive compression...");
                const target = parseFloat(targetMB) || 1;
                compressedBytes = await compressPDFAggressive(file, target, (p) => {
                    setProgress(p);
                    setProgressLabel(`Rendering pages: ${Math.round(p)}%`);
                });
            }

            const pdfBlob = new Blob([compressedBytes as any], { type: "application/pdf" });
            setResult({
                blob: pdfBlob,
                originalSize: file.size,
                compressedSize: pdfBlob.size
            });
            setProgress(100); setProgressLabel("Compression complete!");
        } catch (e: any) {
            console.error(e);
            setError(`Compression failed: ${e.message}. This might happen with very large or complex PDFs.`);
        } finally { setProcessing(false); }
    };

    const reset = () => { setFiles([]); setResult(null); setError(""); setProgress(0); setProgressLabel(""); };
    const reduction = result ? Math.round((1 - result.compressedSize / result.originalSize) * 100) : null;
    const previewFile = result ? result.blob : file;
    const downloadName = file ? file.name.replace(/\.pdf$/i, "_compressed.pdf") : "compressed.pdf";

    return (
        <div className="w-full px-4 sm:px-6 md:px-10 lg:px-16 py-8 md:py-10">
            <div style={{ marginBottom: 32, position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-pink)", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-1.8deg)", width: "110%", height: 18 }} />
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-red)", position: "relative", zIndex: 11 }}>shrink</span>
                </div>
                <h1 className="font-display fade-in-up" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>Compress PDF</h1>
                <p className="font-body fade-in-up stagger-1" style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>Zero-server compression. Everything stays in your browser. Fast, private, and powerful.</p>
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
                                        Compressed Locally!{" "}
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
                                    {processing ? progressLabel || "Compressing..." : "Compress PDF"}
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
