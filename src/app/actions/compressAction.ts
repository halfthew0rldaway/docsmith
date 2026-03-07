"use server";
import { exec } from "child_process";
import { promisify } from "util";
import { writeFile, readFile, unlink, stat } from "fs/promises";
import { tmpdir } from "os";
import { join } from "path";
import { randomUUID } from "crypto";

const execAsync = promisify(exec);

const GS_PRESETS: Record<string, { dPDFSETTINGS: string; dImageQuality: number }> = {
    low: { dPDFSETTINGS: "/printer", dImageQuality: 80 },
    medium: { dPDFSETTINGS: "/ebook", dImageQuality: 65 },
    high: { dPDFSETTINGS: "/screen", dImageQuality: 40 },
};

export async function compressPDFAction(formData: FormData) {
    const file = formData.get("file") as File | null;
    const mode = formData.get("mode") as string | null;
    const presetRaw = formData.get("preset") as string | null;
    const targetMBRaw = formData.get("targetMB") as string | null;

    if (!file) throw new Error("No file provided");

    const id = randomUUID();
    const inputPath = join(tmpdir(), `${id}_input.pdf`);
    const outputPath = join(tmpdir(), `${id}_output.pdf`);

    try {
        const bytes = new Uint8Array(await file.arrayBuffer());
        await writeFile(inputPath, bytes);

        if (mode === "preset") {
            const level = (presetRaw || "medium") as keyof typeof GS_PRESETS;
            const cfg = GS_PRESETS[level] || GS_PRESETS.medium;
            const cmd = [
                "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
                `-dPDFSETTINGS=${cfg.dPDFSETTINGS}`, "-dNOPAUSE", "-dQUIET", "-dBATCH",
                "-dColorImageDownsampleType=/Bicubic", "-dColorImageResolution=150",
                "-dGrayImageDownsampleType=/Bicubic", "-dGrayImageResolution=150",
                `-dJPEGQ=${cfg.dImageQuality}`, `-sOutputFile=${outputPath}`, inputPath,
            ].join(" ");
            await execAsync(cmd, { timeout: 60000 });
        } else if (mode === "target") {
            const targetBytes = parseFloat(targetMBRaw || "1") * 1024 * 1024;
            const qualities = [75, 55, 45, 35, 25, 18, 12, 8];
            const res_levels = [150, 150, 120, 100, 96, 72, 72, 72];
            const pdfSettings = ["/ebook", "/ebook", "/ebook", "/ebook", "/screen", "/screen", "/screen", "/screen"];

            let bestPath = outputPath;
            let bestSize = Infinity;

            for (let i = 0; i < qualities.length; i++) {
                const iterPath = join(tmpdir(), `${id}_iter${i}.pdf`);
                const cmd = [
                    "gs", "-sDEVICE=pdfwrite", "-dCompatibilityLevel=1.4",
                    `-dPDFSETTINGS=${pdfSettings[i]}`, "-dNOPAUSE", "-dQUIET", "-dBATCH",
                    "-dColorImageDownsampleType=/Bicubic", `-dColorImageResolution=${res_levels[i]}`,
                    "-dGrayImageDownsampleType=/Bicubic", `-dGrayImageResolution=${res_levels[i]}`,
                    `-dJPEGQ=${qualities[i]}`, `-sOutputFile=${iterPath}`, inputPath,
                ].join(" ");

                await execAsync(cmd, { timeout: 60000 });
                const s = (await stat(iterPath)).size;
                if (s < bestSize) { bestSize = s; bestPath = iterPath; }
                if (s <= targetBytes) break;
            }
            // Final read from bestPath
            const out = await readFile(bestPath);
            // Cleanup all iteration files
            for (let i = 0; i < 8; i++) await unlink(join(tmpdir(), `${id}_iter${i}.pdf`)).catch(() => { });
            await unlink(inputPath).catch(() => { });
            return {
                base64: Buffer.from(out).toString("base64"),
                originalSize: file.size,
                compressedSize: out.length,
            };
        } else {
            throw new Error("Invalid mode");
        }

        const outBytes = await readFile(outputPath);
        await unlink(inputPath).catch(() => { });
        await unlink(outputPath).catch(() => { });

        return {
            base64: Buffer.from(outBytes).toString("base64"),
            originalSize: file.size,
            compressedSize: outBytes.length,
        };
    } catch (err: any) {
        console.error("Action error:", err);
        await unlink(inputPath).catch(() => { });
        await unlink(outputPath).catch(() => { });
        throw new Error(err.message || "Compression failed. This server might not have Ghostscript installed.");
    }
}
