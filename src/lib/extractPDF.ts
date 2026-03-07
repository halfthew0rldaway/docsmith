import { PDFDocument } from "pdf-lib";

/**
 * Extract specific pages (1-indexed) from a PDF.
 */
export async function extractPages(file: File, pageNumbers: number[]): Promise<Uint8Array> {
    const buf = await file.arrayBuffer();
    const src = await PDFDocument.load(buf);
    const total = src.getPageCount();

    const indices = [...new Set(pageNumbers)]
        .map((n) => n - 1)
        .filter((i) => i >= 0 && i < total)
        .sort((a, b) => a - b);

    const doc = await PDFDocument.create();
    const pages = await doc.copyPages(src, indices);
    pages.forEach((p) => doc.addPage(p));

    return doc.save();
}
