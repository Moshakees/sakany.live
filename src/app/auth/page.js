'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Lock, 
  Mail, 
  Phone, 
  GraduationCap, 
  Home, 
  Key, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles,
  ArrowRight
} from 'lucide-react';
import styles from './auth.module.css';
import { isDemoMode, supabase, createPasswordResetRequest } from '@/utils/supabase';
import SakanyLogo from '@/components/SakanyLogo';

export default function AuthPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState('login'); // 'login' or 'register'
  const [formData, setFormData] = useState({
    identifier: '', // email or phone for login
    firstName: '',
    lastName: '',
    phone: '',
    email: '',
    password: '',
    confirmPassword: '',
    role: 'student' // 'student', 'landlord', 'broker'
  });

  const [resetPhone, setResetPhone] = useState('');

  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  // Auto-fill mock credentials to make testing extremely easy in Demo Mode
  useEffect(() => {
    if (isDemoMode) {
      if (activeTab === 'login') {
        setFormData(prev => ({
          ...prev,
          identifier: 'student@sakany.com',
          password: 'password123'
        }));
      } else {
        setFormData(prev => ({
          ...prev,
          firstName: 'أحمد',
          lastName: 'علي',
          phone: '01012345678',
          email: 'ahmed.student@example.com',
          password: 'password123',
          confirmPassword: 'password123',
          role: 'student'
        }));
      }
    }
  }, [activeTab]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear alerts on input change
    setError('');
    setSuccess('');
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({
      ...prev,
      role
    }));
    setError('');
  };

  const validateForm = () => {
    if (activeTab === 'login') {
      if (!formData.identifier || !formData.password) {
        setError('يرجى ملء جميع الحقول المطلوبة.');
        return false;
      }
    } else {
      if (!formData.firstName || !formData.lastName || !formData.phone || !formData.password || !formData.confirmPassword) {
        setError('يرجى ملء جميع الحقول الإلزامية المميزة بنجمة (*).');
        return false;
      }
      if (formData.password !== formData.confirmPassword) {
        setError('كلمات السر غير متطابقة.');
        return false;
      }
      if (formData.password.length < 6) {
        setError('يجب أن تتكون كلمة السر من 6 أحرف على الأقل.');
        return false;
      }
      // Phone check (Egyptian number format)
      const phoneRegex = /^01[0125][0-9]{8}$/;
      if (!phoneRegex.test(formData.phone)) {
        setError('يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678).');
        return false;
      }
    }
    return true;
  };

  const handleResetRequest = async (e) => {
    e.preventDefault();
    const phoneRegex = /^01[0125][0-9]{8}$/;
    if (!resetPhone || !phoneRegex.test(resetPhone)) {
      setError('يرجى إدخال رقم هاتف مصري صحيح (مثال: 01012345678).');
      return;
    }
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const { success, error: resetErr } = await createPasswordResetRequest(resetPhone);
      if (success) {
        setSuccess('✅ تم إرسال طلب استعادة كلمة السر بنجاح. يرجى التواصل مع الإدارة يدوياً لتأكيد هويتك وتحديث كلمة السر.');
        setResetPhone('');
      } else {
        setError(resetErr?.message || 'فشل في إرسال طلب الاستعادة.');
      }
    } catch (err) {
      setError('حدث خطأ أثناء إرسال طلب الاستعادة.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');
    setSuccess('');

    // --- DEMO MODE HANDLER ---
    if (isDemoMode) {
      setTimeout(() => {
        setLoading(false);
        if (activeTab === 'login') {
          // Mock successful login
          setSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...');
          let role = 'landlord';
          let name = 'مالك تجريبي';
          if (formData.identifier.includes('student')) {
            role = 'student';
            name = 'طالب تجريبي';
          } else if (formData.identifier.includes('admin')) {
            role = 'admin';
            name = 'أدمن تجريبي';
          } else if (formData.identifier.includes('broker')) {
            role = 'broker';
            name = 'سمسار تجريبي';
          }

          const mockUser = {
            id: 'mock-user-123',
            name: name,
            phone: '01012345678',
            role: role,
            email: formData.identifier
          };
          localStorage.setItem('sakany_session', JSON.stringify(mockUser));
          
          // Redirect based on role
          setTimeout(() => {
            if (mockUser.role === 'student') {
              router.push('/');
            } else {
              router.push('/dashboard');
            }
          }, 1500);
        } else {
          // Mock successful registration
          setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول.');
          setTimeout(() => {
            setActiveTab('login');
          }, 1800);
        }
      }, 1200);
      return;
    }

    // --- REAL SUPABASE AUTH HANDLER ---
    try {
      if (activeTab === 'login') {
        const isEmail = formData.identifier.includes('@');
        
        let loginResult;
        if (isEmail) {
          loginResult = await supabase.auth.signInWithPassword({
            email: formData.identifier,
            password: formData.password
          });
        } else {
          // Search for the profile by phone to get their email (or use synthetic email fallback)
          const { data: profile, error: profileErr } = await supabase
            .from('profiles')
            .select('*')
            .eq('phone', formData.identifier)
            .single();

          if (profileErr || !profile) {
            throw new Error('رقم الهاتف هذا غير مسجل لدينا.');
          }

          // Use the stored email if available, otherwise fallback to synthetic phone email
          const loginEmail = profile.email || `${formData.identifier}@sakany.com`;

          loginResult = await supabase.auth.signInWithPassword({
            email: loginEmail,
            password: formData.password
          });
        }

        if (loginResult.error) throw loginResult.error;

        setSuccess('تم تسجيل الدخول بنجاح! جاري تحويلك...');
        
        // Fetch user profile to know role
        const { data: profile } = await supabase
          .from('profiles')
          .select('role, full_name')
          .eq('id', loginResult.data.user.id)
          .single();

        const sessionUser = {
          id: loginResult.data.user.id,
          name: profile?.full_name || 'مستخدم',
          role: profile?.role || 'student',
          email: loginResult.data.user.email
        };
        localStorage.setItem('sakany_session', JSON.stringify(sessionUser));

        setTimeout(() => {
          if (sessionUser.role === 'student') {
            router.push('/');
          } else {
            router.push('/dashboard');
          }
        }, 1500);

      } else {
        // Sign Up Flow
        // If email is not entered, we generate a mock email based on phone for Supabase Auth requirements
        const signupEmail = formData.email || `${formData.phone}@sakany.com`;
        
        try {
          // Attempt server-side signup first to bypass email rate limits and auto-confirm user
          const response = await fetch('/api/auth/signup', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              email: signupEmail,
              password: formData.password,
              firstName: formData.firstName,
              lastName: formData.lastName,
              phone: formData.phone,
              role: formData.role
            })
          });

          const result = await response.json();

          if (response.ok && result.success) {
            setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول مباشرة.');
            setTimeout(() => {
              setActiveTab('login');
            }, 2500);
            return;
          }

          // If service key is missing on the server, fallback to standard client-side signup
          if (result.error === 'REQUIRED_SERVICE_KEY_MISSING') {
            console.log('Service role key missing on server. Falling back to client-side signup.');
            const { data: authData, error: authError } = await supabase.auth.signUp({
              email: signupEmail,
              password: formData.password,
              options: {
                data: {
                  full_name: `${formData.firstName} ${formData.lastName}`,
                  phone: formData.phone,
                  role: formData.role
                }
              }
            });

            if (authError) throw authError;

            setSuccess('تم إنشاء الحساب بنجاح! يمكنك الآن تسجيل الدخول مباشرة.');
            setTimeout(() => {
              setActiveTab('login');
            }, 2500);
          } else {
            throw new Error(result.error || 'حدث خطأ أثناء إنشاء الحساب.');
          }
        } catch (signupErr) {
          throw signupErr;
        }
      }
    } catch (err) {
      // Translate common Supabase error messages to Arabic
      const errorMap = {
        'Invalid login credentials': 'بيانات تسجيل الدخول غير صحيحة. تأكد من رقم الهاتف/البريد الإلكتروني وكلمة السر.',
        'Email not confirmed': 'البريد الإلكتروني غير مؤكد. يرجى تأكيد بريدك الإلكتروني أولاً.',
        'User already registered': 'هذا الحساب مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.',
        'Email rate limit exceeded': 'تم تجاوز الحد المسموح. يرجى المحاولة لاحقاً.',
        'User not found': 'لم يتم العثور على حساب بهذه البيانات.',
        'Signup requires a valid password': 'يرجى إدخال كلمة سر صحيحة (6 أحرف على الأقل).',
        'Password should be at least 6 characters': 'كلمة السر يجب أن تكون 6 أحرف على الأقل.',
      };

      const msg = err.message || '';
      const arabicMsg = Object.entries(errorMap).find(([key]) => msg.includes(key))?.[1]
        || msg
        || 'حدث خطأ غير متوقع، يرجى المحاولة لاحقاً.';
      setError(arabicMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer} dir="rtl">
      <div className={styles.authCard}>
        
        {/* Header */}
        <div className={styles.header}>
          <div className={styles.logo}>
            <SakanyLogo size={38} />
            <span>سَكني</span>
          </div>
          <p className={styles.subtitle}>الوسيط الآمن لسكن الطلاب بالمنصورة</p>
        </div>

        {/* Demo Mode Notification */}
        {isDemoMode && (
          <div className={`${styles.alert} ${styles.demoAlert}`}>
            <AlertCircle size={20} />
            <div>
              <strong>وضع العرض التجريبي نشط:</strong> تم ملء الحقول تلقائياً لتسهيل التجربة السريعة.
            </div>
          </div>
        )}

        {/* Success/Error Alerts */}
        {error && (
          <div className={`${styles.alert} ${styles.alertError}`}>
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}
        {success && (
          <div className={`${styles.alert} ${styles.alertSuccess}`}>
            <CheckCircle2 size={20} />
            <span>{success}</span>
          </div>
        )}

        {/* Toggle Tabs */}
        {activeTab !== 'forgot' && (
          <div className={styles.tabs}>
            <button 
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'login' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('login')}
            >
              تسجيل الدخول
            </button>
            <button 
              type="button"
              className={`${styles.tabBtn} ${activeTab === 'register' ? styles.activeTab : ''}`}
              onClick={() => setActiveTab('register')}
            >
              إنشاء حساب جديد
            </button>
          </div>
        )}

        {activeTab === 'forgot' && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
            <button 
              onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }} 
              style={{ display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', color: 'var(--primary)', fontWeight: 'bold', cursor: 'pointer', fontFamily: 'inherit' }}
            >
              <ArrowRight size={16} /> العودة لتسجيل الدخول
            </button>
          </div>
        )}

        {/* Auth Forms */}
        <form onSubmit={activeTab === 'forgot' ? handleResetRequest : handleSubmit} className={styles.form}>
          {activeTab === 'login' ? (
            /* LOGIN FORM */
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>البريد الإلكتروني أو رقم الهاتف</label>
                <div className={styles.inputWrapper}>
                  <User className={styles.inputIcon} size={20} />
                  <input
                    type="text"
                    name="identifier"
                    value={formData.identifier}
                    onChange={handleInputChange}
                    className={`${styles.inputField} ${styles.inputFieldLtr}`}
                    placeholder="student@sakany.com أو 010xxxxxxxx"
                    required
                  />
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className={styles.label}>كلمة السر</label>
                <div className={styles.inputWrapper}>
                  <Lock className={styles.inputIcon} size={20} />
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={`${styles.inputField} ${styles.inputFieldLtr}`}
                    placeholder="••••••••"
                    required
                  />
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '-8px', marginBottom: '16px' }}>
                <span 
                  className={styles.footerLink} 
                  onClick={() => {
                    setActiveTab('forgot');
                    setError('');
                    setSuccess('');
                  }}
                  style={{ fontSize: '0.85rem' }}
                >
                  هل نسيت كلمة السر؟
                </span>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary styles.submitBtn"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'جاري التحقق...' : 'تسجيل الدخول'}
              </button>
            </>
          ) : activeTab === 'forgot' ? (
            /* FORGOT PASSWORD FORM */
            <>
              <div className={styles.formGroup}>
                <label className={styles.label}>رقم الهاتف المسجل في حسابك *</label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.inputIcon} size={20} />
                  <input
                    type="tel"
                    value={resetPhone}
                    onChange={e => {
                      setResetPhone(e.target.value);
                      setError('');
                      setSuccess('');
                    }}
                    className={`${styles.inputField} ${styles.inputFieldLtr}`}
                    placeholder="مثال: 01012345678"
                    required
                  />
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary styles.submitBtn"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'جاري إرسال الطلب...' : 'إرسال طلب الاستعادة'}
              </button>
            </>
          ) : (
            /* REGISTER FORM */
            <>
              {/* First & Last Name */}
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>الاسم الأول *</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={20} />
                    <input
                      type="text"
                      name="firstName"
                      value={formData.firstName}
                      onChange={handleInputChange}
                      className={styles.inputField}
                      placeholder="أحمد"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>الاسم الثاني *</label>
                  <div className={styles.inputWrapper}>
                    <User className={styles.inputIcon} size={20} />
                    <input
                      type="text"
                      name="lastName"
                      value={formData.lastName}
                      onChange={handleInputChange}
                      className={styles.inputField}
                      placeholder="علي"
                      required
                    />
                  </div>
                </div>
              </div>

              {/* Phone */}
              <div className={styles.formGroup}>
                <label className={styles.label}>رقم الهاتف * (للتواصل عبر الواتساب)</label>
                <div className={styles.inputWrapper}>
                  <Phone className={styles.inputIcon} size={20} />
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className={`${styles.inputField} ${styles.inputFieldLtr}`}
                    placeholder="01012345678"
                    required
                  />
                </div>
              </div>

              {/* Email (Optional) */}
              <div className={styles.formGroup}>
                <label className={styles.label}>البريد الإلكتروني (اختياري)</label>
                <div className={styles.inputWrapper}>
                  <Mail className={styles.inputIcon} size={20} />
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className={`${styles.inputField} ${styles.inputFieldLtr}`}
                    placeholder="name@example.com"
                  />
                </div>
              </div>

              {/* Custom Role Selector Cards */}
              <div className={styles.formGroup}>
                <span className={styles.roleLabel}>نوع الحساب (حالة الحساب) *</span>
                <div className={styles.roleGrid}>
                  <button
                    type="button"
                    className={`${styles.roleCard} ${formData.role === 'student' ? styles.roleCardActive : ''}`}
                    onClick={() => handleRoleSelect('student')}
                  >
                    <GraduationCap className={styles.roleIcon} />
                    <span className={styles.roleName}>طالب</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.roleCard} ${formData.role === 'landlord' ? styles.roleCardActive : ''}`}
                    onClick={() => handleRoleSelect('landlord')}
                  >
                    <Home className={styles.roleIcon} />
                    <span className={styles.roleName}>مالك</span>
                  </button>

                  <button
                    type="button"
                    className={`${styles.roleCard} ${formData.role === 'broker' ? styles.roleCardActive : ''}`}
                    onClick={() => handleRoleSelect('broker')}
                  >
                    <Key className={styles.roleIcon} />
                    <span className={styles.roleName}>سمسار</span>
                  </button>
                </div>
              </div>

              {/* Passwords */}
              <div className={styles.row}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>كلمة السر *</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={20} />
                    <input
                      type="password"
                      name="password"
                      value={formData.password}
                      onChange={handleInputChange}
                      className={`${styles.inputField} ${styles.inputFieldLtr}`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>

                <div className={styles.formGroup}>
                  <label className={styles.label}>تأكيد كلمة السر *</label>
                  <div className={styles.inputWrapper}>
                    <Lock className={styles.inputIcon} size={20} />
                    <input
                      type="password"
                      name="confirmPassword"
                      value={formData.confirmPassword}
                      onChange={handleInputChange}
                      className={`${styles.inputField} ${styles.inputFieldLtr}`}
                      placeholder="••••••••"
                      required
                    />
                  </div>
                </div>
              </div>

              <button 
                type="submit" 
                className="btn btn-primary styles.submitBtn"
                style={{ width: '100%', padding: '14px', marginTop: '10px' }}
                disabled={loading}
              >
                {loading ? 'جاري إنشاء الحساب...' : 'إنشاء الحساب'}
              </button>
            </>
          )}
        </form>

        {/* Form Footer */}
        <div className={styles.footerText}>
          {activeTab === 'forgot' ? (
            <>
              تذكرت كلمة السر؟{' '}
              <span className={styles.footerLink} onClick={() => { setActiveTab('login'); setError(''); setSuccess(''); }}>
                قم بتسجيل الدخول
              </span>
            </>
          ) : activeTab === 'login' ? (
            <>
              ليس لديك حساب؟{' '}
              <span className={styles.footerLink} onClick={() => setActiveTab('register')}>
                أنشئ حساباً جديداً الآن
              </span>
            </>
          ) : (
            <>
              لديك حساب بالفعل؟{' '}
              <span className={styles.footerLink} onClick={() => setActiveTab('login')}>
                قم بتسجيل الدخول
              </span>
            </>
          )}
        </div>

      </div>
    </div>
  );
}
