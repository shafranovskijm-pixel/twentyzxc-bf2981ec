import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { FileCheck, Send, Loader2, CheckSquare } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const STORAGE_BASE = "https://veedztdijmscebgadzyx.supabase.co/storage/v1/object/public/document-assets";

const FRDO_DOCUMENTS = [
  { id: "instruktsiya", label: "Инструкция", path: `${STORAGE_BASE}/frdo/instruktsiya.docx` },
  { id: "prikaz", label: "Приказ ФРДО №1", path: `${STORAGE_BASE}/frdo/Prikaz_FRDO_1.docx` },
  { id: "terms", label: "Пользовательское соглашение (Terms of Use)", path: `${STORAGE_BASE}/frdo/terms-of-use.pdf` },
  { id: "dpo-template", label: "ДПО — шаблон-образец", path: `${STORAGE_BASE}/frdo/DPO-shablon-obrazets.xlsx` },
  { id: "dpo-dated", label: "ДПО — 06.11.2023", path: `${STORAGE_BASE}/frdo/DPO-06.11.2023.xlsx` },
  { id: "po-template", label: "ПО — образец", path: `${STORAGE_BASE}/frdo/PO_obrazets.xlsx` },
  { id: "po-dated", label: "ПО — 06.11.2023", path: `${STORAGE_BASE}/frdo/PO-06.11.2023.xlsx` },
];

const FrdoTab = () => {
  const [selectedClientId, setSelectedClientId] = useState("");
  const [email, setEmail] = useState("");
  const [selectedDocs, setSelectedDocs] = useState<string[]>([]);
  const [sending, setSending] = useState(false);

  const { data: clients = [] } = useQuery({
    queryKey: ["frdo-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("id, name, email")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const handleClientChange = (clientId: string) => {
    setSelectedClientId(clientId);
    const client = clients.find((c) => c.id === clientId);
    if (client?.email) setEmail(client.email);
  };

  const toggleDoc = (docId: string) => {
    setSelectedDocs((prev) =>
      prev.includes(docId) ? prev.filter((d) => d !== docId) : [...prev, docId]
    );
  };

  const toggleAll = () => {
    if (selectedDocs.length === FRDO_DOCUMENTS.length) {
      setSelectedDocs([]);
    } else {
      setSelectedDocs(FRDO_DOCUMENTS.map((d) => d.id));
    }
  };

  const handleSend = async () => {
    if (!email.trim()) return toast.error("Укажите email получателя");
    if (selectedDocs.length === 0) return toast.error("Выберите хотя бы один документ");

    const clientName = clients.find((c) => c.id === selectedClientId)?.name || "Клиент";
    const docs = FRDO_DOCUMENTS.filter((d) => selectedDocs.includes(d.id));

    const linksHtml = docs
      .map((d) => `<li style="margin-bottom:8px;"><a href="${d.path}" style="color:#2563eb;">${d.label}</a></li>`)
      .join("");

    const html = `
      <div style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <h2 style="color:#1a1a1a;">Документы ФИС ФРДО</h2>
        <p style="color:#555;">Здравствуйте!</p>
        <p style="color:#555;">Направляем вам пакет документов ФИС ФРДО для работы:</p>
        <ul style="list-style:none;padding:0;">${linksHtml}</ul>
        <p style="color:#555;margin-top:24px;">Пожалуйста, скачайте и ознакомьтесь с документами. При возникновении вопросов свяжитесь с нами.</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;" />
        <p style="color:#999;font-size:12px;">С уважением, команда Синтагма</p>
      </div>
    `;

    setSending(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-document-email", {
        body: {
          to: email,
          subject: `Документы ФИС ФРДО — ${clientName}`,
          html,
        },
      });
      if (error) throw error;
      if (data && !data.success) throw new Error(data.error || "Ошибка отправки");
      toast.success(`Документы отправлены на ${email}`);
    } catch (err: any) {
      toast.error(err.message || "Ошибка отправки email");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileCheck className="w-5 h-5" />
            Отправка документов ФИС ФРДО
          </CardTitle>
          <CardDescription>
            Выберите клиента и документы для отправки по email
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Client selector */}
          <div className="space-y-2">
            <Label>Клиент</Label>
            <Select value={selectedClientId} onValueChange={handleClientChange}>
              <SelectTrigger>
                <SelectValue placeholder="Выберите клиента..." />
              </SelectTrigger>
              <SelectContent>
                {clients.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name} {c.email ? `(${c.email})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Email input */}
          <div className="space-y-2">
            <Label>Email получателя</Label>
            <Input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="email@example.com"
            />
          </div>

          {/* Document checklist */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Документы</Label>
              <Button variant="ghost" size="sm" onClick={toggleAll} className="gap-1.5 text-xs">
                <CheckSquare className="w-3.5 h-3.5" />
                {selectedDocs.length === FRDO_DOCUMENTS.length ? "Снять все" : "Выбрать все"}
              </Button>
            </div>
            <div className="space-y-2 border rounded-sm p-3">
              {FRDO_DOCUMENTS.map((doc) => (
                <label
                  key={doc.id}
                  className="flex items-center gap-3 py-1.5 px-2 rounded-sm hover:bg-muted/50 cursor-pointer transition-colors"
                >
                  <Checkbox
                    checked={selectedDocs.includes(doc.id)}
                    onCheckedChange={() => toggleDoc(doc.id)}
                  />
                  <span className="text-sm">{doc.label}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={sending || !email.trim() || selectedDocs.length === 0}
            className="w-full"
          >
            {sending ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <Send className="w-4 h-4 mr-2" />
            )}
            Отправить документы ({selectedDocs.length})
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default FrdoTab;
