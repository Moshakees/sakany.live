import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file) {
      return NextResponse.json({ error: 'لم يتم إرسال أي ملف فيديو.' }, { status: 400 });
    }

    const accessKey = process.env.IA_ACCESS_KEY || process.env.NEXT_PUBLIC_IA_ACCESS_KEY || 'ygr8f4e0VX2LDvtM';
    const secretKey = process.env.IA_SECRET_KEY || process.env.NEXT_PUBLIC_IA_SECRET_KEY || 'nuXpq1GBuCydsqpp';

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Sanitize file name and create a unique identifier
    const originalName = file.name || 'property-video.mp4';
    const cleanFileName = originalName.replace(/[^a-zA-Z0-9._-]/g, '_');
    const identifier = `sakany-video-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    
    // Internet Archive S3 endpoint
    const iaUploadUrl = `https://s3.us.archive.org/${identifier}/${cleanFileName}`;

    const res = await fetch(iaUploadUrl, {
      method: 'PUT',
      headers: {
        'authorization': `LOW ${accessKey}:${secretKey}`,
        'x-archive-auto-make-bucket': '1',
        'x-archive-meta-mediatype': 'movies',
        'x-archive-meta-title': `Sakany Property Video ${identifier}`,
        'x-archive-meta-collection': 'opensource_movies',
        'Content-Type': file.type || 'video/mp4',
      },
      body: buffer
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error('Internet Archive upload failed:', errText);
      return NextResponse.json({ error: 'فشل الرفع إلى Internet Archive. تحقق من صحة المفاتيح.' }, { status: 500 });
    }

    const directUrl = `https://archive.org/download/${identifier}/${cleanFileName}`;

    return NextResponse.json({
      success: true,
      url: directUrl,
      directUrl: directUrl,
      identifier: identifier
    });
  } catch (error) {
    console.error('Archive API Route Error:', error);
    return NextResponse.json({ error: error.message || 'حدث خطأ غير متوقع أثناء الرفع.' }, { status: 500 });
  }
}
