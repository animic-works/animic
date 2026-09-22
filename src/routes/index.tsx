import { createFileRoute } from "@tanstack/react-router";

import styles from "./-index.module.css";

export const Route = createFileRoute("/")({ component: Home });

function Home() {
  return (
    <main className={styles.page}>
      <h1 className={styles.logo}>
        <img src="/animic-logo.svg" alt="Animic" width="2078" height="607" />
      </h1>
    </main>
  );
}
