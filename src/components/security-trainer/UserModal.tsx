"use client";

import { useState, useEffect, useCallback } from "react";
import {
  type User,
  type UserRole,
  getRoleLabel,
  createUser,
  updateUser,
} from "@/lib/auth-store";
import {
  validateEmail,
  validatePhone,
  validatePassword,
} from "@/lib/auth-utils";
import { usePasswordStrength } from "@/hooks/use-password-strength";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { AnimatePresence, motion } from "framer-motion";
import {
  X,
  Eye,
  EyeOff,
  GraduationCap,
  Briefcase,
  Shield,
  Check,
} from "lucide-react";
import { toast } from "sonner";

const roleIcons: Record<UserRole, React.ReactNode> = {
  student: <GraduationCap size={16} className="text-violet-500" />,
  teacher: <Briefcase size={16} className="text-amber-500" />,
  admin: <Shield size={16} className="text-red-500" />,
};

const roleBorderColors: Record<UserRole, string> = {
  student: "has-[:checked]:border-violet-500 has-[:checked]:bg-violet-50",
  teacher: "has-[:checked]:border-amber-500 has-[:checked]:bg-amber-50",
  admin: "has-[:checked]:border-red-500 has-[:checked]:bg-red-50",
};

interface UserModalProps {
  mode: "create" | "edit";
  user?: User | null;
  onClose: () => void;
  onSuccess: () => void;
}

