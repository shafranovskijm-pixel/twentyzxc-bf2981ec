

## Plan: Add "История" (History) Tab to Admin Sidebar

Currently, document history is embedded at the bottom of the "Документы" tab. The user wants it as a separate sidebar tab.

### Changes

**1. `src/components/admin/AdminSidebar.tsx`**
- Add `{ id: "history", label: "История", icon: "History" }` to `defaultMenuItems`
- Import `History` from lucide-react and add to `iconMap`

**2. `src/pages/Admin.tsx`**
- Add a case for `"history"` section that renders the `DocumentHistory` component (extracted or imported)

**3. `src/components/admin/DocumentsTab.tsx`**
- Extract `DocumentHistory` into its own file `src/components/admin/HistoryTab.tsx` so it can be rendered independently as a full tab
- Remove the inline `<DocumentHistory>` from the bottom of DocumentsTab
- The new HistoryTab will include the download and view functionality, plus the preview modal for viewing documents

