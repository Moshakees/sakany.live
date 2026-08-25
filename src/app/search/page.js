'use client';

import { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { 
  Search, 
  SlidersHorizontal, 
  X, 
  MapPin, 
  BedDouble, 
  Bath, 
  CheckCircle, 
  Wifi, 
  Wind, 
  Building, 
  RotateCcw,
  AlertCircle,
  Sparkles,
  ArrowUpDown
} from 'lucide-react';
import styles from './search.module.css';
import { getProperties, isDemoMode } from '@/utils/supabase';

const MANSOURA_DISTRICTS = [
  // --- أحياء الجامعة والبوابات ---
  'حي الجامعة', 'بوابة الجلاء', 'بوابة توشكى', 'بوابة الجلاء القديمة',
  // --- وسط المنصورة ---
  'المشاية السفلية', 'المشاية العلوية', 'شارع الجمهورية', 'شارع سعد زغلول',
  'ميدان المحطة', 'المحطة', 'حي النيل', 'كورنيش النيل',
  // --- أحياء شمال المنصورة ---
  'شارع الترعة', 'حي الجلاء', 'ميت خاقان', 'كفر الشرفا', 'الشهداء',
  // --- أحياء جنوب المنصورة ---
  'حي السلام', 'العمراوي', 'ميت علوان',
  // --- أحياء شرق المنصورة ---
  'قسم أول المنصورة', 'قسم ثاني المنصورة', 'قسم ثالث المنصورة',
  'الجزيرة', 'نادي المنصورة',
  // --- ضواحي وطرق ---
  'ميت غمر الطريق', 'بورسعيد', 'طريق بورسعيد', 'طريق دمياط',
  'طريق المطار', 'طريق القاهرة',
  // --- مناطق جديدة ---
  'المنصورة الجديدة', 'سراي', 'ميت الخولي', 'طلخا', 'أخرى'
];


function SearchContent() {
  const searchParams = useSearchParams();
  const router = useRouter();

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [locationFilter, setLocationFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [roomsFilter, setRoomsFilter] = useState('all');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [floorFilter, setFloorFilter] = useState('all');
  const [rentTypeFilter, setRentTypeFilter] = useState('all');
  
  // Amenities Checkboxes
  const [hasAc, setHasAc] = useState(false);
  const [hasInternet, setHasInternet] = useState(false);
  const [hasElevator, setHasElevator] = useState(false);
  const [featuredFilter, setFeaturedFilter] = useState(false);
  
  // Sort State
  const [sortBy, setSortBy] = useState('newest');

  // Listings State
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Mobile drawer state
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Initialize filters from URL parameters on first load or URL change
  useEffect(() => {
    const q = searchParams.get('q') || '';
    const location = searchParams.get('location') || 'all';
    const gender = searchParams.get('gender') || 'all';
    const featured = searchParams.get('featured') === 'true';
    const rentType = searchParams.get('rent_type') || 'all';
    
    setSearchQuery(q);
    setLocationFilter(location);
    setGenderFilter(gender);
    setFeaturedFilter(featured);
    setRentTypeFilter(rentType);
  }, [searchParams]);

  // Fetch properties helper
  const fetchFilteredListings = async () => {
    setLoading(true);
    setError(null);
    try {
      const filters = {
        search: searchQuery,
        location: locationFilter,
        gender_type: genderFilter,
        rooms: roomsFilter,
        floor: floorFilter === 'all' ? undefined : floorFilter,
        has_ac: hasAc || undefined,
        has_internet: hasInternet || undefined,
        has_elevator: hasElevator || undefined,
        minPrice: minPrice ? Number(minPrice) : undefined,
        maxPrice: maxPrice ? Number(maxPrice) : undefined,
        featured: featuredFilter || undefined,
        rent_type: rentTypeFilter !== 'all' ? rentTypeFilter : undefined,
      };

      const { data, error: fetchError } = await getProperties(filters);

      if (fetchError) {
        setError('حدث خطأ أثناء تحميل البيانات. برجاء المحاولة لاحقاً.');
      } else {
        // Apply sorting on the client side
        let sortedData = [...(data || [])];
        if (sortBy === 'price-asc') {
          sortedData.sort((a, b) => a.price - b.price);
        } else if (sortBy === 'price-desc') {
          sortedData.sort((a, b) => b.price - a.price);
        } else {
          // Default: newest
          sortedData.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        }
        setProperties(sortedData);
      }
    } catch (err) {
      setError('حدث خطأ غير متوقع.');
    } finally {
      setLoading(false);
    }
  };

  // Trigger fetch when parameters or filters change
  useEffect(() => {
    fetchFilteredListings();
  }, [
    locationFilter, 
    genderFilter, 
    roomsFilter, 
    floorFilter, 
    hasAc, 
    hasInternet, 
    hasElevator,
    featuredFilter,
    rentTypeFilter,
    sortBy
  ]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    fetchFilteredListings();
  };

  const handlePriceFilterSubmit = () => {
    fetchFilteredListings();
  };

  const clearAllFilters = () => {
    setSearchQuery('');
    setLocationFilter('all');
    setGenderFilter('all');
    setRoomsFilter('all');
    setMinPrice('');
    setMaxPrice('');
    setFloorFilter('all');
    setHasAc(false);
    setHasInternet(false);
    setHasElevator(false);
    setFeaturedFilter(false);
    setRentTypeFilter('all');
    setSortBy('newest');
    
    // Clear URL parameters
    router.push('/search');
  };

  const getGenderName = (type) => {
    switch(type) {
      case 'male': return 'سكن طلاب (ذكور)';
      case 'female': return 'سكن طالبات (إناث)';
      default: return 'سكن مشترك / عائلات';
    }
  };

  const getGenderClass = (type) => {
    switch(type) {
      case 'male': return styles.genderMale;
      case 'female': return styles.genderFemale;
      default: return styles.genderAny;
    }
  };

  const renderFiltersContent = () => (
    <>
      {/* 0. Rent Type Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>نوع الإيجار</label>
        <select
          value={rentTypeFilter}
          onChange={(e) => setRentTypeFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">الكل (شقق + سراير)</option>
          <option value="apartment">🏢 شقة كاملة</option>
          <option value="bed">🛌 تأجير بالسرير</option>
        </select>
      </div>

      {/* 1. Area Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>المنطقة في المنصورة</label>
        <select
          value={locationFilter}
          onChange={(e) => setLocationFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">كل المناطق</option>
          {MANSOURA_DISTRICTS.map((district) => (
            <option key={district} value={district}>{district}</option>
          ))}
        </select>
      </div>

      {/* 2. Tenant Type Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>نوع المستأجر</label>
        <select
          value={genderFilter}
          onChange={(e) => setGenderFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">الكل</option>
          <option value="male">شباب (ذكور)</option>
          <option value="female">بنات (إناث)</option>
          <option value="any">سكن مشترك / عائلات</option>
        </select>
      </div>

      {/* 3. Rooms Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>عدد الغرف</label>
        <select
          value={roomsFilter}
          onChange={(e) => setRoomsFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">الكل</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>{num} {num === 1 ? 'غرفة' : num === 2 ? 'غرفتين' : 'غرف'}</option>
          ))}
        </select>
      </div>

      {/* 4. Floor Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>الدور</label>
        <select
          value={floorFilter}
          onChange={(e) => setFloorFilter(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="all">الكل</option>
          <option value="0">الدور الأرضي</option>
          {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((num) => (
            <option key={num} value={num}>الدور {num}</option>
          ))}
          <option value="11">الدور 11 فأكثر</option>
        </select>
      </div>

      {/* 5. Price Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>الفئة السعرية (شهرياً)</label>
        <div className={styles.priceRangeInputs}>
          <input
            type="number"
            placeholder="الحد الأدنى"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            onBlur={handlePriceFilterSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceFilterSubmit()}
            className={styles.priceInput}
          />
          <span className={styles.priceDivider}>إلى</span>
          <input
            type="number"
            placeholder="الحد الأقصى"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            onBlur={handlePriceFilterSubmit}
            onKeyDown={(e) => e.key === 'Enter' && handlePriceFilterSubmit()}
            className={styles.priceInput}
          />
        </div>
      </div>

      {/* 6. Amenities Filter */}
      <div className={styles.filterGroup}>
        <label className={styles.filterLabel}>المميزات الإضافية</label>
        <div className={styles.amenityCheckboxes}>
          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={hasAc}
              onChange={(e) => setHasAc(e.target.checked)}
              className={styles.checkbox}
            />
            <Wind size={16} />
            <span>مكيفة</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={hasInternet}
              onChange={(e) => setHasInternet(e.target.checked)}
              className={styles.checkbox}
            />
            <Wifi size={16} />
            <span>فيها إنترنت (نت)</span>
          </label>

          <label className={styles.checkboxLabel}>
            <input
              type="checkbox"
              checked={hasElevator}
              onChange={(e) => setHasElevator(e.target.checked)}
              className={styles.checkbox}
            />
            <Building size={16} />
            <span>عمارة بها مصعد (أسانسير)</span>
          </label>

          <label className={styles.checkboxLabel} style={{ borderTop: '1px solid var(--border)', paddingTop: '10px', marginTop: '5px' }}>
            <input
              type="checkbox"
              checked={featuredFilter}
              onChange={(e) => setFeaturedFilter(e.target.checked)}
              className={styles.checkbox}
            />
            <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
            <span style={{ fontWeight: '700', color: 'var(--text-primary)' }}>شقق مميزة فقط</span>
          </label>
        </div>
      </div>
    </>
  );

  return (
    <div dir="rtl" className={`${styles.searchPage} container`}>
      
      {/* Search Bar Block */}
      <header className={styles.header}>
        <form onSubmit={handleSearchSubmit} className={styles.searchBarContainer}>
          <div className={styles.searchField}>
            <Search className={styles.searchIcon} size={20} />
            <input
              type="text"
              placeholder="ابحث بالنص: شارع جيهان، بجوار النيل، سوبر لوكس..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={styles.searchInput}
            />
          </div>
          <button type="submit" className={`btn btn-primary ${styles.searchBtn}`}>
            ابحث الآن
          </button>
        </form>
      </header>

      {/* Layout: Sidebar + Main Results */}
      <main className={styles.mainLayout}>
        
        {/* Desktop Sidebar Filters */}
        <aside className={styles.sidebar}>
          <div className={styles.sidebarTitle}>
            <span>تصفية البحث</span>
            {(locationFilter !== 'all' || genderFilter !== 'all' || roomsFilter !== 'all' || floorFilter !== 'all' || searchQuery || minPrice || maxPrice || hasAc || hasInternet || hasElevator || featuredFilter) && (
              <button onClick={clearAllFilters} className={styles.clearFiltersBtn}>
                <RotateCcw size={14} style={{ marginLeft: '4px', display: 'inline' }} />
                <span>إعادة ضبط</span>
              </button>
            )}
          </div>
          {renderFiltersContent()}
        </aside>

        {/* Mobile Filter Drawer */}
        <div className={`${styles.filterOverlay} ${mobileFiltersOpen ? styles.filterOverlayActive : ''}`} onClick={() => setMobileFiltersOpen(false)} />
        <aside className={`${styles.sidebarMobile} ${mobileFiltersOpen ? styles.sidebarMobileActive : ''}`}>
          <div className={styles.mobileFilterHeader}>
            <span className={styles.mobileFilterTitle}>تصفية النتائج</span>
            <button className={styles.mobileFilterClose} onClick={() => setMobileFiltersOpen(false)}>
              <X size={24} />
            </button>
          </div>
          {renderFiltersContent()}
          <button 
            className="btn btn-primary" 
            style={{ marginTop: 'auto', width: '100%' }}
            onClick={() => setMobileFiltersOpen(false)}
          >
            تطبيق التصفية
          </button>
        </aside>

        {/* Results Column */}
        <section className={styles.resultsContainer}>
          
          {/* Results Header: Count & Sorting */}
          <div className={styles.resultsHeader}>
            <div className={styles.resultsCount}>
              {loading ? (
                <span>جاري البحث...</span>
              ) : (
                <>
                  تم العثور على <span className={styles.resultsCountHighlight}>{properties.length}</span> نتيجة تطابق اختياراتك
                </>
              )}
            </div>

            <div className={styles.sortContainer}>
              <span className={styles.sortLabel}>ترتيب حسب:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className={styles.sortSelect}
              >
                <option value="newest">الأحدث نشرًا</option>
                <option value="price-asc">الأقل سعراً</option>
                <option value="price-desc">الأعلى سعراً</option>
              </select>
            </div>
          </div>

          {/* Listings State */}
          {loading ? (
            /* Results Grid - Skeleton Loader */
            <div className={styles.resultsGrid}>
              {[1, 2, 3, 4].map((n) => (
                <div key={n} className={styles.card} style={{ height: '380px' }}>
                  <div className="skeleton" style={{ height: '180px', width: '100%' }}></div>
                  <div style={{ padding: '16px', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                    <div className="skeleton" style={{ height: '16px', width: '40%' }}></div>
                    <div className="skeleton" style={{ height: '20px', width: '85%' }}></div>
                    <div className="skeleton" style={{ height: '16px', width: '60%' }}></div>
                  </div>
                </div>
              ))}
            </div>
          ) : error ? (
            <div className={styles.emptyState}>
              <AlertCircle size={48} style={{ color: 'var(--danger)' }} />
              <h3 className={styles.emptyStateTitle}>{error}</h3>
              <button onClick={fetchFilteredListings} className="btn btn-secondary">
                إعادة المحاولة
              </button>
            </div>
          ) : properties.length === 0 ? (
            /* Empty State */
            <div className={styles.emptyState}>
              <AlertCircle size={48} style={{ color: 'var(--text-muted)' }} />
              <h3 className={styles.emptyStateTitle}>لا توجد نتائج مطابقة لبحثك</h3>
              <p className={styles.emptyStateDesc}>
                جرب تعديل خيارات التصفية، أو تقليل عدد الغرف، أو توسيع الفئة السعرية لتجد المزيد من الخيارات.
              </p>
              <button onClick={clearAllFilters} className={`btn btn-primary ${styles.emptyStateBtn}`}>
                إعادة ضبط جميع الفلاتر
              </button>
            </div>
          ) : (
            /* Results Grid - Property Cards */
            <div className={styles.resultsGrid}>
              {properties.map((property) => (
                <div key={property.id} className={styles.card}>
                  {/* Property Image & Badges */}
                  <div className={styles.imageContainer}>
                    <img 
                      src={property.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'} 
                      alt={property.title} 
                      className={styles.image}
                    />
                    
                    {property.is_verified && (
                      <div className={`${styles.verifiedBadge} badge badge-verified`}>
                        <CheckCircle size={12} style={{ marginLeft: '4px' }} />
                        <span>موثق</span>
                      </div>
                    )}

                    <div className={styles.rentTypeBadge}>
                      {property.rent_type === 'bed' ? '🛌 سرير' : '🏢 شقة'}
                    </div>

                    <div className={`${styles.genderBadge} badge ${getGenderClass(property.gender_type)}`}>
                      <span>{getGenderName(property.gender_type)}</span>
                    </div>
                  </div>

                  {/* Card Body */}
                  <div className={styles.cardBody}>
                    <div className={styles.cardLocation}>
                      <MapPin size={12} style={{ marginLeft: '4px', verticalAlign: 'middle' }} />
                      <span>{property.location}</span>
                    </div>

                    <h3 className={styles.cardTitle}>{property.title}</h3>

                    {/* Specs: Rooms & Bathrooms or Beds */}
                    <div className={styles.specs}>
                      {property.rent_type === 'bed' ? (
                        <div className={styles.specItem}>
                          <BedDouble size={14} />
                          <span>متاح {property.available_beds ?? property.beds} سرير</span>
                        </div>
                      ) : (
                        <>
                          <div className={styles.specItem}>
                            <BedDouble size={14} />
                            <span>{property.rooms} غرف</span>
                          </div>
                          <div className={styles.specItem}>
                            <Bath size={14} />
                            <span>{property.bathrooms} حمام</span>
                          </div>
                        </>
                      )}
                    </div>

                    {/* Mini Amenity Badges */}
                    <div className={styles.amenityBadges}>
                      {property.has_ac && (
                        <span className={styles.amenityMiniBadge}>
                          <Wind size={10} />
                          مكيفة
                        </span>
                      )}
                      {property.has_internet && (
                        <span className={styles.amenityMiniBadge}>
                          <Wifi size={10} />
                          نت
                        </span>
                      )}
                      {property.has_elevator && (
                        <span className={styles.amenityMiniBadge}>
                          <Building size={10} />
                          مصعد
                        </span>
                      )}
                      {property.floor !== undefined && property.floor !== null && (
                        <span className={styles.amenityMiniBadge}>
                          الدور {property.floor === 0 ? 'الأرضي' : property.floor}
                        </span>
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
          )}
        </section>
      </main>

      {/* Floating Filters Button for Mobile */}
      <button 
        className={`btn btn-primary ${styles.mobileFilterToggle}`}
        onClick={() => setMobileFiltersOpen(true)}
      >
        <SlidersHorizontal size={18} />
        <span>تصفية النتائج</span>
      </button>
      
    </div>
  );
}

function SearchLoadingSkeleton() {
  return (
    <div dir="rtl" className="container" style={{ padding: '80px 24px', textAlign: 'center' }}>
      <div className="skeleton" style={{ height: '52px', maxWidth: '600px', margin: '0 auto 40px auto', borderRadius: '12px' }}></div>
      <div style={{ display: 'flex', gap: '30px' }}>
        <div className="skeleton" style={{ flex: '0 0 320px', height: '500px', borderRadius: '12px' }}></div>
        <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '20px' }}>
          {[1, 2, 3].map((n) => (
            <div key={n} className="skeleton" style={{ height: '380px', borderRadius: '12px' }}></div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function SearchPage() {
  return (
    <Suspense fallback={<SearchLoadingSkeleton />}>
      <SearchContent />
    </Suspense>
  );
}
