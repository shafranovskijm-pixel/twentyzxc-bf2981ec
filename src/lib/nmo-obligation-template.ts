import type { NmoRegistrationFull } from "@/components/admin/nmo/types";

function fmtDate(d?: string | null): string {
  if (!d) return "_____________";
  try {
    return new Date(d).toLocaleDateString("ru-RU");
  } catch {
    return d;
  }
}

function v(s?: string | null): string {
  return s && s.trim() ? s : "_______________";
}

/**
 * HTML шаблон Обязательства о неразглашении персональных данных
 * для ответственного лица организации НМО (раздел 3.10 Инструкции от 07.05.2024).
 */
export function generateNmoObligationHtml(reg: NmoRegistrationFull): string {
  const today = new Date().toLocaleDateString("ru-RU");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Обязательство о неразглашении ПД — ${v(reg.responsible_name)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.5; color: #000; padding: 0; margin: 0; background: #fff; }
  .doc { width: 170mm; padding: 0; margin: 0 auto; }
  h1 { text-align: center; font-size: 14pt; margin: 0 0 8mm 0; text-transform: uppercase; }
  h2 { text-align: center; font-size: 12pt; margin: 0 0 12mm 0; font-weight: normal; }
  p { margin: 0 0 4mm 0; text-align: justify; text-indent: 12mm; }
  .preamble { text-indent: 0; margin-bottom: 8mm; }
  ol { padding-left: 8mm; }
  ol li { margin-bottom: 4mm; text-align: justify; }
  .signatures { margin-top: 15mm; display: flex; justify-content: space-between; align-items: flex-end; }
  .sig-cell { width: 80mm; }
  .sig-line { border-bottom: 1px solid #000; height: 8mm; margin-bottom: 2mm; }
  .small { font-size: 10pt; color: #555; text-align: center; }
</style>
</head>
<body>
<div class="doc">
  <h1>Обязательство</h1>
  <h2>о неразглашении персональных данных</h2>

  <p class="preamble">
    Я, <strong>${v(reg.responsible_name)}</strong>,
    дата рождения ${fmtDate(reg.responsible_birth_date)},
    СНИЛС ${v(reg.responsible_snils)},
    занимающий(ая) должность <strong>${v(reg.responsible_position)}</strong>
    в организации <strong>${v(reg.organization_name)}</strong> (ИНН ${v(reg.inn)}),
    являясь ответственным лицом за работу в Информационно-аналитической системе
    непрерывного медицинского и фармацевтического образования
    Минздрава России (далее — Система), обязуюсь:
  </p>

  <ol>
    <li>Не разглашать третьим лицам персональные данные физических лиц, ставшие мне известными в связи с работой в Системе.</li>
    <li>Не использовать персональные данные в целях, не связанных с исполнением должностных обязанностей.</li>
    <li>Не передавать третьим лицам полученные в Системе учётные данные (логин, пароль), не оставлять рабочее место с активной сессией без присмотра.</li>
    <li>Соблюдать требования Федерального закона от 27.07.2006 № 152-ФЗ «О персональных данных» и иных нормативных актов в области защиты персональных данных.</li>
    <li>Незамедлительно уведомлять руководителя организации и оператора Системы о любых случаях несанкционированного доступа, утраты учётных данных или иных инцидентах.</li>
    <li>В случае прекращения исполнения должностных обязанностей или увольнения — сообщить об этом оператору Системы и обеспечить отзыв доступа.</li>
  </ol>

  <p>Об ответственности за разглашение персональных данных, предусмотренной законодательством Российской Федерации, предупреждён(а).</p>

  <div class="signatures">
    <div class="sig-cell">
      <div class="sig-line"></div>
      <div class="small">Подпись ответственного лица</div>
    </div>
    <div class="sig-cell" style="text-align:right;">
      «___» _____________ ${new Date().getFullYear()} г.<br>
      <span class="small">Дата заполнения: ${today}</span>
    </div>
  </div>
</div>
</body>
</html>`;
}