import Link from "next/link";
import { ReactNode } from "react";

interface ToolCardProps {
    href: string;
    icon: ReactNode;
    title: string;
    description: string;
    accentColor: string;
    tapeColor: string;
    rotation: string;
    tag: string;
}

export default function ToolCard({ href, icon, title, description, accentColor, tapeColor, rotation, tag, index = 0 }: ToolCardProps & { index?: number }) {
    return (
        <Link
            href={href}
            className={`block group fade-in-up stagger-${(index % 5) + 1} h-full`}
            style={{ transform: rotation }}
        >
            <div className="paper-card-lift hover-lift h-full" style={{ minHeight: 230, transition: "transform 0.15s, box-shadow 0.15s", display: "flex", flexDirection: "column" }}>
                {/* Tape */}
                <div className="tape-strip wiggle-tape" style={{ backgroundColor: tapeColor, top: -13, left: 22 }} />
                {/* Accent bar */}
                <div style={{ backgroundColor: accentColor, height: 7, width: "100%" }} />

                <div className="p-6 pt-5 flex-1 flex flex-col">
                    <span
                        className="font-mono"
                        style={{
                            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.14em", textTransform: "uppercase",
                            backgroundColor: accentColor, color: "#fff", padding: "2px 8px", display: "inline-block", marginBottom: 14,
                        }}
                    >
                        {tag}
                    </span>
                    <div
                        style={{
                            width: 52, height: 52, backgroundColor: accentColor, border: "2px solid var(--ink)",
                            color: "#fff", display: "flex", alignItems: "center", justifyContent: "center",
                            marginBottom: 14, boxShadow: "3px 3px 0 var(--ink)",
                        }}
                    >
                        {icon}
                    </div>

                    <h3 className="font-display" style={{ fontSize: "1.25rem", color: "var(--ink)", lineHeight: 1.1, marginBottom: 8 }}>
                        {title}
                    </h3>
                    <p className="font-body text-sm flex-1" style={{ color: "var(--ink-muted)", lineHeight: 1.6 }}>
                        {description}
                    </p>

                    <div
                        className="font-mono"
                        style={{
                            fontSize: "0.65rem", fontWeight: 700, letterSpacing: "0.12em", textTransform: "uppercase",
                            color: accentColor, marginTop: 18, display: "flex", alignItems: "center", gap: 6,
                        }}
                    >
                        Open tool
                        <svg
                            width="12" height="12" viewBox="0 0 16 16" fill="none" stroke="currentColor"
                            strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                            className="transition-transform duration-150 group-hover:translate-x-1"
                        >
                            <line x1="2" y1="8" x2="14" y2="8" />
                            <polyline points="9 3 14 8 9 13" />
                        </svg>
                    </div>
                </div>
            </div>
        </Link>
    );
}
