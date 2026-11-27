import { createHmac, randomBytes, randomUUID, scryptSync, timingSafeEqual } from "node:crypto";

const VALID_GIFTS = new Set(["tea", "oil", "salt"]);
const SESSION_TTL_SEC = 60 * 60 * 24 * 30; // 30 days

export class ApiError extends Error {
  constructor(status, code, message) {
    super(message || code);
    this.status = status;
    this.code = code;
  }
}

export function hashPassword(password) {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, 64).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password, stored) {
  const [salt, expectedHex] = String(stored || "").split(":");
  if (!salt || !expectedHex) return false;
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHex, "hex");
  if (actual.length !== expected.length) return false;
  return timingSafeEqual(actual, expected);
}

function b64url(input) {
  return Buffer.from(input).toString("base64url");
}

export function signToken(payload, secret, ttlSec = SESSION_TTL_SEC) {
  const now = Math.floor(Date.now() / 1000);
  const body = { ...payload, iat: now, exp: now + ttlSec };
  const head = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const data = b64url(JSON.stringify(body));
  const sig = createHmac("sha256", secret).update(`${head}.${data}`).digest("base64url");
  return { token: `${head}.${data}.${sig}`, expiresAt: body.exp };
}

export function verifyToken(token, secret) {
  const parts = String(token || "").split(".");
  if (parts.length !== 3) return null;
  const [head, data, sig] = parts;
  const expected = createHmac("sha256", secret).update(`${head}.${data}`).digest();
  let actual;
  try {
    actual = Buffer.from(sig, "base64url");
  } catch {
    return null;
  }
  if (actual.length !== expected.length || !timingSafeEqual(actual, expected)) return null;
  try {
    const payload = JSON.parse(Buffer.from(data, "base64url").toString("utf8"));
    if (!payload?.sub || !payload?.exp || payload.exp < Math.floor(Date.now() / 1000)) return null;
    return payload;
  } catch {
    return null;
  }
}

function parseMasterEmails(csv) {
  return new Set(
    String(csv || "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter(Boolean),
  );
}

function cleanStr(v, maxLen) {
  return String(v ?? "").trim().slice(0, maxLen);
}

function header(headers, name) {
  if (!headers) return "";
  const lower = name.toLowerCase();
  for (const [k, v] of Object.entries(headers)) {
    if (k.toLowerCase() === lower) return Array.isArray(v) ? String(v[0] ?? "") : String(v ?? "");
  }
  return "";
}

function corsHeaders(reqOrigin, allowedOriginsCsv) {
  const list = String(allowedOriginsCsv || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  let allowOrigin = "*";
  if (!list.includes("*")) {
    allowOrigin = reqOrigin && list.includes(reqOrigin) ? reqOrigin : (list[0] ?? "*");
  }
  return {
    "Access-Control-Allow-Origin": allowOrigin,
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Max-Age": "86400",
    "Content-Type": "application/json; charset=utf-8",
    Vary: "Origin",
  };
}

export async function defaultSendTelegram({ botToken, chatId, text }) {
  if (!botToken || !chatId) return;
  try {
    const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId, text }),
      signal: AbortSignal.timeout(4000),
    });
    if (!res.ok) console.error("Telegram notify failed:", res.status);
  } catch (err) {
    console.error("Telegram notify error:", err?.message || err);
  }
}

function makeSession(user, isMaster, secret) {
  const { token, expiresAt } = signToken({ sub: user.id, email: user.email }, secret);
  return {
    user: { id: user.id, email: user.email, is_master: isMaster },
    access_token: token,
    expires_at: expiresAt,
  };
}

