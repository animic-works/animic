// 画面モック（mock/。別リポジトリ animic-mock）をローカルで配信する。
// mock/README.md の `python3 -m http.server 8000` と同じ動きを、依存パッケージなしで `vp run dev:mock` から行う
import { createReadStream, existsSync, statSync } from "node:fs";
import { createServer } from "node:http";
import { extname, join, normalize, resolve, sep } from "node:path";

const root = resolve(process.cwd(), "mock");
const port = Number(process.env.PORT ?? 8000);
const host = process.env.HOST ?? "localhost";

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".mjs": "text/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".ico": "image/x-icon",
  ".woff2": "font/woff2",
  ".woff": "font/woff",
  ".txt": "text/plain; charset=utf-8",
  ".md": "text/markdown; charset=utf-8",
};

if (!existsSync(join(root, "index.html"))) {
  console.error(
    [
      `画面モックが見つかりません: ${root}`,
      "別リポジトリをクローンして mock/ に置いてください:",
      "  git clone https://github.com/animic-works/animic-mock.git mock",
    ].join("\n"),
  );
  process.exit(1);
}

// URLのパスを mock/ の中のファイルに対応づける。ディレクトリは index.html、mock/ の外は見せない
function resolveFile(url) {
  const pathname = decodeURIComponent(new URL(url, "http://localhost").pathname);
  const file = normalize(join(root, pathname));
  if (file !== root && !file.startsWith(root + sep)) return null;
  if (existsSync(file) && statSync(file).isDirectory()) return join(file, "index.html");
  return file;
}

const server = createServer((request, response) => {
  const file = request.url ? resolveFile(request.url) : null;
  if (!file || !existsSync(file) || statSync(file).isDirectory()) {
    response.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
    response.end("Not Found");
    return;
  }
  response.writeHead(200, {
    "content-type": TYPES[extname(file)] ?? "application/octet-stream",
    "cache-control": "no-store",
  });
  createReadStream(file).pipe(response);
});

server.listen(port, host, () => {
  console.log(`画面モック: http://${host}:${port}/ （${root}）`);
});
