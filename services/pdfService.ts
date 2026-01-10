import * as pdfjsLib from 'pdfjs-dist';

// Set worker source to CDN to avoid build configuration issues
// We use the version matching the installed package ideally, but latest usually works for standard features
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;

export class PdfService {
    /**
     * Extracts pages from a PDF file as base64 images
     * @param pdfBase64 Base64 string of the PDF (can include data URI prefix)
     * @returns Array of base64 image strings
     */
    async extractPdfPages(pdfBase64: string): Promise<string[]> {
        try {
            // Remove data URI prefix if present
            const base64Data = pdfBase64.replace(/^data:application\/pdf;base64,/, '');

            // Decode base64
            const binaryString = atob(base64Data);
            const len = binaryString.length;
            const bytes = new Uint8Array(len);
            for (let i = 0; i < len; i++) {
                bytes[i] = binaryString.charCodeAt(i);
            }

            // Load Document
            const loadingTask = pdfjsLib.getDocument({ data: bytes });
            const pdf = await loadingTask.promise;
            const numPages = pdf.numPages;

            const pagesToExtract: number[] = [];

            // Page selection strategy
            if (numPages <= 3) {
                // Extract all pages
                for (let i = 1; i <= numPages; i++) {
                    pagesToExtract.push(i);
                }
            } else {
                // Extract first, second, and last page
                pagesToExtract.push(1);
                pagesToExtract.push(2);
                pagesToExtract.push(numPages);
            }

            const extractedImages: string[] = [];

            for (const pageNum of pagesToExtract) {
                const page = await pdf.getPage(pageNum);
                const viewport = page.getViewport({ scale: 2.0 }); // 2x scale for better quality

                const canvas = document.createElement('canvas');
                const context = canvas.getContext('2d');
                canvas.height = viewport.height;
                canvas.width = viewport.width;

                if (context) {
                    await page.render({
                        canvasContext: context,
                        viewport: viewport
                    } as any).promise;

                    const imgBase64 = canvas.toDataURL('image/jpeg', 0.85);
                    extractedImages.push(imgBase64);
                }
            }

            return extractedImages;
        } catch (error) {
            console.error('Error extracting PDF pages:', error);
            if (error instanceof Error && error.name === 'PasswordException') {
                throw new Error('PDF protegido por senha. Por favor, remova a senha e tente novamente.');
            }
            throw new Error('Falha ao processar arquivo PDF.');
        }
    }
}

export const pdfService = new PdfService();
