// Deploys dist/client to Yandex Cloud Object Storage with proper MIME types,
// cache headers, and extensionless clean-URL keys for prerendered routes.
import {
  DeleteObjectsCommand,
  ListObjectsV2Command,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const MIME_TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".mjs": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".webmanifest": "application/manifest+json; charset=utf-8",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
  ".svg": "image/svg+xml; charset=utf-8",
  ".webp": "image/webp",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".png": "image/png",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
};

function requireEnv(name) {
  const val = process.env[name]?.trim();
  if (!val) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return val;
}

function walkDir(dir, prefix = "") {
  const entries = readdirSync(dir, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);
    const relKey = prefix ? `${prefix}/${entry.name}` : entry.name;
    if (entry.isDirectory()) {
      files.push(...walkDir(fullPath, relKey));
    } else if (entry.isFile()) {
      files.push({ key: relKey, filePath: fullPath });
    }
  }
  return files;
}

function getCacheControl(key) {
  if (key.startsWith("assets/")) return "public, max-age=31536000, immutable";
  if (key.startsWith("images/") || /\.(png|ico|webp|jpe?g)$/i.test(key)) {
    return "public, max-age=604800";
  }
  return "public, max-age=60, must-revalidate";
}

function getContentType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return MIME_TYPES[ext] ?? "application/octet-stream";
}

async function runPool(items, concurrency, worker) {
  let idx = 0;
  async function next() {
    while (idx < items.length) {
      const current = items[idx++];
      await worker(current);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, next));
}

async function main() {
  const bucket = requireEnv("YC_BUCKET");
  const accessKeyId = requireEnv("YC_ACCESS_KEY_ID");
  const secretAccessKey = requireEnv("YC_SECRET_ACCESS_KEY");
  const endpoint = process.env.YC_ENDPOINT?.trim() || "https://storage.yandexcloud.net";
  const region = process.env.YC_REGION?.trim() || "ru-central1";
  const deleteStale = process.env.YC_DELETE_STALE !== "false";

  const distDir = path.resolve("dist/client");
  if (!existsSync(path.join(distDir, "index.html"))) {
    throw new Error("dist/client/index.html not found. Run `npm run build` first.");
  }

  const rawFiles = walkDir(distDir);
  const uploads = [];
  for (const file of rawFiles) {
    uploads.push({
      key: file.key,
      filePath: file.filePath,
      contentType: getContentType(file.filePath),
      cacheControl: getCacheControl(file.key),
    });

    // Also upload `<route>/index.html` under extensionless `<route>` key so
    // Yandex Object Storage serves clean URLs (e.g. /menu) with HTTP 200.
    if (file.key.endsWith("/index.html")) {
      const cleanKey = file.key.slice(0, -"/index.html".length);
      uploads.push({
        key: cleanKey,
        filePath: file.filePath,
        contentType: "text/html; charset=utf-8",
        cacheControl: "public, max-age=60, must-revalidate",
      });
    }
  }

  const s3 = new S3Client({
    region,
    endpoint,
    forcePathStyle: true,
    credentials: { accessKeyId, secretAccessKey },
  });

  console.log(`Uploading ${uploads.length} objects to s3://${bucket} (${endpoint})...`);
  await runPool(uploads, 10, async (item) => {
    const body = readFileSync(item.filePath);
    await s3.send(
      new PutObjectCommand({
        Bucket: bucket,
        Key: item.key,
        Body: body,
        ContentType: item.contentType,
        CacheControl: item.cacheControl,
      }),
    );
  });

  if (deleteStale) {
    const expectedKeys = new Set(uploads.map((u) => u.key));
    const staleKeys = [];
    let continuationToken;
    do {
      const res = await s3.send(
        new ListObjectsV2Command({
          Bucket: bucket,
          ContinuationToken: continuationToken,
        }),
      );
      for (const obj of res.Contents ?? []) {
        if (obj.Key && !expectedKeys.has(obj.Key)) {
          staleKeys.push({ Key: obj.Key });
        }
      }
      continuationToken = res.IsTruncated ? res.NextContinuationToken : undefined;
    } while (continuationToken);

    if (staleKeys.length > 0) {
      console.log(`Removing ${staleKeys.length} stale object(s)...`);
      for (let i = 0; i < staleKeys.length; i += 1000) {
        await s3.send(
          new DeleteObjectsCommand({
            Bucket: bucket,
            Delete: { Objects: staleKeys.slice(i, i + 1000) },
          }),
        );
      }
    }
  }

  console.log("Deploy to Yandex Object Storage complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
