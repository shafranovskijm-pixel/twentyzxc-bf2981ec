import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, KeyRound, Lock, LogIn, Loader2, Mail } from "lucide-react";
import { toast } from "sonner";
import type { AdminSignInFailureReason } from "@/hooks/use-admin-auth";

interface AdminLoginResult {
  error: Error | null;
  reason?: AdminSignInFailureReason;
}

interface AdminLoginDialogProps {
  onLogin: (email: string, password: string) => Promise<AdminLoginResult>;
  onRequestPasswordReset?: (email: string) => Promise<{ error: Error | null }>;
  onUpdatePassword?: (password: string) => Promise<{ error: Error | null }>;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type AuthMode = "login" | "request-reset" | "new-password";

const isPasswordRecoveryUrl = () => {
  if (typeof window === "undefined") return false;
  const params = new URLSearchParams(window.location.search);
  return params.get("reset-password") === "1" || window.location.hash.includes("type=recovery");
};

const getLoginErrorDescription = (reason?: AdminSignInFailureReason) => {
  if (reason === "invalid_credentials") {
    return "Email или пароль не подошли. Проверьте данные либо восстановите доступ.";
  }
  if (reason === "not_admin") {
    return "У этой учётной записи нет доступа администратора к CRM.";
  }
  if (reason === "role_check_failed") {
    return "Сервер не смог проверить права администратора. Повторите вход через минуту.";
  }
  return "Не удалось выполнить вход. Проверьте интернет и повторите попытку.";
};

export const AdminLoginDialog = ({
  onLogin,
  onRequestPasswordReset,
  onUpdatePassword,
  open: controlledOpen,
  onOpenChange: controlledOnOpenChange,
}: AdminLoginDialogProps) => {
  const [internalOpen, setInternalOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [mode, setMode] = useState<AuthMode>(() => (isPasswordRecoveryUrl() ? "new-password" : "login"));
  const [resetSent, setResetSent] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const open = controlledOpen !== undefined ? controlledOpen : internalOpen;
  const setOpen = controlledOnOpenChange || setInternalOpen;

  useEffect(() => {
    if (isPasswordRecoveryUrl()) {
      setMode("new-password");
      setOpen(true);
    }
  }, [setOpen]);

  const handleLogin = async () => {
    const { error, reason } = await onLogin(email, password);

    if (error) {
      toast.error("Не удалось войти", {
        description: getLoginErrorDescription(reason),
      });
      return;
    }

    toast.success("CRM открыта");
    setOpen(false);
    setEmail("");
    setPassword("");
  };

  const handleResetRequest = async () => {
    if (!onRequestPasswordReset) return;
    const { error } = await onRequestPasswordReset(email);

    if (error) {
      toast.error("Не удалось отправить письмо", {
        description: "Проверьте email и повторите попытку.",
      });
      return;
    }

    setResetSent(true);
    toast.success("Письмо для восстановления отправлено");
  };

  const handleNewPassword = async () => {
    if (!onUpdatePassword) return;
    if (password.length < 8) {
      toast.error("Пароль должен содержать не менее 8 символов");
      return;
    }
    if (password !== passwordConfirm) {
      toast.error("Пароли не совпадают");
      return;
    }

    const { error } = await onUpdatePassword(password);
    if (error) {
      toast.error("Не удалось сохранить пароль", {
        description: "Ссылка могла устареть. Запросите новое письмо восстановления.",
      });
      return;
    }

    toast.success("Новый пароль сохранён");
    window.location.replace("/admin");
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setIsLoading(true);
    try {
      if (mode === "request-reset") await handleResetRequest();
      else if (mode === "new-password") await handleNewPassword();
      else await handleLogin();
    } finally {
      setIsLoading(false);
    }
  };

  const title = mode === "request-reset"
    ? "Восстановление доступа"
    : mode === "new-password"
      ? "Новый пароль"
      : "Вход в CRM";

  const description = mode === "request-reset"
    ? "Укажите email администратора — мы отправим безопасную ссылку."
    : mode === "new-password"
      ? "Придумайте новый пароль для входа в CRM."
      : "Введите email и пароль администратора.";

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {controlledOpen === undefined && (
        <DialogTrigger asChild>
          <Button variant="outline" size="sm" className="gap-2">
            <Lock className="h-4 w-4" />
            CRM
          </Button>
        </DialogTrigger>
      )}
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {mode !== "new-password" && (
            <div className="space-y-2">
              <Label htmlFor="admin-email">Email</Label>
              <Input
                id="admin-email"
                type="email"
                value={email}
                onChange={(event) => {
                  setEmail(event.target.value);
                  setResetSent(false);
                }}
                placeholder="admin@example.com"
                autoComplete="username"
                inputMode="email"
                autoFocus
                required
              />
            </div>
          )}

          {mode === "login" && (
            <div className="space-y-2">
              <Label htmlFor="admin-password">Пароль</Label>
              <Input
                id="admin-password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>
          )}

          {mode === "new-password" && (
            <>
              <div className="space-y-2">
                <Label htmlFor="new-admin-password">Новый пароль</Label>
                <Input
                  id="new-admin-password"
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="Не менее 8 символов"
                  autoComplete="new-password"
                  minLength={8}
                  autoFocus
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="new-admin-password-confirm">Повторите пароль</Label>
                <Input
                  id="new-admin-password-confirm"
                  type="password"
                  value={passwordConfirm}
                  onChange={(event) => setPasswordConfirm(event.target.value)}
                  placeholder="Повторите новый пароль"
                  autoComplete="new-password"
                  minLength={8}
                  required
                />
              </div>
            </>
          )}

          {mode === "request-reset" && resetSent && (
            <div className="rounded-md border border-border bg-secondary/50 px-4 py-3 text-sm leading-relaxed text-muted-foreground">
              Проверьте входящие и папку «Спам». Ссылка откроет форму нового пароля на этом сайте.
            </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading || (mode === "request-reset" && resetSent)}>
            {isLoading ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : mode === "request-reset" ? (
              <Mail className="mr-2 h-4 w-4" />
            ) : mode === "new-password" ? (
              <KeyRound className="mr-2 h-4 w-4" />
            ) : (
              <LogIn className="mr-2 h-4 w-4" />
            )}
            {mode === "request-reset" ? "Отправить ссылку" : mode === "new-password" ? "Сохранить пароль" : "Войти"}
          </Button>

          {mode === "login" && onRequestPasswordReset && (
            <Button
              type="button"
              variant="ghost"
              className="w-full text-muted-foreground"
              onClick={() => {
                setMode("request-reset");
                setResetSent(false);
              }}
            >
              Не помню пароль
            </Button>
          )}

          {mode === "request-reset" && (
            <Button
              type="button"
              variant="ghost"
              className="w-full gap-2 text-muted-foreground"
              onClick={() => setMode("login")}
            >
              <ArrowLeft className="h-4 w-4" />
              Вернуться ко входу
            </Button>
          )}
        </form>
      </DialogContent>
    </Dialog>
  );
};
