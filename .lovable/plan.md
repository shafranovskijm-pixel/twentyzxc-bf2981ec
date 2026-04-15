

## Plan: Add "Edit/Reload" button to recent documents list

### Problem
When a document has been created but not yet sent, there's no way to load it back into the editor to update the date, amount, or other fields. The user wants to click on an existing document and have it populate the editor form for re-generation.

### Approach

**Store editor metadata alongside documents, then add an "Edit" button that loads it all back.**

### Changes

#### 1. Database migration: add `metadata` column to `generated_documents`
```sql
ALTER TABLE public.generated_documents ADD COLUMN metadata jsonb;
```
This will store `{ contractSubType, subject, deadline, paymentTerms, discountAmount, discountDeadline, clientKpp, clientOgrn, clientAddress, clientDirectorName, clientDirectorPost }` — everything needed to fully restore the editor state.

#### 2. Edit `src/components/admin/DocumentsTab.tsx`

**2a. Save metadata on document generation** (in the `generate()` function, add `metadata` to the insert payload):
```ts
metadata: JSON.stringify({
  contractSubType, subject, deadline, paymentTerms,
  discountAmount, discountDeadline,
  clientKpp, clientOgrn, clientAddress,
  clientDirectorName, clientDirectorPost,
})
```

**2b. Add `loadDocumentForEdit` function** that takes a saved document record and sets all state fields:
- `docType`, `docNumber`, `docDate`, `clientName`, `clientInn`, `services` — from stored columns
- `contractSubType`, `subject`, `deadline`, `paymentTerms`, `discountAmount`, `discountDeadline`, client requisites — from `metadata` JSON
- `linkedContractId` — from `contract_id`
- Scrolls to top of form

**2c. Add Edit button (pencil icon) to the `RecentDocuments` component** in both mobile and desktop views, next to Eye/Download/Delete buttons. On click, calls `loadDocumentForEdit`.

Since `RecentDocuments` is a separate component inside DocumentsTab, we'll need to either:
- Lift it into the main component, or
- Pass a callback `onEdit` prop from the parent

We'll pass an `onEdit` callback prop.

### Files
- **Migration**: Add `metadata jsonb` column to `generated_documents`
- **Edit**: `src/components/admin/DocumentsTab.tsx` — save metadata on generate, add edit button to RecentDocuments, load document data back into form

