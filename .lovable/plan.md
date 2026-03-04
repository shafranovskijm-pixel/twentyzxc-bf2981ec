

## Проблема

Edge-функция `send-document-email` зависает при передаче большого PDF через base64 в теле запроса. SMTP-соединение таймаутит, функция отключается (shutdown в логах без ответа).

## Решение

Изменить подход: сначала сохранить PDF в storage (`contracts` bucket), записать в `contract_files`, а затем отправить email с **ссылкой на скачивание** вместо вложения. Это устраняет проблему размера payload.

### Изменения в `src/components/admin/DocumentsTab.tsx`

Переписать `sendDocumentEmail`:

1. **Генерация PDF** → конвертировать base64 в `Blob`
2. **Загрузка в storage** → `supabase.storage.from("contracts").upload(path, blob)` используя `linkedContractId` (или создавая путь `documents/{docType}_{docNumber}`)
3. **Запись в `contract_files`** → сохранить метаданные файла
4. **Получить публичный URL** → `supabase.storage.from("contracts").getPublicUrl(path)` (или createSignedUrl)
5. **Отправить email без вложения** → в body передать только `to`, `subject`, `html` с ссылкой на скачивание PDF. Без `pdfBase64`.

### Шаги прогресса

- 10% — Подготовка
- 30% — Генерация PDF
- 60% — Сохранение в файлы
- 80% — Отправка письма
- 100% — Готово

### Результат

- PDF сохраняется в папку договора (виден во вкладке «Файлы»)
- Email отправляется мгновенно (маленький payload — только HTML с ссылкой)
- Клиент получает письмо со ссылкой для скачивания PDF

