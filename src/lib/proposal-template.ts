export interface ProposalRenderItem {
  title: string;
  description?: string | null;
  price: number;
  qty: number;
}

export interface ProposalRenderData {
  number?: string | null;
  date: string; // formatted
  clientName?: string | null;
  clientOrg?: string | null;
  clientEmail?: string | null;
  clientPhone?: string | null;
  introText?: string | null;
  footerText?: string | null;
  items: ProposalRenderItem[];
  discountPercent: number;
  validUntil?: string | null;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  contactSite?: string;
}

function money(n: number): string {
  return new Intl.NumberFormat("ru-RU", { maximumFractionDigits: 0 }).format(Math.round(n));
}

function escapeHtml(s: string | null | undefined): string {
  if (!s) return "";
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

export function calcProposalTotals(items: ProposalRenderItem[], discountPercent: number) {
  const subtotal = items.reduce((s, i) => s + (Number(i.price) || 0) * (Number(i.qty) || 0), 0);
  const discount = subtotal * (Number(discountPercent) || 0) / 100;
  const total = subtotal - discount;
  return { subtotal, discount, total };
}

export function renderProposalHtml(data: ProposalRenderData): string {
  const { subtotal, discount, total } = calcProposalTotals(data.items, data.discountPercent);
  const itemsRows = data.items
    .map((it, idx) => `
      <tr>
        <td class="num">${idx + 1}</td>
        <td class="name">
          <div class="t">${escapeHtml(it.title)}</div>
          ${it.description ? `<div class="d">${escapeHtml(it.description)}</div>` : ""}
        </td>
        <td class="qty">${it.qty}</td>
        <td class="price">${money(it.price)} ₽</td>
        <td class="sum">${money(it.price * it.qty)} ₽</td>
      </tr>`)
    .join("");

  const contactName = data.contactName || "Шафрановский Максим";
  const contactPhone = data.contactPhone || "+7 (914) 721-34-24";
  const contactEmail = data.contactEmail || "24@24zxc.ru";
  const contactSite = data.contactSite || "24zxc.ru";

  return `<!doctype html>
<html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=794">
<style>
  *{box-sizing:border-box;margin:0;padding:0}
  html,body{background:#ffffff;color:#15171e;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;-webkit-font-smoothing:antialiased}
  .page{width:794px;padding:56px 64px 56px;background:#fff;position:relative;overflow:hidden;display:flex;flex-direction:column}
  main{flex:1}
  .corner{position:absolute;width:80px;height:80px;border-color:#d4be37;border-style:solid;border-width:0}
  .corner.tl{top:24px;left:24px;border-top-width:2px;border-left-width:2px}
  .corner.tr{top:24px;right:24px;border-top-width:2px;border-right-width:2px}
  .corner.bl{bottom:16px;left:24px;border-bottom-width:2px;border-left-width:2px;width:64px;height:64px}
  .corner.br{bottom:16px;right:24px;border-bottom-width:2px;border-right-width:2px;width:64px;height:64px}
  .watermark{position:absolute;bottom:120px;right:60px;font-size:220px;font-weight:900;color:#d4be37;opacity:.05;letter-spacing:-12px;line-height:1;pointer-events:none}
  header{display:flex;justify-content:space-between;align-items:flex-start;padding-bottom:18px;border-bottom:1px solid #e7e3d3}
  .brand{display:flex;flex-direction:column;gap:4px}
  .brand .logo{font-size:28px;font-weight:900;letter-spacing:2px;color:#15171e}
  .brand .logo span{color:#d4be37}
  .brand .tag{font-size:11px;color:#8a8a93;text-transform:uppercase;letter-spacing:2px}
  .meta{text-align:right;font-size:12px;color:#5a5a63;line-height:1.6}
  .meta b{color:#15171e;font-weight:600}
  .title-block{margin:42px 0 28px}
  .kicker{font-size:11px;letter-spacing:4px;color:#d4be37;text-transform:uppercase;margin-bottom:10px;font-weight:600}
  h1{font-size:38px;font-weight:300;letter-spacing:-.5px;line-height:1.1;color:#15171e}
  h1::after{content:"";display:block;width:60px;height:3px;background:#d4be37;margin-top:14px;border-radius:2px}
  .to{display:flex;gap:32px;margin:28px 0 24px;padding:18px 22px;background:#faf8ef;border-left:3px solid #d4be37;border-radius:4px}
  .to .lbl{font-size:10px;letter-spacing:2px;color:#8a8a93;text-transform:uppercase;margin-bottom:6px}
  .to .val{font-size:14px;color:#15171e;font-weight:500;line-height:1.5}
  .to .col{flex:1;min-width:0}
  .intro{margin:18px 0 28px;font-size:14px;line-height:1.7;color:#3a3a43;white-space:pre-wrap}
  table.items{width:100%;border-collapse:collapse;margin-top:18px;font-size:13px}
  table.items thead th{background:#15171e;color:#f5f5f0;font-weight:500;font-size:11px;letter-spacing:1.5px;text-transform:uppercase;padding:14px 12px;text-align:left}
  table.items thead th.qty,table.items thead th.price,table.items thead th.sum,table.items thead th.num{text-align:right}
  table.items thead th.num{text-align:center;width:36px}
  table.items thead th.name{text-align:left}
  table.items tbody tr{border-bottom:1px solid #ede9d8}
  table.items tbody td{padding:14px 12px;vertical-align:top}
  table.items td.num{text-align:center;color:#a0a0a8;font-weight:600}
  table.items td.name .t{font-weight:600;color:#15171e;margin-bottom:4px}
  table.items td.name .d{font-size:12px;color:#6a6a73;line-height:1.5}
  table.items td.qty,table.items td.price,table.items td.sum{text-align:right;white-space:nowrap;font-variant-numeric:tabular-nums}
  table.items td.sum{font-weight:600;color:#15171e}
  .totals{margin-top:18px;display:flex;justify-content:flex-end}
  .totals .box{min-width:300px;font-size:13px}
  .totals .row{display:flex;justify-content:space-between;padding:8px 14px;color:#5a5a63}
  .totals .row.discount{color:#a07b00}
  .totals .row.grand{background:linear-gradient(90deg,#d4be37,#f5e9a8);color:#15171e;padding:14px 18px;border-radius:6px;margin-top:8px;font-size:16px;font-weight:700;letter-spacing:.3px}
  .totals .row.grand .v{font-size:20px}
  .validity{margin-top:24px;font-size:12px;color:#8a8a93;font-style:italic}
  footer{margin-top:32px;padding-top:24px;border-top:1px solid #e7e3d3;display:flex;justify-content:space-between;align-items:flex-end;font-size:12px;color:#5a5a63;line-height:1.7}
  footer .sign .name{color:#15171e;font-weight:600;font-size:13px;margin-bottom:2px}
  footer .contacts{text-align:right}
  footer .contacts a{color:#15171e;text-decoration:none}
  footer .contacts .gold{color:#d4be37;font-weight:600}
  .footer-note{margin-top:10px;font-size:11px;color:#a0a0a8;text-align:center;font-style:italic}
</style></head>
<body>
<div class="page">
  <span class="corner tl"></span><span class="corner tr"></span>
  <span class="corner bl"></span><span class="corner br"></span>
  <div class="watermark">24</div>
<main>
  <header>
    <div class="brand">
      <div class="logo">24<span>ZXC</span></div>
      <div class="tag">Премиум веб-разработка · Лицензирование</div>
    </div>
    <div class="meta">
      ${data.number ? `<div><b>КП №</b> ${escapeHtml(data.number)}</div>` : ""}
      <div><b>от</b> ${escapeHtml(data.date)}</div>
      ${data.validUntil ? `<div><b>действует до</b> ${escapeHtml(data.validUntil)}</div>` : ""}
    </div>
  </header>

  <div class="title-block">
    <div class="kicker">Commercial Proposal</div>
    <h1>Коммерческое<br>предложение</h1>
  </div>

  ${(data.clientName || data.clientOrg || data.clientEmail) ? `
  <div class="to">
    ${data.clientOrg ? `<div class="col"><div class="lbl">Кому</div><div class="val">${escapeHtml(data.clientOrg)}</div></div>` : ""}
    ${data.clientName ? `<div class="col"><div class="lbl">Контактное лицо</div><div class="val">${escapeHtml(data.clientName)}</div></div>` : ""}
    ${(data.clientEmail || data.clientPhone) ? `<div class="col"><div class="lbl">Контакты</div><div class="val">${escapeHtml(data.clientEmail || "")}${data.clientEmail && data.clientPhone ? "<br>" : ""}${escapeHtml(data.clientPhone || "")}</div></div>` : ""}
  </div>` : ""}

  ${data.introText ? `<div class="intro">${escapeHtml(data.introText)}</div>` : ""}

  <table class="items">
    <thead><tr>
      <th class="num">№</th>
      <th class="name">Наименование услуги</th>
      <th class="qty">Кол-во</th>
      <th class="price">Цена</th>
      <th class="sum">Сумма</th>
    </tr></thead>
    <tbody>${itemsRows || `<tr><td colspan="5" style="padding:24px;text-align:center;color:#a0a0a8">Услуги не выбраны</td></tr>`}</tbody>
  </table>

  <div class="totals"><div class="box">
    <div class="row"><span>Подытог</span><span>${money(subtotal)} ₽</span></div>
    ${discount > 0 ? `<div class="row discount"><span>Скидка ${data.discountPercent}%</span><span>− ${money(discount)} ₽</span></div>` : ""}
    <div class="row grand"><span>ИТОГО</span><span class="v">${money(total)} ₽</span></div>
  </div></div>

  ${data.validUntil ? `<div class="validity">* Предложение действительно до ${escapeHtml(data.validUntil)}</div>` : ""}
</main>
  <footer>
    <div class="sign">
      <div class="name">${escapeHtml(contactName)}</div>
      <div>Директор</div>
      <div>24ZXC · Web & Licensing Studio</div>
      <div style="margin-top:6px;font-size:11px;color:#8a8a93">НДС не облагается (НПД)</div>
    </div>
    <div class="contacts">
      <div><a href="tel:${escapeHtml(contactPhone)}">${escapeHtml(contactPhone)}</a></div>
      <div><a href="mailto:${escapeHtml(contactEmail)}">${escapeHtml(contactEmail)}</a></div>
      <div class="gold">${escapeHtml(contactSite)}</div>
    </div>
  </footer>

  ${data.footerText ? `<div class="footer-note">${escapeHtml(data.footerText)}</div>` : ""}
</div>
</body></html>`;
}