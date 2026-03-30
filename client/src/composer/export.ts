/**
 * PNG export uses html-to-image (DOM clone). For very large outputs or heavy
 * filters, consider a second path: server Sharp render or OffscreenCanvas.
 */

export function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement("a");
  a.href = dataUrl;
  a.download = filename;
  a.click();
}

export function buildExportBasename(host: string): string {
  const safe =
    host.replace(/[^a-zA-Z0-9.-]+/g, "-").slice(0, 48) || "screenshot";
  const d = new Date();
  const stamp = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}-${String(d.getHours()).padStart(2, "0")}${String(d.getMinutes()).padStart(2, "0")}`;
  return `${safe}-${stamp}`;
}

export async function copyPngToClipboard(dataUrl: string): Promise<void> {
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
}
