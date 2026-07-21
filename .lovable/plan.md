
## Цель

Убрать растровый pipeline (html2canvas → JPG/PNG → jsPDF) и получить настоящий векторный PDF формата A4 24ZXC: текст выделяется и копируется, кириллица корректная, колонтитулы и нумерация на каждой странице, пагинация автоматическая, без пустых половин страниц и без ручного расчёта координат. Стек остаётся клиентским (Lovable Cloud, без внешнего Chromium).

## Технический выбор

**pdfmake** (`pdfmake`, ~500 kB, лениво импортируется — как сейчас jsPDF).
Почему именно он:
- Настоящий векторный PDF: строки, таблицы, картинки, а не скриншоты HTML.
- Родная поддержка кастомных TTF шрифтов с кириллицей (Roboto, PT Sans и т. п. как base64 в VFS).
- Автоматический перенос страниц по содержимому + `pageBreak: 'before'` для приложений.
- Родные `header`/`footer` как функции `(currentPage, pageCount) => ...` — та самая проблема иероглифов исчезает.
- Свойства `unbreakable`, `keepWithNext`, повтор шапки таблицы (`headerRows`, `dontBreakRows`) — закрывают все требования по разрывам.
- Работает в браузере, деплой не нужен.

Не подходят: jsPDF (растр + свои шрифты вручную), pdf-lib (нет layout-движка, всё вручную), react-pdf (тяжёлый, отдельная модель компонентов).

## Что делаю

### 1. Единая доменная модель договора
Файл `src/lib/contracts/contract-schema.ts`:
- Zod-схема `ContractDoc` (`brand`, `documentType`, `documentNumber`, `documentDate`, `city`, `title`, `parties[]`, `sections[]{number,title,clauses[]{number,text}}`, `annexes[]`, `requisites[]`, `signatureBlocks[]`, `includeSignature`, `includeStamp`).
- Тип экспортируется — им пользуется и вкладка «Документы», и renderer.

### 2. Адаптеры: HTML-шаблоны → JSON
Файл `src/lib/contracts/from-html-templates.ts`:
- Функции `toContractDoc(...)` для существующих типов (development, FRDO, NMO, оферта, спецификация, акт). Забирают уже сформированные данные (те же переменные, что сейчас идут в `document-templates.ts`) и возвращают `ContractDoc`.
- Существующие шаблоны в `document-templates.ts` не удаляю — они нужны для превью в iframe (окно «Договор/Счёт») и для экспорта в `.docx`. Только PDF-путь переключается на новую модель.

### 3. Дизайн-токены 24ZXC
Файл `src/lib/contracts/pdf-theme.ts`:
- Читает существующие CSS-переменные бренда там, где это возможно; недостающие значения фиксирую константами: header `#14171F`, dark panel `#1B1F29`, gold `#D4BE37`, warm bg `#FBFAF4`, section header bg `#F9F6E6`, body text — текущий графитовый. Логотип «24ZXC» + «WEB & LICENSING STUDIO» — как сейчас.
- Стили pdfmake: `h1/h2/section-title/clause-num/body/small/footer`, размер тела 10 pt, интерлиньяж 1.3, поля страницы 18/20/18/16 mm.

### 4. Шрифты
Файл `src/lib/contracts/pdf-fonts.ts`:
- Регистрирую **локальные** TTF (Roboto Regular/Bold/Italic/BoldItalic) как ES-модули из `src/assets/fonts/*.ttf?url` → base64 → `pdfMake.vfs`. Никаких Google CDN.
- Один раз на сессию.

