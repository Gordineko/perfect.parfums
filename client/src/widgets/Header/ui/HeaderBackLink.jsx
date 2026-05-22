"use client";

import { useRouter } from "next/navigation";

import styles from "./Header.module.scss";

export default function HeaderBackLink({ label }) {
  const router = useRouter();

  return (
    <button
      type="button"
      className={styles.backLink}
      onClick={() => router.back()}
    >
      {label}
    </button>
  );
}
