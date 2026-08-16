import type { LucideIcon } from "lucide-react";
import {
  AppWindow,
  BadgeCheck,
  Code2,
  FileCheck,
  GraduationCap,
  Layers,
  Megaphone,
  ShoppingBag,
} from "lucide-react";

export interface LandingService {
  title: string;
  price: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const WEB_SERVICES: LandingService[] = [
  {
    title: "Лендинг",
    price: "от 15 000 ₽",
    description: "Одна ясная страница для запуска услуги или рекламы.",
    href: "/services/landing",
    icon: Code2,
  },
  {
    title: "Корпоративный сайт",
    price: "от 50 000 ₽",
    description: "Структура, услуги, кейсы, формы и базовая SEO-подготовка.",
    href: "/services/corporate",
    icon: Layers,
  },
  {
    title: "Интернет-магазин",
    price: "от 100 000 ₽",
    description: "Каталог, корзина, оплата и управление товарами.",
    href: "/services/ecommerce",
    icon: ShoppingBag,
  },
  {
    title: "Яндекс Директ",
    price: "от 20 000 ₽",
    description: "Подготовка кампании, аналитика и понятные отчёты.",
    href: "/#contact",
    icon: Megaphone,
  },
  {
    title: "Веб-приложение",
    price: "по смете",
    description: "CRM, личные кабинеты и автоматизация процессов.",
    href: "/services/webapp",
    icon: AppWindow,
  },
];

export const EDU_SERVICES: LandingService[] = [
  {
    title: "ФИС ФРДО",
    price: "24 000 ₽/год",
    description: "Выгрузки, проверка данных и сопровождение без простоев.",
    href: "/frdo",
    icon: FileCheck,
  },
  {
    title: "Лицензирование",
    price: "от 50 000 ₽",
    description: "Документы и сопровождение от анализа до результата.",
    href: "/licensing",
    icon: BadgeCheck,
  },
  {
    title: "НМО Портал",
    price: "35 000 ₽",
    description: "Регистрация организации и размещение программ под ключ.",
    href: "/services/nmo",
    icon: GraduationCap,
  },
];

export interface LandingCase {
  title: string;
  subtitle: string;
  metric: string;
  metricLabel: string;
  tags: string[];
  result: string;
  url: string;
  external?: boolean;
}

export const LANDING_CASES: LandingCase[] = [
  {
    title: "Синтагма",
    subtitle: "Учебный центр • LMS",
    metric: "−80%",
    metricLabel: "ручной работы",
    tags: ["LMS", "ФРДО", "Облако"],
    result: "1000+ слушателей в месяц, отчётность в один клик.",
    url: "https://синтагма.рф",
    external: true,
  },
  {
    title: "SpinRide",
    subtitle: "Велосипеды и самокаты",
    metric: "2 мес.",
    metricLabel: "до окупаемости",
    tags: ["E-commerce", "Яндекс Директ", "800+ SKU"],
    result: "Окупаемость рекламы за два месяца и поддержка проекта.",
    url: "/projects/spinride",
  },
  {
    title: "УЦ «Статус»",
    subtitle: "Образование • Под ключ",
    metric: "65 тыс.",
    metricLabel: "₽ в год",
    tags: ["LMS", "ФРДО", "Лицензирование"],
    result: "Платформа и сопровождение учебного центра в одном договоре.",
    url: "/projects/status",
  },
  {
    title: "Анна Чмулева",
    subtitle: "Риелтор • Личный бренд",
    metric: "24/7",
    metricLabel: "сайт и CRM",
    tags: ["Сайт", "ИИ-помощник", "CRM"],
    result: "Автоматизированы публикации и обработка входящих обращений.",
    url: "/projects/chmuleva",
  },
];

export const LANDING_FAQS = [
  {
    question: "Можно ли узнать точную цену до начала работ?",
    answer: "Да. После короткого брифа мы фиксируем состав работ, этапы, сроки и стоимость в договоре.",
  },
  {
    question: "Можно заказать только одну услугу?",
    answer: "Да. Можно начать с сайта, рекламы, ФИС ФРДО или отдельной автоматизации и расширить проект позже.",
  },
  {
    question: "Работаете с организациями из других регионов?",
    answer: "Да. Работаем дистанционно по всей России, документы и этапы согласовываем онлайн.",
  },
  {
    question: "Что потребуется от меня для старта?",
    answer: "Цель проекта, контактное лицо и доступные материалы. Если материалов нет, поможем собрать структуру и приоритеты.",
  },
];
