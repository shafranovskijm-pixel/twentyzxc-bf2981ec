

## Problem

When sending a contract email, only the contract PDF is attached. The invoice (счёт), which is auto-generated alongside the contract, is not included in the email.

## Root Cause

`sendDocumentEmail` (line 709) only processes `previewHtml` (the contract). It ignores `previewInvoiceHtml` entirely. When `docType === "contract"`, the system generates both contract and invoice HTMLs and saves both as PDFs to storage, but the email only includes one download link for the contract.

## Fix

Modify `sendDocumentEmail` to detect when `previewInvoiceHtml` exists (i.e., contract type) and:

1. Generate a second PDF from `previewInvoiceHtml`
2. Upload the invoice PDF to storage alongside the contract PDF
3. Record the invoice file in `contract_files`
4. Include **two** download links in the email HTML — one for the contract, one for the invoice

### Email HTML will look like:
```
Добрый день!
Направляем Вам документы: Договор №005 от 10 марта 2026 г.

📎 Скачать Договор (PDF)
📎 Скачать Счёт (PDF)

Ссылки действительны 7 дней.
```

### File to modify
- `src/components/admin/DocumentsTab.tsx` — update `sendDocumentEmail` function to handle both contract and invoice PDFs when `previewInvoiceHtml` is present

