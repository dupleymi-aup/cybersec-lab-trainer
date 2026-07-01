import {redirect} from '@/routing';

export default function MainRedirect() {
  redirect({href: '/app', locale: 'ru'});
}
