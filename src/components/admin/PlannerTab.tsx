import { useState, useMemo, useRef, useCallback, useEffect } from "react";
import { useIsMobile } from "@/hooks/use-mobile";
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
import { ChevronLeft, ChevronRight, Plus, Trash2, Loader2, GripVertical, Check, ChevronsUpDown, FileOutput, FileText, ClipboardCheck, Bell, Send, Filter, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import SalesAssistant from "./SalesAssistant";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverEvent,
  DragOverlay,
  DragStartEvent,
  useDroppable,
  pointerWithin,
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
  onCreateDocument,
}: {
  task: Task;
  clients: Client[];
  contracts: Contract[];
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onCreateDocument?: (task: Task, docType?: string) => void;
}) {
  const [taskPopoverOpen, setTaskPopoverOpen] = useState(false);
  const [reminderTime, setReminderTime] = useState("");
  const [reminderSending, setReminderSending] = useState(false);
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: task.id,
    data: { task },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition: transition || "transform 200ms cubic-bezier(0.25, 1, 0.5, 1), opacity 200ms ease",
    opacity: isDragging ? 0.3 : 1,
    scale: isDragging ? "0.95" : "1",
  };

  const statusCfg = STATUS_CONFIG[task.status] || STATUS_CONFIG.todo;
  const statusStrip = task.status === "in_progress" ? "border-l-yellow-500" : task.status === "done" ? "border-l-green-500" : "border-l-muted-foreground/30";
  const client = task.client_id ? clients.find((c) => c.id === task.client_id) : null;
  const contract = task.contract_id ? contracts.find((c) => c.id === task.contract_id) : null;

  const sendReminder = async (immediate: boolean) => {
    setReminderSending(true);
    try {
      const timeStr = immediate ? "сейчас" : reminderTime;
      const clientName = client?.name || "";
      const contractNum = contract?.contract_number ? ` (договор №${contract.contract_number})` : "";
      
      let text = `🔔 <b>Напоминание</b>\n\n`;
      text += `📋 <b>${task.title}</b>\n`;
      if (task.description) text += `${task.description}\n`;
      if (clientName) text += `👤 ${clientName}${contractNum}\n`;
      text += `📅 ${new Date(task.task_date).toLocaleDateString("ru-RU")}`;
      if (!immediate && reminderTime) text += ` в ${reminderTime}`;
      
      if (!immediate && reminderTime) {
        // Schedule: calculate delay and use setTimeout
        const [hours, minutes] = reminderTime.split(":").map(Number);
        const now = new Date();
        const target = new Date(task.task_date);
        target.setHours(hours, minutes, 0, 0);
        const delay = target.getTime() - now.getTime();
        
        if (delay <= 0) {
          // Time already passed, send immediately
          const { data: session } = await supabase.auth.getSession();
          await supabase.functions.invoke("send-bot-message", {
            body: { chat_id: 1248037753, text },
          });
          toast.success("Напоминание отправлено (время уже прошло)");
        } else {
          // Schedule the send
          setTimeout(async () => {
            try {
              await supabase.functions.invoke("send-bot-message", {
                body: { chat_id: 1248037753, text },
              });
            } catch (e) {
              console.error("Scheduled reminder failed:", e);
            }
          }, delay);
          const mins = Math.round(delay / 60000);
          toast.success(`Напоминание запланировано через ${mins} мин.`);
        }
      } else {
        await supabase.functions.invoke("send-bot-message", {
          body: { chat_id: 1248037753, text },
        });
        toast.success("Напоминание отправлено в Telegram");
      }
    } catch (e) {
      toast.error("Ошибка отправки напоминания");
      console.error(e);
    }
    setReminderSending(false);
  };

  return (
    <Popover open={taskPopoverOpen} onOpenChange={setTaskPopoverOpen}>
      <div
        ref={setNodeRef}
        style={style}
        className={cn(
          "group flex items-start gap-2 p-3 rounded-md border border-l-[3px] bg-card hover:shadow-sm transition-shadow",
          statusStrip
        )}
      >
        <span {...attributes} {...listeners} className="mt-1 cursor-grab opacity-60 sm:opacity-0 sm:group-hover:opacity-60 transition-opacity shrink-0">
          <GripVertical className="h-4 w-4" />
        </span>
        <PopoverTrigger asChild>
          <div className="flex-1 min-w-0 space-y-1.5 cursor-pointer">
            <TooltipProvider delayDuration={300}>
              <Tooltip>
                <TooltipTrigger asChild>
                  <p className="text-sm font-medium leading-snug line-clamp-2">{task.title}</p>
                </TooltipTrigger>
                <TooltipContent side="top" className="max-w-[250px]">
                  <p className="text-xs">{task.title}</p>
                  {task.description && <p className="text-xs text-muted-foreground mt-1">{task.description}</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
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
              onClick={(e) => { e.stopPropagation(); onStatusChange(task.id, statusCfg.next); }}
              className={`inline-block text-xs font-medium rounded px-2 py-0.5 ${statusCfg.color} cursor-pointer hover:opacity-80 transition-opacity`}
            >
              {statusCfg.label}
            </button>
          </div>
        </PopoverTrigger>
        <button
          onClick={() => onDelete(task.id)}
          className="opacity-60 sm:opacity-0 sm:group-hover:opacity-60 hover:!opacity-100 transition-opacity shrink-0 text-destructive"
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      <PopoverContent className="w-72 p-4 space-y-3 max-h-[80vh] overflow-y-auto" side="bottom" align="center">
        <p className="font-semibold text-sm leading-tight">{task.title}</p>
        {task.description && <p className="text-xs text-muted-foreground">{task.description}</p>}
        <div className="space-y-1.5">
          {client && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Клиент:</span>
              <span className="font-medium">{client.name}</span>
            </div>
          )}
          {contract && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Договор:</span>
              <span className="font-medium">№{contract.contract_number || "—"}</span>
            </div>
          )}
          <div className="flex items-center gap-2 text-xs">
            <span className="text-muted-foreground">Статус:</span>
            <span className={`text-xs font-medium rounded px-2 py-0.5 ${statusCfg.color}`}>{statusCfg.label}</span>
          </div>
        </div>
        {onCreateDocument && task.contract_id ? (
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground font-medium">Создать документ:</p>
            <div className="flex flex-col gap-1.5">
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setTaskPopoverOpen(false); onCreateDocument(task, "invoice"); }}
              >
                <FileText className="w-4 h-4 mr-2" />
                Счёт на оплату
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setTaskPopoverOpen(false); onCreateDocument(task, "act"); }}
              >
                <ClipboardCheck className="w-4 h-4 mr-2" />
                Акт выполненных работ
              </Button>
              <Button
                variant="outline"
                size="sm"
                className="w-full justify-start"
                onClick={() => { setTaskPopoverOpen(false); onCreateDocument(task, "contract"); }}
              >
                <FileOutput className="w-4 h-4 mr-2" />
                Договор
              </Button>
            </div>
          </div>
        ) : onCreateDocument ? (
          <Button
            variant="outline"
            size="sm"
            className="w-full"
            onClick={() => { setTaskPopoverOpen(false); onCreateDocument(task); }}
          >
            <FileOutput className="w-4 h-4 mr-2" />
            Создать документ
          </Button>
        ) : null}

        {/* Telegram Reminder */}
        <div className="space-y-1.5 border-t pt-3">
          <p className="text-xs text-muted-foreground font-medium flex items-center gap-1.5">
            <Bell className="w-3.5 h-3.5" /> Напомнить в Telegram
          </p>
          <div className="flex items-center gap-2">
            <Input
              type="time"
              value={reminderTime}
              onChange={(e) => setReminderTime(e.target.value)}
              className="h-8 text-xs flex-1"
              placeholder="Время"
            />
            <Button
              variant="outline"
              size="sm"
              className="h-8 px-2.5 shrink-0"
              disabled={reminderSending}
              onClick={() => sendReminder(false)}
              title={reminderTime ? `Отправить в ${reminderTime}` : "Укажите время"}
            >
              {reminderSending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            </Button>
          </div>
          <Button
            variant="ghost"
            size="sm"
            className="w-full h-7 text-xs"
            disabled={reminderSending}
            onClick={() => sendReminder(true)}
          >
            Отправить сейчас
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
}

