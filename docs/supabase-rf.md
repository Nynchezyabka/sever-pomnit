# Перенос базы данных (Supabase) на российский сервер

По 152-ФЗ персональные данные граждан РФ (имена, телефоны, почта, история визитов) должны первично храниться на серверах в России. Код сайта уже не привязан к облаку Supabase.com — он общается с базой только по двум переменным сборки: `VITE_SUPABASE_URL` и `VITE_SUPABASE_PUBLISHABLE_KEY`.

Самый простой способ оставить всю текущую логику кабинета, картотеки, RLS-защиты и уведомлений в Telegram без переписывания кода — развернуть **open-source Supabase** на российском VPS.

---

## 1. Аренда VPS в РФ
- Подойдёт любой российский провайдер: **Timeweb Cloud**, **Selectel**, **Yandex Cloud**, **Beget**.
- Минимальная рекомендуемая конфигурация под self-hosted Supabase (Docker): **2 vCPU, 4 ГБ RAM, 30+ ГБ SSD**, ОС Ubuntu 24.04 LTS (обычно ~500–800 ₽/мес).
- Для удобства выделите поддомен, например `api.sever-pomnit.ru`, и направьте его A-запись на IP сервера.

---

## 2. Установка self-hosted Supabase на сервер

```bash
# На сервере (Ubuntu)
sudo apt update && sudo apt install -y git docker.io docker-compose-v2 caddy
git clone --depth 1 https://github.com/supabase/supabase
cd supabase/docker
cp .env.example .env
```

В `.env` обязательно сгенерируйте и замените секреты (по официальной документации Supabase Docker):
- `POSTGRES_PASSWORD`
- `JWT_SECRET` (минимум 32 символа)
- `ANON_KEY` и `SERVICE_ROLE_KEY` (сгенерировать под ваш `JWT_SECRET`)
- `SITE_URL=https://sever-pomnit.ru`
- `API_EXTERNAL_URL=https://api.sever-pomnit.ru`
- `ADDITIONAL_REDIRECT_URLS=https://sever-pomnit.ru/kabinet`
- При отключённом подтверждении почты: `ENABLE_EMAIL_AUTOCONFIRM=true`

Запуск:
```bash
docker compose pull
docker compose up -d
```

---

## 3. HTTPS-прокси (Caddy)
В `/etc/caddy/Caddyfile` достаточно прописать 3 строки — Caddy сам получит и будет продлевать сертификат Let's Encrypt:

```caddyfile
api.sever-pomnit.ru {
    reverse_proxy localhost:8000
}
```

После `sudo systemctl reload caddy` API будет доступен по `https://api.sever-pomnit.ru`.

---

## 4. Инициализация схемы и переключение сайта

1. Откройте Supabase Studio на сервере (или подключитесь к Postgres напрямую) и выполните целиком `supabase/setup.sql`.
2. Если в старом Supabase уже были данные, перенесите их через `pg_dump` / `pg_restore` (схема `auth` и `public`).
3. В настройках GitHub-репозитория (**Settings → Secrets and variables → Actions → Variables**) обновите:
   - `VITE_SUPABASE_URL` = `https://api.sever-pomnit.ru`
   - `VITE_SUPABASE_PUBLISHABLE_KEY` = ваш сгенерированный `ANON_KEY`
4. Перезапустите workflow деплоя в GitHub Actions (вкладка **Actions → Run workflow**).

---

## 5. Уведомление в Роскомнадзор
После размещения базы на российском сервере оператору персональных данных (Александре) нужно подать уведомление об обработке ПДн на портале **pd.rkn.gov.ru** через Госуслуги (бесплатно) и, при желании, добавить её ИНН в `src/routes/privacy.tsx`.