export default function UserModal({
  mode,
  user,
  onClose,
  onSuccess,
}: UserModalProps) {
  // Create fields
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [role, setRole] = useState<UserRole>("student");
  const [group, setGroup] = useState("");
  const [course, setCourse] = useState("");
  const [university, setUniversity] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Edit fields
  const [editFullName, setEditFullName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPhone, setEditPhone] = useState("");
  const [editGroup, setEditGroup] = useState("");
  const [editCourse, setEditCourse] = useState("");
  const [editUniversity, setEditUniversity] = useState("");
  const [editBio, setEditBio] = useState("");

  const pwStrength = usePasswordStrength(password);

  useEffect(() => {
    if (mode === "edit" && user) {
      setEditFullName(user.fullName);
      setEditEmail(user.email);
      setEditPhone(user.phone);
      setEditGroup(user.group);
      setEditCourse(user.course);
      setEditUniversity(user.university);
      setEditBio(user.bio);
    }
  }, [mode, user]);

  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [handleEscape]);

  const handleCreate = async () => {
    if (!fullName.trim()) {
      toast.error("Введите имя");
      return;
    }
    if (!validateEmail(email)) {
      toast.error("Неверный email");
      return;
    }
    if (!validatePhone(phone)) {
      toast.error("Неверный телефон");
      return;
    }
    if (password !== confirmPassword) {
      toast.error("Пароли не совпадают");
      return;
    }

    const pwCheck = validatePassword(password);
    if (!pwCheck.valid) {
      toast.error(pwCheck.errors.join(", "));
      return;
    }

    const result = await createUser(
      { email, phone, fullName, role, group, course, university, inviteCode },
      password,
    );
    if (result.success) {
      toast.success("Пользователь создан");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  const handleEdit = async () => {
    if (!user) return;
    if (!editFullName.trim()) {
      toast.error("Имя не может быть пустым");
      return;
    }
    if (!validateEmail(editEmail)) {
      toast.error("Неверный email");
      return;
    }
    if (!validatePhone(editPhone)) {
      toast.error("Неверный телефон");
      return;
    }

    const result = await updateUser(user.id, {
      fullName: editFullName,
      email: editEmail,
      phone: editPhone,
      group: editGroup,
      course: editCourse,
      university: editUniversity,
      bio: editBio,
    });
    if (result.success) {
      toast.success("Профиль обновлён");
      onSuccess();
    } else {
      toast.error(result.error);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 20 }}
        className="bg-card rounded-2xl shadow-xl p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-bold">
            {mode === "create"
              ? "Создание пользователя"
              : "Редактирование профиля"}
          </h2>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Закрыть"
          >
            <X size={18} />
          </Button>
        </div>

        {mode === "create" ? (
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>Имя *</Label>
              <Input
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Иванов Иван"
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="user@example.com"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон *</Label>
                <Input
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+79001234567"
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <Label>Пароль *</Label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Минимум 8 символов"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {password && (
                <div className="space-y-1.5">
                  <div className="flex items-center gap-2">
                    <Progress
                      value={pwStrength.score}
                      className="h-1.5 flex-1"
                    />
                    <span className="text-[10px] text-muted-foreground">
                      {pwStrength.label}
                    </span>
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {pwStrength.checks.map((check, i) => (
                      <Badge
                        key={i}
                        variant="outline"
                        className={`text-[9px] px-1 py-0 ${check.passed ? "border-emerald-300 text-emerald-700 bg-emerald-50" : "border-border text-slate-400"}`}
                      >
                        {check.passed && <Check size={8} className="mr-0.5" />}
                        {check.label}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="space-y-1.5">
              <Label>Подтверждение пароля *</Label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Повторите пароль"
                />
                <button
                  type="button"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-muted-foreground"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={16} />
                  ) : (
                    <Eye size={16} />
                  )}
                </button>
              </div>
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-red-500">Пароли не совпадают</p>
              )}
            </div>

            {/* Role Selection */}
            <div className="space-y-1.5">
              <Label>Роль</Label>
              <RadioGroup
                value={role}
                onValueChange={(v) => setRole(v as UserRole)}
                className="space-y-2"
              >
                {(["student", "teacher", "admin"] as UserRole[]).map((r) => (
                  <div
                    key={r}
                    className={`flex items-center gap-3 p-3 border-2 rounded-xl transition-colors ${roleBorderColors[r]}`}
                  >
                    <RadioGroupItem value={r} id={`role-${r}`} />
                    <label
                      htmlFor={`role-${r}`}
                      className="flex items-center gap-2 cursor-pointer flex-1"
                    >
                      {roleIcons[r]}
                      <span className="text-sm font-medium">
                        {getRoleLabel(r)}
                      </span>
                    </label>
                  </div>
                ))}
              </RadioGroup>
            </div>

            {/* Admin Invite Code */}
            <AnimatePresence>
              {role === "admin" && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-1.5"
                >
                  <Label>Код приглашения администратора *</Label>
                  <Input
                    value={inviteCode}
                    onChange={(e) => setInviteCode(e.target.value)}
                    placeholder="Введите код приглашения"
                  />
                </motion.div>
              )}
            </AnimatePresence>

            {/* Group, Course, University */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Группа</Label>
                <Input
                  value={group}
                  onChange={(e) => setGroup(e.target.value)}
                  placeholder="ИС-101"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Курс</Label>
                <Input
                  value={course}
                  onChange={(e) => setCourse(e.target.value)}
                  placeholder="2"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Университет</Label>
                <Input
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  placeholder="МГУ"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleCreate} className="flex-1">
                Создать
              </Button>
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {/* Full Name */}
            <div className="space-y-1.5">
              <Label>Имя *</Label>
              <Input
                value={editFullName}
                onChange={(e) => setEditFullName(e.target.value)}
              />
            </div>

            {/* Email + Phone */}
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Телефон *</Label>
                <Input
                  value={editPhone}
                  onChange={(e) => setEditPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Group, Course, University */}
            <div className="grid grid-cols-3 gap-3">
              <div className="space-y-1.5">
                <Label>Группа</Label>
                <Input
                  value={editGroup}
                  onChange={(e) => setEditGroup(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Курс</Label>
                <Input
                  value={editCourse}
                  onChange={(e) => setEditCourse(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Университет</Label>
                <Input
                  value={editUniversity}
                  onChange={(e) => setEditUniversity(e.target.value)}
                />
              </div>
            </div>

            {/* Bio */}
            <div className="space-y-1.5">
              <Label>О себе</Label>
              <textarea
                value={editBio}
                onChange={(e) => setEditBio(e.target.value)}
                rows={3}
                className="w-full px-3 py-2 border border-border rounded-lg text-sm resize-none focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                placeholder="Расскажите о себе..."
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <Button onClick={handleEdit} className="flex-1">
                Сохранить
              </Button>
              <Button variant="outline" onClick={onClose}>
                Отмена
              </Button>
            </div>
          </div>
        )}
      </motion.div>
    </div>
  );
}
