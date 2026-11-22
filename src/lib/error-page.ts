export function renderErrorPage(): string {
  return `<!doctype html>
<html lang="ru">
  <head>
    <meta charset="utf-8" />
    <title>Страница не загрузилась · Север помнит</title>
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <style>
      body { font: 16px/1.6 Nunito, system-ui, sans-serif; background: #2a2d24; color: #efe6d2; display: grid; place-items: center; min-height: 100vh; margin: 0; padding: 1.5rem; }
      .card { max-width: 28rem; width: 100%; text-align: center; padding: 2rem; border: 1px solid rgba(232,170,80,.3); border-radius: 2rem; background: rgba(255,255,255,.03); }
      h1 { font: 500 1.75rem/1.2 Lora, Georgia, serif; margin: 0 0 .75rem; }
      p { color: #c9bfa8; margin: 0 0 1.5rem; }
      .actions { display: flex; gap: .5rem; justify-content: center; flex-wrap: wrap; }
      a, button { padding: .7rem 1.4rem; border-radius: 999px; font: inherit; cursor: pointer; text-decoration: none; border: 1px solid transparent; }
      .primary { background: #e8aa50; color: #2a2d24; }
      .secondary { background: transparent; color: #efe6d2; border-color: rgba(232,170,80,.5); }
    </style>
  </head>
  <body>
    <div class="card">
      <h1>Страница не&nbsp;загрузилась</h1>
      <p>Что-то пошло не&nbsp;так. Попробуйте обновить страницу или вернитесь на&nbsp;главную.</p>
      <div class="actions">
        <button class="primary" onclick="location.reload()">Обновить</button>
        <a class="secondary" href="/">На главную</a>
      </div>
    </div>
  </body>
</html>`;
}
