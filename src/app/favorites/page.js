'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  Heart, MapPin, BedDouble, Bath, CheckCircle,
  Trash2, Search, Sparkles
} from 'lucide-react';
import { getPropertiesByIds } from '@/utils/supabase';

const FAVORITES_KEY = 'sakany_favorites';

export function getFavorites() {
  if (typeof window === 'undefined') return [];
  try {
    return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]');
  } catch { return []; }
}

export function toggleFavorite(propertyId) {
  const current = getFavorites();
  const exists = current.includes(propertyId);
  const updated = exists
    ? current.filter(id => id !== propertyId)
    : [...current, propertyId];
  localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
  window.dispatchEvent(new Event('sakany_favorites_change'));
  return !exists; // returns new isFavorited state
}

export function isFavorited(propertyId) {
  return getFavorites().includes(propertyId);
}

export default function FavoritesPage() {
  const router = useRouter();
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const ids = getFavorites();
    if (ids.length === 0) {
      setProperties([]);
      setLoading(false);
      return;
    }
    const { data } = await getPropertiesByIds(ids);
    setProperties(data || []);
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener('sakany_favorites_change', load);
    return () => window.removeEventListener('sakany_favorites_change', load);
  }, []);

  const handleRemove = (id) => {
    toggleFavorite(id);
  };

  const getGenderLabel = (type) => {
    if (type === 'male') return 'سكن طلاب';
    if (type === 'female') return 'سكن طالبات';
    return 'مشترك';
  };

  return (
    <div dir="rtl" style={{ maxWidth: 900, margin: '0 auto', padding: '48px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 36 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
          <div style={{
            width: 44, height: 44, borderRadius: 14,
            background: 'rgba(239,68,68,0.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }}>
            <Heart size={22} style={{ color: '#ef4444', fill: '#ef4444' }} />
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800, color: 'var(--text-primary)' }}>
            مفضلتي
          </h1>
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: '0.95rem', marginRight: 56 }}>
          الشقق التي أضفتها للمفضلة — {loading ? '...' : `${properties.length} شقة`}
        </p>
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
      {!loading && properties.length === 0 && (
        <div style={{
          textAlign: 'center', padding: '80px 24px',
          border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)',
          background: 'var(--surface)'
        }}>
          <div style={{ fontSize: '3.5rem', marginBottom: 16 }}>❤️</div>
          <h2 style={{ fontSize: '1.3rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 10 }}>
            لا توجد شقق في المفضلة بعد
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, maxWidth: 360, margin: '0 auto 24px' }}>
            اضغط على زر القلب ❤️ في صفحة أي شقة لإضافتها إلى مفضلتك وتجدها هنا بسرعة.
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
            ابحث عن شقق الآن
          </Link>
        </div>
      )}

      {/* Properties Grid */}
      {!loading && properties.length > 0 && (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))',
          gap: 20
        }}>
          {properties.map(property => (
            <div
              key={property.id}
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-lg)',
                overflow: 'hidden',
                boxShadow: 'var(--shadow-sm)',
                transition: 'var(--transition)',
                display: 'flex', flexDirection: 'column'
              }}
            >
              {/* Image */}
              <div style={{ position: 'relative', height: 200, flexShrink: 0 }}>
                <img
                  src={property.images?.[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80'}
                  alt={property.title}
                  style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                />
                {/* Remove from Favorites Button */}
                <button
                  onClick={() => handleRemove(property.id)}
                  title="إزالة من المفضلة"
                  style={{
                    position: 'absolute', top: 10, right: 10,
                    width: 36, height: 36, borderRadius: '50%',
                    background: 'rgba(239,68,68,0.9)',
                    border: 'none', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.2s', backdropFilter: 'blur(4px)'
                  }}
                >
                  <Trash2 size={15} style={{ color: '#fff' }} />
                </button>

                {/* Verified Badge */}
                {property.is_verified && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    display: 'flex', alignItems: 'center', gap: 4,
                    background: 'rgba(5,150,105,0.9)', color: '#fff',
                    padding: '3px 8px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                    backdropFilter: 'blur(4px)'
                  }}>
                    <CheckCircle size={11} /> موثق
                  </div>
                )}

                {/* Gender Badge */}
                <div style={{
                  position: 'absolute', bottom: 10, right: 10,
                  background: 'rgba(15,23,42,0.8)', color: '#fff',
                  padding: '3px 10px', borderRadius: 20, fontSize: '0.72rem', fontWeight: 700,
                  backdropFilter: 'blur(4px)'
                }}>
                  {getGenderLabel(property.gender_type)}
                </div>
              </div>

              {/* Body */}
              <div style={{ padding: '16px', flex: 1, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                  <MapPin size={12} /> <span>{property.location}</span>
                </div>

                <h3 style={{
                  fontWeight: 800, fontSize: '1rem',
                  color: 'var(--text-primary)', lineHeight: 1.4,
                  overflow: 'hidden', display: '-webkit-box',
                  WebkitLineClamp: 2, WebkitBoxOrient: 'vertical'
                }}>
                  {property.title}
                </h3>

                <div style={{ display: 'flex', gap: 12, color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <BedDouble size={14} /> {property.rooms} غرف
                  </span>
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Bath size={14} /> {property.bathrooms} حمام
                  </span>
                </div>

                <div style={{ marginTop: 'auto', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div>
                    <span style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--primary)' }}>
                      {property.price?.toLocaleString('ar-EG')}
                    </span>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 4 }}>ج.م / شهر</span>
                  </div>
                  <Link
                    href={`/properties/${property.id}`}
                    style={{
                      background: 'var(--primary)', color: '#fff',
                      padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                      textDecoration: 'none', fontWeight: 700, fontSize: '0.85rem'
                    }}
                  >
                    التفاصيل
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
