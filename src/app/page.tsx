import {redirect} from '@/routing';

export default function RootPage() {
  redirect({href: '/', locale: 'ru'});
}
