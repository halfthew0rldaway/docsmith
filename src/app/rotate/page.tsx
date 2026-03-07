"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import FileUploader from "@/components/FileUploader";
import DownloadButton from "@/components/DownloadButton";
import { rotatePages, RotationDeg } from "@/lib/rotatePDF";

const PDFPreview = dynamic(() => import("@/components/PDFPreview"), { ssr: false });

export default function RotatePage() {
    const [files, setFiles] = useState<File[]>([]);
    const [rotation, setRotation] = useState<RotationDeg>(90);
    const [scope, setScope] = useState<"all" | "specific">("all");
    const [pageInput, setPageInput] = useState("1, 3, 5");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [resultBlob, setResultBlob] = useState<Blob | null>(null);
    const [error, setError] = useState("");
    const file = files[0];

    const handleRotate = async () => {
        if (!file) return;
        setProcessing(true); setProgress(30); setError(""); setResultBlob(null);
        try {
            const pages = scope === "all" ? [] : pageInput.split(",").map((s) => parseInt(s.trim())).filter((n) => !isNaN(n) && n > 0);
            setProgress(65);
            const bytes = await rotatePages(file, pages, rotation);
            setProgress(100);
            setResultBlob(new Blob([bytes as any], { type: "application/pdf" }));
        } catch (e) { setError("Rotation failed. Check the file is a valid PDF."); console.error(e); }
        finally { setProcessing(false); }
    };

    const reset = () => { setFiles([]); setResultBlob(null); setError(""); setProgress(0); };
    const previewFile = resultBlob || file;

    const ROTATIONS: { deg: RotationDeg; label: string }[] = [
        { deg: 90, label: "90° CW" }, { deg: 180, label: "180°" }, { deg: 270, label: "90° CCW" },
    ];

    return (
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
            <div style={{ marginBottom: 32, position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-pink)", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-2deg)", width: "110%", height: 18 }} />
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-purple)", position: "relative", zIndex: 11 }}>orient</span>
                </div>
                <h1 className="font-display fade-in-up" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>Rotate Pages</h1>
                <p className="font-body fade-in-up stagger-1" style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>Rotate all or selected pages in a PDF by any angle.</p>
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
                        {/* Step 2: Options / Results */}
                        {resultBlob ? (
                            <div className="fade-in-up">
                                <DownloadButton blob={resultBlob} filename="rotated.pdf" label="Download Rotated PDF" onReset={reset} />
                            </div>
                        ) : (
                            <div className="paper-card fade-in-up stagger-2" style={{ padding: "24px", position: "relative" }}>
                                <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-pink)", top: -11, right: 30, transform: "rotate(1.5deg)" }} />
                                <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 16, color: "var(--ink)" }}>2. Options</h2>

                                <div style={{ maxWidth: 600 }}>
                                    <p className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 8 }}>Rotation Angle</p>
                                    <div style={{ display: "flex", border: "2px solid var(--ink)", marginBottom: 20 }}>
                                        {ROTATIONS.map((r, i) => (
                                            <button key={r.deg} onClick={() => setRotation(r.deg)} className="font-mono btn-tactile"
                                                style={{
                                                    flex: 1, padding: "10px 0", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
                                                    backgroundColor: rotation === r.deg ? "var(--accent-purple)" : "transparent",
                                                    color: rotation === r.deg ? "#fff" : "var(--ink)",
                                                    border: "none", borderRight: i < ROTATIONS.length - 1 ? "1px solid var(--ink)" : "none", cursor: "pointer",
                                                }}>{r.label}</button>
                                        ))}
                                    </div>

                                    <p className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--ink)", marginBottom: 8 }}>Apply To</p>
                                    <div style={{ display: "flex", border: "2px solid var(--ink)", marginBottom: 14 }}>
                                        {(["all", "specific"] as const).map((s, i) => (
                                            <button key={s} onClick={() => setScope(s)} className="font-mono btn-tactile"
                                                style={{
                                                    flex: 1, padding: "10px 0", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
                                                    backgroundColor: scope === s ? "var(--ink)" : "transparent", color: scope === s ? "var(--paper)" : "var(--ink)",
                                                    border: "none", borderRight: i === 0 ? "1px solid var(--ink)" : "none", cursor: "pointer",
                                                }}>{s === "all" ? "All Pages" : "Specific Pages"}</button>
                                        ))}
                                    </div>
                                    {scope === "specific" && (
                                        <div className="fade-in-up" style={{ marginTop: 6 }}>
                                            <label className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6, color: "var(--ink)" }}>
                                                Page numbers (e.g. 1, 3, 5)
                                            </label>
                                            <input type="text" value={pageInput} onChange={(e) => pageInput && setPageInput(e.target.value)} placeholder="1, 3, 5" className="ink-input" />
                                        </div>
                                    )}
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
                                <button className="btn-accent btn-tactile" style={{ backgroundColor: "var(--accent-purple)", padding: "12px 32px", fontSize: "0.9rem" }} onClick={handleRotate} disabled={processing}>
                                    {processing ? "Rotating…" : "Rotate PDF"}
                                </button>
                                {processing && (
                                    <div style={{ marginTop: 16 }}>
                                        <div className="progress-bar-track" style={{ height: 24 }}><div className="progress-bar-fill" style={{ width: `${progress}%`, backgroundColor: "var(--accent-purple)" }} /></div>
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
