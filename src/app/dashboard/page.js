'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  PlusCircle, Trash2, Home, MapPin, Eye, LogOut, Lock,
  AlertCircle, CheckCircle2, Clock, Sparkles, Check, Phone,
  User, ChevronDown, Inbox, ClipboardList, ShieldCheck, ShieldX,
  HourglassIcon, XCircle, RefreshCw, Users, GraduationCap, Building2, Bell, Wallet, ArrowDownCircle,
  Search, Rocket, Star
} from 'lucide-react';
import styles from './dashboard.module.css';
import {
  isDemoMode, addProperty, getProperties,
  getAllBookingRequests, updateBookingStatus,
  togglePropertyFeatured, deleteProperty, updatePropertyStatus,
  approveProperty, rejectProperty, resetPropertyReview,
  getAllUsers, deleteUser, getPasswordResetRequests,
  updatePasswordResetRequestStatus, updateUserPassword,
  addBrokerBalanceByPhone, deductBrokerBalanceByPhone, getAllWithdrawalRequests, updateWithdrawalRequestStatus, getWalletTransactions,
  getUserProfile, getAllBrokerVerificationRequests, approveBrokerVerification,
  rejectBrokerVerification, getBrokerVerificationStatus, submitBrokerVerification,
  getLandlordBookingRequests,
  submitFeaturedRequest, getFeaturedRequests, approveFeaturedRequest, rejectFeaturedRequest
} from '@/utils/supabase';

const STATUS_CONFIG = {
  pending:   { label: 'جديد — بانتظار التواصل', color: '#d97706', bg: '#fef3c7' },
  contacted: { label: 'تم التواصل مع الطرفين',  color: '#2563eb', bg: '#eff6ff' },
  completed: { label: 'مكتمل — تم التعاقد',      color: '#059669', bg: '#ecfdf5' },
  canceled:  { label: 'ملغي',                     color: '#ef4444', bg: '#fee2e2' }
};

const REVIEW_CONFIG = {
  pending_review: { label: 'قيد المراجعة', color: '#d97706', bg: '#fef3c7', icon: '⏳' },
  approved:       { label: 'مقبول ومعروض', color: '#059669', bg: '#ecfdf5', icon: '✅' },
  rejected:       { label: 'مرفوض',        color: '#ef4444', bg: '#fee2e2', icon: '❌' }
};

const compressImage = (file) => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = (event) => {
      const img = new Image();
      img.src = event.target.result;
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const MAX_WIDTH = 1000;
        const MAX_HEIGHT = 1000;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; }
        } else {
          if (height > MAX_HEIGHT) { width *= MAX_HEIGHT / height; height = MAX_HEIGHT; }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', 0.6));
      };
      img.onerror = (err) => reject(err);
    };
    reader.onerror = (err) => reject(err);
  });
};

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
  'المنصورة الجديدة', 'سراي', 'ميت الخولي', 'طلخا',
];