function DayColumn({
  date,
  tasks,
  clients,
  contracts,
  isExpanded,
  isMobile,
  onSelect,
  onStatusChange,
  onDelete,
  onAddTask,
  onCreateDocument,
}: {
  date: Date;
  tasks: Task[];
  clients: Client[];
  contracts: Contract[];
  isExpanded: boolean;
  isMobile: boolean;
  onSelect: () => void;
  onStatusChange: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  onAddTask: (date: string, title: string, clientId?: string, contractId?: string) => void;
  onCreateDocument?: (task: Task) => void;
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

  const { setNodeRef: setDroppableRef, isOver } = useDroppable({
    id: `day-${dateStr}`,
    data: { date: dateStr },
  });

  return (
    <div
      ref={setDroppableRef}
      onClick={onSelect}
      className={cn(
        "flex flex-col rounded-lg border cursor-pointer transition-all duration-300 ease-out min-w-0",
        today ? "border-primary/60 bg-primary/5 shadow-md shadow-primary/10 ring-1 ring-primary/20" : "bg-muted/30",
        isExpanded && "border-primary/60 shadow-lg shadow-primary/10",
        isOver && "ring-2 ring-primary/50 bg-primary/10 sm:scale-[1.02] shadow-lg shadow-primary/20"
      )}
      style={{ flex: isMobile ? undefined : (isExpanded ? 3 : (tasks.length > 0 ? 2 : 1)) }}
    >
      <div className={cn(
        "px-3 py-2.5 text-center border-b transition-all duration-500",
        today && "bg-primary/15 border-b-primary/30"
      )}>
        <div className={cn("text-sm", today ? "text-primary font-medium" : "text-muted-foreground")}>{format(date, "EEEEEE", { locale: ru })}</div>
        <div className={cn(
          "text-xl font-bold",
          today ? "text-primary" : "text-foreground"
        )}>
          {format(date, "d")}
        </div>
        {today && <div className="w-1.5 h-1.5 rounded-full bg-primary mx-auto mt-1" />}
      </div>
      <div className="p-2 space-y-2 min-h-[60px] max-h-[320px] overflow-y-auto">
        <SortableContext items={tasks.map((t) => t.id)} strategy={verticalListSortingStrategy}>
          {tasks.map((task) => (
            <TaskCard key={task.id} task={task} clients={clients} contracts={contracts} onStatusChange={onStatusChange} onDelete={onDelete} onCreateDocument={onCreateDocument} />
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
function EdgeDropZone({ id, side, isCharging }: { id: string; side: "left" | "right"; isCharging?: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id });
  return (
    <div
      ref={setNodeRef}
      className={cn(
        "relative flex items-center justify-center w-12 shrink-0 rounded-lg border-2 border-dashed transition-all overflow-hidden",
        isOver
          ? "border-primary bg-primary/20 scale-105"
          : "border-muted-foreground/30 bg-muted/20"
      )}
    >
      {isCharging && (
        <div className="absolute inset-0 bg-primary/30 animate-pulse" />
      )}
      {isCharging && (
        <div
          className="absolute bottom-0 left-0 right-0 bg-primary/60 transition-all duration-1000 ease-linear"
          style={{ height: "100%", animation: "edgeFill 1s linear forwards" }}
        />
      )}
      <div className="relative z-10">
        {side === "left" ? (
          <ChevronLeft className={cn("h-5 w-5", isOver ? "text-primary" : "text-muted-foreground")} />
        ) : (
          <ChevronRight className={cn("h-5 w-5", isOver ? "text-primary" : "text-muted-foreground")} />
        )}
      </div>
    </div>
  );
}

const PlannerTab = ({ onCreateDocument }: { onCreateDocument?: (task: Task, docType?: string) => void }) => {
  const isMobile = useIsMobile();
  const queryClient = useQueryClient();
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date(), { weekStartsOn: 1 }));
  const [activeTask, setActiveTask] = useState<Task | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => format(new Date(), "yyyy-MM-dd"));
  const [chargingEdge, setChargingEdge] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [filterClientId, setFilterClientId] = useState<string>("all");
  const [filterClientOpen, setFilterClientOpen] = useState(false);
  const edgeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const touchStartRef = useRef<{ x: number; y: number; time: number } | null>(null);
  const edgeHoverIdRef = useRef<string | null>(null);
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
    staleTime: 5 * 60 * 1000,
  });

  const { data: clients = [] } = useQuery({
    queryKey: ["planner-clients"],
    queryFn: async () => {
      const { data, error } = await supabase.from("clients").select("id, name").order("name");
      if (error) throw error;
      return data as Client[];
    },
    staleTime: 5 * 60 * 1000,
  });

  const { data: contracts = [] } = useQuery({
    queryKey: ["planner-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts").select("id, client_name, contract_number").eq("is_archived", false).order("contract_number", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
    staleTime: 5 * 60 * 1000,
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
        contract_id: (contract_id && contract_id !== "none") ? contract_id : null,
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

  const clearEdgeTimer = useCallback(() => {
    if (edgeTimerRef.current) {
      clearTimeout(edgeTimerRef.current);
      edgeTimerRef.current = null;
    }
    edgeHoverIdRef.current = null;
    setChargingEdge(null);
  }, []);

  useEffect(() => {
    return () => clearEdgeTimer();
  }, [clearEdgeTimer]);

  const handleDragOver = useCallback((event: DragOverEvent) => {
    const overId = event.over?.id ? String(event.over.id) : null;

    if (overId !== "edge-prev-week" && overId !== "edge-next-week") {
      clearEdgeTimer();
      return;
    }

    // Already tracking this edge
    if (edgeHoverIdRef.current === overId) return;

    clearEdgeTimer();
    edgeHoverIdRef.current = overId;
    setChargingEdge(overId);

    const activeId = String(event.active.id);

    edgeTimerRef.current = setTimeout(() => {
      // Find the task from current data
      const task = queryClient.getQueryData<Task[]>(["planner-tasks", format(weekStart, "yyyy-MM-dd")])
        ?.find((t) => t.id === activeId);
      if (!task) return;

      const taskDate = new Date(task.task_date + "T00:00:00");
      const newDate = overId === "edge-prev-week" ? addDays(taskDate, -7) : addDays(taskDate, 7);
      const newDateStr = format(newDate, "yyyy-MM-dd");

      updateTask.mutate({ id: task.id, task_date: newDateStr });

      if (overId === "edge-prev-week") {
        setWeekStart((w) => subWeeks(w, 1));
      } else {
        setWeekStart((w) => addWeeks(w, 1));
      }

      clearEdgeTimer();
    }, 1000);
  }, [weekStart, clearEdgeTimer, queryClient, updateTask]);

  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find((t) => t.id === event.active.id);
    setActiveTask(task || null);
    setIsDragging(true);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    clearEdgeTimer();
    setActiveTask(null);
    setIsDragging(false);
    const { active, over } = event;
    if (!over) return;

    const activeTaskData = tasks.find((t) => t.id === active.id);
    if (!activeTaskData) return;

    const overId = String(over.id);

    // Edge zones: move to prev/next week (same weekday)
    if (overId === "edge-prev-week" || overId === "edge-next-week") {
      const taskDate = new Date(activeTaskData.task_date + "T00:00:00");
      const newDate = overId === "edge-prev-week"
        ? addDays(taskDate, -7)
        : addDays(taskDate, 7);
      const newDateStr = format(newDate, "yyyy-MM-dd");
      updateTask.mutate({ id: activeTaskData.id, task_date: newDateStr });
      // Switch visible week
      if (overId === "edge-prev-week") {
        setWeekStart((w) => subWeeks(w, 1));
      } else {
        setWeekStart((w) => addWeeks(w, 1));
      }
      return;
    }

    // Check if dropped on a day column droppable zone
    if (overId.startsWith("day-")) {
      const targetDate = overId.replace("day-", "");
      if (activeTaskData.task_date !== targetDate) {
        updateTask.mutate({ id: activeTaskData.id, task_date: targetDate });
      }
      return;
    }

    // Dropped over another task
    const overTask = tasks.find((t) => t.id === overId);
    if (overTask) {
      if (activeTaskData.task_date === overTask.task_date) {
        // Same day reorder
        const dayTasks = tasks.filter((t) => t.task_date === activeTaskData.task_date).sort((a, b) => a.sort_order - b.sort_order);
        const oldIdx = dayTasks.findIndex((t) => t.id === active.id);
        const newIdx = dayTasks.findIndex((t) => t.id === overId);
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

  const filteredTasks = useMemo(() => {
    let result = tasks;
    if (filterStatus !== "all") result = result.filter(t => t.status === filterStatus);
    if (filterClientId !== "all") {
      if (filterClientId === "__none__") result = result.filter(t => !t.client_id);
      else result = result.filter(t => t.client_id === filterClientId);
    }
    return result;
  }, [tasks, filterStatus, filterClientId]);

  const hasFilters = filterStatus !== "all" || filterClientId !== "all";
  const selectedFilterClient = clients.find(c => c.id === filterClientId);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setWeekStart((w) => subWeeks(w, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" className="h-8 sm:h-9 text-xs sm:text-sm" onClick={goToday}>Сегодня</Button>
          <Button variant="outline" size="icon" className="h-8 w-8 sm:h-9 sm:w-9" onClick={() => setWeekStart((w) => addWeeks(w, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <h2 className="text-xs sm:text-sm font-medium text-muted-foreground ml-1">
            {format(weekStart, "d MMM", { locale: ru })} — {format(weekEnd, "d MMM yyyy", { locale: ru })}
            {hasFilters && <span className="ml-2 text-xs text-primary">({filteredTasks.length} из {tasks.length})</span>}
          </h2>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="flex items-center gap-1.5">
            <Filter className="h-3.5 w-3.5 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="h-8 w-[120px] sm:w-[130px] text-xs">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="todo">Сделать</SelectItem>
                <SelectItem value="in_progress">В работе</SelectItem>
                <SelectItem value="done">Готово</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <Popover open={filterClientOpen} onOpenChange={setFilterClientOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-8 text-xs font-normal gap-1.5 max-w-[160px] sm:max-w-[180px]">
                {filterClientId === "all" ? "Все клиенты" : filterClientId === "__none__" ? "Без клиента" : (selectedFilterClient?.name || "Клиент")}
                <ChevronsUpDown className="h-3.5 w-3.5 opacity-50" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-0" side="bottom" align="end">
              <Command>
                <CommandInput placeholder="Поиск клиента..." className="h-9" />
                <CommandList>
                  <CommandEmpty>Не найдено</CommandEmpty>
                  <CommandGroup>
                    <CommandItem value="__all__" onSelect={() => { setFilterClientId("all"); setFilterClientOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", filterClientId === "all" ? "opacity-100" : "opacity-0")} />
                      Все клиенты
                    </CommandItem>
                    <CommandItem value="__none__" onSelect={() => { setFilterClientId("__none__"); setFilterClientOpen(false); }}>
                      <Check className={cn("mr-2 h-4 w-4", filterClientId === "__none__" ? "opacity-100" : "opacity-0")} />
                      Без клиента
                    </CommandItem>
                    {clients.map(c => (
                      <CommandItem key={c.id} value={c.name} onSelect={() => { setFilterClientId(c.id); setFilterClientOpen(false); }}>
                        <Check className={cn("mr-2 h-4 w-4", filterClientId === c.id ? "opacity-100" : "opacity-0")} />
                        {c.name}
                      </CommandItem>
                    ))}
                  </CommandGroup>
                </CommandList>
              </Command>
            </PopoverContent>
          </Popover>

          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-8 text-xs px-2" onClick={() => { setFilterStatus("all"); setFilterClientId("all"); }}>
              <X className="h-3.5 w-3.5 mr-1" /> Сбросить
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : (
        <DndContext sensors={sensors} collisionDetection={pointerWithin} onDragStart={handleDragStart} onDragOver={handleDragOver} onDragEnd={handleDragEnd}>
          <div
            className="flex flex-col sm:flex-row gap-2 min-h-[120px]"
            onTouchStart={(e) => {
              if (!isMobile) return;
              const touch = e.touches[0];
              touchStartRef.current = { x: touch.clientX, y: touch.clientY, time: Date.now() };
            }}
            onTouchEnd={(e) => {
              if (!isMobile || !touchStartRef.current) return;
              const touch = e.changedTouches[0];
              const dx = touch.clientX - touchStartRef.current.x;
              const dy = touch.clientY - touchStartRef.current.y;
              const dt = Date.now() - touchStartRef.current.time;
              touchStartRef.current = null;
              // Horizontal swipe: >80px, faster than 300ms, more horizontal than vertical
              if (Math.abs(dx) > 80 && Math.abs(dx) > Math.abs(dy) * 1.5 && dt < 400) {
                if (dx > 0) setWeekStart((w) => subWeeks(w, 1));
                else setWeekStart((w) => addWeeks(w, 1));
              }
            }}
          >
            {isDragging && <div className="hidden sm:block"><EdgeDropZone id="edge-prev-week" side="left" isCharging={chargingEdge === "edge-prev-week"} /></div>}
            {weekDates.map((date) => {
              const dateStr = format(date, "yyyy-MM-dd");
              const dayTasks = filteredTasks.filter((t) => t.task_date === dateStr).sort((a, b) => a.sort_order - b.sort_order);
              return (
                <DayColumn
                  key={dateStr}
                  date={date}
                  tasks={dayTasks}
                  clients={clients}
                  contracts={contracts}
                  isExpanded={selectedDate === dateStr}
                  isMobile={isMobile}
                  onSelect={() => setSelectedDate(dateStr)}
                  onStatusChange={handleStatusChange}
                  onDelete={(id) => deleteTask.mutate(id)}
                  onAddTask={handleAddTask}
                  onCreateDocument={onCreateDocument}
                />
              );
            })}
            {isDragging && <div className="hidden sm:block"><EdgeDropZone id="edge-next-week" side="right" isCharging={chargingEdge === "edge-next-week"} /></div>}
          </div>
          <DragOverlay dropAnimation={{
            duration: 250,
            easing: "cubic-bezier(0.25, 1, 0.5, 1)",
          }}>
            {activeTask && (
              <div className="p-3 rounded-lg border-2 border-primary/40 bg-card shadow-2xl shadow-primary/20 text-sm font-medium max-w-[200px] rotate-[2deg] scale-105 transition-transform">
                <p className="line-clamp-2">{activeTask.title}</p>
                {activeTask.client_id && (() => {
                  const c = clients.find(cl => cl.id === activeTask.client_id);
                  return c ? <span className="text-xs text-muted-foreground mt-1 block">{c.name}</span> : null;
                })()}
              </div>
            )}
          </DragOverlay>
        </DndContext>
      )}

      <SalesAssistant />
    </div>
  );
};

export default PlannerTab;
