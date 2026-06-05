import { parseJsonResponse } from "@/lib/parse-json-response";

function filenameFromDisposition(disposition: string | null, fallback: string) {
  const match = disposition?.match(/filename="([^"]+)"/);
  return match?.[1] ?? fallback;
}

export async function downloadPdfFromResponse(response: Response, fallbackFilename: string) {
  const contentType = response.headers.get("content-type") ?? "";

  if (!response.ok || !contentType.includes("pdf")) {
    const data = await parseJsonResponse<{ error?: string }>(response);
    throw new Error(data.error || "PDF generation failed");
  }

  const blob = await response.blob();
  if (blob.size === 0) {
    throw new Error("PDF file is empty");
  }

  const filename = filenameFromDisposition(
    response.headers.get("content-disposition"),
    fallbackFilename
  );
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();

  return { url, filename };
}