### 5. Renderer JSON → docDefinition
Файл `src/lib/contracts/pdf-renderer.ts`:
- `buildDocDefinition(doc: ContractDoc): TDocumentDefinitions`.
- Titленый блок (тёмная панель + золотой акцент), затем блоки сторон.
- Разделы: заголовок `keepWithNext: true` (не остаётся последней строкой), клаузы обычным потоком с `orphans/widows`.
- Карточки (реквизиты, подпись, итоги спецификации) как таблицы с одной ячейкой и `dontBreakRows: true` — только они атомарны, тексту разделов это не мешает.
- Спецификации/таблицы услуг: `table.headerRows: 1`, `dontBreakRows: true` для строк, итоговая строка помечается `unbreakable` вместе с предыдущей.
- Приложения: каждое — `pageBreak: 'before'`.
- Подпись/печать вставляются как `image` **только** если `includeSignature` / `includeStamp` (данные грузятся через уже существующий `document-images.ts`, файлы в Storage `document-assets/signature.png`, `stamp.png`).
- `header`/`footer`: тёмная плашка сверху с «24ZXC WEB & LICENSING STUDIO», снизу — золотая линия, номер договора слева, `Страница {i} из {n}` справа. Обе функции пишут текст напрямую через pdfmake (кириллица гарантированно корректная, шрифт Roboto).

### 6. Публичное API
Файл `src/lib/document-pdf.ts` (переписываю целиком, публичные экспорты сохраняю):
- `generatePdfBlob(input, meta?)` теперь принимает либо готовый `ContractDoc` (новый путь), либо HTML-строку (старый путь для legacy-документов, которые ещё не переведены — они пойдут через прежний код, помеченный `@deprecated`, пока не перевёл все).
- Внутри новый путь: `buildDocDefinition` → `pdfMake.createPdf(...).getBlob()`.
- `blobToBase64`, `downloadBlob`, `safePdfFilename`, `generatePdfBase64` остаются без изменений API.
- Удаляю `pdf-fonts.ts` в текущем виде (Google Fonts fetch) — заменяю на локальный.

### 7. Точки вызова
- `src/components/admin/ContractsTab.tsx`, `DocumentsTab.tsx`, `HistoryTab.tsx`, `FrdoTab.tsx`, `NmoTab.tsx`, `resend-contract.ts`, `pdf-signer.ts`, `send-document-email` вызовы: везде, где сейчас `generatePdfBlob(html)`, подставляю `toContractDoc(...)` из адаптера и передаю `ContractDoc`. Никакие бизнес-правила, поля формы, значения переменных не меняю.
- Превью в модалке (iframe с HTML) не трогаю — там html-шаблон остаётся визуальным превью, а PDF-кнопка идёт через новый путь.

### 8. Fixture-проверка на договоре № 275/2026
- Беру существующие данные договора №275/2026 из БД (`documents` таблица, поле `metadata`).
- Прогоняю через новый renderer, скачиваю PDF, открываю Playwright'ом в sandbox, конвертирую страницы в PNG (`pdftoppm`), проверяю каждую страницу глазами:
  - A4, поля выдержаны;
  - шапка/футер на каждой странице, кириллица без «!B@0=8F0»;
  - нет пустой половины страницы после раздела 1;
  - заголовок раздела не остаётся сиротой внизу;
  - таблица спецификации не рвётся, заголовок повторяется;
  - подпись/печать (если включены) — на своём месте, не растянуты;
  - текст выделяется (`pdftotext` возвращает читаемый текст).
- Сообщаю, что нашёл, и правлю до чистого прохода.

## Что явно не трогаю

- Бизнес-логика формирования договоров, номера, спецификация, цены, реквизиты, подписи, `document-templates.ts` HTML (нужен для .docx и iframe-превью).
- Отправка почты SMTP, edge-функции, БД, RLS.
- Дизайн вне PDF (админка, лендинг).
- Никаких упоминаний «Синтагмы».

## Технические детали для проверяющего

```
Стек:
  pdfmake ^0.2.x           — движок layout+PDF
  Roboto TTF (локальные)   — src/assets/fonts, base64 в VFS
  pdftoppm/pdftotext       — только для sandbox QA, не в рантайме

Структура:
  src/lib/contracts/
    contract-schema.ts     — Zod ContractDoc
    pdf-theme.ts           — цвета/типографика/поля
    pdf-fonts.ts           — VFS регистрация локальных TTF
    pdf-renderer.ts        — ContractDoc → docDefinition
    from-html-templates.ts — адаптеры существующих генераторов → ContractDoc
  src/lib/document-pdf.ts  — публичное API, перекл. на renderer
```

Обратной совместимости API `generatePdfBlob` достаточно, чтобы все текущие точки вызова продолжили работать после точечной правки (передача ContractDoc вместо html-строки).
