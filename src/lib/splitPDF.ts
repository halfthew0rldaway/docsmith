import { PDFDocument } from "pdf-lib";

export interface SplitResult {
    name: string;
    bytes: Uint8Array;
}

/**
 * Extract each page as its own PDF.
 */
export async function splitByPages(file: File): Promise<SplitResult[]> {
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf);
    const total = src.getPageCount();
    const results: SplitResult[] = [];

    for (let i = 0; i < total; i++) {
        const doc = await PDFDocument.create();
        const [page] = await doc.copyPages(src, [i]);
        doc.addPage(page);
        const bytes = await doc.save();
        const baseName = file.name.replace(/\.pdf$/i, "");
        results.push({ name: `${baseName}_page${i + 1}.pdf`, bytes });
    }

    return results;
}

/**
 * Split file at specified page boundaries.
 * ranges: array of {start, end} (1-indexed, inclusive)
 */
export async function splitByRanges(
    file: File,
    ranges: { start: number; end: number }[]
): Promise<SplitResult[]> {
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf);
    const total = src.getPageCount();
    const results: SplitResult[] = [];

    for (const r of ranges) {
        const s = Math.max(1, r.start) - 1;
        const e = Math.min(total, r.end) - 1;
        const indices = Array.from({ length: e - s + 1 }, (_, i) => s + i);
        const doc = await PDFDocument.create();
        const pages = await doc.copyPages(src, indices);
        pages.forEach((p) => doc.addPage(p));
        const bytes = await doc.save();
        const baseName = file.name.replace(/\.pdf$/i, "");
        results.push({ name: `${baseName}_p${r.start}-${r.end}.pdf`, bytes });
    }

    return results;
}
