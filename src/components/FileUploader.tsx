"use client";
import { useCallback, useRef, useState } from "react";
import { formatBytes } from "@/utils/fileReader";

const IconUpload = () => (
    <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="16 16 12 12 8 16" />
        <line x1="12" y1="12" x2="12" y2="21" />
        <path d="M20.39 18.39A5 5 0 0 0 18 9h-1.26A8 8 0 1 0 3 16.3" />
    </svg>
);
const IconFile = () => (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
        <polyline points="14 2 14 8 20 8" />
    </svg>
);
const IconX = () => (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
        <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
    </svg>
);

interface FileUploaderProps {
    accept?: string;
    multiple?: boolean;
    files: File[];
    onFilesChange: (files: File[]) => void;
    label?: string;
}

export default function FileUploader({
    accept = "application/pdf",
    multiple = false,
    files,
    onFilesChange,
    label = "Drop PDF files here",
}: FileUploaderProps) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [dragging, setDragging] = useState(false);

    const addFiles = useCallback(
        (incoming: FileList | null) => {
            if (!incoming) return;
            const valid = Array.from(incoming).filter((f) =>
                accept.split(",").some((a) => {
                    const t = a.trim();
                    if (t.includes("/")) return f.type === t;
                    if (t.startsWith(".")) return f.name.endsWith(t);
                    return true;
                })
            );
            if (!valid.length) return;
            onFilesChange(multiple ? [...files, ...valid] : [valid[0]]);
        },
        [accept, files, multiple, onFilesChange]
    );

    const onDrop = useCallback((e: React.DragEvent) => {
        e.preventDefault(); setDragging(false); addFiles(e.dataTransfer.files);
    }, [addFiles]);

    const removeFile = (idx: number) => {
        const next = [...files]; next.splice(idx, 1); onFilesChange(next);
    };

    return (
        <div>
            <div
                className={`drop-zone relative flex flex-col items-center justify-center gap-3 p-10 cursor-pointer${dragging ? " dragover" : ""}`}
                style={{ minHeight: 192 }}
                onClick={() => inputRef.current?.click()}
                onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
            >
                {/* Tape */}
                <div
                    className="tape-strip pointer-events-none"
                    style={{ backgroundColor: "var(--tape-yellow)", top: -11, left: "calc(50% - 30px)", transform: "rotate(-1.5deg)" }}
                />

                {/* Icon box */}
                <div style={{
                    width: 56, height: 56, border: "2px solid var(--ink)",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    backgroundColor: dragging ? "var(--tape-yellow)" : "var(--paper-mid)",
                    color: "var(--ink-muted)", transition: "background 0.15s",
                    boxShadow: "2px 2px 0 var(--ink)",
                }}>
                    <IconUpload />
                </div>

                <div className="text-center">
                    <p className="font-display text-base" style={{ color: "var(--ink)" }}>{label}</p>
                    <p className="font-mono text-xs mt-1" style={{ color: "var(--ink-muted)" }}>
                        or click to browse · {multiple ? "multiple files ok" : "one file only"}
                    </p>
                </div>

                {files.length > 0 && (
                    <span className="ink-label" style={{ backgroundColor: "var(--accent-teal)" }}>
                        {files.length} file{files.length > 1 ? "s" : ""} selected
                    </span>
                )}
            </div>

            <input ref={inputRef} type="file" accept={accept} multiple={multiple} style={{ display: "none" }} onChange={(e) => addFiles(e.target.files)} />

            {files.length > 0 && (
                <ul style={{ borderTop: "none", borderLeft: "2px solid var(--ink)", borderRight: "2px solid var(--ink)", borderBottom: "2px solid var(--ink)" }}>
                    {files.map((f, i) => (
                        <li
                            key={`${f.name}-${i}`}
                            style={{
                                display: "flex", alignItems: "center", justifyContent: "space-between",
                                padding: "7px 12px",
                                backgroundColor: i % 2 === 0 ? "var(--paper)" : "var(--paper-dark)",
                                borderTop: i > 0 ? "1px solid var(--paper-mid)" : undefined,
                            }}
                        >
                            <div style={{ display: "flex", alignItems: "center", gap: 7, flex: 1, minWidth: 0 }}>
                                <span style={{ color: "var(--ink-muted)", flexShrink: 0 }}><IconFile /></span>
                                <span className="font-mono text-sm" style={{ color: "var(--ink)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                                    {f.name}
                                </span>
                            </div>
                            <div style={{ display: "flex", alignItems: "center", gap: 10, flexShrink: 0, marginLeft: 8 }}>
                                <span className="size-badge">{formatBytes(f.size)}</span>
                                <button
                                    onClick={(e) => { e.stopPropagation(); removeFile(i); }}
                                    style={{ background: "none", border: "none", cursor: "pointer", color: "var(--ink-muted)", padding: 2, display: "flex", alignItems: "center" }}
                                    aria-label="Remove file"
                                >
                                    <IconX />
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
}
