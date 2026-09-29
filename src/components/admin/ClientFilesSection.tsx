import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Eye, FileText, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface ClientFile { id: string; file_name: string; file_path: string; file_size: number; description: string | null; created_at: string }
export default function ClientFilesSection({ clientId }: { clientId: string }) {
  const { data: files = [], isLoading, error } = useQuery({
    queryKey: ["client-original-files", clientId],
    queryFn: async () => {
      const { data, error } = await supabase.from("client_files" as never)
        .select("id,file_name,file_path,file_size,description,created_at").eq("client_id", clientId)
        .order("created_at", { ascending: false }).limit(50);
      if (error) throw error;
      return (data || []) as ClientFile[];
    },
    enabled: !!clientId,
  });
  if (isLoading) return <Loader2 className="h-4 w-4 animate-spin" />;
  if (error) return <p className="text-sm text-destructive">Не удалось загрузить файлы клиента.</p>;
  if (!files.length) return <p className="text-sm text-muted-foreground">Прикреплённых оригиналов PDF пока нет.</p>;
  return <div className="space-y-2 pt-1">{files.map(file => <div key={file.id} className="flex items-center gap-2 rounded-md border p-3">
    <FileText className="h-4 w-4 shrink-0" />
    <div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{file.file_name}</p>
      <p className="text-xs text-muted-foreground">{new Date(file.created_at).toLocaleDateString("ru-RU")} · {Math.ceil(file.file_size / 1024)} КБ</p>
      {file.description && <p className="text-xs text-muted-foreground break-words">{file.description}</p>}
    </div>
    <Button variant="ghost" size="sm" className="shrink-0" onClick={async () => {
      const { data, error } = await supabase.storage.from("crm-client-files").createSignedUrl(file.file_path, 600);
      if (error || !data?.signedUrl) { toast.error("Не удалось открыть оригинал PDF"); return; }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    }}><Eye className="mr-1 h-4 w-4" />Открыть PDF</Button>
  </div>)}{files.length === 50 && <p className="text-xs text-muted-foreground">Показаны последние 50 файлов.</p>}</div>;
}
