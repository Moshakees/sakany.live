import Link from 'next/link';
import { notFound } from 'next/navigation';
import {
  ArrowLeft, MapPin, BedDouble, Bath, CheckCircle, Eye,
  ShieldCheck, AlertTriangle, Wifi, Wind, Layers, Bed,
  Star, Info, Calendar
} from 'lucide-react';
import styles from '../property.module.css';
import ImageGallery from '@/components/ImageGallery';
import BookingWidget from '@/components/BookingWidget';
import AdminBar from '@/components/AdminBar';
import { getPropertyById } from '@/utils/supabase';

// ─── DYNAMIC SEO METADATA ────────────────────────────────────────────────────
export async function generateMetadata({ params }) {
  const { id } = await params;
  const { data: property } = await getPropertyById(id);

  if (!property) {
    return { title: 'شقة غير موجودة | سكني' };
  }

  const genderText =
    property.gender_type === 'male' ? 'سكن طلاب' :
    property.gender_type === 'female' ? 'سكن طالبات' : 'سكن';

  const title = `${property.title} | سكن طلاب المنصورة - سكني`;
  const description = `${genderText} في ${property.location} بالمنصورة — ${property.rooms} غرف بسعر ${property.price} ج.م/شهر. احجز عبر سكني بضمان وأمان تام.`;

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      images: [{ url: property.images?.[0] || '', width: 800, height: 600, alt: property.title }]
    }
  };
}

