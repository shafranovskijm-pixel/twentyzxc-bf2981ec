import { Helmet } from "react-helmet-async";
import Footer from "@/components/Footer";
import Header from "@/components/Header";
import LandingCases from "@/components/landing/LandingCases";
import LandingContact from "@/components/landing/LandingContact";
import LandingFaq from "@/components/landing/LandingFaq";
import LandingHero from "@/components/landing/LandingHero";
import LandingServices from "@/components/landing/LandingServices";
import LandingSyntagma from "@/components/landing/LandingSyntagma";
import { LANDING_CASES, LANDING_FAQS } from "@/components/landing/landing-data";

const SEO_TITLE = "Создание сайтов, Яндекс Директ и ФИС ФРДО — 24ZXC";
const SEO_DESCRIPTION =
  "24ZXC создаёт сайты, CRM и мобильные приложения, настраивает Яндекс Директ и сопровождает образовательные организации: ФИС ФРДО, лицензирование и НМО.";

const ORGANIZATION_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "Organization",
  "@id": "https://24zxc.ru/#organization",
  name: "24ZXC",
  url: "https://24zxc.ru/",
  logo: "https://24zxc.ru/favicon.png",
  description: SEO_DESCRIPTION,
  areaServed: "RU",
  sameAs: ["https://t.me/Aliencorso"],
  contactPoint: [
    {
      "@type": "ContactPoint",
      telephone: "+7-914-721-34-24",
      email: "24@24zxc.ru",
      contactType: "sales",
      areaServed: "RU",
      availableLanguage: ["Russian"],
    },
  ],
};

const SERVICES_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Услуги 24ZXC",
  itemListElement: [
    { name: "Лендинг под ключ", price: "15000", variable: true, url: "https://24zxc.ru/services/landing" },
    { name: "Корпоративный сайт", price: "50000", variable: true, url: "https://24zxc.ru/services/corporate" },
    { name: "Интернет-магазин", price: "100000", variable: true, url: "https://24zxc.ru/services/ecommerce" },
    { name: "Яндекс Директ", price: "20000", variable: true, url: "https://24zxc.ru/#services" },
    { name: "Сопровождение ФИС ФРДО", price: "24000", variable: false, url: "https://24zxc.ru/frdo" },
    { name: "Лицензирование", price: "50000", variable: true, url: "https://24zxc.ru/licensing" },
    { name: "Регистрация на НМО Портале", price: "35000", variable: false, url: "https://24zxc.ru/services/nmo" },
  ].map((service, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "Service",
      name: service.name,
      url: service.url,
      provider: { "@id": "https://24zxc.ru/#organization" },
      offers: service.variable
        ? {
            "@type": "AggregateOffer",
            lowPrice: service.price,
            priceCurrency: "RUB",
            url: service.url,
          }
        : {
            "@type": "Offer",
            price: service.price,
            priceCurrency: "RUB",
            url: service.url,
          },
    },
  })),
};

const FAQ_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: LANDING_FAQS.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: {
      "@type": "Answer",
      text: faq.answer,
    },
  })),
};

const CASES_SCHEMA = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Кейсы 24ZXC",
  itemListElement: LANDING_CASES.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    item: {
      "@type": "CreativeWork",
      name: `${item.title} — ${item.subtitle}`,
      description: `${item.challenge} ${item.solution} Результат: ${item.result}`,
      url: item.url,
      creator: { "@id": "https://24zxc.ru/#organization" },
    },
  })),
};

const Index = () => (
  <>
    <Helmet>
      <html lang="ru" />
      <title>{SEO_TITLE}</title>
      <meta name="description" content={SEO_DESCRIPTION} />
      <meta name="robots" content="index, follow, max-image-preview:large" />
      <link rel="canonical" href="https://24zxc.ru/" />
      <meta property="og:title" content={SEO_TITLE} />
      <meta property="og:description" content={SEO_DESCRIPTION} />
      <meta property="og:url" content="https://24zxc.ru/" />
      <meta property="og:type" content="website" />
      <meta property="og:locale" content="ru_RU" />
      <meta property="og:image" content="https://24zxc.ru/og-image.png" />
      <meta name="twitter:card" content="summary_large_image" />
      <script type="application/ld+json">{JSON.stringify(ORGANIZATION_SCHEMA)}</script>
      <script type="application/ld+json">{JSON.stringify(SERVICES_SCHEMA)}</script>
      <script type="application/ld+json">{JSON.stringify(CASES_SCHEMA)}</script>
      <script type="application/ld+json">{JSON.stringify(FAQ_SCHEMA)}</script>
    </Helmet>

    <div className="landing-light min-h-screen bg-background text-foreground">
      <Header />
      <main>
        <LandingHero />
        <LandingServices />
        <LandingSyntagma />
        <LandingCases />
        <LandingFaq />
        <LandingContact />
      </main>
      <Footer />
    </div>
  </>
);

export default Index;
