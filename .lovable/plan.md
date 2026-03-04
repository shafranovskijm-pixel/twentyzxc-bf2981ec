

## Проблема

Кнопка «Скачать PDF» открывает диалог печати (`window.print()`), а пользователь хочет прямое скачивание файла `.pdf`. Также нужно, чтобы email отправлялся с PDF-вложением.

## Решение

Заменить `window.print()` на `generatePdfBase64` + прямое скачивание через `jsPDF.save()` для кнопки «Скачать PDF». Для email — оставить текущую логику с `generatePdfBase64`.

### Изменения в `src/components/admin/DocumentsTab.tsx`

**Кнопка «Скачать PDF»** (строки ~640-680):
- Убрать логику с `printIframe` и `window.print()`
- Использовать уже существующую `generatePdfBase64`, но вместо получения base64 — вызывать `jsPDF.save()` напрямую
- Создать новую функцию `downloadPdf(htmlContent, fileName)` которая:
  1. Рендерит HTML в скрытом iframe
  2. Захватывает через `html2canvas` (scale: 2)
  3. Создаёт `jsPDF` и вызывает `pdf.save(fileName)` — это скачивает файл напрямую
  4. Показывает лоадер на кнопке во время генерации
  5. Имеет timeout 15 секунд с обработкой ошибки

**Email** — оставить как есть (уже работает через `generatePdfBase64` + edge function).

### Итого
- «Скачать PDF» → прямое скачивание `.pdf` файла через `jsPDF.save()`
- «На почту» → PDF-вложение через edge function (без изменений)

