export default function robots() {
  const baseUrl = 'https://sakany-mansoura.vercel.app';

  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/dashboard', '/auth/reset-password'],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
