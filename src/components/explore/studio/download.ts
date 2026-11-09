function clickAnchor(href: string, filename: string) {
  const anchor = document.createElement("a");
  anchor.href = href;
  anchor.download = filename;
  anchor.rel = "noopener";
  anchor.style.display = "none";
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  clickAnchor(url, filename);
  // Revoking immediately can cancel the download in some browsers.
  window.setTimeout(() => URL.revokeObjectURL(url), 4000);
}

export function downloadText(text: string, filename: string) {
  downloadBlob(new Blob([text], { type: "text/plain;charset=utf-8" }), filename);
}

export function downloadUrl(url: string, filename: string) {
  clickAnchor(url, filename);
}

export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    return false;
  }
}
