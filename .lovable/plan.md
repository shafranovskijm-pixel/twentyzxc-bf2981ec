

## Контекст

Сейчас в попапе задачи планера есть одна кнопка «Создать документ», которая переключает на вкладку Документы с предзаполненным договором. Пользователь хочет, чтобы для задач с уже привязанным договором (у которого уже есть сгенерированный документ) показывались конкретные действия: «Создать счёт», «Создать акт», «Скачать договор» и т.д.

## План

### 1. Расширить `onCreateDocument` → передавать тип документа

В `Admin.tsx` изменить колбэк, чтобы принимать `docType` (`"contract"` | `"invoice"` | `"act"`). Передавать его в `DocumentsTab` через новый проп `initialDocType`.

В `DocumentsTab` — в `useEffect` для `initialContractId` также устанавливать `setDocType(initialDocType)` если передан.

### 2. Переработать кнопки в попапе `TaskCard`

Вместо одной кнопки «Создать документ» — показывать набор действий в зависимости от наличия `contract_id`:

**Если у задачи есть `contract_id`:**
- «Создать счёт» — вызывает `onCreateDocument(task, "invoice")`
- «Создать акт» — вызывает `onCreateDocument(task, "act")`
- «Создать договор» — вызывает `onCreateDocument(task, "contract")`

**Если нет `contract_id`:**
- «Создать документ» (как сейчас)

### 3. Изменения в файлах

**`src/components/admin/PlannerTab.tsx`:**
- Изменить сигнатуру `onCreateDocument` на `(task: Task, docType?: string) => void`
- В `TaskCard` попапе вместо одной кнопки отрисовать 3 кнопки (Счёт, Акт, Договор) если есть `contract_id`, иначе — одну общую

**`src/pages/Admin.tsx`:**
- Добавить state `docInitialDocType`
- В колбэке `onCreateDocument` сохранять переданный `docType`
- Передать `initialDocType` в `DocumentsTab`

**`src/components/admin/DocumentsTab.tsx`:**
- Добавить проп `initialDocType`
- В `useEffect` для prefill — устанавливать `setDocType(initialDocType)` если передан

