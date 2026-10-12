import { useState, useEffect } from "react";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Save, Loader2, Building2, Landmark, User, Search } from "lucide-react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { COMPANY_BANK_FIELDS, type CurrentBankPolicy } from "../../../supabase/functions/_shared/current-bank-requisites";

const FIELDS = [
  { section: "org", label: "Полное название", key: "company_name", placeholder: "ООО «Компания»" },
  { section: "org", label: "Краткое название", key: "company_short_name", placeholder: "ООО «Компания»" },
  { section: "org", label: "ИНН", key: "company_inn", placeholder: "1234567890" },
  { section: "org", label: "КПП", key: "company_kpp", placeholder: "123456789" },
  { section: "org", label: "ОГРН", key: "company_ogrn", placeholder: "1234567890123" },
  { section: "org", label: "Юридический адрес", key: "company_legal_address", placeholder: "г. Москва, ул. ..." },
  { section: "org", label: "Фактический адрес", key: "company_actual_address", placeholder: "г. Москва, ул. ..." },
  { section: "bank", label: "Получатель", key: "company_bank_recipient", placeholder: "ООО «Компания»" },
  { section: "bank", label: "Расчётный счёт", key: "company_bank_account", placeholder: "40702810..." },
  { section: "bank", label: "БИК", key: "company_bank_bik", placeholder: "044525..." },
  { section: "bank", label: "Корр. счёт", key: "company_bank_corr", placeholder: "30101810..." },
  { section: "bank", label: "Банк", key: "company_bank_name", placeholder: "АО «Тинькофф Банк»" },
  { section: "bank", label: "ИНН банка", key: "company_bank_inn", placeholder: "9703077050" },
  { section: "bank", label: "КПП банка", key: "company_bank_kpp", placeholder: "770301001" },
  { section: "person", label: "ФИО руководителя", key: "company_director_name", placeholder: "Иванов Иван Иванович" },
  { section: "person", label: "Должность руководителя", key: "company_director_post", placeholder: "Генеральный директор" },
  { section: "person", label: "Телефон", key: "company_phone", placeholder: "+7 (999) 123-45-67" },
  { section: "person", label: "Email", key: "company_email", placeholder: "info@company.ru" },
];

