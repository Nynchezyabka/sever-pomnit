import { createBackendHandler } from "./core.mjs";
import { createYdbStore } from "./ydb-store.mjs";

let cachedHandler = null;

function getHandler() {
  if (!cachedHandler) {
    const store = createYdbStore({
      endpoint: process.env.YDB_ENDPOINT || "grpcs://ydb.serverless.yandexcloud.net:2135",
      database: process.env.YDB_DATABASE,
    });
    cachedHandler = createBackendHandler(store, {
      jwtSecret: process.env.JWT_SECRET,
      masterEmails: process.env.MASTER_EMAILS,
      tgBotToken: process.env.TG_BOT_TOKEN,
      tgChatId: process.env.TG_CHAT_ID,
      allowedOrigins: process.env.ALLOWED_ORIGINS || "*",
    });
  }
  return cachedHandler;
}

export async function handler(event) {
  return getHandler()(event);
}
