'use client';

import { useState } from 'react';
import { useAuthStore } from '@/lib/auth-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useTranslations, useLocale } from 'next-intl';

export default function LoginPage() {
  const t = useTranslations('auth');
  const locale = useLocale();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [contact, setContact] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);

  const login = useAuthStore((s) => s.login);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!contact || !password) {
      toast.error(t('validation.allFieldsRequired'));
      return;
    }
    setLoading(true);
    const result = await login(contact, password, rememberMe);
    setLoading(false);
    if (!result.success) {
      toast.error(result.error);
    } else {
      router.push(`/${locale}/app`);
    }
  };

  return (
    <div className="bg-background flex min-h-screen items-center justify-center p-4">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute top-1/4 left-1/4 h-96 w-96 rounded-full bg-violet-500/10 blur-3xl" />
        <div className="absolute right-1/4 bottom-1/4 h-96 w-96 rounded-full bg-cyan-500/10 blur-3xl" />
      </div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="relative w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href={`/${locale}`}
            className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-violet-600 shadow-lg shadow-violet-600/20 transition hover:bg-violet-700"
          >
            <Shield className="h-8 w-8 text-white" />
          </Link>
          <h1 className="text-foreground text-2xl font-bold">{t('brand.name')}</h1>
          <p className="text-muted-foreground mt-1 text-sm">{t('brand.tagline')}</p>
        </div>

        <Card className="shadow-xl backdrop-blur-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t('login.title')}</CardTitle>
            <CardDescription>{t('login.subtitle')}</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-contact">{t('login.contact')}</Label>
                <Input
                  id="login-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t('login.contactPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">{t('login.password')}</Label>
                <div className="relative">
                  <Input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder={t('login.passwordPlaceholder')}
                    className="pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? t('login.hidePassword') : t('login.showPassword')}
                    className="text-muted-foreground hover:text-foreground absolute top-1/2 right-3 -translate-y-1/2"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Checkbox
                    id="remember-me"
                    checked={rememberMe}
                    onCheckedChange={(checked) => setRememberMe(!!checked)}
                  />
                  <Label htmlFor="remember-me" className="cursor-pointer text-sm">
                    {t('login.rememberMe')}
                  </Label>
                </div>
                <Link href={`/${locale}/recovery`} className="text-primary hover:text-primary/80 text-sm">
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <div className="border-border mt-6 space-y-2 border-t pt-4 text-center text-sm">
              <p className="text-muted-foreground">
                {t('login.noAccount')}{' '}
                <Link href={`/${locale}/register`} className="text-primary hover:text-primary/80 font-medium">
                  {t('login.registerLink')}
                </Link>
              </p>
              <p className="text-muted-foreground">
                <Link href={`/${locale}`} className="text-muted-foreground hover:text-foreground">
                  {t('login.backToHome')}
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
}
