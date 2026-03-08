import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Fish, Waves, Trophy, Anchor, Timer, Sparkles } from "lucide-react";
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
const ANSWER_TIME = 8; // seconds per question

type Rarity = "common" | "rare" | "epic" | "legendary";
type Phase = "idle" | "casting" | "reeling" | "caught" | "escaped" | "timeout" | "done";

const ZONES = [
  { name: "Shallow Waters", depth: "0-5m", color: "from-accent/20 to-accent/5", rounds: [0, 4] },
  { name: "Open Sea", depth: "5-20m", color: "from-primary/20 to-primary/5", rounds: [5, 9] },
  { name: "Deep Ocean", depth: "20-50m", color: "from-secondary/20 to-secondary/5", rounds: [10, 14] },
];

function getRarity(round: number): Rarity {
  if (round >= 12) return Math.random() < 0.3 ? "legendary" : "epic";
  if (round >= 8) return Math.random() < 0.4 ? "epic" : "rare";
  if (round >= 4) return Math.random() < 0.5 ? "rare" : "common";
  return "common";
}

const RARITY_CONFIG: Record<Rarity, { label: string; emoji: string; color: string; points: number }> = {
  common: { label: "Common", emoji: "🐟", color: "text-muted-foreground", points: 10 },
  rare: { label: "Rare", emoji: "🐠", color: "text-accent", points: 20 },
  epic: { label: "Epic", emoji: "🐡", color: "text-primary", points: 35 },
  legendary: { label: "Legendary", emoji: "🐋", color: "text-secondary", points: 50 },
};

