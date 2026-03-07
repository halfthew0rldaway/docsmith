import { PDFDocument, degrees } from "pdf-lib";

export type RotationDeg = 90 | 180 | 270;

/**
 * Rotate selected pages (1-indexed). Pass empty array to rotate all pages.
 */
export async function rotatePages(
    file: File,
    pageNumbers: number[],
    rotation: RotationDeg
): Promise<Uint8Array> {
    const buf = await file.arrayBuffer();
    const doc = await PDFDocument.load(buf);
    const total = doc.getPageCount();

    const targets =
        pageNumbers.length === 0
            ? Array.from({ length: total }, (_, i) => i)
            : pageNumbers.map((n) => n - 1).filter((i) => i >= 0 && i < total);

    targets.forEach((i) => {
        const page = doc.getPage(i);
        const current = page.getRotation().angle;
        page.setRotation(degrees((current + rotation) % 360));
    });

    return doc.save();
}
