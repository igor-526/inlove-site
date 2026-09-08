# site-ksk-inlove

Нейтральный Next.js-каркас публичного сайта-потребителя EqSiteCMS для InLove.
Stand-домен: `inlove-stand.eqcms.ru`. Он указан только для документации и не
используется как runtime fallback.

## Public API configuration

Перед запуском обязательно задайте:

```dotenv
NEXT_PUBLIC_API_BASE_URL=https://example.invalid/api
NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY=replace-with-tenant-selector
```

`NEXT_PUBLIC_API_BASE_URL` — абсолютный URL Public Read API с префиксом `/api`.
`NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY` — обязательный non-secret tenant selector,
передаваемый как `X-Equestrian-Service-Key`. У него нет значения по умолчанию:
при отсутствии или неверном selector backend возвращает `401`.

Сайт не должен передавать CMS cookie или `Authorization`. Единственное
согласованное публичное write-исключение — anonymous `POST /callback_requests`.

## Observability

Sentry выключен по умолчанию. Для включения задайте `SENTRY_ENABLED=true` и
настройте `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` и
`SENTRY_RELEASE` через окружение. Секреты в репозиторий не добавляются.

## Deployment blocked

`.helm/**` и `.github/**` побайтово унаследованы от `site-ad` и сохраняют его
deployment identity. Их запрещено использовать для deployment InLove до
отдельного утверждённого change, который адаптирует Helm и GitHub Actions.

Git-репозиторий внутри этого каталога не инициализирован. Remote URL и запись в
`services.manifest` пользователь добавляет самостоятельно вне этого change.
