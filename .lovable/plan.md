

## Plan: Убрать дашборд + кликабельный статус оплаты в договорах

### Изменения

#### 1. Убрать дашборд
- **`src/components/admin/AdminSidebar.tsx`**: Удалить `{ id: "dashboard", ... }` из `defaultMenuItems`
- **`src/pages/Admin.tsx`**: Убрать рендер `DashboardTab`, убрать импорт. Изменить начальный `activeSection` с `"dashboard"` на `"contracts"` (или `"planner"`)

#### 2. Кликабельный статус оплаты в таблице договоров
- **`src/components/admin/ContractsTab.tsx`**: Заменить `<Badge>` со статусом оплаты на кликабельный элемент, который циклически переключает статус: `не оплачено → частично → оплачено → не оплачено`. При клике — мгновенный `update` в Supabase + инвалидация кэша. Работает и в мобильной, и в десктопной версии таблицы.

### Файлы
- **Удалить из сайдбара**: `src/components/admin/AdminSidebar.tsx`
- **Убрать дашборд из рендера**: `src/pages/Admin.tsx`
- **Кликабельный статус**: `src/components/admin/ContractsTab.tsx`

