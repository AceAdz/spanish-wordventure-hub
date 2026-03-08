import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Zap, Heart, RotateCcw, Timer, Flame, Star, Sparkles, Crown, Shield } from "lucide-react";
import { SPANISH_WORDS } from "@/data/spanishWords";
import { useGameScore } from "@/hooks/useGameScore";

// ── Word pool ──
const POOL = SPANISH_WORDS.map((w) => ({
  spanish: w.word.toLowerCase(),
  english: w.english.toLowerCase(),
}));

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Types ──
interface Round {
  spanish: string;
  correct: string;
  options: string[];
  timeLimit: number;
}

type Phase = "menu" | "countdown" | "playing" | "feedback" | "gameover";

// ── Constants ──
const INITIAL_LIVES = 3;
const BASE_TIME = 4000;
const MIN_TIME = 1200;
const PERFECT_THRESHOLD = 0.35; // ratio of time used

const CORNER_POSITIONS = [
  { x: "left-4 sm:left-8", y: "top-4 sm:top-8" },
  { x: "right-4 sm:right-8", y: "top-4 sm:top-8" },
  { x: "left-4 sm:left-8", y: "bottom-20 sm:bottom-24" },
  { x: "right-4 sm:right-8", y: "bottom-20 sm:bottom-24" },
];

const CORNER_COLORS = [
  "from-blue-500/90 to-cyan-500/90",
  "from-rose-500/90 to-pink-500/90",
  "from-emerald-500/90 to-teal-500/90",
  "from-amber-500/90 to-orange-500/90",
];

