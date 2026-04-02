import { useState, useCallback } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2, Search, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import FilesFolderCard from "./files/FilesFolderCard";
import BulkFolderUpload from "./files/BulkFolderUpload";

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
  const [emailFile, setEmailFile] = useState<ContractFile | null>(null);
  const [emailTo, setEmailTo] = useState("");
  const [emailCc, setEmailCc] = useState("24@24zxc.ru");
  const [emailSending, setEmailSending] = useState(false);
  const [selectMode, setSelectMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const { data: contracts = [], isLoading: loadingContracts, error: contractsError } = useQuery({
    queryKey: ["files-contracts"],
    queryFn: async () => {
      console.log("[FilesTab] Starting contracts query...");
      const timeoutPromise = new Promise<never>((_, reject) => 
        setTimeout(() => reject(new Error("Query timeout after 10s")), 10000)
      );
      const queryPromise = supabase
        .from("contracts")
        .select("id, client_name, contract_number")
        .eq("is_archived", false)
        .order("created_at", { ascending: false });
      
      const { data, error } = await Promise.race([queryPromise, timeoutPromise]);
      console.log("[FilesTab] Contracts query result:", { data: data?.length, error });
      if (error) {
        console.error("Files contracts query error:", error);
        throw error;
      }
      return data as ContractFolder[];
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  // Load files only for the opened folder
  const { data: folderFiles = [], isLoading: loadingFiles } = useQuery({
    queryKey: ["contract-files", openFolder],
    queryFn: async () => {
      if (!openFolder) return [];
      const { data, error } = await supabase
        .from("contract_files")
        .select("*")
        .eq("contract_id", openFolder)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContractFile[];
    },
    enabled: !!openFolder,
    staleTime: 2 * 60 * 1000,
  });

  // Load file counts per contract for badges - only contract_id column
  const { data: fileCounts = {} } = useQuery({
    queryKey: ["contract-file-counts"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("contract_files")
        .select("contract_id");
      if (error) {
        console.error("File counts query error:", error);
        return {};
      }
      const counts: Record<string, number> = {};
      data.forEach((f: { contract_id: string }) => {
        counts[f.contract_id] = (counts[f.contract_id] || 0) + 1;
      });
      return counts;
    },
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

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
      queryClient.invalidateQueries({ queryKey: ["contract-files", contractId] });
      queryClient.invalidateQueries({ queryKey: ["contract-file-counts"] });
      toast.success("Файлы загружены");
    } catch {
      toast.error("Ошибка загрузки");
    }
    setUploading(false);
  }, [queryClient]);

  const deleteFile = async (f: ContractFile) => {
    await supabase.storage.from("contracts").remove([f.file_path]);
    const { error } = await supabase.from("contract_files").delete().eq("id", f.id);
    if (error) { toast.error("Ошибка удаления"); return; }
    queryClient.invalidateQueries({ queryKey: ["contract-files", f.contract_id] });
    queryClient.invalidateQueries({ queryKey: ["contract-file-counts"] });
    toast.success("Файл удалён");
  };

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

  const sendFileEmail = async () => {
    if (!emailFile || !emailTo.trim()) return toast.error("Укажите email");
    setEmailSending(true);
    try {
      const { data: signedData, error: signedError } = await supabase.storage
        .from("contracts")
        .createSignedUrl(emailFile.file_path, 60 * 60 * 24 * 7);
      if (signedError || !signedData?.signedUrl) throw new Error("Не удалось создать ссылку");

      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <p>Добрый день!</p>
          <p>Направляем Вам документ: <strong>${emailFile.file_name}</strong>.</p>
          <p style="margin: 24px 0;">
            <a href="${signedData.signedUrl}" style="display: inline-block; padding: 12px 24px; background: #2563eb; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500;">📎 Скачать</a>
          </p>
          <p style="color: #6b7280; font-size: 13px;">Ссылка действительна 7 дней.</p>
        </div>
      `;

      const recipients = [emailTo.trim(), ...(emailCc.trim() ? [emailCc.trim()] : [])].filter(Boolean);
      const { error } = await supabase.functions.invoke("send-document-email", {
        body: { to: recipients.join(","), subject: emailFile.file_name, html: emailHtml },
      });
      if (error) throw error;

      toast.success("Письмо отправлено");
      setEmailFile(null);
      setEmailTo("");
    } catch (e: any) {
      toast.error(`Ошибка: ${e.message || "не удалось отправить"}`);
    }
    setEmailSending(false);
  };

  const handleEmailFile = (f: ContractFile) => {
    // Try to find client email from contract
    const contract = contracts.find(c => c.id === f.contract_id);
    setEmailFile(f);
    setEmailTo("");
  };

  const filtered = contracts.filter((c) => {
    if (!search.trim()) return true;
    const s = search.toLowerCase();
    return c.client_name.toLowerCase().includes(s) || c.contract_number?.toLowerCase().includes(s);
  });

  if (contractsError) {
    return (
      <div className="text-center py-8 space-y-2">
        <p className="text-sm text-destructive">Ошибка загрузки: {contractsError.message}</p>
        <button onClick={() => queryClient.invalidateQueries({ queryKey: ["files-contracts"] })} className="text-sm text-primary underline">Повторить</button>
      </div>
    );
  }

  if (loadingContracts) {
    return <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>;
  }

  return (
    <div className="space-y-4">
      <BulkFolderUpload contracts={contracts} uploadFiles={uploadFiles} uploading={uploading} />

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
          filtered.map((c) => (
            <FilesFolderCard
              key={c.id}
              contract={c}
              files={openFolder === c.id ? folderFiles : []}
              fileCount={fileCounts[c.id] || 0}
              isOpen={openFolder === c.id}
              isDragTarget={dragOver === c.id}
              loadingFiles={openFolder === c.id && loadingFiles}
              onToggle={() => setOpenFolder(openFolder === c.id ? null : c.id)}
              onDrop={(files) => uploadFiles(c.id, files)}
              onDragOver={() => setDragOver(c.id)}
              onDragLeave={() => setDragOver(null)}
              onUpload={(files) => uploadFiles(c.id, files)}
              onDownload={downloadFile}
              onDelete={deleteFile}
              onEmail={handleEmailFile}
            />
          ))
        )}
      </div>

      {/* Email dialog */}
      <Dialog open={!!emailFile} onOpenChange={(open) => { if (!open) setEmailFile(null); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Отправить на почту</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground truncate">{emailFile?.file_name}</p>
            <div className="space-y-1.5">
              <Label>Email получателя</Label>
              <Input value={emailTo} onChange={(e) => setEmailTo(e.target.value)} placeholder="client@example.com" />
            </div>
            <div className="space-y-1.5">
              <Label>Копия (CC)</Label>
              <Input value={emailCc} onChange={(e) => setEmailCc(e.target.value)} />
            </div>
            <Button onClick={sendFileEmail} disabled={emailSending || !emailTo.trim()} className="w-full">
              {emailSending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
              Отправить
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default FilesTab;
