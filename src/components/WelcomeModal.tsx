"use client";
import { useState, useEffect } from "react";

export default function WelcomeModal() {
    const [isOpen, setIsOpen] = useState(false);

    useEffect(() => {
        setIsOpen(true);
        // Prevent scroll
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const close = () => {
        setIsOpen(false);
        document.body.style.overflow = "auto";
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 z-[9999] flex items-center justify-center p-6 bg-[rgba(26,26,26,0.65)] backdrop-blur-md fade-in"
            onClick={close}
        >
            <div
                className="modal-container-styled relative w-full max-w-2xl bg-[#f5f0e8] border-3 border-[#1a1a1a] p-10 md:p-14 shadow-[12px_12px_0_#1a1a1a] "
                style={{ transform: "rotate(-0.5deg)" }}
                onClick={(e) => e.stopPropagation()}
            >
                {/* Decorative Tapes */}
                <div className="absolute -top-4 left-6 w-24 h-8 bg-[#ffe566] rotate-[-2deg] opacity-90 border border-black/10 z-10 wiggle-tape" />
                <div className="absolute -bottom-3 right-8 w-20 h-7 bg-[#f5b3c8] rotate-[3deg] opacity-90 border border-black/10 z-10 wiggle-tape" style={{ animationDelay: "0.5s" }} />

                <div className="mb-8">
                    <span className="inline-block bg-[#1a1a1a] color-[#f5f0e8] px-3 py-1 font-mono text-[0.65rem] font-bold tracking-widest uppercase mb-4" style={{ backgroundColor: "#1a1a1a", color: "#f5f0e8" }}>MANIFESTO V1.0</span>
                    <h1 className="font-display text-4xl md:text-5xl text-[#1a1a1a] leading-tight tracking-tight mt-2">
                        Docsmith: The Actual Good One.
                    </h1>
                </div>

                <div className="font-body space-y-5 text-[#1a1a1a] text-lg leading-relaxed">
                    <p>
                        “If you were hoping for another bloated PDF site that locks basic buttons behind a ‘Pro’ subscription, this might feel unfamiliar. No paywall for rotating a page. No ‘free trial’ that ends the moment you click something useful.”
                    </p>
                    <p>
                        I actually built this project for my girlfriend. She was tired of <strong>"free"</strong> sites that couldn't hit a <em>Target File Size</em> if their existence depended on it. Watching someone you love get frustrated by a 40MB PDF that refuses to shrink to 2MB is a special kind of modern torture.
                    </p>
                    <p>
                        So here’s the deal. Docsmith is fast, private, and everything runs directly in your browser. No uploads to some mystery server. You tell it the file size you want, and it actually tries to get you there.
                    </p>
                    <p className="font-mono text-sm pt-4 text-[#7a7060]">
                        — Signed, the guy who made this because someone he loves deserved better tools.
                    </p>
                </div>

                <div className="mt-10 flex items-center gap-6">
                    <button
                        onClick={close}
                        className="btn-accent btn-tactile w-full sm:w-auto bg-[#1a1a1a] text-[#f5f0e8] px-12 py-4 font-mono font-bold tracking-widest text-sm uppercase hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-[6px_6px_0_#1a1a1a] transition-all"
                        style={{ backgroundColor: "#1a1a1a", color: "#f5f0e8" }}
                    >
                        Let's go, nerd.
                    </button>
                    <span className="hidden sm:inline font-mono text-xs text-[#7a7060]">
                        (Escape to skip)
                    </span>
                </div>

                {/* Corner detail */}
                <div className="absolute top-6 right-6 opacity-10 pointer-events-none rotate-12">
                    <svg width="60" height="60" viewBox="0 0 100 100" className="text-black">
                        <path d="M10,50 L90,50 M50,10 L50,90" stroke="currentColor" strokeWidth="12" fill="none" />
                    </svg>
                </div>
            </div>
        </div>
    );
}
