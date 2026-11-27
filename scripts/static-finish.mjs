// After `STATIC_BUILD=1 bun run build`: make the built client folder a plain static site (index.html + SPA fallback).
// Looks in dist/client first, then .output/public (other build presets put the site there).
import { copyFileSync, existsSync, writeFileSync } from "node:fs";
if (process.env.STATIC_BUILD) {
  const dir = ["dist/client", ".output/public"].find((d) => existsSync(`${d}/_shell.html`) || existsSync(`${d}/index.html`));
  if (!dir) throw new Error("Built site not found in dist/client or .output/public");
  const shell = existsSync(`${dir}/_shell.html`) ? `${dir}/_shell.html` : `${dir}/index.html`;
  if (shell !== `${dir}/index.html`) copyFileSync(shell, `${dir}/index.html`);
  copyFileSync(shell, `${dir}/404.html`); // hosts that serve 404.html for unknown paths
  writeFileSync(`${dir}/_redirects`, "/*  /index.html  200\n"); // Netlify/Cloudflare-style SPA fallback
  console.log(`static site ready in ${dir} (index.html) — point your hosting at this folder`);
}