const DueloPalabras = () => {
  const { saveScore } = useGameScore();

  const [phase, setPhase] = useState<Phase>("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [round, setRound] = useState<Round | null>(null);
  const [roundNum, setRoundNum] = useState(0);
  const [timeLeft, setTimeLeft] = useState(1);
  const [feedback, setFeedback] = useState<{ correct: boolean; answer: string; picked: string } | null>(null);
  const [particles, setParticles] = useState<{ id: number; x: string; y: string; emoji: string }[]>([]);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [perfectFlash, setPerfectFlash] = useState(false);
  const [countdownNum, setCountdownNum] = useState(3);

  const timerRef = useRef<number>();
  const startTimeRef = useRef(0);
  const particleIdRef = useRef(0);

  // ── Generate round ──
  const generateRound = useCallback((num: number): Round => {
    const entry = pick(POOL);
    const wrongPool = POOL.filter((w) => w.english !== entry.english);
    const wrongs = shuffle(wrongPool).slice(0, 3).map((w) => w.english);
    const options = shuffle([entry.english, ...wrongs]);
    const timeLimit = Math.max(BASE_TIME - num * 80, MIN_TIME);
    return { spanish: entry.spanish, correct: entry.english, options, timeLimit };
  }, []);

  // ── Start game ──
  const startGame = () => {
    setPhase("countdown");
    setScore(0);
    setLives(INITIAL_LIVES);
    setStreak(0);
    setBestStreak(0);
    setRoundNum(0);
    setFeedback(null);
    setCountdownNum(3);
  };

  // ── Countdown ──
  useEffect(() => {
    if (phase !== "countdown") return;
    if (countdownNum <= 0) {
      setPhase("playing");
      return;
    }
    const t = setTimeout(() => setCountdownNum((c) => c - 1), 600);
    return () => clearTimeout(t);
  }, [phase, countdownNum]);

  // ── Next round ──
  const nextRound = useCallback(() => {
    const num = roundNum + 1;
    setRoundNum(num);
    const r = generateRound(num);
    setRound(r);
    setTimeLeft(1);
    startTimeRef.current = Date.now();
    setPhase("playing");
    setFeedback(null);
  }, [roundNum, generateRound]);

  // ── Start first round when entering playing ──
  useEffect(() => {
    if (phase === "playing" && !round) {
      const r = generateRound(1);
      setRound(r);
      setRoundNum(1);
      setTimeLeft(1);
      startTimeRef.current = Date.now();
    }
  }, [phase, round, generateRound]);

  // ── Timer ──
  useEffect(() => {
    if (phase !== "playing" || !round) return;

    const tick = () => {
      const elapsed = Date.now() - startTimeRef.current;
      const remaining = Math.max(0, 1 - elapsed / round.timeLimit);
      setTimeLeft(remaining);

      if (remaining <= 0) {
        // Time's up
        handleAnswer(null);
        return;
      }
      timerRef.current = requestAnimationFrame(tick);
    };

    timerRef.current = requestAnimationFrame(tick);
    return () => {
      if (timerRef.current) cancelAnimationFrame(timerRef.current);
    };
  }, [phase, round]);

  // ── Burst ──
  const burst = useCallback((emoji: string) => {
    const newP = Array.from({ length: 6 }, (_, i) => ({
      id: ++particleIdRef.current,
      x: `${20 + Math.random() * 60}%`,
      y: `${20 + Math.random() * 60}%`,
      emoji,
    }));
    setParticles(newP);
    setTimeout(() => setParticles([]), 1000);
  }, []);

  // ── Handle answer ──
  const handleAnswer = useCallback(
    (picked: string | null) => {
      if (phase !== "playing" || !round) return;
      if (timerRef.current) cancelAnimationFrame(timerRef.current);

      const correct = picked === round.correct;
      const elapsed = Date.now() - startTimeRef.current;
      const speedRatio = elapsed / round.timeLimit;

      if (correct) {
        const isPerfect = speedRatio < PERFECT_THRESHOLD;
        const speedBonus = Math.floor((1 - speedRatio) * 30);
        const streakBonus = Math.min(streak, 15) * 3;
        const basePoints = 15;
        const earned = basePoints + speedBonus + streakBonus + (isPerfect ? 25 : 0);

        setScore((s) => s + earned);
        setStreak((s) => {
          const next = s + 1;
          setBestStreak((b) => Math.max(b, next));
          return next;
        });

        if (isPerfect) {
          setPerfectFlash(true);
          setTimeout(() => setPerfectFlash(false), 500);
          burst("⚡");
        } else {
          burst("✨");
        }
      } else {
        setLives((l) => {
          const next = l - 1;
          if (next <= 0) {
            setTimeout(() => setPhase("gameover"), 1200);
          }
          return Math.max(0, next);
        });
        setStreak(0);
        setShakeScreen(true);
        setTimeout(() => setShakeScreen(false), 300);
      }

      setFeedback({ correct, answer: round.correct, picked: picked || "(timed out)" });
      setPhase("feedback");
    },
    [phase, round, streak, burst]
  );

  // ── Auto-advance from feedback ──
  useEffect(() => {
    if (phase !== "feedback") return;
    const t = setTimeout(() => {
      if (lives > 0) nextRound();
      else setPhase("gameover");
    }, feedback?.correct ? 800 : 1500);
    return () => clearTimeout(t);
  }, [phase, lives, nextRound, feedback]);

  // ── Save score ──
  useEffect(() => {
    if (phase === "gameover" && score > 0) {
      saveScore("verb_match", score, undefined, bestStreak);
    }
  }, [phase, score, bestStreak, saveScore]);

  // Timer color
  const timerColor =
    timeLeft > 0.5
      ? "bg-primary"
      : timeLeft > 0.25
      ? "bg-accent"
      : "bg-destructive";

  return (
    <div
      className={`min-h-screen bg-background flex flex-col relative overflow-hidden select-none transition-transform duration-100 ${
        shakeScreen ? "translate-x-1" : ""
      }`}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-secondary/6 via-transparent to-primary/6" />
        <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-secondary/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-[400px] h-[400px] bg-primary/6 rounded-full blur-[100px]" />
      </div>

      {/* Perfect flash */}
      <AnimatePresence>
        {perfectFlash && (
          <motion.div
            initial={{ opacity: 0.6 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-50 pointer-events-none bg-accent/20"
          />
        )}
      </AnimatePresence>

      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.5, x: 0, y: 0 }}
            animate={{ opacity: 0, scale: 2, y: -80 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.8 }}
            className="fixed z-50 pointer-events-none text-2xl"
            style={{ left: p.x, top: p.y }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-border/20 px-4 py-3 relative z-20 backdrop-blur-sm bg-background/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-secondary" />
            <span className="font-display font-black text-lg text-foreground">Duelo de Palabras</span>
          </div>
          {phase === "playing" || phase === "feedback" ? (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-secondary font-bold">
                <Star className="h-4 w-4" />
                {score}
              </div>
              <div className="flex items-center gap-0.5">
                {[...Array(INITIAL_LIVES)].map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-4 w-4 transition-all ${
                      i < lives ? "text-destructive fill-destructive" : "text-muted-foreground/30"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-20" />
          )}
        </div>
      </header>

      {/* MENU */}
      {phase === "menu" && (
        <div className="flex-1 flex items-center justify-center relative z-10 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-md"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl mb-6"
            >
              ⚔️
            </motion.div>
            <h1 className="font-display font-black text-5xl mb-3">
              <span className="text-gradient-primary">Duelo</span>{" "}
              <span className="text-foreground">de Palabras</span>
            </h1>
            <p className="text-muted-foreground mb-2">
              A Spanish word appears — <strong className="text-foreground">smash the correct translation</strong> before time runs out!
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Faster answers = more points • Build streaks for bonus XP • Hit "Perfect" speed for ⚡ bonus
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8">
              <div className="bg-card/50 border border-border/30 rounded-xl p-3 text-center">
                <Timer className="h-5 w-5 text-primary mx-auto mb-1" />
                <div className="text-xs font-bold text-foreground">Speed Bonus</div>
                <div className="text-[10px] text-muted-foreground">Faster = more pts</div>
              </div>
              <div className="bg-card/50 border border-border/30 rounded-xl p-3 text-center">
                <Flame className="h-5 w-5 text-accent mx-auto mb-1" />
                <div className="text-xs font-bold text-foreground">Streak Bonus</div>
                <div className="text-[10px] text-muted-foreground">Chain correct answers</div>
              </div>
              <div className="bg-card/50 border border-border/30 rounded-xl p-3 text-center">
                <Zap className="h-5 w-5 text-secondary mx-auto mb-1" />
                <div className="text-xs font-bold text-foreground">Perfect</div>
                <div className="text-[10px] text-muted-foreground">Answer in &lt;35% time</div>
              </div>
              <div className="bg-card/50 border border-border/30 rounded-xl p-3 text-center">
                <Crown className="h-5 w-5 text-accent mx-auto mb-1" />
                <div className="text-xs font-bold text-foreground">Accelerating</div>
                <div className="text-[10px] text-muted-foreground">Timer gets shorter!</div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-2xl font-display font-black text-xl shadow-lg shadow-secondary/25"
            >
              Start Duel ⚔️
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* COUNTDOWN */}
      {phase === "countdown" && (
        <div className="flex-1 flex items-center justify-center relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={countdownNum}
              initial={{ scale: 2, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              transition={{ duration: 0.4 }}
              className="font-display font-black text-8xl text-primary"
            >
              {countdownNum > 0 ? countdownNum : "GO!"}
            </motion.div>
          </AnimatePresence>
        </div>
      )}

      {/* PLAYING / FEEDBACK */}
      {(phase === "playing" || phase === "feedback") && round && (
        <div className="flex-1 relative z-10 flex flex-col">
          {/* Timer bar */}
          <div className="w-full h-1.5 bg-muted/30">
            <motion.div
              className={`h-full ${timerColor} transition-colors`}
              style={{ width: `${timeLeft * 100}%` }}
            />
          </div>

          {/* Streak indicator */}
          {streak >= 3 && (
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              className="flex items-center justify-center gap-1.5 py-1.5 bg-accent/10 border-b border-accent/20"
            >
              <Flame className="h-3.5 w-3.5 text-accent" />
              <span className="text-xs font-black text-accent">{streak} STREAK 🔥</span>
            </motion.div>
          )}

          {/* Center word */}
          <div className="flex-1 flex items-center justify-center relative">
            <motion.div
              key={round.spanish}
              initial={{ scale: 0.5, opacity: 0, rotateX: 90 }}
              animate={{ scale: 1, opacity: 1, rotateX: 0 }}
              transition={{ type: "spring", damping: 12 }}
              className="text-center"
            >
              <div className="text-sm font-bold text-muted-foreground mb-2 uppercase tracking-widest">
                Translate
              </div>
              <div className="font-display font-black text-6xl sm:text-7xl text-foreground mb-2">
                {round.spanish}
              </div>
              <div className="text-sm text-muted-foreground">Round {roundNum}</div>
            </motion.div>

            {/* Feedback overlay */}
            <AnimatePresence>
              {feedback && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.5, opacity: 0 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  <div
                    className={`px-8 py-4 rounded-2xl border-2 backdrop-blur-md ${
                      feedback.correct
                        ? "bg-primary/20 border-primary/40"
                        : "bg-destructive/20 border-destructive/40"
                    }`}
                  >
                    <div className="text-4xl text-center mb-1">
                      {feedback.correct ? "✅" : "❌"}
                    </div>
                    {!feedback.correct && (
                      <div className="text-sm text-center text-muted-foreground">
                        Correct: <strong className="text-foreground">{feedback.answer}</strong>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Corner options */}
            {phase === "playing" &&
              round.options.map((opt, i) => (
                <motion.button
                  key={`${round.spanish}-${i}`}
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 + i * 0.08, type: "spring", damping: 10 }}
                  onClick={() => handleAnswer(opt)}
                  className={`absolute ${CORNER_POSITIONS[i].x} ${CORNER_POSITIONS[i].y} z-20`}
                >
                  <div
                    className={`bg-gradient-to-br ${CORNER_COLORS[i]} px-5 sm:px-8 py-3 sm:py-4 rounded-2xl border border-white/20 shadow-xl hover:scale-110 active:scale-95 transition-transform cursor-pointer min-w-[120px] sm:min-w-[160px]`}
                  >
                    <span className="font-display font-black text-white text-sm sm:text-lg drop-shadow">
                      {opt}
                    </span>
                  </div>
                </motion.button>
              ))}
          </div>
        </div>
      )}

      {/* GAME OVER */}
      {phase === "gameover" && (
        <div className="flex-1 flex items-center justify-center relative z-10 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <motion.div initial={{ y: -20 }} animate={{ y: 0 }} className="text-6xl mb-4">
              {score >= 500 ? "👑" : score >= 250 ? "⚔️" : score >= 100 ? "🔥" : "💀"}
            </motion.div>
            <h2 className="font-display font-black text-4xl text-foreground mb-2">
              {score >= 500 ? "CHAMPION!" : score >= 250 ? "WARRIOR!" : score >= 100 ? "FIGHTER!" : "DEFEATED"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              You dueled through {roundNum} rounds
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-secondary">{score}</div>
                <div className="text-[10px] text-muted-foreground font-bold">SCORE</div>
              </div>
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-primary">{roundNum}</div>
                <div className="text-[10px] text-muted-foreground font-bold">ROUNDS</div>
              </div>
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-accent">{bestStreak}x</div>
                <div className="text-[10px] text-muted-foreground font-bold">BEST STREAK</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-secondary to-primary text-primary-foreground rounded-xl font-display font-black text-sm shadow-lg"
              >
                <RotateCcw className="h-4 w-4" />
                Rematch
              </motion.button>
              <Link
                to="/"
                className="flex items-center gap-2 px-6 py-3 bg-card/60 border border-border/40 rounded-xl text-muted-foreground font-display font-bold text-sm hover:text-foreground transition-colors"
              >
                Home
              </Link>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default DueloPalabras;