export function createBackendHandler(store, config) {
  const secret = config.jwtSecret;
  if (!secret || secret.length < 16) {
    throw new Error("JWT_SECRET must be set (at least 16 characters)");
  }
  const masterEmails = parseMasterEmails(config.masterEmails);
  const sendTg = config.sendTelegram || defaultSendTelegram;

  const isUserMaster = (user) => Boolean(user && (user.role === "master" || masterEmails.has(user.email.toLowerCase())));

  async function requireAuth(headers) {
    const auth = header(headers, "authorization");
    const m = /^Bearer\s+(.+)$/i.exec(auth);
    if (!m) throw new ApiError(401, "unauthorized", "Требуется вход в кабинет.");
    const claims = verifyToken(m[1], secret);
    if (!claims) throw new ApiError(401, "unauthorized", "Сессия истекла. Войдите снова.");
    const user = await store.getUserById(claims.sub);
    if (!user) throw new ApiError(401, "unauthorized", "Аккаунт не найден.");
    return { user, isMaster: isUserMaster(user) };
  }

  async function dispatch(action, payload, headers) {
    const p = payload && typeof payload === "object" ? payload : {};

    switch (action) {
      case "health":
        return { ok: true };

      case "auth.signUp": {
        const email = cleanStr(p.email, 200).toLowerCase();
        const password = String(p.password ?? "");
        const fullName = cleanStr(p.full_name, 100);
        const phone = cleanStr(p.phone, 50);

        if (!email || !email.includes("@")) throw new ApiError(400, "validation_error", "Укажите корректную почту.");
        if (password.length < 6) throw new ApiError(400, "validation_error", "Пароль должен быть не короче 6 символов.");

        const existing = await store.getUserByEmail(email);
        if (existing) throw new ApiError(409, "already_registered", "Такая почта уже есть — просто войдите.");

        const now = new Date().toISOString();
        const id = randomUUID();
        const role = masterEmails.has(email) ? "master" : "client";
        const user = { id, email, password_hash: hashPassword(password), role, created_at: now };
        const profile = {
          id,
          full_name: fullName,
          phone,
          telegram: "",
          oil: "",
          tea: "",
          pressure: "",
          silence: false,
          wishes: "",
          offline: false,
          created_at: now,
        };
        await store.createUserWithProfile(user, profile);

        await sendTg({
          botToken: config.tgBotToken,
          chatId: config.tgChatId,
          text: `🌿 Новый клиент в кабинете: ${fullName || "без имени"}${phone ? ` · ${phone}` : ""}`,
        });

        return { session: makeSession(user, isUserMaster(user), secret) };
      }

      case "auth.signIn": {
        const email = cleanStr(p.email, 200).toLowerCase();
        const password = String(p.password ?? "");
        const user = await store.getUserByEmail(email);
        if (!user || !verifyPassword(password, user.password_hash)) {
          throw new ApiError(401, "invalid_credentials", "Почта или пароль не подошли. Попробуйте ещё раз.");
        }
        return { session: makeSession(user, isUserMaster(user), secret) };
      }

      case "auth.session": {
        const { user, isMaster } = await requireAuth(headers);
        return { user: { id: user.id, email: user.email, is_master: isMaster } };
      }

      case "booking.create": {
        const name = cleanStr(p.name, 100);
        const contact = cleanStr(p.contact, 100);
        const service = cleanStr(p.service, 200);
        const wishTime = cleanStr(p.wish_time, 200);
        const comment = cleanStr(p.comment, 1000);
        if (name.length < 1 || contact.length < 3) {
          throw new ApiError(400, "validation_error", "Укажите имя и контакт для связи.");
        }
        const reqRow = {
          id: randomUUID(),
          name,
          contact,
          service,
          wish_time: wishTime,
          comment,
          done: false,
          created_at: new Date().toISOString(),
        };
        await store.createBookingRequest(reqRow);

        const parts = [`📅 Заявка на запись: ${name} · ${contact}`];
        if (service) parts.push(`Услуга: ${service}`);
        if (wishTime) parts.push(`Когда удобно: ${wishTime}`);
        if (comment) parts.push(comment);
        await sendTg({
          botToken: config.tgBotToken,
          chatId: config.tgChatId,
          text: parts.join("\n"),
        });

        return { ok: true };
      }

      case "cabinet.get": {
        const { user, isMaster } = await requireAuth(headers);
        const data = await store.getClientBundle(user.id, { includeNotes: false });
        return {
          is_master: isMaster,
          profile: data.profile,
          subscriptions: data.subscriptions,
          visits: data.visits,
          gift_claims: data.gift_claims,
        };
      }

      case "cabinet.updateProfile": {
        const { user } = await requireAuth(headers);
        const patch = {
          full_name: cleanStr(p.full_name, 100),
          phone: cleanStr(p.phone, 50),
          telegram: cleanStr(p.telegram, 100).replace(/^@/, ""),
          oil: cleanStr(p.oil, 200),
          tea: cleanStr(p.tea, 200),
          pressure: cleanStr(p.pressure, 100),
          silence: Boolean(p.silence),
          wishes: cleanStr(p.wishes, 1000),
        };
        const profile = await store.updateProfile(user.id, patch);
        return { profile };
      }

      case "garden.gifts": {
        const { user } = await requireAuth(headers);
        const data = await store.getClientBundle(user.id, { includeNotes: false });
        return {
          visits_count: data.visits.length,
          claimed: data.gift_claims.map((g) => g.gift),
        };
      }

      case "master.overview": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const [requests, clients] = await Promise.all([store.listOpenRequests(), store.listProfiles()]);
        return { requests, clients };
      }

      case "master.doneRequest": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const id = cleanStr(p.id, 100);
        if (!id) throw new ApiError(400, "validation_error", "Не указан id заявки.");
        await store.markRequestDone(id);
        return { ok: true };
      }

      case "master.createClient": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const fullName = cleanStr(p.full_name, 100);
        if (!fullName) throw new ApiError(400, "validation_error", "Укажите имя клиента.");

        const now = new Date().toISOString();
        const clientId = randomUUID();
        const profile = {
          id: clientId,
          full_name: fullName,
          phone: cleanStr(p.phone, 50),
          telegram: cleanStr(p.telegram, 100).replace(/^@/, ""),
          oil: "",
          tea: "",
          pressure: "",
          silence: false,
          wishes: "",
          offline: true,
          created_at: now,
        };
        await store.createProfile(profile);

        const noteText = cleanStr(p.note, 1000);
        if (noteText) {
          await store.createNote({ id: randomUUID(), client_id: clientId, body: noteText, created_at: now });
        }
        if (p.subscription && Number(p.subscription.total_sessions) > 0) {
          const total = Math.max(1, Math.floor(Number(p.subscription.total_sessions)));
          const left = Math.min(total, Math.max(0, Math.floor(Number(p.subscription.left_sessions ?? total))));
          await store.createSubscription({
            id: randomUUID(),
            client_id: clientId,
            title: cleanStr(p.subscription.title, 200) || "Абонемент",
            total_sessions: total,
            used_sessions: total - left,
            expires_on: p.subscription.expires_on ? cleanStr(p.subscription.expires_on, 20) : null,
            created_at: now,
          });
        }

        return { profile };
      }

      case "master.getClient": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const clientId = cleanStr(p.client_id, 100);
        if (!clientId) throw new ApiError(400, "validation_error", "Не указан client_id.");
        return store.getClientBundle(clientId, { includeNotes: true });
      }

      case "master.linkOfflineProfile": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const offlineId = cleanStr(p.offline_id, 100);
        const email = cleanStr(p.email, 200).toLowerCase();
        if (!offlineId || !email) throw new ApiError(400, "validation_error", "Укажите почту клиента.");
        const linked = await store.linkOfflineProfile(offlineId, email);
        return { profile: linked };
      }

      case "master.addSubscription": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const clientId = cleanStr(p.client_id, 100);
        const title = cleanStr(p.title, 200);
        const total = Math.floor(Number(p.total_sessions));
        if (!clientId || !title || !Number.isFinite(total) || total < 1) {
          throw new ApiError(400, "validation_error", "Проверьте параметры абонемента.");
        }
        const sub = {
          id: randomUUID(),
          client_id: clientId,
          title,
          total_sessions: total,
          used_sessions: 0,
          expires_on: p.expires_on ? cleanStr(p.expires_on, 20) : null,
          created_at: new Date().toISOString(),
        };
        await store.createSubscription(sub);
        return { subscription: sub };
      }

      case "master.useSession": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const subId = cleanStr(p.sub_id, 100);
        const service = cleanStr(p.service, 200);
        if (!subId) throw new ApiError(400, "validation_error", "Не указан абонемент.");
        const left = await store.useSession(subId, service);
        return { left };
      }

      case "master.addVisit": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const clientId = cleanStr(p.client_id, 100);
        if (!clientId) throw new ApiError(400, "validation_error", "Не указан client_id.");
        const now = new Date().toISOString();
        const visit = {
          id: randomUUID(),
          client_id: clientId,
          visited_on: now.slice(0, 10),
          service: cleanStr(p.service, 200) || "Сеанс",
          comment: cleanStr(p.comment, 500),
          created_at: now,
        };
        await store.createVisit(visit);
        return { visit };
      }

      case "master.addNote": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const clientId = cleanStr(p.client_id, 100);
        const body = cleanStr(p.body, 1000);
        if (!clientId || !body) throw new ApiError(400, "validation_error", "Пустая заметка.");
        const note = { id: randomUUID(), client_id: clientId, body, created_at: new Date().toISOString() };
        await store.createNote(note);
        return { note };
      }

      case "master.claimGift": {
        const { isMaster } = await requireAuth(headers);
        if (!isMaster) throw new ApiError(403, "forbidden", "Этот раздел только для мастера.");
        const clientId = cleanStr(p.client_id, 100);
        const gift = cleanStr(p.gift, 20);
        if (!clientId || !VALID_GIFTS.has(gift)) throw new ApiError(400, "validation_error", "Некорректный подарок.");
        const now = new Date().toISOString();
        const claim = {
          id: randomUUID(),
          client_id: clientId,
          gift,
          claimed_on: now.slice(0, 10),
          created_at: now,
        };
        await store.createGiftClaim(claim);
        return { claim };
      }

      default:
        throw new ApiError(400, "unknown_action", "Неизвестное действие.");
    }
  }

  return async function handle(event) {
    const method = String(event?.httpMethod || "POST").toUpperCase();
    const reqOrigin = header(event?.headers, "origin");
    const headers = corsHeaders(reqOrigin, config.allowedOrigins);

    if (method === "OPTIONS") {
      return { statusCode: 204, headers, body: "" };
    }

    try {
      let action = event?.queryStringParameters?.action || "";
      let payload = {};

      if (method === "GET") {
        action ||= "health";
      } else {
        const rawBody = event?.isBase64Encoded
          ? Buffer.from(event.body || "", "base64").toString("utf8")
          : String(event?.body || "{}");
        const parsed = rawBody.trim() ? JSON.parse(rawBody) : {};
        action = action || parsed.action || "";
        payload = parsed.payload ?? parsed;
      }

      const data = await dispatch(action, payload, event?.headers);
      return { statusCode: 200, headers, body: JSON.stringify({ data }) };
    } catch (err) {
      if (err instanceof ApiError) {
        return {
          statusCode: err.status,
          headers,
          body: JSON.stringify({ error: { code: err.code, message: err.message } }),
        };
      }
      if (err instanceof SyntaxError) {
        return {
          statusCode: 400,
          headers,
          body: JSON.stringify({ error: { code: "bad_json", message: "Некорректный формат запроса." } }),
        };
      }
      console.error("Unhandled backend error:", err);
      return {
        statusCode: 500,
        headers,
        body: JSON.stringify({ error: { code: "internal_error", message: "Внутренняя ошибка сервера." } }),
      };
    }
  };
}
