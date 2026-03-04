import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Save, Loader2, Trash2, Pencil, X } from "lucide-react";

interface Client {
  id: string;
  name: string;
  contact_person: string | null;
  phone: string | null;
  email: string | null;
  telegram: string | null;
  notes: string | null;
  created_at: string;
}

const ClientsTab = () => {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [telegram, setTelegram] = useState("");
  const [notes, setNotes] = useState("");
  const [search, setSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: clients = [], isLoading } = useQuery({
    queryKey: ["admin-clients"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("clients")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Client[];
    },
  });

  const resetForm = () => {
    setName(""); setContactPerson(""); setPhone(""); setEmail(""); setTelegram(""); setNotes("");
    setEditingId(null); setShowForm(false);
  };

  const startEdit = (c: Client) => {
    setEditingId(c.id); setName(c.name); setContactPerson(c.contact_person || "");
    setPhone(c.phone || ""); setEmail(c.email || ""); setTelegram(c.telegram || "");
    setNotes(c.notes || ""); setShowForm(true);
  };

  const saveClient = async () => {
    if (!name.trim()) return toast.error("Укажите название организации");
    setSaving(true);
    try {
      const payload = {
        name: name.trim(),
        contact_person: contactPerson.trim() || null,
        phone: phone.trim() || null,
        email: email.trim() || null,
        telegram: telegram.trim() || null,
        notes: notes.trim() || null,
      };
      if (editingId) {
        const { error } = await supabase.from("clients").update(payload).eq("id", editingId);
        if (error) throw error;
        toast.success("Клиент обновлён");
      } else {
        const { error } = await supabase.from("clients").insert(payload);
        if (error) throw error;
        toast.success("Клиент добавлен");
      }
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      resetForm();
    } catch {
      toast.error("Ошибка сохранения");
    }
    setSaving(false);
  };

  const deleteClient = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("clients").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-clients"] });
      toast.success("Клиент удалён");
    },
    onError: () => toast.error("Ошибка удаления"),
  });

  const filtered = clients.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.name.toLowerCase().includes(s) || 
      c.contact_person?.toLowerCase().includes(s) ||
      c.phone?.toLowerCase().includes(s) ||
      c.email?.toLowerCase().includes(s);
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Input placeholder="Поиск клиентов..." value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1" />
        <Button onClick={() => { resetForm(); setShowForm(true); }}>
          <Plus className="w-4 h-4 mr-2" />Добавить
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">{editingId ? "Редактировать клиента" : "Новый клиент"}</CardTitle>
              <Button variant="ghost" size="icon" onClick={resetForm}><X className="w-4 h-4" /></Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Название организации *</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="ООО Ромашка" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Контактное лицо</Label><Input value={contactPerson} onChange={(e) => setContactPerson(e.target.value)} placeholder="Иванов И.И." /></div>
              <div className="space-y-2"><Label>Телефон</Label><Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+7 999 123-45-67" /></div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2"><Label>Email</Label><Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="info@company.ru" /></div>
              <div className="space-y-2"><Label>Telegram</Label><Input value={telegram} onChange={(e) => setTelegram(e.target.value)} placeholder="@username" /></div>
            </div>
            <div className="space-y-2">
              <Label>Заметки</Label>
              <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Доп. информация..." rows={2} />
            </div>
            <Button onClick={saveClient} disabled={saving} className="w-full">
              {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
              {editingId ? "Обновить" : "Добавить"}
            </Button>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              {search ? "Ничего не найдено" : "Нет клиентов"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Организация</TableHead>
                  <TableHead>Контактное лицо</TableHead>
                  <TableHead>Телефон</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead className="w-[100px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filtered.map((c) => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell>{c.contact_person || "—"}</TableCell>
                    <TableCell>{c.phone || "—"}</TableCell>
                    <TableCell>{c.email || "—"}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" onClick={() => startEdit(c)}><Pencil className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="icon" onClick={() => deleteClient.mutate(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ClientsTab;
