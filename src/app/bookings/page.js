'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  CalendarCheck, MapPin, BedDouble, Bath, CheckCircle,
  XCircle, Clock, Trash2, Search, Sparkles, Home, Phone, ArrowLeft
} from 'lucide-react';
import { getUserBookings, cancelBookingRequest } from '@/utils/supabase';

const STATUS_CONFIG = {
  pending:   { label: 'قيد المراجعة', color: '#d97706', bg: 'rgba(217,119,6,0.1)', description: 'فريق سَكني يتواصل معك ومع المالك الآن لتنسيق موعد المعاينة.' },
  contacted: { label: 'تم التواصل',  color: '#2563eb', bg: 'rgba(37,99,235,0.1)', description: 'تم التواصل وتنسيق موعد المعاينة وأمضاء العقد بحضورنا.' },
  completed: { label: 'تم التعاقد 🎉',  color: '#059669', bg: 'rgba(5,150,105,0.1)', description: 'تهانينا! تم إمضاء العقد وتأكيد السكن بنجاح.' },
  canceled:  { label: 'ملغي',        color: '#ef4444', bg: 'rgba(239,68,68,0.1)', description: 'تم إلغاء هذا الطلب.' }
};

export default function BookingsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [cancellingId, setCancellingId] = useState(null);

  useEffect(() => {
    setMounted(true);
    const session = localStorage.getItem('sakany_session');
    if (!session) {
      router.push('/auth');
      return;
    }
    try {
      const parsedUser = JSON.parse(session);
      setUser(parsedUser);
      loadBookings(parsedUser.id);
    } catch {
      router.push('/auth');
    }
  }, []);

  const loadBookings = async (userId) => {
    setLoading(true);
    const { data } = await getUserBookings(userId);
    setBookings(data || []);
    setLoading(false);
  };

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('هل أنت متأكد من رغبتك في إلغاء طلب الحجز هذا؟')) {
      return;
    }

    setCancellingId(bookingId);
    const { error } = await cancelBookingRequest(bookingId);
    
    if (!error) {
      // Refresh the page
      if (user) {
        await loadBookings(user.id);
      }
      alert('تم إلغاء الحجز بنجاح.');
    } else {
      alert('حدث خطأ أثناء إلغاء الحجز، يرجى المحاولة مرة أخرى.');
    }
    setCancellingId(null);
  };

  if (!mounted) return null;

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36, display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 14,
              background: 'rgba(13,148,136,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <CalendarCheck size={22} style={{ color: 'var(--primary)' }} />
            </div>
            <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
              حجوزاتي
            </h1>
          </div>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginRight: 56 }}>
            متابعة حالة طلبات حجز الشقق والسراير الخاصة بك
          </p>
        </div>

        <Link
          href="/search"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            color: 'var(--primary)',
            fontWeight: 700,
            textDecoration: 'none',
            fontSize: '0.95rem'
          }}
        >
          <span>تصفح شقق أخرى</span>
          <ArrowLeft size={16} />
        </Link>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '80px 20px' }}>
          <div style={{
            width: 44, height: 44, border: '3px solid var(--primary)',
            borderTopColor: 'transparent', borderRadius: '50%',
            margin: '0 auto', animation: 'spin 0.8s linear infinite'
          }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      )}

      {/* Empty State */}
      {!loading && bookings.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>📅</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            لا توجد طلبات حجز بعد
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 450, margin: '0 auto 24px', lineHeight: 1.6 }}>
            عندما تقوم بطلب حجز شقة أو سرير في منصة سَكني، ستظهر لك تفاصيل الحجز وحالته وقدرتك على إلغائه هنا في هذه الصفحة.
          </p>
          <Link
            href="/search"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              background: 'var(--primary)', color: '#fff',
              padding: '12px 24px', borderRadius: 'var(--radius-md)',
              textDecoration: 'none', fontWeight: 700
            }}
          >
            <Search size={16} />
            ابحث عن سكن الآن
          </Link>
        </div>
      )}

      {/* Bookings List */}
      {!loading && bookings.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {bookings.map((booking) => {
            const statusInfo = STATUS_CONFIG[booking.status] || STATUS_CONFIG.pending;
            const property = booking.property || {};
            const isBedRental = property.rent_type === 'bed';

            return (
              <div
                key={booking.id}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}
              >
                {/* Upper Row: Status and Date */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{
                      padding: '4px 12px',
                      borderRadius: '50px',
                      fontSize: '0.8rem',
                      fontWeight: 800,
                      color: statusInfo.color,
                      backgroundColor: statusInfo.bg
                    }}>
                      {statusInfo.label}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                      طلب حجز رقم #{booking.id.split('-').pop()}
                    </span>
                  </div>
                  <span style={{ fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                    تاريخ الطلب: {new Date(booking.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                  </span>
                </div>

                <hr style={{ border: 0, borderTop: '1px solid var(--border)', margin: 0 }} />

                {/* Middle Row: Property Info */}
                <div style={{ display: 'flex', gap: 20, alignItems: 'center', flexWrap: 'wrap' }}>
                  {/* Image (if exists) */}
                  {property.images && property.images.length > 0 && (
                    <img
                      src={property.images[0]}
                      alt={property.title}
                      style={{
                        width: 100,
                        height: 70,
                        borderRadius: 'var(--radius-md)',
                        objectFit: 'cover',
                        border: '1px solid var(--border)'
                      }}
                    />
                  )}
                  
                  <div style={{ flex: 1 }}>
                    <Link
                      href={`/properties/${property.id || booking.property_id}`}
                      style={{
                        fontSize: '1.1rem',
                        fontWeight: 800,
                        color: 'var(--text-primary)',
                        textDecoration: 'none',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}
                    >
                      <Home size={18} style={{ color: 'var(--primary)' }} />
                      <span>{property.title || 'سكن غير متوفر حالياً'}</span>
                    </Link>
                    
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginTop: 8, flexWrap: 'wrap', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                        <MapPin size={14} />
                        {property.location || 'المنصورة'}
                      </span>
                      {booking.requested_beds && (
                        <span style={{ color: 'var(--secondary-hover)', fontWeight: 'bold' }}>
                          🛌 {booking.requested_beds} {booking.requested_beds === 1 ? 'سرير' : 'سراير'} مطلوبة
                        </span>
                      )}
                      <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '0.95rem' }}>
                        {((isBedRental && booking.requested_beds) 
                          ? (property.price * booking.requested_beds) 
                          : property.price
                        )?.toLocaleString('ar-EG')} ج.م شهرياً
                      </span>
                    </div>
                  </div>
                </div>

                {/* Explanation text */}
                <div style={{
                  padding: '12px 16px',
                  borderRadius: 'var(--radius-md)',
                  backgroundColor: 'rgba(255,255,255,0.02)',
                  border: '1px solid var(--border)',
                  fontSize: '0.88rem',
                  color: 'var(--text-secondary)',
                  lineHeight: 1.6
                }}>
                  {statusInfo.description}
                </div>

                {/* Actions Row */}
                {booking.status !== 'canceled' && (
                  <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
                    <button
                      onClick={() => handleCancelBooking(booking.id)}
                      disabled={cancellingId === booking.id}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 6,
                        background: 'transparent',
                        border: '1px solid rgba(239,68,68,0.3)',
                        borderRadius: 'var(--radius-md)',
                        color: '#ef4444',
                        padding: '8px 16px',
                        fontSize: '0.85rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        transition: 'var(--transition)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = 'rgba(239,68,68,0.05)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }}
                    >
                      <XCircle size={16} />
                      <span>{cancellingId === booking.id ? 'جاري الإلغاء...' : 'إلغاء هذا الحجز'}</span>
                    </button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