// ─── PAGE COMPONENT ──────────────────────────────────────────────────────────
export default async function PropertyDetailsPage({ params }) {
  const { id } = await params;
  const { data: property, error } = await getPropertyById(id);

  if (error || !property) notFound();

  const genderLabel =
    property.gender_type === 'male'   ? 'طلاب (ذكور)' :
    property.gender_type === 'female' ? 'طالبات (إناث)' : 'مشترك / عائلات';

  const genderBadgeClass =
    property.gender_type === 'male'   ? styles.genderMale :
    property.gender_type === 'female' ? styles.genderFemale :
                                        styles.genderAny;

  const floorLabel = property.floor === 0 ? 'الدور الأرضي' : `الدور ${property.floor}`;
  const sakanyFee  = Math.round(property.price * 0.5);

  // JSON-LD Structured Data for Google Rich Snippets
  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Apartment',
    name: property.title,
    description: property.description,
    numberOfRooms: property.rooms,
    numberOfBathroomsTotal: property.bathrooms,
    address: {
      '@type': 'PostalAddress',
      addressLocality: 'Mansoura',
      addressRegion: 'Dakahlia',
      addressCountry: 'EG',
      streetAddress: property.location
    },
    offers: {
      '@type': 'Offer',
      price: property.price,
      priceCurrency: 'EGP',
      availability: property.status === 'available'
        ? 'https://schema.org/InStock'
        : 'https://schema.org/SoldOut'
    },
    image: property.images
  };

  return (
    <div className={styles.container} dir="rtl">
      {/* JSON-LD */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Back link */}
      <Link href="/" className={styles.backBtn}>
        <ArrowLeft size={18} style={{ transform: 'rotate(180deg)' }} />
        <span>العودة للرئيسية</span>
      </Link>

      <AdminBar
        propertyId={property.id}
        initialStatus={property.review_status}
        initialReason={property.rejection_reason}
      />

      <div className={styles.layout}>

        {/* ── LEFT / MAIN COLUMN ─────────────────────────────────── */}
        <div className={styles.mainContent}>

          {/* Gallery */}
          <ImageGallery images={property.images} title={property.title} propertyId={property.id} />

          {/* Video Section (if exists) */}
          {property.video_url && (
            <div style={{
              marginTop: 24,
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 20,
              boxShadow: 'var(--shadow-sm)'
            }}>
              <h3 style={{
                fontSize: '1.2rem',
                fontWeight: 800,
                color: 'var(--text-primary)',
                marginBottom: 16,
                display: 'flex',
                alignItems: 'center',
                gap: 8
              }}>
                <span style={{ fontSize: '1.3rem' }}>🎥</span>
                <span>فيديو معاينة السكن</span>
              </h3>
              <div style={{
                position: 'relative',
                width: '100%',
                borderRadius: 'var(--radius-md)',
                overflow: 'hidden',
                backgroundColor: '#000',
                aspectRatio: '16/9'
              }}>
                {property.video_url.includes('youtube.com') || property.video_url.includes('youtu.be') ? (
                  // YouTube Video Embed
                  (() => {
                    let videoId = '';
                    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
                    const match = property.video_url.match(regExp);
                    if (match && match[2].length === 11) {
                      videoId = match[2];
                    }
                    return videoId ? (
                      <iframe
                        src={`https://www.youtube.com/embed/${videoId}`}
                        title="YouTube video player"
                        frameBorder="0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        style={{ width: '100%', height: '100%', border: 'none' }}
                      />
                    ) : (
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#fff' }}>
                        <a href={property.video_url} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)' }}>
                          اضغط هنا لفتح رابط الفيديو الخارجي
                        </a>
                      </div>
                    );
                  })()
                ) : (
                  // Direct Video URL (HTML5 player)
                  <video
                    src={property.video_url}
                    controls
                    preload="metadata"
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                  />
                )}
              </div>
            </div>
          )}

          {/* Title & badges */}
          <div className={styles.headerSection}>
            <div className={styles.badges}>
              {property.is_verified && (
                <span className="badge badge-verified">
                  <CheckCircle size={14} style={{ marginLeft: 4 }} />
                  موثق من سكني
                </span>
              )}
              {property.is_featured && (
                <span className="badge" style={{ background: '#fef3c7', color: '#92400e', border: '1px solid #fbbf24' }}>
                  <Star size={12} style={{ marginLeft: 4 }} />
                  مميزة
                </span>
              )}
              <span className={`badge ${genderBadgeClass}`}>{genderLabel}</span>
              <span className="badge" style={{
                background: property.rent_type === 'bed' ? '#f0fdf4' : '#eff6ff',
                color: property.rent_type === 'bed' ? '#166534' : '#1e40af',
                border: `1px solid ${property.rent_type === 'bed' ? '#bbf7d0' : '#bfdbfe'}`
              }}>
                {property.rent_type === 'bed' ? '🛌 تأجير بالسرير' : '🏢 شقة كاملة'}
              </span>
              <span className="badge" style={{
                background: property.status === 'available' ? '#ecfdf5' : '#fee2e2',
                color: property.status === 'available' ? '#059669' : '#ef4444',
                border: `1px solid ${property.status === 'available' ? '#a7f3d0' : '#fecaca'}`
              }}>
                {property.status === 'available' ? '✅ متاحة الآن' : '❌ مؤجرة'}
              </span>
            </div>

            <h1 className={styles.title}>{property.title}</h1>

            {/* Price + Sakany Fee */}
            <div style={{ marginTop: 8 }}>
              <div className={styles.price}>
                {property.price?.toLocaleString('ar-EG')}
                <span className={styles.priceUnit}>
                  {property.rent_type === 'bed' ? ' ج.م / سرير شهرياً' : ' ج.م / شهرياً'}
                </span>
              </div>

              {/* Sakany fee notice */}
              <div className={styles.feeBox}>
                <Info size={18} style={{ color: '#2563eb', flexShrink: 0, marginTop: 2 }} />
                <div style={{ minWidth: 0 }}>
                  <div className={styles.feeBoxTitle}>
                    رسوم خدمة سكني (تُدفع مرة واحدة فقط)
                  </div>
                  <div className={styles.feeBoxText}>
                    عند توقيع العقد واستلامك الشقة، يُستحق سداد{' '}
                    <strong>{sakanyFee.toLocaleString('ar-EG')} ج.م</strong>{' '}
                    كرسوم خدمة لمنصة سكني (50% من الإيجار الشهري)، وتُدفع <strong>مرة واحدة فقط</strong>.
                    هذه الرسوم تشمل التوثيق الميداني وضمان التعاقد والوساطة بينك وبين المالك.
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* ── Full Specs Grid ─────────────────────────────────────── */}
          <div className={styles.specsSection}>
            <h2 className={styles.sectionTitle}>مواصفات الشقة</h2>
            <div className={styles.specsGrid}>
              {[
                { icon: <MapPin size={16} />, label: 'المنطقة', value: property.location, color: '#7c3aed' },
                ...(property.rent_type === 'bed' ? [
                  { icon: <BedDouble size={16} />, label: 'السراير المتاحة', value: `${property.available_beds ?? property.beds ?? '—'} سرير`, color: '#059669' },
                  { icon: <Bed size={16} />, label: 'إجمالي السراير', value: `${property.beds ?? '—'} سرير`, color: '#d97706' },
                ] : [
                  { icon: <BedDouble size={16} />, label: 'عدد الغرف', value: `${property.rooms} غرفة`, color: '#2563eb' },
                  { icon: <Bath size={16} />, label: 'الحمامات', value: `${property.bathrooms} حمام`, color: '#0891b2' },
                  { icon: <Bed size={16} />, label: 'عدد الأسرّة', value: `${property.beds ?? '—'} سرير`, color: '#d97706' },
                ]),
                { icon: <Layers size={16} />, label: 'الدور', value: floorLabel, color: '#059669' },
                { icon: <Eye size={16} />, label: 'المشاهدات', value: `${(property.views_count || 0) + 1}`, color: '#64748b' },
                ...(property.has_ac    ? [{ icon: <Wind size={16} />,  label: 'تكييف',      value: 'متوفر ✓', color: '#0ea5e9' }] : []),
                ...(property.has_internet ? [{ icon: <Wifi size={16} />, label: 'إنترنت',    value: 'متوفر ✓', color: '#8b5cf6' }] : []),
                ...(property.has_elevator ? [{ icon: <Layers size={16} />, label: 'مصعد',    value: 'متوفر ✓', color: '#10b981' }] : []),
              ].map((item, i) => (
                <div key={i} className={styles.specCard}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 5, color: item.color }}>
                    {item.icon}
                    <span className={styles.specLabel}>{item.label}</span>
                  </div>
                  <div className={styles.specValue}>{item.value}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Amenities missing notice */}
          {(!property.has_ac || !property.has_internet || !property.has_elevator) && (
            <div style={{
              marginBottom: 20,
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              fontSize: '0.88rem',
              color: 'var(--text-secondary)'
            }}>
              <strong style={{ color: 'var(--text-primary)' }}>المرافق غير المتوفرة:</strong>{' '}
              {[
                !property.has_ac       && 'لا يوجد تكييف',
                !property.has_internet && 'لا يوجد إنترنت',
                !property.has_elevator && 'لا يوجد مصعد',
              ].filter(Boolean).join(' · ')}
            </div>
          )}

          {/* ⚠️ Mediator notice */}
          <div className={styles.noticeBox} style={{
            background: 'rgba(217,119,6,0.06)',
            border: '1px solid rgba(217,119,6,0.2)',
            borderRight: '4px solid var(--secondary)',
            color: 'var(--secondary-hover)',
          }}>
            <AlertTriangle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
            <div className={styles.noticeBoxText}>
              <strong>تنبيه مهم: </strong>
              لا يتم الكشف عن رقم المالك أو العنوان التفصيلي للشقة علناً.
              كل التواصل والترتيب يتم حصرياً عن طريق فريق <strong>سكني</strong> لضمان حقك وحق المالك وتأمين عملية التعاقد.
            </div>
          </div>

          {/* Description */}
          <div className={styles.descriptionWrapper}>
            <h2 className={styles.sectionTitle}>تفاصيل السكن والوصف الكامل</h2>
            <p className={styles.description}>{property.description}</p>
          </div>

          {/* Added date */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--text-muted)', fontSize: '0.83rem', marginTop: 12 }}>
            <Calendar size={14} />
            <span>أُضيفت في: {new Date(property.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
          </div>

          {/* Mobile: show widget inline under description */}
          <div className={styles.mobileWidget} style={{ marginTop: 24 }}>
            <BookingWidget property={property} />
          </div>
        </div>

        {/* ── RIGHT / SIDEBAR ────────────────────────────────────── */}
        <div className={styles.sidebar}>
          <div className={styles.desktopWidget}>
            <BookingWidget property={property} />
          </div>

          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)',
            padding: '18px 20px',
            marginTop: 16
          }}>
            <div style={{ fontWeight: 800, fontSize: '0.95rem', marginBottom: 14, color: 'var(--text-primary)' }}>
              📋 ملخص سريع
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10, fontSize: '0.88rem' }}>
              {[
                ['نوع الإيجار', property.rent_type === 'bed' ? '🛌 بالسرير' : '🏢 شقة كاملة'],
                [property.rent_type === 'bed' ? 'إيجار السرير' : 'الإيجار الشهري', `${property.price?.toLocaleString('ar-EG')} ج.م`],
                ['رسوم سكني (مرة واحدة)', `${sakanyFee.toLocaleString('ar-EG')} ج.م`],
                ['المنطقة', property.location],
                ...(property.rent_type === 'bed' ? [
                  ['السراير المتاحة', `${property.available_beds ?? property.beds ?? '—'} سرير`],
                  ['إجمالي السراير', `${property.beds ?? '—'} سرير`],
                ] : [
                  ['عدد الغرف', property.rooms],
                  ['عدد السراير', property.beds ?? '—'],
                  ['الحمامات', property.bathrooms],
                ]),
                ['الدور', floorLabel],
                ['نوع السكن', genderLabel],
              ].map(([label, val]) => (
                <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border)', paddingBottom: 8 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>{label}</span>
                  <span style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{val}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Verification badge card */}
          {property.is_verified && (
            <div style={{
              background: 'var(--primary-light)',
              border: '1px solid rgba(5,150,105,0.2)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              display: 'flex', gap: 12, alignItems: 'center',
              marginTop: 16
            }}>
              <ShieldCheck size={32} style={{ color: 'var(--primary)', flexShrink: 0 }} />
              <div>
                <div style={{ fontWeight: 800, color: 'var(--primary-dark)', marginBottom: 4 }}>
                  شقة موثقة ميدانياً ✓
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--primary-dark)', lineHeight: 1.6 }}>
                  تم فحص هذه الشقة وتصويرها بواسطة فريق سكني والتحقق من بيانات المالك وهوية العقار.
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
