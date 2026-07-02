'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck,
  CheckCircle2,
  AlertCircle,
  LogIn,
  Phone,
  Clock,
  ShieldCheck,
  Sparkles,
  Minus,
  Plus
} from 'lucide-react';
import { createBookingRequest } from '@/utils/supabase';
import styles from './BookingWidget.module.css';

export default function BookingWidget({ property }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | duplicate | error
  const [mounted, setMounted] = useState(false);
  const [requestedBeds, setRequestedBeds] = useState(1);

  const isBedRental = property?.rent_type === 'bed';
  const maxBeds = property?.available_beds ?? 1;

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem('sakany_session');
    if (session) {
      try { setUser(JSON.parse(session)); } catch { /* ignore */ }
    }
  }, []);

  const handleBookingRequest = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setStatus('loading');

    const { error } = await createBookingRequest({
      propertyId: property.id,
      studentId: user.id,
      studentName: user.name,
      studentPhone: user.phone || '—',
      requestedBeds: isBedRental ? requestedBeds : 1
    });

    if (!error) {
      setStatus('success');
    } else if (error?.message === 'duplicate') {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  };

  if (!mounted) return null;

  return (
    <div className={styles.widget}>
      {/* Header */}
      <div className={styles.header}>
        <Sparkles size={20} className={styles.headerIcon} />
        <span className={styles.headerText}>{isBedRental ? 'حجز سرير عبر سَكني' : 'الحجز عبر سَكني'}</span>
      </div>

      {/* How it works steps */}
      <div className={styles.steps}>
        <div className={styles.step}>
          <div className={styles.stepNum}>١</div>
          <p className={styles.stepText}>{isBedRental ? 'اختر عدد السراير المطلوبة واضغط طلب الحجز' : 'تضغط على "طلب حجز السكن" وتوصلنا طلبك'}</p>
        </div>
        <div className={styles.step}>
          <div className={styles.stepNum}>٢</div>
          <p className={styles.stepText}>فريق سكني يتواصل معك ومع المالك لتحديد موعد</p>
        </div>
        <div className={styles.step}>
          <div className={styles.stepNum}>٣</div>
          <p className={styles.stepText}>نرتب معاينة وأمضاء العقد بحضورنا لضمان حقك</p>
        </div>
      </div>

      {/* Bed count selector (only for bed rentals) */}
      {isBedRental && (
        <div className={styles.bedSelector}>
          <span className={styles.bedSelectorLabel}>عدد السراير المطلوبة:</span>
          <div className={styles.bedSelectorControls}>
            <button
              type="button"
              className={styles.bedBtn}
              onClick={() => setRequestedBeds(Math.max(1, requestedBeds - 1))}
              disabled={requestedBeds <= 1}
            >
              <Minus size={14} />
            </button>
            <span className={styles.bedCount}>{requestedBeds}</span>
            <button
              type="button"
              className={styles.bedBtn}
              onClick={() => setRequestedBeds(Math.min(maxBeds, requestedBeds + 1))}
              disabled={requestedBeds >= maxBeds}
            >
              <Plus size={14} />
            </button>
          </div>
          <span className={styles.bedAvailability}>
            متاح {maxBeds} {maxBeds === 1 ? 'سرير' : 'سراير'}
          </span>
        </div>
      )}

      {/* Price summary */}
      <div className={styles.priceSummary}>
        <span className={styles.priceLabel}>
          {isBedRental ? `إيجار ${requestedBeds} سرير شهرياً` : 'الإيجار الشهري'}
        </span>
        <span className={styles.priceValue}>
          {(isBedRental
            ? (property.price * requestedBeds)
            : property.price
          )?.toLocaleString('ar-EG')} ج.م
        </span>
      </div>

      {/* Action area */}
      {status === 'success' ? (
        <div className={styles.successBox}>
          <CheckCircle2 size={28} className={styles.successIcon} />
          <h3 className={styles.successTitle}>{isBedRental ? 'تم إرسال طلب حجز السرير!' : 'تم إرسال طلب الحجز!'}</h3>
          <p className={styles.successText}>
            سيتواصل معك فريق سَكني على رقم هاتفك خلال 24 ساعة لتنسيق موعد المعاينة وأمضاء العقد.
          </p>
          <div className={styles.contactUs}>
            <Phone size={14} />
            <span>للاستفسار العاجل: <strong>01040122363</strong></span>
          </div>
        </div>
      ) : status === 'duplicate' ? (
        <div className={styles.duplicateBox}>
          <Clock size={22} />
          <p>لديك طلب حجز قيد المراجعة لهذه الشقة. سنتواصل معك قريباً.</p>
        </div>
      ) : (
        <>
          {status === 'error' && (
            <div className={styles.errorBox}>
              <AlertCircle size={18} />
              <span>حدث خطأ، يرجى المحاولة مرة أخرى.</span>
            </div>
          )}

          {!user ? (
            <div className={styles.authPrompt}>
              <p className={styles.authText}>سجّل دخولك كطالب لطلب حجز هذا السكن</p>
              <button
                onClick={() => router.push('/auth')}
                className={styles.loginBtn}
              >
                <LogIn size={18} />
                <span>تسجيل الدخول أولاً</span>
              </button>
            </div>
          ) : user.role !== 'student' ? (
            <div className={styles.notStudentBox}>
              <AlertCircle size={18} />
              <p>الحجز متاح فقط لحسابات الطلاب.</p>
            </div>
          ) : (
            <button
              onClick={handleBookingRequest}
              disabled={status === 'loading' || (isBedRental && maxBeds < 1)}
              className={styles.bookBtn}
            >
              {status === 'loading' ? (
                <>
                  <Clock size={20} className={styles.spinner} />
                  <span>جاري الإرسال...</span>
                </>
              ) : (
                <>
                  <CalendarCheck size={20} />
                  <span>{isBedRental ? `طلب حجز ${requestedBeds} سرير` : 'طلب حجز السكن'}</span>
                </>
              )}
            </button>
          )}
        </>
      )}

      {/* Trust badge */}
      <div className={styles.trustBadge}>
        <ShieldCheck size={14} />
        <span>نحن الوسيط — لا تتواصل مع المالك مباشرة قبل تنسيقنا</span>
      </div>
    </div>
  );
}

