

## План: Попап с кнопкой «Создать документ» при клике на задачу

### Что делаем
При клике на карточку задачи в Планере показывать Popover с деталями задачи и кнопкой «Создать документ», которая переключает на вкладку «Документы» с предзаполненными данными клиента/договора из задачи.

### Изменения

**1. `src/components/admin/PlannerTab.tsx`**
- Обернуть содержимое `TaskCard` в `Popover`
- В `PopoverContent` показать: название задачи, клиента, договор, статус
- Добавить кнопку «Создать документ» (иконка `FileOutput`), которая вызывает callback `onCreateDocument(task)`
- Добавить проп `onCreateDocument` в `TaskCard` и `DayColumn`

**2. `src/pages/Admin.tsx`**
- Передать в `PlannerTab` callback `onNavigateToDocuments(clientId, contractId)`, который:
  - Устанавливает `activeSection = "documents"`
  - Передаёт предзаполненные данные через state/props
- Добавить state для передачи предзаполненных данных в `DocumentsTab`

**3. `src/components/admin/DocumentsTab.tsx`**
- Принять опциональные пропы `initialClientId` и `initialContractId`
- При получении — автоматически выбрать клиента и договор в форме

### Файлы
- `src/components/admin/PlannerTab.tsx` — попап на карточке задачи
- `src/pages/Admin.tsx` — связь между вкладками
- `src/components/admin/DocumentsTab.tsx` — приём предзаполненных данных

