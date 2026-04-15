

## Plan: Add discount with deadline to invoices

### What the user wants
When creating an invoice (Счёт), add the ability to specify a discount amount (fixed sum, not percentage) and a deadline date. The invoice will show: "При оплате до [дата] сумма составляет [сумма со скидкой] руб." alongside the full price.

### Changes

#### 1. Edit `src/components/admin/DocumentsTab.tsx`
- Add two new state fields: `discountAmount` (number, default 0) and `discountDeadline` (string/date, default empty)
- Add UI fields below the services total (only visible when `docType === "invoice"`): an input for discount amount and a date picker for deadline
- Show calculated discounted total in the UI
- Pass `discountAmount` and `discountDeadline` to `generateInvoiceHtml`

#### 2. Edit `src/lib/document-templates.ts`
- Add optional `discountAmount` and `discountDeadline` fields to the `DocumentData` interface
- In `generateInvoiceHtml`, after the "Итого к оплате" line, add a conditional block:
  - If discount is set, show: "При оплате до [formatted date] сумма составляет [total - discount] руб. (скидка [discount] руб.)"

### UI placement
The discount fields appear right after the "Итого" line in the services card, only for invoices. Two fields side by side: "Сумма скидки" (number input) and "Оплата до" (date input).

### Files
- **Edit**: `src/components/admin/DocumentsTab.tsx`
- **Edit**: `src/lib/document-templates.ts`

