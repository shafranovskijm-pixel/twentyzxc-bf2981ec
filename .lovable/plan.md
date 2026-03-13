

## Plan: Send Documents via Telegram

### Overview
Add a "В Telegram" button next to "На почту" in the document preview dialog. Clicking it generates PDFs and sends them as documents to the admin's Telegram chat via a new edge function.

### Changes

#### 1. New edge function: `supabase/functions/send-telegram-document/index.ts`
- Accepts `{ pdfBase64, filename, caption?, chat_id? }` (chat_id defaults to `TELEGRAM_CHAT_ID` env)
- Authenticates the caller (admin check, same as `send-bot-message`)
- Converts base64 to binary, sends via Telegram Bot API `sendDocument` (multipart/form-data)
- If invoice PDF is also provided (`invoicePdfBase64`, `invoiceFilename`), sends a second document
- Uses `ZXC_BOT_TOKEN` (already configured)
- Add `verify_jwt = false` to `config.toml`

#### 2. `src/components/admin/DocumentsTab.tsx`
- Add `sendDocumentTelegram` function (similar flow to `sendDocumentEmail` but simpler):
  1. Generate PDF(s) via `generatePdfBase64`
  2. Upload to storage (reuse existing upload logic)
  3. Call `send-telegram-document` edge function with base64 data
- Add state: `telegramSending`
- Add a Telegram button (MessageCircle icon) next to the "На почту" button in the preview dialog toolbar
- No dialog needed — one click sends directly

#### 3. Files
- **Create**: `supabase/functions/send-telegram-document/index.ts`
- **Edit**: `supabase/config.toml` (add function config)
- **Edit**: `src/components/admin/DocumentsTab.tsx` (add button + send logic)

