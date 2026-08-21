import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const isDemoMode = !supabaseUrl || !supabaseAnonKey;

if (isDemoMode) {
  console.warn(
    '⚠️ Sakany: Supabase credentials are missing. Running in DEMO MODE with mock Mansoura student housing data.'
  );
}

export const supabase = isDemoMode ? null : createClient(supabaseUrl, supabaseAnonKey);

const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
export const supabaseAdmin = (isDemoMode || !serviceRoleKey) ? null : createClient(supabaseUrl, serviceRoleKey, {
  auth: {
    persistSession: false,
    autoRefreshToken: false
  }
});

// ─── MOCK DATA ──────────────────────────────────────────────────────────────

// NOTE: landlord.phone and address are intentionally kept here
// but are NEVER passed to public-facing components.
// They are only accessible from admin/broker dashboard functions.
export const mockProperties = [
  {
    id: 'mock-1',
    title: 'شقة فاخرة للطلاب بجوار بوابة الجلاء مباشرة',
    description: 'شقة مفروشة بالكامل ومجهزة بجميع الأجهزة الكهربائية (ثلاجة، غسالة، بوتاجاز، شاشة تلفزيون). تحتوي على 3 غرف واسعة وصالة مكيفة. تقع على بعد دقيقتين مشياً من بوابة الجلاء لجامعة المنصورة. المياه والكهرباء والإنترنت متوفرة ومستقرة.',
    price: 3200,
    location: 'بوابة الجلاء',
    address: 'شارع الجلاء الرئيسي، أمام مكتبة حسني، المنصورة', // PRIVATE - admin only
    rooms: 3, bathrooms: 2, beds: 4, gender_type: 'male',
    has_ac: true, has_internet: true, has_elevator: false, floor: 2,
    images: [
      'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?auto=format&fit=crop&w=800&q=80'
    ],
    is_verified: true, is_featured: true, status: 'available', review_status: 'approved', views_count: 342,
    landlord: { full_name: 'أ. محمد المنشاوي', phone: '01009876543' }, // PRIVATE
    rent_type: 'apartment', available_beds: 4,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-2',
    title: 'سرير في غرفة ثنائية - سكن طالبات راقي حي الجامعة',
    description: 'سرير للإيجار لطالبة في غرفة ثنائية مشتركة بسكن طالبات راقي ومؤمن بالكامل. العمارة حديثة مزودة بكاميرات مراقبة وحارس خاص. الشقة قريبة من المطاعم والخدمات وخلف بنك مصر حي الجامعة. تشتمل على مطبخ مجهز وغسالة أوتوماتيك وسخان غاز.',
    price: 1200,
    location: 'حي الجامعة',
    address: 'تقاطع شارع جيهان مع حي الجامعة، المنصورة', // PRIVATE
    rooms: 2, bathrooms: 1, beds: 2, gender_type: 'female',
    has_ac: true, has_internet: true, has_elevator: true, floor: 4,
    images: [
      'https://images.unsplash.com/photo-1598928506311-c55ded91a20c?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1505691938895-1758d7feb511?auto=format&fit=crop&w=800&q=80'
    ],
    is_verified: true, is_featured: true, status: 'available', review_status: 'approved', views_count: 512,
    landlord: { full_name: 'الحاجة أم أحمد', phone: '01223456789' }, // PRIVATE
    rent_type: 'bed', available_beds: 1,
    created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-3',
    title: 'استوديو مفروش بالكامل للطلاب - شارع الترعة',
    description: 'استوديو مميز لشخص أو شخصين (سريرين). يحتوي على مكيف هواء، ثلاجة صغيرة، حمام خاص ومطبخ صغير تحضيري. يقع في شارع الترعة الرئيسي ويسهل الوصول منه لجميع كليات الجامعة.',
    price: 2200,
    location: 'شارع الترعة',
    address: 'شارع الترعة بجوار سوبرماركت أولاد رجب، المنصورة', // PRIVATE
    rooms: 1, bathrooms: 1, beds: 2, gender_type: 'male',
    has_ac: true, has_internet: false, has_elevator: false, floor: 1,
    images: [
      'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1502672023488-70e25813eb80?auto=format&fit=crop&w=800&q=80'
    ],
    is_verified: false, is_featured: false, status: 'available', review_status: 'approved', views_count: 128,
    landlord: { full_name: 'كابتن أحمد خالد', phone: '01556789123' }, // PRIVATE
    rent_type: 'apartment', available_beds: 2,
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-4',
    title: 'سرير في شقة طالبات قريبة من بوابة توشكى',
    description: 'سرير متوفر للإيجار في شقة طالبات واسعة تحتوي على 3 غرف نوم وصالة كبيرة ومطبخ أمريكاني مفتوح. تشطيب سوبر لوكس. موقع ممتاز هادئ وآمن ومناسب جداً للمذاكرة والتركيز. تبعد 5 دقائق فقط عن بوابة توشكى للجامعة.',
    price: 950,
    location: 'بوابة توشكى',
    address: 'تقسيم الزعفران، خلف كلية الحقوق، المنصورة', // PRIVATE
    rooms: 3, bathrooms: 2, beds: 4, gender_type: 'female',
    has_ac: false, has_internet: true, has_elevator: true, floor: 3,
    images: [
      'https://images.unsplash.com/photo-1484154218962-a197022b5858?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1554995207-c18c203602cb?auto=format&fit=crop&w=800&q=80'
    ],
    is_verified: true, is_featured: false, status: 'available', review_status: 'approved', views_count: 289,
    landlord: { full_name: 'مهندس سامح عبد الهادي', phone: '01114567890' }, // PRIVATE
    rent_type: 'bed', available_beds: 3,
    created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'mock-5',
    title: 'شقة فاخرة مطلة على المشاية السفلية والنيل',
    description: 'للطلاب الباحثين عن التميز والراحة، شقة فاخرة جداً ذات إطلالة مباشرة على النيل بالمشاية السفلية. تكييفات بجميع الغرف، غسالة أطباق، شاشة 55 بوصة، ديكورات حديثة. العمارة بها مصعد وأمن 24 ساعة.',
    price: 6500,
    location: 'المشاية السفلية',
    address: 'المشاية السفلية، بجوار نادي جزيرة الورد، المنصورة', // PRIVATE
    rooms: 2, bathrooms: 2, beds: 3, gender_type: 'any',
    has_ac: true, has_internet: true, has_elevator: true, floor: 6,
    images: [
      'https://images.unsplash.com/photo-1540518614846-7eded433c457?auto=format&fit=crop&w=800&q=80',
      'https://images.unsplash.com/photo-1556912172-45b7abe8b7e1?auto=format&fit=crop&w=800&q=80'
    ],
    is_verified: true, is_featured: true, status: 'available', review_status: 'approved', views_count: 672,
    landlord: { full_name: 'أ. د. حسن الشرقاوي', phone: '01011223344' }, // PRIVATE
    rent_type: 'apartment', available_beds: 3,
    created_at: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock booking requests (for admin/broker dashboard demo)
export const mockBookingRequests = [
  {
    id: 'booking-1',
    property_id: 'mock-1',
    property: { id: 'mock-1', title: 'شقة فاخرة للطلاب بجوار بوابة الجلاء مباشرة', location: 'بوابة الجلاء', address: 'شارع الجلاء الرئيسي، أمام مكتبة حسني، المنصورة', price: 3200, rent_type: 'apartment',
      landlord: { full_name: 'أ. محمد المنشاوي', phone: '01009876543' }
    },
    landlord: { full_name: 'أ. محمد المنشاوي', phone: '01009876543' },
    student: { full_name: 'محمد سامي علي', phone: '01098765432' },
    status: 'pending',
    requested_beds: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'booking-2',
    property_id: 'mock-2',
    property: { id: 'mock-2', title: 'سرير في غرفة ثنائية - سكن طالبات راقي حي الجامعة', location: 'حي الجامعة', address: 'تقاطع شارع جيهان مع حي الجامعة، المنصورة', price: 1200, rent_type: 'bed',
      landlord: { full_name: 'الحاجة أم أحمد', phone: '01223456789' }
    },
    landlord: { full_name: 'الحاجة أم أحمد', phone: '01223456789' },
    student: { full_name: 'سارة أحمد محمود', phone: '01112345678' },
    status: 'contacted',
    requested_beds: 1,
    created_at: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'booking-3',
    property_id: 'mock-4',
    property: { id: 'mock-4', title: 'شقة طالبات واسعة وقريبة من بوابة توشكى', location: 'بوابة توشكى', address: 'تقسيم الزعفران، خلف كلية الحقوق، المنصورة', price: 3800, rent_type: 'apartment',
      landlord: { full_name: 'مهندس سامح عبد الهادي', phone: '01114567890' }
    },
    landlord: { full_name: 'مهندس سامح عبد الهادي', phone: '01114567890' },
    student: { full_name: 'نور الهدى سعيد', phone: '01234567890' },
    status: 'completed',
    requested_beds: null,
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

// Mock user profiles (for admin dashboard accounts demo)
export const mockProfiles = [
  { id: 'mock-admin-id', full_name: 'أدمن المنصة', phone: '01004522495', role: 'admin', email: '2062005@y', balance: 0, is_broker_verified: false, created_at: new Date().toISOString() },
  { id: 'mock-landlord-1', full_name: 'أ. محمد المنشاوي', phone: '01009876543', role: 'landlord', email: 'menshawy@example.com', balance: 0, is_broker_verified: false, created_at: new Date().toISOString() },
  { id: 'mock-landlord-2', full_name: 'الحاجة أم أحمد', phone: '01223456789', role: 'landlord', email: 'om_ahmed@example.com', balance: 0, is_broker_verified: false, created_at: new Date().toISOString() },
  { id: 'mock-broker-1', full_name: 'كابتن أحمد خالد', phone: '01556789123', role: 'broker', email: 'ahmed_broker@example.com', balance: 1250, is_broker_verified: true, created_at: new Date().toISOString() },
  { id: 'mock-broker-2', full_name: 'أ. سمير الدسوقي', phone: '01234509876', role: 'broker', email: 'samir_broker@example.com', balance: 0, is_broker_verified: false, created_at: new Date().toISOString() },
  { id: 'mock-student-1', full_name: 'محمد سامي علي', phone: '01098765432', role: 'student', email: 'sami@example.com', balance: 0, is_broker_verified: false, created_at: new Date().toISOString() },
  { id: 'mock-student-2', full_name: 'سارة أحمد محمود', phone: '01112345678', role: 'student', email: 'sara@example.com', balance: 0, is_broker_verified: false, created_at: new Date().toISOString() }
];

// Mock broker verification requests
const defaultMockVerifications = [
  {
    id: 'verif-1',
    broker_id: 'mock-broker-2',
    full_name: 'أ. سمير الدسوقي',
    phone: '01234509876',
    notes: 'أعمل كسمسار عقارات في المنصورة منذ 5 سنوات، متخصص في سكن الطلاب بمنطقة حي الجامعة وبوابة الجلاء.',
    document_image: null,
    status: 'pending',
    rejection_reason: null,
    created_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
    updated_at: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
  }
];

function getMockVerifications() {
  if (typeof window === 'undefined') return defaultMockVerifications;
  const stored = localStorage.getItem('sakany_verifications');
  if (stored) {
    try { return JSON.parse(stored); } catch { return defaultMockVerifications; }
  }
  localStorage.setItem('sakany_verifications', JSON.stringify(defaultMockVerifications));
  return defaultMockVerifications;
}

function saveMockVerifications(list) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakany_verifications', JSON.stringify(list));
  }
}

// ─── PUBLIC HELPERS (No landlord contact info exposed) ────────────────────

export async function getProperties(filters = {}) {
  if (isDemoMode) {
    let list = [...mockProperties];
    // Owner can see their own in all review states; admin sees all; public sees only approved
    if (filters.landlord_id) {
      list = list.filter(p => p.landlord_id === filters.landlord_id);
    } else if (!filters.isAdmin) {
      list = list.filter(p => p.review_status === 'approved');
    }
    // Filter by review_status if explicitly provided
    if (filters.review_status) {
      list = list.filter(p => p.review_status === filters.review_status);
    }
    if (!filters.allStatuses)
      list = list.filter(p => p.status === 'available');
    if (filters.rent_type && filters.rent_type !== 'all')
      list = list.filter(p => (p.rent_type || 'apartment') === filters.rent_type);
    if (filters.minBeds)
      list = list.filter(p => {
        const beds = p.rent_type === 'bed' ? (p.available_beds ?? 1) : (p.beds ?? 1);
        return beds >= Number(filters.minBeds);
      });
    if (filters.location && filters.location !== 'all')
      list = list.filter(p => p.location === filters.location);
    if (filters.gender_type && filters.gender_type !== 'all')
      list = list.filter(p => p.gender_type === filters.gender_type);
    if (filters.maxPrice)
      list = list.filter(p => p.price <= Number(filters.maxPrice));
    if (filters.rooms && filters.rooms !== 'all')
      list = list.filter(p => p.rooms === Number(filters.rooms));
    if (filters.verifiedOnly)
      list = list.filter(p => p.is_verified === true);
    if (filters.featured || filters.is_featured)
      list = list.filter(p => p.is_featured === true);
    if (filters.has_ac)       list = list.filter(p => p.has_ac === true);
    if (filters.has_internet) list = list.filter(p => p.has_internet === true);
    if (filters.has_elevator) list = list.filter(p => p.has_elevator === true);
    if (filters.floor)        list = list.filter(p => p.floor === Number(filters.floor));
    if (filters.minPrice)     list = list.filter(p => p.price >= Number(filters.minPrice));
    if (filters.search) {
      const s = filters.search.toLowerCase();
      list = list.filter(p =>
        p.title.toLowerCase().includes(s) ||
        p.description.toLowerCase().includes(s) ||
        p.location.toLowerCase().includes(s)
      );
    }
    // Strip private fields before returning to public
    return { data: list.map(stripPrivate), error: null };
  }

  try {
    let query = supabase
      .from('properties')
      .select('id,landlord_id,title,description,price,location,address,rooms,bathrooms,beds,gender_type,images,is_verified,is_featured,status,review_status,rejection_reason,views_count,created_at,has_ac,has_internet,has_elevator,floor,rent_type,available_beds')
      .order('is_verified', { ascending: false })
      .order('created_at', { ascending: false });

    // Public queries only return approved properties (unless owner/admin)
    if (!filters.landlord_id && !filters.isAdmin) {
      query = query.eq('review_status', 'approved');
    }
    if (filters.review_status) {
      query = query.eq('review_status', filters.review_status);
    }
    if (!filters.allStatuses) {
      query = query.eq('status', 'available');
    }
    if (filters.landlord_id) {
      query = query.eq('landlord_id', filters.landlord_id);
    }
    if (filters.rent_type && filters.rent_type !== 'all') {
      query = query.eq('rent_type', filters.rent_type);
      if (filters.minBeds) {
        if (filters.rent_type === 'bed') {
          query = query.gte('available_beds', Number(filters.minBeds));
        } else {
          query = query.gte('beds', Number(filters.minBeds));
        }
      }
    } else if (filters.minBeds) {
      query = query.or(`and(rent_type.eq.bed,available_beds.gte.${filters.minBeds}),and(rent_type.neq.bed,beds.gte.${filters.minBeds})`);
    }
    if (filters.location && filters.location !== 'all') query = query.eq('location', filters.location);
    if (filters.gender_type && filters.gender_type !== 'all') query = query.eq('gender_type', filters.gender_type);
    if (filters.minPrice) query = query.gte('price', Number(filters.minPrice));
    if (filters.maxPrice) query = query.lte('price', Number(filters.maxPrice));
    if (filters.rooms && filters.rooms !== 'all') query = query.eq('rooms', Number(filters.rooms));
    if (filters.verifiedOnly) query = query.eq('is_verified', true);
    if (filters.featured || filters.is_featured) query = query.eq('is_featured', true);
    if (filters.has_ac) query = query.eq('has_ac', true);
    if (filters.has_internet) query = query.eq('has_internet', true);
    if (filters.has_elevator) query = query.eq('has_elevator', true);
    if (filters.floor && filters.floor !== 'all') query = query.eq('floor', Number(filters.floor));
    if (filters.search)
      query = query.or(`title.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);

    const { data, error } = await query;

    // Strip private address field only if query is from public student/guest
    if (!filters.isAdmin && !filters.landlord_id && data) {
      return { data: data.map(stripPrivate), error };
    }

    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Public property detail — no private fields
export async function getPropertyById(id) {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === id);
    if (!prop) return { data: null, error: new Error('Property not found') };
    return { data: stripPrivate(prop), error: null };
  }

  try {
    const client = (typeof window === 'undefined' && supabaseAdmin) ? supabaseAdmin : supabase;
    const { data, error } = await client
      .from('properties')
      .select('id,landlord_id,title,description,price,location,rooms,bathrooms,beds,gender_type,images,video_url,is_verified,is_featured,status,views_count,created_at,has_ac,has_internet,has_elevator,floor,review_status,rejection_reason,rent_type,available_beds')
      .eq('id', id)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function addProperty(propertyData) {
  if (isDemoMode) {
    const newProp = {
      id: `mock-${Date.now()}`,
      ...propertyData,
      is_verified: false,
      review_status: 'pending_review',
      views_count: 0,
      created_at: new Date().toISOString(),
      landlord: { full_name: 'حساب تجريبي للمالك', phone: propertyData.phone || '01000000000' }
    };
    mockProperties.unshift(newProp);
    return { data: newProp, error: null };
  }

  try {
    // Strip phone before inserting, as it is stored in profiles and does not exist on properties table
    const { phone, ...dbData } = propertyData;
    // New properties always start as pending_review
    const { data, error } = await supabase
      .from('properties').insert([{ ...dbData, review_status: 'pending_review' }]).select().single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ─── ADMIN REVIEW FUNCTIONS ──────────────────────────────────────────────────

export async function approveProperty(propertyId) {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === propertyId);
    if (prop) { prop.review_status = 'approved'; prop.rejection_reason = null; }
    return { data: prop, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ review_status: 'approved', rejection_reason: null })
      .eq('id', propertyId)
      .select().single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function rejectProperty(propertyId, reason = '') {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === propertyId);
    if (prop) { prop.review_status = 'rejected'; prop.rejection_reason = reason; }
    return { data: prop, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ review_status: 'rejected', rejection_reason: reason })
      .eq('id', propertyId)
      .select().single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function resetPropertyReview(propertyId) {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === propertyId);
    if (prop) { prop.review_status = 'pending_review'; prop.rejection_reason = null; }
    return { data: prop, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ review_status: 'pending_review', rejection_reason: null })
      .eq('id', propertyId)
      .select().single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ─── ACCOUNTS MANAGEMENT FUNCTIONS ──────────────────────────────────────────

export async function getAllUsers() {
  if (isDemoMode) {
    return { data: [...mockProfiles], error: null };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteUser(userId) {
  if (isDemoMode) {
    const index = mockProfiles.findIndex(u => u.id === userId);
    if (index !== -1) {
      mockProfiles.splice(index, 1);
    }
    return { success: true, error: null };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: new Error('يرجى تسجيل الدخول أولاً.') };
    }

    const response = await fetch('/api/admin/users', {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId })
    });

    const resData = await response.json();
    if (!response.ok) {
      return { success: false, error: new Error(resData.error || 'فشل حذف المستخدم.') };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// ─── BOOKING REQUESTS ────────────────────────────────────────────────────────

export async function createBookingRequest({ propertyId, studentId, studentName, studentPhone, requestedBeds = 1 }) {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === propertyId);
    if (!prop) return { data: null, error: new Error('Property not found') };

    // Check for duplicate pending request
    const existing = mockBookingRequests.find(
      b => b.property_id === propertyId && b.student?.phone === studentPhone && b.status === 'pending'
    );
    if (existing) return { data: null, error: new Error('duplicate') };

    const newBooking = {
      id: `booking-${Date.now()}`,
      property_id: propertyId,
      property: { title: prop.title, location: prop.location, price: prop.price },
      landlord: prop.landlord, // visible only in admin dashboard
      student: { full_name: studentName, phone: studentPhone },
      status: 'pending',
      requested_beds: requestedBeds,
      created_at: new Date().toISOString()
    };
    mockBookingRequests.unshift(newBooking);
    return { data: newBooking, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .insert([{ property_id: propertyId, student_id: studentId, requested_beds: requestedBeds }])
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Admin/Broker only — returns full booking details including landlord phone
export async function getAllBookingRequests() {
  if (isDemoMode) {
    return { data: [...mockBookingRequests], error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        property:property_id(title, location, price, landlord_id, address,
          landlord:landlord_id(full_name, phone)
        ),
        student:student_id(full_name, phone)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Get booking requests for a specific landlord/broker's properties
export async function getLandlordBookingRequests(landlordId) {
  if (isDemoMode) {
    const landlordProfile = mockProfiles.find(p => p.id === landlordId);
    const landlordName = landlordProfile?.full_name;
    const filtered = mockBookingRequests.filter(b => {
      if (b.landlord && landlordName && b.landlord.full_name === landlordName) {
        return true;
      }
      const prop = mockProperties.find(p => p.id === b.property_id);
      if (prop && prop.landlord_id === landlordId) {
        return true;
      }
      return false;
    });
    return { data: filtered, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        property!inner:property_id(title, location, price, landlord_id, address,
          landlord:landlord_id(full_name, phone)
        ),
        student:student_id(full_name, phone)
      `)
      .eq('property.landlord_id', landlordId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateBookingStatus(bookingId, status) {
  if (isDemoMode) {
    const booking = mockBookingRequests.find(b => b.id === bookingId);
    if (booking) booking.status = status;
    return { data: booking, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .update({ status })
      .eq('id', bookingId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function deleteProperty(propertyId) {
  if (isDemoMode) {
    const idx = mockProperties.findIndex(p => p.id === propertyId);
    if (idx !== -1) {
      mockProperties.splice(idx, 1);
    }
    return { data: true, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .delete()
      .eq('id', propertyId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updatePropertyStatus(propertyId, status) {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === propertyId);
    if (prop) prop.status = status;
    return { data: prop, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ status })
      .eq('id', propertyId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function togglePropertyFeatured(propertyId, isFeatured) {
  if (isDemoMode) {
    const prop = mockProperties.find(p => p.id === propertyId);
    if (prop) prop.is_featured = isFeatured;
    return { data: prop, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('properties')
      .update({ is_featured: isFeatured })
      .eq('id', propertyId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ─── UTILITIES ───────────────────────────────────────────────────────────────

// Strips private fields before any public-facing component sees the data
function stripPrivate(property) {
  // eslint-disable-next-line no-unused-vars
  const { address, landlord, ...publicData } = property;
  return publicData;
}

export async function getUserProfile(userId) {
  if (isDemoMode) {
    const u = mockProfiles.find(p => p.id === userId) || {
      id: userId,
      full_name: 'مستخدم تجريبي',
      phone: '01012345678',
      role: 'student',
      email: 'user@example.com',
      created_at: new Date().toISOString()
    };
    return { data: u, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getPropertiesByIds(ids) {
  if (!ids || ids.length === 0) return { data: [], error: null };
  if (isDemoMode) {
    const list = mockProperties.filter(p => ids.includes(p.id));
    return { data: list.map(stripPrivate), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('properties')
      .select('id,landlord_id,title,description,price,location,rooms,bathrooms,beds,gender_type,images,is_verified,is_featured,status,views_count,created_at,has_ac,has_internet,has_elevator,floor,rent_type,available_beds')
      .in('id', ids);
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// ─── NOTIFICATIONS FUNCTIONS ────────────────────────────────────────────────

function getMockNotifications() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('sakany_notifications');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  const defaults = [
    {
      id: 'notif-1',
      user_id: 'mock-student-1',
      title: 'مرحباً بك في سَكني',
      message: 'أهلاً بك في منصة سكني لسكن الطلاب في المنصورة. ابدأ بالبحث عن سكنك المفضل الآن!',
      is_read: false,
      created_at: new Date().toISOString()
    },
    {
      id: 'notif-2',
      user_id: 'mock-student-1',
      title: 'توثيق شقة جديدة',
      message: 'تم إضافة شقة موثقة جديدة بالقرب من بوابة الجلاء مطابقة لتفضيلاتك.',
      is_read: true,
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];
  localStorage.setItem('sakany_notifications', JSON.stringify(defaults));
  return defaults;
}

function saveMockNotifications(notifs) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakany_notifications', JSON.stringify(notifs));
  }
}

export async function getNotifications(userId) {
  if (isDemoMode) {
    const list = getMockNotifications().filter(n => n.user_id === userId);
    return { data: list, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function markNotificationAsRead(notificationId) {
  if (isDemoMode) {
    const notifs = getMockNotifications();
    const item = notifs.find(n => n.id === notificationId);
    if (item) {
      item.is_read = true;
      saveMockNotifications(notifs);
    }
    return { data: item, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function sendNotification({ phone, targetRole, title, message }) {
  if (isDemoMode) {
    const notifs = getMockNotifications();
    let targetUserIds = [];

    if (phone) {
      const user = mockProfiles.find(p => p.phone === phone);
      if (!user) return { success: false, error: new Error('لم يتم العثور على مستخدم بهذا الهاتف') };
      targetUserIds = [user.id];
    } else if (targetRole === 'all') {
      targetUserIds = mockProfiles.map(p => p.id);
    } else {
      targetUserIds = mockProfiles.filter(p => p.role === targetRole).map(p => p.id);
    }

    if (targetUserIds.length === 0) {
      return { success: false, error: new Error('لم يتم العثور على أي مستخدمين لإرسال الإشعار لهم') };
    }

    const newNotifs = targetUserIds.map(uid => ({
      id: `notif-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
      user_id: uid,
      title,
      message,
      is_read: false,
      created_at: new Date().toISOString()
    }));

    notifs.unshift(...newNotifs);
    saveMockNotifications(notifs);
    
    // Trigger notification badge sync event
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications_change'));
    }
    
    return { success: true, error: null };
  }

  try {
    let targetUserIds = [];

    if (phone) {
      const { data: userProfile, error: searchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('phone', phone)
        .maybeSingle();

      if (searchError) return { success: false, error: searchError };
      if (!userProfile) return { success: false, error: new Error('لم يتم العثور على مستخدم بهذا الهاتف') };
      targetUserIds = [userProfile.id];
    } else if (targetRole === 'all') {
      const { data: allUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id');
      if (fetchError) return { success: false, error: fetchError };
      targetUserIds = allUsers.map(u => u.id);
    } else {
      const { data: filteredUsers, error: fetchError } = await supabase
        .from('profiles')
        .select('id')
        .eq('role', targetRole);
      if (fetchError) return { success: false, error: fetchError };
      targetUserIds = filteredUsers.map(u => u.id);
    }

    if (targetUserIds.length === 0) {
      return { success: false, error: new Error('لم يتم العثور على مستخدمين متطابقين لإرسال الإشعار لهم') };
    }

    const rows = targetUserIds.map(uid => ({
      user_id: uid,
      title,
      message,
      is_read: false
    }));

    const { error: insertError } = await supabase
      .from('notifications')
      .insert(rows);

    if (insertError) return { success: false, error: insertError };
    
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// ─── PASSWORD RESET FUNCTIONS ────────────────────────────────────────────────

function getMockResetRequests() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('sakany_reset_requests');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  const defaults = [
    {
      id: 'req-1',
      phone: '01098765432',
      full_name: 'محمد سامي علي',
      status: 'pending',
      created_at: new Date(Date.now() - 7200000).toISOString()
    }
  ];
  localStorage.setItem('sakany_reset_requests', JSON.stringify(defaults));
  return defaults;
}

function saveMockResetRequests(reqs) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakany_reset_requests', JSON.stringify(reqs));
  }
}

export async function createPasswordResetRequest(phone) {
  if (isDemoMode) {
    const profile = mockProfiles.find(p => p.phone === phone);
    if (!profile) {
      return { success: false, error: new Error('رقم الهاتف هذا غير مسجل لدينا في النظام التجريبي.') };
    }
    const reqs = getMockResetRequests();
    const newReq = {
      id: `req-${Date.now()}`,
      phone,
      full_name: profile.full_name,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    reqs.unshift(newReq);
    saveMockResetRequests(reqs);
    return { success: true, error: null };
  }

  try {
    // 1. Resolve full name by searching profiles
    const { data: profile, error: searchError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('phone', phone)
      .maybeSingle();

    if (searchError) return { success: false, error: searchError };
    if (!profile) {
      return { success: false, error: new Error('رقم الهاتف هذا غير مسجل لدينا في النظام.') };
    }

    // 2. Insert request
    const { error: insertError } = await supabase
      .from('password_reset_requests')
      .insert([{
        phone,
        full_name: profile.full_name,
        status: 'pending'
      }]);

    if (insertError) return { success: false, error: insertError };
    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getPasswordResetRequests() {
  if (isDemoMode) {
    return { data: getMockResetRequests(), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .select('*')
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updatePasswordResetRequestStatus(requestId, status) {
  if (isDemoMode) {
    const reqs = getMockResetRequests();
    const item = reqs.find(r => r.id === requestId);
    if (item) {
      item.status = status;
      saveMockResetRequests(reqs);
    }
    return { data: item, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('password_reset_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateUserPassword(userId, newPassword) {
  if (isDemoMode) {
    return { success: true, error: null };
  }

  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      return { success: false, error: new Error('يرجى تسجيل الدخول أولاً.') };
    }

    const response = await fetch('/api/admin/users', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`
      },
      body: JSON.stringify({ userId, newPassword })
    });

    const resData = await response.json();
    if (!response.ok) {
      return { success: false, error: new Error(resData.error || 'فشل تحديث كلمة السر.') };
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// ─── BROKER BALANCE & WITHDRAWALS FUNCTIONS ──────────────────────────────────

function getMockBalance(userId) {
  if (typeof window === 'undefined') return 0;
  const stored = localStorage.getItem(`sakany_balance_${userId}`);
  if (stored) return Number(stored);
  localStorage.setItem(`sakany_balance_${userId}`, '1250.00'); // default mock balance
  return 1250.00;
}

function saveMockBalance(userId, balance) {
  if (typeof window !== 'undefined') {
    localStorage.setItem(`sakany_balance_${userId}`, balance.toFixed(2));
  }
}

function getMockWithdrawals() {
  if (typeof window === 'undefined') return [];
  const stored = localStorage.getItem('sakany_withdrawals');
  if (stored) {
    try {
      return JSON.parse(stored);
    } catch (e) {
      return [];
    }
  }
  const defaults = [
    {
      id: 'w-1',
      broker_id: 'mock-broker-1',
      broker_name: 'كابتن أحمد خالد',
      broker_phone: '01556789123',
      amount: 450,
      wallet_number: '01040122363',
      wallet_type: 'vodafone_cash',
      status: 'pending',
      created_at: new Date(Date.now() - 3600000).toISOString()
    }
  ];
  localStorage.setItem('sakany_withdrawals', JSON.stringify(defaults));
  return defaults;
}

function saveMockWithdrawals(withdrawals) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakany_withdrawals', JSON.stringify(withdrawals));
  }
}

export async function getBrokerBalance(brokerId) {
  if (isDemoMode) {
    return { data: getMockBalance(brokerId), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', brokerId)
      .single();
    return { data: data ? Number(data.balance) : 0, error };
  } catch (error) {
    return { data: 0, error };
  }
}

export async function addBrokerBalanceByPhone(phone, amount) {
  if (isDemoMode) {
    const user = mockProfiles.find(p => p.phone === phone);
    if (!user) return { success: false, error: new Error('لم يتم العثور على مستخدم بهذا الهاتف في النظام التجريبي.') };
    if (user.role !== 'broker') return { success: false, error: new Error('المستخدم ليس سمساراً.') };
    const current = getMockBalance(user.id);
    saveMockBalance(user.id, current + Number(amount));
    logMockTransaction(user.id, Number(amount), 'deposit', 'شحن رصيد بواسطة الإدارة');
    
    // Add transaction notification
    const notifs = getMockNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      title: 'إيداع رصيد جديد',
      message: `تم إضافة ${amount} ج.م إلى رصيدك بواسطة الإدارة.`,
      is_read: false,
      created_at: new Date().toISOString()
    });
    saveMockNotifications(notifs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications_change'));
    }
    
    return { success: true, error: null };
  }

  try {
    const { data: profile, error: searchErr } = await supabase
      .from('profiles')
      .select('id, balance, role')
      .eq('phone', phone)
      .maybeSingle();

    if (searchErr) return { success: false, error: searchErr };
    if (!profile) return { success: false, error: new Error('لم يتم العثور على مستخدم بهذا رقم الهاتف.') };
    if (profile.role !== 'broker') return { success: false, error: new Error('عذراً، هذا الحساب ليس سمساراً.') };

    const newBalance = Number(profile.balance) + Number(amount);

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', profile.id);

    if (updateErr) return { success: false, error: updateErr };

    // Log transaction
    await supabase.from('wallet_transactions').insert([{
      broker_id: profile.id,
      amount: Number(amount),
      type: 'deposit',
      description: 'شحن رصيد بواسطة الإدارة'
    }]);

    await supabase.from('notifications').insert([{
      user_id: profile.id,
      title: 'إيداع رصيد جديد',
      message: `تم إضافة ${amount} ج.م إلى رصيدك بواسطة الإدارة. رصيدك الحالي هو ${newBalance} ج.م.`,
      is_read: false
    }]);

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function deductBrokerBalanceByPhone(phone, amount, reason = '') {
  if (isDemoMode) {
    const user = mockProfiles.find(p => p.phone === phone);
    if (!user) return { success: false, error: new Error('لم يتم العثور على مستخدم بهذا الهاتف في النظام التجريبي.') };
    if (user.role !== 'broker') return { success: false, error: new Error('المستخدم ليس سمساراً.') };
    const current = getMockBalance(user.id);
    if (current < Number(amount)) return { success: false, error: new Error('رصيد السمسار غير كافٍ لإجراء هذا الخصم.') };
    
    saveMockBalance(user.id, current - Number(amount));
    logMockTransaction(user.id, -Number(amount), 'withdrawal', `خصم رصيد يدوي من الإدارة: ${reason || 'بدون سبب'}`);
    
    // Add transaction notification
    const notifs = getMockNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: user.id,
      title: 'خصم رصيد من حسابك ⚠️',
      message: `تم خصم ${amount} ج.م من رصيدك بواسطة الإدارة. السبب: ${reason || 'غير محدد'}`,
      is_read: false,
      created_at: new Date().toISOString()
    });
    saveMockNotifications(notifs);
    if (typeof window !== 'undefined') {
      window.dispatchEvent(new CustomEvent('notifications_change'));
    }
    
    return { success: true, error: null };
  }

  try {
    const { data: profile, error: searchErr } = await supabase
      .from('profiles')
      .select('id, balance, role')
      .eq('phone', phone)
      .maybeSingle();

    if (searchErr) return { success: false, error: searchErr };
    if (!profile) return { success: false, error: new Error('لم يتم العثور على مستخدم بهذا رقم الهاتف.') };
    if (profile.role !== 'broker') return { success: false, error: new Error('عذراً، هذا الحساب ليس سمساراً.') };
    if (Number(profile.balance) < Number(amount)) {
      return { success: false, error: new Error('رصيد السمسار الحالي غير كافٍ لإجراء هذا الخصم.') };
    }

    const newBalance = Number(profile.balance) - Number(amount);

    const { error: updateErr } = await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', profile.id);

    if (updateErr) return { success: false, error: updateErr };

    // Log transaction
    await supabase.from('wallet_transactions').insert([{
      broker_id: profile.id,
      amount: -Number(amount),
      type: 'admin_deduction',
      description: `خصم رصيد يدوي من الإدارة: ${reason || 'بدون سبب'}`
    }]);

    await supabase.from('notifications').insert([{
      user_id: profile.id,
      title: 'خصم رصيد من حسابك ⚠️',
      message: `تم خصم ${amount} ج.م من رصيدك بواسطة الإدارة. السبب: ${reason || 'غير محدد'}. رصيدك الحالي هو ${newBalance} ج.م.`,
      is_read: false
    }]);

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function createWithdrawalRequest({ brokerId, amount, walletNumber, walletType }) {
  if (isDemoMode) {
    const current = getMockBalance(brokerId);
    if (current < amount) return { success: false, error: new Error('رصيدك غير كافٍ لإتمام عملية السحب.') };
    
    saveMockBalance(brokerId, current - amount);
    logMockTransaction(brokerId, -Number(amount), 'withdrawal', `طلب سحب رصيد (${walletType === 'instapay' ? 'إنستاباي' : 'محفظة كاش'} رقم ${walletNumber})`);
    
    const withdrawals = getMockWithdrawals();
    const broker = mockProfiles.find(p => p.id === brokerId) || { full_name: 'سمسار تجريبي', phone: '01556789123' };
    const newReq = {
      id: `w-${Date.now()}`,
      broker_id: brokerId,
      broker_name: broker.full_name,
      broker_phone: broker.phone,
      amount,
      wallet_number: walletNumber,
      wallet_type: walletType || 'vodafone_cash',
      status: 'pending',
      created_at: new Date().toISOString()
    };
    withdrawals.unshift(newReq);
    saveMockWithdrawals(withdrawals);
    
    return { success: true, error: null };
  }

  try {
    const { data: profile, error: fetchErr } = await supabase
      .from('profiles')
      .select('balance')
      .eq('id', brokerId)
      .single();

    if (fetchErr || !profile) return { success: false, error: fetchErr || new Error('فشل جلب بيانات الرصيد.') };
    if (Number(profile.balance) < Number(amount)) {
      return { success: false, error: new Error('رصيدك الحالي غير كافٍ لإجراء هذا السحب.') };
    }

    const nextBalance = Number(profile.balance) - Number(amount);

    const { error: deductErr } = await supabase
      .from('profiles')
      .update({ balance: nextBalance })
      .eq('id', brokerId);

    if (deductErr) return { success: false, error: deductErr };

    const { error: insertErr } = await supabase
      .from('withdrawal_requests')
      .insert([{
        broker_id: brokerId,
        amount,
        wallet_number: walletNumber,
        wallet_type: walletType || 'vodafone_cash',
        status: 'pending'
      }]);

    if (insertErr) {
      await supabase.from('profiles').update({ balance: profile.balance }).eq('id', brokerId);
      return { success: false, error: insertErr };
    }

    // Log transaction
    const wTypeLabel = {
      vodafone_cash: 'فودافون كاش',
      etisalat_cash: 'اتصالات كاش',
      orange_cash: 'أورنج كاش',
      instapay: 'إنستاباي'
    }[walletType] || walletType;
    
    await supabase.from('wallet_transactions').insert([{
      broker_id: brokerId,
      amount: -Number(amount),
      type: 'withdrawal',
      description: `طلب سحب رصيد (${wTypeLabel} رقم ${walletNumber})`
    }]);

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getAllWithdrawalRequests() {
  if (isDemoMode) {
    return { data: getMockWithdrawals(), error: null };
  }
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select(`
        *,
        broker:broker_id(full_name, phone)
      `)
      .order('created_at', { ascending: false });

    const formatted = data?.map(d => ({
      ...d,
      broker_name: d.broker?.full_name,
      broker_phone: d.broker?.phone
    })) || [];

    return { data: formatted, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function getBrokerWithdrawals(brokerId) {
  if (isDemoMode) {
    const list = getMockWithdrawals().filter(w => w.broker_id === brokerId);
    return { data: list, error: null };
  }
  try {
    const { data, error } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function updateWithdrawalRequestStatus(requestId, status) {
  if (isDemoMode) {
    const withdrawals = getMockWithdrawals();
    const item = withdrawals.find(w => w.id === requestId);
    if (item) {
      const oldStatus = item.status;
      if (oldStatus === 'paid' || oldStatus === 'rejected') {
        return { data: null, error: new Error('لا يمكن تعديل حالة طلب السحب بعد اكتمال الدفع أو الرفض.') };
      }
      item.status = status;
      saveMockWithdrawals(withdrawals);

      if (status === 'rejected' && oldStatus !== 'rejected') {
        const bal = getMockBalance(item.broker_id);
        saveMockBalance(item.broker_id, bal + item.amount);
        logMockTransaction(item.broker_id, item.amount, 'withdrawal_refund', 'إرجاع رصيد لرفض طلب السحب');
        
        const notifs = getMockNotifications();
        notifs.unshift({
          id: `notif-${Date.now()}`,
          user_id: item.broker_id,
          title: 'رفض طلب السحب',
          message: `تم رفض طلب سحب مبلغ ${item.amount} ج.م وإعادة المبلغ لرصيدك.`,
          is_read: false,
          created_at: new Date().toISOString()
        });
        saveMockNotifications(notifs);
      }
    }
    return { data: item, error: null };
  }

  try {
    const { data: request, error: fetchErr } = await supabase
      .from('withdrawal_requests')
      .select('*')
      .eq('id', requestId)
      .single();

    if (fetchErr || !request) return { data: null, error: fetchErr || new Error('الطلب غير موجود.') };

    // Prevent changing from paid or rejected
    if (request.status === 'paid' || request.status === 'rejected') {
      return { data: null, error: new Error('لا يمكن تعديل حالة طلب السحب بعد اكتمال الدفع أو الرفض.') };
    }

    const { data: updated, error: updateErr } = await supabase
      .from('withdrawal_requests')
      .update({ status })
      .eq('id', requestId)
      .select()
      .single();

    if (updateErr) return { data: null, error: updateErr };

    if (status === 'rejected' && request.status !== 'rejected') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', request.broker_id)
        .single();
        
      if (profile) {
        const revertedBalance = Number(profile.balance) + Number(request.amount);
        await supabase
          .from('profiles')
          .update({ balance: revertedBalance })
          .eq('id', request.broker_id);

        // Log transaction
        await supabase.from('wallet_transactions').insert([{
          broker_id: request.broker_id,
          amount: Number(request.amount),
          type: 'withdrawal_refund',
          description: 'إرجاع رصيد لرفض طلب السحب'
        }]);

        await supabase.from('notifications').insert([{
          user_id: request.broker_id,
          title: 'رفض طلب السحب ❌',
          message: `تم رفض طلب سحب مبلغ ${request.amount} ج.م وإعادة الرصيد إلى محفظتك. رصيدك الحالي هو ${revertedBalance} ج.م.`,
          is_read: false
        }]);
      }
    } else if (status === 'paid' && request.status !== 'paid') {
      await supabase.from('notifications').insert([{
        user_id: request.broker_id,
        title: 'تم تحويل رصيدك بنجاح ✅',
        message: `تم تحويل مبلغ ${request.amount} ج.م بنجاح إلى محفظتك الكاش (${request.wallet_number}).`,
        is_read: false
      }]);
    }

    return { data: updated, error: null };
  } catch (error) {
    return { data: null, error };
  }
}



// ─── BROKER VERIFICATION FUNCTIONS ──────────────────────────────────────────

/**
 * السمسار يرسل طلب توثيق حسابه
 */
export async function submitBrokerVerification({ brokerId, fullName, phone, notes, documentImage }) {
  if (isDemoMode) {
    const existing = getMockVerifications().find(v => v.broker_id === brokerId && v.status === 'pending');
    if (existing) return { success: false, error: new Error('يوجد طلب توثيق قيد المراجعة بالفعل.') };

    const newReq = {
      id: `verif-${Date.now()}`,
      broker_id: brokerId,
      full_name: fullName,
      phone,
      notes: notes || '',
      document_image: documentImage || null,
      status: 'pending',
      rejection_reason: null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    const list = getMockVerifications();
    list.unshift(newReq);
    saveMockVerifications(list);
    return { success: true, data: newReq, error: null };
  }

  try {
    // Check for existing pending request
    const { data: existing } = await supabase
      .from('broker_verification_requests')
      .select('id, status')
      .eq('broker_id', brokerId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) return { success: false, error: new Error('يوجد طلب توثيق قيد المراجعة بالفعل.') };

    const { data, error } = await supabase
      .from('broker_verification_requests')
      .insert([{
        broker_id: brokerId,
        full_name: fullName,
        phone,
        notes: notes || '',
        document_image: documentImage || null,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) return { success: false, error };
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * السمسار يشوف حالة طلبه
 */
export async function getBrokerVerificationStatus(brokerId) {
  if (isDemoMode) {
    const list = getMockVerifications();
    // Return the latest request for this broker
    const req = list.filter(v => v.broker_id === brokerId).sort((a, b) => new Date(b.created_at) - new Date(a.created_at))[0] || null;
    return { data: req, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('broker_verification_requests')
      .select('*')
      .eq('broker_id', brokerId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * الأدمن يجيب كل طلبات التوثيق
 */
export async function getAllBrokerVerificationRequests() {
  if (isDemoMode) {
    return { data: getMockVerifications(), error: null };
  }

  try {
    const { data, error } = await supabase
      .from('broker_verification_requests')
      .select(`
        *,
        broker:profiles(full_name, phone, email, is_broker_verified)
      `)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

/**
 * الأدمن يوافق على طلب توثيق سمسار
 */
export async function approveBrokerVerification(requestId, brokerId) {
  if (isDemoMode) {
    const list = getMockVerifications();
    const req = list.find(v => v.id === requestId);
    if (req) {
      req.status = 'approved';
      req.updated_at = new Date().toISOString();
    }
    saveMockVerifications(list);

    // Update profile is_broker_verified
    const profile = mockProfiles.find(p => p.id === brokerId);
    if (profile) profile.is_broker_verified = true;

    // Send notification
    const notifs = getMockNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: brokerId,
      title: '✅ تم توثيق حسابك كسمسار!',
      message: 'تهانينا! تمت مراجعة طلب توثيقك والموافقة عليه. يمكنك الآن رفع شقق على منصة سَكني.',
      is_read: false,
      created_at: new Date().toISOString()
    });
    saveMockNotifications(notifs);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('notifications_change'));

    return { success: true, error: null };
  }

  try {
    const { error: updateReqErr } = await supabase
      .from('broker_verification_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (updateReqErr) return { success: false, error: updateReqErr };

    // Mark broker profile as verified
    const { error: profileErr } = await supabase
      .from('profiles')
      .update({ is_broker_verified: true })
      .eq('id', brokerId);

    if (profileErr) return { success: false, error: profileErr };

    // Send notification to broker
    await supabase.from('notifications').insert([{
      user_id: brokerId,
      title: '✅ تم توثيق حسابك كسمسار!',
      message: 'تهانينا! تمت مراجعة طلب توثيقك والموافقة عليه. يمكنك الآن رفع شقق على منصة سَكني.',
      is_read: false
    }]);

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

/**
 * الأدمن يرفض طلب توثيق مع ذكر السبب
 */
export async function rejectBrokerVerification(requestId, brokerId, reason = '') {
  if (isDemoMode) {
    const list = getMockVerifications();
    const req = list.find(v => v.id === requestId);
    if (req) {
      req.status = 'rejected';
      req.rejection_reason = reason;
      req.updated_at = new Date().toISOString();
    }
    saveMockVerifications(list);

    // Send notification with rejection reason
    const notifs = getMockNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: brokerId,
      title: '❌ تم رفض طلب توثيقك',
      message: reason
        ? `تم رفض طلب توثيق حسابك كسمسار للسبب التالي: ${reason}. يمكنك التقديم مجدداً بعد تصحيح المشكلة.`
        : 'تم رفض طلب توثيق حسابك كسمسار. يمكنك التقديم مجدداً.',
      is_read: false,
      created_at: new Date().toISOString()
    });
    saveMockNotifications(notifs);
    if (typeof window !== 'undefined') window.dispatchEvent(new CustomEvent('notifications_change'));

    return { success: true, error: null };
  }

  try {
    const { error: updateReqErr } = await supabase
      .from('broker_verification_requests')
      .update({
        status: 'rejected',
        rejection_reason: reason,
        updated_at: new Date().toISOString()
      })
      .eq('id', requestId);

    if (updateReqErr) return { success: false, error: updateReqErr };

    // Send notification with reason
    await supabase.from('notifications').insert([{
      user_id: brokerId,
      title: '❌ تم رفض طلب توثيقك',
      message: reason
        ? `تم رفض طلب توثيق حسابك كسمسار للسبب التالي: ${reason}. يمكنك التقديم مجدداً بعد تصحيح المشكلة.`
        : 'تم رفض طلب توثيق حسابك كسمسار. يمكنك التقديم مجدداً.',
      is_read: false
    }]);

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// ─── FEATURED PROPERTY REQUESTS MARKETING ────────────────────────────────────

const defaultMockFeaturedRequests = [
  {
    id: 'req-f1',
    property_id: 'mock-3',
    property: { title: 'استوديو مفروش بالكامل للطلاب - شارع الترعة', location: 'شارع الترعة', price: 2200 },
    user_id: 'mock-broker-2',
    user_name: 'أ. سمير الدسوقي',
    user_phone: '01234509876',
    payment_method: 'wallet',
    status: 'pending',
    created_at: new Date(Date.now() - 3600000).toISOString()
  }
];

function getMockFeaturedRequests() {
  if (typeof window === 'undefined') return defaultMockFeaturedRequests;
  const stored = localStorage.getItem('sakany_featured_requests');
  if (stored) {
    try { return JSON.parse(stored); } catch { return defaultMockFeaturedRequests; }
  }
  localStorage.setItem('sakany_featured_requests', JSON.stringify(defaultMockFeaturedRequests));
  return defaultMockFeaturedRequests;
}

function saveMockFeaturedRequests(list) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakany_featured_requests', JSON.stringify(list));
  }
}

export async function submitFeaturedRequest({ propertyId, userId, paymentMethod }) {
  if (isDemoMode) {
    const list = getMockFeaturedRequests();
    const existing = list.find(r => r.property_id === propertyId && r.status === 'pending');
    if (existing) return { success: false, error: new Error('يوجد طلب تمييز قيد المراجعة بالفعل لهذه الشقة.') };

    const prop = mockProperties.find(p => p.id === propertyId) || { title: 'شقة تجريبية', location: 'حي الجامعة', price: 3000 };
    const userProfile = mockProfiles.find(p => p.id === userId) || { full_name: 'مستخدم تجريبي', phone: '01012345678' };

    const newReq = {
      id: `req-f-${Date.now()}`,
      property_id: propertyId,
      property: { title: prop.title, location: prop.location, price: prop.price },
      user_id: userId,
      user_name: userProfile.full_name,
      user_phone: userProfile.phone,
      payment_method: paymentMethod,
      status: 'pending',
      created_at: new Date().toISOString()
    };
    list.unshift(newReq);
    saveMockFeaturedRequests(list);
    return { success: true, data: newReq, error: null };
  }

  try {
    const { data: existing } = await supabase
      .from('featured_requests')
      .select('id')
      .eq('property_id', propertyId)
      .eq('status', 'pending')
      .maybeSingle();

    if (existing) return { success: false, error: new Error('يوجد طلب تمييز قيد المراجعة بالفعل لهذه الشقة.') };

    const { data, error } = await supabase
      .from('featured_requests')
      .insert([{
        property_id: propertyId,
        user_id: userId,
        payment_method: paymentMethod,
        status: 'pending'
      }])
      .select()
      .single();

    if (error) return { success: false, error };
    return { success: true, data, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function getFeaturedRequests(userId = null) {
  if (isDemoMode) {
    const list = getMockFeaturedRequests();
    if (userId) {
      return { data: list.filter(r => r.user_id === userId), error: null };
    }
    return { data: list, error: null };
  }

  try {
    let query = supabase
      .from('featured_requests')
      .select(`
        *,
        property:property_id(title, location, price),
        user:user_id(full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (userId) {
      query = query.eq('user_id', userId);
    }

    const { data, error } = await query;
    const formatted = data?.map(d => ({
      ...d,
      user_name: d.user?.full_name,
      user_phone: d.user?.phone
    })) || [];

    return { data: formatted, error };
  } catch (error) {
    return { data: null, error };
  }
}

export async function approveFeaturedRequest(requestId, propertyId, brokerId, paymentMethod) {
  if (isDemoMode) {
    const list = getMockFeaturedRequests();
    const req = list.find(r => r.id === requestId);
    if (req) {
      req.status = 'approved';
    }
    saveMockFeaturedRequests(list);

    const prop = mockProperties.find(p => p.id === propertyId);
    if (prop) prop.is_featured = true;

    if (paymentMethod === 'wallet') {
      const bal = getMockBalance(brokerId);
      saveMockBalance(brokerId, Math.max(0, bal - 100));
      logMockTransaction(brokerId, -100, 'featured_deduction', `خصم 100 ج.م لتمييز شقة: ${prop?.title || 'شقة مميزة'}`);
    }

    const notifs = getMockNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: brokerId,
      title: '🚀 تم تمييز شقتك بنجاح!',
      message: paymentMethod === 'wallet'
        ? `تم قبول طلب تمييز الشقة وخصم 100 ج.م من محفظتك. الشقة الآن معروضة كشقة مميزة.`
        : `تم قبول طلب تمييز الشقة بنجاح. الشقة الآن معروضة كشقة مميزة.`,
      is_read: false,
      created_at: new Date().toISOString()
    });
    saveMockNotifications(notifs);

    return { success: true, error: null };
  }

  try {
    const { error: reqErr } = await supabase
      .from('featured_requests')
      .update({ status: 'approved', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (reqErr) return { success: false, error: reqErr };

    const { error: propErr } = await supabase
      .from('properties')
      .update({ is_featured: true })
      .eq('id', propertyId);

    if (propErr) return { success: false, error: propErr };

    if (paymentMethod === 'wallet') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', brokerId)
        .single();
      
      const { data: prop } = await supabase
        .from('properties')
        .select('title')
        .eq('id', propertyId)
        .single();
      
      if (profile) {
        const nextBalance = Math.max(0, Number(profile.balance) - 100);
        await supabase
          .from('profiles')
          .update({ balance: nextBalance })
          .eq('id', brokerId);

        // Log transaction
        await supabase.from('wallet_transactions').insert([{
          broker_id: brokerId,
          amount: -100,
          type: 'featured_deduction',
          description: `خصم 100 ج.م لتمييز شقة: ${prop?.title || 'شقة مميزة'}`
        }]);

        await supabase.from('notifications').insert([{
          user_id: brokerId,
          title: '🚀 تم تمييز شقتك وخصم الرصيد',
          message: `تم قبول طلب التمييز وخصم 100 ج.م من محفظتك بنجاح. رصيدك الحالي هو ${nextBalance} ج.م.`,
          is_read: false
        }]);
      }
    } else {
      await supabase.from('notifications').insert([{
        user_id: brokerId,
        title: '🚀 تم تمييز شقتك بنجاح!',
        message: 'تم قبول طلب تمييز الشقة من قبل الإدارة. شقتك معروضة الآن في الشقق المميزة.',
        is_read: false
      }]);
    }

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

export async function rejectFeaturedRequest(requestId, brokerId) {
  if (isDemoMode) {
    const list = getMockFeaturedRequests();
    const req = list.find(r => r.id === requestId);
    if (req) {
      req.status = 'rejected';
    }
    saveMockFeaturedRequests(list);

    const notifs = getMockNotifications();
    notifs.unshift({
      id: `notif-${Date.now()}`,
      user_id: brokerId,
      title: '❌ تم رفض طلب تمييز شقتك',
      message: 'تم رفض طلب تمييز شقتك من قبل الإدارة. يرجى التواصل معنا لمزيد من التفاصيل.',
      is_read: false,
      created_at: new Date().toISOString()
    });
    saveMockNotifications(notifs);

    return { success: true, error: null };
  }

  try {
    const { error: reqErr } = await supabase
      .from('featured_requests')
      .update({ status: 'rejected', updated_at: new Date().toISOString() })
      .eq('id', requestId);

    if (reqErr) return { success: false, error: reqErr };

    await supabase.from('notifications').insert([{
      user_id: brokerId,
      title: '❌ تم رفض طلب تمييز شقتك',
      message: 'تم رفض طلب تمييز شقتك من قبل الإدارة. يرجى التواصل معنا لمزيد من التفاصيل.',
      is_read: false
    }]);

    return { success: true, error: null };
  } catch (error) {
    return { success: false, error };
  }
}

// ─── WALLET TRANSACTIONS LEDGER ──────────────────────────────────────────────

const defaultMockTransactions = [
  {
    id: 'tx-1',
    broker_id: 'mock-broker-1',
    broker_name: 'كابتن أحمد خالد',
    broker_phone: '01556789123',
    amount: 1250,
    type: 'deposit',
    description: 'شحن رصيد ترحيبي عند تفعيل حساب السمسار',
    created_at: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString()
  }
];

function getMockTransactions() {
  if (typeof window === 'undefined') return defaultMockTransactions;
  const stored = localStorage.getItem('sakany_wallet_transactions');
  if (stored) {
    try { return JSON.parse(stored); } catch { return defaultMockTransactions; }
  }
  localStorage.setItem('sakany_wallet_transactions', JSON.stringify(defaultMockTransactions));
  return defaultMockTransactions;
}

function saveMockTransactions(list) {
  if (typeof window !== 'undefined') {
    localStorage.setItem('sakany_wallet_transactions', JSON.stringify(list));
  }
}

function logMockTransaction(brokerId, amount, type, description) {
  const list = getMockTransactions();
  const broker = mockProfiles.find(p => p.id === brokerId) || { full_name: 'سمسار غير معروف', phone: '' };
  const newTx = {
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    broker_id: brokerId,
    broker_name: broker.full_name,
    broker_phone: broker.phone,
    amount: Number(amount),
    type,
    description,
    created_at: new Date().toISOString()
  };
  list.unshift(newTx);
  saveMockTransactions(list);
}

export async function getWalletTransactions(brokerId = null) {
  if (isDemoMode) {
    const list = getMockTransactions();
    if (brokerId) {
      return { data: list.filter(t => t.broker_id === brokerId), error: null };
    }
    return { data: list, error: null };
  }

  try {
    let query = supabase
      .from('wallet_transactions')
      .select(`
        *,
        broker:broker_id(full_name, phone)
      `)
      .order('created_at', { ascending: false });

    if (brokerId) {
      query = query.eq('broker_id', brokerId);
    }

    const { data, error } = await query;
    const formatted = data?.map(d => ({
      ...d,
      broker_name: d.broker?.full_name,
      broker_phone: d.broker?.phone
    })) || [];

    return { data: formatted, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Get all bookings submitted by a student
export async function getUserBookings(studentId) {
  if (isDemoMode) {
    // In demo mode, fetch student bookings by matching student phone or id
    const profile = mockProfiles.find(p => p.id === studentId);
    const filtered = mockBookingRequests.filter(b => 
      b.student?.phone === profile?.phone || b.student_id === studentId
    );
    return { data: filtered, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .select(`
        *,
        property:property_id(
          id,
          title,
          location,
          price,
          images,
          rent_type,
          available_beds,
          landlord:landlord_id(full_name, phone)
        )
      `)
      .eq('student_id', studentId)
      .order('created_at', { ascending: false });
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

// Cancel a booking request
export async function cancelBookingRequest(bookingId) {
  if (isDemoMode) {
    const booking = mockBookingRequests.find(b => b.id === bookingId);
    if (booking) {
      booking.status = 'canceled';
    }
    return { data: booking, error: null };
  }

  try {
    const { data, error } = await supabase
      .from('booking_requests')
      .update({ status: 'canceled' })
      .eq('id', bookingId)
      .select()
      .single();
    return { data, error };
  } catch (error) {
    return { data: null, error };
  }
}

