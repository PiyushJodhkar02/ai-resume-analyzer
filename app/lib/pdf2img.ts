export interface PdfConversionResult {
    imageUrl: string;
    file: File | null;
    error?: string;
}

let pdfjsLib: any = null;
let isLoading = false;
let loadPromise: Promise<any> | null = null;

// Ensure the worker file is bundled by Vite and referenced via an absolute URL
// This avoids 404s or route-mismatch issues in dev servers.
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore - Vite ?url import provides a string URL at build time
import workerUrl from "pdfjs-dist/build/pdf.worker.mjs?url";

async function loadPdfJs(): Promise<any> {
    if (pdfjsLib) return pdfjsLib;
    if (loadPromise) return loadPromise;

    isLoading = true;
    // @ts-expect-error - pdfjs-dist/build/pdf.mjs is not a module
    loadPromise = import("pdfjs-dist/build/pdf.mjs").then((lib) => {
        // Use the Vite-bundled worker URL
        lib.GlobalWorkerOptions.workerSrc = workerUrl;
        pdfjsLib = lib;
        isLoading = false;
        return lib;
    });

    return loadPromise;
}

export async function convertPdfToImage(
    file: File
): Promise<PdfConversionResult> {
    try {
        if (typeof window === "undefined" || typeof document === "undefined") {
            throw new Error("PDF to image conversion must run in the browser context");
        }

        if (!file) {
            throw new Error("No file provided for conversion");
        }

        if (file.type && file.type !== "application/pdf") {
            throw new Error("Unsupported file type. Please upload a PDF file");
        }

        const lib = await loadPdfJs();

        const arrayBuffer = await file.arrayBuffer();
        const pdf = await lib.getDocument({ data: arrayBuffer }).promise;
        const page = await pdf.getPage(1);

        const viewport = page.getViewport({ scale: 4 });
        const canvas = document.createElement("canvas");
        const context = canvas.getContext("2d");

        canvas.width = viewport.width;
        canvas.height = viewport.height;

        if (context) {
            context.imageSmoothingEnabled = true;
            context.imageSmoothingQuality = "high";
        }

        if (!context) {
            return {
                imageUrl: "",
                file: null,
                error: "Failed to acquire canvas 2D context",
            };
        }

        await page.render({ canvasContext: context, viewport }).promise;

        return new Promise((resolve) => {
            canvas.toBlob(
                (blob) => {
                    if (blob) {
                        // Create a File from the blob with the same name as the pdf
                        const originalName = file.name.replace(/\.pdf$/i, "");
                        const imageFile = new File([blob], `${originalName}.png`, {
                            type: "image/png",
                        });

                        resolve({
                            imageUrl: URL.createObjectURL(blob),
                            file: imageFile,
                        });
                    } else {
                        resolve({
                            imageUrl: "",
                            file: null,
                            error: "Failed to create image blob",
                        });
                    }
                },
                "image/png",
                1.0
            ); // Set quality to maximum (1.0)
        });
    } catch (err) {
        return {
            imageUrl: "",
            file: null,
            error: `Failed to convert PDF: ${(err as Error)?.message ?? String(err)}`,
        };
    }
}