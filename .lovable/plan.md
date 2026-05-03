## Проблемы

На скриншоте видно: подпись и печать **уползли вниз** под линию подписи и обрезаются. Плюс пользователь жалуется, что при «Отправить повторно» договор/счёт каждый раз генерируется заново из HTML, хотя уже лежит готовый PDF в Storage.

---

## Причина 1 — «кривая печать»

В `src/lib/document-templates.ts` блок подписи использует абсолютное позиционирование:

```text
.signature-img { position: absolute; height: 50px; bottom: 0;   left: 80px; }
.stamp-img     { position: absolute; height: 110px; bottom: -40px; left: 10px; opacity: 0.85; }
```

`bottom: -40px` у штампа выносит его **за** линию подписи. На экране в браузере смотрится нормально, а `html2canvas` режет canvas построчно по `body.scrollHeight` — нижняя часть штампа попадает на стык страниц или вообще обрезается. Дополнительно `scale: 1.2` + `image/jpeg` качество `0.65` дают мутный край.

### Что починить
1. Перевести подпись/печать на позиционирование **внутри** `.signature-block` без отрицательных значений:
   - `.signature-line` — добавить `min-height: 70px` и `padding-top: 60px`, чтобы под линией оставалось место.
   - `.signature-img` — `bottom: 4px`, `left: 70px`, `height: 45px`.
   - `.stamp-img` — `bottom: 0`, `left: 0`, `height: 95px`, `opacity: 0.9`. Никаких отрицательных `bottom`.
   - Добавить `.signature-block { padding-bottom: 30px; }` чтобы штамп не вылезал из контейнера.
2. В `generatePdfBase64` (DocumentsTab) и `generatePdfBlob` (`src/lib/resend-contract.ts`):
   - Поднять `scale` с `1.2` → `2`.
   - Сменить экспорт с `image/jpeg, 0.65` → `image/png` (без потерь).
   - Добавить `useCORS: true, allowTaint: true, backgroundColor: '#ffffff'`.
   - Увеличить `await new Promise(r => setTimeout(r, 200))` → `500ms`, чтобы шрифты и base64-изображения успели отрисоваться.
3. Применить те же правки в `frdo-contract-template.ts` и `nmo-contract-template.ts` (там такой же блок подписи).

---

## Причина 2 — повторная генерация PDF при «Отправить повторно»

Сейчас `src/lib/resend-contract.ts` всегда:
1. Идёт в `generated_documents`, берёт `html_content`.
2. Генерирует PDF через html2canvas + jsPDF.
3. Загружает новый файл `resend-{ts}-...pdf` в Storage.

Хотя в `contract_files` уже лежит готовый PDF, созданный при первой отправке (`saveFileToFolder` в `DocumentsTab`).

### Что починить
Переписать алгоритм `resendContractEmail`:

1. **Сначала ищем готовый PDF в `contract_files`** по `contract_id`:
   ```text
   select * from contract_files
   where contract_id = $1 and file_name ilike 'Договор%' and file_name ilike '%.pdf'
   order by created_at desc limit 1
   ```
   То же для счёта (`file_name ilike 'Счёт%' or 'Счет%'`).
2. Если файл найден → проверяем, что blob существует в bucket `contracts` через `supabase.storage.from('contracts').createSignedUrl(file_path, 7d)`. Если ссылка получена — **используем её сразу**, без перегенерации.
3. Если в `contract_files` пусто или файл удалён из Storage (signed URL вернул 404 при HEAD-проверке) → fallback на текущую логику (генерация из `generated_documents.html_content`), но загружаем под детерминированным именем `{contract_id}/Dogovor_{number}_{date}.pdf` с `upsert: true` (а не `resend-{ts}-...`), чтобы не плодить дубли.
4. После успешной генерации в fallback — добавляем запись в `contract_files` (как делает `DocumentsTab`).

Это даёт:
- При повторной отправке клиент получает **тот же самый файл**, что и в первый раз (одинаковое качество, одинаковое содержимое).
- Перестают плодиться `resend-1730000000-...pdf` в Storage.
- Перегенерация только если PDF реально пропал.

---

## Файлы изменений

- `src/lib/document-templates.ts` — CSS блока подписи (3 шаблона: контракт, счёт, акт).
- `src/lib/frdo-contract-template.ts` — тот же CSS.
- `src/lib/nmo-contract-template.ts` — тот же CSS.
- `src/components/admin/DocumentsTab.tsx` — `generatePdfBase64`: scale 2, PNG, +300мс ожидание.
- `src/lib/resend-contract.ts` — новая логика «сначала Storage, потом генерация»; вынести `generatePdfBlob` в общий хелпер с теми же параметрами качества.

## БД / RLS
Изменений схемы **не требуется**. Используем существующие `contract_files` и bucket `contracts`.

## Edge-функции
Без изменений (`send-document-email` уже работает с signed URL).

## Что проверить после
1. Сгенерировать новый договор → открыть PDF → подпись и печать на месте, не обрезаны.
2. Отправить договор → нажать «Отправить повторно» → в Storage **не появилось** нового файла `resend-*.pdf`, ссылка ведёт на исходный PDF.
3. Удалить файл вручную из Storage → «Отправить повторно» → fallback регенерирует PDF под детерминированным именем и регистрирует в `contract_files`.
