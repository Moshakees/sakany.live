import "./globals.css";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import FloatingCallButton from "@/components/FloatingCallButton";

export const metadata = {
  title: "سَكني | سكن الطلاب والطالبات في المنصورة - موثق وآمن",
  description: "المنصة الأكثر أماناً للبحث عن شقق وسكن للطلاب والطالبات في المنصورة. تواصل مباشر مع الملاك وسكن موثق 100% يقضي على السماسرة والنصب.",
  robots: "index, follow",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "سَكني",
  },
  openGraph: {
    title: "سَكني | سكن الطلاب والطالبات في المنصورة",
    description: "تصفح مئات الشقق الموثقة للطلاب في المنصورة بالقرب من الجامعة. سكن موثق وآمن يضمن حقوق الجميع.",
    type: "website",
    locale: "ar_EG",
    siteName: "سكني"
  }
};

export const viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }) {
  return (
    <html lang="ar" dir="rtl">
      <body>
        <Navbar />
        <main style={{ display: 'flex', flexDirection: 'column', flex: 1 }}>
          {children}
        </main>
        <FloatingCallButton />
      </body>
    </html>
  );
}
