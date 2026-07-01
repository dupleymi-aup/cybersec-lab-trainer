import {redirect} from '@/routing';

export default function RootOfflinePage() {
  redirect({href: '/offline', locale: 'ru'});
}
