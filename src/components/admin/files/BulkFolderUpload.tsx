import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { FolderUp, Upload, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Contract {
  id: string;
  client_name: string;
  contract_number: string | null;
}

interface MatchResult {
  folderName: string;
  contractId: string | null;
  contractLabel: string | null;
  files: File[];
}

interface Props {
  contracts: Contract[];
  uploadFiles: (contractId: string, files: File[]) => Promise<void>;
  uploading: boolean;
}

/**
 * Try to match a folder name to a contract by number or client name.
 */
function matchFolder(folderName: string, contracts: Contract[]): Contract | null {
  const name = folderName.trim().toLowerCase();

  // Try exact contract number match first
  for (const c of contracts) {
    if (c.contract_number && c.contract_number.toLowerCase() === name) return c;
  }

  // Try number inside folder name (e.g. "№243-2026" or "243-2026")
  const numMatch = name.match(/№?\s*(\S+)/);
  if (numMatch) {
    const num = numMatch[1];
    for (const c of contracts) {
      if (c.contract_number && c.contract_number.toLowerCase() === num) return c;
    }
  }

  // Try client name match (contains)
  for (const c of contracts) {
    if (c.client_name.toLowerCase().includes(name) || name.includes(c.client_name.toLowerCase())) return c;
  }

  return null;
}

const BulkFolderUpload = ({ contracts, uploadFiles, uploading }: Props) => {
  const [matches, setMatches] = useState<MatchResult[] | null>(null);
  const [bulkUploading, setBulkUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFolderSelect = (fileList: FileList) => {
    // Group files by their top-level folder
    const folders = new Map<string, File[]>();

    for (const file of Array.from(fileList)) {
      const pathParts = file.webkitRelativePath?.split("/") || [];
      if (pathParts.length < 2) continue; // skip root-level files
      const topFolder = pathParts[pathParts.length - 2] || pathParts[0];
      if (!folders.has(topFolder)) folders.set(topFolder, []);
      folders.get(topFolder)!.push(file);
    }

    // If all files are in the same root folder, use subfolder structure
    if (folders.size === 1) {
      const subfolders = new Map<string, File[]>();
      for (const file of Array.from(fileList)) {
        const pathParts = file.webkitRelativePath?.split("/") || [];
        if (pathParts.length < 3) {
          // Files in root folder directly - use root folder name
          const rootFolder = pathParts[0];
          if (!subfolders.has(rootFolder)) subfolders.set(rootFolder, []);
          subfolders.get(rootFolder)!.push(file);
        } else {
          const subFolder = pathParts[1];
          if (!subfolders.has(subFolder)) subfolders.set(subFolder, []);
          subfolders.get(subFolder)!.push(file);
        }
      }
      if (subfolders.size > 1) {
        // Remove root-only entries if subfolders exist
        const rootName = Array.from(fileList)[0]?.webkitRelativePath?.split("/")[0];
        if (rootName && subfolders.has(rootName) && subfolders.size > 1) {
          subfolders.delete(rootName);
        }
        buildMatches(subfolders);
        return;
      }
    }

    buildMatches(folders);
  };

  const buildMatches = (folders: Map<string, File[]>) => {
    const results: MatchResult[] = [];
    for (const [folderName, files] of folders) {
      const contract = matchFolder(folderName, contracts);
      results.push({
        folderName,
        contractId: contract?.id || null,
        contractLabel: contract ? `${contract.client_name}${contract.contract_number ? ` №${contract.contract_number}` : ""}` : null,
        files,
      });
    }
    setMatches(results);
  };

  const handleUploadAll = async () => {
    if (!matches) return;
    const matched = matches.filter((m) => m.contractId);
    if (matched.length === 0) {
      toast.error("Нет совпадений для загрузки");
      return;
    }

    setBulkUploading(true);
    let uploaded = 0;
    for (const m of matched) {
      await uploadFiles(m.contractId!, m.files);
      uploaded++;
    }
    toast.success(`Загружено ${uploaded} папок`);
    setBulkUploading(false);
    setMatches(null);
  };

  const matchedCount = matches?.filter((m) => m.contractId).length || 0;
  const unmatchedCount = matches ? matches.length - matchedCount : 0;

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="sm"
          onClick={() => inputRef.current?.click()}
          disabled={uploading || bulkUploading}
        >
          <FolderUp className="w-4 h-4 mr-2" />
          Загрузить папку целиком
        </Button>
        <span className="text-xs text-muted-foreground">
          Выберите папку с подпапками — система сопоставит их с договорами по имени/номеру
        </span>
        <input
          ref={inputRef}
          type="file"
          className="hidden"
          {...({ webkitdirectory: "true", directory: "true" } as any)}
          onChange={(e) => {
            if (e.target.files?.length) handleFolderSelect(e.target.files);
            e.target.value = "";
          }}
        />
      </div>

      {matches && (
        <Card>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium">
                Найдено {matches.length} папок: {matchedCount} совпало, {unmatchedCount} без совпадений
              </p>
              <Button
                size="sm"
                onClick={handleUploadAll}
                disabled={matchedCount === 0 || bulkUploading}
              >
                {bulkUploading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Загрузка...</>
                ) : (
                  <><Upload className="w-4 h-4 mr-2" /> Загрузить совпавшие ({matchedCount})</>
                )}
              </Button>
            </div>

            <div className="space-y-1.5 max-h-60 overflow-y-auto">
              {matches.map((m, i) => (
                <div key={i} className="flex items-center gap-2 text-sm px-2 py-1 rounded-sm bg-muted/30">
                  {m.contractId ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-yellow-500 shrink-0" />
                  )}
                  <span className="font-medium truncate">{m.folderName}</span>
                  <span className="text-muted-foreground">→</span>
                  <span className="truncate flex-1">
                    {m.contractLabel || <span className="text-yellow-500">не найден</span>}
                  </span>
                  <span className="text-xs text-muted-foreground shrink-0">{m.files.length} файл(ов)</span>
                </div>
              ))}
            </div>

            <Button variant="ghost" size="sm" onClick={() => setMatches(null)}>
              Отмена
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BulkFolderUpload;
