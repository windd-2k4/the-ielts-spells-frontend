import { getDocument, GlobalWorkerOptions } from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";

GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

type PdfTextItem = {
  str: string;
  hasEOL?: boolean;
};

function isPdfTextItem(value: unknown): value is PdfTextItem {
  return typeof value === "object" && value !== null && "str" in value;
}

export async function extractPdfText(file: File): Promise<string> {
  const data = new Uint8Array(await file.arrayBuffer());
  const loadingTask = getDocument({ data });
  const document = await loadingTask.promise;
  const pages: string[] = [];

  try {
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      let pageText = "";
      for (const item of content.items) {
        if (!isPdfTextItem(item)) continue;
        pageText += item.str;
        pageText += item.hasEOL ? "\n" : " ";
      }
      pages.push(pageText.replace(/[ \t]+\n/g, "\n").replace(/ {2,}/g, " ").trim());
    }
  } finally {
    await loadingTask.destroy();
  }

  return pages.filter(Boolean).join("\n\n");
}
