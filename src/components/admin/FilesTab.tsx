import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { Folder, FolderOpen, FileText, Upload, Trash2, Download, Loader2, Search } from "lucide-react";

interface ContractFolder {
  id: string;
  client_name: string;
  contract_number: string | null;
}

interface ContractFile {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

const FilesTab = () => {
  const queryClient = useQueryClient();
  const [openFolder, setOpenFolder] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");

  const { data: contracts = [], isLoading: loadingContracts } = useQuery({
    queryKey: ["files-contracts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contracts")
        .select("id, client_name, contract_number")
        .order("contract_number", { ascending: false });
      if (error) throw error;
      return data as ContractFolder[];
    },
  });

  const { data: files = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["contract-files"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_files")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContractFile[];
    },
  });

  const filesByContract = files.reduce<Record<string, ContractFile[]>>((acc, f) => {
    if (!acc[f.contract_id]) acc[f.contract_id] = [];
    acc[f.contract_id].push(f);
    return acc;
  }, {});

  const uploadFiles = useCallback(async (contractId: string, fileList: FileList | File[]) => {
    setUploading(true);
    try {
      for (const file of Array.from(fileList)) {
        const ext = file.name.split(".").pop();
        const path = `${contractId}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error: uploadErr } = await supabase.storage.from("contracts").upload(path, file);
        if (uploadErr) { toast.error(`Ошибка загрузки ${file.name}`); continue; }
        const { error: dbErr } = await supabase.from("contract_files").insert({
          contract_id: contractId,
          file_name: file.name,
          file_path: path,
          file_size: file.size,
        });
        if (dbErr) toast.error(`Ошибка сохранения ${file.name}`);
      }
      queryClient.invalidateQueries({ queryKey: ["contract-files"] });
      toast.success("Файлы загружены");
    } catch {
      toast.error("Ошибка загрузки");
    }
    setUploading(false);
  }, [queryClient]);

  const deleteFile = useMutation({
    mutationFn: async (f: ContractFile) => {
      await supabase.storage.from("contracts").remove([f.file_path]);
      const { error } = await supabase.from("contract_files").delete().eq("id", f.id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["contract-files"] });
      toast.success("Файл удалён");
    },
  });

  const downloadFile = async (f: ContractFile) => {
    const { data, error } = await supabase.storage.from("contracts").download(f.file_path);
    if (error || !data) return toast.error("Ошибка скачивания");
    const url = URL.createObjectURL(data);
    const a = document.createElement("a");
    a.href = url;
    a.download = f.file_name;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleDrop = (contractId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(null);
    if (e.dataTransfer.files.length) uploadFiles(contractId, e.dataTransfer.files);
  };

  const handleDragOver = (contractId: string) => (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(contractId);
  };

  const formatSize = (bytes: number | null) => {
    if (!bytes) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / (1024 * 1024)).toFixed(1) + " MB";
  };

  const filtered = contracts.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.client_name.toLowerCase().includes(s) || c.contract_number?.toLowerCase().includes(s);
  });

  if (loadingContracts) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <Search className="w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Поиск по организации или номеру..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1"
        />
      </div>

      {uploading && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="w-4 h-4 animate-spin" />
          Загрузка файлов...
        </div>
      )}

      <div className="grid gap-2">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">
            {search ? "Ничего не найдено" : "Нет договоров"}
          </p>
        ) : (
          filtered.map((c) => {
            const isOpen = openFolder === c.id;
            const contractFiles = filesByContract[c.id] || [];
            const isDragTarget = dragOver === c.id;

            return (
              <Card
                key={c.id}
                className={`transition-colors ${isDragTarget ? "border-primary bg-primary/5" : ""}`}
                onDrop={handleDrop(c.id)}
                onDragOver={handleDragOver(c.id)}
                onDragLeave={() => setDragOver(null)}
              >
                <CardHeader className="p-3 cursor-pointer" onClick={() => setOpenFolder(isOpen ? null : c.id)}>
                  <div className="flex items-center gap-3">
                    {isOpen ? <FolderOpen className="w-5 h-5 text-primary" /> : <Folder className="w-5 h-5 text-muted-foreground" />}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-sm font-medium truncate">
                        {c.client_name}
                        {c.contract_number && <span className="text-muted-foreground font-normal ml-2">№{c.contract_number}</span>}
                      </CardTitle>
                    </div>
                    <span className="text-xs text-muted-foreground">{contractFiles.length} файл(ов)</span>
                  </div>
                </CardHeader>

                {isOpen && (
                  <CardContent className="pt-0 pb-3 px-3 space-y-2">
                    {loadingFiles ? (
                      <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
                    ) : contractFiles.length === 0 ? (
                      <p className="text-xs text-muted-foreground py-2">
                        Нет файлов. Перетащите файлы сюда или нажмите «Загрузить»
                      </p>
                    ) : (
                      <div className="space-y-1">
                        {contractFiles.map((f) => (
                          <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 group">
                            <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                            <span className="text-sm truncate flex-1">{f.file_name}</span>
                            <span className="text-xs text-muted-foreground">{formatSize(f.file_size)}</span>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100" onClick={() => downloadFile(f)}>
                              <Download className="w-3.5 h-3.5" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 opacity-0 group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => deleteFile.mutate(f)}>
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    <label className="flex items-center gap-2 cursor-pointer text-xs text-primary hover:underline mt-1">
                      <Upload className="w-3.5 h-3.5" />
                      Загрузить файлы
                      <input
                        type="file"
                        multiple
                        className="hidden"
                        onChange={(e) => {
                          if (e.target.files?.length) uploadFiles(c.id, e.target.files);
                          e.target.value = "";
                        }}
                      />
                    </label>
                  </CardContent>
                )}
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
};

export default FilesTab;
