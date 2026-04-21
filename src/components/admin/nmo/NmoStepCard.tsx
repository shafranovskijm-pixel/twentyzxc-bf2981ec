import { useState } from "react";
import {
  CheckCircle2,
  Circle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  Loader2,
  Upload,
  Mail,
  PlayCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { NmoCopyField } from "./NmoCopyField";
import { NmoExtensionBridge } from "./NmoExtensionBridge";
import type { NmoStepDef } from "./nmo-steps";
import type { NmoRegistrationFull } from "./types";

interface Props {
  step: NmoStepDef;
  registration: NmoRegistrationFull;
  done: boolean;
  active: boolean;
  onToggle: (done: boolean) => void;
  onGenerateDocs?: () => void;
  onUpdateField?: (patch: Partial<NmoRegistrationFull>) => void;
  generating?: boolean;
}

export const NmoStepCard = ({
  step,
  registration,
  done,
  active,
  onToggle,
  onGenerateDocs,
  onUpdateField,
  generating,
}: Props) => {
  const [open, setOpen] = useState(active);

  const renderAction = () => {
    switch (step.actionType) {
      case "open-link":
        return step.link ? (
          <a href={step.link.url} target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="default" type="button">
              <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
              {step.link.label}
            </Button>
          </a>
        ) : null;

      case "extension":
        return (
          <div className="space-y-3">
            {step.link && (
              <a href={step.link.url} target="_blank" rel="noopener noreferrer">
                <Button size="sm" variant="default" type="button">
                  <ExternalLink className="w-3.5 h-3.5 mr-1.5" />
                  {step.link.label}
                </Button>
              </a>
            )}
            <NmoExtensionBridge registration={registration} />
          </div>
        );

      case "copy":
        return null;

      case "generate-docs":
        return (
          <Button size="sm" onClick={onGenerateDocs} disabled={generating} type="button">
            {generating ? (
              <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
            ) : (
              <FileText className="w-3.5 h-3.5 mr-1.5" />
            )}
            Сгенерировать Заявление + Обязательство
          </Button>
        );

      case "upload-docs":
        return (
          <a href="https://org.edu.rosminzdrav.ru" target="_blank" rel="noopener noreferrer">
            <Button size="sm" variant="default" type="button">
              <Upload className="w-3.5 h-3.5 mr-1.5" />
              Открыть портал для загрузки
            </Button>
          </a>
        );

      case "mail-tracking":
        return (
          <div className="grid sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs flex items-center gap-1">
                <Mail className="w-3 h-3" /> Трек-номер Почты России
              </Label>
              <Input
                value={registration.mail_track_number || ""}
                onChange={(e) => onUpdateField?.({ mail_track_number: e.target.value })}
                placeholder="14 цифр"
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Дата отправки</Label>
              <Input
                type="date"
                value={registration.mail_sent_date || ""}
                onChange={(e) => onUpdateField?.({ mail_sent_date: e.target.value })}
              />
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div
      className={cn(
        "border rounded-md transition-colors",
        done
          ? "border-green-500/30 bg-green-500/5"
          : active
          ? "border-primary/40 bg-primary/5"
          : "border-border/60",
      )}
    >
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-t-md"
      >
        <div className="shrink-0">
          {done ? (
            <CheckCircle2 className="w-5 h-5 text-green-500" />
          ) : active ? (
            <PlayCircle className="w-5 h-5 text-primary" />
          ) : (
            <Circle className="w-5 h-5 text-muted-foreground/40" />
          )}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground font-mono">{step.number}.</span>
            <span className={cn("text-sm font-medium truncate", done && "line-through text-muted-foreground")}>
              {step.title}
            </span>
          </div>
        </div>
        {open ? (
          <ChevronDown className="w-4 h-4 text-muted-foreground" />
        ) : (
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        )}
      </button>

      {open && (
        <div className="px-3 pb-3 pt-1 space-y-3 border-t border-border/50">
          <p className="text-xs text-muted-foreground leading-relaxed">{step.instruction}</p>

          {step.copyFields && step.copyFields.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {step.copyFields.map((f) => (
                <NmoCopyField
                  key={f}
                  field={f}
                  value={(registration as unknown as Record<string, string | null | boolean>)[f] ?? ""}
                />
              ))}
            </div>
          )}

          <div>{renderAction()}</div>

          <label className="flex items-center gap-2 cursor-pointer pt-1 border-t border-border/30">
            <Checkbox
              checked={done}
              onCheckedChange={(v) => onToggle(!!v)}
              className="mt-2"
            />
            <span className="text-xs text-muted-foreground pt-1.5">Шаг выполнен</span>
          </label>
        </div>
      )}
    </div>
  );
};