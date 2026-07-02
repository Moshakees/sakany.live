import { redirect } from 'next/navigation';

export default async function ShortLinkRedirectPage({ params }) {
  const { id } = await params;
  redirect(`/properties/${id}`);
}
