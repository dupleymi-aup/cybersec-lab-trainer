import { cookies } from 'next/headers';
import { redirect } from '@/routing';
import { routing } from '@/routing';

export default async function RootPage() {
  const cookieStore = await cookies();
  const localeCookie = cookieStore.get('NEXT_LOCALE')?.value;
  const locales: readonly string[] = routing.locales;
  const locale = localeCookie && locales.includes(localeCookie) ? localeCookie : routing.defaultLocale;
  redirect({ href: '/', locale });
}
