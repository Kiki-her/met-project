"use client";
import Image from "next/image";
import styles from "./page.module.css";
import ShowImage from "./showImage";
import CsvToJson from "./csvToJson";

export default function Home() {
  return (
    <main className={styles.main}>
      <div className={styles.description}>
        <p>Hi, World.</p>
      </div>
      <ShowImage></ShowImage>
    </main>
  );
}
