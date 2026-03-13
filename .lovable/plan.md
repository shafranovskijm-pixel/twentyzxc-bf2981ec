

## Plan: Fix AI Chat Overlap + Restore Document History in Documents Tab

### Problem 1: AI Chat Covers the Generate Button
The FloatingAIChat is fixed at `bottom: 0` spanning full width. Although `pb-24` exists on the main container, the "Сформировать" button at the very bottom of DocumentsTab still gets covered.

**Fix**: Increase bottom padding on the DocumentsTab content (add `pb-20` to the DocumentsTab wrapper) so the generate button is always above the floating chat bar. Alternatively, add `mb-16` to the generate button itself.

### Problem 2: Document History Missing from Documents Tab
The HistoryTab is a separate sidebar section. The user expects to see recently generated documents directly within the Documents tab (below the constructor form).

**Fix**: Add a "Последние документы" (Recent Documents) section at the bottom of `DocumentsTab.tsx`, below the generate button. This will query the `saved_documents` table (same as HistoryTab does) and show the last ~10 documents with view/download actions. Reuse the same logic from HistoryTab — preview dialog + PDF download.

### Files to Modify

#### 1. `src/components/admin/DocumentsTab.tsx`
- Add a wrapper `div` with `pb-20` around all content to prevent overlap with floating chat
- Add a "Последние документы" card after the generate button showing recent documents from `saved_documents` table
- Include view (Eye), download (Download), and delete (Trash2) actions per row
- Reuse the `generatePdfBase64` + iframe preview pattern already in the file

#### 2. No other files need changes

### Technical Details
- Query: `supabase.from("saved_documents").select("*").order("created_at", { ascending: false }).limit(10)`
- Display: compact table/cards with doc type badge, client name, date, and action buttons
- The bottom padding fix ensures the generate button + history section are never covered by the AI chat bar

