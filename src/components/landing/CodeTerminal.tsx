"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Terminal, X, Minus, Square } from "lucide-react";
import { useTranslations } from "next-intl";

const codeLines = [
  { text: "// comment", color: "text-muted-foreground" },
  { text: "", color: "" },
  { text: "app.post('/login', (req, res) => {", color: "text-violet-500" },
  {
    text: "  const { username, password } = req.body;",
    color: "text-foreground/80",
  },
  { text: "", color: "" },
  { text: "  const query = `", color: "text-foreground/80" },
  { text: "    SELECT * FROM users", color: "text-emerald-500" },
  { text: "    WHERE username = '${username}'", color: "text-amber-500" },
  { text: "    AND password = '${password}'`", color: "text-red-500" },
  { text: "", color: "" },
  { text: "  //  SQL Injection!", color: "text-red-500" },
  { text: "  db.query(query, (err, result) => {", color: "text-foreground/80" },
  { text: "    if (result.length > 0) {", color: "text-foreground/80" },
  { text: "      req.session.user = result[0];", color: "text-foreground/80" },
  { text: "      res.redirect('/dashboard');", color: "text-foreground/80" },
  { text: "    }", color: "text-foreground/80" },
  { text: "  });", color: "text-foreground/80" },
  { text: "});", color: "text-violet-500" },
];

export default function CodeTerminal() {
  const t = useTranslations("landing.codeTerminal");
  const [displayedLines, setDisplayedLines] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (displayedLines < codeLines.length) {
      const timeout = setTimeout(() => setDisplayedLines((d) => d + 1), 120);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
    }
  }, [displayedLines, isMounted]);

  useEffect(() => {
    if (!isMounted || !isComplete) return;
    const timeout = setTimeout(() => setDisplayedLines(0), 4000);
    return () => clearTimeout(timeout);
  }, [isComplete, isMounted]);

  if (!isMounted) {
    return (
      <div
        className="w-full max-w-xl mx-auto"
        role="img"
        aria-label="Code terminal"
      >
        <div className="rounded-xl overflow-hidden bg-card border border-border shadow-2xl shadow-violet-500/10">
          <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-muted-foreground text-sm">
              <Terminal className="w-4 h-4" aria-hidden="true" />
              <span>vulnerability.js</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="w-4 h-4 text-muted-foreground" />
              <Square className="w-3.5 h-3.5 text-muted-foreground" />
              <X className="w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          <div
            className="p-4 font-mono text-sm leading-relaxed min-h-[320px]"
            aria-hidden="true"
          />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-xl mx-auto"
      role="img"
      aria-label="Animated code terminal"
    >
      <div className="rounded-xl overflow-hidden bg-card border border-border shadow-2xl shadow-violet-500/10">
        <div className="flex items-center justify-between px-4 py-3 bg-muted/50 border-b border-border">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Terminal className="w-4 h-4" aria-hidden="true" />
            <span>vulnerability.js</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-4 h-4 text-muted-foreground" />
            <Square className="w-3.5 h-3.5 text-muted-foreground" />
            <X className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>
        <div className="p-4 font-mono text-sm leading-relaxed min-h-[320px]">
          {codeLines.slice(0, displayedLines).map((line, index) => (
            <div key={index} className="flex">
              <span className="text-muted-foreground/40 w-8 mr-4 text-right select-none flex-shrink-0">
                {index + 1}
              </span>
              <span className={line.color || "text-foreground/80"}>
                {line.text === "// comment" ? t("comment") : line.text}
                {index === displayedLines - 1 &&
                  !isComplete &&
                  cursorVisible && (
                    <span className="inline-block w-2 h-4 ml-0.5 bg-violet-500 animate-pulse" />
                  )}
              </span>
            </div>
          ))}
        </div>
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            role="alert"
          >
            <p className="text-red-500 text-xs font-semibold mb-1">
              {t("alert")}
            </p>
            <p className="text-muted-foreground text-xs">
              {t("alertDescription")}
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
