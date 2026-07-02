'use client';

import { useState, useEffect } from 'react';
import { Maximize2, Share2, Download, X, ChevronLeft, ChevronRight, Check, Heart } from 'lucide-react';
import styles from '@/app/properties/property.module.css';

const FAVORITES_KEY = 'sakany_favorites';

function getStoredFavorites() {
  try { return JSON.parse(localStorage.getItem(FAVORITES_KEY) || '[]'); } catch { return []; }
}

export default function ImageGallery({ images = [], title = '', propertyId = '' }) {
  const [activeImage, setActiveImage] = useState(images[0] || 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80');
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [showDownloadModal, setShowDownloadModal] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '' });
  const [isFav, setIsFav] = useState(false);

  // Lightbox keyboard navigation (Escape, Left, Right arrows)
  useEffect(() => {
    if (!isLightboxOpen) return;

    const handleKeyDown = (e) => {
      const currentIndex = images.indexOf(activeImage);
      if (e.key === 'Escape') {
        setIsLightboxOpen(false);
      } else if (e.key === 'ArrowRight') {
        // In RTL, ArrowRight moves to next image (index + 1) or wraps
        const nextIndex = (currentIndex + 1) % images.length;
        setActiveImage(images[nextIndex]);
      } else if (e.key === 'ArrowLeft') {
        // In RTL, ArrowLeft moves to previous image (index - 1)
        const prevIndex = (currentIndex - 1 + images.length) % images.length;
        setActiveImage(images[prevIndex]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isLightboxOpen, activeImage, images]);

  // Sync isFav from localStorage on mount and on change
  useEffect(() => {
    if (!propertyId) return;
    const sync = () => setIsFav(getStoredFavorites().includes(propertyId));
    sync();
    window.addEventListener('sakany_favorites_change', sync);
    return () => window.removeEventListener('sakany_favorites_change', sync);
  }, [propertyId]);

  // Auto-hide toast after 3 seconds
  useEffect(() => {
    if (toast.show) {
      const timer = setTimeout(() => {
        setToast({ show: false, message: '' });
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [toast.show]);

  // Toggle favorite handler
  const handleToggleFavorite = () => {
    if (!propertyId) return;
    const current = getStoredFavorites();
    const exists = current.includes(propertyId);
    const updated = exists ? current.filter(id => id !== propertyId) : [...current, propertyId];
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(updated));
    setIsFav(!exists);
    window.dispatchEvent(new Event('sakany_favorites_change'));
    setToast({
      show: true,
      message: !exists ? '❤️ تمت إضافة الشقة إلى مفضلتك!' : '💔 تمت إزالة الشقة من مفضلتك'
    });
  };

  if (images.length === 0) {
    return (
      <div className={styles.mainImageWrapper}>
        <img 
          src="https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80" 
          alt={title} 
          className={styles.mainImage} 
        />
      </div>
    );
  }

  // Copy short link handler
  const handleShare = async () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const shortUrl = `${origin}/p/${propertyId || 'view'}`;
    
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(shortUrl);
        setToast({ show: true, message: 'تم نسخ الرابط المختصر للشقة بنجاح!' });
      } else {
        // Fallback for older browsers or insecure contexts
        const textarea = document.createElement('textarea');
        textarea.value = shortUrl;
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        setToast({ show: true, message: 'تم نسخ الرابط المختصر للشقة بنجاح!' });
      }
    } catch (err) {
      setToast({ show: true, message: 'فشل نسخ الرابط، يرجى المحاولة يدوياً.' });
    }
  };

  // Download logic helper
  const downloadSingleImage = async (url, index) => {
    try {
      const response = await fetch(url, { mode: 'cors' });
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.download = `property-${propertyId || 'image'}-${index + 1}.jpg`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    } catch (error) {
      // Fallback if CORS prevents blob download - open in new tab
      window.open(url, '_blank');
    }
  };

  // Download active image
  const handleDownloadCurrent = () => {
    const index = images.indexOf(activeImage);
    downloadSingleImage(activeImage, index >= 0 ? index : 0);
    setShowDownloadModal(false);
  };

  // Download all images with staggered delay (300ms) to avoid browser blocking
  const handleDownloadAll = async () => {
    setShowDownloadModal(false);
    setToast({ show: true, message: 'جاري بدء تحميل كافة الصور...' });
    for (let i = 0; i < images.length; i++) {
      await new Promise((resolve) => setTimeout(resolve, 350));
      downloadSingleImage(images[i], i);
    }
  };

  const currentIndex = images.indexOf(activeImage);

  return (
    <div className={styles.gallery} dir="rtl">
      {/* Main Image */}
      <div className={styles.mainImageWrapper}>
        <img 
          src={activeImage} 
          alt={title} 
          className={styles.mainImage} 
          onClick={() => setIsLightboxOpen(true)}
          style={{ cursor: 'zoom-in' }}
        />

        {/* Toolbar Icons Overlay */}
        <div className={styles.imageToolbar}>
          <button 
            className={styles.toolbarBtn} 
            title="تكبير الصورة"
            onClick={() => setIsLightboxOpen(true)}
          >
            <Maximize2 size={18} />
          </button>
          
          <button 
            className={styles.toolbarBtn} 
            title="تحميل الصور"
            onClick={() => setShowDownloadModal(true)}
          >
            <Download size={18} />
          </button>

          <button 
            className={styles.toolbarBtn} 
            title="مشاركة الشقة"
            onClick={handleShare}
          >
            <Share2 size={18} />
          </button>

          <button 
            className={styles.toolbarBtn} 
            title={isFav ? 'إزالة من المفضلة' : 'إضافة إلى المفضلة'}
            onClick={handleToggleFavorite}
            style={isFav ? { background: 'rgba(239,68,68,0.85)', borderColor: 'rgba(239,68,68,0.5)' } : {}}
          >
            <Heart size={18} style={{ fill: isFav ? '#fff' : 'transparent', color: isFav ? '#fff' : '#fff' }} />
          </button>
        </div>
      </div>

      {/* Thumbnails */}
      {images.length > 1 && (
        <div className={styles.thumbnails}>
          {images.map((img, index) => (
            <div 
              key={index} 
              className={`${styles.thumbnail} ${activeImage === img ? styles.thumbnailActive : ''}`}
              onClick={() => setActiveImage(img)}
              onMouseEnter={() => setActiveImage(img)}
            >
              <img 
                src={img} 
                alt={`${title} - صورة ${index + 1}`} 
                className={styles.thumbnailImage} 
              />
            </div>
          ))}
        </div>
      )}

      {/* Lightbox / Zoom Overlay */}
      {isLightboxOpen && (
        <div className={styles.lightbox}>
          <div className={styles.lightboxContent}>
            {/* Close Button */}
            <button 
              className={styles.lightboxClose}
              onClick={() => setIsLightboxOpen(false)}
            >
              <X size={20} />
            </button>

            {/* Next / Prev Navigation */}
            {images.length > 1 && (
              <>
                <button 
                  className={`${styles.lightboxArrow} ${styles.lightboxArrowLeft}`}
                  onClick={() => {
                    const prevIndex = (currentIndex - 1 + images.length) % images.length;
                    setActiveImage(images[prevIndex]);
                  }}
                >
                  <ChevronLeft size={24} />
                </button>

                <button 
                  className={`${styles.lightboxArrow} ${styles.lightboxArrowRight}`}
                  onClick={() => {
                    const nextIndex = (currentIndex + 1) % images.length;
                    setActiveImage(images[nextIndex]);
                  }}
                >
                  <ChevronRight size={24} />
                </button>
              </>
            )}

            {/* Lightbox Image */}
            <img 
              src={activeImage} 
              alt={title} 
              className={styles.lightboxImage} 
            />

            {/* Caption Indicator */}
            {images.length > 0 && (
              <div className={styles.lightboxCaption}>
                صورة {currentIndex + 1} من {images.length}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Download Choice Custom Dialog */}
      {showDownloadModal && (
        <div className={styles.modalOverlay} onClick={() => setShowDownloadModal(false)}>
          <div className={styles.modalContent} onClick={(e) => e.stopPropagation()}>
            <div className={styles.modalTitle}>خيارات تحميل الصور</div>
            <div className={styles.modalDesc}>
              هل ترغب في تحميل هذه الصورة الحالية فقط أم جميع صور الشقة ({images.length} صور)؟
            </div>
            
            <div className={styles.modalActions}>
              <button className={styles.btnPrimary} onClick={handleDownloadCurrent}>
                تحميل الصورة الحالية فقط
              </button>
              {images.length > 1 && (
                <button className={styles.btnSecondary} onClick={handleDownloadAll}>
                  تحميل جميع الصور ({images.length})
                </button>
              )}
              <button className={styles.btnCancel} onClick={() => setShowDownloadModal(false)}>
                إلغاء
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Share Toast Notification */}
      {toast.show && (
        <div className={styles.toast}>
          <Check size={18} style={{ color: '#10b981' }} />
          <span>{toast.message}</span>
        </div>
      )}
    </div>
  );
}
