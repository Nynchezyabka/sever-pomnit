import { randomUUID } from "node:crypto";
import ydb from "ydb-sdk";
import { ApiError } from "./core.mjs";

const { AUTO_TX, Driver, TypedData, TypedValues, Types, getCredentialsFromEnv } = ydb;

const TX_RW = { serializableReadWrite: {} };

function toRows(resultSet) {
  if (!resultSet?.rows?.length) return [];
  return TypedData.createNativeObjects(resultSet).map((row) => ({ ...row }));
}

function optUtf8(v) {
  return v ? TypedValues.optional(TypedValues.utf8(String(v))) : TypedValues.optionalNull(Types.UTF8);
}

let driverPromise = null;

async function getDriver(endpoint, database) {
  if (!endpoint || !database) {
    throw new Error("YDB_ENDPOINT and YDB_DATABASE must be set");
  }
  if (!driverPromise) {
    driverPromise = (async () => {
      const authService = getCredentialsFromEnv();
      const driver = new Driver({ endpoint, database, authService });
      const ok = await driver.ready(10000);
      if (!ok) {
        driverPromise = null;
        throw new Error("YDB driver did not become ready within 10s");
      }
      return driver;
    })();
  }
  return driverPromise;
}

export function createYdbStore({ endpoint, database }) {
  async function withSession(fn) {
    const driver = await getDriver(endpoint, database);
    return driver.tableClient.withSessionRetry(fn, 10000, 3);
  }

  async function query(sql, params = {}, txControl = AUTO_TX) {
    return withSession((s) => s.executeQuery(sql, params, txControl));
  }

  return {
    async getUserById(id) {
      const res = await query(
        `DECLARE $id AS Utf8;
         SELECT id, email, password_hash, role, created_at FROM users WHERE id = $id LIMIT 1;`,
        { $id: TypedValues.utf8(id) },
      );
      return toRows(res.resultSets[0])[0] ?? null;
    },

    async getUserByEmail(email) {
      const res = await query(
        `DECLARE $email AS Utf8;
         SELECT id, email, password_hash, role, created_at
         FROM users VIEW idx_users_email
         WHERE email = $email LIMIT 1;`,
        { $email: TypedValues.utf8(email) },
      );
      return toRows(res.resultSets[0])[0] ?? null;
    },

    async createUserWithProfile(user, profile) {
      await withSession(async (s) => {
        const tx = await s.beginTransaction(TX_RW);
        try {
          await s.executeQuery(
            `DECLARE $id AS Utf8; DECLARE $email AS Utf8; DECLARE $password_hash AS Utf8;
             DECLARE $role AS Utf8; DECLARE $created_at AS Utf8;
             INSERT INTO users (id, email, password_hash, role, created_at)
             VALUES ($id, $email, $password_hash, $role, $created_at);`,
            {
              $id: TypedValues.utf8(user.id),
              $email: TypedValues.utf8(user.email),
              $password_hash: TypedValues.utf8(user.password_hash),
              $role: TypedValues.utf8(user.role),
              $created_at: TypedValues.utf8(user.created_at),
            },
            { txId: tx.id },
          );
          await s.executeQuery(
            `DECLARE $id AS Utf8; DECLARE $full_name AS Utf8; DECLARE $phone AS Utf8;
             DECLARE $telegram AS Utf8; DECLARE $oil AS Utf8; DECLARE $tea AS Utf8;
             DECLARE $pressure AS Utf8; DECLARE $silence AS Bool; DECLARE $wishes AS Utf8;
             DECLARE $offline AS Bool; DECLARE $created_at AS Utf8;
             INSERT INTO profiles (id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at)
             VALUES ($id, $full_name, $phone, $telegram, $oil, $tea, $pressure, $silence, $wishes, $offline, $created_at);`,
            {
              $id: TypedValues.utf8(profile.id),
              $full_name: TypedValues.utf8(profile.full_name),
              $phone: TypedValues.utf8(profile.phone),
              $telegram: TypedValues.utf8(profile.telegram),
              $oil: TypedValues.utf8(profile.oil),
              $tea: TypedValues.utf8(profile.tea),
              $pressure: TypedValues.utf8(profile.pressure),
              $silence: TypedValues.bool(profile.silence),
              $wishes: TypedValues.utf8(profile.wishes),
              $offline: TypedValues.bool(profile.offline),
              $created_at: TypedValues.utf8(profile.created_at),
            },
            { txId: tx.id },
          );
          await s.commitTransaction({ txId: tx.id });
        } catch (err) {
          await s.rollbackTransaction({ txId: tx.id }).catch(() => {});
          throw err;
        }
      });
    },

    async createBookingRequest(row) {
      await query(
        `DECLARE $id AS Utf8; DECLARE $name AS Utf8; DECLARE $contact AS Utf8;
         DECLARE $service AS Utf8; DECLARE $wish_time AS Utf8; DECLARE $comment AS Utf8;
         DECLARE $done AS Bool; DECLARE $created_at AS Utf8;
         INSERT INTO booking_requests (id, name, contact, service, wish_time, comment, done, created_at)
         VALUES ($id, $name, $contact, $service, $wish_time, $comment, $done, $created_at);`,
        {
          $id: TypedValues.utf8(row.id),
          $name: TypedValues.utf8(row.name),
          $contact: TypedValues.utf8(row.contact),
          $service: TypedValues.utf8(row.service),
          $wish_time: TypedValues.utf8(row.wish_time),
          $comment: TypedValues.utf8(row.comment),
          $done: TypedValues.bool(row.done),
          $created_at: TypedValues.utf8(row.created_at),
        },
      );
    },

    async listOpenRequests() {
      const res = await query(
        `SELECT id, name, contact, service, wish_time, comment, done, created_at
         FROM booking_requests VIEW idx_booking_done
         WHERE done = false
         ORDER BY created_at DESC;`,
      );
      return toRows(res.resultSets[0]);
    },

    async markRequestDone(id) {
      await query(
        `DECLARE $id AS Utf8;
         UPDATE booking_requests SET done = true WHERE id = $id;`,
        { $id: TypedValues.utf8(id) },
      );
    },

    async listProfiles() {
      const res = await query(
        `SELECT id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at
         FROM profiles
         ORDER BY created_at DESC;`,
      );
      return toRows(res.resultSets[0]);
    },

    async createProfile(profile) {
      await query(
        `DECLARE $id AS Utf8; DECLARE $full_name AS Utf8; DECLARE $phone AS Utf8;
         DECLARE $telegram AS Utf8; DECLARE $oil AS Utf8; DECLARE $tea AS Utf8;
         DECLARE $pressure AS Utf8; DECLARE $silence AS Bool; DECLARE $wishes AS Utf8;
         DECLARE $offline AS Bool; DECLARE $created_at AS Utf8;
         INSERT INTO profiles (id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at)
         VALUES ($id, $full_name, $phone, $telegram, $oil, $tea, $pressure, $silence, $wishes, $offline, $created_at);`,
        {
          $id: TypedValues.utf8(profile.id),
          $full_name: TypedValues.utf8(profile.full_name),
          $phone: TypedValues.utf8(profile.phone),
          $telegram: TypedValues.utf8(profile.telegram),
          $oil: TypedValues.utf8(profile.oil),
          $tea: TypedValues.utf8(profile.tea),
          $pressure: TypedValues.utf8(profile.pressure),
          $silence: TypedValues.bool(profile.silence),
          $wishes: TypedValues.utf8(profile.wishes),
          $offline: TypedValues.bool(profile.offline),
          $created_at: TypedValues.utf8(profile.created_at),
        },
      );
    },

    async updateProfile(id, patch) {
      await query(
        `DECLARE $id AS Utf8; DECLARE $full_name AS Utf8; DECLARE $phone AS Utf8;
         DECLARE $telegram AS Utf8; DECLARE $oil AS Utf8; DECLARE $tea AS Utf8;
         DECLARE $pressure AS Utf8; DECLARE $silence AS Bool; DECLARE $wishes AS Utf8;
         UPDATE profiles SET
           full_name = $full_name, phone = $phone, telegram = $telegram,
           oil = $oil, tea = $tea, pressure = $pressure, silence = $silence, wishes = $wishes
         WHERE id = $id;`,
        {
          $id: TypedValues.utf8(id),
          $full_name: TypedValues.utf8(patch.full_name),
          $phone: TypedValues.utf8(patch.phone),
          $telegram: TypedValues.utf8(patch.telegram),
          $oil: TypedValues.utf8(patch.oil),
          $tea: TypedValues.utf8(patch.tea),
          $pressure: TypedValues.utf8(patch.pressure),
          $silence: TypedValues.bool(patch.silence),
          $wishes: TypedValues.utf8(patch.wishes),
        },
      );
      const res = await query(
        `DECLARE $id AS Utf8;
         SELECT id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at
         FROM profiles WHERE id = $id LIMIT 1;`,
        { $id: TypedValues.utf8(id) },
      );
      return toRows(res.resultSets[0])[0] ?? null;
    },

    async getClientBundle(clientId, { includeNotes }) {
      const params = { $client_id: TypedValues.utf8(clientId) };
      const queries = [
        `DECLARE $client_id AS Utf8;
         SELECT id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at
         FROM profiles WHERE id = $client_id LIMIT 1;
         SELECT id, client_id, title, total_sessions, used_sessions, expires_on, created_at
         FROM subscriptions VIEW idx_subs_client WHERE client_id = $client_id ORDER BY created_at DESC;
         SELECT id, client_id, visited_on, service, comment, created_at
         FROM visits VIEW idx_visits_client WHERE client_id = $client_id ORDER BY visited_on DESC, created_at DESC;
         SELECT id, client_id, gift, claimed_on, created_at
         FROM gift_claims VIEW idx_gifts_client WHERE client_id = $client_id ORDER BY created_at DESC;`,
      ];
      if (includeNotes) {
        queries.push(
          `SELECT id, client_id, body, created_at
           FROM client_notes VIEW idx_notes_client WHERE client_id = $client_id ORDER BY created_at DESC;`,
        );
      }
      const res = await query(queries.join("\n"), params);
      return {
        profile: toRows(res.resultSets[0])[0] ?? null,
        subscriptions: toRows(res.resultSets[1]),
        visits: toRows(res.resultSets[2]),
        gift_claims: toRows(res.resultSets[3]),
        notes: includeNotes ? toRows(res.resultSets[4]) : [],
      };
    },

    async createSubscription(sub) {
      await query(
        `DECLARE $id AS Utf8; DECLARE $client_id AS Utf8; DECLARE $title AS Utf8;
         DECLARE $total_sessions AS Int32; DECLARE $used_sessions AS Int32;
         DECLARE $expires_on AS Optional<Utf8>; DECLARE $created_at AS Utf8;
         INSERT INTO subscriptions (id, client_id, title, total_sessions, used_sessions, expires_on, created_at)
         VALUES ($id, $client_id, $title, $total_sessions, $used_sessions, $expires_on, $created_at);`,
        {
          $id: TypedValues.utf8(sub.id),
          $client_id: TypedValues.utf8(sub.client_id),
          $title: TypedValues.utf8(sub.title),
          $total_sessions: TypedValues.int32(sub.total_sessions),
          $used_sessions: TypedValues.int32(sub.used_sessions),
          $expires_on: optUtf8(sub.expires_on),
          $created_at: TypedValues.utf8(sub.created_at),
        },
      );
    },

    async useSession(subId, service) {
      return withSession(async (s) => {
        const tx = await s.beginTransaction(TX_RW);
        try {
          const res = await s.executeQuery(
            `DECLARE $id AS Utf8;
             SELECT id, client_id, title, total_sessions, used_sessions FROM subscriptions WHERE id = $id LIMIT 1;`,
            { $id: TypedValues.utf8(subId) },
            { txId: tx.id },
          );
          const sub = toRows(res.resultSets[0])[0];
          if (!sub) throw new ApiError(404, "not_found", "Абонемент не найден.");
          if (sub.used_sessions >= sub.total_sessions) {
            throw new ApiError(400, "no_sessions_left", "Сеансы по этому абонементу уже закончились.");
          }
          const nextUsed = sub.used_sessions + 1;
          const now = new Date().toISOString();
          await s.executeQuery(
            `DECLARE $id AS Utf8; DECLARE $used AS Int32;
             UPDATE subscriptions SET used_sessions = $used WHERE id = $id;`,
            { $id: TypedValues.utf8(subId), $used: TypedValues.int32(nextUsed) },
            { txId: tx.id },
          );
          await s.executeQuery(
            `DECLARE $id AS Utf8; DECLARE $client_id AS Utf8; DECLARE $visited_on AS Utf8;
             DECLARE $service AS Utf8; DECLARE $comment AS Utf8; DECLARE $created_at AS Utf8;
             INSERT INTO visits (id, client_id, visited_on, service, comment, created_at)
             VALUES ($id, $client_id, $visited_on, $service, $comment, $created_at);`,
            {
              $id: TypedValues.utf8(randomUUID()),
              $client_id: TypedValues.utf8(sub.client_id),
              $visited_on: TypedValues.utf8(now.slice(0, 10)),
              $service: TypedValues.utf8(service || sub.title),
              $comment: TypedValues.utf8(""),
              $created_at: TypedValues.utf8(now),
            },
            { txId: tx.id },
          );
          await s.commitTransaction({ txId: tx.id });
          return sub.total_sessions - nextUsed;
        } catch (err) {
          await s.rollbackTransaction({ txId: tx.id }).catch(() => {});
          throw err;
        }
      });
    },

    async createVisit(visit) {
      await query(
        `DECLARE $id AS Utf8; DECLARE $client_id AS Utf8; DECLARE $visited_on AS Utf8;
         DECLARE $service AS Utf8; DECLARE $comment AS Utf8; DECLARE $created_at AS Utf8;
         INSERT INTO visits (id, client_id, visited_on, service, comment, created_at)
         VALUES ($id, $client_id, $visited_on, $service, $comment, $created_at);`,
        {
          $id: TypedValues.utf8(visit.id),
          $client_id: TypedValues.utf8(visit.client_id),
          $visited_on: TypedValues.utf8(visit.visited_on),
          $service: TypedValues.utf8(visit.service),
          $comment: TypedValues.utf8(visit.comment),
          $created_at: TypedValues.utf8(visit.created_at),
        },
      );
    },

    async createNote(note) {
      await query(
        `DECLARE $id AS Utf8; DECLARE $client_id AS Utf8; DECLARE $body AS Utf8; DECLARE $created_at AS Utf8;
         INSERT INTO client_notes (id, client_id, body, created_at)
         VALUES ($id, $client_id, $body, $created_at);`,
        {
          $id: TypedValues.utf8(note.id),
          $client_id: TypedValues.utf8(note.client_id),
          $body: TypedValues.utf8(note.body),
          $created_at: TypedValues.utf8(note.created_at),
        },
      );
    },

    async createGiftClaim(claim) {
      const existing = await query(
        `DECLARE $client_id AS Utf8; DECLARE $gift AS Utf8;
         SELECT id FROM gift_claims VIEW idx_gifts_client WHERE client_id = $client_id AND gift = $gift LIMIT 1;`,
        { $client_id: TypedValues.utf8(claim.client_id), $gift: TypedValues.utf8(claim.gift) },
      );
      if (toRows(existing.resultSets[0]).length > 0) return;

      await query(
        `DECLARE $id AS Utf8; DECLARE $client_id AS Utf8; DECLARE $gift AS Utf8;
         DECLARE $claimed_on AS Utf8; DECLARE $created_at AS Utf8;
         INSERT INTO gift_claims (id, client_id, gift, claimed_on, created_at)
         VALUES ($id, $client_id, $gift, $claimed_on, $created_at);`,
        {
          $id: TypedValues.utf8(claim.id),
          $client_id: TypedValues.utf8(claim.client_id),
          $gift: TypedValues.utf8(claim.gift),
          $claimed_on: TypedValues.utf8(claim.claimed_on),
          $created_at: TypedValues.utf8(claim.created_at),
        },
      );
    },

    async linkOfflineProfile(offlineId, email) {
      return withSession(async (s) => {
        const tx = await s.beginTransaction(TX_RW);
        try {
          const offRes = await s.executeQuery(
            `DECLARE $id AS Utf8;
             SELECT id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at
             FROM profiles WHERE id = $id AND offline = true LIMIT 1;`,
            { $id: TypedValues.utf8(offlineId) },
            { txId: tx.id },
          );
          const off = toRows(offRes.resultSets[0])[0];
          if (!off) throw new ApiError(404, "offline_profile_not_found", "Эта карточка уже связана с аккаунтом.");

          const userRes = await s.executeQuery(
            `DECLARE $email AS Utf8;
             SELECT id FROM users VIEW idx_users_email WHERE email = $email LIMIT 1;`,
            { $email: TypedValues.utf8(email) },
            { txId: tx.id },
          );
          const targetUser = toRows(userRes.resultSets[0])[0];
          if (!targetUser) {
            throw new ApiError(404, "account_not_found", "Аккаунт с такой почтой не найден.");
          }
          const targetId = targetUser.id;
          if (targetId === offlineId) throw new ApiError(400, "same_profile", "Это один и тот же профиль.");

          const tgtRes = await s.executeQuery(
            `DECLARE $target_id AS Utf8; DECLARE $offline_id AS Utf8;
             SELECT id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at
             FROM profiles WHERE id = $target_id LIMIT 1;
             SELECT id, gift, claimed_on, created_at FROM gift_claims VIEW idx_gifts_client WHERE client_id = $target_id;
             SELECT id, gift, claimed_on, created_at FROM gift_claims VIEW idx_gifts_client WHERE client_id = $offline_id;`,
            { $target_id: TypedValues.utf8(targetId), $offline_id: TypedValues.utf8(offlineId) },
            { txId: tx.id },
          );
          const cur = toRows(tgtRes.resultSets[0])[0];
          const existingGifts = new Set(toRows(tgtRes.resultSets[1]).map((g) => g.gift));
          const offlineGifts = toRows(tgtRes.resultSets[2]);

          const merged = {
            id: targetId,
            full_name: cur?.full_name || off.full_name,
            phone: cur?.phone || off.phone,
            telegram: cur?.telegram || off.telegram,
            oil: cur?.oil || off.oil,
            tea: cur?.tea || off.tea,
            pressure: cur?.pressure || off.pressure,
            silence: Boolean(cur?.silence || off.silence),
            wishes: cur?.wishes || off.wishes,
            offline: false,
            created_at: cur?.created_at || off.created_at,
          };

          await s.executeQuery(
            `DECLARE $id AS Utf8; DECLARE $full_name AS Utf8; DECLARE $phone AS Utf8;
             DECLARE $telegram AS Utf8; DECLARE $oil AS Utf8; DECLARE $tea AS Utf8;
             DECLARE $pressure AS Utf8; DECLARE $silence AS Bool; DECLARE $wishes AS Utf8;
             DECLARE $offline AS Bool; DECLARE $created_at AS Utf8;
             UPSERT INTO profiles (id, full_name, phone, telegram, oil, tea, pressure, silence, wishes, offline, created_at)
             VALUES ($id, $full_name, $phone, $telegram, $oil, $tea, $pressure, $silence, $wishes, $offline, $created_at);`,
            {
              $id: TypedValues.utf8(merged.id),
              $full_name: TypedValues.utf8(merged.full_name),
              $phone: TypedValues.utf8(merged.phone),
              $telegram: TypedValues.utf8(merged.telegram),
              $oil: TypedValues.utf8(merged.oil),
              $tea: TypedValues.utf8(merged.tea),
              $pressure: TypedValues.utf8(merged.pressure),
              $silence: TypedValues.bool(merged.silence),
              $wishes: TypedValues.utf8(merged.wishes),
              $offline: TypedValues.bool(false),
              $created_at: TypedValues.utf8(merged.created_at),
            },
            { txId: tx.id },
          );

          await s.executeQuery(
            `DECLARE $target_id AS Utf8; DECLARE $offline_id AS Utf8;
             UPDATE subscriptions SET client_id = $target_id WHERE client_id = $offline_id;
             UPDATE visits SET client_id = $target_id WHERE client_id = $offline_id;
             UPDATE client_notes SET client_id = $target_id WHERE client_id = $offline_id;`,
            { $target_id: TypedValues.utf8(targetId), $offline_id: TypedValues.utf8(offlineId) },
            { txId: tx.id },
          );

          for (const g of offlineGifts) {
            if (!existingGifts.has(g.gift)) {
              await s.executeQuery(
                `DECLARE $id AS Utf8; DECLARE $target_id AS Utf8;
                 UPDATE gift_claims SET client_id = $target_id WHERE id = $id;`,
                { $id: TypedValues.utf8(g.id), $target_id: TypedValues.utf8(targetId) },
                { txId: tx.id },
              );
            } else {
              await s.executeQuery(
                `DECLARE $id AS Utf8;
                 DELETE FROM gift_claims WHERE id = $id;`,
                { $id: TypedValues.utf8(g.id) },
                { txId: tx.id },
              );
            }
          }

          await s.executeQuery(
            `DECLARE $offline_id AS Utf8;
             DELETE FROM profiles WHERE id = $offline_id AND offline = true;`,
            { $offline_id: TypedValues.utf8(offlineId) },
            { txId: tx.id },
          );

          await s.commitTransaction({ txId: tx.id });
          return merged;
        } catch (err) {
          await s.rollbackTransaction({ txId: tx.id }).catch(() => {});
          throw err;
        }
      });
    },
  };
}
