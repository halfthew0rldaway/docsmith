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
            // Limit viewport for mobile canvas memory limits (~3000px cap is safe for modern phones)
            let viewport = page.getViewport({ scale });
            const MAX_CANVAS_DIMENSION = 2800;
            if (viewport.width > MAX_CANVAS_DIMENSION || viewport.height > MAX_CANVAS_DIMENSION) {
                const maxDim = Math.max(viewport.width, viewport.height);
                const safeScale = scale * (MAX_CANVAS_DIMENSION / maxDim);
                viewport = page.getViewport({ scale: safeScale });
            }

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d")!;
            canvas.height = viewport.height;
            canvas.width = viewport.width;

            await page.render({ canvasContext: context, viewport, canvas } as any).promise;

            const imageData = canvas.toDataURL("image/jpeg", quality);

            // Fix Safari Memory & Network errors: Manually parse base64 using a chunked array buffer.
            // fetch(dataURL) fails on iOS when string is large. Array.from maps OOM. This loop is safest.
            const base64Data = imageData.split(",")[1];
            const byteString = atob(base64Data);
            const imageBuffer = new ArrayBuffer(byteString.length);
            const imageBytes = new Uint8Array(imageBuffer);
            for (let j = 0; j < byteString.length; j++) {
                imageBytes[j] = byteString.charCodeAt(j);
            }

            const pdfImage = await outDoc.embedJpg(imageBytes);
            const newPage = outDoc.addPage([viewport.width, viewport.height]);
            newPage.drawImage(pdfImage, {
                x: 0, y: 0, width: viewport.width, height: viewport.height,
            });

            // Clean up to prevent iOS Canvas and PDF.js memory limits
            page.cleanup();
            canvas.width = 0;
            canvas.height = 0;
        }
        return await outDoc.save({ useObjectStreams: true });
    }

    // Heuristics for initial guess
    const ratio = targetMB / (file.size / (1024 * 1024));
    let currentScale = numPages > 30 ? 0.9 : 1.2;
    let currentQuality = Math.max(0.1, Math.min(0.8, Math.pow(ratio, 0.45) * 0.7));

    if (onProgress) onProgress(10);
    let result = await runPass(currentQuality, currentScale);

    // Iterative Correction:
    // If we're over the target by 5% OR under by 25%, we run a calibrated second pass.
    if (result.length > targetBytes * 1.05 || result.length < targetBytes * 0.75) {
        if (onProgress) onProgress(50);

        // Calculate exactly how far off we were
        const diffRatio = targetBytes / result.length;

        // Responsibly scale quality and resolution based on the difference
        // SQRT the ratio to gently adjust the curves
        currentQuality = Math.max(0.05, Math.min(0.95, currentQuality * Math.pow(diffRatio, 0.5)));
        currentScale = Math.max(0.6, Math.min(2.0, currentScale * Math.pow(diffRatio, 0.3)));

        result = await runPass(currentQuality, currentScale);
    }

    if (onProgress) onProgress(100);
    return result;
}
