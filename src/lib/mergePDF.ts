import { PDFDocument } from "pdf-lib";

export async function mergePDFs(files: File[]): Promise<Uint8Array> {
    const merged = await PDFDocument.create();

    for (const file of files) {
        const buf = await file.arrayBuffer();
        const doc = await PDFDocument.load(buf);
        const pages = await merged.copyPages(doc, doc.getPageIndices());
        pages.forEach((p) => merged.addPage(p));
    }

    return merged.save();
}
