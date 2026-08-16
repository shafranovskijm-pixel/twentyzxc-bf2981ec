import {
  ArrowUpRight,
  BookOpen,
  FileCheck2,
  GraduationCap,
  MessageCircle,
  Smartphone,
  Users,
} from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Слушатели", text: "Карточки, группы и история обучения" },
  { icon: GraduationCap, title: "Курсы", text: "Программы, материалы и контроль прохождения" },
  { icon: FileCheck2, title: "Документы", text: "Договоры, приказы и итоговые документы" },
  { icon: BookOpen, title: "Отчётность", text: "Данные для ФРДО и рабочие реестры" },
];

const SyntagmaLogo = () => (
  <img
    src="/brand/syntagma-logo.png"
    alt="Синтагма"
    width="311"
    height="77"
    className="h-auto w-[250px] max-w-full"
  />
);

const LandingSyntagma = () => (
  <section id="syntagma" className="scroll-mt-20 border-b border-border bg-background">
    <div className="container px-4 py-16 md:py-20">
      <div className="grid gap-10 lg:grid-cols-[0.92fr_1.08fr] lg:items-center lg:gap-14">
        <div>
          <SyntagmaLogo />
          <p className="mt-7 text-xs uppercase tracking-[0.24em] text-[#189b82]">Продукт 24ZXC</p>
          <h2 className="mt-3 text-3xl font-display font-semibold tracking-tight text-foreground md:text-5xl">
            Учебный центр в одной системе
          </h2>
          <p className="mt-4 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
            От заявки слушателя и обучения до документов, реестров и отчётности — без разрозненных таблиц и сервисов.
          </p>

          <div className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2">
            {FEATURES.map((feature) => {
              const Icon = feature.icon;
              return (
                <div key={feature.title} className="border-t border-border pt-4">
                  <div className="flex items-center gap-2">
                    <Icon className="h-4 w-4 text-[#189b82]" />
                    <h3 className="text-sm font-semibold text-foreground">{feature.title}</h3>
                  </div>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.text}</p>
                </div>
              );
            })}
          </div>

          <a
            href="https://синтагма.рф"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 inline-flex items-center gap-2 rounded-md bg-[#55cdb1] px-5 py-3 text-sm font-semibold text-[#111216] transition-opacity hover:opacity-90"
          >
            Посмотреть Синтагму
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="overflow-hidden rounded-lg border border-[#cfe9e2] bg-[#f1fbf8]">
          <div className="grid items-end gap-8 px-6 pt-7 sm:grid-cols-[1fr_220px] sm:px-8 sm:pt-8 lg:grid-cols-[1fr_250px]">
            <div className="pb-2 sm:pb-9">
              <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#189b82] shadow-sm ring-1 ring-[#cfe9e2]">
                <Smartphone className="h-5 w-5" />
              </div>
              <p className="mt-5 text-xs font-semibold uppercase tracking-[0.22em] text-[#189b82]">
                Мобильное приложение
              </p>
              <h3 className="mt-3 text-2xl font-display font-semibold tracking-tight text-foreground">
                Синтагма в телефоне
              </h3>
              <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                Разрабатываем приложение для смартфонов: курсы, вебинары, 3D-материалы, чат и профиль слушателя всегда под рукой.
              </p>
              <ul className="mt-5 space-y-3 text-sm text-foreground">
                <li className="flex items-center gap-2"><GraduationCap className="h-4 w-4 text-[#189b82]" /> Обучение и прогресс</li>
                <li className="flex items-center gap-2"><MessageCircle className="h-4 w-4 text-[#189b82]" /> Чат и уведомления</li>
              </ul>
            </div>

            <img
              src="/brand/syntagma-mobile-app.png"
              alt="Мобильное приложение Синтагма на смартфоне"
              width="446"
              height="641"
              loading="lazy"
              className="mx-auto w-full max-w-[250px] self-end sm:mx-0"
            />
          </div>
        </div>
      </div>
    </div>
  </section>
);

export default LandingSyntagma;
