

## Problem
The "Сформировать Договор" button currently generates only the contract document. The user wants it to also generate an invoice (счёт), create a folder in Files, and save both documents there.

## Current Behavior
- Generates contract HTML and shows preview
- Auto-creates a contract record in the `contracts` table
- Saves the contract PDF to the Files folder (storage + `contract_files` table)

## Plan

**Modify `generate()` in `DocumentsTab.tsx`** to, after generating the contract:

1. **Generate the invoice HTML** using `generateInvoiceHtml(docData)` with the same document data (same number, date, client, services)
2. **Convert both to PDF** using the existing `generatePdfBase64()` helper
3. **Save both PDFs** to the auto-created contract folder in storage and `contract_files` table:
   - `Договор_{number}_{date}.pdf`
   - `Счёт_{number}_{date}.pdf`
4. **Invalidate file queries** so the Files tab shows the new folder and files immediately

This only applies when `docType === "contract"` — invoices and acts generated standalone remain unchanged.

The preview will still show the contract. Both files will appear in the Files tab folder.

