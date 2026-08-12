/**
 * Printing to PDF without a PDF library.
 *
 * The browser already has a perfectly good PDF writer behind its print
 * dialog, so an export here is a purpose-built document handed to `print()`
 * — the operator picks "Save as PDF" (or a real printer, which is just as
 * often what a salary sheet is for).
 *
 * The document is printed *in place*: it is appended to the page, hidden on
 * screen, and a print stylesheet hides everything else. Printing an
 * off-screen iframe is the tidier-looking trick but Safari renders it blank,
 * so this takes the route every browser agrees on.
 */

const ROOT_ID = "print-doc-root";
const STYLE_ID = "print-doc-style";

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
 * Renders `body` (with `styles`, which must be scoped to `#print-doc-root`)
 * as the only thing on the printed page and opens the print dialog.
 *
 * `title` becomes `document.title` for the duration, because browsers use it
 * as the default filename when saving as PDF.
 */
export function printDocument(args: {
  title: string;
  styles: string;
  body: string;
  /** Page box for the sheet. Defaults to A4 landscape. */
  page?: string;
}): void {
  // A previous print that never got cleaned up would otherwise print twice.
  document.getElementById(ROOT_ID)?.remove();
  document.getElementById(STYLE_ID)?.remove();

  const style = document.createElement("style");
  style.id = STYLE_ID;
  style.textContent = `
#${ROOT_ID} { display: none; }
@media print {
  @page { ${args.page ?? "size: A4 landscape; margin: 10mm;"} }
  html, body {
    background: #fff !important;
    height: auto !important;
    overflow: visible !important;
  }
  /* Everything the app itself rendered — app root, portals, toasts — goes. */
  body > *:not(#${ROOT_ID}) { display: none !important; }
  #${ROOT_ID} {
    display: block !important;
    position: static !important;
    width: 100% !important;
  }
  #${ROOT_ID} * { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
}
${args.styles}
`;

  const root = document.createElement("div");
  root.id = ROOT_ID;
  root.innerHTML = args.body;

  document.head.appendChild(style);
  document.body.appendChild(root);

  const previousTitle = document.title;
  document.title = args.title;

  let cleaned = false;
  const cleanup = () => {
    if (cleaned) return;
    cleaned = true;
    window.removeEventListener("afterprint", cleanup);
    document.title = previousTitle;
    root.remove();
    style.remove();
  };
  window.addEventListener("afterprint", cleanup);

  try {
    window.print();
  } catch (err) {
    cleanup();
    throw err;
  }
  // Safari does not always fire `afterprint`, and tearing the document down
  // while the dialog is open cancels the print — so a late fallback only.
  window.setTimeout(cleanup, 60_000);
}
