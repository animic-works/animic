/** 本番のトップと、トップ・OGP用の公開画像だけを検索対象にする。 */
export function isSearchIndexable(url: URL, response: Response) {
  if (url.hostname !== "animic.party" || response.status !== 200) return false;
  const type = response.headers.get("Content-Type")?.split(";")[0].trim();
  if (url.pathname === "/")
    return (
      type === "text/html" &&
      !(url.searchParams.has("frame_id") && url.searchParams.has("instance_id"))
    );
  return (
    /^\/site-images\/[0-9a-f-]{36}$/.test(url.pathname) &&
    (type === "image/png" || type === "image/webp")
  );
}
