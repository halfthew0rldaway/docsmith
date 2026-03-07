import { saveAs } from "file-saver";

export function downloadPDF(bytes: Uint8Array, filename: string): void {
    const blob = new Blob([bytes], { type: "application/pdf" });
    saveAs(blob, filename);
}
