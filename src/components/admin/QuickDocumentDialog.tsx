import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import DocumentsTab from "./DocumentsTab";

type DocType = "contract" | "invoice" | "act";

const LABELS: Record<DocType, string> = {
  contract: "Договор",
  invoice: "Счёт",
  act: "Акт",
};

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  clientName: string;
  docType: DocType;
}

const QuickDocumentDialog = ({ open, onOpenChange, clientName, docType }: Props) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[95vw] w-[95vw] h-[92vh] p-0 overflow-hidden flex flex-col">
        <DialogHeader className="px-6 pt-5 pb-3 border-b shrink-0">
          <DialogTitle>{LABELS[docType]} — {clientName || "новый документ"}</DialogTitle>
        </DialogHeader>
        <div className="flex-1 overflow-auto px-6 py-4">
          {open && (
            <DocumentsTab
              key={`${clientName}-${docType}`}
              initialClientName={clientName}
              initialDocType={docType}
            />
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default QuickDocumentDialog;