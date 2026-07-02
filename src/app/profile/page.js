'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  User, Phone, Mail, Shield, Calendar,
  Edit3, Save, X, CheckCircle, AlertCircle, Lock
} from 'lucide-react';
import { getUserProfile, supabase, isDemoMode } from '@/utils/supabase';

const ROLE_LABELS = {
  student: { label: 'طالب / طالبة', color: '#2563eb', bg: 'rgba(37,99,235,0.1)', icon: '🎓' },
  landlord: { label: 'مالك عقار', color: '#059669', bg: 'rgba(5,150,105,0.1)', icon: '🏠' },
  broker: { label: 'سمسار / وسيط', color: '#d97706', bg: 'rgba(217,119,6,0.1)', icon: '🤝' },
  admin: { label: 'مسؤول المنصة', color: '#7c3aed', bg: 'rgba(124,58,237,0.1)', icon: '⚙️' },
};

export default function ProfilePage() {
  const router = useRouter();
  const [sessionUser, setSessionUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editName, setEditName] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState({ text: '', type: '' });

  useEffect(() => {
    const stored = localStorage.getItem('sakany_session');
    if (!stored) {
      router.push('/auth');
      return;
    }
    try {
      const u = JSON.parse(stored);
      setSessionUser(u);
      loadProfile(u.id);
    } catch {
      router.push('/auth');
    }
  }, []);

  const loadProfile = async (userId) => {
    setLoading(true);
    const { data, error } = await getUserProfile(userId);
    if (!error && data) {
      setProfile(data);
      setEditName(data.full_name || '');
    }
    setLoading(false);
  };

  const handleSaveName = async () => {
    if (!editName.trim()) return;
    setSaving(true);
    setMsg({ text: '', type: '' });

    if (isDemoMode) {
      // Simulate save in demo mode
      await new Promise(r => setTimeout(r, 600));
      setProfile(prev => ({ ...prev, full_name: editName.trim() }));
      const updatedSession = { ...sessionUser, name: editName.trim() };
      localStorage.setItem('sakany_session', JSON.stringify(updatedSession));
      window.dispatchEvent(new Event('sakany_auth_change'));
      setEditing(false);
      setMsg({ text: 'تم حفظ الاسم بنجاح.', type: 'success' });
      setSaving(false);
      return;
    }

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ full_name: editName.trim() })
        .eq('id', sessionUser.id);

      if (error) throw error;

      setProfile(prev => ({ ...prev, full_name: editName.trim() }));
      const updatedSession = { ...sessionUser, name: editName.trim() };
      localStorage.setItem('sakany_session', JSON.stringify(updatedSession));
      window.dispatchEvent(new Event('sakany_auth_change'));
      setEditing(false);
      setMsg({ text: 'تم حفظ الاسم بنجاح.', type: 'success' });
    } catch (err) {
      setMsg({ text: err.message || 'فشل حفظ التعديلات.', type: 'error' });
    }
    setSaving(false);
  };

  const roleInfo = ROLE_LABELS[profile?.role] || ROLE_LABELS.student;

  if (loading) {
    return (
      <div dir="rtl" style={{ maxWidth: 700, margin: '80px auto', padding: '0 20px', textAlign: 'center' }}>
        <div style={{ width: 48, height: 48, border: '3px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', margin: '0 auto', animation: 'spin 0.8s linear infinite' }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        <p style={{ marginTop: 16, color: 'var(--text-secondary)' }}>جاري تحميل بياناتك...</p>
      </div>
    );
  }

  return (
    <div dir="rtl" style={{ maxWidth: 700, margin: '60px auto', padding: '0 20px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 88, height: 88,
          borderRadius: '50%',
          background: `linear-gradient(135deg, var(--primary), #7c3aed)`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          margin: '0 auto 16px',
          boxShadow: '0 8px 24px rgba(5,150,105,0.25)',
          fontSize: '2.2rem'
        }}>
          {roleInfo.icon}
        </div>
        <h1 style={{ fontSize: '1.7rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: 6 }}>
          {profile?.full_name}
        </h1>
        <span style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: roleInfo.bg, color: roleInfo.color,
          padding: '4px 14px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700,
          border: `1px solid ${roleInfo.color}40`
        }}>
          <Shield size={13} /> {roleInfo.label}
        </span>
      </div>

      {/* Alert Message */}
      {msg.text && (
        <div style={{
          marginBottom: 20,
          padding: '12px 18px',
          borderRadius: 'var(--radius-md)',
          background: msg.type === 'success' ? 'rgba(5,150,105,0.1)' : 'rgba(239,68,68,0.1)',
          border: `1px solid ${msg.type === 'success' ? 'rgba(5,150,105,0.3)' : 'rgba(239,68,68,0.3)'}`,
          color: msg.type === 'success' ? 'var(--primary)' : 'var(--danger)',
          display: 'flex', alignItems: 'center', gap: 8, fontWeight: 600
        }}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Profile Card */}
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        overflow: 'hidden',
        boxShadow: 'var(--shadow-md)'
      }}>
        {/* Section Title */}
        <div style={{
          padding: '18px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center'
        }}>
          <h2 style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            بيانات الحساب
          </h2>
          {!editing ? (
            <button
              onClick={() => { setEditing(true); setMsg({ text: '', type: '' }); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--primary-light)', color: 'var(--primary)',
                border: '1px solid rgba(5,150,105,0.2)',
                padding: '7px 14px', borderRadius: 'var(--radius-sm)',
                cursor: 'pointer', fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit'
              }}
            >
              <Edit3 size={14} /> تعديل الاسم
            </button>
          ) : (
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={handleSaveName}
                disabled={saving}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'var(--primary)', color: '#fff',
                  border: 'none', padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontWeight: 700, fontSize: '0.85rem', fontFamily: 'inherit',
                  opacity: saving ? 0.7 : 1
                }}
              >
                <Save size={14} /> {saving ? 'جاري الحفظ...' : 'حفظ'}
              </button>
              <button
                onClick={() => { setEditing(false); setEditName(profile?.full_name || ''); }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'transparent', color: 'var(--text-secondary)',
                  border: '1px solid var(--border)', padding: '7px 14px',
                  borderRadius: 'var(--radius-sm)', cursor: 'pointer',
                  fontWeight: 600, fontSize: '0.85rem', fontFamily: 'inherit'
                }}
              >
                <X size={14} /> إلغاء
              </button>
            </div>
          )}
        </div>

        {/* Fields */}
        <div style={{ padding: '8px 0' }}>
          {/* Full Name */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            gap: 16
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(37,99,235,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <User size={18} style={{ color: '#2563eb' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>الاسم الكامل</div>
              {editing ? (
                <input
                  value={editName}
                  onChange={e => setEditName(e.target.value)}
                  style={{
                    width: '100%', background: 'var(--background)',
                    border: '1px solid var(--primary)',
                    borderRadius: 'var(--radius-sm)', padding: '8px 12px',
                    fontSize: '0.95rem', color: 'var(--text-primary)',
                    fontFamily: 'inherit', outline: 'none'
                  }}
                />
              ) : (
                <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                  {profile?.full_name || '—'}
                </div>
              )}
            </div>
          </div>

          {/* Phone */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            gap: 16
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(5,150,105,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Phone size={18} style={{ color: 'var(--primary)' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>رقم الهاتف</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', direction: 'ltr', textAlign: 'right' }}>
                {profile?.phone || '—'}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <Lock size={12} /> لا يمكن تعديله
            </div>
          </div>

          {/* Email */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            gap: 16
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(124,58,237,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Mail size={18} style={{ color: '#7c3aed' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>البريد الإلكتروني</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)', direction: 'ltr', textAlign: 'right' }}>
                {profile?.email || sessionUser?.email || '—'}
              </div>
            </div>
          </div>

          {/* Role */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '18px 24px',
            borderBottom: '1px solid var(--border)',
            gap: 16
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: roleInfo.bg,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
              fontSize: '1.1rem'
            }}>
              {roleInfo.icon}
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>نوع الحساب</div>
              <span style={{
                display: 'inline-flex', alignItems: 'center', gap: 5,
                background: roleInfo.bg, color: roleInfo.color,
                padding: '3px 10px', borderRadius: 14, fontSize: '0.85rem', fontWeight: 700
              }}>
                {roleInfo.label}
              </span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.75rem', color: 'var(--text-muted)', flexShrink: 0 }}>
              <Lock size={12} /> لا يمكن تعديله
            </div>
          </div>

          {/* Joined */}
          <div style={{
            display: 'flex', alignItems: 'center',
            padding: '18px 24px',
            gap: 16
          }}>
            <div style={{
              width: 38, height: 38, borderRadius: 10,
              background: 'rgba(100,116,139,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0
            }}>
              <Calendar size={18} style={{ color: '#64748b' }} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600, marginBottom: 4 }}>تاريخ الانضمام</div>
              <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--text-primary)' }}>
                {profile?.created_at
                  ? new Date(profile.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })
                  : '—'}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Links */}
      <div style={{
        marginTop: 24,
        display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12
      }}>
        <a
          href="/favorites"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            textDecoration: 'none', color: 'var(--text-primary)',
            transition: 'var(--transition)', fontWeight: 700
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = '#ef4444';
            e.currentTarget.style.background = 'rgba(239,68,68,0.04)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'var(--surface)';
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>❤️</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>مفضلتي</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>الشقق المحفوظة</div>
          </div>
        </a>
        <a
          href="/search"
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'var(--surface)', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-md)', padding: '16px 20px',
            textDecoration: 'none', color: 'var(--text-primary)',
            transition: 'var(--transition)', fontWeight: 700
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'var(--primary)';
            e.currentTarget.style.background = 'var(--primary-light)';
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = 'var(--border)';
            e.currentTarget.style.background = 'var(--surface)';
          }}
        >
          <span style={{ fontSize: '1.4rem' }}>🔍</span>
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.9rem' }}>البحث</div>
            <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>تصفح الشقق</div>
          </div>
        </a>
      </div>
    </div>
  );
}
