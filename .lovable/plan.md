## Правки конструктора КП

### 1. Подпись по умолчанию
В `src/lib/proposal-template.ts` поменять дефолты:
- `contactName`: `"Шафрановский Максим"` (вместо «Антон»)
- Под именем — должность `"Директор"` (заменить «Менеджер по работе с клиентами»)

### 2. Срок действия КП по умолчанию = сегодня + 30 дней
В `src/components/admin/ProposalsTab.tsx`, в `ProposalEditor`:
- Для нового КП (когда `proposalId === null`) в `useEffect` инициализировать `validUntil` строкой `YYYY-MM-DD` от `new Date(Date.now() + 30*86400000)`.
- Для существующего КП оставлять `p.valid_until` как сейчас.

### 3. Фикс «вылезания» футера/уголков при сохранении PDF
На скрине футер и нижние золотые уголки наезжают на следующую страницу (видно вторую «обрезанную» полосу). Причина: фиксированная `min-height:1123px` + `padding-bottom:72px` + абсолютные `.corner.bl/.br` на `bottom:24px` ломаются, когда контент короче страницы и html2canvas рендерит «хвост» как вторую страницу.

В `src/lib/proposal-template.ts`:
- Убрать `min-height` у `.page`, оставить только `padding`.
- Поднять нижние уголки внутрь рабочей области: `.corner.bl{bottom:16px}` `.corner.br{bottom:16px}` и уменьшить размер до 64px, чтобы они не вылетали за низ canvas.
- `footer` дать `margin-top:auto` не нужен (нет flex). Вместо этого:
  - У `.page` — `display:flex; flex-direction:column;`
  - У основного контента обернуть в `<main style="flex:1">` чтобы футер прижимался к низу естественно, без отрицательных отступов.
- `footer { margin-top: 32px; }` (вместо 48) и `.footer-note { margin-top:10px; padding-bottom:0 }`.
- Убедиться, что watermark `.watermark` не выходит за `.page` (добавить `overflow:hidden` уже стоит — ок).

### 4. (Заодно) Дата КП в шапке
В блоке `.meta` сейчас выводится `действует до ${data.validUntil}` без `escapeHtml` лишних символов — оставить как есть; формат `dd.mm.yyyy` корректен через `toLocaleDateString("ru-RU")` в `ProposalsTab` (баг «20266» на скрине — ручной ввод пользователя; новый дефолт +30 дней его исключит).

### Файлы

- `src/lib/proposal-template.ts` — дефолты подписи, верстка `.page` flex + правки уголков/футера.
- `src/components/admin/ProposalsTab.tsx` — инициализация `validUntil = today+30` для новых КП.
