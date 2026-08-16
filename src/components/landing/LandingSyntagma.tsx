import { ArrowUpRight, BookOpenCheck, FileCheck2, GraduationCap, Users } from "lucide-react";

const FEATURES = [
  { icon: Users, title: "Слушатели", text: "Карточки, группы и история обучения" },
  { icon: GraduationCap, title: "Курсы", text: "Программы, материалы и контроль прохождения" },
  { icon: FileCheck2, title: "Документы", text: "Договоры, приказы и итоговые документы" },
  { icon: BookOpenCheck, title: "Отчётность", text: "Данные для ФРДО и рабочие реестры" },
];

const SyntagmaMark = () => (
  <svg viewBox="0 0 96 96" className="h-16 w-16" role="img" aria-label="Знак Синтагмы">
    <path
      d="M16 31c13-3 24 1 32 10v25c-8-8-19-12-32-9V31Zm64 0c-13-3-24 1-32 10v25c8-8 19-12 32-9V31Z"
      fill="#171A22"
    />
    <path
      d="m31 68-10 6 20 12 12-7m12-11 10 6-20 12-8-5"
      fill="none"
      stroke="#55CDB1"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="m36 21 8 8 17-18"
      fill="none"
      stroke="#55CDB1"
      strokeWidth="7"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LandingSyntagma = () => (
  <section id="syntagma" className="scroll-mt-20 border-b border-[#2b303a] bg-[#171a22] text-[#f7f4ec]">
    <div className="container px-4 py-16 md:py-20">
      <div className="grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center lg:gap-16">
        <div>
          <div className="inline-flex rounded-2xl bg-[#f7f4ec] p-3">
            <SyntagmaMark />
          </div>
          <p className="mt-6 text-xs uppercase tracking-[0.24em] text-[#55cdb1]">Продукт 24ZXC</p>
          <h2 className="mt-3 text-3xl font-display font-semibold tracking-tight md:text-5xl">
            Синтагма
          </h2>
          <p className="mt-4 max-w-xl text-lg leading-relaxed text-[#bfc4cf]">
            Учебный центр в одной системе: от заявки слушателя до документов и отчётности.
          </p>
          <a
            href="https://синтагма.рф"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-7 inline-flex items-center gap-2 rounded-md bg-[#55cdb1] px-5 py-3 text-sm font-semibold text-[#171a22] transition-opacity hover:opacity-90"
          >
            Посмотреть Синтагму
            <ArrowUpRight className="h-4 w-4" />
          </a>
        </div>

        <div className="grid gap-px overflow-hidden rounded-lg border border-[#303641] bg-[#303641] sm:grid-cols-2">
          {FEATURES.map((feature) => {
            const Icon = feature.icon;
            return (
              <div key={feature.title} className="bg-[#1d212a] p-6">
                <Icon className="h-5 w-5 text-[#55cdb1]" />
                <h3 className="mt-5 font-medium text-[#f7f4ec]">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-[#aeb5c2]">{feature.text}</p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  </section>
);

export default LandingSyntagma;
