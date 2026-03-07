"use client";
import { formatBytes } from "@/utils/fileReader";

const IconDownload = () => (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="8 17 12 21 16 17" /><line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.88 18.09A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.29" />
    </svg>
);
const IconRefresh = () => (
    <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="23 4 23 10 17 10" /><path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10" />
    </svg>
);
const IconCheck = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="20 6 9 17 4 12" />
    </svg>
);
const IconFile = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" />
    </svg>
);

interface DownloadButtonProps {
    blob: Blob | null;
    filename: string;
    label?: string;
    onReset: () => void;
}

export default function DownloadButton({ blob, filename, label = "Download PDF", onReset }: DownloadButtonProps) {
    const handleDownload = () => {
        if (!blob) return;
        const finalName = filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = finalName;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);
    };

    if (!blob) return null;

    return (
        <div className="paper-card fade-in-up" style={{ padding: "24px", position: "relative" }}>
            <div className="tape-strip wiggle-tape" style={{ backgroundColor: "var(--tape-green)", top: -12, left: 28, transform: "rotate(2deg)" }} />

            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 16 }}>
                <div style={{
                    width: 28, height: 28, backgroundColor: "var(--accent-teal)", border: "2px solid var(--ink)",
                    display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", flexShrink: 0,
                }}>
                    <IconCheck />
                </div>
                <h3 className="font-display" style={{ fontSize: "1.2rem", color: "var(--ink)" }}>Your file is ready!</h3>
            </div>

            <div style={{
                display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", marginBottom: 20,
                backgroundColor: "var(--paper-dark)", border: "2px solid var(--ink)",
            }}>
                <span style={{ color: "var(--ink-muted)", flexShrink: 0 }}><IconFile /></span>
                <div style={{ minWidth: 0 }}>
                    <p className="font-mono" style={{ fontSize: "0.85rem", color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                        {filename.toLowerCase().endsWith(".pdf") ? filename : `${filename}.pdf`}
                    </p>
                    <p className="font-mono" style={{ fontSize: "0.7rem", color: "var(--ink-muted)" }}>{formatBytes(blob.size)}</p>
                </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
                <button className="btn-accent btn-tactile w-full sm:w-auto justify-center" onClick={handleDownload} style={{ backgroundColor: "var(--ink)", color: "var(--paper)" }}>
                    <IconDownload /> {label}
                </button>
                <button className="btn-outline btn-tactile w-full sm:w-auto justify-center" onClick={onReset}>
                    <IconRefresh /> Start Over
                </button>
            </div>
        </div>
    );
}
