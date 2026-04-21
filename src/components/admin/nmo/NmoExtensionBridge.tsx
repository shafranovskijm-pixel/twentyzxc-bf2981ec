import { useState } from "react";
import { Puzzle, Download, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import type { NmoRegistrationFull } from "./types";

/**
 * Идентификатор расширения подставляется через storage / postMessage.
 * Расширение слушает window.postMessage с типом "NMO_REGISTRATION_DATA".
 */
const EXTENSION_MESSAGE_TYPE = "NMO_REGISTRATION_DATA";

interface Props {
  registration: NmoRegistrationFull;
}

export const NmoExtensionBridge = ({ registration }: Props) => {
  const [installOpen, setInstallOpen] = useState(false);
  const [downloading, setDownloading] = useState(false);

  const sendToExtension = () => {
    const payload = {
      type: EXTENSION_MESSAGE_TYPE,
      data: {
        organization_name: registration.organization_name,
        organization_abbr: registration.organization_abbr,
        inn: registration.inn,
        kpp: registration.kpp,
        ogrn: registration.ogrn,
        legal_address: registration.legal_address,
        actual_address: registration.actual_address,
        organization_phone: registration.organization_phone,
        organization_email: registration.organization_email,
        organization_website: registration.organization_website,
        region: registration.region,
        license_number: registration.license_number,
        license_date: registration.license_date,
        has_dpo_appendix: registration.has_dpo_appendix,
        responsible_name: registration.responsible_name,
        responsible_email: registration.responsible_email,
        responsible_mobile: registration.responsible_mobile,
        responsible_phone: registration.responsible_phone,
        responsible_snils: registration.responsible_snils,
        responsible_position: registration.responsible_position,
        responsible_birth_date: registration.responsible_birth_date,
        responsible_gender: registration.responsible_gender,
        responsible_login: registration.responsible_login,
      },
    };
    window.postMessage(payload, "*");
    try {
      localStorage.setItem("nmo_active_registration", JSON.stringify(payload.data));
    } catch {
      /* noop */
    }
    toast.success("Данные переданы в расширение", {
      description: "Откройте портал НМФО или org.edu и нажмите «Заполнить» в расширении.",
    });
  };

  const downloadExtension = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/nmo-extension.zip");
      if (!res.ok) throw new Error("Архив расширения не найден");
      const blob = await res.blob();
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "nmo-extension.zip";
      a.click();
      URL.revokeObjectURL(a.href);
      toast.success("Архив расширения скачан");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Не удалось скачать расширение");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <>
      <div className="flex flex-wrap gap-2">
        <Button size="sm" variant="default" onClick={sendToExtension} type="button">
          <Puzzle className="w-3.5 h-3.5 mr-1.5" />
          Передать в расширение
        </Button>
        <Button size="sm" variant="outline" onClick={() => setInstallOpen(true)} type="button">
          <Download className="w-3.5 h-3.5 mr-1.5" />
          Установить расширение
        </Button>
      </div>

      <Dialog open={installOpen} onOpenChange={setInstallOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Установка расширения «НМО Автозаполнение»</DialogTitle>
            <DialogDescription>
              Chrome / Edge / Brave — Manifest V3
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 text-sm">
            <Button onClick={downloadExtension} disabled={downloading} className="w-full">
              {downloading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
              Скачать nmo-extension.zip
            </Button>
            <ol className="list-decimal pl-5 space-y-2 text-muted-foreground">
              <li>Распакуйте скачанный архив.</li>
              <li>Откройте в браузере <code className="bg-muted px-1 rounded">chrome://extensions</code></li>
              <li>Включите «Режим разработчика» в правом верхнем углу.</li>
              <li>Нажмите «Загрузить распакованное» и выберите распакованную папку.</li>
              <li>В админке нажмите «Передать в расширение» — данные синхронизируются.</li>
              <li>Откройте портал НМФО / org.edu и кликните иконку расширения → «Заполнить».</li>
            </ol>
            <p className="text-xs text-muted-foreground border-t pt-2">
              Капчу и финальную отправку выполняйте вручную — это требование портала.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};