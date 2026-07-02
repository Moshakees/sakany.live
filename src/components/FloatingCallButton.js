"use client";

import { Phone } from "lucide-react";
import styles from "./FloatingCallButton.module.css";

export default function FloatingCallButton() {
  return (
    <div className={styles.container}>
      <a 
        href="tel:01040122363" 
        className={styles.button}
        title="اتصل بنا للاستفسار والتواصل"
        aria-label="اتصل بنا للاستفسار والتواصل"
      >
        <span className={styles.buttonPulse}></span>
        <div className={styles.buttonIcon}>
          <Phone size={24} />
        </div>
        <span className={styles.buttonText}>استفسار وتواصل: 01040122363</span>
      </a>
    </div>
  );
}
