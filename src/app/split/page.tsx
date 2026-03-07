"use client";
import { useState } from "react";
import dynamic from "next/dynamic";
import { saveAs } from "file-saver";
import FileUploader from "@/components/FileUploader";
import { splitByPages, splitByRanges, SplitResult } from "@/lib/splitPDF";
import { formatBytes } from "@/utils/fileReader";

const PDFPreview = dynamic(() => import("@/components/PDFPreview"), { ssr: false });

export default function SplitPage() {
    const [files, setFiles] = useState<File[]>([]);
    const [mode, setMode] = useState<"pages" | "ranges">("pages");
    const [rangeInput, setRangeInput] = useState("1-3, 4-6");
    const [processing, setProcessing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [results, setResults] = useState<SplitResult[]>([]);
    const [error, setError] = useState("");
    const file = files[0];

    const handleSplit = async () => {
        if (!file) return;
        setProcessing(true); setProgress(30); setError(""); setResults([]);
        try {
            let res: SplitResult[] = [];
            if (mode === "pages") {
                res = await splitByPages(file);
            } else {
                const parsed = rangeInput.split(",").map((s) => {
                    const parts = s.trim().split("-");
                    const s1 = parseInt(parts[0]);
                    const s2 = parseInt(parts[1] || parts[0]);
                    return { start: Math.min(s1, s2), end: Math.max(s1, s2) };
                }).filter((r) => !isNaN(r.start) && !isNaN(r.end));
                res = await splitByRanges(file, parsed);
            }
            setProgress(100); setResults(res);
        } catch (e) { setError("Split failed. Check your range format or file."); console.error(e); }
        finally { setProcessing(false); }
    };

    const reset = () => { setFiles([]); setResults([]); setError(""); setProgress(0); };
    const downloadAll = () => results.forEach((r) => saveAs(new Blob([r.bytes as any], { type: "application/pdf" }), r.name));

    return (
        <div className="w-full px-6 md:px-10 lg:px-16 py-10">
            <div style={{ marginBottom: 32, position: "relative" }}>
                <div style={{ position: "relative", display: "inline-block", marginBottom: 12 }}>
                    <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-blue)", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-1.5deg)", width: "110%", height: 18 }} />
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-navy)", position: "relative", zIndex: 11 }}>separate</span>
                </div>
                <h1 className="font-display fade-in-up" style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", color: "var(--ink)", letterSpacing: "-0.02em", marginBottom: 6 }}>Split PDF</h1>
                <p className="font-body fade-in-up stagger-1" style={{ fontSize: "0.9rem", color: "var(--ink-muted)" }}>Extract every page as its own file, or specify custom page ranges.</p>
                <div className="section-divider fade-in-up stagger-1" style={{ marginTop: 20 }} />
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: 32 }}>
                {/* Step 1: Upload */}
                <div className="paper-card fade-in-up stagger-1" style={{ padding: "24px" }}>
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 18 }}>
                        <h2 className="font-display" style={{ fontSize: "1.1rem", color: "var(--ink)" }}>1. Upload PDF</h2>
                        {files.length > 0 && <button onClick={reset} className="font-mono text-xs underline btn-tactile" style={{ color: "var(--accent-red)" }}>Reset Everything</button>}
                    </div>
                    <FileUploader files={files} onFilesChange={(f) => { setFiles(f); setResults([]); }} label="Drop a PDF here" />
                </div>

                {file && (
                    <>
                        {/* Step 2: Options / Results */}
                        {results.length > 0 ? (
                            <div className="paper-card fade-in-up stagger-2" style={{ padding: "24px", position: "relative" }}>
                                <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-green)", top: -11, left: 24, transform: "rotate(2deg)" }} />
                                <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 14 }}>{results.length} files generated!</h2>
                                <ul className="mb-6" style={{ border: "2px solid var(--ink)" }}>
                                    {results.map((r, i) => (
                                        <li key={i} className="fade-in-up" style={{ animationDelay: `${i * 0.05}s`, display: "flex", alignItems: "center", gap: 12, padding: "8px 16px", borderBottom: i < results.length - 1 ? "1px solid var(--paper-mid)" : undefined }}>
                                            <span className="font-mono" style={{ flex: 1, fontSize: "0.8rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{r.name}</span>
                                            <span className="font-mono text-xs" style={{ color: "var(--ink-muted)" }}>{formatBytes(r.bytes.length)}</span>
                                            <button onClick={() => saveAs(new Blob([r.bytes as any], { type: "application/pdf" }), r.name)} className="btn-tactile underline font-mono text-xs text-accent-teal">Download</button>
                                        </li>
                                    ))}
                                </ul>
                                <div style={{ display: "flex", gap: 12 }}>
                                    <button className="btn-accent btn-tactile" onClick={downloadAll} style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}>Download all (.zip)</button>
                                    <button className="btn-outline btn-tactile" onClick={reset}>Start Over</button>
                                </div>
                            </div>
                        ) : (
                            <div className="paper-card fade-in-up stagger-2" style={{ padding: "24px", position: "relative" }}>
                                <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-blue)", top: -11, right: 30, transform: "rotate(1deg)" }} />
                                <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 16 }}>2. Mode Selection</h2>
                                <div style={{ display: "flex", border: "2px solid var(--ink)", marginBottom: 16 }}>
                                    {(["pages", "ranges"] as const).map((m, i) => (
                                        <button key={m} onClick={() => setMode(m)} className="font-mono btn-tactile"
                                            style={{
                                                flex: 1, padding: "10px 0", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.06em",
                                                backgroundColor: mode === m ? "var(--ink)" : "transparent",
                                                color: mode === m ? "var(--paper)" : "var(--ink)",
                                                border: "none", borderRight: i === 0 ? "1px solid var(--ink)" : "none", cursor: "pointer",
                                            }}>{m === "pages" ? "One File Per Page" : "Custom Ranges"}</button>
                                    ))}
                                </div>
                                {mode === "ranges" && (
                                    <div className="fade-in-up" style={{ marginTop: 6 }}>
                                        <label className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 6, color: "var(--ink)" }}>Page ranges (e.g. 1-3, 4-6)</label>
                                        <input type="text" value={rangeInput} onChange={(e) => setRangeInput(e.target.value)} placeholder="1-3, 4-6" className="ink-input" />
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Step 3: Preview */}
                        <div className="paper-card fade-in-up stagger-3" style={{ padding: "24px" }}>
                            <h2 className="font-display" style={{ fontSize: "1.1rem", marginBottom: 18, color: "var(--ink)" }}>3. Preview {results.length > 0 ? "First Result" : "Original"}</h2>
                            <PDFPreview file={results.length > 0 ? new Blob([results[0].bytes as any], { type: "application/pdf" }) : file!} />
                        </div>

                        {/* Action */}
                        {!results.length && (
                            <div className="fade-in-up stagger-4">
                                <button className="btn-accent btn-tactile" style={{ backgroundColor: "var(--accent-navy)", color: "#fff", padding: "12px 32px", fontSize: "0.9rem" }} onClick={handleSplit} disabled={processing}>
                                    {processing ? "Splitting…" : "Split PDF"}
                                </button>
                            </div>
                        )}
                        {error && <p className="font-mono text-sm mt-3" style={{ color: "var(--accent-red)" }}>{error}</p>}
                    </>
                )}
            </div>
        </div>
    );
}
