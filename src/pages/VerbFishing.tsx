import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Fish, Waves, Trophy, Anchor } from "lucide-react";
import { VERB_CHALLENGES, VerbChallenge } from "@/data/spanishWords";
import { useGameScore } from "@/hooks/useGameScore";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function generateOptions(challenge: VerbChallenge): string[] {
  const wrong = new Set<string>();
  while (wrong.size < 3) {
    const rand = VERB_CHALLENGES[Math.floor(Math.random() * VERB_CHALLENGES.length)];
    if (rand.answer !== challenge.answer) wrong.add(rand.answer);
  }
  return shuffle([challenge.answer, ...Array.from(wrong)]);
}

const TOTAL_ROUNDS = 15;
const CAST_DURATION = 2000;

type Phase = "idle" | "casting" | "reeling" | "caught" | "escaped" | "done";

export default function VerbFishing() {
  const [allChallenges] = useState(() => shuffle([...VERB_CHALLENGES]));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [caught, setCaught] = useState(0);
  const [escaped, setEscaped] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);

  const current = allChallenges[round % allChallenges.length];

  const castLine = useCallback(() => {
    setPhase("casting");
    setSelected(null);
    setOptions(generateOptions(current));
    setTimeout(() => setPhase("reeling"), CAST_DURATION);
  }, [current]);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected || phase !== "reeling") return;
      setSelected(option);
      const correct = option === current.answer;

      if (correct) {
        const newStreak = streak + 1;
        setScore((s) => s + 15 + streak * 3);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCaught((c) => c + 1);
        setPhase("caught");
      } else {
        setStreak(0);
        setEscaped((e) => e + 1);
        setPhase("escaped");
      }

      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) {
          setPhase("done");
        } else {
          setRound((r) => r + 1);
          setPhase("idle");
        }
      }, 1500);
    },
    [selected, phase, current, streak, round]
  );

  useEffect(() => {
    if (phase === "done" && !savedRef.current) {
      savedRef.current = true;
      const accuracy = TOTAL_ROUNDS > 0 ? caught / TOTAL_ROUNDS : 0;
      saveScore("verb_fishing", score, accuracy, bestStreak);
    }
  }, [phase, score, caught, bestStreak, saveScore]);

  const restart = () => window.location.reload();

  const waterBobbing = {
    y: [0, -6, 0, -3, 0],
    transition: { duration: 3, repeat: Infinity, ease: "easeInOut" },
  };

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
      {/* Header */}
      <header className="border-b border-border/30 px-4 py-3 relative z-10">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Fish className="h-5 w-5 text-accent" /> Verb Fishing
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-2xl mx-auto w-full relative">
        {phase !== "done" ? (
          <>
            {/* Stats Bar */}
            <div className="w-full flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <div className="text-center">
                  <div className="font-display font-bold text-xl text-foreground">{score}</div>
                  <div className="text-xs text-muted-foreground">Score</div>
                </div>
                <div className="text-center">
                  <div className="font-display font-bold text-xl text-success">{caught}</div>
                  <div className="text-xs text-muted-foreground">Caught</div>
                </div>
                {streak > 1 && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-sm font-bold text-accent">
                    🔥 {streak}
                  </motion.div>
                )}
              </div>
              <span className="text-sm text-muted-foreground">{round + 1}/{TOTAL_ROUNDS}</span>
            </div>

            {/* Progress */}
            <div className="w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
              <motion.div
                className="h-full bg-gradient-to-r from-accent to-primary rounded-full"
                animate={{ width: `${((round + (selected ? 1 : 0)) / TOTAL_ROUNDS) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Fishing Scene */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[280px]">
              {/* Water surface */}
              <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-accent/10 to-transparent rounded-b-2xl" />
              
              <motion.div animate={waterBobbing} className="relative z-10 mb-8">
                {phase === "idle" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <Anchor className="h-16 w-16 text-muted-foreground/40 mx-auto mb-4" />
                    <button
                      onClick={castLine}
                      className="px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-display font-bold text-xl hover:opacity-90 transition-opacity glow-warning"
                    >
                      🎣 Cast Line
                    </button>
                  </motion.div>
                )}

                {phase === "casting" && (
                  <motion.div
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="text-center"
                  >
                    <motion.div
                      animate={{ rotate: [0, -15, 15, -10, 10, 0] }}
                      transition={{ duration: 1.5, ease: "easeInOut" }}
                    >
                      <Waves className="h-16 w-16 text-accent mx-auto" />
                    </motion.div>
                    <p className="text-muted-foreground font-display mt-3 animate-pulse">Something's biting...</p>
                  </motion.div>
                )}

                {(phase === "reeling") && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                    {/* Verb Card */}
                    <div className="bg-card border border-accent/30 rounded-2xl p-6 text-center mb-5 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                      <div className="relative z-10">
                        <Fish className="h-8 w-8 text-accent mx-auto mb-2" />
                        <p className="text-muted-foreground text-sm mb-1">
                          Conjugate <span className="text-accent font-bold">{current.tense}</span>
                        </p>
                        <h2 className="font-display font-bold text-3xl text-foreground mb-1">{current.infinitive}</h2>
                        <p className="text-muted-foreground text-sm mb-3">({current.english})</p>
                        <div className="inline-block px-4 py-1.5 bg-muted rounded-full">
                          <span className="font-display font-bold text-secondary text-lg">{current.pronoun}</span>
                        </div>
                      </div>
                    </div>

                    {/* Options as fish */}
                    <div className="grid grid-cols-2 gap-3">
                      {options.map((option, i) => (
                        <motion.button
                          key={option}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.1 }}
                          onClick={() => handleSelect(option)}
                          disabled={!!selected}
                          className={`border-2 rounded-xl px-4 py-4 font-display font-bold text-lg transition-all duration-200 ${
                            selected
                              ? option === current.answer
                                ? "bg-success/15 border-success text-success ring-2 ring-success/30"
                                : option === selected
                                ? "bg-destructive/15 border-destructive text-destructive ring-2 ring-destructive/30"
                                : "bg-muted/50 border-border opacity-50"
                              : "bg-card border-border/50 hover:border-accent hover:bg-accent/5"
                          }`}
                        >
                          🐟 {option}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {phase === "caught" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <motion.div animate={{ y: [0, -10, 0] }} transition={{ duration: 0.5 }}>
                      <Fish className="h-20 w-20 text-success mx-auto" />
                    </motion.div>
                    <p className="font-display font-bold text-2xl text-success mt-2">Caught it! 🎉</p>
                    <p className="text-muted-foreground text-sm mt-1">{current.answer}</p>
                  </motion.div>
                )}

                {phase === "escaped" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <motion.div animate={{ x: [0, 30, 60], opacity: [1, 0.5, 0] }} transition={{ duration: 1 }}>
                      <Fish className="h-20 w-20 text-destructive mx-auto" />
                    </motion.div>
                    <p className="font-display font-bold text-xl text-destructive mt-2">It got away!</p>
                    <p className="text-muted-foreground text-sm mt-1">Answer: <span className="font-bold text-foreground">{current.answer}</span></p>
                  </motion.div>
                )}
              </motion.div>
            </div>
          </>
        ) : (
          /* Results */
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center">
            <Trophy className="h-16 w-16 text-secondary mb-4" />
            <h2 className="font-display font-bold text-3xl text-foreground mb-2">Fishing Complete!</h2>
            <p className="text-muted-foreground mb-8">Great haul today</p>

            <div className="flex gap-8 mb-8">
              <div>
                <div className="font-display font-bold text-4xl text-foreground">{score}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-success">{caught}/{TOTAL_ROUNDS}</div>
                <div className="text-xs text-muted-foreground">Caught</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-accent">{bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
            </div>

            <button onClick={restart} className="flex items-center gap-2 px-8 py-3 bg-accent text-accent-foreground rounded-xl font-display font-bold text-lg hover:opacity-90 transition-opacity glow-warning">
              <RotateCcw className="h-5 w-5" />
              Fish Again
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
