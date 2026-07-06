import { redirect } from '@/routing';

export default function DashboardRedirect() {
  redirect({ href: '/app', locale: 'ru' });
}
