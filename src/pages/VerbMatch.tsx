import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, CheckCircle, XCircle, Lock, Star } from "lucide-react";
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
  { id: 1, name: "Beginner", desc: "Present regular verbs", color: "text-success", maxDiff: 1, rounds: 10, icon: "🌱" },
  { id: 2, name: "Intermediate", desc: "Present irregular verbs", color: "text-accent", maxDiff: 2, rounds: 12, icon: "🔥" },
  { id: 3, name: "Advanced", desc: "Preterite regular", color: "text-secondary", maxDiff: 3, rounds: 14, icon: "⚡" },
  { id: 4, name: "Expert", desc: "Preterite irregular", color: "text-primary", maxDiff: 4, rounds: 16, icon: "💎" },
  { id: 5, name: "Master", desc: "Subjunctive & imperfect", color: "text-destructive", maxDiff: 5, rounds: 18, icon: "👑" },
];

export default function VerbMatch() {
  const [selectedLevel, setSelectedLevel] = useState<typeof LEVELS[0] | null>(null);
  const [unlockedLevel, setUnlockedLevel] = useState(() => {
    const saved = localStorage.getItem("verb_match_level");
    return saved ? parseInt(saved) : 1;
  });

  if (!selectedLevel) {
    return <LevelSelect unlockedLevel={unlockedLevel} onSelect={setSelectedLevel} />;
  }

  return (
    <GameRound
      level={selectedLevel}
      onComplete={(passed) => {
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

function LevelSelect({ unlockedLevel, onSelect }: { unlockedLevel: number; onSelect: (l: typeof LEVELS[0]) => void }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">🎯 Verb Match</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-8 max-w-lg mx-auto w-full">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
          <h2 className="font-display font-bold text-3xl text-foreground mb-2">Choose Level</h2>
          <p className="text-muted-foreground text-sm">Complete a level with 70%+ accuracy to unlock the next</p>
        </motion.div>

        <div className="w-full space-y-3">
          {LEVELS.map((level, i) => {
            const locked = level.id > unlockedLevel;
            return (
              <motion.button
                key={level.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.08 }}
                onClick={() => !locked && onSelect(level)}
                disabled={locked}
                className={`w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all text-left ${
                  locked
                    ? "border-border/30 bg-muted/20 opacity-50 cursor-not-allowed"
                    : "border-border hover:border-primary hover:bg-primary/5 cursor-pointer"
                }`}
              >
                <span className="text-3xl">{locked ? "🔒" : level.icon}</span>
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className={`font-display font-bold text-lg ${locked ? "text-muted-foreground" : level.color}`}>
                      {level.name}
                    </span>
                    {level.id < unlockedLevel && <Star className="h-4 w-4 text-secondary fill-secondary" />}
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
  onComplete,
  onBack,
}: {
  level: typeof LEVELS[0];
  onComplete: (passed: boolean) => void;
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
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);

  const current = challenges[currentIdx];

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return;
      setSelected(option);
      const correct = option === current.answer;
      setIsCorrect(correct);

      if (correct) {
        const newStreak = streak + 1;
        setScore((s) => s + 10 + streak * 2);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCorrectCount((c) => c + 1);
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
      }, 1200);
    },
    [selected, current, streak, currentIdx, challenges, pool]
  );

  useEffect(() => {
    if (finished && !savedRef.current) {
      savedRef.current = true;
      const accuracy = challenges.length > 0 ? correctCount / challenges.length : 0;
      saveScore("verb_match", score, accuracy, bestStreak);
      onComplete(accuracy >= 0.7);
    }
  }, [finished, score, correctCount, bestStreak, saveScore, challenges.length, onComplete]);

  const progress = ((currentIdx + (selected ? 1 : 0)) / challenges.length) * 100;
  const accuracy = challenges.length > 0 ? Math.round((correctCount / challenges.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={onBack} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Levels</span>
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">
            {level.icon} {level.name}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-2xl mx-auto w-full">
        {!finished ? (
          <>
            <div className="w-full mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">{currentIdx + 1}/{challenges.length}</span>
                  {streak > 1 && (
                    <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-accent">
                      🔥 {streak} streak
                    </motion.span>
                  )}
                </div>
                <span className="font-display font-bold text-xl text-foreground">{score}</span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="bg-card border border-border rounded-2xl p-8 text-center mb-6">
                  <p className="text-muted-foreground text-sm mb-1">
                    Conjugate in the <span className="text-accent font-bold">{current.tense}</span> tense
                  </p>
                  <h2 className="font-display font-bold text-3xl text-foreground mb-2">{current.infinitive}</h2>
                  <p className="text-muted-foreground text-sm mb-4">({current.english})</p>
                  <div className="inline-block px-4 py-1.5 bg-muted rounded-full">
                    <span className="font-display font-bold text-secondary text-lg">{current.pronoun}</span>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {options.map((option) => {
                    let style = "bg-card border-border hover:border-primary hover:bg-primary/5";
                    if (selected) {
                      if (option === current.answer) {
                        style = "bg-success/15 border-success text-success ring-2 ring-success/30";
                      } else if (option === selected && !isCorrect) {
                        style = "bg-destructive/15 border-destructive text-destructive ring-2 ring-destructive/30";
                      } else {
                        style = "bg-muted/50 border-border opacity-50";
                      }
                    }
                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        disabled={!!selected}
                        className={`border-2 rounded-xl px-4 py-4 font-display font-bold text-lg transition-all duration-200 ${style}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                <AnimatePresence>
                  {selected && (
                    <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-center gap-2 mt-4">
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="font-display font-bold text-success">¡Correcto!</span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-display text-destructive">
                            It was <span className="font-bold">{current.answer}</span>
                          </span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <Trophy className="h-16 w-16 text-secondary mb-4" />
            <h2 className="font-display font-bold text-3xl text-foreground mb-2">¡Terminado!</h2>
            <p className="text-muted-foreground mb-2">{level.name} Complete</p>
            {accuracy >= 70 && level.id < 5 && (
              <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-success font-display font-bold mb-4">
                🎉 Next level unlocked!
              </motion.p>
            )}
            {accuracy < 70 && (
              <p className="text-destructive/80 text-sm mb-4">Need 70%+ accuracy to unlock next level</p>
            )}

            <div className="flex gap-8 mb-8">
              <div>
                <div className="font-display font-bold text-4xl text-foreground">{score}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-success">{accuracy}%</div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-accent">{bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => window.location.reload()}
                className="flex items-center gap-2 px-6 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity glow-primary"
              >
                <RotateCcw className="h-5 w-5" />
                Retry
              </button>
              <button
                onClick={onBack}
                className="flex items-center gap-2 px-6 py-3 bg-card border border-border text-foreground rounded-xl font-display font-bold hover:bg-muted transition-colors"
              >
                Levels
              </button>
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
