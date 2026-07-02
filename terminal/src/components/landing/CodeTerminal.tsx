"use client";

import {useState, useEffect} from "react";
import {motion, AnimatePresence} from "framer-motion";
import {Terminal, X, Minus, Square, AlertTriangle, Shield, Zap, Play, RotateCcw} from "lucide-react";
import {useTranslations} from "next-intl";
import {Button} from "@/components/ui/button";

const codeLines = [
  {text: "// Vulnerable authentication code", color: "text-muted-foreground", type: "comment"},
  {text: "", color: "", type: "empty"},
  {text: "app.post('/login', (req, res) => {", color: "text-violet-500", type: "code"},
  {text: "  const { username, password } = req.body;", color: "text-foreground/80", type: "code"},
  {text: "", color: "", type: "empty"},
  {text: "  const query = `", color: "text-foreground/80", type: "code"},
  {text: "    SELECT * FROM users", color: "text-emerald-500", type: "string"},
  {text: "    WHERE username = '${username}'", color: "text-amber-500", type: "vuln"},
  {text: "    AND password = '${password}'`", color: "text-red-500", type: "vuln"},
  {text: "", color: "", type: "empty"},
  {text: "  // ⚠️ SQL Injection vulnerability!", color: "text-red-500", type: "comment"},
  {text: "  db.query(query, (err, result) => {", color: "text-foreground/80", type: "code"},
  {text: "    if (result.length > 0) {", color: "text-foreground/80", type: "code"},
  {text: "      req.session.user = result[0];", color: "text-foreground/80", type: "code"},
  {text: "      res.redirect('/dashboard');", color: "text-foreground/80", type: "code"},
  {text: "    }", color: "text-foreground/80", type: "code"},
  {text: "  });", color: "text-foreground/80", type: "code"},
  {text: "});", color: "text-violet-500", type: "code"},
];

const vulnLines = [7, 8]; // Lines with vulnerabilities

