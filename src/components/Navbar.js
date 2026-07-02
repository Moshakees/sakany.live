'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { Sparkles, Menu, X, LogOut, User as UserIcon, Bell, Wallet } from 'lucide-react';
import styles from './components.module.css';
import SakanyLogo from './SakanyLogo';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [user, setUser] = useState(null);

  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Sync auth state from localStorage
  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }

    const fetchUnreadCount = async () => {
      try {
        const { getNotifications } = await import('@/utils/supabase');
        const { data } = await getNotifications(user.id);
        if (data) {
          const unread = data.filter(n => !n.is_read).length;
          setUnreadCount(unread);
        }
      } catch (err) {
        console.error('Error fetching unread notifications:', err);
      }
    };

    fetchUnreadCount();

    // Listen for custom notifications change event
    window.addEventListener('notifications_change', fetchUnreadCount);
    
    // Poll every 30 seconds for new notifications
    const interval = setInterval(fetchUnreadCount, 30000);

    return () => {
      window.removeEventListener('notifications_change', fetchUnreadCount);
      clearInterval(interval);
    };
  }, [user]);

  // Sync auth state from localStorage
  useEffect(() => {
    const checkUser = () => {
      const stored = localStorage.getItem('sakany_session');
      if (stored) {
        try {
          setUser(JSON.parse(stored));
        } catch (e) {
          localStorage.removeItem('sakany_session');
        }
      } else {
        setUser(null);
      }
    };

    checkUser();
    
    // Listen for storage events (e.g. login/logout in other tabs, or custom trigger)
    window.addEventListener('storage', checkUser);
    
    // Add custom event listener for same-tab updates
    window.addEventListener('sakany_auth_change', checkUser);
    
    return () => {
      window.removeEventListener('storage', checkUser);
      window.removeEventListener('sakany_auth_change', checkUser);
    };
  }, [pathname]); // Refresh on route changes

  // Close dropdown on click outside
  useEffect(() => {
    if (!dropdownOpen) return;
    const closeDropdown = () => setDropdownOpen(false);
    window.addEventListener('click', closeDropdown);
    return () => window.removeEventListener('click', closeDropdown);
  }, [dropdownOpen]);

  const handleLogout = () => {
    localStorage.removeItem('sakany_session');
    setUser(null);
    setIsOpen(false);
    setDropdownOpen(false);
    
    // Dispatch auth change event
    window.dispatchEvent(new Event('sakany_auth_change'));
    
    router.push('/');
  };

  const getRoleName = (role) => {
    switch(role) {
      case 'student': return 'طالب';
      case 'landlord': return 'مالك';
      case 'broker': return 'سمسار';
      case 'admin': return 'مسؤول';
      default: return 'مستخدم';
    }
  };

  return (
    <nav className={styles.navbar} dir="rtl">
      <div className={`${styles.navContainer} container`}>
        <Link href="/" className={styles.logo}>
          <SakanyLogo size={34} />
          <span>سَكني</span>
        </Link>

        {/* Hamburger Menu Icon */}
        <button 
          className={styles.menuBtn} 
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>

        {/* Links */}
        <ul className={`${styles.navLinks} ${isOpen ? styles.navLinksOpen : ''}`}>
          <li>
            <Link 
              href="/" 
              className={`${styles.navLink} ${pathname === '/' ? styles.navLinkActive : ''}`}
              onClick={() => setIsOpen(false)}
            >
              الرئيسية
            </Link>
          </li>
          <li>
            <Link 
              href="/search" 
              className={`${styles.navLink} ${pathname === '/search' ? styles.navLinkActive : ''}`}
              onClick={() => setIsOpen(false)}
            >
              ابحث عن سكن
            </Link>
          </li>
          
          {/* Dashboard for Landlords & Brokers */}
          {user && (user.role === 'landlord' || user.role === 'broker' || user.role === 'admin') && (
            <li>
              <Link 
                href="/dashboard" 
                className={`${styles.navLink} ${pathname === '/dashboard' ? styles.navLinkActive : ''}`}
                onClick={() => setIsOpen(false)}
              >
                لوحة التحكم
              </Link>
            </li>
          )}

          {/* Conditional Auth Button / User Menu */}
          {user ? (
            <li className={styles.userMenuWrapper}>
              <button 
                className={styles.userMenuBtn}
                onClick={(e) => {
                  e.stopPropagation();
                  setDropdownOpen(!dropdownOpen);
                }}
              >
                <UserIcon size={16} style={{ color: 'var(--primary)' }} />
                <span>{(user.name || user.full_name || 'مستخدم').split(' ')[0]}</span>
                {unreadCount > 0 && (
                  <span className={styles.navbarUnreadBadge}>{unreadCount}</span>
                )}
                <span style={{ fontSize: '0.65rem', marginRight: '4px', opacity: 0.7 }}>▼</span>
              </button>

              {dropdownOpen && (
                <div className={styles.dropdownMenu} onClick={(e) => e.stopPropagation()}>
                  <div className={styles.dropdownHeader}>
                    <div className={styles.dropdownHeaderName}>{user.name || user.full_name || 'مستخدم'}</div>
                    <div className={styles.dropdownHeaderRole}>{getRoleName(user.role)}</div>
                  </div>

                  <Link 
                    href="/profile" 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsOpen(false);
                    }}
                  >
                    <UserIcon size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>تفاصيل الحساب</span>
                  </Link>

                  <Link 
                    href="/notifications" 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsOpen(false);
                    }}
                  >
                    <Bell size={15} style={{ color: 'var(--text-muted)' }} />
                    <span>الإشعارات</span>
                    {unreadCount > 0 && (
                      <span className={styles.unreadBadge}>{unreadCount}</span>
                    )}
                  </Link>

                  <Link 
                    href="/favorites" 
                    className={styles.dropdownItem}
                    onClick={() => {
                      setDropdownOpen(false);
                      setIsOpen(false);
                    }}
                  >
                    <span style={{ fontSize: '1rem', lineHeight: 1 }}>❤️</span>
                    <span>مفضلتي</span>
                  </Link>

                  {user && user.role === 'broker' && (
                    <Link 
                      href="/wallet" 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setDropdownOpen(false);
                        setIsOpen(false);
                      }}
                    >
                      <Wallet size={15} style={{ color: 'var(--text-muted)' }} />
                      <span>الرصيد</span>
                    </Link>
                  )}

                  {/* Dashboard link inside dropdown for admin/owner */}
                  {user && (user.role === 'landlord' || user.role === 'broker' || user.role === 'admin') && (
                    <Link 
                      href="/dashboard" 
                      className={styles.dropdownItem}
                      onClick={() => {
                        setDropdownOpen(false);
                        setIsOpen(false);
                      }}
                    >
                      <span style={{ fontSize: '1rem', lineHeight: 1 }}>📊</span>
                      <span>لوحة التحكم</span>
                    </Link>
                  )}

                  <button 
                    onClick={handleLogout} 
                    className={styles.dropdownItem}
                    style={{ color: 'var(--danger)', borderTop: '1px solid var(--border)' }}
                  >
                    <LogOut size={15} style={{ color: 'var(--danger)' }} />
                    <span>تسجيل الخروج</span>
                  </button>
                </div>
              )}
            </li>
          ) : (
            <li>
              <Link 
                href="/auth" 
                className="btn btn-primary"
                style={{ padding: '8px 20px', borderRadius: 'var(--radius-sm)' }}
                onClick={() => setIsOpen(false)}
              >
                تسجيل الدخول / التسجيل
              </Link>
            </li>
          )}
        </ul>
      </div>
    </nav>
  );
}
