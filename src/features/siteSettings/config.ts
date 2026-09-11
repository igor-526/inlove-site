export const SITE_ROUTES = [
  { href: "/", label: "Главная" },
  { href: "/uslugi/zanyatiya", label: "Занятия" },
  { href: "/uslugi/progulki", label: "Прогулки" },
  { href: "/uslugi/postoy", label: "Постой" },
  { href: "/loshadi", label: "Лошади" },
  { href: "/novosti", label: "Новости" },
  { href: "/about", label: "О клубе" },
] as const;

export const SITE_CONSUMER_CONFIG = {
  shortName: "ИНЛав",
  copyrightName: "Конный клуб «ИНЛав»",
  menu: SITE_ROUTES.map((item) => ({ ...item })),
  headerCtaLabel: "Записаться",
  callback: { title: "Записаться в клуб", submitLabel: "Отправить", successMessage: "Спасибо! Мы скоро свяжемся с вами.", consentText: "Я соглашаюсь с политикой обработки персональных данных", policyUrl: "/privacy" },
  seo: { defaultTitle: "Конный клуб «ИНЛав»", defaultDescription: "Конный клуб «Инлав»: занятия, прогулки, постой лошадей и жизнь клуба.", homeTitle: "Инлав", aboutTitle: "Инлав | О клубе", horsesTitle: "Инлав | Лошади", horsesDescription: "Лошади конного клуба «Инлав»: породы, характер и услуги, доступные с каждой лошадью.", newsTitle: "Инлав | Новости", newsDescription: "Новости и жизнь конного клуба «Инлав»." },
  home: { heroTitle: "Конный клуб «Инлав»", heroCtaLabel: "Записаться" },
  horses: { emptyText: "Скоро познакомим вас с лошадьми клуба", ctaLabel: "Записаться в клуб" },
  news: { emptyText: "Новостей пока нет", nextLabel: "Следующая страница", timezone: "Europe/Moscow" },
} as const;

export type SiteMenuItem = { href: string; label: string };
