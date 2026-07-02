import { getProperties } from '@/utils/supabase';

export default async function sitemap() {
  // Replace with the production domain on Vercel
  const baseUrl = 'https://sakany-mansoura.vercel.app'; 

  // Fetch all active properties to map them dynamically
  const { data: properties } = await getProperties();

  const propertyUrls = (properties || []).map((property) => ({
    url: `${baseUrl}/properties/${property.id}`,
    lastModified: new Date(property.created_at || Date.now()),
    changeFrequency: 'weekly',
    priority: 0.8,
  }));

  return [
    {
      url: baseUrl,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${baseUrl}/auth`,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.5,
    },
    ...propertyUrls,
  ];
}
