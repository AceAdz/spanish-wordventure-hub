import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, CheckCircle, XCircle, Star, Zap, Sparkles, Flame } from "lucide-react";
import { VERB_CHALLENGES, VerbChallenge, getVerbsByDifficulty } from "@/data/spanishWords";
import { useGameScore } from "@/hooks/useGameScore";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(challenge: VerbChallenge, pool: VerbChallenge[]): string[] {
  const wrong = new Set<string>();
  const candidates = pool.filter((v) => v.answer !== challenge.answer);
  while (wrong.size < 3 && candidates.length > 0) {
    const rand = candidates[Math.floor(Math.random() * candidates.length)];
    wrong.add(rand.answer);
  }
  return shuffle([challenge.answer, ...Array.from(wrong)]);
}

const LEVELS = [
  { id: 1, name: "Beginner", desc: "Present regular verbs", color: "text-success", bg: "bg-success/10", border: "border-success/30", glow: "glow-success", maxDiff: 1, rounds: 10, icon: "🌱", xpReq: 0 },
  { id: 2, name: "Intermediate", desc: "Present irregular verbs", color: "text-accent", bg: "bg-accent/10", border: "border-accent/30", glow: "glow-warning", maxDiff: 2, rounds: 12, icon: "🔥", xpReq: 50 },
  { id: 3, name: "Advanced", desc: "Preterite regular", color: "text-secondary", bg: "bg-secondary/10", border: "border-secondary/30", glow: "glow-warning", maxDiff: 3, rounds: 14, icon: "⚡", xpReq: 150 },
  { id: 4, name: "Expert", desc: "Preterite irregular", color: "text-primary", bg: "bg-primary/10", border: "border-primary/30", glow: "glow-primary", maxDiff: 4, rounds: 16, icon: "💎", xpReq: 300 },
  { id: 5, name: "Master", desc: "Subjunctive & imperfect", color: "text-destructive", bg: "bg-destructive/10", border: "border-destructive/30", glow: "glow-primary", maxDiff: 5, rounds: 18, icon: "👑", xpReq: 500 },
];

// XP particle burst
function XPBurst({ amount, x, y }: { amount: number; x: number; y: number }) {
  return (
    <motion.div
      initial={{ opacity: 1, y: 0, scale: 1 }}
      animate={{ opacity: 0, y: -60, scale: 1.5 }}
      transition={{ duration: 0.8 }}
      className="fixed pointer-events-none z-50 font-display font-black text-secondary text-lg"
      style={{ left: x, top: y }}
    >
      +{amount} XP
    </motion.div>
  );
}

export default function VerbMatch() {
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVELS[0] | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem("verb_match_level");
    return saved ? parseInt(saved) : 1;
  });
  const [totalXP, setTotalXP] = useState(() => {
    const saved = localStorage.getItem("verb_match_xp");
    return saved ? parseInt(saved) : 0;
  });

  if (!selectedLevel) {
    return <LevelSelect unlockedLevel={unlockedLevel} totalXP={totalXP} onSelect={setSelectedLevel} />;
  }

  return (
    <GameRound
      level={selectedLevel}
      totalXP={totalXP}
      onComplete={(passed, earnedXP) => {
        const newXP = totalXP + earnedXP;
        setTotalXP(newXP);
        localStorage.setItem("verb_match_xp", String(newXP));
        if (passed && selectedLevel.id >= unlockedLevel && selectedLevel.id < 5) {
          const next = selectedLevel.id + 1;
          setUnlockedLevel(next);
          localStorage.setItem("verb_match_level", String(next));
        }
      }}
      onBack={() => setSelectedLevel(null)}
    />
  );
}

function LevelSelect({ unlockedLevel, totalXP, onSelect }: { unlockedLevel: number; totalXP: number; onSelect: (l: typeof LEVELS[0]) => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3" />
      </div>

      <header className="border-b border-border/20 px-4 py-3 relative z-10 backdrop-blur-sm bg-background/80">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">🎯 Verb Match</h1>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/10 border border-secondary/30 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span className="font-display font-bold text-sm text-secondary">{totalXP} XP</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-lg mx-auto w-full relative z-10">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="font-display font-black text-4xl text-foreground mb-2">Choose Level</h2>
          <p className="text-muted-foreground text-sm">Get 70%+ accuracy to unlock the next level</p>
        </motion.div>

        <div className="w-full space-y-3">
          {LEVELS.map((level, i) => {
            const locked = level.id > unlockedLevel;
            const completed = level.id < unlockedLevel;
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => !locked && onSelect(level)}
                disabled={locked}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  locked
                    ? "border-border/20 bg-muted/10 opacity-40 cursor-not-allowed"
                    : completed
                    ? `${level.border} ${level.bg} cursor-pointer hover:scale-[1.02]`
                    : `border-border/50 bg-card/50 cursor-pointer hover:border-primary/40 hover:bg-primary/5 hover:scale-[1.02]`
                }`}
              >
                <span className="text-3xl">{locked ? "🔒" : level.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-bold text-lg ${locked ? "text-muted-foreground" : level.color}`}>
                      {level.name}
                    </span>
                    {completed && <Star className="h-4 w-4 text-secondary fill-secondary" />}
                  </div>
                  <p className="text-muted-foreground text-xs">{level.desc} • {level.rounds} rounds</p>
                </div>
                <span className="text-sm font-display font-bold text-muted-foreground">Lv.{level.id}</span>
              </motion.button>
            );
          })}
        </div>
      </main>
    </div>
  );
}

