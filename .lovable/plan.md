

## Plan: Download Sample Templates + Enhanced Document History

### What we're building

1. **"Скачать образец" buttons** — three buttons at the top of the Documents tab to download blank sample PDFs (Договор, Счёт, Акт) with placeholder data so the user can see what each document looks like.

2. **Enhanced Document History section** — the existing `DocumentHistory` component already shows past documents, but it lacks a **Download PDF** button. We'll add a download action to each row so users can download any previously generated document as PDF directly from history.

### Technical Details

**File: `src/components/admin/DocumentsTab.tsx`**

1. **Sample download section** (after the "Тип и номер документа" card, ~line 760):
   - Add a card with 3 buttons: "Образец договора", "Образец счёта", "Образец акта"
   - Each button generates HTML from the existing template functions using placeholder/demo data (company requisites from settings, dummy client "ООО «Образец»"), then calls `generatePdfBase64` and triggers a browser download
   - Reuse existing `generateContractHtml`, `generateInvoiceHtml`, `generateActHtml` functions

2. **Download button in DocumentHistory** (~lines 1265-1310):
   - Add a `Download` icon button next to the existing `Eye` and `Trash2` buttons in both mobile and desktop views
   - On click, takes the `html_content` from the document record, runs it through `generatePdfBase64`, and triggers `pdf.save()`
   - Extract the existing inline PDF download logic (lines 1026-1099) into a reusable `downloadPdfFromHtml(html, filename)` helper function to avoid code duplication

3. **Refactor**: Extract the inline PDF download code from the preview modal into a shared helper function used by both the preview download button, the sample download, and the history download.

### Changes Summary

- **`src/components/admin/DocumentsTab.tsx`**:
  - Add `downloadPdfFromHtml(html: string, filename: string)` helper
  - Add sample download buttons section before the constructor form
  - Add Download button to `DocumentHistory` rows (mobile + desktop)
  - Refactor preview modal's download button to use the shared helper

