'use client';

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { Eye, EyeOff } from 'lucide-react';

interface OTPModalProps {
  otp: string;
  onSubmit: (otp: string) => void;
  onClose: () => void;
  onResend?: () => void;
}

export default function OTPModal({ otp, onSubmit, onClose, onResend }: OTPModalProps) {
  const [digits, setDigits] = useState<string[]>(['', '', '', '', '', '']);
  const [showOtp, setShowOtp] = useState(false);
  const [cooldown, setCooldown] = useState(30);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  const cooldownRef = useRef(cooldown);
  useEffect(() => {
    cooldownRef.current = cooldown;
  }, [cooldown]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) {
          clearInterval(timer);
          return 0;
        }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
  }, []);

  const handleChange = (index: number, value: string) => {
    if (!/^\d?$/.test(value)) return;
    const newDigits = [...digits];
    newDigits[index] = value;
    setDigits(newDigits);

    if (value && index < 5) {
      inputsRef.current[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index] && index > 0) {
      inputsRef.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').slice(0, 6);
    if (!/^\d+$/.test(pasted)) return;
    const newDigits = [...digits];
    for (let i = 0; i < pasted.length && i < 6; i++) {
      newDigits[i] = pasted[i];
    }
    setDigits(newDigits);
    const focusIndex = Math.min(pasted.length, 5);
    inputsRef.current[focusIndex]?.focus();
  };

  const handleSubmit = () => {
    const code = digits.join('');
    if (code.length !== 6) {
      toast.error('Введите все 6 цифр');
      return;
    }
    onSubmit(code);
  };

  const handleResend = () => {
    if (cooldown > 0) return;
    setCooldown(30);
    setDigits(['', '', '', '', '', '']);
    onResend?.();
    inputsRef.current[0]?.focus();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-card w-full max-w-sm rounded-2xl p-6 shadow-xl">
        <h3 className="mb-2 text-center text-xl font-bold text-slate-900">Введите код подтверждения</h3>
        <p className="text-muted-foreground mb-4 text-center text-sm">
          Мы отправили 6-значный код для восстановления доступа
        </p>

        <div className="mb-4 flex justify-center gap-2" onPaste={handlePaste}>
          {digits.map((digit, i) => (
            <Input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(i, e.target.value)}
              onKeyDown={(e) => handleKeyDown(i, e)}
              className="border-border h-14 w-12 rounded-xl border-2 text-center text-2xl font-bold focus:border-violet-500 focus:ring-violet-500"
            />
          ))}
        </div>

        <div className="mb-4 text-center">
          <button
            type="button"
            onClick={() => setShowOtp(!showOtp)}
            className="bg-muted inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs text-slate-400 transition hover:bg-slate-200"
          >
            {showOtp ? (
              <>
                <EyeOff className="h-3 w-3" />
                <span className="text-foreground/70 font-mono">{otp}</span>
                <span className="text-muted-foreground">скрыть</span>
              </>
            ) : (
              <>
                <Eye className="h-3 w-3" />
                Показать код
              </>
            )}
          </button>
        </div>

        <Button onClick={handleSubmit} className="mb-3 w-full">
          Подтвердить
        </Button>

        <div className="flex items-center justify-between text-sm">
          <button
            type="button"
            onClick={handleResend}
            disabled={cooldown > 0}
            className={`text-violet-600 ${cooldown > 0 ? 'cursor-not-allowed opacity-50' : 'hover:underline'}`}
          >
            Отправить снова {cooldown > 0 ? `(${cooldown}с)` : ''}
          </button>
          <button type="button" onClick={onClose} className="text-muted-foreground hover:text-foreground/70">
            Отмена
          </button>
        </div>
      </div>
    </div>
  );
}
