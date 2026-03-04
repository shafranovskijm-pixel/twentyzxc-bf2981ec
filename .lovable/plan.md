
## Проблемы и решения

### 1. Порядок сайдбара не сохраняется на телефоне
**Причина**: Используется только `PointerSensor` из `@dnd-kit`, который на мобильных устройствах конфликтует со скроллом. Нужно добавить `TouchSensor` с задержкой активации (`delay: 250ms, tolerance: 5px`), чтобы drag-and-drop корректно срабатывал на touch-устройствах и не мешал обычному скроллу.

**Файл**: `src/components/admin/AdminSidebar.tsx`
- Импортировать `TouchSensor` из `@dnd-kit/core`
- Добавить `useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })` в `useSensors`

### 2. Закрепить строку чата AI-ассистента на всех вкладках
Сейчас чат доступен только на вкладке "Дашборд" внутри `SalesAssistant`. Нужно вынести строку ввода в фиксированный элемент внизу экрана (`fixed bottom-0`), который виден на всех вкладках.

**Подход**: Извлечь чат-логику (messages, input, send, streamChat) в отдельный компонент `FloatingAIChat`, который:
- Рендерится в `Admin.tsx` вне `<main>`, как `fixed` элемент внизу
- На мобильном: компактная строка ввода с иконкой бота, при фокусе/клике раскрывается в полноэкранный чат
- На десктопе: компактная полоса внизу, раскрывается в панель ~400px
- Кнопка сворачивания/разворачивания
- Quick questions показываются только когда чат развёрнут и пуст

**Файлы**:
- Создать `src/components/admin/FloatingAIChat.tsx` — новый компонент с фиксированным позиционированием
- `src/pages/Admin.tsx` — добавить `<FloatingAIChat />` рядом с `SidebarProvider`, добавить `pb-14` к `<main>` чтобы контент не перекрывался
- `src/components/admin/SalesAssistant.tsx` — убрать AI-чат из этого компонента, оставить только ForecastCards + LeadsPanel
- `src/components/admin/DashboardTab.tsx` — проверить, рендерит ли он SalesAssistant, адаптировать

### 3. Адаптация чата под телефон
В `FloatingAIChat`:
- Свёрнутое состояние: тонкая полоска `h-12` с input и кнопкой отправки
- Развёрнутое состояние на мобильном: `fixed inset-0 z-50` полноэкранный оверлей с историей сообщений
- Развёрнутое на десктопе: `fixed bottom-0 right-4 w-96 h-[450px]`

### Файлы для изменения

| Файл | Изменение |
|---|---|
| `src/components/admin/AdminSidebar.tsx` | Добавить `TouchSensor` для мобильного drag-and-drop |
| `src/components/admin/FloatingAIChat.tsx` | Новый: фиксированный чат-виджет |
| `src/pages/Admin.tsx` | Подключить FloatingAIChat, padding-bottom для main |
| `src/components/admin/SalesAssistant.tsx` | Убрать секцию AI-чата, оставить прогноз + лиды |
| `src/components/admin/DashboardTab.tsx` | Проверить/адаптировать под изменения |
