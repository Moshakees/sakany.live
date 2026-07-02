'use client';

import Link from 'next/link';
import { Sparkles, ShieldAlert, Heart } from 'lucide-react';
import styles from './components.module.css';
import SakanyLogo from './SakanyLogo';

export default function Footer() {
  return (
    <footer className={styles.footer} dir="rtl">
      <div className={`${styles.footerGrid} container`}>
        {/* About Column */}
        <div className={styles.footerCol}>
          <div className={styles.logo}>
            <SakanyLogo size={30} />
            <span style={{ color: 'white' }}>سَكني</span>
          </div>
          <p className={styles.footerAboutText}>
            أول منصة متخصصة وموثوقة بنسبة 100% لتوفير وتأمين سكن الطلاب والطالبات في مدينة المنصورة. نسعى لتوفير الوقت والجهد وتوفير بيئة سكنية آمنة خالية تماماً من النصب أو السماسرة غير الموثوقين.
          </p>
        </div>

        {/* Quick Links Column */}
        <div className={styles.footerCol}>
          <h4 className={styles.footerTitle}>روابط سريعة</h4>
          <ul className={styles.footerLinks}>
            <li className={styles.footerLinkItem}>
              <Link href="/">الصفحة الرئيسية</Link>
            </li>
            <li className={styles.footerLinkItem}>
              <Link href="/auth">تسجيل الدخول / إنشاء حساب</Link>
            </li>
            <li className={styles.footerLinkItem}>
              <Link href="/dashboard">إضافة عقار جديد</Link>
            </li>
          </ul>
        </div>

        {/* Safety & Anti-Fraud Column */}
        <div className={styles.footerCol}>
          <h4 className={styles.footerTitle}>دليل الأمان ضد النصب</h4>
          <div className={styles.warningBox}>
            <div className={styles.warningTitle}>
              <ShieldAlert size={18} />
              <span>مهم جداً للطلاب!</span>
            </div>
            <p className={styles.warningText}>
              - ابحث دائماً عن علامة <strong>"موثق من سكني"</strong> لضمان معاينتنا الميدانية للشقة.<br />
              - لا تقم بتحويل أي مقدم مالي (عربون) عبر محفظة إلكترونية قبل معاينة السكن بنفسك ومقابلة المالك وتوقيع العقد.<br />
              - أبلغ فوراً عن أي إعلان يبدو مشبوهاً أو غير حقيقي.
            </p>
          </div>
        </div>
      </div>

      {/* Copyright */}
      <div className={`${styles.footerBottom} container`}>
        <div>
          <span>© {new Date().getFullYear()} سَكني. جميع الحقوق محفوظة لطلاب المنصورة.</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          <span>صُنع بحب</span>
          <Heart size={14} style={{ color: 'var(--danger)', fill: 'var(--danger)' }} />
          <span>لتسهيل البحث وسكن الطلاب</span>
        </div>
      </div>
    </footer>
  );
}
