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
  Plus,
  Heart,
  RefreshCw
} from 'lucide-react';
import { createBookingRequest, getUserBookings, cancelBookingRequest } from '@/utils/supabase';
import styles from './BookingWidget.module.css';

const FAVORITES_KEY = 'sakany_favorites';

export default function BookingWidget({ property }) {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [status, setStatus] = useState('idle'); // idle | loading | success | duplicate | error
  const [mounted, setMounted] = useState(false);
  const [requestedBeds, setRequestedBeds] = useState(1);
  const [pendingBooking, setPendingBooking] = useState(null);
  const [isFavorited, setIsFavorited] = useState(false);

  const isBedRental = property?.rent_type === 'bed';
  const maxBeds = property?.available_beds ?? 1;

  const checkFavorites = () => {
    if (typeof window === 'undefined') return;
    try {
      const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      setIsFavorited(favs.includes(property.id));
    } catch {
      setIsFavorited(false);
    }
  };

  const checkPendingBooking = async (userId) => {
    try {
      const { data } = await getUserBookings(userId);
      if (data) {
        // Find if there is any pending request (status === 'pending')
        // We only warn if it is for a DIFFERENT property. If it is the SAME property,
        // it is a simple duplicate and we show the duplicateBox.
        const pending = data.find(b => b.status === 'pending' && (b.property_id !== property.id && b.property?.id !== property.id));
        setPendingBooking(pending || null);
      }
    } catch (err) {
      console.error('Error checking pending booking:', err);
    }
  };

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem('sakany_session');
    if (session) {
      try {
        const parsed = JSON.parse(session);
        setUser(parsed);
        checkPendingBooking(parsed.id);
      } catch { /* ignore */ }
    }
    checkFavorites();
  }, [property.id]);

  const handleBookingRequest = async () => {
    if (!user) {
      router.push('/auth');
      return;
    }

    setStatus('loading');

    // Double check if they have a pending booking just before requesting
    const { data: userBookings } = await getUserBookings(user.id);
    const pending = userBookings?.find(b => b.status === 'pending' && (b.property_id !== property.id && b.property?.id !== property.id));
    
    if (pending) {
      setPendingBooking(pending);
      setStatus('idle');
      return;
    }

    // Check if duplicate for this property
    const isDup = userBookings?.find(b => b.status === 'pending' && (b.property_id === property.id || b.property?.id === property.id));
    if (isDup) {
      setStatus('duplicate');
      return;
    }

    const { error } = await createBookingRequest({
      propertyId: property.id,
      studentId: user.id,
      studentName: user.name,
      studentPhone: user.phone || '—',
      requestedBeds: isBedRental ? requestedBeds : 1
    });

    if (!error) {
      setStatus('success');
      // Refresh pending bookings check
      checkPendingBooking(user.id);
    } else if (error?.message === 'duplicate') {
      setStatus('duplicate');
    } else {
      setStatus('error');
    }
  };

  const handleToggleFavorite = () => {
    if (typeof window === 'undefined') return;
    try {
      const favs = JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
      const exists = favs.includes(property.id);
      const updated = exists
        ? favs.filter(id => id !== property.id)
        : [...favs, property.id];
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
      setIsFavorited(!exists);
      window.dispatchEvent(new Event('sakany_favorites_change'));
    } catch (e) {
      console.error(e);
    }
  };

  const handleReplaceBooking = async () => {
    if (!user || !pendingBooking) return;
    
    if (!window.confirm(`هل أنت متأكد من إلغاء حجزك الحالي لـ "${pendingBooking.property?.title || 'سكن آخر'}" واستبداله بهذا السكن؟`)) {
      return;
    }

    setStatus('loading');

    // Cancel old booking
    const { error: cancelError } = await cancelBookingRequest(pendingBooking.id);
    if (cancelError) {
      setStatus('error');
      return;
    }

    // Create new booking
    const { error: bookingError } = await createBookingRequest({
      propertyId: property.id,
      studentId: user.id,
      studentName: user.name,
      studentPhone: user.phone || '—',
      requestedBeds: isBedRental ? requestedBeds : 1
    });

    if (!bookingError) {
      setStatus('success');
      setPendingBooking(null);
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
              disabled={requestedBeds <= 1 || status === 'loading' || pendingBooking}
            >
              <Minus size={14} />
            </button>
            <span className={styles.bedCount}>{requestedBeds}</span>
            <button
              type="button"
              className={styles.bedBtn}
              onClick={() => setRequestedBeds(Math.min(maxBeds, requestedBeds + 1))}
              disabled={requestedBeds >= maxBeds || status === 'loading' || pendingBooking}
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
          ) : pendingBooking ? (
            /* Warning state: User already has a pending booking for another property */
            <div style={{
              background: '#fef3c7',
              border: '1px solid #f59e0b',
              borderRadius: 'var(--radius-md)',
              padding: 16,
              display: 'flex',
              flexDirection: 'column',
              gap: 12
            }}>
              <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start', color: '#b45309' }}>
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <div style={{ fontSize: '0.85rem', fontWeight: 600, lineHeight: 1.5 }}>
                  لديك حجز قيد المراجعة بالفعل لـ:
                  <div style={{ fontWeight: 800, marginTop: 4, color: 'var(--text-primary)' }}>
                    "{pendingBooking.property?.title || 'سكن آخر'}"
                  </div>
                  يرجى إلغاؤه أو استبداله لتتمكن من حجز هذا السكن.
                </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                <button
                  onClick={handleReplaceBooking}
                  disabled={status === 'loading'}
                  className={styles.bookBtn}
                  style={{
                    padding: '12px',
                    fontSize: '0.95rem',
                    background: 'linear-gradient(135deg, #d97706, #b45309)',
                    boxShadow: '0 4px 12px rgba(217, 119, 6, 0.25)'
                  }}
                >
                  {status === 'loading' ? (
                    <Clock size={16} className={styles.spinner} />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  <span>إلغاء القديم واستبداله بهذا</span>
                </button>

                <button
                  onClick={handleToggleFavorite}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 8,
                    padding: '12px',
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    color: isFavorited ? '#ef4444' : 'var(--text-primary)',
                    fontFamily: 'inherit',
                    fontSize: '0.9rem',
                    fontWeight: 700,
                    cursor: 'pointer',
                    transition: 'var(--transition)'
                  }}
                >
                  <Heart size={16} fill={isFavorited ? '#ef4444' : 'none'} style={{ color: isFavorited ? '#ef4444' : 'var(--text-muted)' }} />
                  <span>{isFavorited ? 'إزالة من المفضلة' : 'حفظ في المفضلة'}</span>
                </button>
              </div>
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
