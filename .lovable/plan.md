

## Plan: PDF Download/Send + Auto-fill Client Email

Three changes to `src/components/admin/DocumentsTab.tsx`:

### 1. Download as PDF (not HTML)
Replace the current "Скачать" button logic: instead of downloading raw HTML, use the browser's `window.print()` API on a hidden iframe to trigger "Save as PDF". Since true server-side PDF generation requires a library not available, the practical approach is to use `print()` with a PDF-save prompt — OR use the iframe's content and the `blob` approach but with a print-to-PDF trigger.

**Better approach**: Use the iframe's `contentWindow.print()` which already exists for "Печать" — rename/combine so "Скачать" triggers print (which allows saving as PDF in any browser). Alternatively, generate a proper downloadable file by opening the HTML in a new window with print dialog.

Actually, the simplest reliable approach: keep the print button as-is, and for "Скачать" use `window.open` with the HTML content and auto-trigger `window.print()` which lets users save as PDF. This is what the user expects.

### 2. Auto-fill email from client card
- Update the `doc-clients` query to also select `email`
- When opening the email dialog, find the client by name and pre-fill `emailTo` with their email if available

### 3. Save email to client card after sending
- After successful email send, if the client doesn't have an email in their card, update the client record with the entered email

### File changes

**`src/components/admin/DocumentsTab.tsx`**:
1. Add `email` to the clients query select (line 46)
2. In the "На почту" button click handler (lines 550-559): look up client email and pre-fill `emailTo`
3. In `sendDocumentEmail` (lines 317-337): after successful send, check if client has no email and save the entered one
4. For "Скачать" button (lines 564-582): change to trigger `window.print()` from iframe (which allows Save as PDF), or keep as-is since browsers can print-to-PDF. The user says "скачать в pdf" — use iframe print which is the standard web approach for PDF generation without server-side tools.

