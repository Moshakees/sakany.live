'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Bell, Check, Loader2 } from 'lucide-react';
import { getNotifications, markNotificationAsRead } from '@/utils/supabase';
import styles from './notifications.module.css';

export default function NotificationsPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const stored = localStorage.getItem('sakany_session');
    if (!stored) {
      router.push('/auth');
      return;
    }
    try {
      setUser(JSON.parse(stored));
    } catch (e) {
      router.push('/auth');
    }
  }, [router]);

  useEffect(() => {
    if (!user) return;

    const fetchNotifications = async () => {
      try {
        setLoading(true);
        const { data, error } = await getNotifications(user.id);
        if (error) {
          setError('فشل في تحميل الإشعارات.');
        } else {
          setNotifications(data || []);
        }
      } catch (err) {
        setError('حدث خطأ أثناء تحميل الإشعارات.');
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();
  }, [user]);

  const handleMarkAsRead = async (id) => {
    try {
      const { error } = await markNotificationAsRead(id);
      if (!error) {
        setNotifications(prev =>
          prev.map(n => (n.id === id ? { ...n, is_read: true } : n))
        );
        // Trigger sync event for Navbar
        window.dispatchEvent(new CustomEvent('notifications_change'));
      }
    } catch (err) {
      console.error('Error marking notification as read:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    const unread = notifications.filter(n => !n.is_read);
    if (unread.length === 0) return;

    try {
      await Promise.all(unread.map(n => markNotificationAsRead(n.id)));
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
      window.dispatchEvent(new CustomEvent('notifications_change'));
    } catch (err) {
      console.error('Error marking all notifications as read:', err);
    }
  };

  const formatTime = (isoString) => {
    try {
      const date = new Date(isoString);
      return date.toLocaleDateString('ar-EG', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
      return '';
    }
  };

  if (!user || loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', marginLeft: '10px' }} />
        <span>جاري تحميل الإشعارات...</span>
      </div>
    );
  }

  return (
    <div className={styles.pageContainer}>
      {error && <div className={styles.error}>{error}</div>}
      
      <div className={styles.header}>
        <h1 className={styles.title}>
          <Bell size={28} style={{ color: 'var(--primary)' }} />
          <span>إشعاراتي</span>
        </h1>
        {notifications.some(n => !n.is_read) && (
          <button onClick={handleMarkAllAsRead} className={styles.markAllBtn}>
            تعيين الكل كمقروء
          </button>
        )}
      </div>

      {notifications.length === 0 ? (
        <div className={styles.emptyState}>
          <div className={styles.iconWrapper} style={{ width: '64px', height: '64px' }}>
            <Bell size={32} />
          </div>
          <h2 className={styles.emptyTitle}>علبة الإشعارات فارغة</h2>
          <p className={styles.emptyText}>
            ليس لديك أي إشعارات حالياً. عند إرسال أي تحديثات أو تنبيهات متعلقة بحسابك ستظهر هنا.
          </p>
        </div>
      ) : (
        <div className={styles.list}>
          {notifications.map((notif) => (
            <div 
              key={notif.id} 
              className={`${styles.card} ${!notif.is_read ? styles.unreadCard : ''}`}
              onClick={() => !notif.is_read && handleMarkAsRead(notif.id)}
            >
              <div className={styles.iconWrapper}>
                <Bell size={20} />
              </div>
              <div className={styles.content}>
                <h3 className={styles.cardTitle}>
                  <span>{notif.title}</span>
                  {!notif.is_read && <span className={styles.unreadDot}></span>}
                </h3>
                <p className={styles.message}>{notif.message}</p>
                <span className={styles.time}>{formatTime(notif.created_at)}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
