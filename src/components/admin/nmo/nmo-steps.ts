export type NmoStepKey =
  | "employee_registered"
  | "email_confirmed"
  | "credentials_received"
  | "lk_org_request_started"
  | "org_data_filled"
  | "responsible_added"
  | "docs_generated"
  | "docs_uploaded"
  | "originals_sent"
  | "cabinet_opened"
  | "dpp_passports_filled";

export interface NmoStepDef {
  key: NmoStepKey;
  number: number;
  title: string;
  short: string;
  instruction: string;
  link?: { url: string; label: string };
  copyFields?: Array<"organization_name" | "organization_abbr" | "inn" | "kpp" | "ogrn" | "legal_address" | "actual_address" | "license_number" | "license_date" | "responsible_name" | "responsible_email" | "responsible_mobile" | "responsible_birth_date" | "responsible_snils" | "responsible_position" | "responsible_login">;
  actionType?: "open-link" | "copy" | "extension" | "generate-docs" | "upload-docs" | "mail-tracking" | "manual";
}

export const NMO_STEPS: NmoStepDef[] = [
  {
    key: "employee_registered",
    number: 1,
    title: "Регистрация сотрудника на nmfo-vo",
    short: "Регистрация физлица",
    instruction:
      "Ответственный сотрудник самостоятельно регистрируется как физлицо на портале НМФО. Понадобятся: СНИЛС, паспортные данные, личный e-mail, дата рождения, регион. Используйте кнопку «Передать в расширение» — данные будут подставлены в поля автоматически (расширение должно быть установлено в Chrome).",
    link: { url: "https://nmfo-vo.edu.rosminzdrav.ru/#/registration", label: "Открыть форму регистрации НМФО" },
    copyFields: ["responsible_name", "responsible_email", "responsible_mobile", "responsible_birth_date", "responsible_snils"],
    actionType: "extension",
  },
  {
    key: "email_confirmed",
    number: 2,
    title: "Подтверждение e-mail",
    short: "Подтверждение почты",
    instruction:
      "На указанный при регистрации e-mail придёт письмо со ссылкой подтверждения. Откройте письмо и перейдите по ссылке. Если письма нет — проверьте папку «Спам». Срок действия ссылки — 24 часа.",
    actionType: "manual",
  },
  {
    key: "credentials_received",
    number: 3,
    title: "Получение логина и пароля",
    short: "Логин/пароль",
    instruction:
      "После подтверждения почты на e-mail приходит письмо с логином и временным паролем для входа в личный кабинет НМФО. Сохраните данные в карточке заявки (поля «Логин НМФО» и «Пароль НМФО»).",
    link: { url: "https://nmfo-vo.edu.rosminzdrav.ru/#/login", label: "Войти в ЛК НМФО" },
    actionType: "open-link",
  },
  {
    key: "lk_org_request_started",
    number: 4,
    title: "Создание заявки на org.edu",
    short: "Заявка на org.edu",
    instruction:
      "Войдите в ЛК НМФО, перейдите в раздел «Личный кабинет организации» → «Создать заявку». Используйте расширение для автозаполнения поля выбора региона и аббревиатуры. Зафиксируйте номер заявки в поле «Номер заявки на портале».",
    link: { url: "https://org.edu.rosminzdrav.ru", label: "Открыть org.edu.rosminzdrav.ru" },
    copyFields: ["organization_abbr", "region"],
    actionType: "extension",
  },
  {
    key: "org_data_filled",
    number: 5,
    title: "Заполнение данных организации",
    short: "Данные организации",
    instruction:
      "В заявке заполняются: полное и сокращённое наименование, ОГРН, ИНН, КПП, юр. адрес, фактический адрес, регион, телефон, e-mail, сайт, признак приложения о ДПО к лицензии, номер и дата лицензии. Используйте «Скопировать» рядом с каждым полем для ручной вставки или расширение для автозаполнения.",
    copyFields: ["organization_name", "ogrn", "inn", "kpp", "legal_address", "actual_address", "organization_abbr", "license_number", "license_date"],
    actionType: "copy",
  },
  {
    key: "responsible_added",
    number: 6,
    title: "Добавление ответственного лица",
    short: "Ответственный",
    instruction:
      "В разделе «Ответственные лица» добавьте ФИО, СНИЛС, должность, e-mail, мобильный телефон, дату рождения и регион ответственного. Логин ответственного — тот, что получен на шаге 3.",
    copyFields: ["responsible_name", "responsible_snils", "responsible_position", "responsible_email", "responsible_mobile", "responsible_birth_date", "responsible_login"],
    actionType: "copy",
  },
  {
    key: "docs_generated",
    number: 7,
    title: "Генерация документов",
    short: "Заявление + Обязательство",
    instruction:
      "Сгенерируйте автоматически Заявление на открытие ЛК организации и Обязательство о неразглашении персональных данных. Документы формируются по данным заявки. Распечатайте, подпишите у руководителя, заверьте печатью, отсканируйте.",
    actionType: "generate-docs",
  },
  {
    key: "docs_uploaded",
    number: 8,
    title: "Загрузка сканов на портал",
    short: "Загрузка сканов",
    instruction:
      "В заявке на портале нажмите «Прикрепить документы» и загрузите сканы: Заявление, Обязательство, копию лицензии (с приложением о ДПО, если есть). После загрузки нажмите «Отправить» — статус заявки станет «Подана».",
    actionType: "upload-docs",
  },
  {
    key: "originals_sent",
    number: 9,
    title: "Отправка оригиналов почтой",
    short: "Оригиналы почтой",
    instruction:
      "Распечатайте Заявление и Обязательство в 1 экземпляре каждое, заверьте копию лицензии. Отправьте Почтой России в адрес РНИМУ им. Н. И. Пирогова: 117997, г. Москва, ул. Островитянова, д. 1. Введите трек-номер и дату отправки в полях ниже.",
    actionType: "mail-tracking",
  },
  {
    key: "cabinet_opened",
    number: 10,
    title: "Открытие ЛК организации",
    short: "ЛК открыт методистом",
    instruction:
      "Методист РНИМУ проверяет поданную заявку и оригиналы документов (срок до 30 рабочих дней с момента получения почтового отправления). После одобрения статус заявки на портале меняется на «Закрыта», ЛК организации открывается. Логин и пароль для входа высылаются на e-mail организации.",
    link: { url: "https://org.edu.rosminzdrav.ru", label: "Войти в ЛК организации" },
    actionType: "open-link",
  },
  {
    key: "dpp_passports_filled",
    number: 11,
    title: "Заполнение паспортов ДПП",
    short: "Паспорта ДПП",
    instruction:
      "В ЛК организации в разделе «Образовательные программы» заполните паспорта ДПП (название, объём, форма обучения, целевая аудитория, преподаватели и т.д.). После заполнения отправьте на проверку в Координационный совет.",
    link: { url: "https://org.edu.rosminzdrav.ru", label: "Перейти к программам" },
    actionType: "open-link",
  },
];

