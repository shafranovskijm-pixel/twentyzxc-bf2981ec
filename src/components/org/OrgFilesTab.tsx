import { useState, useRef } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Loader2, Trash2, Download, FileIcon } from "lucide-react";
import { toast } from "sonner";

const OrgFilesTab = ({ organizationId }: { organizationId: string }) => {
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const { data: files = [], isLoading } = useQuery({
    queryKey: ["org-files", organizationId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("org_files" as any)
        .select("*")
        .eq("organization_id", organizationId)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: !!organizationId,
  });

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const path = `${organizationId}/${Date.now()}_${safeName}`;
      const { error: uploadError } = await supabase.storage.from("org-files").upload(path, file);
      if (uploadError) throw uploadError;

      const { error: dbError } = await supabase.from("org_files" as any).insert({
        organization_id: organizationId,
        file_name: file.name,
        file_path: path,
        file_size: file.size,
      } as any);
      if (dbError) throw dbError;

      toast.success("Файл загружен");
      queryClient.invalidateQueries({ queryKey: ["org-files", organizationId] });
    } catch { toast.error("Ошибка загрузки"); }
    setUploading(false);
    if (inputRef.current) inputRef.current.value = "";
  };

  const downloadFile = async (filePath: string, fileName: string) => {
    const { data, error } = await supabase.storage.from("org-files").download(filePath);
    if (error) { toast.error("Ошибка скачивания"); return; }
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    URL.revokeObjectURL(url);
  };

  const deleteFile = async (id: string, filePath: string) => {
    await supabase.storage.from("org-files").remove([filePath]);
    const { error } = await supabase.from("org_files" as any).delete().eq("id", id);
    if (error) { toast.error("Ошибка удаления"); return; }
    toast.success("Файл удалён");
    queryClient.invalidateQueries({ queryKey: ["org-files", organizationId] });
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} Б`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
    return `${(bytes / 1024 / 1024).toFixed(1)} МБ`;
  };

  return (
    <div className="space-y-6 pb-20">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Файлы</h2>
        <Button size="sm" className="gap-1.5" onClick={() => inputRef.current?.click()} disabled={uploading}>
          {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}Загрузить
        </Button>
        <input ref={inputRef} type="file" className="hidden" onChange={handleUpload} />
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : files.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">Нет файлов</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Файл</TableHead>
                  <TableHead>Размер</TableHead>
                  <TableHead>Дата</TableHead>
                  <TableHead className="text-right sticky right-0 bg-card">⋮</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {files.map((f: any) => (
                  <TableRow key={f.id}>
                    <TableCell className="flex items-center gap-2"><FileIcon className="h-4 w-4 text-muted-foreground" />{f.file_name}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{f.file_size ? formatSize(f.file_size) : "—"}</TableCell>
                    <TableCell className="text-sm text-muted-foreground">{new Date(f.created_at).toLocaleDateString("ru-RU")}</TableCell>
                    <TableCell className="text-right sticky right-0 bg-card space-x-1">
                      <Button variant="ghost" size="icon" onClick={() => downloadFile(f.file_path, f.file_name)}><Download className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteFile(f.id, f.file_path)} className="text-destructive"><Trash2 className="h-4 w-4" /></Button>
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

export default OrgFilesTab;
