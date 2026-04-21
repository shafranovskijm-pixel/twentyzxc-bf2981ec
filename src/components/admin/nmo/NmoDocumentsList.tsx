import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { FileText, Trash2, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import type { NmoDocument } from "./types";

const docTypeLabels: Record<string, string> = {
  application: "Заявление",
  obligation: "Обязательство",
  license_scan: "Скан лицензии",
  other: "Документ",
};

interface Props {
  registrationId: string;
}

export const NmoDocumentsList = ({ registrationId }: Props) => {
  const qc = useQueryClient();

  const { data: docs = [], isLoading } = useQuery({
    queryKey: ["nmo-documents", registrationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("nmo_documents")
        .select("*")
        .eq("registration_id", registrationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as NmoDocument[];
    },
  });

  const downloadDoc = async (doc: NmoDocument) => {
    const { data, error } = await supabase.storage
      .from("nmo-documents")
      .createSignedUrl(doc.file_path, 600);
    if (error || !data?.signedUrl) {
      toast.error("Не удалось получить ссылку на файл");
      return;
    }
    window.open(data.signedUrl, "_blank");
  };

  const removeDoc = useMutation({
    mutationFn: async (doc: NmoDocument) => {
      await supabase.storage.from("nmo-documents").remove([doc.file_path]);
      const { error } = await supabase.from("nmo_documents").delete().eq("id", doc.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["nmo-documents", registrationId] });
      toast.success("Документ удалён");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="w-3 h-3 animate-spin" /> Загружаем документы...
      </div>
    );
  }

  if (docs.length === 0) {
    return (
      <p className="text-xs text-muted-foreground italic">
        Документы ещё не сгенерированы. Перейдите к шагу 7.
      </p>
    );
  }

  return (
    <div className="space-y-1.5">
      {docs.map((d) => (
        <div
          key={d.id}
          className="flex items-center gap-2 p-2 border border-border/60 rounded-sm hover:border-primary/30 transition-colors"
        >
          <FileText className="w-4 h-4 text-primary shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-medium truncate">{docTypeLabels[d.doc_type] || d.doc_type}</div>
            <div className="text-[10px] text-muted-foreground truncate">{d.file_name}</div>
          </div>
          <Button size="sm" variant="ghost" onClick={() => downloadDoc(d)} className="h-7 px-2">
            <Download className="w-3.5 h-3.5" />
          </Button>
          <Button
            size="sm"
            variant="ghost"
            onClick={() => {
              if (confirm("Удалить документ?")) removeDoc.mutate(d);
            }}
            className="h-7 px-2 text-destructive hover:text-destructive"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </Button>
        </div>
      ))}
    </div>
  );
};