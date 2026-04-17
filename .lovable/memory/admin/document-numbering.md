---
name: Document numbering with year suffix
description: Format NNN/YYYY for generated documents (договор/счёт/акт), per-type per-year auto-reset
type: feature
---

Generated documents (`generated_documents` table) use the number format `NNN/YYYY` (e.g. `001/2026`). The auto-numbering query in `DocumentsTab.tsx` filters `doc_number` by current year suffix (`%/YYYY`) and parses out the numeric prefix to compute the next free number per `doc_type`. This causes numeration to reset to `001` automatically every January 1st.

The year is derived from the current `docDate` field (not `now()`), so back-dating into a previous year correctly numbers within that year's sequence.

In filenames (PDF download, Storage uploads, Telegram captions, Email attachments), the `/` is replaced with `-` via `safeFilename()` to avoid invalid path characters. Display labels (toast, email body) keep the original `001/2026` format.

The auto-created contract record (`contracts.contract_number`) reuses `docNumber` as-is (no longer concatenates a separate year).
