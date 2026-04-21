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
 * HTML шаблон Заявления на открытие ЛК организации в системе НМО Минздрава.
 * Адаптирован по разделу 3.7 Инструкции от 07.05.2024.
 */
export function generateNmoApplicationHtml(reg: NmoRegistrationFull): string {
  const today = new Date().toLocaleDateString("ru-RU");

  return `<!DOCTYPE html>
<html lang="ru">
<head>
<meta charset="UTF-8">
<title>Заявление на открытие ЛК — ${v(reg.organization_name)}</title>
<style>
  @page { size: A4; margin: 20mm; }
  body { font-family: 'Times New Roman', serif; font-size: 12pt; line-height: 1.4; color: #000; padding: 0; margin: 0; background: #fff; }
  .doc { width: 170mm; padding: 0; margin: 0 auto; }
  .header { text-align: right; margin-bottom: 20mm; font-size: 11pt; }
  h1 { text-align: center; font-size: 14pt; margin: 0 0 10mm 0; text-transform: uppercase; }
  p { margin: 0 0 4mm 0; text-align: justify; text-indent: 12mm; }
  .field { display: inline-block; min-width: 60mm; border-bottom: 1px solid #000; padding: 0 2mm; }
  table.req { width: 100%; border-collapse: collapse; margin: 5mm 0; font-size: 11pt; }
  table.req td { padding: 2mm 3mm; border: 1px solid #000; vertical-align: top; }
  table.req td.label { width: 55mm; background: #f3f3f3; font-weight: bold; }
  .signatures { margin-top: 15mm; }
  .sig-row { display: flex; justify-content: space-between; margin-bottom: 8mm; }
  .sig-cell { width: 70mm; text-align: center; font-size: 10pt; }
  .sig-line { border-bottom: 1px solid #000; height: 8mm; margin-bottom: 2mm; }
  .stamp { width: 40mm; height: 40mm; border: 2px dashed #888; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; color: #888; font-size: 10pt; margin-top: 8mm; }
</style>
</head>
<body>
<div class="doc">
  <div class="header">
    Ректору ФГАОУ ВО РНИМУ им. Н.И. Пирогова<br>
    Минздрава России<br>
    г. Москва
  </div>

  <h1>Заявление</h1>
  <p style="text-align:center; text-indent:0;">на открытие личного кабинета организации в системе НМО</p>

  <p>Прошу открыть личный кабинет организации в Информационно-аналитической системе непрерывного медицинского и фармацевтического образования (edu.rosminzdrav.ru) для нижеуказанной организации.</p>

  <p style="text-indent:0; margin-top:6mm;"><strong>Реквизиты организации:</strong></p>
  <table class="req">
    <tr><td class="label">Полное наименование</td><td>${v(reg.organization_name)}</td></tr>
    <tr><td class="label">Сокращённое наименование</td><td>${v(reg.organization_abbr)}</td></tr>
    <tr><td class="label">ОГРН</td><td>${v(reg.ogrn)}</td></tr>
    <tr><td class="label">ИНН / КПП</td><td>${v(reg.inn)} / ${v(reg.kpp)}</td></tr>
    <tr><td class="label">Юридический адрес</td><td>${v(reg.legal_address)}</td></tr>
    <tr><td class="label">Фактический адрес</td><td>${v(reg.actual_address || reg.legal_address)}</td></tr>
    <tr><td class="label">Регион</td><td>${v(reg.region)}</td></tr>
    <tr><td class="label">Телефон</td><td>${v(reg.organization_phone)}</td></tr>
    <tr><td class="label">E-mail</td><td>${v(reg.organization_email)}</td></tr>
    <tr><td class="label">Сайт</td><td>${v(reg.organization_website)}</td></tr>
    <tr><td class="label">Лицензия № / дата</td><td>${v(reg.license_number)} от ${fmtDate(reg.license_date)}</td></tr>
    <tr><td class="label">Приложение о ДПО к лицензии</td><td>${reg.has_dpo_appendix ? "имеется" : "отсутствует"}</td></tr>
  </table>

  <p style="text-indent:0; margin-top:6mm;"><strong>Ответственное лицо:</strong></p>
  <table class="req">
    <tr><td class="label">ФИО</td><td>${v(reg.responsible_name)}</td></tr>
    <tr><td class="label">Должность</td><td>${v(reg.responsible_position)}</td></tr>
    <tr><td class="label">СНИЛС</td><td>${v(reg.responsible_snils)}</td></tr>
    <tr><td class="label">Дата рождения</td><td>${fmtDate(reg.responsible_birth_date)}</td></tr>
    <tr><td class="label">E-mail</td><td>${v(reg.responsible_email)}</td></tr>
    <tr><td class="label">Мобильный телефон</td><td>${v(reg.responsible_mobile)}</td></tr>
    <tr><td class="label">Логин в системе НМФО</td><td>${v(reg.responsible_login)}</td></tr>
  </table>

  <p style="margin-top:8mm;">Подтверждаю достоверность представленных сведений и согласие ответственного лица на обработку персональных данных.</p>

  <div class="signatures">
    <div class="sig-row">
      <div class="sig-cell">
        <div class="sig-line"></div>
        Руководитель организации
      </div>
      <div class="sig-cell">
        <div class="sig-line"></div>
        Подпись / расшифровка
      </div>
    </div>
    <div style="display:flex; justify-content:space-between; align-items:flex-end;">
      <div class="stamp">М.П.</div>
      <div style="font-size:11pt;">«___» _____________ ${new Date().getFullYear()} г.<br><span style="font-size:9pt; color:#666;">Дата заполнения: ${today}</span></div>
    </div>
  </div>
</div>
</body>
</html>`;
}