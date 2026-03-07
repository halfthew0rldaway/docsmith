"use client";

export type CompressionMode = "preset" | "target";
export type PresetLevel = "low" | "medium" | "high";

interface CompressionOptionsProps {
    mode: CompressionMode;
    onModeChange: (m: CompressionMode) => void;
    preset: PresetLevel;
    onPresetChange: (p: PresetLevel) => void;
    targetMB: string;
    onTargetMBChange: (v: string) => void;
    originalSizeMB: number | null;
}

const PRESETS: { value: PresetLevel; label: string; desc: string; bg: string; border: string }[] = [
    { value: "low", label: "Low", desc: "Gentle — minimal quality loss", bg: "#e8f5e9", border: "#2e7d32" },
    { value: "medium", label: "Medium", desc: "Balanced — good size reduction", bg: "var(--tape-yellow)", border: "#b8860b" },
    { value: "high", label: "High", desc: "Aggressive — maximum compression", bg: "#fce8e8", border: "var(--accent-red)" },
];

export default function CompressionOptions({
    mode, onModeChange, preset, onPresetChange, targetMB, onTargetMBChange, originalSizeMB,
}: CompressionOptionsProps) {
    return (
        <div style={{ position: "relative" }}>
            {/* Toggle */}
            <div style={{ display: "flex", border: "2px solid var(--ink)", marginBottom: 16 }}>
                {(["preset", "target"] as CompressionMode[]).map((m, i) => (
                    <button
                        key={m}
                        onClick={() => onModeChange(m)}
                        className="font-mono btn-tactile"
                        style={{
                            flex: 1, padding: "8px 0", fontSize: "0.72rem", fontWeight: 700,
                            letterSpacing: "0.08em", textTransform: "uppercase",
                            backgroundColor: mode === m ? "var(--ink)" : "transparent",
                            color: mode === m ? "var(--paper)" : "var(--ink)",
                            border: "none", borderRight: i === 0 ? "2px solid var(--ink)" : "none",
                            cursor: "pointer", transition: "background 0.1s",
                        }}
                    >
                        {m === "preset" ? "By Quality" : "By Target Size"}
                    </button>
                ))}
            </div>

            {mode === "preset" && (
                <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                    {PRESETS.map((p) => (
                        <label
                            key={p.value}
                            className="btn-tactile"
                            style={{
                                display: "flex", alignItems: "center", gap: 10, padding: "10px 12px",
                                backgroundColor: preset === p.value ? p.bg : "var(--paper-dark)",
                                border: `2px solid ${preset === p.value ? p.border : "rgba(26,26,26,0.2)"}`,
                                cursor: "pointer", transition: "border 0.1s, background 0.1s",
                            }}
                        >
                            <input type="radio" name="preset" value={p.value} checked={preset === p.value} onChange={() => onPresetChange(p.value)} />
                            <div>
                                <span className="font-display" style={{ fontSize: "1rem", color: "var(--ink)" }}>{p.label}</span>
                                <span className="font-mono text-xs" style={{ marginLeft: 8, color: "var(--ink-muted)" }}>{p.desc}</span>
                            </div>
                        </label>
                    ))}
                </div>
            )}

            {mode === "target" && (
                <div>
                    <label className="font-mono" style={{ fontSize: "0.68rem", fontWeight: 700, letterSpacing: "0.1em", textTransform: "uppercase", display: "block", marginBottom: 8, color: "var(--ink)" }}>
                        Target file size
                    </label>
                    <div style={{ display: "flex", border: "2px solid var(--ink)" }}>
                        <input
                            type="number" min="0.1" step="0.1" value={targetMB}
                            onChange={(e) => onTargetMBChange(e.target.value)} placeholder="e.g. 1.0"
                            className="ink-input" style={{ border: "none", flex: 1, outline: "none" }}
                        />
                        <span
                            className="font-mono"
                            style={{
                                padding: "8px 12px", backgroundColor: "var(--paper-dark)",
                                borderLeft: "2px solid var(--ink)", color: "var(--ink)",
                                display: "flex", alignItems: "center", fontWeight: 700, flexShrink: 0,
                            }}
                        >
                            MB
                        </span>
                    </div>
                    {originalSizeMB !== null && (
                        <p className="font-mono text-xs" style={{ marginTop: 6, color: "var(--ink-muted)" }}>
                            Current: {originalSizeMB.toFixed(2)} MB
                            {targetMB && parseFloat(targetMB) >= originalSizeMB && (
                                <span style={{ color: "var(--accent-red)" }}> · must be smaller than original</span>
                            )}
                        </p>
                    )}
                </div>
            )}
        </div>
    );
}