export const PORTAL_STATUS_LABELS: Record<string, { label: string; color: string }> = {
  draft: { label: "Формируется", color: "bg-muted text-muted-foreground border-border" },
  submitted: { label: "Подана", color: "bg-blue-500/10 text-blue-400 border-blue-500/30" },
  processing: { label: "На обработке", color: "bg-yellow-500/10 text-yellow-400 border-yellow-500/30" },
  revision: { label: "На доработке", color: "bg-orange-500/10 text-orange-400 border-orange-500/30" },
  rejected: { label: "Отклонена", color: "bg-red-500/10 text-red-400 border-red-500/30" },
  closed: { label: "Закрыта (ЛК открыт)", color: "bg-green-500/10 text-green-400 border-green-500/30" },
};

export const NMO_INSTRUCTION_PDF =
  "https://edu.rosminzdrav.ru/fileadmin/user_upload/organisations/inf_mater/instruction07.05.2024.pdf";

export const FIELD_LABELS: Record<string, string> = {
  organization_name: "Полное наименование",
  organization_abbr: "Сокращённое наименование",
  ogrn: "ОГРН",
  inn: "ИНН",
  kpp: "КПП",
  legal_address: "Юридический адрес",
  actual_address: "Фактический адрес",
  organization_phone: "Телефон организации",
  organization_email: "E-mail организации",
  organization_website: "Сайт",
  region: "Регион",
  license_number: "Номер лицензии",
  license_date: "Дата лицензии",
  has_dpo_appendix: "Приложение о ДПО",
  responsible_name: "ФИО ответственного",
  responsible_email: "E-mail ответственного",
  responsible_mobile: "Мобильный телефон",
  responsible_work_phone: "Рабочий телефон",
  responsible_birth_date: "Дата рождения",
  responsible_gender: "Пол",
  responsible_snils: "СНИЛС",
  responsible_position: "Должность",
  responsible_main_workplace: "Основное место работы",
  responsible_region: "Регион ответственного",
  responsible_login: "Логин НМФО",
  responsible_password: "Пароль НМФО",
};