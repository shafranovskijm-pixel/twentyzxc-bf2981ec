

## Plan: Create "ФИС ФРДО" Admin Tab

### What it does
A new admin tab where you can select FRDO-related documents (инструкция, приказ, шаблоны ДПО/ПО, terms-of-use, etc.) via checkboxes and send them by email to a client.

### Steps

#### 1. Upload 7 FRDO documents to storage
Upload all 7 files to the `document-assets` bucket under a `frdo/` prefix:
- `frdo/terms-of-use.pdf`
- `frdo/ДПО-06.11.2023.xlsx`
- `frdo/ДПО-шаблон-образец.xlsx`
- `frdo/инструкция.docx`
- `frdo/По_образец.xlsx`
- `frdo/ПО-06.11.2023.xlsx`
- `frdo/Приказ_ФРДО_1.docx`

Since the `document-assets` bucket is public, files will be accessible via signed/public URLs for email links.

#### 2. Create `src/components/admin/FrdoTab.tsx`
New component with:
- **Client selector** — dropdown of clients from the `clients` table (with email). Filter/search by name.
- **Email input** — auto-filled from selected client's email, editable manually.
- **Document checklist** — 7 checkboxes (one per uploaded file) with human-readable labels. "Select all" toggle.
- **Send button** — calls `send-document-email` edge function with an HTML body containing download links to all selected documents. The email includes a branded message explaining the FRDO document package.
- Loading/success/error states with toast notifications.

#### 3. Register tab in sidebar and Admin page
- Add `{ id: "frdo", label: "ФИС ФРДО", icon: "GraduationCap" }` to `AdminSidebar.tsx` (use a different icon or reuse GraduationCap — will use `FileCheck` to distinguish from НМО).
- Add `{activeSection === "frdo" && <FrdoTab />}` in `Admin.tsx`.
- Import `FileCheck` in sidebar icon map.

#### 4. Email format
The email sent via `send-document-email` will contain:
- Subject: "Документы ФИС ФРДО — [Company Name]"
- HTML body with a list of selected documents as download links (public URLs from `document-assets` bucket)
- No PDF attachments — just download links to keep the email lightweight

### Files to create/modify
- **Create**: `src/components/admin/FrdoTab.tsx`
- **Edit**: `src/components/admin/AdminSidebar.tsx` — add "frdo" menu item + icon
- **Edit**: `src/pages/Admin.tsx` — import FrdoTab, render it

