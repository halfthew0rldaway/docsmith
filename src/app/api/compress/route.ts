import { NextRequest, NextResponse } from "next/server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const MAX_FILE_SIZE = 50 * 1024 * 1024; // 50 MB

// Ghostscript quality settings per preset
const GS_PRESETS: Record<string, { dPDFSETTINGS: string; dImageQuality: number }> = {
    low: { dPDFSETTINGS: "/printer", dImageQuality: 80 },
    medium: { dPDFSETTINGS: "/ebook", dImageQuality: 65 },
    high: { dPDFSETTINGS: "/screen", dImageQuality: 40 },
};

function buildGsCommand(input: string, output: string, quality: number, pdfSettings: string): string {
    return [
        "gs",
        "-sDEVICE=pdfwrite",
        "-dCompatibilityLevel=1.4",
        `-dPDFSETTINGS=${pdfSettings}`,
        "-dNOPAUSE",
        "-dQUIET",
        "-dBATCH",
        "-dCompressFonts=true",
        "-dSubsetFonts=true",
        "-dEmbedAllFonts=false",
        "-dPrinted=false",
        "-dColorImageDownsampleType=/Bicubic",
        `-dColorImageResolution=${quality < 50 ? 72 : quality < 70 ? 100 : 150}`,
        "-dGrayImageDownsampleType=/Bicubic",
        `-dGrayImageResolution=${quality < 50 ? 72 : quality < 70 ? 100 : 150}`,
        "-dMonoImageDownsampleType=/Bicubic",
        "-dMonoImageResolution=150",
        `-dJPEGQ=${quality}`,
        `-sOutputFile=${output}`,
        input,
    ].join(" ");
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        const mode = formData.get("mode") as string | null;         // "preset" | "target"
        const presetRaw = formData.get("preset") as string | null;  // "low"|"medium"|"high"
        const targetMBRaw = formData.get("targetMB") as string | null;

        if (!file) {
            return NextResponse.json({ error: "No file provided" }, { status: 400 });
        }

        if (file.size > MAX_FILE_SIZE) {
            return NextResponse.json({ error: "File too large (max 50 MB)" }, { status: 413 });
        }

        // Write input to tmp
        const id = randomUUID();
        const inputPath = join(tmpdir(), `${id}_input.pdf`);
        const outputPath = join(tmpdir(), `${id}_output.pdf`);

        const bytes = new Uint8Array(await file.arrayBuffer());
        await writeFile(inputPath, bytes);

        let success = false;
        let finalOutputPath = outputPath;

        try {
            if (mode === "preset") {
                const level = (presetRaw || "medium") as keyof typeof GS_PRESETS;
                const cfg = GS_PRESETS[level] || GS_PRESETS.medium;
                const cmd = buildGsCommand(inputPath, outputPath, cfg.dImageQuality, cfg.dPDFSETTINGS);
                await execAsync(cmd, { timeout: 60000 });
                success = true;

            } else if (mode === "target") {
                const targetBytes = parseFloat(targetMBRaw || "1") * 1024 * 1024;

                // Iterative approach: progressively more aggressive compression
                const qualities = [75, 55, 45, 35, 25, 18, 12, 8];
                const res_levels = [150, 150, 120, 100, 96, 72, 72, 72];
                const pdfSettings = ["/ebook", "/ebook", "/ebook", "/ebook", "/screen", "/screen", "/screen", "/screen"];

                let bestPath: string | null = null;
                let bestSize = Infinity;

                for (let i = 0; i < qualities.length; i++) {
                    const iterPath = join(tmpdir(), `${id}_iter${i}.pdf`);
                    const q_val = qualities[i];
                    const r_val = res_levels[i];
                    const s_val = pdfSettings[i];

                    const cmd = [
                        "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
                        `-dPDFSETTINGS=${s_val}`, "-dNOPAUSE", "-dQUIET", "-dBATCH",
                        "-dColorImageDownsampleType=/Bicubic", `-dColorImageResolution=${r_val}`,
                        "-dGrayImageDownsampleType=/Bicubic", `-dGrayImageResolution=${r_val}`,
                        "-dMonoImageDownsampleType=/Bicubic", "-dMonoImageResolution=150",
                        `-dJPEGQ=${q_val}`, `-sOutputFile=${iterPath}`, inputPath,
                    ].join(" ");

                    await execAsync(cmd, { timeout: 60000 });

                    const s = (await stat(iterPath)).size;

                    if (s < bestSize) {
                        bestSize = s;
                        bestPath = iterPath;
                    }

                    if (s <= targetBytes) break;
                }

                finalOutputPath = bestPath || outputPath;
                success = true;
            } else {
                return NextResponse.json({ error: "Invalid compression mode" }, { status: 400 });
            }
        } catch (gsErr: unknown) {
            console.error("Ghostscript error:", gsErr);
            // Cleanup
            await unlink(inputPath).catch(() => { });
            return NextResponse.json(
                { error: "Compression failed. Ghostscript may not be installed on this server." },
                { status: 500 }
            );
        }

        if (!success) {
            return NextResponse.json({ error: "Compression produced no output" }, { status: 500 });
        }

        const outBytes = await readFile(finalOutputPath);
        const originalSize = file.size;
        const compressedSize = outBytes.length;

        // Cleanup all temp files
        await unlink(inputPath).catch(() => { });
        await unlink(outputPath).catch(() => { });
        // Cleanup iteration files
        for (let i = 0; i < 7; i++) {
            await unlink(join(tmpdir(), `${id}_iter${i}.pdf`)).catch(() => { });
        }

        return new NextResponse(outBytes, {
            status: 200,
            headers: {
                "Content-Type": "application/pdf",
                "Content-Disposition": `attachment; filename="compressed.pdf"`,
                "X-Original-Size": String(originalSize),
                "X-Compressed-Size": String(compressedSize),
                "Access-Control-Expose-Headers": "X-Original-Size, X-Compressed-Size",
            },
        });
    } catch (err) {
        console.error("Compress route error:", err);
        return NextResponse.json({ error: "Internal server error" }, { status: 500 });
    }
}
