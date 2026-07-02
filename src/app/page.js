'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Search,
  MapPin,
  BedDouble,
  Bath,
  CheckCircle,
  ShieldCheck,
  Smartphone,
  MessageCircle,
  Sparkles,
  PlusCircle,
  HelpCircle,
  PhoneCall
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import styles from './page.module.css';
import { getProperties, isDemoMode } from '@/utils/supabase';

export default function Home() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');

  const fetchListings = async () => {
    setLoading(true);
    const { data, error } = await getProperties({});

    if (error) {
      setError('فشل تحميل الشقق المتاحة.');
    } else {
      setProperties(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchListings();
  }, []);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    router.push(`/search?q=${encodeURIComponent(searchQuery)}&location=${locationFilter}`);
  };

  const getGenderName = (type) => {
    switch (type) {
      case 'male': return 'سكن طلاب (ذكور)';
      case 'female': return 'سكن طالبات (إناث)';
      default: return 'سكن مشترك / عائلات';
    }
  };

  const getGenderClass = (type) => {
    switch (type) {
      case 'male': return styles.genderMale;
      case 'female': return styles.genderFemale;
      default: return styles.genderAny;
    }
  };

  const renderHorizontalSection = (title, viewAllHref, list) => {
    if (list.length === 0) return null;
    return (
      <div className={styles.horizontalSection}>
        <div className={styles.horizontalHeader}>
          <h3 className={styles.sectionTitle}>
            <Sparkles size={18} style={{ color: 'var(--secondary)', marginLeft: '6px' }} />
            <span>{title}</span>
          </h3>
          <Link href={viewAllHref} className={styles.viewAllLink}>
            عرض الكل ←
          </Link>
        </div>

        <div className={styles.scrollRow}>
          {list.map((property) => (
            <div key={property.id} className={`${styles.card} ${styles.scrollCard}`}>
              {/* Property Image & Badges */}
              <div className={styles.imageContainer}>
                <img
                  src={property.images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
                  alt={property.title}
                  className={styles.image}
                />

                {property.is_verified && (
                  <div className={`${styles.verifiedBadge} badge badge-verified`}>
                    <CheckCircle size={14} style={{ marginLeft: '4px' }} />
                    <span>موثق</span>
                  </div>
                )}

                <div className={styles.rentTypeBadge}>
                  {property.rent_type === 'bed' ? '🛌 نظام سراير' : '🏢 شقة كاملة'}
                </div>

                <div className={`${styles.genderBadge} badge ${getGenderClass(property.gender_type)}`}>
                  <span>{getGenderName(property.gender_type)}</span>
                </div>
              </div>

              {/* Card Body */}
              <div className={styles.cardBody}>
                <div className={styles.cardLocation}>
                  <MapPin size={14} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                  <span>{property.location}</span>
                </div>

                <h3 className={styles.cardTitle}>{property.title}</h3>

                {/* Specs */}
                <div className={styles.specs}>
                  {property.rent_type === 'bed' ? (
                    <div className={styles.specItem}>
                      <BedDouble size={16} />
                      <span>متاح {property.available_beds} من {property.beds} سراير</span>
                    </div>
                  ) : (
                    <>
                      <div className={styles.specItem}>
                        <BedDouble size={16} />
                        <span>{property.rooms} غرف</span>
                      </div>
                      <div className={styles.specItem}>
                        <Bath size={16} />
                        <span>{property.bathrooms} حمام</span>
                      </div>
                    </>
                  )}
                </div>

                {/* Price and Action */}
                <div className={styles.priceWrapper}>
                  <div className={styles.priceText}>
                    <span>{property.price}</span>
                    <span className={styles.priceUnit}>
                      {property.rent_type === 'bed' ? ' ج.م / سرير شهرياً' : ' ج.م / شهر'}
                    </span>
                  </div>

                  <Link href={`/properties/${property.id}`} className={styles.detailBtn}>
                    التفاصيل
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div dir="rtl">
      {/* 1. HERO SECTION */}
      <header className={styles.hero}>
        <div className={`${styles.heroContent} container`}>
          <div className="badge badge-verified animate-fade-in" style={{ backgroundColor: 'rgba(52, 211, 153, 0.15)', color: '#34d399', border: '1px solid rgba(52, 211, 153, 0.3)' }}>
            <ShieldCheck size={16} />
            <span>سكن آمن وموثق 100% في المنصورة</span>
          </div>

          <h1 className={`${styles.heroTitle} animate-fade-in`}>
            ابحث عن سكنك الطلابي في المنصورة <br />
            <span className={styles.heroTitleHighlight}>بكل سهولة وأمان وضمان ضد النصب</span>
          </h1>

          <p className={`${styles.heroSubtitle} animate-fade-in`}>
            سكني هو وسيط آمن يربط طلاب جامعة المنصورة مباشرة بالملاك. نقوم بمعاينة الشقق ميدانياً للتأكد من مواصفاتها للقضاء تماماً على محاولات النصب.
          </p>

          {/* Search Bar Form */}
          <form onSubmit={handleSearchSubmit} className={`${styles.searchWrapper} animate-fade-in`}>
            <Search className={styles.searchIcon} size={22} />
            <input
              type="text"
              placeholder="ابحث عن: شقة مفروشة، بجوار الجامعة، مكيفة..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />

            <select
              value={locationFilter}
              onChange={(e) => setLocationFilter(e.target.value)}
              className={styles.searchSelect}
            >
              <option value="all">كل المناطق</option>
              <option value="حي الجامعة">حي الجامعة</option>
              <option value="بوابة الجلاء">بوابة الجلاء</option>
              <option value="بوابة توشكى">بوابة توشكى</option>
              <option value="المشاية السفلية">المشاية السفلية</option>
              <option value="شارع الترعة">شارع الترعة</option>
            </select>

            <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
              ابحث الآن
            </button>
          </form>

          {/* Quick Filters */}
          <div className={styles.quickFilters}>
            <Link href="/search" className={styles.filterBadge}>الكل</Link>
            <Link href="/search?rent_type=bed" className={styles.filterBadge}>🛌 نظام السراير (تأجير بالسرير)</Link>
            <Link href="/search?rent_type=apartment" className={styles.filterBadge}>🏢 شقق كاملة</Link>
            <Link href="/search?gender=male" className={styles.filterBadge}>سكن شباب (ذكور)</Link>
            <Link href="/search?gender=female" className={styles.filterBadge}>سكن طالبات (إناث)</Link>
          </div>
        </div>
      </header>

      {/* 2. MAIN PROPERTIES LISTINGS SECTION */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.sectionHeader}>
            <div className={styles.sectionTitleInfo}>
              <h2 className={styles.sectionTitle}>العروض المتاحة حالياً</h2>
              <p className={styles.sectionSubtitle}>
                شقق وغرف طلابية مجهزة وقريبة من كليات جامعة المنصورة
              </p>
            </div>

          </div>

          {loading ? (
            /* Loading Skeleton */
            <div className={styles.scrollRow}>
              {[1, 2, 3].map((n) => (
                <div key={n} className={`${styles.card} ${styles.scrollCard}`} style={{ height: '360px' }}>
                  <div className="skeleton" style={{ height: '180px', width: '100%' }}></div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="skeleton" style={{ height: '16px', width: '40%' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '80%' }}></div>
                    <div className="skeleton" style={{ height: '16px', width: '60%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div style={{ textAlign: 'center', padding: '40px', color: 'var(--danger)' }}>
              <HelpCircle size={48} style={{ marginBottom: '15px' }} />
              <p>{error}</p>
            </div>
          ) : properties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>
              <HelpCircle size={48} style={{ marginBottom: '15px', color: 'var(--text-muted)' }} />
              <h3>لا توجد عروض متاحة حالياً</h3>
              <p style={{ marginTop: '10px' }}>برجاء زيارة الموقع لاحقاً لرؤية الإعلانات الجديدة.</p>
            </div>
          ) : (
            <>
              {/* 1. قسم الشقق المميزة */}
              {renderHorizontalSection(
                'الشقق المميزة والموصى بها',
                '/search?featured=true',
                properties.filter((p) => p.is_featured)
              )}

              {/* 2. قسم نظام السراير (تأجير بالسرير) */}
              {renderHorizontalSection(
                '🛌 غرف وسراير طلابية متاحة (تأجير بالسرير)',
                '/search?rent_type=bed',
                properties.filter((p) => p.rent_type === 'bed')
              )}

              {/* 3. قسم الكل */}
              {renderHorizontalSection(
                'جميع العروض المتاحة',
                '/search',
                properties
              )}

              {/* 4. قسم سكن شباب */}
              {renderHorizontalSection(
                'سكن شباب (ذكور)',
                '/search?gender=male',
                properties.filter((p) => p.gender_type === 'male')
              )}

              {/* 5. قسم سكن بنات */}
              {renderHorizontalSection(
                'سكن طالبات (إناث)',
                '/search?gender=female',
                properties.filter((p) => p.gender_type === 'female')
              )}

              {/* 5. قسم مشترك/عائلات */}
              {renderHorizontalSection(
                'سكن مشترك وعائلات',
                '/search?gender=any',
                properties.filter((p) => p.gender_type === 'any')
              )}
            </>
          )}
        </div>
      </section>

      {/* 3. SAFETY & ANTI-FRAUD EXPLANATION */}
      <section className={`${styles.section} ${styles.safetySection}`}>
        <div className="container">
          <div style={{ textAlign: 'center', marginBottom: '50px' }}>
            <h2 className={styles.sectionTitle}>لماذا منصة سكني آمنة 100%؟</h2>
            <p className={styles.sectionSubtitle} style={{ maxWidth: '600px', margin: '10px auto 0 auto' }}>
              صممنا المنصة للقضاء تماماً على النصب ومحاولات استغلال الطلاب
            </p>
          </div>

          <div className={styles.safetyGrid}>
            <div className={styles.safetyCard}>
              <div className={styles.safetyIconWrapper}>
                <ShieldCheck size={32} />
              </div>
              <h3 className={styles.safetyCardTitle}>معاينة ميدانية حقيقية</h3>
              <p className={styles.safetyCardText}>
                فريقنا ينزل على الأرض لمعاينة الشقة، التأكد من جاهزيتها وتطابق الصور المعروضة مع الحقيقة قبل منح شارة التوثيق للمالك.
              </p>
            </div>

            <div className={styles.safetyCard}>
              <div className={styles.safetyIconWrapper}>
                <Smartphone size={32} />
              </div>
              <h3 className={styles.safetyCardTitle}>حظر الدفع المسبق</h3>
              <p className={styles.safetyCardText}>
                الطالب لن يدفع أي نقود إلا وقت كتابة العقود.
              </p>
            </div>

            <div className={styles.safetyCard}>
              <div className={styles.safetyIconWrapper}>
                <MessageCircle size={32} />
              </div>
              <h3 className={styles.safetyCardTitle}>بلاغات نشطة وفورية</h3>
              <p className={styles.safetyCardText}>
                يمكن للطلاب الإبلاغ الفوري عن أي شقة يكتشفون عدم دقة بياناتها، وسيقوم فريق الدعم بمراجعة الإعلان وحظر المالك فوراً إن ثبت تلاعبه.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 4. LANDLORD CTA SECTION */}
      <section className={styles.section}>
        <div className="container">
          <div className={styles.ctaBanner}>
            <div className={styles.ctaContent}>
              <h2 className={styles.ctaTitle}>هل تملك شقة وتريد تأجيرها للطلاب؟</h2>
              <p className={styles.ctaText}>
                اعرض شقتك مجاناً وسجل كمالك في سكني. سنقوم بتوصيلك بالطلاب الباحثين عن سكن موثق وآمن لمساعدتهم وتسهيل عملية التأجير المباشر.
              </p>
            </div>
            <div>
              <Link href="/auth" className="btn btn-secondary styles.ctaBtn">
                <PlusCircle size={20} style={{ marginLeft: '8px' }} />
                <span>سجل شقتك مجاناً الآن</span>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
