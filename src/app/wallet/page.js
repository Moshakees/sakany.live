'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Wallet, ArrowDownCircle, Clock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { getBrokerBalance, getBrokerWithdrawals, createWithdrawalRequest } from '@/utils/supabase';
import styles from './wallet.module.css';

export default function BrokerWalletPage() {
  const router = useRouter();
  const [user, setUser] = useState(null);
  const [balance, setBalance] = useState(0);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Form states
  const [amount, setAmount] = useState('');
  const [walletNumber, setWalletNumber] = useState('');
  const [walletType, setWalletType] = useState('vodafone_cash');
  const [submitting, setSubmitting] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  // 1. Auth & role check
  useEffect(() => {
    const session = localStorage.getItem('sakany_session');
    if (!session) {
      router.push('/auth');
      return;
    }
    const parsedUser = JSON.parse(session);
    if (parsedUser.role !== 'broker') {
      router.push('/'); // non-brokers are redirected
      return;
    }
    setUser(parsedUser);
  }, [router]);

  // 2. Fetch balance & withdrawals
  const loadData = async (userId) => {
    try {
      setLoading(true);
      const [balRes, withdrawalsRes] = await Promise.all([
        getBrokerBalance(userId),
        getBrokerWithdrawals(userId)
      ]);
      
      if (balRes.error) setErrorMsg('فشل جلب بيانات الرصيد.');
      else setBalance(balRes.data || 0);

      if (withdrawalsRes.error) setErrorMsg('فشل جلب عمليات السحب السابقة.');
      else setWithdrawals(withdrawalsRes.data || []);

    } catch (err) {
      setErrorMsg('حدث خطأ أثناء تحميل البيانات.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadData(user.id);
    }
  }, [user]);

  // 3. Handle submit withdrawal request
  const handleSubmitWithdrawal = async (e) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) {
      setErrorMsg('يرجى إدخال مبلغ صحيح للسحب.');
      return;
    }
    if (Number(amount) > balance) {
      setErrorMsg('رصيدك الحالي غير كافٍ لإتمام عملية السحب.');
      return;
    }
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (walletType !== 'instapay' && !phoneRegex.test(walletNumber)) {
      setErrorMsg('يرجى إدخال رقم هاتف محفظة كاش مصري صحيح (مثال: 01012345678).');
      return;
    }
    if (walletType === 'instapay' && !walletNumber.includes('@')) {
      setErrorMsg('يرجى إدخال عنوان إنستاباي صحيح (مثال: name@instapay).');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');
    setSuccessMsg('');

    try {
      const res = await createWithdrawalRequest({
        brokerId: user.id,
        amount: Number(amount),
        walletNumber,
        walletType
      });

      if (res.success) {
        setSuccessMsg(`✅ تم إرسال طلب السحب بقيمة ${amount} ج.م بنجاح! سيتم مراجعته وتحويله قريباً.`);
        setAmount('');
        setWalletNumber('');
        // Refresh balance and requests list
        await loadData(user.id);
      } else {
        setErrorMsg(res.error?.message || 'فشل تقديم طلب السحب.');
      }
    } catch (err) {
      setErrorMsg('حدث خطأ غير متوقع أثناء معالجة الطلب.');
    } finally {
      setSubmitting(false);
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'قيد الانتظار';
      case 'approved': return 'مقبول وبانتظار التحويل';
      case 'paid': return 'تم الدفع والتحويل ✅';
      case 'rejected': return 'مرفوض ❌';
      default: return status;
    }
  };

  const getWalletTypeLabel = (type) => {
    switch (type) {
      case 'vodafone_cash': return 'فودافون كاش';
      case 'etisalat_cash': return 'اتصالات كاش';
      case 'orange_cash': return 'أورنج كاش';
      case 'instapay': return 'إنستاباي';
      default: return type;
    }
  };

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' });

  if (!user || loading) {
    return (
      <div className={styles.loading}>
        <Loader2 className="animate-spin" size={32} style={{ color: 'var(--primary)', marginLeft: '10px' }} />
        <span>جاري تحميل المحفظة...</span>
      </div>
    );
  }

  return (
    <div className={styles.container}>
      <h1 className={styles.formTitle} style={{ fontSize: '1.7rem', marginBottom: 30 }}>
        <Wallet size={32} style={{ color: 'var(--primary)' }} />
        <span>محفظتي المالية</span>
      </h1>

      {successMsg && <div className={`${styles.alert} ${styles.alert_success}`}>{successMsg}</div>}
      {errorMsg && <div className={`${styles.alert} ${styles.alert_error}`}>{errorMsg}</div>}

      <div className={styles.grid}>
        {/* Right Section: Balance & Payout Form */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Balance card */}
          <div className={`${styles.card} ${styles.balanceCard}`}>
            <span className={styles.balanceLabel}>رصيدك الحالي المتاح للسحب</span>
            <div className={styles.balanceValue}>
              {balance.toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
              <span className={styles.balanceCurrency}>ج.م</span>
            </div>
            <div className={styles.brokerName}>السمسار: {user.name}</div>
          </div>

          {/* Withdrawal Form */}
          <div className={styles.card}>
            <h2 className={styles.formTitle}>
              <ArrowDownCircle size={20} style={{ color: 'var(--primary)' }} />
              <span>طلب سحب رصيد</span>
            </h2>
            <form onSubmit={handleSubmitWithdrawal}>
              <div className={styles.formGroup}>
                <label>مبلغ السحب (ج.م) *</label>
                <input
                  type="number"
                  placeholder="مثال: 500"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px' }}
                  min="1"
                  required
                />
              </div>

              <div className={styles.formGroup}>
                <label>طريقة تحويل الأموال *</label>
                <select
                  value={walletType}
                  onChange={e => {
                    setWalletType(e.target.value);
                    setWalletNumber('');
                    setErrorMsg('');
                  }}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="vodafone_cash">فودافون كاش (Vodafone Cash)</option>
                  <option value="etisalat_cash">اتصالات كاش (Etisalat Cash)</option>
                  <option value="orange_cash">أورنج كاش (Orange Cash)</option>
                  <option value="instapay">تطبيق إنستاباي (InstaPay)</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>
                  {walletType === 'instapay' 
                    ? 'عنوان إنستاباي (IPA) *' 
                    : 'رقم محفظة الكاش (المكون من 11 رقم) *'}
                </label>
                <input
                  type="text"
                  placeholder={walletType === 'instapay' ? 'name@instapay' : '01012345678'}
                  value={walletNumber}
                  onChange={e => setWalletNumber(e.target.value)}
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px', textAlign: 'left', direction: 'ltr' }}
                  required
                />
              </div>

              <button
                type="submit"
                className="btn btn-primary"
                style={{ width: '100%', padding: '12px', fontWeight: 800, marginTop: 10, cursor: 'pointer' }}
                disabled={submitting || balance <= 0}
              >
                {submitting ? 'جاري تقديم الطلب...' : 'تأكيد طلب السحب'}
              </button>
            </form>
          </div>
        </div>

        {/* Left Section: Past withdrawals history */}
        <div className={styles.card}>
          <h2 className={styles.historyTitle}>
            <Clock size={22} style={{ color: 'var(--text-secondary)' }} />
            <span>سجل عمليات السحب</span>
          </h2>

          {withdrawals.length === 0 ? (
            <div className={styles.empty}>
              <p>لم تقم بأي عمليات سحب رصيد حتى الآن.</p>
            </div>
          ) : (
            <div className={styles.historyList}>
              {withdrawals.map((item) => (
                <div key={item.id} className={styles.historyItem}>
                  <div className={styles.historyLeft}>
                    <div className={styles.historyAmount}>
                      {item.amount.toLocaleString('ar-EG')} ج.م
                    </div>
                    <div className={styles.historyDetails}>
                      بواسطة {getWalletTypeLabel(item.wallet_type)}: {item.wallet_number}
                    </div>
                  </div>
                  <div className={styles.historyRight}>
                    <span className={`${styles.status} ${styles['status_' + item.status]}`}>
                      {getStatusLabel(item.status)}
                    </span>
                    <span className={styles.historyDetails}>{formatDate(item.created_at)}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
