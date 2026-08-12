/**
 * Printing to PDF without a PDF library.
 *
 * The browser already has a perfectly good PDF writer behind its print
 * dialog, so an export here is a purpose-built HTML document handed to
 * `print()` — the operator picks "Save as PDF" (or a real printer, which is
 * just as often what a salary sheet is for). A hidden iframe rather than a
 * popup window, so nothing is eaten by a popup blocker.
 */

/** Escapes text for safe interpolation into a print document. */
export function escapeHtml(value: unknown): string {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Renders a full HTML document in a hidden frame and opens the print dialog
 * on it. `document.title` is set from `title` because browsers use it as the
 * default filename when saving as PDF.
 */
export function printDocument(title: string, html: string): void {
  const frame = document.createElement("iframe");
  frame.setAttribute("aria-hidden", "true");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  frame.style.visibility = "hidden";

  frame.onload = () => {
    const win = frame.contentWindow;
    if (!win) {
      frame.remove();
      return;
    }
    // Losing the frame mid-dialog cancels the print, so it is only torn down
    // once the dialog closes — with a timer as the fallback, since Safari
    // does not always fire `afterprint`.
    let removed = false;
    const cleanup = () => {
      if (removed) return;
      removed = true;
      frame.remove();
    };
    win.addEventListener("afterprint", cleanup);
    win.document.title = title;
    win.focus();
    win.print();
    window.setTimeout(cleanup, 60_000);
  };

  document.body.appendChild(frame);
  const doc = frame.contentDocument;
  if (!doc) {
    frame.remove();
    throw new Error("Could not open the print view");
  }
  doc.open();
  doc.write(html);
  doc.close();
}