function GameRound({
  level,
  totalXP,
  onComplete,
  onBack,
}: {
  level: typeof LEVELS[0];
  totalXP: number;
  onComplete: (passed: boolean, earnedXP: number) => void;
  onBack: () => void;
}) {
  const pool = getVerbsByDifficulty(level.maxDiff);
  const [challenges] = useState(() => shuffle([...pool]).slice(0, level.rounds));
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState(() => generateOptions(challenges[0], pool));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [xpBursts, setXpBursts] = useState<{ id: number; amount: number; x: number; y: number }[]>([]);
  const [earnedXP, setEarnedXP] = useState(0);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);
  const burstIdRef = useRef(0);

  const current = challenges[currentIdx];

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return;
      setSelected(option);
      const correct = option === current.answer;
      setIsCorrect(correct);

      if (correct) {
        const newStreak = streak + 1;
        const points = 10 + streak * 3;
        const xp = 5 + Math.floor(streak * 2);
        setScore((s) => s + points);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
        setEarnedXP((x) => x + xp);

        // XP burst animation
        const id = burstIdRef.current++;
        setXpBursts((b) => [...b, { id, amount: xp, x: window.innerWidth / 2, y: window.innerHeight / 2 - 50 }]);
        setTimeout(() => setXpBursts((b) => b.filter((burst) => burst.id !== id)), 1000);
      } else {
        setStreak(0);
      }

      setTimeout(() => {
        if (currentIdx + 1 >= challenges.length) {
          setFinished(true);
        } else {
          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx);
          setOptions(generateOptions(challenges[nextIdx], pool));
          setSelected(null);
          setIsCorrect(null);
        }
      }, 1100);
    },
    [selected, current, streak, currentIdx, challenges, pool]
  );

  useEffect(() => {
    if (finished && !savedRef.current) {
      savedRef.current = true;
      const accuracy = challenges.length > 0 ? correctCount / challenges.length : 0;
      saveScore("verb_match", score, accuracy, bestStreak);
      onComplete(accuracy >= 0.7, earnedXP);
    }
  }, [finished, score, correctCount, bestStreak, saveScore, challenges.length, onComplete, earnedXP]);

  const progress = ((currentIdx + (selected ? 1 : 0)) / challenges.length) * 100;
  const accuracy = challenges.length > 0 ? Math.round((correctCount / challenges.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-accent/3" />
      </div>

      {/* XP bursts */}
      <AnimatePresence>
        {xpBursts.map((burst) => (
          <XPBurst key={burst.id} amount={burst.amount} x={burst.x} y={burst.y} />
        ))}
      </AnimatePresence>

      <header className="border-b border-border/20 px-4 py-3 relative z-10 backdrop-blur-sm bg-background/80">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Levels</span>
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">
            {level.icon} {level.name}
          </h1>
          <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/10 border border-secondary/30 rounded-full">
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span className="font-display font-bold text-sm text-secondary">{earnedXP}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-5 max-w-2xl mx-auto w-full relative z-10">
        {!finished ? (
          <>
            {/* Stats bar */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card/60 border border-border/30 rounded-full backdrop-blur-sm">
                  <span className="text-xs text-muted-foreground">{currentIdx + 1}/{challenges.length}</span>
                </div>
                {streak > 1 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-accent/20 border border-accent/40 rounded-full"
                  >
                    <Flame className="h-3.5 w-3.5 text-accent" />
                    <span className="font-display font-bold text-sm text-accent">{streak}</span>
                  </motion.div>
                )}
              </div>
              <motion.span
                key={score}
                initial={{ scale: 1.3 }}
                animate={{ scale: 1 }}
                className="font-display font-black text-2xl text-foreground"
              >
                {score}
              </motion.span>
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden mb-6">
              <motion.div
                className={`h-full rounded-full bg-gradient-to-r ${
                  progress > 75 ? "from-success to-accent" : "from-primary to-accent"
                }`}
                animate={{ width: `${progress}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -20, scale: 0.95 }}
                transition={{ duration: 0.25 }}
                className="w-full"
              >
                {/* Question Card */}
                <div className="relative bg-card/80 backdrop-blur-sm border border-border/40 rounded-2xl p-7 text-center mb-5 overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
                  <div className="relative z-10">
                    <p className="text-muted-foreground text-xs mb-2 uppercase tracking-widest">
                      Conjugate in <span className={`font-bold ${level.color}`}>{current.tense}</span>
                    </p>
                    <h2 className="font-display font-black text-4xl text-foreground mb-1">{current.infinitive}</h2>
                    <p className="text-muted-foreground text-sm mb-4">({current.english})</p>
                    <motion.div
                      animate={{ scale: [1, 1.05, 1] }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="inline-block px-5 py-2 bg-secondary/10 border border-secondary/30 rounded-full"
                    >
                      <span className="font-display font-black text-secondary text-xl">{current.pronoun}</span>
                    </motion.div>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  {options.map((option, i) => {
                    let style = "bg-card/70 backdrop-blur-sm border-border/40 hover:border-primary/60 hover:bg-primary/5 hover:scale-[1.03] active:scale-[0.97]";
                    if (selected) {
                      if (option === current.answer) {
                        style = "bg-success/20 border-success text-success ring-2 ring-success/40 scale-[1.03]";
                      } else if (option === selected && !isCorrect) {
                        style = "bg-destructive/20 border-destructive text-destructive ring-2 ring-destructive/40 scale-[0.97]";
                      } else {
                        style = "bg-muted/20 border-border/20 opacity-30";
                      }
                    }
                    return (
                      <motion.button
                        key={option}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.05 }}
                        onClick={() => handleSelect(option)}
                        disabled={!!selected}
                        className={`border-2 rounded-xl px-4 py-4 font-display font-bold text-lg transition-all duration-200 ${style}`}
                      >
                        {option}
                      </motion.button>
                    );
                  })}
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10, scale: 0.9 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      className="flex items-center justify-center gap-2 mt-5"
                    >
                      {isCorrect ? (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300 }}
                          className="flex items-center gap-2 px-4 py-2 bg-success/15 border border-success/30 rounded-full"
                        >
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="font-display font-bold text-success">¡Correcto!</span>
                          {streak > 1 && <span className="text-xs text-accent font-bold">🔥 {streak}x</span>}
                        </motion.div>
                      ) : (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="flex items-center gap-2 px-4 py-2 bg-destructive/15 border border-destructive/30 rounded-full"
                        >
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-display text-destructive">
                            It was <span className="font-bold">{current.answer}</span>
                          </span>
                        </motion.div>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          /* RESULTS */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <motion.div
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Trophy className="h-16 w-16 text-secondary mx-auto mb-3" />
              <h2 className="font-display font-black text-4xl text-foreground mb-1">¡Terminado!</h2>
              <p className="text-muted-foreground mb-2">{level.icon} {level.name} Complete</p>
            </motion.div>

            {accuracy >= 70 && level.id < 5 && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", delay: 0.4 }}
                className="mb-4 px-6 py-2 bg-success/15 border border-success/30 rounded-full"
              >
                <span className="text-success font-display font-bold">🎉 Next level unlocked!</span>
              </motion.div>
            )}
            {accuracy < 70 && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="text-destructive/70 text-sm mb-4"
              >
                Need 70%+ accuracy to unlock next level
              </motion.p>
            )}

            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.5 }}
              className="mb-6"
            >
              <div className="font-display font-black text-5xl text-gradient-gold">{score}</div>
              <div className="text-sm text-muted-foreground">Score</div>
            </motion.div>

            <div className="flex gap-6 mb-6">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <div className="font-display font-bold text-2xl text-success">{accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                <div className="font-display font-bold text-2xl text-accent">{bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }}>
                <div className="font-display font-bold text-2xl text-secondary">+{earnedXP}</div>
                <div className="text-xs text-muted-foreground">XP Earned</div>
              </motion.div>
            </div>

            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.9 }}
              className="flex gap-3"
            >
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-7 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-bold hover:scale-105 active:scale-95 transition-transform glow-primary"
              >
                <RotateCcw className="h-5 w-5" />
                Retry
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-7 py-3 bg-card/80 border border-border/40 text-foreground rounded-xl font-display font-bold hover:bg-muted/50 transition-colors"
              >
                Levels
              </button>
            </motion.div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
