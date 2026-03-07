import { PDFDocument } from "pdf-lib";

/**
 * Standard client-side compression using pdf-lib.
 * Good for structural cleanup, but doesn't resize images.
 */
export async function compressPDFClient(file: File): Promise<Uint8Array> {
    const arrayBuffer = await file.arrayBuffer();
    const pdfDoc = await PDFDocument.load(arrayBuffer);
    pdfDoc.setTitle(""); pdfDoc.setAuthor(""); pdfDoc.setSubject(""); pdfDoc.setKeywords([]); pdfDoc.setProducer(""); pdfDoc.setCreator("");
    return await pdfDoc.save({ useObjectStreams: true, addDefaultPage: false });
}

/**
 * Aggressive client-side compression using Rasterization.
 * PDF -> Images (JPEG) -> New PDF.
 */
export async function compressPDFAggressive(
    file: File,
    targetMB: number,
    onProgress?: (p: number) => void
): Promise<Uint8Array> {
    const pdfjs = await import("pdfjs-dist");
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    // Heuristic for resolution based on target size and page count
    // If we want a large target but have many pages, we still need to downscale
    const currentMB = file.size / (1024 * 1024);
    const targetSizePerPage = targetMB / numPages;

    // Resolution adjustment (DPI equivalent)
    // 1.0 scale is typically 72-96 DPI. 1.5 is ~144 DPI.
    let scale = 1.3;
    if (targetSizePerPage < 0.05) scale = 0.9; // Very tight target
    if (targetSizePerPage > 0.3) scale = 1.6;  // Loose target

    // Smarter quality curve: JPEG quality is non-linear.
    // Quality 0.1 to 0.9.
    // Rough estimate: size ~ quality^0.5 * pixels
    const ratio = targetMB / currentMB;
    let quality = Math.max(0.1, Math.min(0.85, Math.pow(ratio, 0.4) * 0.7));

    // If target is very close to current, don't over-compress
    if (ratio >= 0.9) quality = 0.92;

    const outDoc = await PDFDocument.create();

    for (let i = 1; i <= numPages; i++) {
        const page = await pdf.getPage(i);
        const viewport = page.getViewport({ scale });

        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d")!;
        canvas.height = viewport.height;
        canvas.width = viewport.width;

        await page.render({ canvasContext: context, viewport, canvas } as any).promise;

        const imageData = canvas.toDataURL("image/jpeg", quality);
        const base64Data = imageData.split(",")[1];
        const imageBytes = Uint8Array.from(atob(base64Data), c => c.charCodeAt(0));

        const pdfImage = await outDoc.embedJpg(imageBytes);
        const newPage = outDoc.addPage([viewport.width, viewport.height]);
        newPage.drawImage(pdfImage, {
            x: 0, y: 0, width: viewport.width, height: viewport.height,
        });

        if (onProgress) onProgress((i / numPages) * 100);

        // Cleanup to prevent memory leak
        canvas.width = 0; canvas.height = 0;
    }

    return await outDoc.save({ useObjectStreams: true });
}
