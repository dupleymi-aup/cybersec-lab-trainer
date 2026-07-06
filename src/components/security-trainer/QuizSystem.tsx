"use client";

import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { useAppStore, apiClient } from "@/lib/store";
import { useTranslations } from "next-intl";
import { quizQuestions, quizCategories } from "@/lib/data";
import { saveQuizAttempts, type QuizAttemptData } from "@/lib/auth-store";
import { NotificationHelper } from "@/lib/notification-store";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  HelpCircle,
  Database,
  FileText,
  Link,
  Lock,
  Shield,
  Clock,
  CheckCircle2,
  XCircle,
  RotateCcw,
  Trophy,
  Target,
  Code,
  Globe,
  Users,
  Flame,
  ChevronRight,
} from "lucide-react";
import { logger } from "@/lib/logger";

const iconMap: Record<string, React.ReactNode> = {
  Database: <Database size={20} />,
  FileText: <FileText size={20} />,
  Link: <Link size={20} />,
  Lock: <Lock size={20} />,
  Shield: <Shield size={20} />,
  Code: <Code size={20} />,
  Globe: <Globe size={20} />,
  Users: <Users size={20} />,
};

type QuizState = "select" | "playing" | "result";

function getDifficultyBreakdown(
  questions: typeof quizQuestions,
): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const q of questions) {
    counts[q.difficulty] = (counts[q.difficulty] || 0) + 1;
  }
  return counts;
}

const DIFF_COLORS: Record<string, string> = {
  easy: "bg-emerald-100 text-emerald-700",
  medium: "bg-amber-100 text-amber-700",
  hard: "bg-red-100 text-red-700",
};

