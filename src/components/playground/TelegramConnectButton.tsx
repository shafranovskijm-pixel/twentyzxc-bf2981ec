import { useState } from "react";
import { MessageCircle, ExternalLink, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

const BOT_USERNAME = "zxc_ru_bot";
const BOT_LINK = `https://t.me/${BOT_USERNAME}`;
const QR_API = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(BOT_LINK)}`;

interface TelegramConnectButtonProps {
  slug?: string;
}

export function TelegramConnectButton({ slug }: TelegramConnectButtonProps) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const linkCommand = `/link ${slug || "ваш-slug"}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(linkCommand);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Заявки в Telegram</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Получать заявки в Telegram
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Добавьте блок <strong>«Форма заявки»</strong> на сайт и привяжите Telegram — заявки с <em>вашего</em> сайта будут приходить прямо вам.
          </p>

          <div className="flex flex-col items-center gap-3 py-3">
            <img
              src={QR_API}
              alt={`QR-код для @${BOT_USERNAME}`}
              width={160}
              height={160}
              className="rounded-lg border border-border"
            />
          </div>

          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>
              Откройте бота{" "}
              <a href={BOT_LINK} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                @{BOT_USERNAME}
              </a>{" "}
              и нажмите <strong>/start</strong>
            </li>
            <li>
              Отправьте боту команду привязки:
              <div className="mt-1.5 flex items-center gap-2">
                <code className="bg-secondary px-2 py-1 rounded text-xs flex-1 break-all">
                  {linkCommand}
                </code>
                <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={handleCopy}>
                  {copied ? <Check className="w-3.5 h-3.5 text-green-500" /> : <Copy className="w-3.5 h-3.5" />}
                </Button>
              </div>
            </li>
            <li>Готово! Заявки с формы на вашем сайте будут приходить вам</li>
          </ol>

          {!slug && (
            <p className="text-xs text-amber-500/80">
              ⚠ Сначала сохраните проект, чтобы получить slug для команды привязки.
            </p>
          )}

          <Button asChild className="w-full gap-2" variant="hero">
            <a href={BOT_LINK} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="w-4 h-4" />
              Открыть @{BOT_USERNAME}
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
