# Клик по организации → карточка клиента, клик по номеру → редактирование договора

## Что меняется визуально
В таблице договоров (`ContractsTab`, мобильный список и desktop-таблица):
- Клик по **названию организации** → переход в раздел «Клиенты» с автоматически открытой карточкой этого клиента (форма редактирования + история + взаимодействия: звонки, заметки).
- Клик по **номеру договора** → как сейчас: открывается форма редактирования договора.

Сейчас оба клика делают одно и то же (`startEdit`), номер вообще не кликабелен. После правок поведение разделяется.

## Изменения по файлам

### 1. `src/components/admin/ClientsTab.tsx`
- Расширить `ClientsTabProps`: добавить `initialClientName?: string` и `onConsumed?: () => void`.
- В `useEffect` при появлении `initialClientName` найти клиента в списке (или подгрузить из БД, если не найден на текущей странице) и вызвать `startEdit(client)`, затем `onConsumed()`.
- Если клиент с таким именем не найден — показать toast «Клиент не найден, создайте карточку» и предзаполнить форму создания именем.

### 2. `src/pages/Admin.tsx`
- Добавить state `clientsInitialName`.
- В `<ContractsTab />` передать новый коллбэк `onOpenClient={(name) => { setClientsInitialName(name); setActiveSection("clients"); }}`.
- В `<ClientsTab ...>` пробросить `initialClientName={clientsInitialName}` и `onConsumed={() => setClientsInitialName("")}`.

### 3. `src/components/admin/ContractsTab.tsx`
- Добавить опциональный проп `onOpenClient?: (name: string) => void`.
- Кнопка с `client_name` (мобильная карточка, строка таблицы) — `onClick={() => onOpenClient?.(c.client_name)}` вместо `startEdit(c)`.
- Сделать `contract_number` кликабельным: обернуть в `<button>` со стилем underline-on-hover, `onClick={() => startEdit(c)}`. Если номера нет — показать `—` без клика.

## Технические заметки
- Карточка клиента уже содержит телефон, email, заметки, и блок «Взаимодействия» (`client_interactions`: звонки, письма, заметки с типами и текстом) — отдельная таблица не нужна.
- Совпадение договора и клиента — по `contracts.client_name === clients.name` (case-insensitive trim), как в существующем поиске email.
- Никаких миграций БД не требуется.
