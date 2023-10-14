"use client";
import styles from "./page.module.css";
import ShowImage from "./showImage";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>Welcome to the public museum.</div>
      <section className={styles.container}>
        <ShowImage />
      </section>
    </main>
  );
}
