import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import tailwindcss from "@tailwindcss/vite";
import viteReact from "@vitejs/plugin-react";
import { defineConfig } from "vite";
import { typografPlugin } from "./scripts/typograf-plugin.mjs";

const siteUrl = process.env["VITE_SITE_URL"]?.replace(/\/+$/, "");

export default defineConfig({
  resolve: {
    tsconfigPaths: true,
  },
  plugins: [
    typografPlugin(),
    tailwindcss(),
    tanstackStart({
      server: { entry: "server" },
      prerender: {
        enabled: true,
        autoStaticPathsDiscovery: true,
        autoSubfolderIndex: true,
        crawlLinks: false,
      },
      pages: [
        { path: "/", sitemap: { priority: 1.0, changefreq: "weekly" } },
        { path: "/menu", sitemap: { priority: 0.9, changefreq: "weekly" } },
        { path: "/master", sitemap: { priority: 0.8, changefreq: "monthly" } },
        { path: "/sad", sitemap: { priority: 0.7, changefreq: "monthly" } },
        { path: "/privacy", sitemap: { priority: 0.2, changefreq: "yearly" } },
        { path: "/kabinet", sitemap: { exclude: true } },
        { path: "/kartoteka", sitemap: { exclude: true } },
      ],
      ...(siteUrl
        ? {
            sitemap: {
              enabled: true,
              host: siteUrl,
              outputPath: "sitemap.xml",
            },
          }
        : {}),
    }),
    viteReact(),
  ],
});
