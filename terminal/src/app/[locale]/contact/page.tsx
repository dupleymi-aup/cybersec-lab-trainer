"use client";

import {useTranslations} from "next-intl";
import {motion} from "framer-motion";
import {Mail, MessageSquare, Phone, MapPin, Send, Clock, Shield, CheckCircle} from "lucide-react";
import {useState} from "react";
import LandingHeader from "@/components/landing/LandingHeader";
import LandingFooter from "@/components/landing/LandingFooter";
import LanguageSwitcher from "@/components/landing/LanguageSwitcher";

const contactMethods = [
  {
    icon: Mail,
    title: "Email",
    value: "info@cyberseclab.ru",
    description: "Ответим в течение 24 часов",
    color: "from-violet-500 to-purple-600"
  },
  {
    icon: MessageSquare,
    title: "Чат",
    value: "Онлайн чат",
    description: "Пн-Пт 9:00 - 18:00 МСК",
    color: "from-emerald-500 to-teal-600"
  },
  {
    icon: Phone,
    title: "Телефон",
    value: "+7 (495) 123-45-67",
    description: "Пн-Пт 10:00 - 17:00 МСК",
    color: "from-cyan-500 to-blue-600"
  },
  {
    icon: MapPin,
    title: "Офис",
    value: "Москва, Россия",
    description: "По предварительной записи",
    color: "from-amber-500 to-orange-600"
  }
];

const faqItems = [
  {
    question: "Как получить доступ для учебного заведения?",
    answer: "Заполните форму и мы свяжемся с вами для обсуждения условий сотрудничества."
  },
  {
    question: "Есть ли скидки для студентов?",
    answer: "Да, базовые модули бесплатны. Расширенные функции доступны по льготной подписке."
  },
  {
    question: "Можно ли интегрировать с моей LMS?",
    answer: "Да, поддерживаем интеграцию через LTI 1.3 с Moodle, Canvas и другими системами."
  }
];

