

## Plan: Show discount fields for contracts too, not just invoices

### Problem
The discount input fields are currently wrapped in `docType === "invoice"` condition (line 1237), so they only appear when creating an invoice. The user wants them visible when creating a contract ("contract") as well.

### Changes

#### Edit `src/components/admin/DocumentsTab.tsx`
1. Change the condition on line 1237 from `docType === "invoice"` to `docType === "invoice" || docType === "contract"` so discount fields appear for both document types.

2. Pass `discountAmount` and `discountDeadline` in the contract generation data object (around line 427) — they're already passed but need to ensure the contract template uses them.

#### Edit `src/lib/document-templates.ts`
Add the discount block to the contract HTML template (similar to how it's done in the invoice template). If discount is set, show a line like: "При оплате до [дата] сумма составляет [сумма со скидкой] руб. (скидка [сумма] руб.)"

### Files
- **Edit**: `src/components/admin/DocumentsTab.tsx` — expand condition to include "contract"
- **Edit**: `src/lib/document-templates.ts` — add discount rendering to contract template

