import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const root = path.resolve("dist");

async function filesIn(directory) {
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries) {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await filesIn(fullPath)));
    else files.push(fullPath);
  }
  return files;
}

const files = await filesIn(root);
for (const file of files) {
  const extension = path.extname(file).toLowerCase();
  if (![".html", ".js", ".css"].includes(extension)) continue;
  const original = await readFile(file, "utf8");
  const updated = original
    .replaceAll('="/_expo/', '="./_expo/')
    .replaceAll("url(/_expo/", "url(./_expo/")
    .replaceAll('"/_expo/', '"./_expo/');
  if (updated !== original) await writeFile(file, updated, "utf8");
}

const githubPages404 = `<!doctype html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="theme-color" content="#F8F9FC" />
    <title>문제풀이 앱 - 페이지를 찾을 수 없습니다</title>
    <style>
      :root { color-scheme: light; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; background: #F8F9FC; color: #1D2433; }
      body { min-height: 100vh; margin: 0; display: grid; place-items: center; padding: 24px; box-sizing: border-box; }
      main { width: min(100%, 460px); box-sizing: border-box; padding: 32px 24px; text-align: center; background: #FFFFFF; border: 1px solid #E5E8F0; border-radius: 24px; box-shadow: 0 12px 32px rgba(29, 36, 51, .08); }
      .badge { display: inline-flex; width: 56px; height: 56px; align-items: center; justify-content: center; border-radius: 18px; background: #E3E9FF; color: #3653E8; font-size: 24px; font-weight: 800; }
      h1 { margin: 20px 0 10px; font-size: 24px; line-height: 1.35; }
      p { margin: 0; color: #697386; font-size: 15px; line-height: 1.6; }
      a { display: inline-flex; margin-top: 24px; padding: 13px 20px; border-radius: 13px; background: #3653E8; color: #FFFFFF; text-decoration: none; font-weight: 700; }
      code { display: block; margin-top: 18px; color: #A0A8B8; font-size: 12px; word-break: break-all; }
    </style>
  </head>
  <body>
    <main>
      <div class="badge" aria-hidden="true">?</div>
      <h1>페이지를 찾을 수 없습니다</h1>
      <p>주소가 변경되었거나 아직 준비되지 않은 페이지입니다.<br />홈으로 이동해 계속 학습해 보세요.</p>
      <a id="home-link" href="./">홈으로 이동</a>
      <code id="requested-path"></code>
    </main>
    <script>
      (() => {
        const path = window.location.pathname;
        const knownRoutes = new Set(["exam", "manage", "progress", "result", "review"]);
        const segments = path.split("/").filter(Boolean);
        const hasProjectBase = segments.length > 0 && !knownRoutes.has(segments[0]);
        const base = hasProjectBase ? "/" + segments[0] + "/" : "/";
        const route = hasProjectBase ? segments[1] : segments[0];
        const staticRoutes = new Set(["exam", "manage", "progress", "result", "review"]);
        const target = staticRoutes.has(route) ? base + route + ".html" : null;
        if (target && !path.endsWith(".html")) {
          window.location.replace(target);
          return;
        }
        const homeLink = document.getElementById("home-link");
        const requestedPath = document.getElementById("requested-path");
        if (homeLink) homeLink.setAttribute("href", base);
        if (requestedPath) requestedPath.textContent = path;
      })();
    </script>
  </body>
</html>
`;

await writeFile(path.join(root, "404.html"), githubPages404, "utf8");
console.log("Prepared dist for local index.html usage and generated GitHub Pages 404.html.");
void stat(root);