export default function ContactPage() {
  const t = useTranslations("contact");
  const [formState, setFormState] = useState({
    name: "",
    email: "",
    subject: "",
    message: "",
    submitted: false
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormState(prev => ({ ...prev, submitted: true }));
    setTimeout(() => {
      setFormState({ name: "", email: "", subject: "", message: "", submitted: false });
    }, 3000);
  };

  return (
    <div className="min-h-screen bg-background">
      <LanguageSwitcher />
      <LandingHeader />
      
      <main id="main-content">
        {/* Hero */}
        <section className="relative py-20 md:py-32 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-3xl" />
            <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-emerald-500/10 rounded-full blur-3xl" />
          </div>

          <div className="container mx-auto px-4 relative z-10">
            <motion.div
              initial={{opacity: 0, y: 30}}
              animate={{opacity: 1, y: 0}}
              transition={{duration: 0.6}}
              className="text-center max-w-4xl mx-auto"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-violet-500/10 border border-violet-500/20 mb-6">
                <Mail className="w-4 h-4 text-violet-500" />
                <span className="text-sm font-medium text-violet-600 dark:text-violet-400">
                  {t("badge")}
                </span>
              </div>

              <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6">
                <span className="text-foreground">{t("title")}</span>
              </h1>

              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                {t("subtitle")}
              </p>
            </motion.div>
          </div>
        </section>

        {/* Contact Methods */}
        <section className="py-20 bg-gradient-to-b from-background via-accent/5 to-background">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
              {contactMethods.map((method, index) => (
                <motion.div
                  key={method.title}
                  initial={{opacity: 0, y: 30}}
                  whileInView={{opacity: 1, y: 0}}
                  viewport={{once: true}}
                  transition={{delay: index * 0.1}}
                  whileHover={{y: -5}}
                  className="p-6 rounded-2xl bg-gradient-to-br from-background to-accent/20 border border-border hover:border-violet-500/30 transition-all"
                >
                  <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${method.color} flex items-center justify-center mb-4`}>
                    <method.icon className="w-7 h-7 text-white" />
                  </div>
                  <h3 className="text-lg font-bold mb-2 text-foreground">{method.title}</h3>
                  <p className="text-violet-600 dark:text-violet-400 font-medium mb-1">{method.value}</p>
                  <p className="text-sm text-muted-foreground">{method.description}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact Form & Info */}
        <section className="py-20">
          <div className="container mx-auto px-4">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 max-w-6xl mx-auto">
              {/* Form */}
              <motion.div
                initial={{opacity: 0, x: -30}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                className="order-2 lg:order-1"
              >
                <h2 className="text-2xl font-bold mb-6 text-foreground">{t("form.title")}</h2>
                
                {formState.submitted ? (
                  <div className="p-8 rounded-2xl bg-gradient-to-br from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 text-center">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                      <CheckCircle className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 text-foreground">{t("form.success")}</h3>
                    <p className="text-muted-foreground">{t("form.description")}</p>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">{t("form.name")}</label>
                      <input
                        type="text"
                        value={formState.name}
                        onChange={(e) => setFormState(prev => ({ ...prev, name: e.target.value }))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                        placeholder={t("form.namePlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">{t("form.email")}</label>
                      <input
                        type="email"
                        value={formState.email}
                        onChange={(e) => setFormState(prev => ({ ...prev, email: e.target.value }))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                        placeholder={t("form.emailPlaceholder")}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">{t("form.subject")}</label>
                      <select
                        value={formState.subject}
                        onChange={(e) => setFormState(prev => ({ ...prev, subject: e.target.value }))}
                        required
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all"
                      >
                        <option value="">{t("form.subjectSelect")}</option>
                        <option value="partnership">{t("form.subjects.partnership")}</option>
                        <option value="education">{t("form.subjects.education")}</option>
                        <option value="support">{t("form.subjects.support")}</option>
                        <option value="other">{t("form.subjects.other")}</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2 text-foreground">{t("form.message")}</label>
                      <textarea
                        value={formState.message}
                        onChange={(e) => setFormState(prev => ({ ...prev, message: e.target.value }))}
                        required
                        rows={5}
                        className="w-full px-4 py-3 rounded-xl bg-background border border-border focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all resize-none"
                        placeholder={t("form.messagePlaceholder")}
                      />
                    </div>
                    <button
                      type="submit"
                      className="w-full py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg shadow-violet-600/25 hover:shadow-violet-600/40 flex items-center justify-center gap-2"
                    >
                      <Send className="w-5 h-5" />
                      {t("form.submit")}
                    </button>
                  </form>
                )}
              </motion.div>

              {/* Info */}
              <motion.div
                initial={{opacity: 0, x: 30}}
                whileInView={{opacity: 1, x: 0}}
                viewport={{once: true}}
                className="order-1 lg:order-2 space-y-8"
              >
                <div>
                  <h2 className="text-2xl font-bold mb-6 text-foreground">{t("info.title")}</h2>
                  <div className="space-y-4">
                    {faqItems.map((item, index) => (
                      <div key={index} className="p-5 rounded-xl bg-gradient-to-br from-background to-accent/20 border border-border">
                        <h3 className="font-semibold mb-2 text-foreground flex items-start gap-2">
                          <Shield className="w-5 h-5 text-violet-500 mt-0.5 shrink-0" />
                          {item.question}
                        </h3>
                        <p className="text-muted-foreground ml-7">{item.answer}</p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="p-6 rounded-2xl bg-gradient-to-br from-violet-500/10 to-purple-500/10 border border-violet-500/20">
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shrink-0">
                      <Clock className="w-6 h-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold mb-2 text-foreground">{t("info.hours.title")}</h3>
                      <p className="text-muted-foreground mb-1">{t("info.hours.weekdays")}</p>
                      <p className="text-muted-foreground">{t("info.hours.weekend")}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </section>
      </main>

      <LandingFooter />
    </div>
  );
}
