import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { FIELD_LABELS } from "./nmo-steps";

interface Props {
  field: string;
  value: string | null | undefined | boolean;
  compact?: boolean;
}

export const NmoCopyField = ({ field, value, compact }: Props) => {
  const [copied, setCopied] = useState(false);
  const display =
    typeof value === "boolean"
      ? value
        ? "Да"
        : "Нет"
      : value && String(value).trim()
      ? String(value)
      : "";

  const label = FIELD_LABELS[field] || field;

  const onCopy = async () => {
    if (!display) {
      toast.error(`Поле «${label}» пустое`);
      return;
    }
    try {
      await navigator.clipboard.writeText(display);
      setCopied(true);
      toast.success(`«${label}» скопировано`);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      toast.error("Не удалось скопировать");
    }
  };

  return (
    <Button
      variant="outline"
      size={compact ? "sm" : "sm"}
      onClick={onCopy}
      disabled={!display}
      className="h-auto py-1.5 px-2 text-xs justify-start gap-1.5 font-normal"
      type="button"
    >
      {copied ? <Check className="w-3 h-3 text-green-500" /> : <Copy className="w-3 h-3" />}
      <span className="text-muted-foreground">{label}:</span>
      <span className="truncate max-w-[12rem]">{display || "—"}</span>
    </Button>
  );
};