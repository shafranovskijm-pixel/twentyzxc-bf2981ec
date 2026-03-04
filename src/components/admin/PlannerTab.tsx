import { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { toast } from "sonner";
import { format, startOfWeek, addDays, addWeeks, subWeeks, isToday } from "date-fns";
import { ru } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, GripVertical, Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";

interface Task {
  id: string;
  title: string;
  description: string | null;
  task_date: string;
  status: string;
  sort_order: number;
  client_id: string | null;
  contract_id: string | null;
  created_at: string;
  updated_at: string;
}

interface Client {
  id: string;
  name: string;
}

interface Contract {
  id: string;
  client_name: string;
  contract_number: string | null;
}

const STATUS_CONFIG: Record<string, { label: string; color: string; next: string }> = {
  todo: { label: "Сделать", color: "bg-muted text-muted-foreground", next: "in_progress" },
  in_progress: { label: "В работе", color: "bg-yellow-500/20 text-yellow-700 dark:text-yellow-400", next: "done" },
  done: { label: "Готово", color: "bg-green-500/20 text-green-700 dark:text-green-400", next: "todo" },
};

function TaskCard({
  task,
  clients,
  contracts,
  onStatusChange,
  onDelete,
}: {
  task: Task;
  clients: Client[];
  contracts: Contract[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
  };

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const client = task.client_id ? clients.find((c) => c.id === task.client_id) : null;
  const contract = task.contract_id ? contracts.find((c) => c.id === task.contract_id) : null;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className="group flex items-start gap-2 p-3 rounded-md border bg-card hover:shadow-sm transition-shadow"
    >
      <span {...attributes} {...listeners} className="mt-1 cursor-grab opacity-0 group-hover:opacity-60 transition-opacity shrink-0">
        <GripVertical className="h-4 w-4" />
      </span>
      <div className="flex-1 min-w-0 space-y-1.5">
        <p className="text-base font-medium leading-tight truncate">{task.title}</p>
        {client && (
          <Badge variant="outline" className="text-xs px-1.5 py-0.5">
            {client.name}
          </Badge>
        )}
        {contract && (
          <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
            №{contract.contract_number || "—"}
          </Badge>
        )}
        <button
          onClick={() => onStatusChange(task.id, statusCfg.next)}
          className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${statusCfg.color} cursor-pointer hover:opacity-80 transition-opacity`}
        >
          {statusCfg.label}
        </button>
      </div>
      <button
        onClick={() => onDelete(task.id)}
        className="opacity-0 group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 text-destructive"
      >
        <Trash2 className="h-4 w-4" />
      </button>
    </div>
  );
}

function DayColumn({
  date,
  tasks,
  clients,
  contracts,
  isExpanded,
  onSelect,
  onStatusChange,
  onDelete,
  onAddTask,
}: {
  date: Date;
  tasks: Task[];
  clients: Client[];
  contracts: Contract[];
  isExpanded: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (date: string, title: string, clientId?: string, contractId?: string) => void;
}) {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newClientId, setNewClientId] = useState<string>("");
  const [newContractId, setNewContractId] = useState<string>("");
  const [clientSearchOpen, setClientSearchOpen] = useState(false);
  const dateStr = format(date, "yyyy-MM-dd");
  const today = isToday(date);

  const filteredContracts = newClientId
    ? contracts.filter((c) => c.client_name === clients.find((cl) => cl.id === newClientId)?.name)
    : contracts;

  const selectedClient = clients.find((c) => c.id === newClientId);

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTask(dateStr, newTitle.trim(), newClientId || undefined, newContractId || undefined);
    setNewTitle("");
    setNewClientId("");
    setNewContractId("");
    setPopoverOpen(false);
  };

  const resetForm = () => {
    setNewTitle("");
    setNewClientId("");
    setNewContractId("");
  };

  return (
    <div
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-lg border cursor-pointer transition-all duration-500 ease-in-out min-w-0",
        today ? "border-primary/50 bg-primary/5" : "bg-muted/30",
        isExpanded && "border-primary/60 shadow-lg shadow-primary/10"
      )}
      style={{ flex: isExpanded ? 3 : 1 }}
    >
      <div className={`px-3 py-2.5 text-center border-b transition-all duration-500 ${today ? "bg-primary/10" : ""}`}>
        <div className="text-sm text-muted-foreground">{format(date, "EEEEEE", { locale: ru })}</div>
        <div className={`text-xl font-bold ${today ? "text-primary" : "text-foreground"}`}>{format(date, "d")}</div>
      </div>
      <div className="flex-1 p-2 space-y-2 min-h-[200px] overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} clients={clients} contracts={contracts} onStatusChange={onStatusChange} onDelete={onDelete} />
          ))}
        </SortableContext>
      </div>
      <div className="p-2 border-t">
        <Popover open={popoverOpen} onOpenChange={(open) => { setPopoverOpen(open); if (!open) resetForm(); }}>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="w-full h-6 text-xs text-muted-foreground">
              <Plus className="h-3 w-3 mr-1" />Задача
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4 space-y-3" side="top" align="start">
            <p className="text-sm font-medium">Новая задача — {format(date, "d MMMM", { locale: ru })}</p>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Название задачи..."
              className="h-9 text-sm"
              autoFocus
            />

            {/* Client combobox */}
            <Popover open={clientSearchOpen} onOpenChange={setClientSearchOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={clientSearchOpen}
                  className="w-full h-9 justify-between text-sm font-normal"
                >
                  {selectedClient ? selectedClient.name : "Выберите клиента..."}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-72 p-0" side="bottom" align="start">
                <Command>
                  <CommandInput placeholder="Поиск клиента..." className="h-9" />
                  <CommandList>
                    <CommandEmpty>Не найдено</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        value="__none__"
                        onSelect={() => { setNewClientId(""); setNewContractId(""); setClientSearchOpen(false); }}
                      >
                        <Check className={cn("mr-2 h-4 w-4", !newClientId ? "opacity-100" : "opacity-0")} />
                        Без клиента
                      </CommandItem>
                      {clients.map((c) => (
                        <CommandItem
                          key={c.id}
                          value={c.name}
                          onSelect={() => { setNewClientId(c.id); setNewContractId(""); setClientSearchOpen(false); }}
                        >
                          <Check className={cn("mr-2 h-4 w-4", newClientId === c.id ? "opacity-100" : "opacity-0")} />
                          {c.name}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>

            {/* Contract select */}
            <Select value={newContractId} onValueChange={setNewContractId}>
              <SelectTrigger className="h-9 text-sm">
                <SelectValue placeholder="Договор (необязательно)" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Без договора</SelectItem>
                {filteredContracts.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.contract_number ? `№${c.contract_number} — ${c.client_name}` : c.client_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex gap-2 pt-1">
              <Button size="sm" className="flex-1" onClick={handleAdd} disabled={!newTitle.trim()}>
                Добавить
              </Button>
              <Button size="sm" variant="outline" onClick={() => setPopoverOpen(false)}>
                Отмена
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>
    </div>
  );
}

const PlannerTab = () => {
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activeTask, setActiveTask] = useState<Task | null>(null);

  const weekDates = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const weekEnd = addDays(weekStart, 6);

  const { data: tasks = [], isLoading } = useQuery({
    queryKey: ["planner-tasks", format(weekStart, "yyyy-MM-dd")],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .gte("task_date", format(weekStart, "yyyy-MM-dd"))
        .lte("task_date", format(weekEnd, "yyyy-MM-dd"))
        .order("sort_order");
      if (error) throw error;
      return data as Task[];
    },
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["planner-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data as Client[];
    },
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["planner-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("id, client_name, contract_number").eq("is_archived", false).order("contract_number", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  const updateTask = useMutation({
    mutationFn: async (updates: { id: string } & Partial<Task>) => {
      const { id, ...rest } = updates;
      const { error } = await supabase.from("tasks").update({ ...rest, updated_at: new Date().toISOString() }).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["planner-tasks"] }),
  });

  const addTask = useMutation({
    mutationFn: async ({ task_date, title, client_id, contract_id }: { task_date: string; title: string; client_id?: string; contract_id?: string }) => {
      const maxOrder = tasks.filter((t) => t.task_date === task_date).reduce((m, t) => Math.max(m, t.sort_order), -1);
      const { error } = await supabase.from("tasks").insert({
        title,
        task_date,
        client_id: client_id || null,
        contract_id: contract_id || null,
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["planner-tasks"] }); toast.success("Задача добавлена"); },
    onError: () => toast.error("Ошибка добавления"),
  });

  const deleteTask = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["planner-tasks"] }); toast.success("Задача удалена"); },
  });

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }));

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTask(null);
    const { active, over } = event;
    if (!over) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    // Check if dropped over a task in a different day
    const overTask = tasks.find((t) => t.id === over.id);
    if (overTask) {
      if (activeTaskData.task_date === overTask.task_date) {
        // Same day reorder
        const dayTasks = tasks.filter((t) => t.task_date === activeTaskData.task_date).sort((a, b) => a.sort_order - b.sort_order);
        const oldIdx = dayTasks.findIndex((t) => t.id === active.id);
        const newIdx = dayTasks.findIndex((t) => t.id === over.id);
        if (oldIdx !== newIdx) {
          const reordered = arrayMove(dayTasks, oldIdx, newIdx);
          reordered.forEach((t, i) => {
            if (t.sort_order !== i) {
              updateTask.mutate({ id: t.id, sort_order: i });
            }
          });
        }
      } else {
        // Move to different day
        updateTask.mutate({ id: activeTaskData.id, task_date: overTask.task_date });
      }
    }
  };

  const handleStatusChange = (id: string, status: string) => {
    updateTask.mutate({ id, status });
  };

  const handleAddTask = (date: string, title: string, clientId?: string, contractId?: string) => {
    addTask.mutate({ task_date: date, title, client_id: clientId, contract_id: contractId });
  };

  const goToday = () => setWeekStart(startOfWeek(new Date(), { weekStartsOn: 1 }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => subWeeks(w, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToday}>Сегодня</Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
        <h2 className="text-sm font-medium text-muted-foreground">
          {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
        </h2>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
          <div className="grid grid-cols-7 gap-2 h-[calc(100vh-12rem)]">
            {weekDates.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayTasks = tasks.filter((t) => t.task_date === dateStr).sort((a, b) => a.sort_order - b.sort_order);
              return (
                <DayColumn
                  key={dateStr}
                  date={date}
                  tasks={dayTasks}
                  clients={clients}
                  contracts={contracts}
                  onStatusChange={handleStatusChange}
                  onDelete={(id) => deleteTask.mutate(id)}
                  onAddTask={handleAddTask}
                />
              );
            })}
          </div>
          <DragOverlay>
            {activeTask && (
              <div className="p-2 rounded-md border bg-card shadow-lg text-sm font-medium">
                {activeTask.title}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}
    </div>
  );
};

export default PlannerTab;
