"use client";

import {useTranslations} from "next-intl";
import {Shield, Mail, BookOpen, GraduationCap, Lock, Heart, ChevronRight} from "lucide-react";

function GitHubIcon({ className, ...props }: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} {...props}>
      <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
    </svg>
  );
}
import Link from "next/link";
import {motion} from "framer-motion";

export default function LandingFooter() {
  const t = useTranslations("landing.footer");
  const sections = t.raw("sections") as Record<string, { title: string; links: string[] }>;
  const sectionEntries = Object.entries(sections);
  
  return (
    <footer className="bg-gradient-to-b from-background to-accent/30 border-t border-border/50">
      <div className="container mx-auto px-4 py-16">
        {/* Main Footer Content */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-12 mb-12">
          {/* Brand Section */}
          <div className="lg:col-span-2">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
            >
              <Link href="/" className="flex items-center gap-3 mb-6 group">
                <motion.div 
                  className="flex items-center justify-center w-10 h-10 bg-gradient-to-br from-violet-600 to-violet-700 rounded-xl shadow-lg shadow-violet-600/20 group-hover:shadow-violet-600/40"
                  whileHover={{ scale: 1.05, rotate: 5 }}
                  transition={{ type: "spring", stiffness: 400, damping: 10 }}
                >
                  <Shield className="w-5 h-5 text-white" aria-hidden="true" />
                </motion.div>
                <span className="text-xl font-bold text-foreground">
                  CyberSec{" "}
                  <span className="bg-gradient-to-r from-violet-500 to-emerald-500 bg-clip-text text-transparent">Lab</span>
                </span>
              </Link>
              <p className="text-muted-foreground text-sm leading-relaxed mb-6 max-w-sm">
                {t("description")}
              </p>
              
              {/* Social Links */}
              <div className="flex gap-3 mb-6">
                <motion.a 
                  href="https://github.com" 
                  target="_blank" 
                  rel="noopener noreferrer" 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent hover:bg-violet-500/10 text-muted-foreground hover:text-violet-500 transition-all border border-border hover:border-violet-500/30"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="GitHub"
                >
                  <GitHubIcon className="w-5 h-5" aria-hidden="true" />
                </motion.a>
                <motion.a 
                  href="mailto:contact@cyberseclab.ru" 
                  className="flex items-center justify-center w-10 h-10 rounded-xl bg-accent hover:bg-emerald-500/10 text-muted-foreground hover:text-emerald-500 transition-all border border-border hover:border-emerald-500/30"
                  whileHover={{ scale: 1.1, y: -2 }}
                  whileTap={{ scale: 0.95 }}
                  aria-label="Email"
                >
                  <Mail className="w-5 h-5" aria-hidden="true" />
                </motion.a>
              </div>
              
              {/* Made with love */}
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <span>Сделано с</span>
                <Heart className="w-3 h-3 text-red-500 fill-red-500 animate-pulse" />
                <span>для образования</span>
              </div>
            </motion.div>
          </div>

          {/* Navigation Sections */}
          <nav aria-label="Footer navigation" className="lg:col-span-4 grid grid-cols-2 md:grid-cols-4 gap-8 col-span-full">
            {sectionEntries.map(([key, section], index) => (
              <motion.div 
                key={section.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
              >
                <h4 className="text-foreground font-semibold mb-4 flex items-center gap-2">
                  {key === "platform" && <Shield className="w-4 h-4 text-violet-500" />}
                  {key === "resources" && <BookOpen className="w-4 h-4 text-emerald-500" />}
                  {key === "company" && <GraduationCap className="w-4 h-4 text-cyan-500" />}
                  {key === "legal" && <Lock className="w-4 h-4 text-amber-500" />}
                  {section.title}
                </h4>
                <ul className="space-y-3">
                  {section.links.map((link, linkIndex) => {
                    // Map links to actual routes
                    let href = "#";
                    if (link === "Модули" || link === "Modules") href = "/#demo";
                    if (link === "Возможности" || link === "Features") href = "/#features";
                    if (link === "Цены" || link === "Pricing") href = "/pricing";
                    if (link === "LTI-интеграция" || link === "LTI Integration") href = "/#features";
                    if (link === "О нас" || link === "About") href = "/about";
                    if (link === "Контакты" || link === "Contact") href = "/contact";
                    if (link === "Карьера" || link === "Careers") href = "/about";
                    if (link === "Партнёры" || link === "Partners") href = "/about";
                    
                    const isExternal = href.startsWith("http");
                    
                    return (
                      <li key={link}>
                        <motion.a
                          href={href}
                          className="text-muted-foreground text-sm flex items-center gap-2 hover:text-foreground transition-colors group"
                          initial={{ opacity: 0, x: -5 }}
                          whileInView={{ opacity: 1, x: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: index * 0.1 + linkIndex * 0.05 }}
                          whileHover={{ x: 3 }}
                          target={isExternal ? "_blank" : undefined}
                          rel={isExternal ? "noopener noreferrer" : undefined}
                        >
                          <ChevronRight className="w-3 h-3 text-violet-500 group-hover:text-violet-600" />
                          {link}
                        </motion.a>
                      </li>
                    );
                  })}
                </ul>
              </motion.div>
            ))}
          </nav>
        </div>

        {/* Bottom Bar */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="border-t border-border pt-8"
        >
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <p className="text-muted-foreground text-sm">
              {t("copyright")} {new Date().getFullYear()}
            </p>
            
            {/* Stats */}
            <div className="flex items-center gap-6">
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground text-sm px-3 py-1.5 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <BookOpen className="w-4 h-4 text-violet-500" aria-hidden="true" />
                <span>{t("statsModules")}</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground text-sm px-3 py-1.5 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <GraduationCap className="w-4 h-4 text-emerald-500" aria-hidden="true" />
                <span>{t("statsStudents")}</span>
              </motion.div>
              <motion.div 
                className="flex items-center gap-2 text-muted-foreground text-sm px-3 py-1.5 rounded-lg bg-accent/30 hover:bg-accent/50 transition-colors"
                whileHover={{ scale: 1.05 }}
              >
                <Lock className="w-4 h-4 text-cyan-500" aria-hidden="true" />
                <span>{t("statsQuizzes")}</span>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </div>
    </footer>
  );
}
