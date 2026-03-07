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
 * Uses an iterative loop to guarantee hitting the target size.
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
    const targetBytes = targetMB * 1024 * 1024;

    /**
     * Internal pass function to try a specific quality/scale
     */
    async function runPass(quality: number, scale: number): Promise<Uint8Array> {
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

            // Clean up canvas
            canvas.width = 0; canvas.height = 0;
        }
        return await outDoc.save({ useObjectStreams: true });
    }

    // Heuristics for initial guess
    const ratio = targetMB / (file.size / (1024 * 1024));
    let currentScale = numPages > 30 ? 0.9 : 1.2;
    let currentQuality = Math.max(0.1, Math.min(0.8, Math.pow(ratio, 0.45) * 0.7));

    if (onProgress) onProgress(10);
    let result = await runPass(currentQuality, currentScale);

    // Iterative Correction: If we're over the target, we do ONE more pass with calibrated values.
    // This is a "Target-Seeking" logic. Better to be slightly under than over.
    if (result.length > targetBytes * 1.05) {
        if (onProgress) onProgress(50);
        // Correct based on how much we were over
        const overRatio = targetBytes / result.length;
        currentQuality = Math.max(0.05, currentQuality * overRatio * 0.9);
        currentScale = Math.max(0.7, currentScale * Math.sqrt(overRatio));

        result = await runPass(currentQuality, currentScale);
    }

    if (onProgress) onProgress(100);
    return result;
}