const RequisitesTab = () => {
  const { settings, isLoading, updateMultiple } = useSiteSettings();
  const [values, setValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [lookingUp, setLookingUp] = useState(false);
  const [pinning, setPinning] = useState(false);
  const queryClient = useQueryClient();
  const bankPolicy = useQuery({
    queryKey: ["company-bank-policy"],
    queryFn: async () => {
      const { data, error } = await (supabase as any).rpc("crm_get_company_bank_policy");
      if (error) throw error;
      return data as CurrentBankPolicy | null;
    },
  });
  const bankChanged = !!bankPolicy.data && COMPANY_BANK_FIELDS.some(key => values[key] !== bankPolicy.data?.[key]);

  const lookupInn = async () => {
    const inn = values.company_inn?.trim();
    if (!inn || inn.length < 10) { toast.error("Введите корректный ИНН (10 или 12 цифр)"); return; }
    setLookingUp(true);
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 15000);
      
      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/dadata-lookup`;
      const response = await fetch(url, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          "apikey": import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify({ inn }),
        signal: controller.signal,
      });
      clearTimeout(timeout);
      
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Request failed");
      if (!data?.found) { toast.error("Организация не найдена"); return; }
      setValues(prev => ({
        ...prev,
        company_name: data.name || prev.company_name,
        company_short_name: data.name_short || prev.company_short_name,
        company_kpp: data.kpp || prev.company_kpp,
        company_ogrn: data.ogrn || prev.company_ogrn,
        company_legal_address: data.address || prev.company_legal_address,
        company_director_name: data.management_name || prev.company_director_name,
        company_director_post: data.management_post || prev.company_director_post,
      }));
      toast.success("Реквизиты заполнены по ИНН");
    } catch (e: any) {
      toast.error(e?.name === "AbortError" ? "Таймаут запроса" : "Ошибка запроса DaData");
    } finally {
      setLookingUp(false);
    }
  };

  useEffect(() => {
    const v: Record<string, string> = {};
    FIELDS.forEach(f => { v[f.key] = settings[f.key] || ""; });
    setValues(v);
  }, [settings]);

  const handleSave = async () => {
    if (bankChanged) {
      toast.error("Для смены закреплённого счёта используйте кнопку «Закрепить новые банковские реквизиты».");
      return;
    }
    setSaving(true);
    try {
      const savePromise = updateMultiple.mutateAsync(
        FIELDS.map(f => ({ key: f.key, value: values[f.key] || "" }))
      );
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("timeout")), 10000)
      );
      await Promise.race([savePromise, timeoutPromise]);
      toast.success("Реквизиты сохранены");
    } catch (e: any) {
      toast.error(e?.message === "timeout" ? "Таймаут сохранения, попробуйте ещё раз" : "Ошибка сохранения");
    }
    setSaving(false);
  };

  const handlePinBank = async () => {
    const profile = {
      issuer_inn: values.company_inn?.trim(),
      ...Object.fromEntries(COMPANY_BANK_FIELDS.map(key => [key, values[key]?.trim() || ""])),
    } as Record<string, string>;
    if (!/^\d{10}(\d{2})?$/.test(profile.issuer_inn || "") || !/^\d{20}$/.test(profile.company_bank_account)
      || !/^\d{9}$/.test(profile.company_bank_bik) || !/^\d{20}$/.test(profile.company_bank_corr) || !profile.company_bank_name) {
      toast.error("Укажите полный ИНН, расчётный счёт (20 цифр), БИК (9 цифр), корреспондентский счёт (20 цифр) и банк.");
      return;
    }
    setPinning(true);
    try {
      const { error } = await (supabase as any).rpc("crm_pin_company_bank_requisites", {
        p_request_id: crypto.randomUUID(), p_expected_revision: bankPolicy.data?.revision ?? null, p_profile: profile,
      });
      if (error) throw error;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["company-bank-policy"] }),
        queryClient.invalidateQueries({ queryKey: ["site-settings"] }),
      ]);
      toast.success("Актуальные банковские реквизиты закреплены. Старый счёт больше не разрешён для отправки.");
    } catch (error: any) {
      toast.error(error?.message?.includes("CRM_COMPANY_BANK_REVISION_CONFLICT")
        ? "Реквизиты уже изменились. Обновите страницу и проверьте текущую версию."
        : "Не удалось закрепить реквизиты. Проверьте полный комплект и сохранённый ИНН исполнителя.");
    } finally { setPinning(false); }
  };

  if (isLoading) return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;

  const sections = [
    { id: "org", title: "Организация", icon: Building2, desc: "Название, ИНН, КПП, адреса" },
    { id: "bank", title: "Банковские реквизиты", icon: Landmark, desc: "Расчётный счёт, БИК, банк" },
    { id: "person", title: "Руководитель и контакты", icon: User, desc: "ФИО, должность, телефон, email" },
  ];

  return (
    <div className="space-y-6">
      {sections.map(s => {
        const Icon = s.icon;
        return (
          <Card key={s.id}>
            <CardHeader className="px-3 sm:px-6 py-4 sm:py-6">
              <CardTitle className="flex items-center gap-2 text-lg sm:text-2xl"><Icon className="w-5 h-5" />{s.title}</CardTitle>
              <CardDescription className="text-xs sm:text-sm">{s.desc}</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 px-3 sm:px-6">
              {FIELDS.filter(f => f.section === s.id).map(f => (
                <div key={f.key} className="space-y-1">
                  <Label htmlFor={f.key}>{f.label}</Label>
                  {f.key === "company_inn" ? (
                    <div className="flex gap-2">
                      <Input
                        id={f.key}
                        value={values[f.key] || ""}
                        onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                        placeholder={f.placeholder}
                      />
                      <Button variant="outline" size="sm" onClick={lookupInn} disabled={lookingUp} className="shrink-0" title="Заполнить по ИНН">
                        {lookingUp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
                      </Button>
                    </div>
                  ) : (
                    <Input
                      id={f.key}
                      value={values[f.key] || ""}
                      onChange={e => setValues(prev => ({ ...prev, [f.key]: e.target.value }))}
                      placeholder={f.placeholder}
                    />
                  )}
                </div>
              ))}
              {s.id === "bank" && <div className="sm:col-span-2 space-y-3 rounded-md border p-3 text-sm">
                {bankPolicy.isLoading ? <p>Проверяем закреплённые реквизиты…</p>
                  : bankPolicy.isError ? <p>Не удалось проверить закреплённые реквизиты. Обновите страницу перед изменением счёта.</p>
                  : bankPolicy.data ? <><p>Актуальный счёт: <strong>{bankPolicy.data.company_bank_account}</strong>. {bankPolicy.data.company_bank_name}. Версия {bankPolicy.data.revision}.</p>
                    <p className="text-muted-foreground">Новые документы используют эти реквизиты. Отправка со старым счётом блокируется; исторические документы сохраняются.</p>
                    {bankPolicy.data.retired_accounts.length > 0 && <p className="text-muted-foreground">Устаревшие счета: {bankPolicy.data.retired_accounts.join(", ")}</p>}</>
                  : <p>Закрепите подтверждённый комплект, чтобы новые документы и отправка проверяли актуальность расчётного счёта.</p>}
                <Button type="button" variant="outline" onClick={handlePinBank}
                  disabled={bankPolicy.isLoading || bankPolicy.isError || pinning || (!!bankPolicy.data && !bankChanged)}>
                  {pinning && <Loader2 className="w-4 h-4 animate-spin mr-2" />}
                  {bankPolicy.data ? "Закрепить новые банковские реквизиты" : "Закрепить актуальные банковские реквизиты"}
                </Button>
              </div>}
            </CardContent>
          </Card>
        );
      })}
      <Button onClick={handleSave} disabled={saving} className="w-full">
        {saving ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Save className="w-4 h-4 mr-2" />}
        Сохранить реквизиты
      </Button>
    </div>
  );
};

export default RequisitesTab;