export default function CodeTerminal() {
  const t = useTranslations("landing.codeTerminal");
  const [displayedLines, setDisplayedLines] = useState(0);
  const [cursorVisible, setCursorVisible] = useState(true);
  const [isComplete, setIsComplete] = useState(false);
  const [isMounted, setIsMounted] = useState(false);
  const [showHint, setShowHint] = useState(false);
  const [hoveredVuln, setHoveredVuln] = useState<number | null>(null);

  useEffect(() => { setIsMounted(true); }, []);

  useEffect(() => {
    if (!isMounted) return;
    const interval = setInterval(() => setCursorVisible((v) => !v), 530);
    return () => clearInterval(interval);
  }, [isMounted]);

  useEffect(() => {
    if (!isMounted) return;
    if (displayedLines < codeLines.length) {
      const timeout = setTimeout(() => setDisplayedLines((d) => d + 1), 150);
      return () => clearTimeout(timeout);
    } else {
      setIsComplete(true);
      const hintTimer = setTimeout(() => setShowHint(true), 500);
      return () => clearTimeout(hintTimer);
    }
  }, [displayedLines, isMounted]);

  useEffect(() => {
    if (!isMounted || !isComplete) return;
    const timeout = setTimeout(() => {
      setDisplayedLines(0);
      setIsComplete(false);
      setShowHint(false);
    }, 6000);
    return () => clearTimeout(timeout);
  }, [isComplete, isMounted]);

  const handleReplay = () => {
    setDisplayedLines(0);
    setIsComplete(false);
    setShowHint(false);
  };

  if (!isMounted) {
    return (
      <div className="w-full max-w-xl mx-auto" role="img" aria-label="Code terminal">
        <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl shadow-violet-500/20">
          <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border-b border-slate-700">
            <div className="flex items-center gap-1.5 sm:gap-2">
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80 hover:bg-red-500 transition-colors" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 transition-colors" />
              <div className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 transition-colors" />
            </div>
            <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-xs font-mono">
              <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
              <span className="truncate max-w-[120px] sm:max-w-none">vulnerability.js</span>
            </div>
            <div className="flex items-center gap-1 sm:gap-1.5">
              <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
              <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
              <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            </div>
          </div>
          <div className="p-3 sm:p-4 font-mono text-[10px] sm:text-sm leading-relaxed min-h-[280px] sm:min-h-[320px] bg-slate-900/50" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{opacity: 0, scale: 0.95}} 
      animate={{opacity: 1, scale: 1}} 
      className="w-full max-w-xl mx-auto" 
      role="img" 
      aria-label="Animated code terminal"
    >
      <div className="rounded-xl overflow-hidden bg-gradient-to-br from-slate-900 to-slate-800 border border-slate-700 shadow-2xl shadow-violet-500/20 relative">
        {/* Glow effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-violet-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        
        {/* Terminal Header */}
        <div className="flex items-center justify-between px-3 sm:px-4 py-2 sm:py-3 bg-slate-800/50 border-b border-slate-700 relative z-10">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <motion.div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-red-500/80 hover:bg-red-500 cursor-pointer transition-colors"
              whileHover={{ scale: 1.2 }}
            />
            <motion.div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-amber-500/80 hover:bg-amber-500 cursor-pointer transition-colors"
              whileHover={{ scale: 1.2 }}
            />
            <motion.div 
              className="w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full bg-emerald-500/80 hover:bg-emerald-500 cursor-pointer transition-colors"
              whileHover={{ scale: 1.2 }}
            />
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2 text-slate-400 text-[10px] sm:text-xs font-mono">
            <Terminal className="w-3.5 h-3.5 sm:w-4 sm:h-4" aria-hidden="true" />
            <span className="truncate max-w-[120px] sm:max-w-none">vulnerability.js</span>
          </div>
          <div className="flex items-center gap-1 sm:gap-1.5">
            <Minus className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
            <Square className="w-3 h-3 sm:w-3.5 sm:h-3.5 text-slate-400" />
            <X className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-slate-400" />
          </div>
        </div>

        {/* Terminal Content */}
        <div className="p-3 sm:p-4 font-mono text-[10px] sm:text-sm leading-relaxed min-h-[280px] sm:min-h-[320px] bg-slate-900/50 relative z-10 overflow-x-auto">
          {codeLines.slice(0, displayedLines).map((line, index) => {
            const isVuln = vulnLines.includes(index + 1);
            const isHovered = hoveredVuln === index + 1;
            
            return (
              <motion.div 
                key={index} 
                className={`flex relative group ${isVuln ? 'cursor-pointer' : ''} whitespace-nowrap`}
                onMouseEnter={() => isVuln && setHoveredVuln(index + 1)}
                onMouseLeave={() => setHoveredVuln(null)}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.03 }}
              >
                {/* Line highlight for vulnerabilities */}
                {isVuln && isComplete && (
                  <motion.div 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: isHovered ? 0.3 : 0.1 }}
                    className="absolute inset-0 bg-red-500"
                  />
                )}
                
                <span className="text-slate-600 w-6 sm:w-8 mr-2 sm:mr-4 text-right select-none flex-shrink-0">
                  {String(index + 1).padStart(2, ' ')}
                </span>
                <span className={line.color || "text-slate-300"}>
                  {line.text === "// Vulnerable authentication code" ? t("comment") : line.text}
                  {index === displayedLines - 1 && !isComplete && cursorVisible && (
                    <span className="inline-block w-2 h-3 sm:h-4 ml-0.5 bg-violet-500 animate-pulse" />
                  )}
                </span>
                
                {/* Vulnerability indicator */}
                {isVuln && isComplete && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="ml-1 sm:ml-2 flex items-center flex-shrink-0"
                  >
                    <AlertTriangle className="w-3 h-3 sm:w-4 sm:h-4 text-red-500" />
                  </motion.div>
                )}
              </motion.div>
            );
          })}
          
          {/* Replay button */}
          {isComplete && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="mt-3 sm:mt-4 flex justify-end"
            >
              <Button
                variant="ghost"
                size="sm"
                onClick={handleReplay}
                className="text-slate-400 hover:text-violet-400 gap-1.5 sm:gap-2 text-xs sm:text-sm"
              >
                <RotateCcw className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                Replay
              </Button>
            </motion.div>
          )}
        </div>

        {/* Vulnerability Alert */}
        <AnimatePresence>
          {showHint && isComplete && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="mx-3 sm:mx-4 mb-3 sm:mb-4 p-3 sm:p-4 bg-gradient-to-r from-red-500/10 to-amber-500/10 border border-red-500/30 rounded-lg relative overflow-hidden"
              role="alert"
            >
              {/* Scan line animation */}
              <motion.div 
                initial={{ x: '-100%' }}
                animate={{ x: '100%' }}
                transition={{ duration: 2, repeat: Infinity, repeatDelay: 1 }}
                className="absolute inset-0 bg-gradient-to-r from-transparent via-red-500/5 to-transparent"
              />
              
              <div className="relative z-10">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-red-500 flex-shrink-0" />
                  <p className="text-red-500 text-[10px] sm:text-xs font-bold uppercase tracking-wider">{t("alert")}</p>
                </div>
                <p className="text-slate-300 text-xs sm:text-sm mb-3 leading-relaxed">{t("alertDescription")}</p>
                
                <div className="flex flex-wrap items-center gap-2">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="sm" className="bg-gradient-to-r from-violet-600 to-violet-700 hover:from-violet-700 hover:to-violet-800 text-white gap-1.5 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2">
                      <Zap className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">Learn to Fix</span>
                      <span className="xs:hidden">Fix</span>
                    </Button>
                  </motion.div>
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Button size="sm" variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-800 gap-1.5 sm:gap-2 text-xs sm:text-sm py-1.5 sm:py-2">
                      <Play className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                      <span className="hidden xs:inline">View Solution</span>
                      <span className="xs:hidden">Solution</span>
                    </Button>
                  </motion.div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
}
