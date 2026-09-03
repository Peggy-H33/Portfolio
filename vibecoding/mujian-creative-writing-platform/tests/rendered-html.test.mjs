import assert from "node:assert/strict";
import { access, readFile } from "node:fs/promises";
import test from "node:test";

const templateRoot = new URL("../", import.meta.url);

async function render() {
  const workerUrl = new URL("../dist/server/index.js", import.meta.url);
  workerUrl.searchParams.set("test", `${process.pid}-${Date.now()}`);
  const { default: worker } = await import(workerUrl.href);

  return worker.fetch(
    new Request("http://localhost/", {
      headers: { accept: "text/html" },
    }),
    {
      ASSETS: {
        fetch: async () => new Response("Not found", { status: 404 }),
      },
    },
    {
      waitUntil() {},
      passThroughOnException() {},
    },
  );
}

test("server-renders the Interlude creator prototype", async () => {
  const response = await render();
  assert.equal(response.status, 200);
  assert.match(response.headers.get("content-type") ?? "", /^text\/html\b/i);

  const html = await response.text();
  assert.match(html, /<html lang="zh-CN">/i);
  assert.match(html, /<title>幕间 · 作者的角色剧场 · 幕间<\/title>/i);
  assert.match(html, /让角色在文字之外继续生活/);
  assert.match(html, /作品目录/);
  assert.match(html, /从书架上抽出一部作品/);
  assert.match(html, /雾港来信/);
  assert.match(html, /继续上次创作/);
  assert.match(html, /雪线旅馆/);
  assert.match(html, /og:image/);
  assert.doesNotMatch(html, /Your site is taking shape|Building your site/);
  assert.doesNotMatch(html, /react-loading-skeleton/);
});

test("ships product code and local project assets without starter preview", async () => {
  const [page, prototype, layout, css, packageJson] = await Promise.all([
    readFile(new URL("../app/page.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/prototype.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/layout.tsx", import.meta.url), "utf8"),
    readFile(new URL("../app/cinematic.css", import.meta.url), "utf8"),
    readFile(new URL("../package.json", import.meta.url), "utf8"),
  ]);

  assert.match(page, /<InterludePrototype \/>/);
  assert.match(prototype, /interlude-prototype-v2/);
  assert.match(prototype, /认知矩阵/);
  assert.match(prototype, /收录为正典/);
  assert.match(prototype, /保存为新版本/);
  assert.match(prototype, /label: "阅读"/);
  assert.match(prototype, /正文阅读/);
  assert.match(prototype, /场景预演/);
  assert.match(prototype, /AI 分场完成/);
  assert.match(prototype, /readerState/);
  assert.match(prototype, /projectDrafts/);
  assert.match(prototype, /preparedProjectIds/);
  assert.match(prototype, /window\.history\.pushState/);
  assert.match(prototype, /type LibraryBookSelection/);
  assert.match(prototype, /selectionPhase/);
  assert.match(prototype, /aria-expanded/);
  assert.match(prototype, /library-book-detail/);
  assert.match(prototype, /进入作品/);
  assert.match(layout, /\/og\.png/);
  assert.match(layout, /\.\/cinematic\.css/);
  assert.match(prototype, /\/stills\/rain-bookstore\.jpg/);
  assert.match(css, /@media \(max-width: 640px\)/);
  assert.match(css, /grid-template-columns: repeat\(6, minmax\(0, 1fr\)\)/);
  assert.match(css, /\.work-library/);
  assert.match(css, /\.library-marquee/);
  assert.match(css, /@keyframes library-shelf-drift/);
  assert.match(css, /\.library-extracted-book\.is-detail/);
  assert.match(css, /\.library-book-detail\.is-detail/);
  assert.match(css, /\.reader-page/);
  assert.match(packageJson, /"name": "interlude-creator-prototype"/);
  assert.doesNotMatch(packageJson, /react-loading-skeleton/);

  await Promise.all([
    access(new URL("../public/og.png", import.meta.url)),
    access(new URL("../public/favicon.svg", import.meta.url)),
    access(new URL("../public/stills/fog-city.jpg", import.meta.url)),
    access(new URL("../public/stills/rain-bookstore.jpg", import.meta.url)),
    access(new URL("../public/stills/midnight-radio.jpg", import.meta.url)),
    access(new URL("../public/stills/fog-lighthouse.jpg", import.meta.url)),
    access(new URL("../public/library/library-covers-contact-v1.png", import.meta.url)),
    access(new URL("../public/library/cover-fog-harbor.png", import.meta.url)),
    access(new URL("../public/library/cover-midnight-radio.png", import.meta.url)),
    access(new URL("../public/library/cover-fog-lighthouse.png", import.meta.url)),
    access(new URL("../public/library/cover-rain-platform.png", import.meta.url)),
    access(new URL("../public/library/cover-midnight-greenhouse.png", import.meta.url)),
    access(new URL("../public/library/cover-snow-hotel.png", import.meta.url)),
  ]);
  await assert.rejects(access(new URL("../app/_sites-preview", templateRoot)));
});
