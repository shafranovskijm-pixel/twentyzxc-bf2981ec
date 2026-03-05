

## Problems

1. **DB save and file upload silently fail** — after `setPreviewHtml(html)` on line 404, the background save block (lines 406-527) likely fails at the `generated_documents` insert or the contract auto-create. Errors are caught but may not surface clearly. The `generatePdfBase64` function is also complex and can timeout silently.

2. **Preview shows only contract** — currently `setPreviewHtml(html)` stores only the contract HTML. User wants to see both the contract and invoice in the preview dialog.

## Plan

### 1. Show both contract and invoice in preview dialog

- Add state: `previewInvoiceHtml` alongside existing `previewHtml` (rename to `previewContractHtml` for clarity, or keep `previewHtml` as contract and add `previewInvoiceHtml`).
- When `docType === "contract"`, generate invoice HTML immediately (before DB save) and store both.
- In the preview Dialog, add **tabs** ("Договор" / "Счёт") using the existing Tabs component. Each tab renders its own iframe.
- For non-contract doc types, show single iframe as before.

### 2. Fix file saving reliability

- Move the invoice HTML generation **before** the DB save block (currently it's nested deep inside the save block at line 472).
- Wrap each DB/storage operation individually with try/catch and `console.error` + `toast.error` so failures are visible.
- Add `console.log` breadcrumbs before each major step (insert doc, create contract, upload PDF, upload invoice PDF).
- The `generatePdfBase64` function has a 10s iframe timeout + 15s html2canvas timeout — these are fine, but add a toast if they fail.

### 3. Files to modify

- **`src/components/admin/DocumentsTab.tsx`** — all changes in one file:
  - Add `previewInvoiceHtml` state
  - Generate invoice HTML right after contract HTML (line ~401), before DB save
  - Set both preview states before DB save block
  - Add Tabs to preview Dialog
  - Add logging to each DB/storage step

