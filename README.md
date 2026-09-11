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

Обе переменные являются build-time public configuration Next.js. Release workflow
проверяет абсолютный HTTP(S) API URL и непустой selector до login/push/deploy,
не выводя их значения. Dockerfile повторяет проверку, поэтому иной путь сборки
тоже не сможет создать production image с пустой конфигурацией. Поздняя передача
этих `NEXT_PUBLIC_*` через Helm не заменяет пересборку browser bundle.

Локальная проверка production artifact выполняется с контролируемым тестовым
selector (реальные значения не нужны и не должны попадать в репозиторий):

```shell
npm run test:deployment
```

Сайт не должен передавать CMS cookie или `Authorization`. Единственное
согласованное публичное write-исключение — anonymous `POST /callback_requests`.

## Observability

Sentry выключен по умолчанию. Для включения задайте `SENTRY_ENABLED=true` и
настройте `SENTRY_DSN`, `SENTRY_ENVIRONMENT`, `SENTRY_TRACES_SAMPLE_RATE` и
`SENTRY_RELEASE` через окружение. Секреты в репозиторий не добавляются.

## Deployment

Release destination остаётся заданным существующими workflow и Helm values.
Public API configuration встроена в image на build stage; Helm runtime env для
неё намеренно не добавляется.

Git-репозиторий внутри этого каталога не инициализирован. Remote URL и запись в
`services.manifest` пользователь добавляет самостоятельно вне этого change.
