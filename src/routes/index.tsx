import { createFileRoute } from "@tanstack/react-router";

import styles from "./-index.module.css";

export const Route = createFileRoute("/")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://animic.party/" }],
    meta: [
      { property: "og:type", content: "website" },
      { property: "og:title", content: "Animic" },
      { property: "og:site_name", content: "Animic" },
      { property: "og:locale", content: "ja_JP" },
      { property: "og:url", content: "https://animic.party/" },
      { property: "og:image", content: "https://animic.party/og-image.png" },
      { property: "og:image:type", content: "image/png" },
      { property: "og:image:width", content: "1200" },
      { property: "og:image:height", content: "630" },
      { property: "og:image:alt", content: "Animic" },
      { name: "twitter:card", content: "summary_large_image" },
      { name: "twitter:title", content: "Animic" },
      { name: "twitter:image", content: "https://animic.party/og-image.png" },
      { name: "twitter:image:alt", content: "Animic" },
    ],
  }),
  component: Home,
});

function Home() {
  return (
    <main className={styles.page}>
      <h1 className={styles.logo}>
        <img src="/animic-logo.svg" alt="Animic" width="2078" height="607" />
      </h1>
    </main>
  );
}
