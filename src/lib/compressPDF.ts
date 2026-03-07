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
    // Dynamic import to prevent SSR build issues (DOMMatrix not being defined etc.)
    const pdfjs = await import("pdfjs-dist");

    // Initialize worker
    if (!pdfjs.GlobalWorkerOptions.workerSrc) {
        pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs";
    }

    const arrayBuffer = await file.arrayBuffer();
    const loadingTask = pdfjs.getDocument({ data: arrayBuffer });
    const pdf = await loadingTask.promise;
    const numPages = pdf.numPages;

    const scale = numPages > 30 ? 1.0 : 1.3;
    const currentMB = file.size / (1024 * 1024);
    let quality = Math.max(0.05, Math.min(0.8, (targetMB / currentMB) * 0.8));

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
        canvas.height = 0; canvas.width = 0;
    }

    return await outDoc.save({ useObjectStreams: true });
}
