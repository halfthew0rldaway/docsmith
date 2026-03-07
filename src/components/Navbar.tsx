"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";

const navTools = [
    { href: "/merge", label: "Merge" },
    { href: "/split", label: "Split" },
    { href: "/rotate", label: "Rotate" },
    { href: "/extract", label: "Extract" },
    { href: "/compress", label: "Compress" },
];

export default function Navbar() {
    const path = usePathname();
    return (
        <header style={{ backgroundColor: "var(--ink)", borderBottom: "3px solid var(--ink)" }} className="w-full sticky top-0 z-50">
            <div className="flex items-center justify-between px-6 py-3 gap-6">
                <Link href="/" className="flex items-center gap-3 flex-shrink-0">
                    <span className="font-display text-2xl" style={{ color: "var(--paper)", letterSpacing: "-0.02em" }}>
                        doc<span style={{ color: "var(--tape-yellow)" }}>smith</span>
                    </span>
                    <span
                        className="font-mono"
                        style={{
                            fontSize: "0.58rem", letterSpacing: "0.16em", textTransform: "uppercase",
                            backgroundColor: "var(--tape-yellow)", color: "var(--ink)",
                            padding: "2px 7px", transform: "rotate(-2.5deg)", display: "inline-block", marginTop: "3px",
                        }}
                    >
                        PDF Tools
                    </span>
                </Link>

                <nav className="flex items-center gap-0 overflow-x-auto">
                    {navTools.map((t) => {
                        const active = path === t.href;
                        return (
                            <Link
                                key={t.href}
                                href={t.href}
                                className="font-mono"
                                style={{
                                    fontSize: "0.72rem", letterSpacing: "0.08em", textTransform: "uppercase",
                                    padding: "7px 16px", display: "inline-block", whiteSpace: "nowrap",
                                    backgroundColor: active ? "var(--tape-yellow)" : "transparent",
                                    color: active ? "var(--ink)" : "rgba(245,240,232,0.65)",
                                    transition: "background 0.12s, color 0.12s",
                                }}
                            >
                                {t.label}
                            </Link>
                        );
                    })}
                </nav>
            </div>
        </header>
    );
}
