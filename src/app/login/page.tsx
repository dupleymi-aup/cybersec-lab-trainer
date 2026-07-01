import {redirect} from '@/routing';

export default function LoginRedirect() {
  redirect({href: '/login', locale: 'ru'});
}
