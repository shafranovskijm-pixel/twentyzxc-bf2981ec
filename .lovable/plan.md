

## Problem

The "Сформировать Договор" button is called (console logs confirm it), HTML is generated successfully, but **nothing visible happens**. No preview dialog, no toast, no error.

**Root cause**: `setPreviewHtml(html)` on line 483 is placed AFTER the entire database save block (lines 403-481). The `await supabase.from("generated_documents").insert(...)` call is hanging indefinitely — likely due to an RLS policy blocking the insert or an authentication issue. Since the promise never resolves or rejects, execution never reaches `setPreviewHtml(html)`, so the preview dialog never opens.

## Fix

1. **Move `setPreviewHtml(html)` immediately after HTML generation** (after line 401, before the DB save block) so the preview dialog opens instantly regardless of DB save outcome.

2. **Add a `console.log` before and after the DB insert** to confirm the hanging theory and help debug future issues.

3. **Add a timeout or `.catch()` safeguard** on the DB insert so it doesn't silently hang forever — if it fails, the user still sees a toast message.

The key change is a single line move: `setPreviewHtml(html)` from line 483 to right after the template generation try/catch (after line 401). The DB save then runs in the background without blocking the preview.

