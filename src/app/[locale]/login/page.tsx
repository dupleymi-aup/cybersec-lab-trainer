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

  const login = useAuthStore(s => s.login);

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
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-cyan-500/10 rounded-full blur-3xl" />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative w-full max-w-md"
      >
        <div className="text-center mb-8">
          <Link href={`/${locale}`} className="inline-flex items-center justify-center w-16 h-16 bg-violet-600 rounded-2xl mb-3 shadow-lg shadow-violet-600/20 hover:bg-violet-700 transition">
            <Shield className="w-8 h-8 text-white" />
          </Link>
          <h1 className="text-2xl font-bold text-foreground">{t('brand.name')}</h1>
          <p className="text-muted-foreground text-sm mt-1">{t('brand.tagline')}</p>
        </div>

        <Card className="backdrop-blur-xl shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="text-xl">{t('login.title')}</CardTitle>
            <CardDescription>
              {t('login.subtitle')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleLogin} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="login-contact">
                  {t('login.contact')}
                </Label>
                <Input
                  id="login-contact"
                  value={contact}
                  onChange={(e) => setContact(e.target.value)}
                  placeholder={t('login.contactPlaceholder')}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="login-password">
                  {t('login.password')}
                </Label>
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
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
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
                  <Label htmlFor="remember-me" className="text-sm cursor-pointer">
                    {t('login.rememberMe')}
                  </Label>
                </div>
                <Link
                  href={`/${locale}/recovery`}
                  className="text-sm text-primary hover:text-primary/80"
                >
                  {t('login.forgotPassword')}
                </Link>
              </div>
              <Button type="submit" className="w-full bg-violet-600 hover:bg-violet-700" disabled={loading}>
                {loading ? t('login.submitting') : t('login.submit')}
              </Button>
            </form>

            <div className="mt-6 pt-4 border-t border-border text-center text-sm space-y-2">
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
