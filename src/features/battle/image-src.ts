import * as v from "valibot";

// このアプリが配信する画像（お題の画像・生成画像）のパス。
const appImagePathPattern = /^\/(?:topic-images|generated-images)\/[^/?#]+\/[^/?#]+$/;

/**
 * このアプリが配信する画像のURLなら、そのパスを返す。それ以外は`null`。
 * オリジンは見ない。記録したURLのオリジンは記録した時点の`BETTER_AUTH_URL`で、
 * 今のオリジンと違うことがある（ローカルで登録したお題をトンネルの公開URLで使う場合など）。
 */
export function getAppImagePath(url: string) {
  if (appImagePathPattern.test(url)) return url;
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return null;
  }
  if (parsed.search || parsed.hash || !appImagePathPattern.test(parsed.pathname)) return null;
  return parsed.pathname;
}

/**
 * 画面に渡す画像のURL。このアプリが配信する画像は、開いているページと同じオリジンから読むよう、パスにする。
 * 採点ワーカーへ渡すURLは対戦の状態に記録した絶対URLのままにする。
 */
export function toImageSrc(url: string) {
  return getAppImagePath(url) ?? url;
}

/** 画面に渡す画像のURL。絶対URLか、このアプリが配信する画像のパス。 */
export const imageSrcSchema = v.union([
  v.pipe(v.string(), v.url()),
  v.pipe(v.string(), v.regex(appImagePathPattern)),
]);
