import type { LucideIcon } from "lucide-react";
import { Code2, Layers, ShoppingBag, AppWindow, GraduationCap, FileCheck, Megaphone, BadgeCheck } from "lucide-react";

export interface LandingService {
  title: string;
  price: string;
  description: string;
  href: string;
  icon: LucideIcon;
}

export const WEB_SERVICES: LandingService[] = [
  { title: "Лендинги", price: "от 15 000 ₽", description: "Продающие страницы с высокой конверсией", href: "/services/landing", icon: Code2 },
  { title: "Корпоративные сайты", price: "от 50 000 ₽", description: "Многостраничные решения для бизнеса", href: "/services/corporate", icon: Layers },
  { title: "Интернет-магазины", price: "от 100 000 ₽", description: "E-commerce платформы любой сложности", href: "/services/ecommerce", icon: ShoppingBag },
  { title: "Веб-приложения", price: "индивидуально", description: "SPA, PWA и сложные системы", href: "/services/webapp", icon: AppWindow },
];

export const EDU_SERVICES: LandingService[] = [
  { title: "ФИС ФРДО", price: "сопровождение", description: "Ведение реестра документов об образовании", href: "/frdo", icon: FileCheck },
  { title: "Лицензирование", price: "под ключ", description: "Образовательная лицензия без отказов", href: "/licensing", icon: BadgeCheck },
  { title: "НМО Портал", price: "35 000 ₽", description: "Регистрация и размещение программ", href: "/services/nmo", icon: GraduationCap },
  { title: "Реклама", price: "от 20 000 ₽", description: "Яндекс Директ: настройка и ведение", href: "/#advertising", icon: Megaphone },
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
    metric: "×2",
    metricLabel: "месяца до окупаемости",
    tags: ["E-commerce", "Яндекс Директ", "800+ SKU"],
    result: "Окупаемость рекламы за 2 месяца, поддержка 5 000 ₽/мес.",
    url: "/projects/spinride",
  },
  {
    title: "Анна Чмулева",
    subtitle: "Риелтор • Личный бренд",
    metric: "24/7",
    metricLabel: "автоблог + CRM",
    tags: ["Сайт", "ИИ-помощник", "CRM"],
    result: "Блог пишется автоматически, рост входящих заявок.",
    url: "/projects/chmuleva",
  },
  {
    title: "Flowrish",
    subtitle: "Цветочный магазин",
    metric: "7",
    metricLabel: "сезонных тем",
    tags: ["E-commerce", "Админка", "Авто-темы"],
    result: "Продажи 24/7, витрина обновляется без участия владельца.",
    url: "/projects/flowrish",
  },
  {
    title: "УЦ «Статус»",
    subtitle: "Образование • Под ключ",
    metric: "65k",
    metricLabel: "₽/год за сопровождение",
    tags: ["LMS", "ФРДО", "Лицензирование"],
    result: "Запуск без простоев, фиксированная цена 65 000 ₽/год.",
    url: "/projects/status",
  },
];