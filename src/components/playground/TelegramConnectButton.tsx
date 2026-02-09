import { useState } from "react";
import { MessageCircle, ExternalLink, QrCode } from "lucide-react";
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

export function TelegramConnectButton() {
  const [open, setOpen] = useState(false);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <MessageCircle className="w-4 h-4" />
          <span className="hidden sm:inline">Telegram</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <MessageCircle className="w-5 h-5 text-primary" />
            Подключить Telegram
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Подпишитесь на бота <strong>@{BOT_USERNAME}</strong>, чтобы получать уведомления
            о заявках и новых проектах прямо в Telegram.
          </p>

          <div className="flex flex-col items-center gap-4 py-4">
            <img
              src={QR_API}
              alt={`QR-код для @${BOT_USERNAME}`}
              width={200}
              height={200}
              className="rounded-lg border border-border"
            />
            <p className="text-xs text-muted-foreground">Отсканируйте QR-код или нажмите кнопку ниже</p>
          </div>

          <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
            <li>Откройте бота по ссылке ниже</li>
            <li>Нажмите <strong>Start</strong> (или отправьте <code>/start</code>)</li>
            <li>Готово! Вы будете получать уведомления</li>
          </ol>

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
