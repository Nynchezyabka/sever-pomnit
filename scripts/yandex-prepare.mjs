// Post-build preparation for Yandex Cloud Object Storage static website hosting.
import { existsSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import path from "node:path";

const dir = ["dist/client", ".output/public"].find((d) => existsSync(`${d}/index.html`));
if (!dir) {
  throw new Error("Built static site not found in dist/client or .output/public");
}

if (!existsSync(`${dir}/404.html`)) {
  const shellSource = [`${dir}/kabinet/index.html`, `${dir}/index.html`].find((f) => existsSync(f));
  if (!shellSource) throw new Error(`Cannot create ${dir}/404.html`);
  writeFileSync(
    `${dir}/404.html`,
    readFileSync(shellSource, "utf8").replace(
      /<title>.*?<\/title>/,
      "<title>Страница не найдена · Север помнит</title>",
    ),
    "utf8",
  );
}

// Clean up TanStack Start's internal sitemap build artifact if present.
const pagesJson = path.join(dir, "pages.json");
if (existsSync(pagesJson)) {
  rmSync(pagesJson);
}

const siteUrl = process.env.VITE_SITE_URL?.replace(/\/+$/, "");
if (siteUrl) {
  const robotsPath = path.join(dir, "robots.txt");
  if (existsSync(robotsPath)) {
    const robots = readFileSync(robotsPath, "utf8").trimEnd();
    const sitemapLine = `Sitemap: ${siteUrl}/sitemap.xml`;
    if (!robots.includes("Sitemap:")) {
      writeFileSync(robotsPath, `${robots}\n\n${sitemapLine}\n`, "utf8");
    }
  }
}

console.log(
  `Yandex Object Storage build ready in ${dir} (index.html + prerendered routes + 404.html)`,
);