export default function VerbFishing() {
  const [allChallenges] = useState(() => shuffle([...VERB_CHALLENGES]));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [caught, setCaught] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [currentRarity, setCurrentRarity] = useState<Rarity>("common");
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const [collection, setCollection] = useState<{ verb: string; rarity: Rarity }[]>([]);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const current = allChallenges[round % allChallenges.length];
  const currentZone = ZONES.find((z) => round >= z.rounds[0] && round <= z.rounds[1]) || ZONES[0];

  // Timer logic
  useEffect(() => {
    if (phase === "reeling" && !selected) {
      setTimeLeft(ANSWER_TIME);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) {
            clearInterval(timerRef.current!);
            return 0;
          }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, selected]);

  // Timeout handler
  useEffect(() => {
    if (timeLeft === 0 && phase === "reeling" && !selected) {
      setPhase("timeout");
      setStreak(0);
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) setPhase("done");
        else { setRound((r) => r + 1); setPhase("idle"); }
      }, 1500);
    }
  }, [timeLeft, phase, selected, round]);

  const castLine = useCallback(() => {
    setPhase("casting");
    setSelected(null);
    setOptions(generateOptions(current));
    const rarity = getRarity(round);
    setCurrentRarity(rarity);
    setTimeout(() => setPhase("reeling"), 1500 + Math.random() * 1000);
  }, [current, round]);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected || phase !== "reeling") return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(option);
      const correct = option === current.answer;

      if (correct) {
        const newStreak = streak + 1;
        const rarityBonus = RARITY_CONFIG[currentRarity].points;
        const streakBonus = streak * 3;
        const timeBonus = Math.floor(timeLeft * 2);
        setScore((s) => s + rarityBonus + streakBonus + timeBonus);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
        setCaught((c) => c + 1);
        setCollection((c) => [...c, { verb: current.answer, rarity: currentRarity }]);
        setPhase("caught");
      } else {
        setStreak(0);
        setPhase("escaped");
      }

      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) setPhase("done");
        else { setRound((r) => r + 1); setPhase("idle"); }
      }, 1500);
    },
    [selected, phase, current, streak, round, currentRarity, timeLeft]
  );

  useEffect(() => {
    if (phase === "done" && !savedRef.current) {
      savedRef.current = true;
      const accuracy = TOTAL_ROUNDS > 0 ? caught / TOTAL_ROUNDS : 0;
      saveScore("verb_fishing", score, accuracy, bestStreak);
    }
  }, [phase, score, caught, bestStreak, saveScore]);

  const restart = () => window.location.reload();

  const rarityCount = (r: Rarity) => collection.filter((c) => c.rarity === r).length;

  return (
    <div className="min-h-screen bg-background flex flex-col overflow-hidden">
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
            {/* Zone indicator */}
            <motion.div
              key={currentZone.name}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={`w-full rounded-xl bg-gradient-to-r ${currentZone.color} px-4 py-2 mb-4 flex items-center justify-between`}
            >
              <div className="flex items-center gap-2">
                <Waves className="h-4 w-4 text-accent" />
                <span className="text-sm font-display font-bold text-foreground">{currentZone.name}</span>
              </div>
              <span className="text-xs text-muted-foreground">{currentZone.depth}</span>
            </motion.div>

            {/* Stats Bar */}
            <div className="w-full flex items-center justify-between mb-3">
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
            <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[320px]">
              {/* Animated water */}
              <div className="absolute bottom-0 left-0 right-0 h-40 overflow-hidden rounded-b-2xl">
                <motion.div
                  animate={{ x: [-20, 20, -20] }}
                  transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                  className={`absolute inset-0 bg-gradient-to-t ${currentZone.color} opacity-60`}
                />
                <motion.div
                  animate={{ x: [20, -20, 20] }}
                  transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                  className="absolute inset-0 bg-gradient-to-t from-accent/5 to-transparent"
                />
              </div>

              <div className="relative z-10 w-full">
                {phase === "idle" && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                    <Anchor className="h-14 w-14 text-muted-foreground/30 mx-auto mb-4" />
                    <button
                      onClick={castLine}
                      className="px-8 py-4 bg-accent text-accent-foreground rounded-2xl font-display font-bold text-xl hover:opacity-90 transition-all hover:scale-105 glow-warning"
                    >
                      🎣 Cast Line
                    </button>
                    <p className="text-xs text-muted-foreground mt-3">Round {round + 1} • {currentZone.name}</p>
                  </motion.div>
                )}

                {phase === "casting" && (
                  <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                    <motion.div animate={{ rotate: [0, -15, 15, -10, 10, 0], y: [0, -5, 0] }} transition={{ duration: 1.5, ease: "easeInOut" }}>
                      <Waves className="h-16 w-16 text-accent mx-auto" />
                    </motion.div>
                    <p className="text-muted-foreground font-display mt-3 animate-pulse">Something's biting...</p>
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      transition={{ delay: 0.5 }}
                      className={`mt-2 inline-flex items-center gap-1 text-sm ${RARITY_CONFIG[currentRarity].color} font-bold`}
                    >
                      <Sparkles className="h-3 w-3" />
                      {RARITY_CONFIG[currentRarity].label} fish spotted!
                    </motion.div>
                  </motion.div>
                )}

                {phase === "reeling" && (
                  <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                    {/* Timer bar */}
                    <div className="w-full mb-3 flex items-center gap-2">
                      <Timer className={`h-4 w-4 ${timeLeft <= 3 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                      <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          className={`h-full rounded-full ${timeLeft <= 3 ? "bg-destructive" : "bg-accent"}`}
                          animate={{ width: `${(timeLeft / ANSWER_TIME) * 100}%` }}
                          transition={{ duration: 0.3 }}
                        />
                      </div>
                      <span className={`text-sm font-bold font-display ${timeLeft <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
                        {timeLeft}s
                      </span>
                    </div>

                    {/* Rarity badge */}
                    <div className="flex justify-center mb-2">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-card border border-border ${RARITY_CONFIG[currentRarity].color}`}>
                        {RARITY_CONFIG[currentRarity].emoji} {RARITY_CONFIG[currentRarity].label} • {RARITY_CONFIG[currentRarity].points}pts
                      </span>
                    </div>

                    {/* Verb Card */}
                    <div className="bg-card border border-accent/30 rounded-2xl p-5 text-center mb-4 relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-accent/5 to-transparent" />
                      <div className="relative z-10">
                        <p className="text-muted-foreground text-sm mb-1">
                          Conjugate <span className="text-accent font-bold">{current.tense}</span>
                        </p>
                        <h2 className="font-display font-bold text-2xl text-foreground mb-1">{current.infinitive}</h2>
                        <p className="text-muted-foreground text-xs mb-2">({current.english})</p>
                        <div className="inline-block px-3 py-1 bg-muted rounded-full">
                          <span className="font-display font-bold text-secondary">{current.pronoun}</span>
                        </div>
                      </div>
                    </div>

                    {/* Options */}
                    <div className="grid grid-cols-2 gap-3">
                      {options.map((option, i) => (
                        <motion.button
                          key={option}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.08 }}
                          onClick={() => handleSelect(option)}
                          disabled={!!selected}
                          className={`border-2 rounded-xl px-4 py-3 font-display font-bold text-lg transition-all duration-200 ${
                            selected
                              ? option === current.answer
                                ? "bg-success/15 border-success text-success ring-2 ring-success/30"
                                : option === selected
                                ? "bg-destructive/15 border-destructive text-destructive ring-2 ring-destructive/30"
                                : "bg-muted/50 border-border opacity-50"
                              : "bg-card border-border/50 hover:border-accent hover:bg-accent/5"
                          }`}
                        >
                          {RARITY_CONFIG[currentRarity].emoji} {option}
                        </motion.button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {phase === "caught" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <motion.div animate={{ y: [0, -15, 0] }} transition={{ duration: 0.5 }}>
                      <span className="text-6xl">{RARITY_CONFIG[currentRarity].emoji}</span>
                    </motion.div>
                    <p className={`font-display font-bold text-2xl mt-2 ${RARITY_CONFIG[currentRarity].color}`}>
                      {RARITY_CONFIG[currentRarity].label} catch! 🎉
                    </p>
                    <p className="text-muted-foreground text-sm mt-1">{current.answer}</p>
                    <p className="text-xs text-accent mt-1">+{RARITY_CONFIG[currentRarity].points} pts {timeLeft > 0 && `+ ${Math.floor(timeLeft * 2)} time bonus`}</p>
                  </motion.div>
                )}

                {phase === "escaped" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <motion.div animate={{ x: [0, 40, 80], opacity: [1, 0.5, 0] }} transition={{ duration: 1 }}>
                      <span className="text-6xl">{RARITY_CONFIG[currentRarity].emoji}</span>
                    </motion.div>
                    <p className="font-display font-bold text-xl text-destructive mt-2">It got away!</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Answer: <span className="font-bold text-foreground">{current.answer}</span>
                    </p>
                  </motion.div>
                )}

                {phase === "timeout" && (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                    <Timer className="h-16 w-16 text-destructive mx-auto" />
                    <p className="font-display font-bold text-xl text-destructive mt-2">Too slow!</p>
                    <p className="text-muted-foreground text-sm mt-1">
                      Answer: <span className="font-bold text-foreground">{current.answer}</span>
                    </p>
                  </motion.div>
                )}
              </div>
            </div>
          </>
        ) : (
          /* Results */
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center w-full">
            <Trophy className="h-14 w-14 text-secondary mb-3" />
            <h2 className="font-display font-bold text-3xl text-foreground mb-1">Fishing Complete!</h2>
            <p className="text-muted-foreground mb-6">Great expedition</p>

            <div className="flex gap-6 mb-6">
              <div>
                <div className="font-display font-bold text-3xl text-foreground">{score}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="font-display font-bold text-3xl text-success">{caught}/{TOTAL_ROUNDS}</div>
                <div className="text-xs text-muted-foreground">Caught</div>
              </div>
              <div>
                <div className="font-display font-bold text-3xl text-accent">{bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
            </div>

            {/* Collection summary */}
            {collection.length > 0 && (
              <div className="w-full max-w-sm bg-card border border-border rounded-xl p-4 mb-6">
                <h3 className="font-display font-bold text-sm text-foreground mb-3">🎣 Your Catch</h3>
                <div className="grid grid-cols-2 gap-2">
                  {(["common", "rare", "epic", "legendary"] as Rarity[]).map((r) => {
                    const count = rarityCount(r);
                    if (count === 0) return null;
                    return (
                      <div key={r} className="flex items-center gap-2 text-sm">
                        <span>{RARITY_CONFIG[r].emoji}</span>
                        <span className={`font-bold ${RARITY_CONFIG[r].color}`}>{count}x</span>
                        <span className="text-muted-foreground">{RARITY_CONFIG[r].label}</span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

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
