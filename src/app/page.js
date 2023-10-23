"use client";
import styles from "./page.module.css";

import Top from "./top";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>Welcome to the public museum.</div>
      <section className={styles.container}>
        <Top />
      </section>
    </main>
  );
}
