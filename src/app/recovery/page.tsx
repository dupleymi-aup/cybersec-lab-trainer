import { redirect } from '@/routing';

export default function RecoveryRedirect() {
  redirect({ href: '/login', locale: 'ru' });
}
