# Stage 1: Dependencies and build
FROM node:20-alpine AS builder

WORKDIR /app

# Копируем файлы для установки зависимостей
COPY package*.json ./
COPY tsconfig.json ./
COPY next.config.ts ./
COPY postcss.config.mjs ./

# Устанавливаем зависимости
RUN npm ci

# Копируем весь исходный код
COPY . .

# Устанавливаем переменные окружения для сборки
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY
ARG SENTRY_ENABLED=false
ARG SENTRY_DSN=
ARG SENTRY_ENVIRONMENT=
ARG SENTRY_TRACES_SAMPLE_RATE=0
ARG SENTRY_RELEASE=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY=$NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY
ENV SENTRY_ENABLED=$SENTRY_ENABLED
ENV SENTRY_DSN=$SENTRY_DSN
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ENV SENTRY_TRACES_SAMPLE_RATE=$SENTRY_TRACES_SAMPLE_RATE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Собираем приложение
RUN npm run build

# Stage 2: Production image
FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY
ARG SENTRY_ENABLED=false
ARG SENTRY_DSN=
ARG SENTRY_ENVIRONMENT=
ARG SENTRY_TRACES_SAMPLE_RATE=0
ARG SENTRY_RELEASE=
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY=$NEXT_PUBLIC_EQUESTRIAN_SERVICE_KEY
ENV SENTRY_ENABLED=$SENTRY_ENABLED
ENV SENTRY_DSN=$SENTRY_DSN
ENV SENTRY_ENVIRONMENT=$SENTRY_ENVIRONMENT
ENV SENTRY_TRACES_SAMPLE_RATE=$SENTRY_TRACES_SAMPLE_RATE
ENV SENTRY_RELEASE=$SENTRY_RELEASE

# Устанавливаем nginx и supervisor
RUN apk add --no-cache nginx supervisor

# Копируем собранное приложение
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/next.config.ts ./next.config.ts
COPY --from=builder /app/tsconfig.json ./tsconfig.json

# Создаем директории для nginx
RUN mkdir -p /var/log/nginx /var/lib/nginx /run/nginx

# Создаем скрипт для генерации конфигурации nginx с динамическими портами
RUN echo '#!/bin/sh' > /app/generate-nginx-config.sh && \
    echo 'NGINX_PORT=${PORT:-3000}' >> /app/generate-nginx-config.sh && \
    echo 'NEXTJS_PORT=${NEXTJS_PORT:-3001}' >> /app/generate-nginx-config.sh && \
    echo 'cat > /etc/nginx/http.d/default.conf <<"NGINXEOF"' >> /app/generate-nginx-config.sh && \
    echo 'server {' >> /app/generate-nginx-config.sh && \
    echo '    listen NGINX_PORT_PLACEHOLDER;' >> /app/generate-nginx-config.sh && \
    echo '    server_name _;' >> /app/generate-nginx-config.sh && \
    echo '' >> /app/generate-nginx-config.sh && \
    echo '    location / {' >> /app/generate-nginx-config.sh && \
    echo '        proxy_pass http://127.0.0.1:NEXTJS_PORT_PLACEHOLDER;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_http_version 1.1;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_set_header Upgrade $http_upgrade;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_set_header Connection "upgrade";' >> /app/generate-nginx-config.sh && \
    echo '        proxy_set_header Host $host;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_set_header X-Real-IP $remote_addr;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_set_header X-Forwarded-Proto $scheme;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_cache_bypass $http_upgrade;' >> /app/generate-nginx-config.sh && \
    echo '    }' >> /app/generate-nginx-config.sh && \
    echo '' >> /app/generate-nginx-config.sh && \
    echo '    location /_next/static {' >> /app/generate-nginx-config.sh && \
    echo '        proxy_pass http://127.0.0.1:NEXTJS_PORT_PLACEHOLDER;' >> /app/generate-nginx-config.sh && \
    echo '        proxy_cache_valid 200 60m;' >> /app/generate-nginx-config.sh && \
    echo '        add_header Cache-Control "public, immutable";' >> /app/generate-nginx-config.sh && \
    echo '    }' >> /app/generate-nginx-config.sh && \
    echo '}' >> /app/generate-nginx-config.sh && \
    echo 'NGINXEOF' >> /app/generate-nginx-config.sh && \
    echo 'sed -i "s/NGINX_PORT_PLACEHOLDER/$NGINX_PORT/g; s/NEXTJS_PORT_PLACEHOLDER/$NEXTJS_PORT/g" /etc/nginx/http.d/default.conf' >> /app/generate-nginx-config.sh && \
    chmod +x /app/generate-nginx-config.sh

# Создаем конфигурацию supervisor для управления процессами
RUN mkdir -p /etc/supervisor/conf.d && \
    echo '[supervisord]' > /etc/supervisor/conf.d/supervisord.conf && \
    echo 'nodaemon=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nginx]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=/usr/sbin/nginx -g "daemon off;"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo '[program:nextjs]' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'command=/bin/sh -c "exec node_modules/.bin/next start -p ${NEXTJS_PORT:-3001}"' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'directory=/app' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autostart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'autorestart=true' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile=/dev/stdout' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stdout_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile=/dev/stderr' >> /etc/supervisor/conf.d/supervisord.conf && \
    echo 'stderr_logfile_maxbytes=0' >> /etc/supervisor/conf.d/supervisord.conf

# Создаем скрипт запуска
RUN echo '#!/bin/sh' > /app/start.sh && \
    echo '/app/generate-nginx-config.sh' >> /app/start.sh && \
    echo 'exec /usr/bin/supervisord -c /etc/supervisor/conf.d/supervisord.conf' >> /app/start.sh && \
    chmod +x /app/start.sh

# PORT - внешний порт nginx внутри контейнера; NEXTJS_PORT - внутренний порт Next.js
ENV PORT=3000
ENV NEXTJS_PORT=3001

EXPOSE 3000

CMD ["/app/start.sh"]
