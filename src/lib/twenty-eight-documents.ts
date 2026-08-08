import type { DocumentData } from "./document-templates";

const esc = (value: unknown) => String(value ?? "")
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const money = (value: number) => value.toLocaleString("ru-RU", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

const total = (data: DocumentData) => data.services.reduce((sum, item) => sum + item.qty * item.price, 0);

const styles = `
  <style>
    @page { size: A4; margin: 0; }
    * { box-sizing: border-box; }
    body { width: 794px; min-height: 1123px; margin: 0 auto; padding: 42px 50px 48px; font-family: Inter, Arial, sans-serif; font-size: 12px; line-height: 1.47; color: #1f2937; background: #fff; }
    body::before { content: 'SINTAGMA'; position: fixed; top: 20px; left: 50px; color: #0f766e; font-size: 11px; font-weight: 900; letter-spacing: .06em; }
    body::after { content: ''; position: fixed; top: 37px; left: 50px; right: 50px; height: 2px; background: #0f766e; }
    h1 { margin: 36px 0 4px; color: #16324f; font-size: 24px; line-height: 1.12; text-align: center; }
    h2 { margin: 16px 0 7px; color: #16324f; font-size: 16px; line-height: 1.2; break-after: avoid; }
    h3 { margin: 12px 0 5px; color: #115e59; font-size: 13px; break-after: avoid; }
    p { margin: 5px 0; }
    ul, ol { margin: 6px 0 8px 21px; padding: 0; }
    li { margin: 3px 0; }
    .subtitle { margin: 0 0 14px; color: #64748b; font-size: 13px; text-align: center; }
    .meta { display: flex; justify-content: space-between; margin: 12px 0 18px; padding: 7px 10px; border: 1px solid #cbd5e1; background: #eaf0f6; font-weight: 700; }
    .callout { margin: 12px 0; padding: 12px 14px; border: 1px solid #0f766e; background: #e8f3f1; break-inside: avoid; }
    .muted { color: #64748b; font-size: 10.5px; }
    .page-break { page-break-before: always; break-before: page; padding-top: 4px; }
    .legal-table, .scope-table, .price-table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; break-inside: avoid; }
    .legal-table th, .scope-table th, .price-table th { padding: 7px 8px; background: #115e59; color: #fff; text-align: left; font-size: 10px; }
    .legal-table td, .scope-table td, .price-table td { padding: 7px 8px; border: 1px solid #cbd5e1; vertical-align: top; font-size: 10px; }
    .scope-table tr:nth-child(even) td, .price-table tr:nth-child(even) td { background: #f8fafc; }
    .signatures { display: flex; gap: 14px; margin-top: 12px; break-inside: avoid; }
    .signature { width: 50%; min-height: 170px; padding: 12px; border: 1px solid #cbd5e1; background: #f8fafc; font-size: 10px; }
    .signature:first-child { background: #eaf0f6; }
    .signature:last-child { background: #e8f3f1; }
    .line { margin-top: 25px; padding-top: 5px; border-top: 1px solid #334155; }
    .hero { margin-top: 38px; padding: 26px 24px; background: linear-gradient(135deg,#16324f,#115e59); color: #fff; text-align: center; }
    .hero h1 { margin: 0 0 7px; color: #fff; }
    .hero p { color: #dbeafe; font-size: 13px; }
    .stats { display: flex; margin: 9px 0 14px; border: 1px solid #cbd5e1; }
    .stat { flex: 1; padding: 9px 6px; text-align: center; background: #f8fafc; border-right: 1px solid #cbd5e1; }
    .stat:last-child { border-right: none; }
    .stat strong { display: block; color: #0f766e; font-size: 22px; }
    .steps { counter-reset: step; list-style: none; margin-left: 0; }
    .steps li { counter-increment: step; position: relative; margin: 7px 0; padding: 9px 10px 9px 46px; background: #f8fafc; border: 1px solid #cbd5e1; }
    .steps li::before { content: counter(step, decimal-leading-zero); position: absolute; left: 0; top: 0; bottom: 0; width: 37px; display: flex; align-items: center; justify-content: center; color: #fff; background: #0f766e; font-weight: 800; }
    .inout { display: flex; gap: 8px; }
    .inout > div { width: 50%; padding: 10px 12px; border: 1px solid #cbd5e1; }
    .in { background: #e8f3f1; }
    .out { background: #fdecec; }
    @media print { body { -webkit-print-color-adjust: exact; print-color-adjust: exact; } tr, .callout, .signatures, .signature, .steps li { break-inside: avoid; page-break-inside: avoid; } }
  </style>
`;

export function generateTwentyEightContractHtml(data: DocumentData): string {
  const c = data.company;
  const cl = data.client;
  const amount = total(data);
  const serviceRows = data.services.map((item, index) => `
    <tr><td style="width:34px;text-align:center">${index + 1}</td><td>${esc(item.name)}</td><td style="width:45px;text-align:center">${item.qty}</td><td style="width:95px;text-align:right">${money(item.price)} ₽</td></tr>
  `).join("");

  return `<!doctype html><html><head><meta charset="utf-8"><title>Договор 28-ФЗ № ${esc(data.number)}</title>${styles}</head><body>
    <h1>ДОГОВОР № ${esc(data.number)}</h1>
    <div class="subtitle">на оказание консультационных и информационно-документационных услуг</div>
    <div class="meta"><span>г. Владивосток</span><span>${esc(data.date)}</span></div>
    <p><strong>${esc(c.company_short_name || c.company_name)}</strong>, именуемый в дальнейшем «Исполнитель», в лице ${esc(c.company_director_name)}, действующего на основании сведений о государственной регистрации, с одной стороны, и <strong>${esc(cl.name)}</strong>, именуемое в дальнейшем «Заказчик», в лице ${esc(cl.director_post || "директора")} ${esc(cl.director_name)}, действующего на основании Устава, с другой стороны, заключили настоящий Договор.</p>

    <h2>1. Предмет договора</h2>
    <p>1.1. Исполнитель сопровождает подготовку и подачу сведений для внесения изменений в реестр лицензий на образовательную деятельность в связи с требованиями Федерального закона № 28-ФЗ, а Заказчик принимает и оплачивает услуги.</p>
    <p>1.2. Проект охватывает одного Заказчика, одну лицензию, один лицензирующий орган, перечень из 26 программ и не более 18 программ-кандидатов для заявления.</p>
    <p>1.3. <strong>Разработка, переработка, методическая экспертиза и утверждение образовательных программ, учебных планов и локальных актов в стоимость не входят.</strong></p>
    <p>1.4. Юридически значимое подписание УКЭП и подача выполняются Заказчиком или его уполномоченным лицом; Исполнитель сопровождает действие дистанционно.</p>

    <h2>2. Что делает Исполнитель</h2>
    <ul>
      <li>проверяет перечень из 26 программ и переданные материалы;</li>
      <li>классифицирует программы и сопоставляет до 18 кандидатов с областями и видами деятельности только при наличии основания;</li>
      <li>выделяет спорные позиции без заполнения «по аналогии»;</li>
      <li>проводит одно телефонное и/или письменное согласование с Центром профессионального образования Самарской области;</li>
      <li>готовит один комплект сведений и один проект заявления;</li>
      <li>сопровождает одну подачу и один раз отрабатывает формальное замечание в пределах исходного объёма.</li>
    </ul>
    <h2>3. Обязанности Заказчика</h2>
    <ul>
      <li>до 12 августа 2026 года передать полные тексты программ, учебные планы, приказы об утверждении, сведения о лицензии и актуальные реквизиты;</li>
      <li>обеспечить достоверность данных и отвечать на уточнения в течение одного рабочего дня;</li>
      <li>обеспечить доступ к личному кабинету, действующую УКЭП и участие уполномоченного лица;</li>
      <li>принять решение по спорным позициям после разъяснений лицензирующего органа.</li>
    </ul>

    <div class="page-break"></div>
    <h2>4. Сроки и приёмка</h2>
    <p>4.1. Работа начинается после поступления 100% предоплаты и полного комплекта исходных материалов.</p>
    <p>4.2. При своевременном исполнении обязанностей Заказчиком комплект передаётся не позднее 31 августа 2026 года. Срок продлевается на время просрочки Заказчика, ожидания официальных разъяснений или недоступности государственных систем.</p>
    <p>4.3. Срок рассмотрения заявления государственным органом и дата изменения реестра в срок услуг не входят.</p>
    <p>4.4. Заказчик подписывает акт либо направляет мотивированные замечания в течение 3 рабочих дней. При отсутствии ответа услуги считаются принятыми.</p>

    <h2>5. Стоимость и расчёты</h2>
    <div class="callout"><strong>Стоимость проекта: ${money(amount)} ₽</strong><br/>НДС не предъявляется. Разработка и переработка образовательных программ не включены.</div>
    <p>5.1. Заказчик оплачивает ${money(amount)} ₽ на условиях 100% предоплаты в течение 3 рабочих дней после подписания договора и выставления счёта.</p>

    <h2>6. Ответственность и предел результата</h2>
    <p>6.1. Исполнитель бесплатно исправляет собственные ошибки в подготовленных материалах в пределах согласованного объёма.</p>
    <p>6.2. Исполнитель не гарантирует положительное решение государственного органа, если оно зависит от содержания программ Заказчика, отсутствия прямого мэппинга, официального толкования, неполных документов, технических систем или действий Заказчика.</p>
    <p>6.3. Спорные поля не заполняются по аналогии без документального основания или подтверждения лицензирующего органа. Это является выявленным риском, а не недостатком услуги.</p>
    <p>6.4. Работы сверх объёма выполняются после отдельного письменного согласования.</p>

    <h2>7. Электронный обмен и конфиденциальность</h2>
    <p>7.1. Переписка по адресам Сторон признаётся доказательством согласований. Доступы передаются по согласованному защищённому каналу. Исполнитель не хранит УКЭП Заказчика.</p>
    <p>7.2. Стороны сохраняют конфиденциальность документов, персональных данных и доступов, кроме случаев, необходимых для исполнения договора или установленных законом.</p>

    <h2>8. Срок действия и споры</h2>
    <p>8.1. Договор действует с момента подписания до полного исполнения. Заказчик вправе отказаться от него с оплатой фактически оказанных услуг и подтверждённых расходов.</p>
    <p>8.2. Срок ответа на претензию — 10 рабочих дней. Неурегулированный спор разрешается по законодательству Российской Федерации.</p>

    <h2>9. Реквизиты и подписи</h2>
    <div class="signatures">
      <div class="signature"><strong>ИСПОЛНИТЕЛЬ</strong><br/>${esc(c.company_short_name || c.company_name)}<br/>ИНН ${esc(c.company_inn)}<br/>ОГРН/ОГРНИП ${esc(c.company_ogrn)}<br/>${esc(c.company_legal_address)}<br/>р/с ${esc(c.company_bank_account)}<br/>${esc(c.company_bank_name)}<br/>БИК ${esc(c.company_bank_bik)}<br/>к/с ${esc(c.company_bank_corr)}<br/>${esc(c.company_email)} · ${esc(c.company_phone)}<div class="line">${esc(c.company_director_name)}</div></div>
      <div class="signature"><strong>ЗАКАЗЧИК</strong><br/>${esc(cl.name)}<br/>ИНН/КПП ${esc(cl.inn)} / ${esc(cl.kpp)}<br/>ОГРН ${esc(cl.ogrn)}<br/>${esc(cl.address)}<br/><br/>Банковские реквизиты указываются Заказчиком при подписании.<div class="line">${esc(cl.director_name)}</div></div>
    </div>

    <div class="page-break"></div>
    <h1>ПРИЛОЖЕНИЕ № 1</h1>
    <div class="subtitle">Состав и границы проекта</div>
    <table class="scope-table"><thead><tr><th>№</th><th>Услуга</th><th>Кол-во</th><th>Цена</th></tr></thead><tbody>${serviceRows}</tbody><tfoot><tr><td colspan="3" style="text-align:right"><strong>ИТОГО</strong></td><td style="text-align:right"><strong>${money(amount)} ₽</strong></td></tr></tfoot></table>
    <h3>Контрольные точки</h3>
    <table class="scope-table"><tr><th>Срок</th><th>Действие</th><th>Ответственный</th></tr><tr><td>до 12.08.2026</td><td>Передача полного комплекта материалов</td><td>Заказчик</td></tr><tr><td>после получения</td><td>Аудит, сопоставление, согласование с Самарой</td><td>Исполнитель</td></tr><tr><td>до 31.08.2026*</td><td>Готовность пакета и сопровождение подачи</td><td>Стороны</td></tr></table>
    <p class="muted">* При условии своевременной оплаты, передачи полного комплекта и отсутствия внешних задержек.</p>
    <h3>Не входит в проект</h3>
    <ul><li>разработка и переработка программ;</li><li>создание отсутствующих приказов, локальных актов, доверенностей и ЭЦП;</li><li>повторные подачи из-за новых данных, программ или адресов;</li><li>обжалование решения и представительство.</li></ul>
  </body></html>`;
}

export interface TwentyEightProposalClient {
  name: string;
  license?: string;
  director?: string;
  email?: string;
}

export interface TwentyEightProposalProject {
  price: number;
  scopeSummary?: string | null;
  riskNote?: string | null;
}

export function generateTwentyEightProposalHtml(client: TwentyEightProposalClient, project: TwentyEightProposalProject): string {
  return `<!doctype html><html><head><meta charset="utf-8"><title>КП 28-ФЗ — ${esc(client.name)}</title>${styles}</head><body>
    <div class="hero"><h1>СОПРОВОЖДЕНИЕ ПО 28-ФЗ</h1><p>Подготовка сведений для внесения изменений в реестр лицензий</p></div>
    <div class="subtitle" style="margin-top:12px"><strong>${esc(client.name)}</strong>${client.license ? ` · лицензия ${esc(client.license)}` : ""}</div>
    <div class="callout"><strong>Цена проекта — ${money(project.price)} ₽</strong><br/>Фиксированная стоимость сопровождения. Разработка и переработка образовательных программ не включены.</div>
    <h2>Что мы решаем</h2>
    <p>У учебного центра есть 26 программ. Для заявления недостаточно перенести их названия: нужно определить применимость процедуры, указать область и вид профессиональной деятельности только при наличии основания и отдельно согласовать спорные позиции.</p>
    <h2>Предварительный результат</h2>
    <div class="stats"><div class="stat"><strong>26</strong>программ всего</div><div class="stat"><strong>16</strong>прямых кандидатов</div><div class="stat"><strong>2</strong>требуют уточнения</div><div class="stat"><strong>8</strong>предварительно вне процедуры</div></div>
    <p class="muted">Итоговый объём сведений — до 18 программ-кандидатов после проверки полных текстов и согласования.</p>
    <h2>Что входит в работу</h2>
    <ol class="steps"><li><strong>Собрать и проверить.</strong> Перечень 26 программ, полные тексты, приказы и данные лицензии.</li><li><strong>Сопоставить.</strong> Решение по каждой программе и значения только при наличии прямого основания.</li><li><strong>Согласовать.</strong> Один телефонный и/или письменный запрос в Самарский отдел.</li><li><strong>Подготовить пакет.</strong> Рабочая таблица и один проект заявления.</li><li><strong>Сопроводить подачу.</strong> Одна подача и одна отработка формального замечания.</li></ol>
    <h2>Результат</h2>
    <ul><li>реестр 26 программ с решением по каждой позиции;</li><li>таблица сопоставления до 18 кандидатов;</li><li>перечень рисков без заполнения «по аналогии»;</li><li>готовый комплект сведений и проект заявления;</li><li>сценарий и сопровождение подачи.</li></ul>

    <div class="page-break"></div>
    <h2>Границы и подстраховка</h2>
    <div class="inout"><div class="in"><strong>В цену входит</strong><br/>Аудит 26 программ; до 18 кандидатов; одно согласование; один пакет; одна подача; одна отработка формального замечания.</div><div class="out"><strong>В цену не входит</strong><br/>Разработка программ; создание отсутствующих приказов и локальных актов; новые программы/адреса; повторные подачи и обжалование.</div></div>
    <div class="callout" style="background:#eaf0f6;border-color:#16324f"><strong>Ответственность</strong><br/>Мы отвечаем за подготовленные нами сведения и бесплатно исправляем собственные ошибки. Решение государственного органа не гарантируется, если оно зависит от содержания программ, отсутствия прямого мэппинга, полноты документов или официального толкования.</div>
    <h2>Стоимость и график</h2>
    <table class="price-table"><tr><td><strong>Стоимость</strong></td><td>${money(project.price)} ₽</td></tr><tr><td><strong>Оплата</strong></td><td>100% предоплата</td></tr><tr><td><strong>Целевой срок</strong></td><td>до 31 августа 2026 года</td></tr><tr><td><strong>Условие срока</strong></td><td>полный комплект документов и предоплата — до 12 августа 2026 года</td></tr></table>
    <h2>Следующий шаг</h2>
    <ol><li>Подписать договор и внести 100% предоплату.</li><li>Передать полные тексты программ и приказы.</li><li>Согласовать с Самарским отделом спорные позиции.</li><li>Утвердить таблицу и подать пакет до 31 августа.</li></ol>
    <div class="signatures"><div class="signature"><strong>ИСПОЛНИТЕЛЬ</strong><br/>ИП Шафрановский Максим Михайлович<br/>+7 (914) 721-34-24<br/>support@sintagma.com.ru</div><div class="signature"><strong>ЗАКАЗЧИК</strong><br/>${esc(client.name)}<br/>${esc(client.director || "") }<br/>${esc(client.email || "")}</div></div>
    <p class="muted" style="text-align:center">Предложение действительно до 17 августа 2026 года включительно.</p>
  </body></html>`;
}