export default function QuizSystem() {
  const quizScores = useAppStore((s) => s.quizScores);
  const setQuizScore = useAppStore((s) => s.setQuizScore);
  const setCurrentPage = useAppStore((s) => s.setCurrentPage);
  const t = useTranslations("quiz");
  const [quizState, setQuizState] = useState<QuizState>("select");
  const [activeCategory, setActiveCategory] = useState("");
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showAnswer, setShowAnswer] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(30);
  const [answers, setAnswers] = useState<(boolean | null)[]>([]);
  const [timerActive, setTimerActive] = useState(false);
  const [startTime, setStartTime] = useState(0);
  const [totalTimeTaken, setTotalTimeTaken] = useState(0);
  const [streak, setStreak] = useState(0);
  const [maxStreak, setMaxStreak] = useState(0);
  const [direction, setDirection] = useState<"next" | "prev">("next");
  const currentQuestionRef = useRef(currentQuestion);
  const timedOutRef = useRef(false);
  const selectedAnswerRef = useRef(selectedAnswer);
  const quizQuestionsRef = useRef(quizQuestions);
  const difficultyFilterRef = useRef(difficultyFilter);
  const answersRef = useRef(answers);
  const categoryQuestionsRef = useRef<typeof quizQuestions>([]);
  const correctCountRef = useRef(correctCount);
  const activeCategoryRef = useRef(activeCategory);
  const startTimeRef = useRef(startTime);
  const maxStreakRef = useRef(maxStreak);

  useEffect(() => {
    currentQuestionRef.current = currentQuestion;
    difficultyFilterRef.current = difficultyFilter;
    answersRef.current = answers;
    correctCountRef.current = correctCount;
    activeCategoryRef.current = activeCategory;
    startTimeRef.current = startTime;
    maxStreakRef.current = maxStreak;
    selectedAnswerRef.current = selectedAnswer;
  }, [
    currentQuestion,
    difficultyFilter,
    answers,
    correctCount,
    activeCategory,
    startTime,
    maxStreak,
    selectedAnswer,
  ]);

  const filterQuestions = useCallback((categoryName: string) => {
    const q = quizQuestionsRef.current;
    const diff = difficultyFilterRef.current;
    return q.filter((qItem) => {
      const catMatch = qItem.category === categoryName;
      const diffMatch = diff === "all" || qItem.difficulty === diff;
      return catMatch && diffMatch;
    });
  }, []);

  const categoryQuestions = useMemo(
    () => filterQuestions(activeCategory),
    [activeCategory, filterQuestions],
  );

  const startQuiz = useCallback(
    (categoryName: string) => {
      const questions = filterQuestions(categoryName);
      if (questions.length === 0) return;
      setActiveCategory(categoryName);
      setCurrentQuestion(0);
      setCorrectCount(0);
      setSelectedAnswer("");
      setShowAnswer(false);
      setTimeLeft(30);
      setAnswers(new Array(questions.length).fill(null));
      setTimerActive(true);
      setStartTime(Date.now());
      setTotalTimeTaken(0);
      setStreak(0);
      setMaxStreak(0);
      setDirection("next");
      setQuizState("playing");
    },
    [filterQuestions],
  );

  const nextQuestion = useCallback(
    (overrideCorrectCount?: number) => {
      const q = categoryQuestionsRef.current;
      const idx = currentQuestionRef.current;
      if (idx < q.length - 1) {
        setDirection("next");
        setCurrentQuestion((prev) => prev + 1);
        setSelectedAnswer("");
        setShowAnswer(false);
        setTimeLeft(30);
        setTimerActive(true);
      } else {
        const finalCount =
          overrideCorrectCount !== undefined
            ? overrideCorrectCount
            : correctCountRef.current;
        const catId =
          quizCategories.find((c) => c.name === activeCategoryRef.current)
            ?.id || "";
        const score =
          q.length > 0 ? Math.round((finalCount / q.length) * 100) : 0;
        setQuizScore(catId, score);
        NotificationHelper.quizCompleted(activeCategoryRef.current, score);
        setTotalTimeTaken(
          Math.round((Date.now() - startTimeRef.current) / 1000),
        );
        setTimerActive(false);

        const currentAnswers = answersRef.current;
        const attempts: QuizAttemptData[] = q.map((qItem, i) => ({
          questionId: qItem.id,
          difficulty: qItem.difficulty,
          category: qItem.category,
          correct: currentAnswers[i] === true,
        }));
        saveQuizAttempts(catId, attempts);

        apiClient.saveQuizResults(catId, score, q.length).catch((err) => {
          if (process.env.NODE_ENV === "development")
            logger.warn("QuizSystem failed to save quiz results", { error: err });
        });

        setQuizState("result");
      }
    },
    [setQuizScore],
  );

  const handleAnswer = useCallback(() => {
    if (!selectedAnswer) return;
    setTimerActive(false);
    setShowAnswer(true);
    timedOutRef.current = false;
    const q = categoryQuestionsRef.current;
    const idx = currentQuestionRef.current;
    const question = q[idx];
    const isCorrect = parseInt(selectedAnswer) === question.correctIndex;
    if (isCorrect) {
      const newCorrect = correctCountRef.current + 1;
      setCorrectCount(newCorrect);
      // Pass the updated count for the last question scenario
      if (idx >= q.length - 1) {
        // Schedule nextQuestion with the correct count after state update
        setTimeout(() => nextQuestion(newCorrect), 0);
      }
      setStreak((s) => {
        const newStreak = s + 1;
        if (newStreak > maxStreakRef.current) setMaxStreak(newStreak);
        return newStreak;
      });
    } else {
      setStreak(0);
      // For wrong last answer, pass current ref count (no increment)
      if (idx >= q.length - 1) {
        setTimeout(() => nextQuestion(), 0);
      }
    }
    const currentAnswers = [...answersRef.current];
    currentAnswers[idx] = isCorrect;
    setAnswers(currentAnswers);
  }, [selectedAnswer, nextQuestion]);

  // Timer
  useEffect(() => {
    if (!timerActive) return;
    timedOutRef.current = false;
    setTimeLeft(30);
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          setTimerActive(false);
          setShowAnswer(true);
          setStreak(0);
          timedOutRef.current = true;
          setAnswers((a) => {
            const updated = [...a];
            updated[currentQuestionRef.current] = false;
            return updated;
          });
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerActive, currentQuestion]);

  // Auto-advance after timeout — only if timedOut was set for the current question
  useEffect(() => {
    if (!showAnswer || !timedOutRef.current) return;
    const questionAtTimeout = currentQuestionRef.current;
    const timer = setTimeout(() => {
      // Only auto-advance if we're still on the same question
      if (
        currentQuestionRef.current === questionAtTimeout &&
        timedOutRef.current
      ) {
        nextQuestion();
      }
    }, 2000);
    return () => clearTimeout(timer);
  }, [showAnswer, nextQuestion]);

  // Pause timer when tab is hidden
  useEffect(() => {
    const handleVisibility = () => {
      if (document.hidden && timerActive) {
        setTimerActive(false);
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () =>
      document.removeEventListener("visibilitychange", handleVisibility);
  }, [timerActive]);

  // Warn on page leave during quiz
  useEffect(() => {
    if (quizState !== "playing") return;
    const handler = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [quizState]);

  const question = categoryQuestions[currentQuestion];
  const finalScore =
    categoryQuestions.length > 0
      ? Math.round((correctCount / categoryQuestions.length) * 100)
      : 0;

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (
        quizState !== "playing" ||
        !categoryQuestionsRef.current[currentQuestionRef.current]
      )
        return;
      const question = categoryQuestionsRef.current[currentQuestionRef.current];

      if (!showAnswer && e.key >= "1" && e.key <= "4") {
        const idx = parseInt(e.key) - 1;
        if (idx < question.options.length) {
          setSelectedAnswer(String(idx));
        }
        return;
      }

      if (!showAnswer) {
        if (e.key === "ArrowUp" || e.key === "ArrowLeft") {
          e.preventDefault();
          setSelectedAnswer((prev) => {
            const cur = prev === "" ? 0 : parseInt(prev);
            return String(Math.max(0, cur - 1));
          });
          return;
        }
        if (e.key === "ArrowDown" || e.key === "ArrowRight") {
          e.preventDefault();
          setSelectedAnswer((prev) => {
            const cur = prev === "" ? 0 : parseInt(prev);
            return String(Math.min(question.options.length - 1, cur + 1));
          });
          return;
        }
      }

      if (e.key === "Enter") {
        e.preventDefault();
        const currentSelected = selectedAnswerRef.current;
        if (!showAnswer && currentSelected) {
          handleAnswer();
        } else if (showAnswer) {
          nextQuestion();
        }
      }

      if (e.key === "Escape") {
        e.preventDefault();
        setQuizState("select");
        setCurrentQuestion(0);
        setCorrectCount(0);
        setSelectedAnswer("");
        setShowAnswer(false);
        setTimeLeft(30);
        setAnswers([]);
        setTimerActive(false);
      }
    },
    [quizState, showAnswer, handleAnswer, nextQuestion],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  const resetQuiz = () => {
    setQuizState("select");
    setCurrentQuestion(0);
    setCorrectCount(0);
    setSelectedAnswer("");
    setShowAnswer(false);
    setTimeLeft(30);
    setAnswers([]);
    setTimerActive(false);
    setStreak(0);
    setMaxStreak(0);
  };

  const timerPercent = (timeLeft / 30) * 100;
  const timerColor =
    timeLeft > 20
      ? "stroke-emerald-500"
      : timeLeft > 10
        ? "stroke-amber-500"
        : "stroke-red-500";

  const timerCircumference = 2 * Math.PI * 18;
  const timerOffset =
    timerCircumference - (timerPercent / 100) * timerCircumference;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => {
            resetQuiz();
            setCurrentPage("dashboard");
          }}
        >
          <ChevronLeft size={20} />
        </Button>
        <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
          <HelpCircle size={20} className="text-amber-600" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{t("title")}</h1>
          <p className="text-xs text-muted-foreground">{t("subtitle")}</p>
        </div>
      </div>

      {/* Select Category */}
      {quizState === "select" && (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-4"
        >
          <Card className="border-none shadow-sm">
            <CardContent className="p-5">
              <h2 className="font-semibold mb-1">{t("selectCategory")}</h2>
              <p className="text-xs text-muted-foreground">
                {t("selectDescription")}
              </p>
            </CardContent>
          </Card>

          {/* Difficulty filter */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target size={16} className="text-muted-foreground" />
                <span className="text-xs font-semibold text-muted-foreground">
                  {t("difficultyLabel")}
                </span>
                <div className="flex gap-1.5">
                  {(
                    [
                      ["all", t("filterAll")],
                      ["easy", t("difficulty.easy")],
                      ["medium", t("difficulty.medium")],
                      ["hard", t("difficulty.hard")],
                    ] as const
                  ).map(([key, label]) => (
                    <button
                      key={key}
                      onClick={() => setDifficultyFilter(key)}
                      className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                        difficultyFilter === key
                          ? key === "easy"
                            ? "bg-emerald-100 text-emerald-700"
                            : key === "medium"
                              ? "bg-amber-100 text-amber-700"
                              : key === "hard"
                                ? "bg-red-100 text-red-700"
                                : "bg-slate-800 dark:bg-slate-700 text-white"
                          : "bg-muted text-muted-foreground hover:bg-slate-200"
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {quizCategories.map((cat) => {
              const catId = cat.id;
              const score = quizScores[catId];
              const available = quizQuestions.filter((q) => {
                const catMatch = q.category === cat.name;
                const diffMatch =
                  difficultyFilter === "all" ||
                  q.difficulty === difficultyFilter;
                return catMatch && diffMatch;
              });
              if (available.length === 0) return null;
              const breakdown = getDifficultyBreakdown(available);
              return (
                <Card
                  key={cat.id}
                  className="cursor-pointer border-border hover:border-emerald-300 hover:shadow-md transition-all"
                  onClick={() => startQuiz(cat.name)}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center text-emerald-600">
                        {iconMap[cat.icon]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-sm">{cat.name}</h3>
                        <p className="text-xs text-muted-foreground">
                          {t("questionsCount", { count: available.length })}
                        </p>
                        <div className="flex gap-1 mt-1">
                          {(["easy", "medium", "hard"] as const).map((d) =>
                            breakdown[d] ? (
                              <span
                                key={d}
                                className={`text-[10px] px-1.5 py-0.5 rounded ${DIFF_COLORS[d]}`}
                              >
                                {t(`difficulty.${d}`)}: {breakdown[d]}
                              </span>
                            ) : null,
                          )}
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        {score !== undefined ? (
                          <Badge
                            className={
                              score >= 80
                                ? "bg-emerald-600"
                                : score >= 60
                                  ? "bg-amber-500"
                                  : "bg-red-500"
                            }
                          >
                            {score}%
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="text-[10px]">
                            {t("newBadge")}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </motion.div>
      )}

      {/* Playing */}
      {quizState === "playing" && question && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="space-y-4"
        >
          {/* Quiz progress bar */}
          <Card className="border-none shadow-sm">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">
                    {activeCategory}
                  </Badge>
                  {streak >= 3 && (
                    <motion.div
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="flex items-center gap-1 text-xs text-amber-600 font-semibold"
                    >
                      <Flame size={14} className="text-orange-500" />
                      {streak}
                    </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-4 text-xs text-muted-foreground">
                  <span className="font-medium">
                    <span
                      className={correctCount > 0 ? "text-emerald-600" : ""}
                    >
                      {correctCount}
                    </span>
                    <span className="text-slate-300 mx-1">/</span>
                    <span>{categoryQuestions.length}</span>
                  </span>
                  {/* Timer ring */}
                  <div className="relative w-10 h-10">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 42 42">
                      <circle
                        cx="21"
                        cy="21"
                        r="18"
                        fill="none"
                        stroke="#e2e8f0"
                        strokeWidth="3"
                      />
                      <circle
                        cx="21"
                        cy="21"
                        r="18"
                        fill="none"
                        className={timerColor}
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeDasharray={timerCircumference}
                        strokeDashoffset={timerOffset}
                        style={{
                          transition:
                            "stroke-dashoffset 1s linear, stroke 0.3s",
                        }}
                      />
                    </svg>
                    <span
                      className={`absolute inset-0 flex items-center justify-center text-[11px] font-bold font-mono ${
                        timeLeft <= 5
                          ? "text-red-500"
                          : timeLeft <= 10
                            ? "text-amber-500"
                            : "text-foreground/70"
                      }`}
                    >
                      {timeLeft}
                    </span>
                  </div>
                </div>
              </div>
              <Progress
                value={((currentQuestion + 1) / categoryQuestions.length) * 100}
                className="h-1.5"
              />
            </CardContent>
          </Card>

          {/* Question with slide animation */}
          <AnimatePresence mode="wait">
            <motion.div
              key={currentQuestion}
              initial={{ opacity: 0, x: direction === "next" ? 30 : -30 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: direction === "next" ? -30 : 30 }}
              transition={{ duration: 0.2 }}
            >
              <Card className="border-border">
                <CardContent className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <Badge
                      className={`text-[10px] ${
                        question.difficulty === "easy"
                          ? "bg-emerald-100 text-emerald-700"
                          : question.difficulty === "medium"
                            ? "bg-amber-100 text-amber-700"
                            : "bg-red-100 text-red-700"
                      }`}
                    >
                      {t(`difficulty.${question.difficulty}`)}
                    </Badge>
                    <span className="text-[10px] text-slate-400">
                      {t("question", {
                        current: currentQuestion + 1,
                        total: categoryQuestions.length,
                      })}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm leading-relaxed mb-4">
                    {question.question}
                  </h3>

                  <RadioGroup
                    value={selectedAnswer}
                    onValueChange={setSelectedAnswer}
                    disabled={showAnswer}
                    className="space-y-2"
                  >
                    {question.options.map((option, i) => {
                      let optionClass =
                        "border-border hover:border-emerald-400 cursor-pointer";
                      if (showAnswer) {
                        if (i === question.correctIndex) {
                          optionClass = "border-emerald-400 bg-emerald-50";
                        } else if (
                          selectedAnswer === String(i) &&
                          i !== question.correctIndex
                        ) {
                          optionClass = "border-red-400 bg-red-50";
                        } else {
                          optionClass = "border-slate-100 opacity-50";
                        }
                      } else if (selectedAnswer === String(i)) {
                        optionClass = "border-emerald-400 bg-emerald-50/50";
                      }

                      return (
                        <div
                          key={i}
                          className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-all ${optionClass}`}
                          onClick={() =>
                            !showAnswer && setSelectedAnswer(String(i))
                          }
                        >
                          <RadioGroupItem value={String(i)} id={`opt-${i}`} />
                          <div className="flex items-center gap-2 flex-1">
                            {!showAnswer && (
                              <kbd className="hidden md:inline-flex items-center justify-center w-5 h-5 rounded text-[10px] font-mono bg-muted text-muted-foreground border border-border shrink-0">
                                {i + 1}
                              </kbd>
                            )}
                            <Label
                              htmlFor={`opt-${i}`}
                              className="flex-1 text-sm cursor-pointer leading-relaxed"
                            >
                              {option}
                            </Label>
                          </div>
                          {showAnswer && i === question.correctIndex && (
                            <CheckCircle2
                              size={16}
                              className="text-emerald-500 shrink-0"
                            />
                          )}
                          {showAnswer &&
                            selectedAnswer === String(i) &&
                            i !== question.correctIndex && (
                              <XCircle
                                size={16}
                                className="text-red-500 shrink-0"
                              />
                            )}
                        </div>
                      );
                    })}
                  </RadioGroup>

                  {!showAnswer && (
                    <Button
                      className="mt-4 w-full bg-emerald-600 hover:bg-emerald-700"
                      onClick={handleAnswer}
                      disabled={!selectedAnswer}
                    >
                      {t("answer")}{" "}
                      <kbd className="ml-2 hidden md:inline-flex items-center justify-center px-2 h-5 rounded text-[10px] font-mono bg-card/20 border border-white/30">
                        Enter
                      </kbd>
                    </Button>
                  )}

                  {/* Keyboard hints */}
                  <div className="hidden md:flex items-center gap-3 mt-3 text-[11px] text-slate-400">
                    <span>
                      <kbd className="inline-flex items-center justify-center px-1.5 h-4 rounded text-[10px] font-mono bg-muted border border-border mr-1">
                        1-4
                      </kbd>{" "}
                      {t("select")}
                    </span>
                    <span>
                      <kbd className="inline-flex items-center justify-center px-1.5 h-4 rounded text-[10px] font-mono bg-muted border border-border mr-1">
                        ↑↓
                      </kbd>{" "}
                      {t("navigation")}
                    </span>
                    <span>
                      <kbd className="inline-flex items-center justify-center px-1.5 h-4 rounded text-[10px] font-mono bg-muted border border-border mr-1">
                        Esc
                      </kbd>{" "}
                      {t("exit")}
                    </span>
                  </div>

                  {showAnswer && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-4 space-y-3"
                    >
                      <div
                        className={`rounded-lg p-3 ${
                          answers[currentQuestion]
                            ? "bg-emerald-50 border border-emerald-200"
                            : "bg-red-50 border border-red-200"
                        }`}
                      >
                        <p
                          className={`text-xs font-semibold flex items-center gap-1.5 ${answers[currentQuestion] ? "text-emerald-700" : "text-red-700"}`}
                        >
                          {answers[currentQuestion] ? (
                            <>
                              <CheckCircle2 size={14} /> {t("correct")}
                            </>
                          ) : timeLeft <= 0 ? (
                            <>
                              <Clock size={14} /> {t("timeUp")}
                            </>
                          ) : (
                            <>
                              <XCircle size={14} /> {t("incorrect")}
                            </>
                          )}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                          {question.explanation}
                        </p>
                      </div>

                      <Button
                        className="w-full bg-emerald-600 hover:bg-emerald-700"
                        onClick={() => nextQuestion()}
                      >
                        {currentQuestion < categoryQuestions.length - 1 ? (
                          <>
                            {t("next")}{" "}
                            <ChevronRight size={14} className="ml-1" />
                          </>
                        ) : (
                          t("results")
                        )}
                      </Button>
                    </motion.div>
                  )}
                </CardContent>
              </Card>
            </motion.div>
          </AnimatePresence>
        </motion.div>
      )}

      {/* Results */}
      {quizState === "result" && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="space-y-4"
        >
          <Card className="border-none shadow-sm bg-gradient-to-br from-slate-900 to-emerald-900 text-white">
            <CardContent className="p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-card/10 flex items-center justify-center mx-auto mb-4">
                {finalScore >= 80 ? (
                  <Trophy size={32} className="text-amber-400" />
                ) : finalScore >= 60 ? (
                  <Target size={32} className="text-emerald-400" />
                ) : (
                  <HelpCircle size={32} className="text-red-400" />
                )}
              </div>
              <h2 className="text-2xl font-bold mb-1">
                {finalScore >= 80
                  ? t("perfect")
                  : finalScore >= 60
                    ? t("passed")
                    : t("failed")}
              </h2>
              <p className="text-slate-300 text-sm mb-4">{activeCategory}</p>

              <div className="text-5xl font-bold font-mono mb-2">
                {finalScore}%
              </div>
              <p className="text-slate-400 text-sm mb-1">
                {t("correctAnswers", {
                  correct: correctCount,
                  total: categoryQuestions.length,
                })}
              </p>

              {/* Streak info */}
              {maxStreak >= 3 && (
                <p className="text-amber-400 text-xs mb-2 flex items-center justify-center gap-1">
                  <Flame size={14} /> {t("maxStreak", { streak: maxStreak })}
                </p>
              )}

              {totalTimeTaken > 0 && (
                <p className="text-slate-400 text-xs mb-4 flex items-center justify-center gap-1">
                  <Clock size={12} />{" "}
                  {t("timeTaken", { seconds: totalTimeTaken })}
                </p>
              )}

              {/* Difficulty breakdown */}
              {(() => {
                const breakdown: Record<
                  string,
                  { correct: number; total: number }
                > = {};
                categoryQuestions.forEach((q, i) => {
                  if (!breakdown[q.difficulty])
                    breakdown[q.difficulty] = { correct: 0, total: 0 };
                  breakdown[q.difficulty].total++;
                  if (answers[i]) breakdown[q.difficulty].correct++;
                });
                return (
                  <div className="flex justify-center gap-4 mb-4">
                    {Object.entries(breakdown).map(([diff, stats]) => (
                      <span key={diff} className="text-xs font-mono">
                        <span className={DIFF_COLORS[diff].split(" ")[1]}>
                          {t(`difficulty.${diff}`)}
                        </span>
                        : {stats.correct}/{stats.total}
                      </span>
                    ))}
                  </div>
                );
              })()}

              <div className="flex gap-2 justify-center mt-4">
                <Button
                  variant="outline"
                  className="text-white border-white/20 hover:bg-card/10"
                  onClick={resetQuiz}
                >
                  <RotateCcw size={14} className="mr-2" /> {t("backToModules")}
                </Button>
                <Button
                  className="bg-emerald-600 hover:bg-emerald-700"
                  onClick={() => startQuiz(activeCategory)}
                >
                  <RotateCcw size={14} className="mr-2" /> {t("retry")}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Answer breakdown */}
          <Card className="border-border">
            <CardContent className="p-5">
              <h3 className="text-sm font-semibold mb-3">
                {t("answerBreakdown")}
              </h3>
              <div className="space-y-3">
                {categoryQuestions.map((q, i) => (
                  <div
                    key={q.id}
                    className="flex items-start gap-3 p-3 rounded-lg bg-secondary"
                  >
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                        answers[i]
                          ? "bg-emerald-500 text-white"
                          : "bg-red-500 text-white"
                      }`}
                    >
                      {answers[i] ? (
                        <CheckCircle2 size={14} />
                      ) : (
                        <XCircle size={14} />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-medium leading-relaxed">
                        {q.question}
                      </p>
                      {!answers[i] && (
                        <p className="text-[11px] text-emerald-600 mt-1">
                          {t("correctAnswer", {
                            answer: q.options[q.correctIndex],
                          })}
                        </p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      )}
    </div>
  );
}
