'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Terminal, X, Minus, Square } from 'lucide-react';

const codeLines = [
  { text: '// Уязвимый код - найдите ошибку!', color: 'text-slate-500' },
  { text: '', color: '' },
  { text: 'app.post(\'/login\', (req, res) => {', color: 'text-violet-400' },
  { text: '  const { username, password } = req.body;', color: 'text-slate-300' },
  { text: '', color: '' },
  { text: '  const query = `', color: 'text-slate-300' },
  { text: '    SELECT * FROM users', color: 'text-emerald-400' },
  { text: "    WHERE username = '${username}'", color: 'text-amber-400' },
  { text: "    AND password = '${password}'`", color: 'text-red-400' },
  { text: '', color: '' },
  { text: '  //  SQL Injection!', color: 'text-red-500' },
  { text: '  db.query(query, (err, result) => {', color: 'text-slate-300' },
  { text: '    if (result.length > 0) {', color: 'text-slate-300' },
  { text: '      req.session.user = result[0];', color: 'text-slate-300' },
  { text: '      res.redirect(\'/dashboard\');', color: 'text-slate-300' },
  { text: '    }', color: 'text-slate-300' },
  { text: '  });', color: 'text-slate-300' },
  { text: '});', color: 'text-violet-400' },
];

export default function CodeTerminal() {
  const [displayedLines, setDisplayedLines] = useState<number>(0);
  const [currentLine, setCurrentLine] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);

  // Mark as mounted (prevents SSR hydration mismatch)
  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Blinking cursor
  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [isMounted]);

  // Typing animation
  useEffect(() => {
    if (!isMounted || currentLine >= codeLines.length) {
      if (currentLine >= codeLines.length) setIsComplete(true);
      return;
    }

    const line = codeLines[currentLine];
    if (!line.text) {
      setDisplayedLines((prev) => prev + 1);
      setCurrentLine((prev) => prev + 1);
      return;
    }

    let charIndex = 0;
    const fullText = line.text;
    const speed = 30 + Math.random() * 40;

    const typeInterval = setInterval(() => {
      charIndex++;
      if (charIndex >= fullText.length) {
        clearInterval(typeInterval);
        setDisplayedLines((prev) => prev + 1);
        setCurrentLine((prev) => prev + 1);
      }
    }, speed);

    return () => clearInterval(typeInterval);
  }, [currentLine, isMounted]);

  if (!isMounted) {
    // Render empty terminal during SSR to prevent hydration mismatch
    return (
      <div className="w-full max-w-xl mx-auto" role="img" aria-label="Animated code terminal showing a SQL injection vulnerability example">
        <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shadow-violet-500/10">
          <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-red-500/80" />
              <div className="w-3 h-3 rounded-full bg-amber-500/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
            </div>
            <div className="flex items-center gap-2 text-slate-500 text-sm">
              <Terminal className="w-4 h-4" aria-hidden="true" />
              <span>vulnerability.js</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Minus className="w-4 h-4 text-slate-600" aria-hidden="true" />
              <Square className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
              <X className="w-4 h-4 text-slate-600" aria-hidden="true" />
            </div>
          </div>
          <div className="p-4 font-mono text-sm leading-relaxed min-h-[320px] bg-slate-950/50" aria-hidden="true" />
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
      aria-label="Animated code terminal showing a SQL injection vulnerability example"
    >
      <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 shadow-2xl shadow-violet-500/10">
        {/* Terminal header */}
        <div className="flex items-center justify-between px-4 py-3 bg-slate-800/50 border-b border-slate-700/50">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-500/80" />
            <div className="w-3 h-3 rounded-full bg-amber-500/80" />
            <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
          </div>
          <div className="flex items-center gap-2 text-slate-500 text-sm">
            <Terminal className="w-4 h-4" aria-hidden="true" />
            <span>vulnerability.js</span>
          </div>
          <div className="flex items-center gap-1.5">
            <Minus className="w-4 h-4 text-slate-600" aria-hidden="true" />
            <Square className="w-3.5 h-3.5 text-slate-600" aria-hidden="true" />
            <X className="w-4 h-4 text-slate-600" aria-hidden="true" />
          </div>
        </div>

        {/* Code content */}
        <div className="p-4 font-mono text-sm leading-relaxed min-h-[320px] bg-slate-950/50" aria-hidden="true">
          {codeLines.slice(0, displayedLines).map((line, index) => (
            <div key={index} className="flex">
              <span className="text-slate-700 w-8 mr-4 text-right select-none flex-shrink-0">
                {index + 1}
              </span>
              <span className={line.color || 'text-slate-300'}>
                {line.text}
                {index === displayedLines - 1 && !isComplete && cursorVisible && (
                  <span className="inline-block w-2 h-4 ml-0.5 bg-violet-400 animate-pulse" />
                )}
              </span>
            </div>
          ))}
        </div>

        {/* Alert */}
        {isComplete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mx-4 mb-4 p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
            role="alert"
          >
            <p className="text-red-400 text-xs font-semibold mb-1">
              ⚠ Обнаружена SQL Injection уязвимость!
            </p>
            <p className="text-slate-400 text-xs">
              Научитесь находить и исправлять такие уязвимости в CyberSec Lab
            </p>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