export default function DashboardPage() {
  const router = useRouter();
  const [user, setUser]                     = useState(null);
  // Tabs:
  //  Admin:   'review' | 'bookings' | 'properties'
  //  Landlord/Broker: 'pending_properties' | 'approved_properties' | 'add'
  const [activeTab, setActiveTab]           = useState('');
  const [bookings, setBookings]             = useState([]);
  const [userProperties, setUserProperties] = useState([]);  // all own props (landlord/broker)
  const [allProperties, setAllProperties]   = useState([]);  // ALL props (admin)
  const [allUsers, setAllUsers]             = useState([]);   // ALL users (admin)
  const [usersSubTab, setUsersSubTab]       = useState('students');
  const [resetRequests, setResetRequests]   = useState([]);  // password reset requests
  const [newPasswordsMap, setNewPasswordsMap] = useState({}); // inline password changes map
  const [withdrawRequests, setWithdrawRequests] = useState([]); // broker withdrawals
  const [depositForm, setDepositForm] = useState({ phone: '', amount: '' });
  const [depositLoading, setDepositLoading] = useState(false);
  const [depositSuccess, setDepositSuccess] = useState('');
  const [depositError, setDepositError] = useState('');

  const [deductForm, setDeductForm] = useState({ phone: '', amount: '', reason: '' });
  const [deductLoading, setDeductLoading] = useState(false);
  const [deductSuccess, setDeductSuccess] = useState('');
  const [deductError, setDeductError] = useState('');
  const [loading, setLoading]               = useState(true);
  const [submitLoading, setSubmitLoading]   = useState(false);
  const [successMsg, setSuccessMsg]         = useState('');
  const [errorMsg, setErrorMsg]             = useState('');
  
  const [notifForm, setNotifForm] = useState({
    target: 'all', // 'all' | 'student' | 'landlord' | 'broker' | 'single'
    phone: '',
    title: '',
    message: ''
  });
  const [notifLoading, setNotifLoading] = useState(false);
  const [notifSuccess, setNotifSuccess] = useState('');
  const [notifError, setNotifError] = useState('');

  const [rejectReason, setRejectReason]     = useState('');
  const [rejectingId, setRejectingId]       = useState(null);

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    location: 'حي الجامعة',
    address: '',
    rooms: '3',
    bathrooms: '2',
    beds: '2',
    gender_type: 'any',
    floor: '0',
    has_ac: false,
    has_internet: false,
    has_elevator: false,
    is_featured: false,
    rent_type: 'apartment',
    available_beds: '1'
  });
  const [images, setImages] = useState([]);
  const [compressing, setCompressing] = useState(false);

  // States for broker verification
  const [verificationRequests, setVerificationRequests] = useState([]);
  const [brokerVerificationStatus, setBrokerVerificationStatus] = useState(null);
  const [verificationForm, setVerificationForm] = useState({ notes: '', documentImage: null });
  const [verifSubmitLoading, setVerifSubmitLoading] = useState(false);
  const [verifFormError, setVerifFormError] = useState('');
  const [verifFormSuccess, setVerifFormSuccess] = useState('');
  const [verifRejectReason, setVerifRejectReason] = useState('');
  const [verifRejectingId, setVerifRejectingId] = useState(null);

  // States for featured requests
  const [featuredRequests, setFeaturedRequests] = useState([]);
  const [showPromotionModal, setShowPromotionModal] = useState(false);
  const [selectedPropertyForPromo, setSelectedPropertyForPromo] = useState(null);
  const [promoPaymentMethod, setPromoPaymentMethod] = useState('contact'); // 'contact' | 'wallet'
  const [promoConsent, setPromoConsent] = useState(false);
  const [promoSubmitLoading, setPromoSubmitLoading] = useState(false);
  const [promoSuccess, setPromoSuccess] = useState('');
  const [promoError, setPromoError] = useState('');

  // States for admin search & feature
  const [adminFeaturedSearchQuery, setAdminFeaturedSearchQuery] = useState('');
  const [adminFeaturedPropertiesResults, setAdminFeaturedPropertiesResults] = useState([]);
  const [adminSearchLoading, setAdminSearchLoading] = useState(false);

  // States for financial transactions ledger
  const [walletTransactions, setWalletTransactions] = useState([]);

  /* ── Auth check ── */
  useEffect(() => {
    const session = localStorage.getItem('sakany_session');
    if (!session) { router.push('/auth'); return; }
    const parsedUser = JSON.parse(session);
    setUser(parsedUser);

    if (parsedUser.role === 'student') { setLoading(false); return; }

    const load = async () => {
      const isAdmin  = parsedUser.role === 'admin';
      const isBroker = parsedUser.role === 'broker';

      // Load latest user profile details
      const profileRes = await getUserProfile(parsedUser.id);
      let currentUserObj = parsedUser;
      if (profileRes.data) {
        currentUserObj = profileRes.data;
        setUser(currentUserObj);
        localStorage.setItem('sakany_session', JSON.stringify(currentUserObj));
      }

      if (isAdmin) {
        // Admin sees ALL properties in all review states, plus all booking requests, users, resets, withdrawals, verifications, featured requests, and transactions log
        const [allPropsRes, bookRes, usersRes, resetsRes, withdrawRes, verifRes, promoRes, txRes] = await Promise.all([
          getProperties({ isAdmin: true, allStatuses: true }),
          getAllBookingRequests(),
          getAllUsers(),
          getPasswordResetRequests(),
          getAllWithdrawalRequests(),
          getAllBrokerVerificationRequests(),
          getFeaturedRequests(),
          getWalletTransactions()
        ]);
        if (allPropsRes.data) setAllProperties(allPropsRes.data);
        if (bookRes.data)    setBookings(bookRes.data);
        if (usersRes.data)  setAllUsers(usersRes.data);
        if (resetsRes.data)  setResetRequests(resetsRes.data);
        if (withdrawRes.data) setWithdrawRequests(withdrawRes.data);
        if (verifRes.data)   setVerificationRequests(verifRes.data);
        if (promoRes.data)   setFeaturedRequests(promoRes.data);
        if (txRes.data)      setWalletTransactions(txRes.data);
        setActiveTab('review');
      } else if (isBroker) {
        // Broker sees own properties, bookings, verification status, featured requests, and own transaction history
        const [propsRes, bookRes, verifStatusRes, promoRes, txRes] = await Promise.all([
          getProperties({ landlord_id: currentUserObj.id, allStatuses: true }),
          getLandlordBookingRequests(currentUserObj.id),
          getBrokerVerificationStatus(currentUserObj.id),
          getFeaturedRequests(currentUserObj.id),
          getWalletTransactions(currentUserObj.id)
        ]);
        if (propsRes.data) setUserProperties(propsRes.data);
        if (bookRes.data)  setBookings(bookRes.data);
        if (verifStatusRes.data) setBrokerVerificationStatus(verifStatusRes.data);
        if (promoRes.data)   setFeaturedRequests(promoRes.data);
        if (txRes.data)      setWalletTransactions(txRes.data);
        setActiveTab('pending_properties');
      } else {
        // Landlord sees own properties, own bookings, featured requests
        const [propsRes, bookRes, promoRes] = await Promise.all([
          getProperties({ landlord_id: currentUserObj.id, allStatuses: true }),
          getLandlordBookingRequests(currentUserObj.id),
          getFeaturedRequests(currentUserObj.id)
        ]);
        if (propsRes.data) setUserProperties(propsRes.data);
        if (bookRes.data)  setBookings(bookRes.data);
        if (promoRes.data)   setFeaturedRequests(promoRes.data);
        setActiveTab('pending_properties');
      }
      setLoading(false);
    };
    load();
  }, []); // eslint-disable-line

  // Auto-refresh properties when dashboard window/tab gets focus
  useEffect(() => {
    const handleFocus = () => {
      const session = localStorage.getItem('sakany_session');
      if (!session) return;
      try {
        const parsedUser = JSON.parse(session);
        const load = async () => {
          const isAdmin  = parsedUser.role === 'admin';
          const isBroker = parsedUser.role === 'broker';

          // Load latest user profile details
          const profileRes = await getUserProfile(parsedUser.id);
          let currentUserObj = parsedUser;
          if (profileRes.data) {
            currentUserObj = profileRes.data;
            setUser(currentUserObj);
            localStorage.setItem('sakany_session', JSON.stringify(currentUserObj));
          }

          if (isAdmin) {
            const [allPropsRes, bookRes, usersRes, resetsRes, withdrawRes, verifRes, promoRes, txRes] = await Promise.all([
              getProperties({ isAdmin: true, allStatuses: true }),
              getAllBookingRequests(),
              getAllUsers(),
              getPasswordResetRequests(),
              getAllWithdrawalRequests(),
              getAllBrokerVerificationRequests(),
              getFeaturedRequests(),
              getWalletTransactions()
            ]);
            if (allPropsRes.data) setAllProperties(allPropsRes.data);
            if (bookRes.data)    setBookings(bookRes.data);
            if (usersRes.data)  setAllUsers(usersRes.data);
            if (resetsRes.data)  setResetRequests(resetsRes.data);
            if (withdrawRes.data) setWithdrawRequests(withdrawRes.data);
            if (verifRes.data)   setVerificationRequests(verifRes.data);
            if (promoRes.data)   setFeaturedRequests(promoRes.data);
            if (txRes.data)      setWalletTransactions(txRes.data);
          } else if (isBroker) {
            const [propsRes, bookRes, verifStatusRes, promoRes, txRes] = await Promise.all([
              getProperties({ landlord_id: currentUserObj.id, allStatuses: true }),
              getLandlordBookingRequests(currentUserObj.id),
              getBrokerVerificationStatus(currentUserObj.id),
              getFeaturedRequests(currentUserObj.id),
              getWalletTransactions(currentUserObj.id)
            ]);
            if (propsRes.data) setUserProperties(propsRes.data);
            if (bookRes.data)  setBookings(bookRes.data);
            if (verifStatusRes.data) setBrokerVerificationStatus(verifStatusRes.data);
            if (promoRes.data)   setFeaturedRequests(promoRes.data);
            if (txRes.data)      setWalletTransactions(txRes.data);
          } else {
            const [propsRes, bookRes, promoRes] = await Promise.all([
              getProperties({ landlord_id: currentUserObj.id, allStatuses: true }),
              getLandlordBookingRequests(currentUserObj.id),
              getFeaturedRequests(currentUserObj.id)
            ]);
            if (propsRes.data) setUserProperties(propsRes.data);
            if (bookRes.data)  setBookings(bookRes.data);
            if (promoRes.data)   setFeaturedRequests(promoRes.data);
          }
        };
        load();
      } catch (e) {
        console.error('Focus reload failed', e);
      }
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, []);

  /* ── Helpers ── */
  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setErrorMsg(''); setSuccessMsg('');
  };

  const handleLogout = () => {
    localStorage.removeItem('sakany_session');
    window.dispatchEvent(new Event('sakany_auth_change'));
    router.push('/');
  };

  const validateForm = () => {
    if (!formData.title || !formData.description || !formData.price || !formData.address) {
      setErrorMsg('يرجى ملء جميع الحقول المطلوبة.'); return false;
    }
    if (Number(formData.price) <= 0) {
      setErrorMsg('يرجى إدخال سعر إيجار صحيح.'); return false;
    }
    return true;
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (files.length === 0) return;
    setCompressing(true); setErrorMsg(''); setSuccessMsg('');
    try {
      const compressedList = [];
      for (const file of files) {
        compressedList.push(await compressImage(file));
      }
      setImages(prev => [...prev, ...compressedList].slice(0, 8));
    } catch {
      setErrorMsg('حدث خطأ أثناء معالجة وضغط الصور.');
    } finally {
      setCompressing(false);
    }
  };

  const removeImage = (index) => setImages(prev => prev.filter((_, idx) => idx !== index));

  const handleAddListing = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    setSubmitLoading(true);

    const defaultImgs = [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
    ];

    const payload = {
      title: formData.title,
      description: formData.description,
      price: Number(formData.price),
      location: formData.location,
      address: formData.address,
      rooms: formData.rent_type === 'bed' ? 1 : Number(formData.rooms),
      bathrooms: formData.rent_type === 'bed' ? 1 : Number(formData.bathrooms),
      beds: Number(formData.beds),
      gender_type: formData.gender_type,
      floor: Number(formData.floor),
      has_ac: formData.has_ac,
      has_internet: formData.has_internet,
      has_elevator: formData.has_elevator,
      images: images.length > 0 ? images : [defaultImgs[Math.floor(Math.random() * defaultImgs.length)]],
      landlord_id: user.id,
      status: 'available',
      is_featured: false,
      rent_type: formData.rent_type || 'apartment',
      available_beds: formData.rent_type === 'bed' ? Number(formData.available_beds) : Number(formData.beds)
    };

    const { data, error } = await addProperty(payload);
    setSubmitLoading(false);

    if (error) {
      setErrorMsg(error.message || 'حدث خطأ أثناء إضافة الشقة.');
    } else {
      setSuccessMsg('تم إرسال الشقة للمراجعة! ستظهر في المنصة بعد موافقة الإدارة.');
      setFormData({
        title: '', description: '', price: '', location: 'حي الجامعة',
        address: '', rooms: '3', bathrooms: '2', beds: '2', gender_type: 'any',
        floor: '0', has_ac: false, has_internet: false, has_elevator: false, is_featured: false,
        rent_type: 'apartment', available_beds: '1'
      });
      setImages([]);
      // Add to local user properties list with pending_review status
      if (data) setUserProperties(prev => [data, ...prev]);
      // Auto-switch to show pending tab after adding
      setTimeout(() => setActiveTab('pending_properties'), 1500);
    }
  };

  const handleStatusChange = async (bookingId, newStatus) => {
    const { error } = await updateBookingStatus(bookingId, newStatus);
    if (!error) setBookings(prev => prev.map(b => b.id === bookingId ? { ...b, status: newStatus } : b));
  };

  const handleToggleFeatured = async (propertyId, newFeaturedState) => {
    const { error } = await togglePropertyFeatured(propertyId, newFeaturedState);
    if (!error) {
      setAllProperties(prev => prev.map(p => p.id === propertyId ? { ...p, is_featured: newFeaturedState } : p));
      setUserProperties(prev => prev.map(p => p.id === propertyId ? { ...p, is_featured: newFeaturedState } : p));
      setAdminFeaturedPropertiesResults(prev => prev.map(p => p.id === propertyId ? { ...p, is_featured: newFeaturedState } : p));
    }
  };

  const handleTogglePropertyStatus = async (id, currentStatus) => {
    const newStatus = currentStatus === 'available' ? 'rented' : 'available';
    const { error } = await updatePropertyStatus(id, newStatus);
    if (!error) {
      setUserProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      setAllProperties(prev => prev.map(p => p.id === id ? { ...p, status: newStatus } : p));
      setSuccessMsg('تم تحديث حالة الشقة.');
    } else {
      setErrorMsg(error.message || 'حدث خطأ.');
    }
  };

  const handleDeleteListing = async (id) => {
    if (confirm('هل أنت متأكد من حذف هذا الإعلان نهائياً؟')) {
      const { error } = await deleteProperty(id);
      if (!error) {
        setUserProperties(prev => prev.filter(p => p.id !== id));
        setAllProperties(prev => prev.filter(p => p.id !== id));
        setSuccessMsg('تم حذف الإعلان بنجاح.');
      } else {
        setErrorMsg(error.message || 'حدث خطأ أثناء الحذف.');
      }
    }
  };

  // Admin: approve a property
  const handleApprove = async (propertyId) => {
    const { error } = await approveProperty(propertyId);
    if (!error) {
      setAllProperties(prev => prev.map(p =>
        p.id === propertyId ? { ...p, review_status: 'approved', rejection_reason: null } : p
      ));
      setSuccessMsg('✅ تمت الموافقة على الشقة وهي الآن معروضة للعلن.');
    } else {
      setErrorMsg(error.message || 'حدث خطأ.');
    }
  };

  // Admin: reject a property (with optional reason)
  const handleReject = async (propertyId) => {
    const { error } = await rejectProperty(propertyId, rejectReason);
    if (!error) {
      setAllProperties(prev => prev.map(p =>
        p.id === propertyId ? { ...p, review_status: 'rejected', rejection_reason: rejectReason } : p
      ));
      setRejectingId(null);
      setRejectReason('');
      setSuccessMsg('❌ تم رفض الشقة وإشعار المالك.');
    } else {
      setErrorMsg(error.message || 'حدث خطأ.');
    }
  };

  // Admin: reset rejected/approved back to pending_review
  const handleResetReview = async (propertyId) => {
    const { error } = await resetPropertyReview(propertyId);
    if (!error) {
      setAllProperties(prev => prev.map(p =>
        p.id === propertyId ? { ...p, review_status: 'pending_review', rejection_reason: null } : p
      ));
      setSuccessMsg('🔄 تمت إعادة الشقة إلى قائمة المراجعة.');
    } else {
      setErrorMsg(error?.message || 'حدث خطأ أثناء إعادة الشقة للمراجعة.');
    }
  };

  const getCommissionInfo = (property) => {
    const landlordUser = allUsers.find(u => u.id === property.landlord_id);
    const isBrokerListing = landlordUser ? landlordUser.role === 'broker' : (property.landlord?.role === 'broker');
    const percent = isBrokerListing ? 75 : 50;
    const amount = property.price * (percent / 100);
    return { percent, amount };
  };

  const getRoleLabel = (role) =>
    ({ landlord: 'مالك', broker: 'سمسار', admin: 'مسؤول النظام' }[role] || 'معلن');

  const formatDate = (iso) =>
    new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit' });

  const handleSendNotification = async (e) => {
    e.preventDefault();
    if (!notifForm.title || !notifForm.message) {
      setNotifError('يرجى كتابة عنوان الإشعار ونص الرسالة.');
      return;
    }
    if (notifForm.target === 'single' && !notifForm.phone) {
      setNotifError('يرجى إدخال رقم الهاتف لإرسال الإشعار للمستخدم.');
      return;
    }

    setNotifLoading(true);
    setNotifSuccess('');
    setNotifError('');

    try {
      const { sendNotification } = await import('@/utils/supabase');
      const payload = {
        title: notifForm.title,
        message: notifForm.message,
        phone: notifForm.target === 'single' ? notifForm.phone : null,
        targetRole: notifForm.target !== 'single' ? notifForm.target : null
      };

      const { success, error } = await sendNotification(payload);

      if (success) {
        setNotifSuccess('✅ تم إرسال الإشعار بنجاح للمستهدفين.');
        setNotifForm(prev => ({ ...prev, phone: '', title: '', message: '' }));
      } else {
        setNotifError(error?.message || 'فشل إرسال الإشعار. تأكد من صحة رقم الهاتف.');
      }
    } catch (err) {
      setNotifError('حدث خطأ غير متوقع أثناء إرسال الإشعار.');
    } finally {
      setNotifLoading(false);
    }
  };

  const handleUpdatePasswordAndResolve = async (requestId, targetUserId, newPassword) => {
    if (!newPassword || newPassword.length < 6) {
      setErrorMsg('يجب أن تتكون كلمة السر الجديدة من 6 أحرف على الأقل.');
      return;
    }

    try {
      setErrorMsg('');
      setSuccessMsg('');
      
      const pwdRes = await updateUserPassword(targetUserId, newPassword);
      if (pwdRes.error) {
        setErrorMsg(pwdRes.error.message);
        return;
      }

      const reqRes = await updatePasswordResetRequestStatus(requestId, 'resolved');
      if (reqRes.error) {
        setErrorMsg('تم تغيير كلمة السر بنجاح، لكن فشل تحديث حالة الطلب في قاعدة البيانات.');
        return;
      }

      setResetRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'resolved' } : r));
      setSuccessMsg('✅ تم تحديث كلمة مرور المستخدم وحل الطلب بنجاح.');
      
      setNewPasswordsMap(prev => {
        const copy = { ...prev };
        delete copy[requestId];
        return copy;
      });
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء معالجة الطلب.');
    }
  };

  const handleRejectResetRequest = async (requestId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      
      const res = await updatePasswordResetRequestStatus(requestId, 'rejected');
      if (res.error) {
        setErrorMsg('فشل تحديث حالة الطلب.');
        return;
      }

      setResetRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
      setSuccessMsg('❌ تم رفض طلب استعادة كلمة السر.');
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء رفض الطلب.');
    }
  };

  const handleDepositSubmit = async (e) => {
    e.preventDefault();
    if (!depositForm.phone || !depositForm.amount || Number(depositForm.amount) <= 0) {
      setDepositError('يرجى ملء جميع الحقول بمقادير صحيحة.');
      return;
    }
    setDepositLoading(true);
    setDepositSuccess('');
    setDepositError('');

    try {
      const res = await addBrokerBalanceByPhone(depositForm.phone, Number(depositForm.amount));
      if (res.success) {
        setDepositSuccess(`✅ تم إضافة ${depositForm.amount} ج.م بنجاح لحساب السمسار.`);
        setDepositForm({ phone: '', amount: '' });
        const [usersRes, txRes] = await Promise.all([
          getAllUsers(),
          getWalletTransactions()
        ]);
        if (usersRes.data) setAllUsers(usersRes.data);
        if (txRes.data) setWalletTransactions(txRes.data);
      } else {
        setDepositError(res.error?.message || 'فشل إيداع المبلغ.');
      }
    } catch (err) {
      setDepositError('حدث خطأ أثناء الإيداع.');
    } finally {
      setDepositLoading(false);
    }
  };

  const handleDeductSubmit = async (e) => {
    e.preventDefault();
    if (!deductForm.phone || !deductForm.amount || Number(deductForm.amount) <= 0) {
      setDeductError('يرجى ملء جميع الحقول بمقادير صحيحة.');
      return;
    }
    setDeductLoading(true);
    setDeductSuccess('');
    setDeductError('');

    try {
      const res = await deductBrokerBalanceByPhone(deductForm.phone, Number(deductForm.amount), deductForm.reason);
      if (res.success) {
        setDeductSuccess(`✅ تم خصم ${deductForm.amount} ج.م بنجاح من حساب السمسار.`);
        setDeductForm({ phone: '', amount: '', reason: '' });
        const [usersRes, txRes] = await Promise.all([
          getAllUsers(),
          getWalletTransactions()
        ]);
        if (usersRes.data) setAllUsers(usersRes.data);
        if (txRes.data) setWalletTransactions(txRes.data);
      } else {
        setDeductError(res.error?.message || 'فشل خصم المبلغ. تأكد من صحة رقم الهاتف وكفاية الرصيد.');
      }
    } catch (err) {
      setDeductError('حدث خطأ أثناء الخصم.');
    } finally {
      setDeductLoading(false);
    }
  };

  const handleWithdrawalStatusChange = async (requestId, newStatus) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await updateWithdrawalRequestStatus(requestId, newStatus);
      if (res.error) {
        setErrorMsg(res.error.message || 'فشل تحديث حالة الطلب.');
        return;
      }
      
      setWithdrawRequests(prev => prev.map(w => w.id === requestId ? { ...w, status: newStatus } : w));
      setSuccessMsg('✅ تم تحديث حالة طلب السحب بنجاح.');
      
      const [usersRes, txRes] = await Promise.all([
        getAllUsers(),
        getWalletTransactions()
      ]);
      if (usersRes.data) setAllUsers(usersRes.data);
      if (txRes.data) setWalletTransactions(txRes.data);
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء التحديث.');
    }
  };

  const handleApproveBrokerVerification = async (requestId, brokerId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await approveBrokerVerification(requestId, brokerId);
      if (res.error) {
        setErrorMsg(res.error.message || 'فشل قبول طلب التوثيق.');
        return;
      }
      setVerificationRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
      setSuccessMsg('✅ تم توثيق حساب السمسار وإرسال إشعار له.');
      
      // Reload users and properties to sync status
      const [usersRes, allPropsRes] = await Promise.all([
        getAllUsers(),
        getProperties({ isAdmin: true, allStatuses: true })
      ]);
      if (usersRes.data) setAllUsers(usersRes.data);
      if (allPropsRes.data) setAllProperties(allPropsRes.data);
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الموافقة.');
    }
  };

  const handleRejectBrokerVerification = async (requestId, brokerId) => {
    if (!verifRejectReason) {
      setErrorMsg('يرجى كتابة سبب الرفض أولاً.');
      return;
    }
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await rejectBrokerVerification(requestId, brokerId, verifRejectReason);
      if (res.error) {
        setErrorMsg(res.error.message || 'فشل رفض طلب التوثيق.');
        return;
      }
      setVerificationRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected', rejection_reason: verifRejectReason } : r));
      setVerifRejectingId(null);
      setVerifRejectReason('');
      setSuccessMsg('❌ تم رفض طلب التوثيق وإشعار السمسار بالسبب.');
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء رفض الطلب.');
    }
  };

  const handleBrokerVerificationSubmit = async (e) => {
    e.preventDefault();
    if (!verificationForm.notes) {
      setVerifFormError('يرجى كتابة نبذة تعريفية أو ملاحظات.');
      return;
    }
    setVerifSubmitLoading(true);
    setVerifFormError('');
    setVerifFormSuccess('');

    try {
      const res = await submitBrokerVerification({
        brokerId: user.id,
        fullName: user.full_name,
        phone: user.phone,
        notes: verificationForm.notes,
        documentImage: verificationForm.documentImage
      });

      if (res.success) {
        setVerifFormSuccess('✅ تم إرسال طلب التوثيق بنجاح! سيقوم الأدمن بمراجعته قريباً.');
        setVerificationForm({ notes: '', documentImage: null });
        setBrokerVerificationStatus(res.data);
        
        // Update user profile status
        const profileRes = await getUserProfile(user.id);
        if (profileRes.data) {
          setUser(profileRes.data);
          localStorage.setItem('sakany_session', JSON.stringify(profileRes.data));
        }
      } else {
        setVerifFormError(res.error?.message || 'فشل إرسال طلب التوثيق.');
      }
    } catch (err) {
      setVerifFormError('حدث خطأ غير متوقع.');
    } finally {
      setVerifSubmitLoading(false);
    }
  };

  const handlePromoSubmit = async (e) => {
    e.preventDefault();
    if (!promoConsent) {
      setPromoError('يرجى الموافقة على شروط الدفع وتكلفة الخدمة.');
      return;
    }
    setPromoSubmitLoading(true);
    setPromoError('');
    setPromoSuccess('');

    try {
      const res = await submitFeaturedRequest({
        propertyId: selectedPropertyForPromo.id,
        userId: user.id,
        paymentMethod: promoPaymentMethod
      });

      if (res.success) {
        setPromoSuccess('✅ تم إرسال طلب التمييز بنجاح! سيتواصل معك فريق سكني لتأكيد التفعيل.');
        setFeaturedRequests(prev => [res.data, ...prev]);
        setTimeout(() => {
          setShowPromotionModal(false);
          setSelectedPropertyForPromo(null);
        }, 2000);
      } else {
        setPromoError(res.error?.message || 'فشل إرسال طلب التمييز.');
      }
    } catch (err) {
      setPromoError('حدث خطأ غير متوقع.');
    } finally {
      setPromoSubmitLoading(false);
    }
  };

  const handleApprovePromo = async (requestId, propertyId, brokerId, paymentMethod) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await approveFeaturedRequest(requestId, propertyId, brokerId, paymentMethod);
      if (res.error) {
        setErrorMsg(res.error.message || 'فشل تفعيل التمييز.');
        return;
      }
      setFeaturedRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'approved' } : r));
      setAllProperties(prev => prev.map(p => p.id === propertyId ? { ...p, is_featured: true } : p));
      setAdminFeaturedPropertiesResults(prev => prev.map(p => p.id === propertyId ? { ...p, is_featured: true } : p));
      setSuccessMsg('✅ تم تفعيل تمييز الشقة بنجاح وإرسال إشعار للمالك/السمسار.');
      
      // Reload user profile and transaction history
      const [usersRes, txRes] = await Promise.all([
        getAllUsers(),
        getWalletTransactions()
      ]);
      if (usersRes.data) setAllUsers(usersRes.data);
      if (txRes.data) setWalletTransactions(txRes.data);
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء التفعيل.');
    }
  };

  const handleRejectPromo = async (requestId, brokerId) => {
    try {
      setErrorMsg('');
      setSuccessMsg('');
      const res = await rejectFeaturedRequest(requestId, brokerId);
      if (res.error) {
        setErrorMsg(res.error.message || 'فشل رفض طلب التمييز.');
        return;
      }
      setFeaturedRequests(prev => prev.map(r => r.id === requestId ? { ...r, status: 'rejected' } : r));
      setSuccessMsg('❌ تم رفض طلب التمييز بنجاح وإرسال إشعار للمالك/السمسار.');
    } catch (err) {
      setErrorMsg('حدث خطأ أثناء الرفض.');
    }
  };

  const handleAdminFeaturedSearch = async (e) => {
    e.preventDefault();
    if (!adminFeaturedSearchQuery.trim()) {
      setAdminFeaturedPropertiesResults([]);
      return;
    }
    setAdminSearchLoading(true);
    try {
      const { data, error } = await getProperties({
        search: adminFeaturedSearchQuery,
        isAdmin: true,
        allStatuses: true
      });
      if (error) {
        setErrorMsg('فشل البحث عن الشقق.');
      } else {
        setAdminFeaturedPropertiesResults(data || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdminSearchLoading(false);
    }
  };

  const handleSelectAddTab = async () => {
    setActiveTab('add');
    if (user && user.role === 'broker') {
      try {
        const [profileRes, verifStatusRes] = await Promise.all([
          getUserProfile(user.id),
          getBrokerVerificationStatus(user.id)
        ]);
        if (profileRes.data) {
          setUser(profileRes.data);
          localStorage.setItem('sakany_session', JSON.stringify(profileRes.data));
        }
        if (verifStatusRes.data) {
          setBrokerVerificationStatus(verifStatusRes.data);
        }
      } catch (e) {
        console.error('Failed to sync broker verification status', e);
      }
    }
  };

  /* ── Loading ── */
  if (loading) return (
    <div className={styles.container} style={{ textAlign: 'center', padding: '100px 20px' }} dir="rtl">
      <div className="skeleton" style={{ height: 40, width: 220, margin: '0 auto 20px' }} />
      <div className="skeleton" style={{ height: 20, width: 300, margin: '0 auto' }} />
    </div>
  );

  /* ── Student guard ── */
  if (user?.role === 'student') return (
    <div className={styles.unauthorizedBox} dir="rtl">
      <Lock className={styles.lockIcon} size={64} />
      <h2 className={styles.panelTitle}>غير مصرح لك بدخول هذه الصفحة</h2>
      <p style={{ color: 'var(--text-secondary)', maxWidth: 440, lineHeight: 1.7 }}>
        حسابك مسجل كـ <strong>طالب</strong>. لوحة التحكم مخصصة للملاك والشركاء فقط.
      </p>
      <div style={{ display: 'flex', gap: 15 }}>
        <button onClick={() => router.push('/')} className="btn btn-primary">تصفح الشقق</button>
        <button onClick={handleLogout} className="btn btn-secondary">خروج</button>
      </div>
    </div>
  );

  const isAdmin  = user?.role === 'admin';
  const isBroker = user?.role === 'broker';

  // Derived lists for landlord/broker
  const pendingProperties  = userProperties.filter(p => p.review_status === 'pending_review');
  const approvedProperties = userProperties.filter(p => p.review_status === 'approved');
  const rejectedProperties = userProperties.filter(p => p.review_status === 'rejected');

  // Derived lists for admin
  const adminPendingProps  = allProperties.filter(p => p.review_status === 'pending_review');
  const adminApprovedProps = allProperties.filter(p => p.review_status === 'approved');
  const adminRejectedProps = allProperties.filter(p => p.review_status === 'rejected');

  const pendingBookings = bookings.filter(b => b.status === 'pending').length;
  const totalViews = (isAdmin ? allProperties : userProperties).reduce((a, p) => a + (p.views_count || 0), 0);

  /* ── Common property card for landlord/broker view ── */
  const renderOwnerPropertyCard = (property) => {
    const rvCfg = REVIEW_CONFIG[property.review_status] || REVIEW_CONFIG.pending_review;
    return (
      <div key={property.id} className={styles.listingItem}>
        <Link href={`/properties/${property.id}`} target="_blank">
          <img src={property.images?.[0]} alt={property.title} className={styles.itemImage} style={{ cursor: 'pointer' }} />
        </Link>
        <div className={styles.itemDetails}>
          <Link href={`/properties/${property.id}`} target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>
            <h3 className={styles.itemTitle} style={{ cursor: 'pointer' }}>{property.title}</h3>
          </Link>
          <div className={styles.itemPrice}>
            {property.price?.toLocaleString('ar-EG')} {property.rent_type === 'bed' ? 'ج.م / سرير شهرياً' : 'ج.م / شهر'}
            {property.rent_type === 'bed' && (
              <span style={{ fontSize: '0.8rem', color: 'var(--primary)', marginRight: 10, fontWeight: 'bold' }}>
                (🛌 نظام سراير - متاح {property.available_beds} من {property.beds})
              </span>
            )}
          </div>
          <div className={styles.itemMeta}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <MapPin size={12} /><span>{property.location}</span>
            </div>
            {/* Review status badge */}
            <span style={{
              padding: '3px 10px', borderRadius: 20, fontSize: '0.78rem', fontWeight: 700,
              color: rvCfg.color, backgroundColor: rvCfg.bg
            }}>
              {rvCfg.icon} {rvCfg.label}
            </span>
            {property.review_status === 'rejected' && property.rejection_reason && (
              <span style={{ fontSize: '0.78rem', color: '#ef4444', marginTop: 4 }}>
                سبب الرفض: {property.rejection_reason}
              </span>
            )}
          </div>
        </div>
        <div className={styles.itemActions}>
          <Link
            href={`/properties/${property.id}`}
            target="_blank"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-sm)', padding: '6px 12px',
              fontFamily: 'inherit', fontWeight: 600, fontSize: '0.8rem',
              whiteSpace: 'nowrap', textDecoration: 'none', cursor: 'pointer'
            }}
          >
            <Eye size={14} /> معاينة
          </Link>
          {property.review_status === 'approved' && (
            <button
              onClick={() => handleTogglePropertyStatus(property.id, property.status)}
              className={`${styles.statusToggleBtn} ${property.status === 'available' ? styles.statusAvailable : styles.statusRented}`}
            >
              {property.status === 'available' ? 'متاح' : 'مؤجر'}
            </button>
          )}
          {property.review_status === 'approved' && !property.is_featured && (() => {
            const existingReq = featuredRequests.find(r => r.property_id === property.id);
            if (existingReq && existingReq.status === 'pending') {
              return (
                <span style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '6px 12px', borderRadius: 'var(--radius-sm)',
                  fontSize: '0.8rem', fontWeight: 700,
                  color: '#d97706', background: 'rgba(217,119,6,0.08)',
                  border: '1px solid rgba(217,119,6,0.2)'
                }}>
                  <HourglassIcon size={14} /> طلب تمييز قيد المراجعة
                </span>
              );
            }
            return (
              <button
                onClick={() => {
                  setSelectedPropertyForPromo(property);
                  setPromoPaymentMethod(isBroker ? 'wallet' : 'contact');
                  setPromoConsent(false);
                  setPromoError('');
                  setPromoSuccess('');
                  setShowPromotionModal(true);
                }}
                style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  color: '#fff', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '6px 12px',
                  fontFamily: 'inherit', fontWeight: 700, fontSize: '0.8rem',
                  whiteSpace: 'nowrap', cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(217,119,6,0.3)',
                  transition: 'var(--transition)'
                }}
              >
                <Rocket size={14} /> بيع أسرع 🚀
              </button>
            );
          })()}
          {property.is_featured && (
            <span style={{
              display: 'flex', alignItems: 'center', gap: 5,
              padding: '5px 10px', borderRadius: 'var(--radius-sm)',
              fontSize: '0.78rem', fontWeight: 700,
              color: '#d97706', background: 'rgba(217,119,6,0.1)',
              border: '1px solid rgba(217,119,6,0.25)'
            }}>
              <Star size={13} /> مميزة ⭐
            </span>
          )}
          <button onClick={() => handleDeleteListing(property.id)} className={styles.deleteBtn} title="حذف">
            <Trash2 size={18} />
          </button>
        </div>
      </div>
    );
  };

  /* ── Admin property review card ── */
  const renderAdminPropertyCard = (property) => {
    const rvCfg = REVIEW_CONFIG[property.review_status] || REVIEW_CONFIG.pending_review;
    const isShowingRejectForm = rejectingId === property.id;
    return (
      <div key={property.id} style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: 20,
        display: 'flex',
        gap: 16,
        flexWrap: 'wrap',
        alignItems: 'flex-start',
        position: 'relative'
      }}>
        {/* Image */}
        <Link href={`/properties/${property.id}`} target="_blank">
          <img
            src={property.images?.[0]}
            alt={property.title}
            style={{ width: 110, height: 80, objectFit: 'cover', borderRadius: 'var(--radius-md)', flexShrink: 0, cursor: 'pointer' }}
          />
        </Link>

        {/* Details */}
        <div style={{ flex: 1, minWidth: 200 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', marginBottom: 6 }}>
            <Link href={`/properties/${property.id}`} target="_blank" style={{ textDecoration: 'none', color: 'inherit' }}>
              <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 700, cursor: 'pointer' }}>{property.title}</h3>
            </Link>
            <span style={{
              padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
              color: rvCfg.color, backgroundColor: rvCfg.bg, whiteSpace: 'nowrap'
            }}>
              {rvCfg.icon} {rvCfg.label}
            </span>
            {property.is_featured && (
              <span style={{
                padding: '2px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                color: '#d97706', backgroundColor: 'rgba(217,119,6,0.12)', whiteSpace: 'nowrap',
                display: 'inline-flex', alignItems: 'center', gap: 4
              }}>
                ⭐ مميزة
              </span>
            )}
          </div>
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={12} />{property.location}</span>
            <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{property.price?.toLocaleString('ar-EG')} ج.م</span>
            <span>{property.rooms} غرف · دور {property.floor}</span>
            <span style={{ color: 'var(--text-muted)' }}>{formatDate(property.created_at)}</span>
          </div>
          
          {/* Commission Info */}
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
            <span style={{
              background: getCommissionInfo(property).percent === 75 ? 'rgba(37,99,235,0.1)' : 'rgba(5,150,105,0.1)',
              color: getCommissionInfo(property).percent === 75 ? '#2563eb' : '#059669',
              padding: '3px 8px', borderRadius: 4, fontWeight: 700, fontSize: '0.78rem'
            }}>
              عمولة سكني {getCommissionInfo(property).percent}%: {getCommissionInfo(property).amount?.toLocaleString('ar-EG')} ج.م
            </span>
            <span style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
              ({getCommissionInfo(property).percent === 75 ? 'شقة سمسار' : 'شقة مالك'})
            </span>
          </div>

          {property.rejection_reason && (
            <div style={{ marginTop: 8, fontSize: '0.82rem', color: '#ef4444', background: '#fee2e2', borderRadius: 6, padding: '4px 10px' }}>
              سبب الرفض السابق: {property.rejection_reason}
            </div>
          )}

          {/* Reject form inline */}
          {isShowingRejectForm && (
            <div style={{ marginTop: 12, display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                placeholder="سبب الرفض (اختياري)..."
                className="form-input"
                style={{ flex: 1, minWidth: 180, padding: '7px 12px', fontSize: '0.85rem' }}
              />
              <button
                onClick={() => handleReject(property.id)}
                style={{
                  background: '#ef4444', color: '#fff', border: 'none', borderRadius: 'var(--radius-sm)',
                  padding: '7px 16px', fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                تأكيد الرفض
              </button>
              <button
                onClick={() => { setRejectingId(null); setRejectReason(''); }}
                style={{
                  background: 'var(--border)', color: 'var(--text-secondary)', border: 'none',
                  borderRadius: 'var(--radius-sm)', padding: '7px 14px', fontFamily: 'inherit',
                  fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem'
                }}
              >
                إلغاء
              </button>
            </div>
          )}
        </div>

        {/* Admin action buttons */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
          <Link
            href={`/properties/${property.id}`}
            target="_blank"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: 'transparent', color: 'var(--primary)', border: '1px solid var(--primary)',
              borderRadius: 'var(--radius-sm)', padding: '8px 16px',
              fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
              whiteSpace: 'nowrap', textDecoration: 'none', justifyContent: 'center'
            }}
          >
            <Eye size={16} /> معاينة الشقة
          </Link>
          {property.review_status !== 'approved' && (
            <button
              onClick={() => handleApprove(property.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: '#059669', color: '#fff', border: 'none',
                borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              <ShieldCheck size={16} /> قبول ونشر
            </button>
          )}
          {property.review_status === 'approved' && (
            <button
              onClick={() => handleToggleFeatured(property.id, !property.is_featured)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: property.is_featured ? 'rgba(217,119,6,0.1)' : 'transparent',
                color: '#d97706', border: '1px solid #d97706',
                borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                whiteSpace: 'nowrap', justifyContent: 'center'
              }}
            >
              <Sparkles size={16} />
              <span>{property.is_featured ? 'إلغاء التميز' : 'تمييز الشقة'}</span>
            </button>
          )}
          {property.review_status !== 'rejected' && !isShowingRejectForm && (
            <button
              onClick={() => { setRejectingId(property.id); setRejectReason(''); }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                borderRadius: 'var(--radius-sm)', padding: '8px 16px',
                fontFamily: 'inherit', fontWeight: 700, cursor: 'pointer', fontSize: '0.85rem',
                whiteSpace: 'nowrap'
              }}
            >
              <ShieldX size={16} /> رفض
            </button>
          )}
          {property.review_status !== 'pending_review' && (
            <button
              onClick={() => handleResetReview(property.id)}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'transparent', color: 'var(--text-secondary)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)', padding: '8px 14px',
                fontFamily: 'inherit', fontWeight: 600, cursor: 'pointer', fontSize: '0.8rem',
                whiteSpace: 'nowrap'
              }}
            >
              <RefreshCw size={14} /> إعادة للمراجعة
            </button>
          )}
          {(isBroker || property.review_status === 'rejected') && (
            <button onClick={() => handleDeleteListing(property.id)} className={styles.deleteBtn} title="حذف">
              <Trash2 size={16} />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={styles.container} dir="rtl">

      {/* ── Header ── */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>لوحة تحكم سَكني</h1>
          <p className={styles.welcomeText}>
            مرحباً {user?.name} ({getRoleLabel(user?.role)}) 👋
            {isAdmin && <span style={{ marginRight: 8, background: '#fef3c7', color: '#92400e', padding: '2px 10px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 700 }}>🛡️ حساب الإدارة</span>}
          </p>
        </div>
        <button onClick={handleLogout} className="btn btn-danger" style={{ padding: '8px 16px' }}>
          <LogOut size={16} /><span>خروج</span>
        </button>
      </div>

      {/* ── Success/Error ── */}
      {successMsg && (
        <div className="badge badge-verified" style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <CheckCircle2 size={16} /><span>{successMsg}</span>
          <button onClick={() => setSuccessMsg('')} style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}
      {errorMsg && (
        <div className="badge badge-danger" style={{ width: '100%', padding: 12, marginBottom: 20, borderRadius: 'var(--radius-sm)', display: 'flex', alignItems: 'center', gap: 8 }}>
          <AlertCircle size={16} /><span>{errorMsg}</span>
          <button onClick={() => setErrorMsg('')} style={{ marginRight: 'auto', background: 'none', border: 'none', cursor: 'pointer', color: 'inherit' }}>✕</button>
        </div>
      )}

      {/* ── Stats ── */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.statIconPrimary}`}><Home size={24} /></div>
          <div className={styles.statDetails}>
            <span className={styles.statValue}>{isAdmin ? adminApprovedProps.length : approvedProperties.length}</span>
            <span className={styles.statLabel}>شقق مقبولة ومعروضة</span>
          </div>
        </div>
        {isAdmin && (
          <div className={styles.statCard}>
            <div className={`${styles.statIconWrapper}`} style={{ background: '#fef3c7', color: '#d97706' }}><Clock size={24} /></div>
            <div className={styles.statDetails}>
              <span className={styles.statValue} style={{ color: adminPendingProps.length > 0 ? '#d97706' : undefined }}>
                {adminPendingProps.length}
              </span>
              <span className={styles.statLabel}>بانتظار المراجعة</span>
            </div>
          </div>
        )}
        <div className={styles.statCard}>
          <div className={`${styles.statIconWrapper} ${styles.statIconSecondary}`}><Eye size={24} /></div>
          <div className={styles.statDetails}>
            <span className={styles.statValue}>{totalViews}</span>
            <span className={styles.statLabel}>إجمالي المشاهدات</span>
          </div>
        </div>
        {(isAdmin || isBroker) && (
          <div className={styles.statCard}>
            <div className={`${styles.statIconWrapper} ${styles.statIconInfo}`}><Inbox size={24} /></div>
            <div className={styles.statDetails}>
              <span className={styles.statValue} style={{ color: pendingBookings > 0 ? 'var(--secondary)' : undefined }}>
                {pendingBookings}
              </span>
              <span className={styles.statLabel}>طلبات حجز جديدة</span>
            </div>
          </div>
        )}
      </div>

      {/* ══════════════════════════════════════════
          TAB SWITCHER
      ══════════════════════════════════════════ */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 32, flexWrap: 'wrap' }}>
        {isAdmin ? (
          <>
            <button
              onClick={() => setActiveTab('review')}
              className={activeTab === 'review' ? 'btn btn-primary' : 'btn btn-secondary'}
              style={{ padding: '10px 18px', position: 'relative' }}
            >
              <ShieldCheck size={18} />
              <span>قسم المراجعة ({adminPendingProps.length})</span>
              {adminPendingProps.length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{adminPendingProps.length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('all_properties')} className={activeTab === 'all_properties' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
              <Home size={18} /><span>جميع الشقق ({allProperties.length})</span>
            </button>
            <button onClick={() => setActiveTab('bookings')} className={activeTab === 'bookings' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
              <ClipboardList size={18} /><span>طلبات الحجز ({bookings.length})</span>
            </button>
            <button onClick={() => setActiveTab('accounts')} className={activeTab === 'accounts' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
              <Users size={18} /><span>إدارة الحسابات ({allUsers.filter(u => u.role !== 'admin').length})</span>
            </button>
            <button onClick={() => setActiveTab('notifications')} className={activeTab === 'notifications' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
              <Bell size={18} /><span>إرسال الإشعارات</span>
            </button>
            <button onClick={() => setActiveTab('resets')} className={activeTab === 'resets' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px', position: 'relative' }}>
              <Lock size={18} style={{ color: 'var(--secondary)' }} /><span>طلبات كلمة السر</span>
              {resetRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{resetRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('broker_accounts')} className={activeTab === 'broker_accounts' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px', position: 'relative' }}>
              <Wallet size={18} /><span>حسابات السماسرة</span>
              {withdrawRequests.filter(w => w.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{withdrawRequests.filter(w => w.status === 'pending').length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('broker_verifications')} className={activeTab === 'broker_verifications' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px', position: 'relative' }}>
              <ShieldCheck size={18} /><span>توثيق السماسرة</span>
              {verificationRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{verificationRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('featured_properties')} className={activeTab === 'featured_properties' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px', position: 'relative' }}>
              <Star size={18} /><span>تمييز الشقق</span>
              {featuredRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#ef4444', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{featuredRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </button>
          </>
        ) : (
          <>
            <button onClick={() => setActiveTab('pending_properties')} className={activeTab === 'pending_properties' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px', position: 'relative' }}>
              <Clock size={18} /><span>تحت المراجعة ({pendingProperties.length})</span>
              {pendingProperties.length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#d97706', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{pendingProperties.length}</span>
              )}
            </button>
            <button onClick={() => setActiveTab('approved_properties')} className={activeTab === 'approved_properties' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
              <CheckCircle2 size={18} /><span>الشقق المعتمدة ({approvedProperties.length})</span>
            </button>
            {rejectedProperties.length > 0 && (
              <button onClick={() => setActiveTab('rejected_properties')} className={activeTab === 'rejected_properties' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
                <XCircle size={18} /><span>مرفوضة ({rejectedProperties.length})</span>
              </button>
            )}
            <button onClick={() => setActiveTab('bookings')} className={activeTab === 'bookings' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px', position: 'relative' }}>
              <ClipboardList size={18} /><span>متابعة الحجوزات ({bookings.length})</span>
              {bookings.length > 0 && (
                <span style={{
                  position: 'absolute', top: -6, right: -6,
                  background: 'var(--primary)', color: '#fff',
                  borderRadius: '50%', width: 20, height: 20,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.7rem', fontWeight: 900
                }}>{bookings.length}</span>
              )}
            </button>
            <button onClick={handleSelectAddTab} className={activeTab === 'add' ? 'btn btn-primary' : 'btn btn-secondary'} style={{ padding: '10px 18px' }}>
              <PlusCircle size={18} /><span>إضافة شقة</span>
            </button>
          </>
        )}
      </div>

      {/* ══════════════════════════════════════════
          ADMIN — REVIEW QUEUE TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'review' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>
            🔍 قسم المراجعة — الشقق بانتظار الموافقة
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            راجع كل شقة وقم بالموافقة عليها لتظهر للطلاب، أو رفضها مع ذكر السبب لإشعار المالك.
          </p>

          {adminPendingProps.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={48} style={{ color: '#059669', marginBottom: 12 }} />
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>لا توجد شقق بانتظار المراجعة</p>
              <p style={{ fontSize: '0.85rem' }}>جميع الشقق المرسلة تمت مراجعتها.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {adminPendingProps.map(p => renderAdminPropertyCard(p))}
            </div>
          )}

          {/* Previously reviewed */}
          {adminRejectedProps.length > 0 && (
            <div style={{ marginTop: 40 }}>
              <h3 className={styles.panelTitle} style={{ fontSize: '1rem', marginBottom: 16, color: '#ef4444' }}>
                ❌ شقق مرفوضة ({adminRejectedProps.length})
              </h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {adminRejectedProps.map(p => renderAdminPropertyCard(p))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          ADMIN — ALL PROPERTIES TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'all_properties' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 24 }}>
            جميع الشقق ({allProperties.length})
          </h2>
          {allProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)' }}>
              <Home size={40} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
              <p>لا توجد شقق.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {allProperties.map(p => renderAdminPropertyCard(p))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          BOOKING REQUESTS (admin/broker/landlord)
      ══════════════════════════════════════════ */}
      {(isAdmin || isBroker || user?.role === 'landlord') && activeTab === 'bookings' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>
            {isAdmin ? '📂 طلبات الحجز الواردة للمنصة' : '📅 متابعة طلبات الحجز لعقاراتك'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            {isAdmin 
              ? 'إدارة ومتابعة جميع طلبات الحجز والتواصل مع الطلاب والملاك لتنسيق المعاينات.' 
              : 'هنا يمكنك متابعة طلبات الحجز التي تمت على شققك وحالتها الحالية المحدثة من قبل إدارة المنصة.'}
          </p>

          {!isAdmin && (
            <div style={{ 
              background: '#eff6ff', 
              border: '1px solid #bfdbfe', 
              borderRadius: 'var(--radius-md)', 
              padding: '12px 14px', 
              marginBottom: 24, 
              fontSize: '0.88rem', 
              color: '#1e3a8a', 
              display: 'flex', 
              alignItems: 'center', 
              gap: 8 
            }}>
              <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
              <span><strong>💡 قسم للمتابعة فقط:</strong> إدارة منصة سَكني هي المسؤولة عن التواصل مع الطلاب وتحديث حالة الحجز وتنسيق المعاينة والعقد.</span>
            </div>
          )}

          {bookings.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <Inbox size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p>لا توجد طلبات حجز حالياً.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {bookings.map(booking => {
                // Dynamic colors that work perfectly in both light and dark modes
                const getStatusColorConfig = (status) => {
                  const map = {
                    pending: { color: '#d97706', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)', label: 'جديد — بانتظار التواصل' },
                    contacted: { color: '#2563eb', bg: 'rgba(37,99,235,0.12)', border: 'rgba(37,99,235,0.3)', label: 'تم التواصل مع الطرفين' },
                    completed: { color: '#059669', bg: 'rgba(5,150,105,0.12)', border: 'rgba(5,150,105,0.3)', label: 'مكتمل — تم التعاقد' },
                    canceled: { color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)', label: 'ملغي' }
                  };
                  return map[status] || map.pending;
                };

                const cfg = getStatusColorConfig(booking.status);

                return (
                  <div key={booking.id} className={styles.bookingCard}>
                    <div className={styles.bookingHeader}>
                      <span className={styles.bookingDate}>{formatDate(booking.created_at)}</span>
                      <span 
                        className={styles.statusBadge} 
                        style={{ 
                          color: cfg.color, 
                          backgroundColor: cfg.bg,
                          border: `1px solid ${cfg.border}`
                        }}
                      >
                        {cfg.label}
                      </span>
                    </div>
                    <div className={styles.bookingBody}>
                      {/* Student Details */}
                      <div 
                        className={styles.partyCard} 
                        style={{ 
                          borderColor: 'rgba(37,99,235,0.25)', 
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-primary)'
                        }}
                      >
                        <div className={styles.partyLabel} style={{ color: '#2563eb' }}>
                          <User size={14} style={{ marginLeft: 4 }} /> الطالب الراغب بالحجز
                        </div>
                        <div className={styles.partyName} style={{ color: 'var(--text-primary)' }}>
                          {booking.student?.full_name}
                        </div>
                        <a 
                          href={`tel:${booking.student?.phone}`} 
                          className={styles.partyPhone} 
                          style={{ color: '#2563eb' }}
                        >
                          <Phone size={14} style={{ marginLeft: 4 }} />
                          <span>{booking.student?.phone}</span>
                        </a>
                      </div>

                      {/* Property Details (Clickable Link) */}
                      <Link 
                        href={`/properties/${booking.property?.id || booking.property_id}`} 
                        target="_blank"
                        className={`${styles.partyCard} ${styles.partyCardHover}`}
                        style={{ 
                          borderColor: 'rgba(5,150,105,0.3)', 
                          backgroundColor: 'var(--surface)',
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          cursor: 'pointer'
                        }}
                      >
                        <div className={styles.partyLabel} style={{ color: 'var(--primary)' }}>
                          <Home size={14} style={{ marginLeft: 4 }} /> السكن المطلوب
                        </div>
                        <div className={styles.partyName} style={{ color: 'var(--text-primary)' }}>
                          {booking.property?.title}
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: 4 }}>
                          <MapPin size={12} style={{ marginLeft: 2 }} />
                          <span>{booking.property?.location}</span>
                          {booking.requested_beds && (
                            <span style={{ marginRight: 10, color: 'var(--secondary-hover)', fontWeight: 'bold' }}>
                              (🛌 حجز {booking.requested_beds} {booking.requested_beds === 1 ? 'سرير' : 'سراير'})
                            </span>
                          )}
                          <span style={{ marginRight: 'auto', fontWeight: 800, color: 'var(--primary)' }}>
                            {booking.property?.price?.toLocaleString('ar-EG')} ج.م {booking.requested_beds ? '/ للسرير' : ''}
                          </span>
                        </div>
                      </Link>

                      {/* Landlord Details (Only visible to admin) */}
                      {isAdmin && (() => {
                        // Support both: booking.landlord (mock) and booking.property.landlord (Supabase join)
                        const landlord = booking.landlord || booking.property?.landlord;
                        return (
                          <div 
                            className={styles.partyCard} 
                            style={{ 
                              borderColor: 'rgba(217,119,6,0.25)', 
                              backgroundColor: 'var(--surface)',
                              color: 'var(--text-primary)'
                            }}
                          >
                            <div className={styles.partyLabel} style={{ color: '#d97706' }}>
                              <User size={14} style={{ marginLeft: 4 }} /> صاحب العقار
                            </div>
                            <div className={styles.partyName} style={{ color: 'var(--text-primary)' }}>
                              {landlord?.full_name || '—'}
                            </div>
                            {landlord?.phone ? (
                              <a 
                                href={`tel:${landlord.phone}`} 
                                className={styles.partyPhone} 
                                style={{ color: '#d97706' }}
                              >
                                <Phone size={14} style={{ marginLeft: 4 }} />
                                <span>{landlord.phone}</span>
                              </a>
                            ) : (
                              <span style={{ fontSize: '0.83rem', color: 'var(--text-muted)' }}>لا يوجد رقم هاتف</span>
                            )}
                          </div>
                        );
                      })()}
                    </div>

                    {/* Change status actions (Admin only) or Status Indicator (Landlord/Broker) */}
                    {isAdmin ? (
                      <div className={styles.statusActions}>
                        <span style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--text-secondary)' }}>تغيير الحالة:</span>
                        {Object.entries(STATUS_CONFIG).map(([key, conf]) => {
                          const btnCfg = getStatusColorConfig(key);
                          const isActive = booking.status === key;
                          return (
                            <button 
                              key={key} 
                              onClick={() => handleStatusChange(booking.id, key)} 
                              disabled={isActive}
                              style={{
                                padding: '6px 12px', 
                                borderRadius: 'var(--radius-sm)',
                                border: `1px solid ${btnCfg.color}`,
                                backgroundColor: isActive ? btnCfg.bg : 'transparent',
                                color: btnCfg.color, 
                                fontFamily: 'inherit', 
                                fontSize: '0.8rem', 
                                fontWeight: 700,
                                cursor: isActive ? 'default' : 'pointer',
                                opacity: isActive ? 1 : 0.7, 
                                transition: 'var(--transition)'
                              }}
                            >
                              {isActive && <Check size={12} style={{ marginLeft: 4, verticalAlign: 'middle' }} />}
                              {conf.label}
                            </button>
                          );
                        })}
                      </div>
                    ) : (
                      <div style={{ 
                        marginTop: 14, 
                        paddingTop: 12, 
                        borderTop: '1px solid var(--border)', 
                        fontSize: '0.82rem', 
                        color: 'var(--text-secondary)',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6
                      }}>
                        <Clock size={14} style={{ color: 'var(--primary)' }} />
                        <span>آخر تحديث للحالة من الإدارة: <strong>{cfg.label}</strong></span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          ADMIN — ACCOUNTS MANAGEMENT TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'accounts' && (() => {
        const students  = allUsers.filter(u => u.role === 'student');
        const landlords = allUsers.filter(u => u.role === 'landlord');
        const brokers   = allUsers.filter(u => u.role === 'broker');

        const subTabs = [
          { key: 'students',  label: `الطلاب (${students.length})`,   icon: <GraduationCap size={16} />, data: students },
          { key: 'landlords', label: `الملاك (${landlords.length})`,   icon: <Building2 size={16} />,     data: landlords },
          { key: 'brokers',   label: `السماسرة (${brokers.length})`,   icon: <User size={16} />,           data: brokers }
        ];
        const currentData = subTabs.find(t => t.key === usersSubTab)?.data || [];

        const handleDeleteUser = async (userId, userName) => {
          if (!confirm(`هل أنت متأكد من حذف حساب "${userName}" نهائياً؟\nلا يمكن التراجع عن هذا الإجراء.`)) return;
          const { success, error: delErr } = await deleteUser(userId);
          if (success) {
            setAllUsers(prev => prev.filter(u => u.id !== userId));
            setSuccessMsg(`✅ تم حذف حساب "${userName}" بنجاح.`);
          } else {
            setErrorMsg(delErr?.message || 'حدث خطأ أثناء حذف الحساب.');
          }
        };

        const fmtDate = (iso) => iso ? new Date(iso).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' }) : '—';

        return (
          <div>
            <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>👥 إدارة حسابات المستخدمين</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
              عرض وإدارة جميع حسابات المستخدمين المسجلين في المنصة مع إمكانية الحذف.
            </p>

            {/* Sub-tabs */}
            <div style={{ display: 'flex', gap: 8, marginBottom: 28, flexWrap: 'wrap' }}>
              {subTabs.map(t => (
                <button
                  key={t.key}
                  onClick={() => setUsersSubTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '9px 20px', borderRadius: 'var(--radius-md)',
                    fontFamily: 'inherit', fontWeight: 700, fontSize: '0.9rem',
                    cursor: 'pointer', border: '1.5px solid', transition: 'var(--transition)',
                    borderColor: usersSubTab === t.key ? 'var(--primary)' : 'var(--border)',
                    background: usersSubTab === t.key ? 'var(--primary)' : 'var(--surface)',
                    color: usersSubTab === t.key ? '#fff' : 'var(--text-secondary)'
                  }}
                >
                  {t.icon}{t.label}
                </button>
              ))}
            </div>

            {/* Users list */}
            {currentData.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                <Users size={40} style={{ marginBottom: 10, color: 'var(--text-muted)' }} />
                <p>لا يوجد مستخدمون في هذه الفئة حتى الآن.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {currentData.map(u => (
                  <div key={u.id} style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-md)',
                    padding: '16px 20px',
                    display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap'
                  }}>
                    {/* Avatar */}
                    <div style={{
                      width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
                      background: 'var(--primary-light)', color: 'var(--primary)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontWeight: 800, fontSize: '1.3rem'
                    }}>
                      {u.full_name?.[0] || '؟'}
                    </div>

                    {/* Info */}
                    <div style={{ flex: 1, minWidth: 180 }}>
                      <div style={{ fontWeight: 700, fontSize: '1rem', marginBottom: 5 }}>{u.full_name}</div>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px 16px', fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
                        {u.phone && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <Phone size={12} />
                            <a href={`tel:${u.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{u.phone}</a>
                          </span>
                        )}
                        {u.email && (
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                            <User size={12} />{u.email}
                          </span>
                        )}
                        <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <Clock size={12} />انضم في: {fmtDate(u.created_at)}
                        </span>
                      </div>
                    </div>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteUser(u.id, u.full_name)}
                      title="حذف الحساب نهائياً"
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '8px 14px', borderRadius: 'var(--radius-sm)',
                        background: 'transparent', color: '#ef4444',
                        border: '1px solid #ef4444',
                        fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem',
                        cursor: 'pointer', transition: 'var(--transition)', whiteSpace: 'nowrap', flexShrink: 0
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = '#fee2e2'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                    >
                      <Trash2 size={14} />حذف الحساب
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          ADMIN — NOTIFICATIONS TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'notifications' && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>📢 مركز إرسال الإشعارات التنبيهية</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            يمكنك من هنا بث إشعارات لجميع المستخدمين، أو لفئة محددة، أو استهداف مستخدم بعينه عن طريق رقم هاتفه المحمول.
          </p>

          {notifSuccess && (
            <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid var(--primary)', color: 'var(--primary-dark)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontWeight: 700 }}>
              {notifSuccess}
            </div>
          )}
          {notifError && (
            <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid var(--danger)', color: 'var(--danger)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontWeight: 700 }}>
              {notifError}
            </div>
          )}

          <div className={styles.formCard} style={{ maxWidth: 650 }}>
            <form onSubmit={handleSendNotification} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>تحديد فئة المستهدفين *</label>
                <select 
                  value={notifForm.target} 
                  onChange={e => {
                    setNotifForm(prev => ({ ...prev, target: e.target.value }));
                    setNotifError('');
                    setNotifSuccess('');
                  }} 
                  className="form-input"
                  style={{ width: '100%', padding: '10px 12px' }}
                >
                  <option value="all">جميع مستخدمي المنصة (طلاب + ملاك + سماسرة)</option>
                  <option value="student">الطلاب فقط</option>
                  <option value="landlord">الملاك فقط</option>
                  <option value="broker">السماسرة فقط</option>
                  <option value="single">مطلب محدد (بحث برقم الهاتف)</option>
                </select>
              </div>

              {notifForm.target === 'single' && (
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>رقم الهاتف المحمول للمستقبل *</label>
                  <input 
                    type="text" 
                    value={notifForm.phone} 
                    onChange={e => setNotifForm(prev => ({ ...prev, phone: e.target.value }))}
                    placeholder="مثال: 01040122363" 
                    className="form-input" 
                    style={{ width: '100%', padding: '10px 12px' }}
                    required 
                  />
                </div>
              )}

              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>عنوان التنبيه / الإشعار *</label>
                <input 
                  type="text" 
                  value={notifForm.title} 
                  onChange={e => setNotifForm(prev => ({ ...prev, title: e.target.value }))}
                  placeholder="مثال: تحديث أمني هام في المنصة" 
                  className="form-input" 
                  style={{ width: '100%', padding: '10px 12px' }}
                  required 
                />
              </div>

              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>نص التنبيه / الرسالة *</label>
                <textarea 
                  value={notifForm.message} 
                  onChange={e => setNotifForm(prev => ({ ...prev, message: e.target.value }))}
                  placeholder="اكتب هنا تفاصيل التنبيه الموجه للمستخدمين..." 
                  className="form-input" 
                  rows={5} 
                  style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                  required 
                />
              </div>

              <button 
                type="submit" 
                className="btn btn-primary" 
                style={{ padding: 14, width: '100%', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} 
                disabled={notifLoading}
              >
                {notifLoading ? 'جاري إرسال الإشعارات...' : 'إرسال الإشعار فوراً 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ADMIN — PASSWORD RESET REQUESTS TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'resets' && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>🔑 طلبات استعادة وتعديل كلمة السر</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            إدارة طلبات إعادة تعيين كلمات المرور للمستخدمين الذين نسوا بيانات تسجيل الدخول الخاصة بهم.
          </p>

          <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 'var(--radius-md)', padding: '12px 14px', marginBottom: 20, fontSize: '0.88rem', color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Sparkles size={16} style={{ color: 'var(--secondary)' }} />
            <span><strong>💡 ملاحظة هامة:</strong> كلمة السر الحالية للمستخدم مشفرة ومحمية في سوبابيس (لأسباب أمنية). لتعديلها، اكتب كلمة السر الجديدة في الحقل واضغط تحديث.</span>
          </div>

          {resetRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <Lock size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p>لا توجد طلبات استعادة كلمة سر حالياً.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {resetRequests.map(req => {
                const targetUser = allUsers.find(u => u.phone === req.phone);
                const isPending = req.status === 'pending';
                
                return (
                  <div 
                    key={req.id} 
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 14,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{req.full_name || 'مستخدم غير معروف'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 12 }}>{formatDate(req.created_at)}</span>
                      </div>
                      <span style={{
                        padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                        backgroundColor: req.status === 'pending' ? 'rgba(217,119,6,0.12)' : req.status === 'resolved' ? 'rgba(5,150,105,0.12)' : 'rgba(239,68,68,0.12)',
                        color: req.status === 'pending' ? '#d97706' : req.status === 'resolved' ? '#059669' : '#ef4444'
                      }}>
                        {req.status === 'pending' ? 'قيد الانتظار' : req.status === 'resolved' ? 'تم الحل وتحديث كلمة السر' : 'مرفوض'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                      <div>
                        <strong>رقم الهاتف: </strong>
                        <a href={`tel:${req.phone}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{req.phone}</a>
                      </div>
                      {targetUser && (
                        <>
                          <div><strong>نوع الحساب: </strong>{getRoleLabel(targetUser.role)}</div>
                          <div><strong>البريد الإلكتروني: </strong>{targetUser.email}</div>
                        </>
                      )}
                      <div>
                        <strong>كلمة السر الحالية: </strong>
                        <span style={{ color: isDemoMode ? 'var(--secondary)' : 'var(--text-muted)', fontWeight: 'bold' }}>
                          {isDemoMode ? 'password123' : '******** (مشفرة آمنياً في سوبابيس)'}
                        </span>
                      </div>
                    </div>

                    {isPending && (
                      <div style={{ 
                        borderTop: '1px solid var(--border)', 
                        paddingTop: 14, 
                        display: 'flex', 
                        gap: 12, 
                        alignItems: 'center', 
                        flexWrap: 'wrap' 
                      }}>
                        {targetUser ? (
                          <>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1, minWidth: 240 }}>
                              <label style={{ fontSize: '0.85rem', fontWeight: 'bold', whiteSpace: 'nowrap' }}>كلمة السر الجديدة:</label>
                              <input 
                                type="text" 
                                placeholder="اكتب كلمة السر الجديدة هنا..."
                                value={newPasswordsMap[req.id] || ''}
                                onChange={e => setNewPasswordsMap(prev => ({ ...prev, [req.id]: e.target.value }))}
                                className="form-input"
                                style={{ flex: 1, padding: '7px 10px', fontSize: '0.85rem' }}
                              />
                            </div>

                            <div style={{ display: 'flex', gap: 8 }}>
                              <button
                                onClick={() => handleUpdatePasswordAndResolve(req.id, targetUser.id, newPasswordsMap[req.id])}
                                className="btn btn-primary"
                                style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 'bold', cursor: 'pointer' }}
                              >
                                تحديث كلمة السر وحل الطلب
                              </button>
                              <button
                                onClick={() => handleRejectResetRequest(req.id)}
                                className="btn btn-secondary"
                                style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 'bold', color: 'var(--danger)', borderColor: 'var(--danger)', cursor: 'pointer' }}
                              >
                                رفض الطلب
                              </button>
                            </div>
                          </>
                        ) : (
                          <span style={{ fontSize: '0.82rem', color: 'var(--danger)', fontWeight: 'bold' }}>
                            ⚠️ تنبيه: لم يتم العثور على حساب مسجل برقم الهاتف هذا في قاعدة البيانات لتعديل كلمة مروره.
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}


      {/* ══════════════════════════════════════════
          ADMIN — BROKER ACCOUNTS TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'broker_accounts' && (() => {
        const brokers = allUsers.filter(u => u.role === 'broker');
        const pendingWithdrawals = withdrawRequests.filter(w => w.status === 'pending');

        const getWithdrawalStatusCfg = (status) => {
          const map = {
            pending:  { label: 'قيد المراجعة',         color: '#d97706', bg: 'rgba(217,119,6,0.12)',   border: 'rgba(217,119,6,0.3)' },
            approved: { label: 'مقبول — بانتظار التحويل', color: '#2563eb', bg: 'rgba(37,99,235,0.12)',  border: 'rgba(37,99,235,0.3)' },
            paid:     { label: 'تم الدفع ✅',           color: '#059669', bg: 'rgba(5,150,105,0.12)',   border: 'rgba(5,150,105,0.3)' },
            rejected: { label: 'مرفوض ❌',             color: '#ef4444', bg: 'rgba(239,68,68,0.12)',    border: 'rgba(239,68,68,0.3)' },
          };
          return map[status] || map.pending;
        };

        const getWalletLabel = (type) => ({
          vodafone_cash: '📱 فودافون كاش',
          etisalat_cash: '📱 اتصالات كاش',
          orange_cash:   '📱 أورنج كاش',
          instapay:      '💳 إنستاباي',
        }[type] || type);

        return (
          <div>
            <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>💼 حسابات السماسرة والمحافظ المالية</h2>
            <p style={{ color: 'var(--text-secondary)', marginBottom: 28, fontSize: '0.9rem' }}>
              إدارة رصيد السماسرة وطلبات السحب من هذا القسم.
            </p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.4fr', gap: 24, marginBottom: 36 }}>

              {/* ── Forms container (Left column) ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                {/* ── Deposit form ── */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <Wallet size={18} style={{ color: 'var(--primary)' }} /> إضافة رصيد لسمسار
                  </h3>
                  {depositSuccess && (
                    <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontWeight: 700, fontSize: '0.88rem' }}>
                      {depositSuccess}
                    </div>
                  )}
                  {depositError && (
                    <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontWeight: 700, fontSize: '0.88rem' }}>
                      {depositError}
                    </div>
                  )}
                  <form onSubmit={handleDepositSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>رقم هاتف السمسار *</label>
                      <input
                        type="text"
                        placeholder="مثال: 01040122363"
                        value={depositForm.phone}
                        onChange={e => setDepositForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="form-input"
                        style={{ padding: '9px 12px', direction: 'ltr' }}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>المبلغ المراد إضافته (ج.م) *</label>
                      <input
                        type="number"
                        placeholder="مثال: 500"
                        value={depositForm.amount}
                        onChange={e => setDepositForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="form-input"
                        style={{ padding: '9px 12px' }}
                        min="1"
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-primary"
                      style={{ padding: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      disabled={depositLoading}
                    >
                      <Wallet size={16} />
                      {depositLoading ? 'جاري الإيداع...' : 'إضافة الرصيد فوراً'}
                    </button>
                  </form>
                </div>

                {/* ── Deduct form ── */}
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)', display: 'flex', flexDirection: 'column', gap: 16 }}>
                  <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                    <XCircle size={18} style={{ color: 'var(--danger)' }} /> خصم رصيد من سمسار
                  </h3>
                  {deductSuccess && (
                    <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontWeight: 700, fontSize: '0.88rem' }}>
                      {deductSuccess}
                    </div>
                  )}
                  {deductError && (
                    <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontWeight: 700, fontSize: '0.88rem' }}>
                      {deductError}
                    </div>
                  )}
                  <form onSubmit={handleDeductSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>رقم هاتف السمسار *</label>
                      <input
                        type="text"
                        placeholder="مثال: 01040122363"
                        value={deductForm.phone}
                        onChange={e => setDeductForm(prev => ({ ...prev, phone: e.target.value }))}
                        className="form-input"
                        style={{ padding: '9px 12px', direction: 'ltr' }}
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>المبلغ المراد خصمه (ج.م) *</label>
                      <input
                        type="number"
                        placeholder="مثال: 100"
                        value={deductForm.amount}
                        onChange={e => setDeductForm(prev => ({ ...prev, amount: e.target.value }))}
                        className="form-input"
                        style={{ padding: '9px 12px' }}
                        min="1"
                        required
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label style={{ fontWeight: 700, fontSize: '0.88rem' }}>سبب الخصم والتفاصيل *</label>
                      <input
                        type="text"
                        placeholder="مثال: تسوية رسوم تسويق أو غرامة مخالفة..."
                        value={deductForm.reason}
                        onChange={e => setDeductForm(prev => ({ ...prev, reason: e.target.value }))}
                        className="form-input"
                        style={{ padding: '9px 12px' }}
                        required
                      />
                    </div>
                    <button
                      type="submit"
                      className="btn btn-danger"
                      style={{ padding: '10px', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: 'var(--danger)', border: 'none', color: '#fff' }}
                      disabled={deductLoading}
                    >
                      <XCircle size={16} />
                      {deductLoading ? 'جاري الخصم...' : 'خصم الرصيد الآن'}
                    </button>
                  </form>
                </div>
              </div>

              {/* ── Brokers balance list ── */}
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', padding: 24, boxShadow: 'var(--shadow-sm)' }}>
                <h3 style={{ margin: '0 0 16px', fontWeight: 800, fontSize: '1rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Users size={18} style={{ color: 'var(--primary)' }} /> أرصدة السماسرة ({brokers.length})
                </h3>
                {brokers.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)' }}>
                    <Users size={32} style={{ marginBottom: 10 }} />
                    <p style={{ fontSize: '0.9rem' }}>لا يوجد سماسرة مسجلون حتى الآن.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 10, maxHeight: 320, overflowY: 'auto' }}>
                    {brokers.map(broker => (
                      <div key={broker.id} style={{
                        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12,
                        padding: '12px 16px', borderRadius: 'var(--radius-md)',
                        border: '1px solid var(--border)', background: 'var(--background)'
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 38, height: 38, borderRadius: '50%', flexShrink: 0,
                            background: 'var(--primary-light)', color: 'var(--primary)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '1rem'
                          }}>
                            {broker.full_name?.[0] || '؟'}
                          </div>
                          <div>
                            <div style={{ fontWeight: 700, fontSize: '0.9rem' }}>{broker.full_name}</div>
                            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                              <a href={`tel:${broker.phone}`} style={{ color: 'inherit', textDecoration: 'none' }}>{broker.phone}</a>
                            </div>
                          </div>
                        </div>
                        <div style={{ textAlign: 'center', flexShrink: 0 }}>
                          <div style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--primary)' }}>
                            {(broker.balance || 0).toLocaleString('ar-EG', { minimumFractionDigits: 2 })}
                          </div>
                          <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', fontWeight: 600 }}>ج.م رصيد</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* ── Withdrawal requests ── */}
            <div>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <ArrowDownCircle size={20} style={{ color: 'var(--secondary)' }} />
                طلبات السحب ({withdrawRequests.length})
                {pendingWithdrawals.length > 0 && (
                  <span style={{
                    background: '#ef4444', color: '#fff', borderRadius: '50%',
                    width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.72rem', fontWeight: 900
                  }}>{pendingWithdrawals.length}</span>
                )}
              </h3>

              {withdrawRequests.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '50px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                  <Wallet size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                  <p>لا توجد طلبات سحب حتى الآن.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {withdrawRequests.map(req => {
                    const cfg = getWithdrawalStatusCfg(req.status);
                    return (
                      <div key={req.id} style={{
                        background: 'var(--surface)',
                        border: '1px solid var(--border)',
                        borderRadius: 'var(--radius-lg)',
                        padding: 20,
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 14
                      }}>
                        {/* Header */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                            <div style={{
                              width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                              background: 'rgba(217,119,6,0.12)', color: '#d97706',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontWeight: 800, fontSize: '1.1rem'
                            }}>
                              {(req.broker_name || '؟')[0]}
                            </div>
                            <div>
                              <div style={{ fontWeight: 800, fontSize: '1rem' }}>{req.broker_name || 'سمسار غير معروف'}</div>
                              <a href={`tel:${req.broker_phone}`} style={{ fontSize: '0.82rem', color: 'var(--primary)', textDecoration: 'none', fontWeight: 600 }}>
                                {req.broker_phone}
                              </a>
                            </div>
                          </div>
                          <span style={{
                            padding: '4px 14px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 800,
                            color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`
                          }}>{cfg.label}</span>
                        </div>

                        {/* Details */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 24px', fontSize: '0.88rem', color: 'var(--text-secondary)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontWeight: 800, color: 'var(--text-primary)', fontSize: '1.1rem' }}>
                            💰 {req.amount?.toLocaleString('ar-EG')} ج.م
                          </span>
                          <span>
                            {getWalletLabel(req.wallet_type)}: <strong style={{ direction: 'ltr', display: 'inline-block', color: 'var(--text-primary)' }}>{req.wallet_number}</strong>
                          </span>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                            {formatDate(req.created_at)}
                          </span>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
                          <span style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-muted)' }}>تغيير الحالة:</span>
                          {req.status === 'paid' || req.status === 'rejected' ? (
                            <span style={{
                              fontSize: '0.85rem',
                              fontWeight: 800,
                              color: req.status === 'paid' ? '#059669' : '#ef4444',
                              backgroundColor: req.status === 'paid' ? 'rgba(5,150,105,0.08)' : 'rgba(239,68,68,0.08)',
                              padding: '5px 12px',
                              borderRadius: 'var(--radius-sm)',
                              border: req.status === 'paid' ? '1px solid rgba(5,150,105,0.2)' : '1px solid rgba(239,68,68,0.2)',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: 6
                            }}>
                              🔒 {req.status === 'paid' ? 'تم الدفع والتحويل بنجاح (طلب مغلق)' : 'تم رفض الطلب وإعادة المبلغ للمحفظة (طلب مغلق)'}
                            </span>
                          ) : (
                            [
                              { key: 'pending',  label: 'قيد المراجعة' },
                              { key: 'approved', label: 'مقبول' },
                              { key: 'paid',     label: 'تم الدفع ✅' },
                              { key: 'rejected', label: 'مرفوض ❌' },
                            ].map(opt => {
                              const optCfg = getWithdrawalStatusCfg(opt.key);
                              const isActive = req.status === opt.key;
                              return (
                                <button
                                  key={opt.key}
                                  onClick={() => handleWithdrawalStatusChange(req.id, opt.key)}
                                  disabled={isActive}
                                  style={{
                                    padding: '6px 14px',
                                    borderRadius: 'var(--radius-sm)',
                                    border: `1px solid ${optCfg.color}`,
                                    backgroundColor: isActive ? optCfg.bg : 'transparent',
                                    color: optCfg.color,
                                    fontFamily: 'inherit',
                                    fontSize: '0.8rem',
                                    fontWeight: 700,
                                    cursor: isActive ? 'default' : 'pointer',
                                    opacity: isActive ? 1 : 0.75,
                                    transition: 'var(--transition)',
                                    display: 'flex', alignItems: 'center', gap: 4
                                  }}
                                >
                                  {isActive && <Check size={11} />}
                                  {opt.label}
                                </button>
                              );
                            })
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* ── Financial Transactions Ledger ── */}
            <div style={{
              background: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)',
              padding: 24,
              boxShadow: 'var(--shadow-sm)',
              marginTop: 28
            }}>
              <h3 style={{ fontWeight: 800, fontSize: '1.1rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
                <Sparkles size={20} style={{ color: 'var(--primary)' }} />
                سجل العمليات المالية الشامل ({walletTransactions.length})
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
                مرجع حسابات كامل لجميع عمليات الشحن والسحب وخصومات الترويج الخاصة بالسماسرة.
              </p>

              {walletTransactions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                  <ClipboardList size={36} style={{ color: 'var(--text-muted)', marginBottom: 10, opacity: 0.6 }} />
                  <p>لا توجد عمليات مالية مسجلة بعد.</p>
                </div>
              ) : (
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'right', fontSize: '0.9rem' }}>
                    <thead>
                      <tr style={{ borderBottom: '2px solid var(--border)', color: 'var(--text-secondary)' }}>
                        <th style={{ padding: '12px 10px', fontWeight: 800 }}>التاريخ والوقت</th>
                        <th style={{ padding: '12px 10px', fontWeight: 800 }}>السمسار</th>
                        <th style={{ padding: '12px 10px', fontWeight: 800 }}>نوع العملية</th>
                        <th style={{ padding: '12px 10px', fontWeight: 800 }}>السبب والتفاصيل</th>
                        <th style={{ padding: '12px 10px', fontWeight: 800, textAlign: 'left' }}>المبلغ</th>
                      </tr>
                    </thead>
                    <tbody>
                      {walletTransactions.map(tx => {
                        const isCredit = tx.amount > 0; // Deposit or refund
                        const typeLabel = {
                          deposit: '📥 إيداع / شحن',
                          withdrawal: '📤 سحب رصيد',
                          withdrawal_refund: '🔄 إرجاع سحب مرفوض',
                          featured_deduction: '🚀 ترويج عقار مميز',
                          admin_deduction: '⚠️ خصم يدوي من الإدارة'
                        }[tx.type] || tx.type;

                        const typeColor = {
                          deposit: '#059669',
                          withdrawal: '#ef4444',
                          withdrawal_refund: '#2563eb',
                          featured_deduction: '#d97706',
                          admin_deduction: '#9333ea'
                        }[tx.type] || 'var(--text-primary)';

                        const typeBg = {
                          deposit: 'rgba(5,150,105,0.08)',
                          withdrawal: 'rgba(239,68,68,0.08)',
                          withdrawal_refund: 'rgba(37,99,235,0.08)',
                          featured_deduction: 'rgba(217,119,6,0.08)',
                          admin_deduction: 'rgba(147,51,234,0.08)'
                        }[tx.type] || 'var(--border)';

                        return (
                          <tr key={tx.id} style={{ borderBottom: '1px solid var(--border)', transition: 'var(--transition)' }}>
                            <td style={{ padding: '14px 10px', color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap' }}>
                              {formatDate(tx.created_at)}
                            </td>
                            <td style={{ padding: '14px 10px' }}>
                              <div style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{tx.broker_name || 'سمسار غير معروف'}</div>
                              {tx.broker_phone && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{tx.broker_phone}</div>}
                            </td>
                            <td style={{ padding: '14px 10px' }}>
                              <span style={{
                                padding: '3px 10px', borderRadius: 4, fontSize: '0.78rem', fontWeight: 700,
                                color: typeColor, backgroundColor: typeBg, whiteSpace: 'nowrap'
                              }}>
                                {typeLabel}
                              </span>
                            </td>
                            <td style={{ padding: '14px 10px', color: 'var(--text-secondary)', maxWidth: 280, lineHeight: 1.5 }}>
                              {tx.description}
                            </td>
                            <td style={{
                              padding: '14px 10px',
                              textAlign: 'left',
                              fontWeight: 900,
                              fontSize: '1rem',
                              color: isCredit ? '#059669' : '#ef4444',
                              direction: 'ltr'
                            }}>
                              {isCredit ? '+' : ''}{tx.amount?.toLocaleString('ar-EG')} ج.م
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        );
      })()}

      {/* ══════════════════════════════════════════
          ADMIN — BROKER VERIFICATIONS TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'broker_verifications' && (
        <div className={styles.panel}>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>🛡️ مراجعة طلبات توثيق السماسرة</h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            قم بمراجعة المستندات والبيانات المرسلة من السماسرة لتوثيق حساباتهم وتفعيل إمكانية رفع الشقق لديهم.
          </p>

          {verificationRequests.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <ShieldCheck size={48} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
              <p style={{ fontWeight: 700, fontSize: '1rem' }}>لا توجد طلبات توثيق حتى الآن</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {verificationRequests.map(req => {
                const isPending = req.status === 'pending';
                const isApproved = req.status === 'approved';
                const isRejected = req.status === 'rejected';

                return (
                  <div 
                    key={req.id} 
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-md)',
                      padding: 20,
                      boxShadow: 'var(--shadow-sm)'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
                      <div>
                        <span style={{ fontWeight: 800, fontSize: '1.05rem', color: 'var(--text-primary)', fontFamily: 'var(--font-family)' }}>{req.full_name || 'سمسار غير معروف'}</span>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginRight: 12 }}>{formatDate(req.created_at)}</span>
                      </div>
                      <span style={{
                        padding: '4px 12px', borderRadius: 20, fontSize: '0.8rem', fontWeight: 800,
                        backgroundColor: isPending ? 'rgba(217,119,6,0.12)' : isApproved ? 'rgba(5,150,105,0.12)' : 'rgba(239,68,68,0.12)',
                        color: isPending ? '#d97706' : isApproved ? '#059669' : '#ef4444',
                        border: '1px solid'
                      }}>
                        {isPending ? '⏳ قيد المراجعة' : isApproved ? '✅ موثّق ومقبول' : '❌ مرفوض'}
                      </span>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: '0.9rem', color: 'var(--text-secondary)' }}>
                        <div>
                          <strong>رقم الهاتف: </strong>
                          <a href={`tel:${req.phone}`} style={{ color: 'var(--primary)', fontWeight: 'bold' }}>{req.phone}</a>
                        </div>
                        <div>
                          <strong>معرف الحساب: </strong>
                          <span style={{ fontFamily: 'monospace' }}>{req.broker_id}</span>
                        </div>
                      </div>

                      {req.notes && (
                        <div style={{ background: 'var(--background)', padding: 12, borderRadius: 'var(--radius-sm)', fontSize: '0.9rem', color: 'var(--text-primary)', border: '1px solid var(--border)' }}>
                          <strong>ملاحظات ونبذة عن السمسار: </strong>
                          <p style={{ margin: '6px 0 0', lineHeight: 1.6 }}>{req.notes}</p>
                        </div>
                      )}

                      {req.document_image && (
                        <div style={{ marginTop: 8 }}>
                          <strong style={{ display: 'block', marginBottom: 8, fontSize: '0.9rem' }}>المستند المرفق:</strong>
                          <img 
                            src={req.document_image} 
                            alt="مستند التوثيق" 
                            style={{ maxWidth: '100%', maxHeight: 300, objectFit: 'contain', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} 
                          />
                        </div>
                      )}

                      {isRejected && req.rejection_reason && (
                        <div style={{ background: 'rgba(239,68,68,0.06)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', borderRadius: 'var(--radius-sm)', padding: '10px 14px', fontSize: '0.88rem', fontWeight: 600 }}>
                          سبب الرفض: {req.rejection_reason}
                        </div>
                      )}

                      {isPending && (
                        <div style={{ 
                          borderTop: '1px solid var(--border)', 
                          paddingTop: 16, 
                          marginTop: 8,
                          display: 'flex', 
                          gap: 12, 
                          alignItems: 'center', 
                          flexWrap: 'wrap' 
                        }}>
                          {verifRejectingId === req.id ? (
                            <div style={{ display: 'flex', gap: 8, flex: 1, minWidth: 280, alignItems: 'center' }}>
                              <input 
                                type="text" 
                                placeholder="اكتب سبب الرفض هنا ليتم إرساله للسمسار..."
                                value={verifRejectReason}
                                onChange={e => setVerifRejectReason(e.target.value)}
                                className="form-input"
                                style={{ flex: 1, padding: '8px 12px', fontSize: '0.85rem' }}
                                required
                              />
                              <button
                                onClick={() => handleRejectBrokerVerification(req.id, req.broker_id)}
                                className="btn btn-danger"
                                style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 'bold' }}
                              >
                                تأكيد الرفض
                              </button>
                              <button
                                onClick={() => { setVerifRejectingId(null); setVerifRejectReason(''); }}
                                className="btn btn-secondary"
                                style={{ padding: '8px 16px', fontSize: '0.82rem', fontWeight: 'bold' }}
                              >
                                إلغاء
                              </button>
                            </div>
                          ) : (
                            <div style={{ display: 'flex', gap: 10 }}>
                              <button
                                onClick={() => handleApproveBrokerVerification(req.id, req.broker_id)}
                                className="btn btn-primary"
                                style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 6 }}
                              >
                                <ShieldCheck size={14} style={{ marginLeft: 4 }} /> الموافقة والتوثيق
                              </button>
                              <button
                                onClick={() => { setVerifRejectingId(req.id); setVerifRejectReason(''); }}
                                className="btn btn-secondary"
                                style={{ padding: '8px 18px', fontSize: '0.85rem', fontWeight: 'bold', color: 'var(--danger)', borderColor: 'var(--danger)' }}
                              >
                                ❌ رفض الطلب
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          LANDLORD/BROKER — PENDING REVIEW PROPERTIES
      ══════════════════════════════════════════ */}
      {!isAdmin && activeTab === 'pending_properties' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>⏳ الشقق تحت المراجعة ({pendingProperties.length})</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
            هذه الشقق في انتظار مراجعة وموافقة فريق سكني. ستحصل على إشعار بمجرد قبولها أو رفضها.
          </p>
          {pendingProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <CheckCircle2 size={40} style={{ color: '#059669', marginBottom: 10 }} />
              <p>لا توجد شقق في انتظار المراجعة حالياً.</p>
              <button onClick={() => setActiveTab('add')} className="btn btn-primary" style={{ marginTop: 12 }}>
                <PlusCircle size={16} /> أضف شقة جديدة
              </button>
            </div>
          ) : (
            <div className={styles.listingsList}>
              {pendingProperties.map(p => renderOwnerPropertyCard(p))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          LANDLORD/BROKER — APPROVED PROPERTIES
      ══════════════════════════════════════════ */}
      {!isAdmin && activeTab === 'approved_properties' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>✅ الشقق المعتمدة والمعروضة ({approvedProperties.length})</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
            هذه الشقق وافق عليها فريق سكني وهي الآن ظاهرة للطلاب.
          </p>
          {approvedProperties.length === 0 ? (
            <div style={{ textAlign: 'center', padding: 40, border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
              <Home size={40} style={{ color: 'var(--text-muted)', marginBottom: 10 }} />
              <p>لا توجد شقق معتمدة بعد.</p>
            </div>
          ) : (
            <div className={styles.listingsList}>
              {approvedProperties.map(p => renderOwnerPropertyCard(p))}
            </div>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          LANDLORD/BROKER — REJECTED PROPERTIES
      ══════════════════════════════════════════ */}
      {!isAdmin && activeTab === 'rejected_properties' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8, color: '#ef4444' }}>❌ الشقق المرفوضة ({rejectedProperties.length})</h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 20 }}>
            راجع أسباب الرفض، وأعد تقديم الشقة بعد تصحيح المشكلة.
          </p>
          <div className={styles.listingsList}>
            {rejectedProperties.map(p => renderOwnerPropertyCard(p))}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          ADD PROPERTY FORM (landlord/broker)
      ══════════════════════════════════════════ */}
      {!isAdmin && activeTab === 'add' && (
        <div className={styles.panel}>
          {isBroker && !user?.is_broker_verified && brokerVerificationStatus?.status !== 'approved' ? (
            <div>
              <h2 className={styles.panelTitle}>🛡️ توثيق حساب السمسار</h2>
              <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.92rem' }}>
                عذراً، يجب عليك توثيق حسابك كسمسار أولاً في المنصة لتتمكن من إضافة وإدارة شقق سكنية للطلاب.
              </p>

              {verifFormSuccess && (
                <div style={{ background: 'rgba(5,150,105,0.12)', border: '1px solid var(--primary)', color: 'var(--primary)', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontWeight: 700 }}>
                  {verifFormSuccess}
                </div>
              )}
              {verifFormError && (
                <div style={{ background: 'rgba(239,68,68,0.12)', border: '1px solid #ef4444', color: '#ef4444', borderRadius: 'var(--radius-md)', padding: '12px 16px', marginBottom: 20, fontWeight: 700 }}>
                  {verifFormError}
                </div>
              )}

              {/* Status banner */}
              {brokerVerificationStatus ? (
                <div style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-lg)',
                  padding: 24,
                  boxShadow: 'var(--shadow-sm)',
                  marginBottom: 24,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 16
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 10 }}>
                    <h3 style={{ margin: 0, fontWeight: 800, fontSize: '1.05rem', display: 'flex', alignItems: 'center', gap: 8 }}>
                      <HourglassIcon size={20} style={{ color: 'var(--secondary)' }} /> حالة طلب التوثيق الحالي
                    </h3>
                    <span style={{
                      padding: '4px 14px', borderRadius: 9999, fontSize: '0.82rem', fontWeight: 800,
                      backgroundColor: brokerVerificationStatus.status === 'pending' ? 'rgba(217,119,6,0.12)' : brokerVerificationStatus.status === 'approved' ? 'rgba(5,150,105,0.12)' : 'rgba(239,68,68,0.12)',
                      color: brokerVerificationStatus.status === 'pending' ? '#d97706' : brokerVerificationStatus.status === 'approved' ? '#059669' : '#ef4444',
                      border: '1px solid'
                    }}>
                      {brokerVerificationStatus.status === 'pending' ? '⏳ قيد المراجعة والتدقيق' : brokerVerificationStatus.status === 'approved' ? '✅ مقبول وموثّق' : '❌ مرفوض'}
                    </span>
                  </div>

                  <div style={{ fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <div><strong>تاريخ تقديم الطلب:</strong> {formatDate(brokerVerificationStatus.created_at)}</div>
                    {brokerVerificationStatus.notes && <div style={{ marginTop: 8 }}><strong>ملاحظاتك:</strong> {brokerVerificationStatus.notes}</div>}
                    {brokerVerificationStatus.status === 'rejected' && brokerVerificationStatus.rejection_reason && (
                      <div style={{
                        marginTop: 14,
                        background: 'rgba(239,68,68,0.06)',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444',
                        padding: '12px 16px',
                        borderRadius: 'var(--radius-sm)',
                        fontWeight: 700
                      }}>
                        سبب الرفض من الإدارة: {brokerVerificationStatus.rejection_reason}
                      </div>
                    )}
                  </div>

                  {brokerVerificationStatus.status === 'rejected' && (
                    <button
                      onClick={() => setBrokerVerificationStatus(null)}
                      className="btn btn-primary"
                      style={{ marginTop: 8, padding: '10px 18px', fontWeight: 800, alignSelf: 'flex-start' }}
                    >
                      تقديم طلب توثيق جديد
                    </button>
                  )}
                </div>
              ) : (
                /* Submit verification form */
                <div className={styles.formCard} style={{ maxWidth: 650 }}>
                  <form onSubmit={handleBrokerVerificationSubmit} className={styles.form}>
                    <div className={styles.formGroup}>
                      <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>الاسم بالكامل *</label>
                      <input 
                        type="text" 
                        value={user?.full_name || ''} 
                        disabled 
                        className="form-input" 
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--background)' }} 
                      />
                    </div>
                    <div className={styles.formGroup}>
                      <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>رقم الهاتف المحمول *</label>
                      <input 
                        type="text" 
                        value={user?.phone || ''} 
                        disabled 
                        className="form-input" 
                        style={{ width: '100%', padding: '10px 12px', background: 'var(--background)' }} 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>نبذة تعريفية وملاحظات التوثيق *</label>
                      <textarea 
                        placeholder="مثال: أعمل كسمسار عقارات في حي الجامعة منذ 3 سنوات، ولدي رخصة تسويق عقاري/مكتب..."
                        value={verificationForm.notes} 
                        onChange={e => setVerificationForm(prev => ({ ...prev, notes: e.target.value }))}
                        className="form-input" 
                        rows={4} 
                        style={{ width: '100%', padding: '10px 12px', resize: 'vertical' }}
                        required 
                      />
                    </div>

                    <div className={styles.formGroup}>
                      <label className="label" style={{ fontWeight: 'bold', display: 'block', marginBottom: 8 }}>إثبات الشخصية أو مستند العمل (صورة بطاقة، رخصة مكتب...) *</label>
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={async (e) => {
                          const file = e.target.files[0];
                          if (file) {
                            try {
                              const compressed = await compressImage(file);
                              setVerificationForm(prev => ({ ...prev, documentImage: compressed }));
                            } catch {
                              setVerifFormError('فشل ضغط ومعالجة الصورة.');
                            }
                          }
                        }} 
                        className="form-input" 
                        style={{ width: '100%', padding: '8px', cursor: 'pointer' }}
                        required 
                      />
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                        💡 ارفع صورة واضحة لبطاقة الهوية أو مستند يثبت عملك كسمسار.
                      </span>

                      {verificationForm.documentImage && (
                        <div style={{ marginTop: 12 }}>
                          <img 
                            src={verificationForm.documentImage} 
                            alt="معاينة المستند" 
                            style={{ maxWidth: 120, maxHeight: 120, objectFit: 'cover', borderRadius: 'var(--radius-md)', border: '1px solid var(--border)' }} 
                          />
                        </div>
                      )}
                    </div>

                    <button 
                      type="submit" 
                      className="btn btn-primary" 
                      style={{ padding: 14, width: '100%', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }} 
                      disabled={verifSubmitLoading}
                    >
                      {verifSubmitLoading ? 'جاري إرسال طلب التوثيق...' : 'إرسال طلب التوثيق للمراجعة 🚀'}
                    </button>
                  </form>
                </div>
              )}
            </div>
          ) : (
            <>
              <h2 className={styles.panelTitle}>أضف شقة أو غرفة جديدة</h2>
          <div style={{ background: '#fef3c7', border: '1px solid #fbbf24', borderRadius: 'var(--radius-md)', padding: '10px 14px', marginBottom: 20, fontSize: '0.88rem', color: '#92400e', display: 'flex', alignItems: 'center', gap: 8 }}>
            <Clock size={16} /> <strong>ملاحظة:</strong> ستتم مراجعة شقتك من قِبَل فريق سكني قبل عرضها للطلاب.
          </div>

          <div className={styles.formCard}>
            {/* ⛔ Forbidden content warning */}
            <div style={{
              background: 'linear-gradient(135deg, #fef2f2, #fff1f0)',
              border: '1.5px solid #fca5a5',
              borderRight: '5px solid #ef4444',
              borderRadius: 'var(--radius-md)',
              padding: '14px 18px',
              marginBottom: 22,
              display: 'flex',
              gap: 12,
              alignItems: 'flex-start'
            }}>
              <span style={{ fontSize: '1.4rem', flexShrink: 0 }}>⛔</span>
              <div>
                <div style={{ fontWeight: 800, color: '#b91c1c', marginBottom: 6, fontSize: '0.95rem' }}>
                  محظور تماماً — سيؤدي لرفض إعلانك فوراً
                </div>
                <ul style={{ margin: 0, paddingRight: 18, color: '#7f1d1d', fontSize: '0.88rem', lineHeight: 2 }}>
                  <li>كتابة عنوان الشقة التفصيلي أو اسم الشارع في العنوان أو الوصف</li>
                  <li>وضع رقم هاتفك أو أي رقم تواصل داخل الوصف أو على الصور</li>
                  <li>الكتابة على الصور (watermark) بأي بيانات شخصية أو عنوان</li>
                  <li>ذكر اسم مالك أو وسيط أو صفحة على السوشيال ميديا</li>
                </ul>
                <div style={{ marginTop: 8, fontSize: '0.83rem', color: '#991b1b', fontWeight: 600 }}>
                  📌 العنوان التفصيلي للشقة يُكتب فقط في حقل &quot;العنوان الخاص&quot; المخصص له — ولن يُكشف للطلاب أبداً.
                </div>
              </div>
            </div>
            <form onSubmit={handleAddListing} className={styles.form}>
              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold' }}>عنوان الإعلان *</label>
                <input type="text" name="title" value={formData.title} onChange={handleInputChange}
                  placeholder="مثال: شقة طالبات 3 غرف بجوار الجامعة" className="form-input" required />
              </div>

              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold' }}>وصف تفصيلي *</label>
                <textarea name="description" value={formData.description} onChange={handleInputChange}
                  placeholder="اكتب تفاصيل الشقة: الأجهزة، نوع التشطيب، الخدمات والمرافق..." className="form-input" rows={4} required />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontWeight: 'bold' }}>الإيجار الشهري (ج.م) *</label>
                  <input type="number" name="price" value={formData.price} onChange={handleInputChange}
                    placeholder="3000" className="form-input" min={1} required />
                </div>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontWeight: 'bold' }}>الطابق / الدور *</label>
                  <input type="number" name="floor" value={formData.floor} onChange={handleInputChange}
                    placeholder="مثال: 3" className="form-input" min={0} required />
                </div>
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontWeight: 'bold' }}>المنطقة (المنصورة) *</label>
                  <select name="location" value={formData.location} onChange={handleInputChange} className="form-input">
                    {MANSOURA_DISTRICTS.map(l => <option key={l} value={l}>{l}</option>)}
                  </select>
                </div>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontWeight: 'bold' }}>نوع السكن *</label>
                  <select name="gender_type" value={formData.gender_type} onChange={handleInputChange} className="form-input">
                    <option value="any">مشترك / عائلات</option>
                    <option value="male">طلاب (ذكور)</option>
                    <option value="female">طالبات (إناث)</option>
                  </select>
                </div>
              </div>

              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold' }}>العنوان التفصيلي * (خاص — لا يظهر للطلاب)</label>
                <input type="text" name="address" value={formData.address} onChange={handleInputChange}
                  placeholder="مثال: شارع جيهان، خلف صيدلية الطراوي، عمارة الأمل، الدور الثالث، شقة 5" className="form-input" required />
              </div>

              <div className={styles.formRow}>
                <div className={styles.formGroup}>
                  <label className="label" style={{ fontWeight: 'bold' }}>نوع الإيجار *</label>
                  <select name="rent_type" value={formData.rent_type || 'apartment'} onChange={handleInputChange} className="form-input">
                    <option value="apartment">🏢 شقة كاملة</option>
                    <option value="bed">🛌 تأجير بالسرير</option>
                  </select>
                </div>
              </div>

              {formData.rent_type === 'bed' ? (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="label" style={{ fontWeight: 'bold' }}>إجمالي عدد السراير في السكن *</label>
                    <input type="number" name="beds" value={formData.beds} onChange={handleInputChange} className="form-input" min={1} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label" style={{ fontWeight: 'bold' }}>عدد السراير المتاحة حالياً للإيجار *</label>
                    <input type="number" name="available_beds" value={formData.available_beds || '1'} onChange={handleInputChange} className="form-input" min={1} max={formData.beds} required />
                  </div>
                </div>
              ) : (
                <div className={styles.formRow}>
                  <div className={styles.formGroup}>
                    <label className="label" style={{ fontWeight: 'bold' }}>عدد الغرف *</label>
                    <input type="number" name="rooms" value={formData.rooms} onChange={handleInputChange} className="form-input" min={1} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label" style={{ fontWeight: 'bold' }}>عدد الحمامات *</label>
                    <input type="number" name="bathrooms" value={formData.bathrooms} onChange={handleInputChange} className="form-input" min={1} required />
                  </div>
                  <div className={styles.formGroup}>
                    <label className="label" style={{ fontWeight: 'bold' }}>عدد الأسرّة (السراير) *</label>
                    <input type="number" name="beds" value={formData.beds} onChange={handleInputChange} className="form-input" min={0} required />
                  </div>
                </div>
              )}

              {/* Amenities */}
              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold', marginBottom: 8, display: 'block' }}>المميزات والخدمات المتوفرة</label>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                  {[
                    { name: 'has_ac', label: 'تكييف' },
                    { name: 'has_internet', label: 'إنترنت WiFi' },
                    { name: 'has_elevator', label: 'مصعد (أسانسير)' }
                  ].map(({ name, label }) => (
                    <label key={name} style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: '0.9rem' }}>
                      <input type="checkbox" name={name} checked={formData[name]} onChange={handleInputChange}
                        style={{ width: 18, height: 18, accentColor: 'var(--primary)' }} />
                      <span>{label}</span>
                    </label>
                  ))}
                </div>
              </div>

              {/* Image upload */}
              <div className={styles.formGroup}>
                <label className="label" style={{ fontWeight: 'bold' }}>صور الشقة (ارفع من جهازك)</label>
                <input type="file" multiple accept="image/*" onChange={handleFileChange} className="form-input"
                  style={{ padding: '8px', cursor: 'pointer' }} disabled={compressing} />
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                  {compressing
                    ? '🔄 جاري ضغط الصور...'
                    : '💡 يمكنك رفع عدة صور معاً. سيتم ضغطها تلقائياً.'}
                </span>
                {images.length > 0 && (
                  <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginTop: 12 }}>
                    {images.map((img, idx) => (
                      <div key={idx} style={{ position: 'relative', width: 85, height: 85, borderRadius: 'var(--radius-md)', overflow: 'hidden', border: '1px solid var(--border)' }}>
                        <img src={img} alt="preview" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                        <button type="button" onClick={() => removeImage(idx)}
                          style={{ position: 'absolute', top: 2, left: 2, background: 'rgba(239,68,68,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: 22, height: 22, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '14px', fontWeight: 'bold' }}
                        >×</button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: 14, width: '100%' }} disabled={submitLoading || compressing}>
                <PlusCircle size={20} />
                <span>{submitLoading ? 'جاري الإرسال للمراجعة...' : 'إرسال للمراجعة والنشر'}</span>
              </button>
            </form>
          </div>
          </>
          )}
        </div>
      )}

      {/* ══════════════════════════════════════════
          ADMIN — FEATURED PROPERTIES TAB
      ══════════════════════════════════════════ */}
      {isAdmin && activeTab === 'featured_properties' && (
        <div>
          <h2 className={styles.panelTitle} style={{ marginBottom: 8 }}>
            ⭐ إدارة تمييز الشقق
          </h2>
          <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: '0.9rem' }}>
            إدارة طلبات تمييز الشقق المقدمة من الملاك والسماسرة، أو البحث عن شقة لتمييزها يدوياً.
          </p>

          {/* ── Incoming Featured Requests ── */}
          <div style={{ marginBottom: 40 }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Rocket size={20} style={{ color: '#d97706' }} />
              طلبات التمييز الواردة ({featuredRequests.length})
              {featuredRequests.filter(r => r.status === 'pending').length > 0 && (
                <span style={{
                  background: '#ef4444', color: '#fff', borderRadius: '50%',
                  width: 22, height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.72rem', fontWeight: 900
                }}>{featuredRequests.filter(r => r.status === 'pending').length}</span>
              )}
            </h3>

            {featuredRequests.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '50px 20px', border: '2px dashed var(--border)', borderRadius: 'var(--radius-lg)', color: 'var(--text-secondary)' }}>
                <Star size={40} style={{ color: 'var(--text-muted)', marginBottom: 12 }} />
                <p style={{ fontWeight: 700 }}>لا توجد طلبات تمييز حتى الآن.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {featuredRequests.map(req => {
                  const statusCfg = {
                    pending:  { label: '⏳ قيد المراجعة', color: '#d97706', bg: 'rgba(217,119,6,0.12)', border: 'rgba(217,119,6,0.3)' },
                    approved: { label: '✅ تمت الموافقة', color: '#059669', bg: 'rgba(5,150,105,0.12)', border: 'rgba(5,150,105,0.3)' },
                    rejected: { label: '❌ مرفوض', color: '#ef4444', bg: 'rgba(239,68,68,0.12)', border: 'rgba(239,68,68,0.3)' }
                  };
                  const cfg = statusCfg[req.status] || statusCfg.pending;
                  const propTitle = req.property_title || (allProperties.find(p => p.id === req.property_id)?.title) || 'شقة غير معروفة';
                  const requesterName = req.user_name || 'مستخدم غير معروف';
                  const requesterPhone = req.user_phone || '';

                  return (
                    <div key={req.id} style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: 'var(--radius-lg)',
                      padding: 20,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 12
                    }}>
                      {/* Header */}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: '50%', flexShrink: 0,
                            background: 'rgba(217,119,6,0.12)', color: '#d97706',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontWeight: 800, fontSize: '1.2rem'
                          }}>
                            ⭐
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '1rem' }}>{propTitle}</div>
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                              <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                                <User size={12} /> {requesterName}
                              </span>
                              {requesterPhone && (
                                <a href={`tel:${requesterPhone}`} style={{ color: 'var(--primary)', textDecoration: 'none', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                                  <Phone size={12} /> {requesterPhone}
                                </a>
                              )}
                            </div>
                          </div>
                        </div>
                        <span style={{
                          padding: '4px 14px', borderRadius: 9999, fontSize: '0.8rem', fontWeight: 800,
                          color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`
                        }}>{cfg.label}</span>
                      </div>

                      {/* Details */}
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 20px', fontSize: '0.88rem', color: 'var(--text-secondary)', paddingBottom: 12, borderBottom: '1px solid var(--border)' }}>
                        <span style={{ fontWeight: 800, color: 'var(--primary)', fontSize: '1rem' }}>
                          💰 100 ج.م (رسوم التمييز)
                        </span>
                        <span>طريقة الدفع: <strong>{req.payment_method === 'wallet' ? '💳 محفظة المنصة' : '📞 تواصل يدوي'}</strong></span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>
                          {new Date(req.created_at).toLocaleDateString('ar-EG', { day: 'numeric', month: 'long', year: 'numeric' })}
                        </span>
                      </div>

                      {/* Actions */}
                      {req.status === 'pending' && (
                        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                          <button
                            onClick={() => handleApprovePromo(req.id, req.property_id, req.user_id, req.payment_method)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: '#059669', color: '#fff', border: 'none',
                              borderRadius: 'var(--radius-sm)', padding: '8px 18px',
                              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            <CheckCircle2 size={16} /> موافقة وتفعيل التمييز
                          </button>
                          <button
                            onClick={() => handleRejectPromo(req.id, req.user_id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: 6,
                              background: 'transparent', color: '#ef4444', border: '1px solid #ef4444',
                              borderRadius: 'var(--radius-sm)', padding: '8px 18px',
                              fontFamily: 'inherit', fontWeight: 700, fontSize: '0.85rem',
                              cursor: 'pointer'
                            }}
                          >
                            <XCircle size={16} /> رفض الطلب
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Admin Manual Search & Feature ── */}
          <div style={{
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)',
            padding: 24,
            boxShadow: 'var(--shadow-sm)'
          }}>
            <h3 style={{ fontWeight: 800, fontSize: '1.05rem', marginBottom: 16, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Search size={20} style={{ color: 'var(--primary)' }} />
              بحث وتمييز يدوي للشقق
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', marginBottom: 16 }}>
              ابحث عن شقة بالاسم أو الموقع لتمييزها أو إلغاء تمييزها يدوياً.
            </p>

            <form onSubmit={handleAdminFeaturedSearch} style={{ display: 'flex', gap: 10, marginBottom: 20, flexWrap: 'wrap' }}>
              <input
                type="text"
                value={adminFeaturedSearchQuery}
                onChange={e => setAdminFeaturedSearchQuery(e.target.value)}
                placeholder="ابحث بالعنوان أو الموقع أو اسم الشقة..."
                className="form-input"
                style={{ flex: 1, minWidth: 220, padding: '10px 14px' }}
              />
              <button
                type="submit"
                className="btn btn-primary"
                style={{ padding: '10px 24px', display: 'flex', alignItems: 'center', gap: 8 }}
                disabled={adminSearchLoading}
              >
                <Search size={16} />
                {adminSearchLoading ? 'جاري البحث...' : 'بحث'}
              </button>
            </form>

            {adminFeaturedPropertiesResults.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {adminFeaturedPropertiesResults.map(property => (
                  <div key={property.id} style={{
                    display: 'flex', alignItems: 'center', gap: 14, flexWrap: 'wrap',
                    padding: '14px 18px', borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--border)', background: 'var(--background)'
                  }}>
                    {/* Thumbnail */}
                    <img
                      src={property.images?.[0]}
                      alt={property.title}
                      style={{ width: 60, height: 45, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
                    />

                    {/* Details */}
                    <div style={{ flex: 1, minWidth: 160 }}>
                      <div style={{ fontWeight: 700, fontSize: '0.92rem', marginBottom: 3 }}>{property.title}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}><MapPin size={11} />{property.location}</span>
                        <span style={{ fontWeight: 700, color: 'var(--primary)' }}>{property.price?.toLocaleString('ar-EG')} ج.م</span>
                      </div>
                    </div>

                    {/* Featured status + toggle */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
                      {property.is_featured && (
                        <span style={{
                          padding: '3px 10px', borderRadius: 20, fontSize: '0.75rem', fontWeight: 700,
                          color: '#d97706', background: 'rgba(217,119,6,0.12)',
                          display: 'flex', alignItems: 'center', gap: 4
                        }}>
                          ⭐ مميزة
                        </span>
                      )}
                      {property.review_status === 'approved' ? (
                        <button
                          onClick={() => handleToggleFeatured(property.id, !property.is_featured)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 6,
                            background: property.is_featured ? 'rgba(239,68,68,0.08)' : 'linear-gradient(135deg, #f59e0b, #d97706)',
                            color: property.is_featured ? '#ef4444' : '#fff',
                            border: property.is_featured ? '1px solid #ef4444' : 'none',
                            borderRadius: 'var(--radius-sm)', padding: '7px 14px',
                            fontFamily: 'inherit', fontWeight: 700, fontSize: '0.82rem',
                            cursor: 'pointer', whiteSpace: 'nowrap'
                          }}
                        >
                          <Sparkles size={14} />
                          {property.is_featured ? 'إلغاء التمييز' : 'تمييز الشقة ⭐'}
                        </button>
                      ) : (
                        <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                          ⚠️ غير معتمدة بعد
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {adminFeaturedSearchQuery && adminFeaturedPropertiesResults.length === 0 && !adminSearchLoading && (
              <div style={{ textAlign: 'center', padding: '30px 20px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                <Search size={32} style={{ marginBottom: 8, opacity: 0.4 }} />
                <p>لم يتم العثور على شقق تطابق بحثك.</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ══════════════════════════════════════════
          PROMOTION MODAL (Sell Faster)
      ══════════════════════════════════════════ */}
      {showPromotionModal && selectedPropertyForPromo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 1000, padding: 20
        }} onClick={() => setShowPromotionModal(false)}>
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--surface)',
              borderRadius: 'var(--radius-lg)',
              padding: '32px 28px',
              maxWidth: 520,
              width: '100%',
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 25px 60px rgba(0,0,0,0.3)',
              position: 'relative'
            }}
            dir="rtl"
          >
            {/* Close button */}
            <button
              onClick={() => setShowPromotionModal(false)}
              style={{
                position: 'absolute', top: 12, left: 12,
                background: 'none', border: 'none', fontSize: '1.5rem',
                cursor: 'pointer', color: 'var(--text-muted)', lineHeight: 1
              }}
            >✕</button>

            {/* Header */}
            <div style={{ textAlign: 'center', marginBottom: 24 }}>
              <div style={{
                width: 64, height: 64, borderRadius: '50%',
                background: 'linear-gradient(135deg, #fbbf24, #d97706)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 16px', fontSize: '1.8rem'
              }}>
                🚀
              </div>
              <h3 style={{ margin: 0, fontWeight: 900, fontSize: '1.2rem', marginBottom: 6 }}>
                بيع أسرع — تمييز الشقة
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', margin: 0 }}>
                ميّز شقتك لتظهر في قسم الشقق المميزة وتصل لعدد أكبر من الطلاب!
              </p>
            </div>

            {/* Property info */}
            <div style={{
              background: 'var(--background)',
              border: '1px solid var(--border)',
              borderRadius: 'var(--radius-md)',
              padding: '14px 16px',
              marginBottom: 20,
              display: 'flex', alignItems: 'center', gap: 12
            }}>
              <img
                src={selectedPropertyForPromo.images?.[0]}
                alt={selectedPropertyForPromo.title}
                style={{ width: 55, height: 42, objectFit: 'cover', borderRadius: 'var(--radius-sm)', flexShrink: 0 }}
              />
              <div>
                <div style={{ fontWeight: 700, fontSize: '0.92rem' }}>{selectedPropertyForPromo.title}</div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  {selectedPropertyForPromo.location} · {selectedPropertyForPromo.price?.toLocaleString('ar-EG')} ج.م
                </div>
              </div>
            </div>

            {/* Price box */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(217,119,6,0.08), rgba(251,191,36,0.08))',
              border: '1.5px solid rgba(217,119,6,0.25)',
              borderRadius: 'var(--radius-md)',
              padding: '16px 20px',
              marginBottom: 20,
              textAlign: 'center'
            }}>
              <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginBottom: 4 }}>رسوم التمييز (مرة واحدة)</div>
              <div style={{ fontSize: '1.8rem', fontWeight: 900, color: '#d97706' }}>100 <span style={{ fontSize: '0.9rem' }}>ج.م</span></div>
            </div>

            <form onSubmit={handlePromoSubmit}>
              {/* Payment method */}
              {isBroker && (
                <div style={{ marginBottom: 20 }}>
                  <label style={{ fontWeight: 800, fontSize: '0.9rem', display: 'block', marginBottom: 10 }}>اختر طريقة الدفع:</label>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${promoPaymentMethod === 'wallet' ? 'var(--primary)' : 'var(--border)'}`,
                      background: promoPaymentMethod === 'wallet' ? 'rgba(5,150,105,0.06)' : 'transparent',
                      cursor: 'pointer', transition: 'var(--transition)'
                    }}>
                      <input type="radio" name="promoPayment" value="wallet" checked={promoPaymentMethod === 'wallet'} onChange={() => setPromoPaymentMethod('wallet')} style={{ accentColor: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>💳 خصم من المحفظة</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>رصيدك: {(user?.balance || 0).toLocaleString('ar-EG')} ج.م</div>
                      </div>
                    </label>
                    <label style={{
                      flex: 1, display: 'flex', alignItems: 'center', gap: 8,
                      padding: '12px 14px', borderRadius: 'var(--radius-md)',
                      border: `2px solid ${promoPaymentMethod === 'contact' ? 'var(--primary)' : 'var(--border)'}`,
                      background: promoPaymentMethod === 'contact' ? 'rgba(5,150,105,0.06)' : 'transparent',
                      cursor: 'pointer', transition: 'var(--transition)'
                    }}>
                      <input type="radio" name="promoPayment" value="contact" checked={promoPaymentMethod === 'contact'} onChange={() => setPromoPaymentMethod('contact')} style={{ accentColor: 'var(--primary)' }} />
                      <div>
                        <div style={{ fontWeight: 700, fontSize: '0.88rem' }}>📞 تواصل يدوي</div>
                        <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>فريق سكني يتواصل معك</div>
                      </div>
                    </label>
                  </div>

                  {promoPaymentMethod === 'wallet' && (user?.balance || 0) < 100 && (
                    <div style={{
                      marginTop: 10, padding: '8px 12px', borderRadius: 'var(--radius-sm)',
                      background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)',
                      color: '#ef4444', fontSize: '0.82rem', fontWeight: 700
                    }}>
                      ⚠️ رصيدك غير كافٍ! يلزم 100 ج.م على الأقل. الرصيد الحالي: {(user?.balance || 0).toLocaleString('ar-EG')} ج.م
                    </div>
                  )}
                </div>
              )}

              {/* For landlords - show info about contact */}
              {!isBroker && (
                <div style={{
                  marginBottom: 20, padding: '12px 16px', borderRadius: 'var(--radius-md)',
                  background: '#eff6ff', border: '1px solid #bfdbfe', color: '#1e3a8a',
                  fontSize: '0.88rem', display: 'flex', alignItems: 'center', gap: 8
                }}>
                  <Phone size={16} style={{ color: '#2563eb', flexShrink: 0 }} />
                  <span>بعد تقديم الطلب، سيتواصل معك فريق سكني لإتمام عملية الدفع وتفعيل التمييز.</span>
                </div>
              )}

              {/* Consent */}
              <label style={{
                display: 'flex', alignItems: 'flex-start', gap: 10,
                padding: '12px 14px', borderRadius: 'var(--radius-md)',
                background: 'var(--background)', marginBottom: 20,
                cursor: 'pointer', fontSize: '0.88rem', lineHeight: 1.6
              }}>
                <input
                  type="checkbox"
                  checked={promoConsent}
                  onChange={e => setPromoConsent(e.target.checked)}
                  style={{ marginTop: 4, width: 18, height: 18, accentColor: 'var(--primary)', flexShrink: 0 }}
                />
                <span>
                  أوافق على رسوم تمييز الشقة بمبلغ <strong>100 ج.م</strong> (تُدفع مرة واحدة)
                  {isBroker && promoPaymentMethod === 'wallet' && ' وسيتم خصمها من رصيد محفظتي'}
                  ، وأفهم أن التمييز يتم تفعيله بعد موافقة فريق سكني.
                </span>
              </label>

              {/* Messages */}
              {promoError && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', color: '#ef4444', fontWeight: 700, fontSize: '0.88rem' }}>
                  {promoError}
                </div>
              )}
              {promoSuccess && (
                <div style={{ marginBottom: 14, padding: '10px 14px', borderRadius: 'var(--radius-sm)', background: 'rgba(5,150,105,0.08)', border: '1px solid rgba(5,150,105,0.2)', color: '#059669', fontWeight: 700, fontSize: '0.88rem' }}>
                  {promoSuccess}
                </div>
              )}

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary"
                style={{
                  width: '100%', padding: 14, fontWeight: 900, fontSize: '1rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  background: 'linear-gradient(135deg, #f59e0b, #d97706)',
                  border: 'none', cursor: promoSubmitLoading ? 'wait' : 'pointer'
                }}
                disabled={promoSubmitLoading || !promoConsent || (isBroker && promoPaymentMethod === 'wallet' && (user?.balance || 0) < 100)}
              >
                <Rocket size={18} />
                {promoSubmitLoading ? 'جاري إرسال الطلب...' : 'تقديم طلب التمييز 🚀'}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
