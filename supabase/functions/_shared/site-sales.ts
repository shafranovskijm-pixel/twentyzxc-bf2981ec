import { type SmtpEmail, SmtpDeliveryError } from "./crm-email/smtp.ts";

export const SITE_SALES_REPLY_TO = "shafranovskij.m+sites@gmail.com";
export function siteSalesAcknowledgement(leadId: string, email: string): SmtpEmail {
  return {
    to: email,
    replyTo: SITE_SALES_REPLY_TO,
    messageId: `site-request-${leadId}@24zxc.ru`,
    subject: `[Сайт 3000] Заявка ${leadId.slice(0, 8)} — условия и следующий шаг`,
    attachments: [],
    html: `<p>Здравствуйте! Заявка на сайт сохранена. Её номер: ${leadId}.</p>
<p>Одностраничный сайт — <b>3 000 ₽ в месяц</b>, без отдельного стартового платежа. Включены хостинг и до 30 минут небольших правок в месяц. Первый месяц оплачивается до запуска.</p>
<p>Первый вариант готовим за 3 рабочих дня после получения материалов. Собственный домен вы оформляете и оплачиваете на себя; можно использовать поддомен СИНТАГМЫ. Подписка помесячная, без минимального срока; прекращение — со следующего месяца. При прекращении сайт снимается с нашего хостинга, выкуп исходников обсуждается отдельно.</p>
<p><a href="https://24sintagma.ru/sites/#examples">Посмотреть примеры сайтов</a></p>
<p>Ответьте на это письмо: пришлите ссылку на вашу страницу или объявление и материалы, которых ещё нет в заявке. По ним обсудим структуру одной страницы. Дополнительные функции и продвижение согласуем отдельно.</p>
<p>СИНТАГМА · автоматический помощник по сайтам</p>`,
  };
}

export type SiteSalesState = { state: "sending" | "accepted" | "failed" | "unknown"; messageId: string; updatedAt: string; receipt?: string; code?: string };
export interface SiteSalesDependencies {
  claim(state: SiteSalesState): Promise<boolean>;
  finish(state: SiteSalesState): Promise<void>;
  send(mail: SmtpEmail): Promise<{ receipt: string }>;
}
// Persist the claim BEFORE SMTP. A timeout or an unrecorded acceptance is never retried.
export async function acknowledgeSiteLead(leadId: string, email: string, deps: SiteSalesDependencies): Promise<string> {
  const mail = siteSalesAcknowledgement(leadId, email);
  const state = (value: SiteSalesState["state"]): SiteSalesState => ({ state: value, messageId: mail.messageId, updatedAt: new Date().toISOString() });
  if (!await deps.claim(state("sending"))) return "not_claimed";
  let receipt: string;
  try {
    receipt = (await deps.send(mail)).receipt;
  } catch (error) {
    const outcome = error instanceof SmtpDeliveryError ? error.outcome : "unknown";
    await deps.finish({ ...state(outcome), code: error instanceof SmtpDeliveryError ? error.code : "SMTP_OUTCOME_UNKNOWN" });
    return outcome;
  }
  try {
    await deps.finish({ ...state("accepted"), receipt });
    return "accepted";
  } catch {
    // The persisted sending claim remains visible for manual reconciliation.
    return "unknown";
  }
}
