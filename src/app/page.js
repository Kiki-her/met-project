"use client";
import Image from "next/image";
import styles from "./page.module.css";
import ShowImage from "./showImage";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>Welcome to public museum.</p>
      </div>
      <ShowImage />
    </main>
  );
}
