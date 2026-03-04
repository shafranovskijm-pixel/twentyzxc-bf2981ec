

## Проблема

`html2canvas` плохо рендерит сложные HTML-документы — обрезает текст, ломает шрифты (Times New Roman), теряет стили таблиц. Это известная проблема библиотеки с CSS-рендерингом.

## Решение

Заменить `html2canvas + jsPDF` на **`window.print()`** через iframe, но с правильными настройками CSS `@page` и `@media print`, чтобы:
- Браузер сам предлагал «Сохранить как PDF» (это стандартный способ)
- Шрифты, таблицы и разметка сохранялись идеально

Ключевая проблема прошлых попыток с `window.print()` — заголовок "about:blank". Решение: задать `<title>` в iframe и использовать `srcdoc` вместо `document.write`.

### Изменения

**`src/components/admin/DocumentsTab.tsx`** — кнопка "Скачать PDF":
- Убрать `html2canvas` + `jsPDF` логику
- Создать скрытый iframe с `srcdoc = previewHtml`
- После загрузки вызвать `iframe.contentWindow.print()`
- Iframe автоматически удаляется после печати

**`src/lib/document-templates.ts`** — улучшить print-стили:
- `@page { margin: 10mm; size: A4; }` — убирает колонтитулы и задаёт размер
- `@media print { body { -webkit-print-color-adjust: exact; } }` — сохраняет цвета

**`src/components/admin/DocumentsTab.tsx`** — функция `generatePdfBase64` для отправки email:
- Тоже заменить на правильную генерацию через iframe + print-подход
- Альтернативно: оставить `html2canvas` только для email-отправки (так как нужен base64), но увеличить таймаут и исправить параметры рендеринга

### Итого
- **Скачать PDF** → `iframe.contentWindow.print()` (идеальное качество, браузер сам рендерит)
- **Отправка email** → оставить `html2canvas + jsPDF` для генерации base64, но с улучшенными настройками (`scale: 3`, полная высота документа, корректные размеры)
- **print CSS** → `@page { size: A4; margin: 10mm; }` для удаления "about:blank" и колонтитулов

