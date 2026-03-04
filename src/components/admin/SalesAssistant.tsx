import { useState, useRef, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Bot, Send, Loader2, TrendingUp, AlertTriangle, DollarSign } from "lucide-react";
import { format, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addMonths, isWithinInterval, isBefore } from "date-fns";
import { ru } from "date-fns/locale";
import ReactMarkdown from "react-markdown";
import LeadsPanel from "./LeadsPanel";

type Msg = { role: "user" | "assistant"; content: string };

interface Contract {
  id: string;
  client_name: string;
  contract_number: string | null;
  contract_date: string | null;
  amount: number | null;
  amount_extra: number | null;
  payment_status: string | null;
  paid_until: string | null;
  is_archived: boolean;
  created_at: string;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/sales-assistant`;

async function streamChat({
  messages,
  onDelta,
  onDone,
}: {
  messages: Msg[];
  onDelta: (t: string) => void;
  onDone: () => void;
}) {
  const resp = await fetch(CHAT_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ messages }),
  });

  if (!resp.ok) {
    const err = await resp.json().catch(() => ({ error: "Ошибка" }));
    throw new Error(err.error || `HTTP ${resp.status}`);
  }
  if (!resp.body) throw new Error("No stream body");

  const reader = resp.body.getReader();
  const decoder = new TextDecoder();
  let buf = "";
  let done = false;

  while (!done) {
    const { done: d, value } = await reader.read();
    if (d) break;
    buf += decoder.decode(value, { stream: true });

    let idx: number;
    while ((idx = buf.indexOf("\n")) !== -1) {
      let line = buf.slice(0, idx);
      buf = buf.slice(idx + 1);
      if (line.endsWith("\r")) line = line.slice(0, -1);
      if (line.startsWith(":") || !line.trim()) continue;
      if (!line.startsWith("data: ")) continue;
      const json = line.slice(6).trim();
      if (json === "[DONE]") { done = true; break; }
      try {
        const parsed = JSON.parse(json);
        const c = parsed.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {
        buf = line + "\n" + buf;
        break;
      }
    }
  }

  // flush
  if (buf.trim()) {
    for (let raw of buf.split("\n")) {
      if (!raw) continue;
      if (raw.endsWith("\r")) raw = raw.slice(0, -1);
      if (!raw.startsWith("data: ")) continue;
      const j = raw.slice(6).trim();
      if (j === "[DONE]") continue;
      try {
        const p = JSON.parse(j);
        const c = p.choices?.[0]?.delta?.content;
        if (c) onDelta(c);
      } catch {}
    }
  }
  onDone();
}

function ForecastCards({ contracts }: { contracts: Contract[] }) {
  const now = new Date();
  const active = contracts.filter(c => !c.is_archived);

  const calcForecast = (start: Date, end: Date) => {
    return active.reduce((sum, c) => {
      const amount = (c.amount || 0) + (c.amount_extra || 0);
      if (!amount) return sum;

      // Unpaid contracts without paid_until — expected income this month
      if (!c.paid_until && c.payment_status === "не оплачено") {
        // Show in current month and this week forecasts
        const contractDate = c.contract_date ? new Date(c.contract_date) : new Date(c.created_at || now);
        if (isWithinInterval(contractDate, { start, end }) || isWithinInterval(now, { start, end })) {
          return sum + amount;
        }
        return sum;
      }

      if (!c.paid_until) return sum;
      const paidUntil = new Date(c.paid_until);
      if (isWithinInterval(paidUntil, { start, end }) || isBefore(paidUntil, start)) {
        return sum + amount;
      }
      return sum;
    }, 0);
  };

  const thisWeek = calcForecast(startOfWeek(now, { weekStartsOn: 1 }), endOfWeek(now, { weekStartsOn: 1 }));
  const thisMonth = calcForecast(startOfMonth(now), endOfMonth(now));
  const nextMonth = calcForecast(startOfMonth(addMonths(now, 1)), endOfMonth(addMonths(now, 1)));

  const overdue = active.filter(c => c.paid_until && isBefore(new Date(c.paid_until), now)).length;

  const cards = [
    { label: "Эта неделя", value: thisWeek, icon: DollarSign, color: "text-green-600" },
    { label: "Этот месяц", value: thisMonth, icon: TrendingUp, color: "text-blue-600" },
    { label: "След. месяц", value: nextMonth, icon: TrendingUp, color: "text-purple-600" },
  ];

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-3 gap-3">
        {cards.map(({ label, value, icon: Icon, color }) => (
          <Card key={label} className="bg-muted/30">
            <CardContent className="p-3 text-center">
              <Icon className={`w-4 h-4 mx-auto mb-1 ${color}`} />
              <p className="text-[11px] text-muted-foreground">{label}</p>
              <p className="text-lg font-bold">{value.toLocaleString("ru-RU")}₽</p>
            </CardContent>
          </Card>
        ))}
      </div>
      {overdue > 0 && (
        <div className="flex items-center gap-2 text-xs text-amber-600 bg-amber-500/10 rounded-md px-3 py-2">
          <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
          Просроченных договоров: {overdue}
        </div>
      )}
    </div>
  );
}

const SalesAssistant = () => {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const { data: contracts = [] } = useQuery({
    queryKey: ["sales-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase.from("contracts")
        .select("id, client_name, contract_number, amount, amount_extra, payment_status, paid_until, is_archived")
        .order("contract_number", { ascending: false });
      if (error) throw error;
      return data as Contract[];
    },
  });

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (directText?: string) => {
    const text = (directText || input).trim();
    if (!text || isLoading) return;
    if (!directText) setInput("");

    const userMsg: Msg = { role: "user", content: text };
    setMessages(prev => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";
    const upsert = (chunk: string) => {
      assistantSoFar += chunk;
      setMessages(prev => {
        const last = prev[prev.length - 1];
        if (last?.role === "assistant") {
          return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
        }
        return [...prev, { role: "assistant", content: assistantSoFar }];
      });
    };

    try {
      await streamChat({
        messages: [...messages, userMsg],
        onDelta: upsert,
        onDone: () => setIsLoading(false),
      });
    } catch (e: any) {
      setIsLoading(false);
      toast.error(e.message || "Ошибка AI-ассистента");
    }
  };

  const quickQuestions = [
    "Покажи прогноз поступлений",
    "Кто из клиентов просрочил оплату?",
    "Что можно допродать текущим клиентам?",
    "Кто из клиентов неактивен?",
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mt-6">
      {/* Left: Forecast + Leads */}
      <div className="space-y-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Прогноз поступлений
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ForecastCards contracts={contracts} />
          </CardContent>
        </Card>
        <LeadsPanel />
      </div>

      {/* Right: AI Chat */}
      <div className="lg:col-span-2">
        <Card className="flex flex-col h-[500px]">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-base flex items-center gap-2">
              <Bot className="w-4 h-4" />
              AI-ассистент продаж
            </CardTitle>
          </CardHeader>
          <CardContent className="flex-1 flex flex-col overflow-hidden p-4 pt-0">
            {/* Messages */}
            <div className="flex-1 overflow-y-auto space-y-3 mb-3 pr-1">
              {messages.length === 0 && (
                <div className="flex flex-col items-center justify-center h-full gap-4 py-6">
                  <Bot className="w-8 h-8 text-muted-foreground/40" />
                  <p className="text-sm text-muted-foreground text-center">
                    Задай вопрос о клиентах, продажах или прогнозах
                  </p>
                  <div className="grid grid-cols-2 gap-2 w-full max-w-md">
                    {quickQuestions.map((q, i) => (
                      <button
                        key={q}
                        className="group relative text-left text-xs px-3 py-2.5 rounded-lg border border-border/50 bg-muted/30 hover:bg-muted/60 hover:border-primary/30 transition-all duration-300 hover:shadow-md hover:shadow-primary/5 hover:-translate-y-0.5 animate-fade-in"
                        style={{ animationDelay: `${i * 80}ms`, animationFillMode: 'backwards' }}
                        onClick={() => send(q)}
                      >
                        <span className="text-muted-foreground group-hover:text-foreground transition-colors duration-200">{q}</span>
                        <Send className="absolute top-2 right-2 w-3 h-3 text-primary/0 group-hover:text-primary/60 transition-all duration-200 group-hover:translate-x-0.5" />
                      </button>
                    ))}
                  </div>
                </div>
              )}
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <div className="prose prose-sm dark:prose-invert max-w-none [&>p]:my-1 [&>ul]:my-1 [&>ol]:my-1">
                        <ReactMarkdown>{msg.content}</ReactMarkdown>
                      </div>
                    ) : (
                      msg.content
                    )}
                  </div>
                </div>
              ))}
              {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
                <div className="flex justify-start">
                  <div className="bg-muted rounded-lg px-3 py-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            {/* Input */}
            <div className="flex gap-2 shrink-0">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && send()}
                placeholder="Спросите об оплатах, клиентах, допродажах..."
                className="text-sm"
                disabled={isLoading}
              />
              <Button size="icon" onClick={() => send()} disabled={isLoading || !input.trim()}>
                <Send className="w-4 h-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SalesAssistant;
