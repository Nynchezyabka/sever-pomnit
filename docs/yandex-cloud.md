# Размещение сайта на Yandex Cloud Object Storage (0 ₽/мес)

Сайт собирается в статические HTML-страницы (SSG + пререндеринг публичных маршрутов `/`, `/menu`, `/master`, `/sad`, `/privacy`) и работает в России без привязки к Lovable или Layero. Личный кабинет (`/kabinet`) и картотека (`/kartoteka`) работают из браузера напрямую с Supabase.

---

## 1. Создание бакета в Yandex Cloud

1. Войдите в консоль **console.yandex.cloud** (при регистрации потребуется привязать карту; при объёме сайта до 1 ГБ и небольшом трафике хранение укладывается в бесплатный уровень free tier).
2. Перейдите в **Object Storage → Создать бакет**:
   - **Имя:** если подключаете свой домен (например `sever-pomnit.ru`), назовите бакет **точно как домен** (`sever-pomnit.ru`). Это требование Yandex Cloud для работы HTTPS на своём домене.
   - **Доступ на чтение объектов:** `Публичный` (чтобы посетители и поисковики могли открывать страницы).
   - **Класс хранилища:** `Стандартное`.
3. Откройте созданный бакет → вкладка **Веб-сайт**:
   - Включите **Хостинг**.
   - **Главная страница:** `index.html`
   - **Страница ошибок:** `404.html`
   - Сохраните настройки.

После этого сайт уже будет доступен по техническому адресу вида `https://<имя-бакета>.website.yandexcloud.net`.

---

## 2. Подключение своего домена и бесплатного HTTPS

Для нормальной индексации в Яндексе и Google лучше подключить свой домен (например `sever-pomnit.ru`):

1. В **Yandex Certificate Manager** создайте или выпустите бесплатный **Let's Encrypt** сертификат на `sever-pomnit.ru` и `www.sever-pomnit.ru` (подтверждение через TXT-запись в DNS).
2. Откройте ваш бакет в **Object Storage → Веб-сайт → HTTPS**:
   - Выберите выпущенный сертификат и сохраните.
3. В DNS вашего домена (у регистратора или в Yandex Cloud DNS) пропишите:
   - Для корневого домена `@`: `ANAME` (если регистратор поддерживает) на `<имя-бакета>.website.yandexcloud.net` — или перенесите NS-записи домена в **Yandex Cloud DNS**, где `ANAME` работает бесплатно и настраивается в 2 клика.
   - Для `www`: `CNAME` на `<имя-бакета>.website.yandexcloud.net`.
4. В **Supabase → Authentication → URL Configuration** обновите **Site URL** на ваш новый адрес (например `https://sever-pomnit.ru`), чтобы ссылки подтверждения почты вели на правильный домен.

---

## 3. Сервисный аккаунт для автодеплоя

1. В каталоге Yandex Cloud перейдите в **IAM → Сервисные аккаунты → Создать сервисный аккаунт** (например `site-deployer`).
2. Назначьте ему роль **`storage.editor`** на ваш каталог или бакет.
3. Откройте созданный сервисный аккаунт → **Создать новый ключ → Создать статический ключ доступа**.
4. Сохраните:
   - Идентификатор ключа (`YC_ACCESS_KEY_ID`)
   - Секретный ключ (`YC_SECRET_ACCESS_KEY`)

---

## 4. Автоматическая публикация из GitHub (GitHub Actions)

В репозитории уже добавлен workflow `.github/workflows/deploy-yandex.yml` и скрипт `scripts/deploy-yandex.mjs`, который:
- выставляет правильные `Content-Type` (чтобы CSS, JS, WebP и шрифты открывались корректно);
- задаёт `Cache-Control` (долгое кеширование для `assets/*`, быстрое обновление для HTML);
- дублирует `<route>/index.html` в ключ `<route>` без слеша на конце, чтобы ссылки вида `/menu`, `/master`, `/sad` открывались с кодом **200 OK** (критично для SEO и Яндекс Вебмастера);
- удаляет устаревшие файлы от прошлых сборок.

В настройках репозитория на GitHub (**Settings → Secrets and variables → Actions**) добавьте:

### Secrets (секреты):
- `YC_BUCKET` — имя бакета (например `sever-pomnit.ru`)
- `YC_ACCESS_KEY_ID` — идентификатор статического ключа
- `YC_SECRET_ACCESS_KEY` — секретный ключ

### Variables (переменные сборки):
- `VITE_SITE_URL` — публичный адрес сайта без слеша в конце (например `https://sever-pomnit.ru`). Используется для `sitemap.xml`, `robots.txt`, `canonical` и `og:url`.
- `VITE_SUPABASE_URL` — Project URL из Supabase (**Project Settings → API**)
- `VITE_SUPABASE_PUBLISHABLE_KEY` — publishable / anon key из Supabase

После каждого `git push` в ветку `main` сайт соберётся и автоматически обновится в Yandex Object Storage.

---

## 5. Локальная сборка и ручной деплой (при необходимости)

```bash
npm install
VITE_SITE_URL=https://sever-pomnit.ru \
VITE_SUPABASE_URL=https://xxxx.supabase.co \
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_xxx \
npm run build
```

Чтобы выгрузить папку `dist/client` вручную с компьютера:

```bash
YC_BUCKET=sever-pomnit.ru \
YC_ACCESS_KEY_ID=... \
YC_SECRET_ACCESS_KEY=... \
npm run deploy:yandex
```
