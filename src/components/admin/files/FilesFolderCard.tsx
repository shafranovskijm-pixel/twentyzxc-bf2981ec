import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Folder, FolderOpen, FileText, Upload, Trash2, Download, Loader2, Mail } from "lucide-react";

interface ContractFile {
  id: string;
  contract_id: string;
  file_name: string;
  file_path: string;
  file_size: number | null;
  created_at: string;
}

interface Props {
  contract: { id: string; client_name: string; contract_number: string | null };
  files: ContractFile[];
  fileCount?: number;
  isOpen: boolean;
  isDragTarget: boolean;
  loadingFiles: boolean;
  selectable?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onToggle: () => void;
  onDrop: (files: FileList) => void;
  onDragOver: () => void;
  onDragLeave: () => void;
  onUpload: (files: FileList) => void;
  onDownload: (f: ContractFile) => void;
  onDelete: (f: ContractFile) => void;
  onEmail?: (f: ContractFile) => void;
}

const formatSize = (bytes: number | null) => {
  if (!bytes) return "";
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
};

const FilesFolderCard = ({ contract: c, files, fileCount, isOpen, isDragTarget, loadingFiles, onToggle, onDrop, onDragOver, onDragLeave, onUpload, onDownload, onDelete, onEmail }: Props) => {
  return (
    <Card
      className={`transition-colors ${isDragTarget ? "border-primary bg-primary/5" : ""}`}
      onDrop={(e) => { e.preventDefault(); onDragLeave(); if (e.dataTransfer.files.length) onDrop(e.dataTransfer.files); }}
      onDragOver={(e) => { e.preventDefault(); onDragOver(); }}
      onDragLeave={onDragLeave}
    >
      <CardHeader className="p-3 cursor-pointer" onClick={onToggle}>
        <div className="flex items-center gap-3">
          {isOpen ? <FolderOpen className="w-5 h-5 text-primary" /> : <Folder className="w-5 h-5 text-muted-foreground" />}
          <div className="flex-1 min-w-0">
            <CardTitle className="text-sm font-medium truncate">
              {c.client_name}
              {c.contract_number && <span className="text-muted-foreground font-normal ml-2">№{c.contract_number}</span>}
            </CardTitle>
          </div>
          <span className="text-xs text-muted-foreground">{fileCount ?? files.length} файл(ов)</span>
        </div>
      </CardHeader>

      {isOpen && (
        <CardContent className="pt-0 pb-3 px-3 space-y-2">
          {loadingFiles ? (
            <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
          ) : files.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">
              Нет файлов. Перетащите файлы сюда или нажмите «Загрузить»
            </p>
          ) : (
            <div className="space-y-1">
              {files.map((f) => (
                 <div key={f.id} className="flex items-center gap-2 px-2 py-1.5 rounded-sm hover:bg-muted/50 group">
                  <FileText className="w-4 h-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate flex-1">{f.file_name}</span>
                  <span className="text-xs text-muted-foreground hidden sm:inline">{formatSize(f.file_size)}</span>
                  {onEmail && (
                    <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 text-blue-500 hover:text-blue-600" onClick={() => onEmail(f)} title="Отправить на почту">
                      <Mail className="w-3.5 h-3.5" />
                    </Button>
                  )}
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100" onClick={() => onDownload(f)}>
                    <Download className="w-3.5 h-3.5" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 sm:opacity-0 sm:group-hover:opacity-100 text-destructive hover:text-destructive" onClick={() => onDelete(f)}>
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
                if (e.target.files?.length) onUpload(e.target.files);
                e.target.value = "";
              }}
            />
          </label>
        </CardContent>
      )}
    </Card>
  );
};

export default FilesFolderCard;
