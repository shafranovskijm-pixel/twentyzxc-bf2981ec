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
  Smartphone,
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
  {
    title: "Мобильное приложение",
    price: "по смете",
    description: "Приложения для смартфонов: личный кабинет, обучение, уведомления и работа с данными.",
    href: "/services/webapp",
    icon: Smartphone,
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
  label: string;
  challenge: string;
  solution: string;
  tags: string[];
  result: string;
  url: string;
  external?: boolean;
}

export const LANDING_CASES: LandingCase[] = [
  {
    title: "ALISTA",
    subtitle: "Импорт автомобилей из Японии, Кореи и Китая",
    label: "Сайт + CRM",
    challenge: "Объединить публичный каталог автомобилей и работу менеджеров — от первого обращения до выдачи машины.",
    solution: "Сайт с каталогом и калькулятором, формы заявок и CRM для обработки обращений, расчётов, документов и статусов сделки.",
    tags: ["Каталог", "Калькулятор", "CRM", "Заявки"],
    result: "Клиент видит понятный путь покупки, а команда ведёт каждую заявку в одном рабочем контуре.",
    url: "https://alistaru.ru/",
    external: true,
  },
  {
    title: "Samson Car",
    subtitle: "CRM для автосервиса",
    label: "CRM для СТО",
    challenge: "Ускорить приём автомобиля: быстро выбрать точную модификацию, рассчитать работы и сохранить заказ.",
    solution: "CRM с подбором год → марка → модель → кузов, базой услуг, расчётом стоимости и карточкой клиента и автомобиля.",
    tags: ["CRM", "Автобаза", "Расчёт работ", "Клиенты"],
    result: "Мастер-приёмщик оформляет расчёт в одном окне, а история клиента и автомобиля остаётся в системе.",
    url: "https://samson-car.ru/",
    external: true,
  },
  {
    title: "Синтагма",
    subtitle: "Цифровая платформа учебного центра",
    label: "EdTech-продукт",
    challenge: "Собрать обучение, слушателей, документы и обязательную отчётность в одной понятной системе.",
    solution: "Разработали LMS и рабочий кабинет учебного центра; сейчас дополняем продукт мобильным приложением для слушателей.",
    tags: ["LMS", "Документы", "ФРДО", "Mobile"],
    result: "Сотрудники и слушатели работают в едином процессе — от заявки и курса до итоговых документов.",
    url: "https://синтагма.рф",
    external: true,
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
