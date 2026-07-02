'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ShieldCheck, ShieldX, RefreshCw, LayoutDashboard, CheckCircle2, AlertCircle } from 'lucide-react';
import { approveProperty, rejectProperty, resetPropertyReview } from '@/utils/supabase';

export default function AdminBar({ propertyId, initialStatus, initialReason }) {
  const router = useRouter();
  const [isAdmin, setIsAdmin] = useState(false);
  const [status, setStatus] = useState(initialStatus || 'pending_review');
  const [reason, setReason] = useState(initialReason || '');
  const [isRejecting, setIsRejecting] = useState(false);
  const [rejectInput, setRejectInput] = useState('');
  const [msg, setMsg] = useState({ text: '', type: '' });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const session = localStorage.getItem('sakany_session');
    if (session) {
      try {
        const user = JSON.parse(session);
        if (user && user.role === 'admin') {
          setIsAdmin(true);
        }
      } catch (e) {
        console.error('Failed to parse session', e);
      }
    }
  }, []);

  if (!isAdmin) return null;

  const handleApprove = async () => {
    setLoading(true);
    setMsg({ text: '', type: '' });
    const { error } = await approveProperty(propertyId);
    setLoading(false);
    if (!error) {
      setStatus('approved');
      setReason('');
      setIsRejecting(false);
      setMsg({ text: '✅ تمت الموافقة على الشقة ونشرها بنجاح.', type: 'success' });
    } else {
      setMsg({ text: error.message || 'حدث خطأ أثناء الموافقة.', type: 'error' });
    }
  };

  const handleReject = async () => {
    if (isRejecting && !rejectInput.trim()) {
      setMsg({ text: 'يرجى كتابة سبب الرفض.', type: 'error' });
      return;
    }
    if (!isRejecting) {
      setIsRejecting(true);
      return;
    }
    setLoading(true);
    setMsg({ text: '', type: '' });
    const { error } = await rejectProperty(propertyId, rejectInput);
    setLoading(false);
    if (!error) {
      setStatus('rejected');
      setReason(rejectInput);
      setIsRejecting(false);
      setMsg({ text: '❌ تم رفض الشقة وإبلاغ المالك.', type: 'success' });
    } else {
      setMsg({ text: error.message || 'حدث خطأ أثناء الرفض.', type: 'error' });
    }
  };

  const handleReset = async () => {
    setLoading(true);
    setMsg({ text: '', type: '' });
    const { error } = await resetPropertyReview(propertyId);
    setLoading(false);
    if (!error) {
      setStatus('pending_review');
      setReason('');
      setIsRejecting(false);
      setMsg({ text: '🔄 تمت إعادة الشقة إلى قائمة الانتظار للمراجعة.', type: 'success' });
    } else {
      setMsg({ text: error.message || 'حدث خطأ أثناء إعادة المراجعة.', type: 'error' });
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'approved':
        return <span style={{ background: '#ecfdf5', color: '#059669', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>✅ مقبول ومنشور</span>;
      case 'rejected':
        return <span style={{ background: '#fee2e2', color: '#ef4444', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>❌ مرفوض</span>;
      default:
        return <span style={{ background: '#fef3c7', color: '#d97706', padding: '4px 12px', borderRadius: 20, fontSize: '0.85rem', fontWeight: 700 }}>⏳ قيد المراجعة</span>;
    }
  };

  return (
    <>
      {/* Top Banner indicating status */}
      <div style={{
        background: status === 'approved' ? 'rgba(5, 150, 105, 0.08)' : status === 'rejected' ? 'rgba(239, 68, 68, 0.08)' : 'rgba(217, 119, 6, 0.08)',
        borderRight: `5px solid ${status === 'approved' ? '#059669' : status === 'rejected' ? '#ef4444' : '#d97706'}`,
        padding: '16px 20px',
        borderRadius: 8,
        marginBottom: 24,
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        direction: 'rtl'
      }}>
        {status === 'approved' ? <CheckCircle2 style={{ color: '#059669' }} /> : <AlertCircle style={{ color: status === 'rejected' ? '#ef4444' : '#d97706' }} />}
        <div style={{ flex: 1 }}>
          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)' }}>
            {status === 'approved' && 'هذه الشقة مقبولة ومعروضة للطلاب حالياً'}
            {status === 'rejected' && 'هذه الشقة مرفوضة وغير معروضة للعامة'}
            {status === 'pending_review' && 'هذه الشقة تحت المراجعة (غير معروضة للعامة)'}
          </div>
          {status === 'rejected' && reason && (
            <div style={{ fontSize: '0.9rem', color: '#ef4444', marginTop: 6, fontWeight: 600 }}>
              سبب الرفض: {reason}
            </div>
          )}
        </div>
      </div>

      {/* Floating Action Bar at the bottom */}
      <div style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: 'rgba(15, 23, 42, 0.96)',
        backdropFilter: 'blur(10px)',
        borderTop: '1px solid rgba(255, 255, 255, 0.1)',
        padding: '16px 24px',
        zIndex: 9999,
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 16,
        color: '#fff',
        boxShadow: '0 -10px 25px -5px rgba(0, 0, 0, 0.3)',
        direction: 'rtl'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <ShieldCheck size={24} style={{ color: '#38bdf8' }} />
          <div>
            <div style={{ fontWeight: 800, fontSize: '0.95rem' }}>لوحة تحكم المسؤول (أدمن)</div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 4 }}>
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>حالة الشقة:</span>
              {getStatusBadge()}
            </div>
          </div>
        </div>

        {/* Action Message */}
        {msg.text && (
          <div style={{
            background: msg.type === 'success' ? 'rgba(5,150,105,0.2)' : 'rgba(239,68,68,0.2)',
            border: `1px solid ${msg.type === 'success' ? '#059669' : '#ef4444'}`,
            color: msg.type === 'success' ? '#34d399' : '#fca5a5',
            padding: '8px 16px',
            borderRadius: 6,
            fontSize: '0.85rem',
            fontWeight: 600
          }}>
            {msg.text}
          </div>
        )}

        <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
          {isRejecting && (
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <input
                type="text"
                value={rejectInput}
                onChange={e => setRejectInput(e.target.value)}
                placeholder="اكتب سبب الرفض هنا..."
                style={{
                  background: '#1e293b',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  color: '#fff',
                  padding: '8px 12px',
                  fontSize: '0.85rem',
                  width: 220,
                  outline: 'none',
                  fontFamily: 'inherit'
                }}
              />
              <button
                disabled={loading}
                onClick={handleReject}
                style={{
                  background: '#ef4444',
                  color: '#fff',
                  border: 'none',
                  borderRadius: 6,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 700,
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              >
                تأكيد
              </button>
              <button
                onClick={() => { setIsRejecting(false); setRejectInput(''); }}
                style={{
                  background: 'transparent',
                  color: '#94a3b8',
                  border: '1px solid #475569',
                  borderRadius: 6,
                  padding: '8px 14px',
                  cursor: 'pointer',
                  fontWeight: 600,
                  fontSize: '0.85rem',
                  fontFamily: 'inherit'
                }}
              >
                إلغاء
              </button>
            </div>
          )}

          {!isRejecting && (
            <>
              {status !== 'approved' && (
                <button
                  disabled={loading}
                  onClick={handleApprove}
                  style={{
                    background: '#059669',
                    color: '#fff',
                    border: 'none',
                    borderRadius: 6,
                    padding: '10px 18px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit'
                  }}
                >
                  <ShieldCheck size={16} />
                  قبول ونشر
                </button>
              )}

              {status !== 'rejected' && (
                <button
                  disabled={loading}
                  onClick={() => setIsRejecting(true)}
                  style={{
                    background: 'transparent',
                    color: '#ef4444',
                    border: '1px solid #ef4444',
                    borderRadius: 6,
                    padding: '10px 18px',
                    cursor: 'pointer',
                    fontWeight: 700,
                    fontSize: '0.9rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit'
                  }}
                >
                  <ShieldX size={16} />
                  رفض الإعلان
                </button>
              )}

              {status !== 'pending_review' && (
                <button
                  disabled={loading}
                  onClick={handleReset}
                  style={{
                    background: 'transparent',
                    color: '#94a3b8',
                    border: '1px solid #475569',
                    borderRadius: 6,
                    padding: '9px 16px',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                    fontFamily: 'inherit'
                  }}
                >
                  <RefreshCw size={14} />
                  إعادة للمراجعة
                </button>
              )}
            </>
          )}

          <button
            onClick={() => router.push('/dashboard')}
            style={{
              background: 'transparent',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: 6,
              padding: '10px 16px',
              cursor: 'pointer',
              fontWeight: 700,
              fontSize: '0.9rem',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: 'inherit'
            }}
          >
            <LayoutDashboard size={16} />
            لوحة التحكم
          </button>
        </div>
      </div>
      {/* Spacer to prevent content overlap at the bottom */}
      <div style={{ height: 90 }} />
    </>
  );
}
