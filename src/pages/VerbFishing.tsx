import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, Timer, Sparkles, Coins, Zap } from "lucide-react";
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
const ANSWER_TIME = 10;

type Rarity = "common" | "uncommon" | "rare" | "epic" | "legendary" | "mythic";
type Phase = "ocean" | "casting" | "bite" | "reeling" | "reveal" | "caught" | "escaped" | "timeout" | "done";

interface FishType {
  name: string;
  emoji: string;
  rarity: Rarity;
  weight: string;
  points: number;
}

const FISH_POOL: Record<Rarity, FishType[]> = {
  common: [
    { name: "Sardine", emoji: "🐟", rarity: "common", weight: "0.2kg", points: 10 },
    { name: "Anchovy", emoji: "🐟", rarity: "common", weight: "0.1kg", points: 8 },
    { name: "Herring", emoji: "🐟", rarity: "common", weight: "0.3kg", points: 12 },
  ],
  uncommon: [
    { name: "Bass", emoji: "🐠", rarity: "uncommon", weight: "1.5kg", points: 20 },
    { name: "Trout", emoji: "🐠", rarity: "uncommon", weight: "2.0kg", points: 22 },
    { name: "Perch", emoji: "🐠", rarity: "uncommon", weight: "1.2kg", points: 18 },
  ],
  rare: [
    { name: "Swordfish", emoji: "🗡️🐟", rarity: "rare", weight: "45kg", points: 40 },
    { name: "Tuna", emoji: "🐟✨", rarity: "rare", weight: "30kg", points: 35 },
    { name: "Marlin", emoji: "🎣", rarity: "rare", weight: "50kg", points: 45 },
  ],
  epic: [
    { name: "Giant Squid", emoji: "🦑", rarity: "epic", weight: "150kg", points: 75 },
    { name: "Manta Ray", emoji: "🦈", rarity: "epic", weight: "200kg", points: 80 },
    { name: "Hammerhead", emoji: "🦈✨", rarity: "epic", weight: "180kg", points: 85 },
  ],
  legendary: [
    { name: "Golden Whale", emoji: "🐋", rarity: "legendary", weight: "500kg", points: 150 },
    { name: "Kraken", emoji: "🐙👑", rarity: "legendary", weight: "???kg", points: 200 },
  ],
  mythic: [
    { name: "Leviathan", emoji: "🐉🌊", rarity: "mythic", weight: "∞", points: 500 },
  ],
};

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; bg: string; glow: string; chance: number }> = {
  common:    { label: "Common",    color: "text-muted-foreground", bg: "bg-muted/30",           glow: "",                          chance: 40 },
  uncommon:  { label: "Uncommon",  color: "text-success",          bg: "bg-success/10",          glow: "glow-success",              chance: 25 },
  rare:      { label: "Rare",      color: "text-accent",           bg: "bg-accent/10",           glow: "glow-warning",              chance: 18 },
  epic:      { label: "Epic",      color: "text-primary",          bg: "bg-primary/10",          glow: "glow-primary",              chance: 10 },
  legendary: { label: "Legendary", color: "text-secondary",        bg: "bg-secondary/10",        glow: "glow-warning",              chance: 5 },
  mythic:    { label: "MYTHIC",    color: "text-gradient-gold",    bg: "bg-secondary/20",        glow: "glow-warning",              chance: 2 },
};

function rollRarity(round: number): Rarity {
  const luck = round * 2; // higher rounds = better luck
  const roll = Math.random() * 100;
  if (roll < 2 + luck * 0.3) return "mythic";
  if (roll < 7 + luck * 0.5) return "legendary";
  if (roll < 17 + luck * 0.8) return "epic";
  if (roll < 35 + luck) return "rare";
  if (roll < 60 + luck * 0.5) return "uncommon";
  return "common";
}

function pickFish(rarity: Rarity): FishType {
  const pool = FISH_POOL[rarity];
  return pool[Math.floor(Math.random() * pool.length)];
}

// Bubble component
function Bubble({ delay, left, size }: { delay: number; left: number; size: number }) {
  return (
    <motion.div
      className="absolute rounded-full bg-accent/10 border border-accent/20"
      style={{ width: size, height: size, left: `${left}%`, bottom: -10 }}
      initial={{ y: 0, opacity: 0.6 }}
      animate={{ y: -300, opacity: 0 }}
      transition={{ duration: 3 + Math.random() * 2, delay, repeat: Infinity, ease: "easeOut" }}
    />
  );
}

// Swimming fish background
function SwimmingFish({ delay, y, direction }: { delay: number; y: number; direction: 1 | -1 }) {
  const fish = ["🐟", "🐠", "🐡"][Math.floor(Math.random() * 3)];
  return (
    <motion.div
      className="absolute text-2xl opacity-20 pointer-events-none"
      style={{ top: `${y}%`, [direction > 0 ? "left" : "right"]: "-40px" }}
      initial={{ x: 0 }}
      animate={{ x: direction * (window.innerWidth + 80) }}
      transition={{ duration: 8 + Math.random() * 6, delay, repeat: Infinity, ease: "linear" }}
    >
      <span style={{ transform: direction < 0 ? "scaleX(-1)" : undefined, display: "inline-block" }}>{fish}</span>
    </motion.div>
  );
}

export default function VerbFishing() {
  const [allChallenges] = useState(() => shuffle([...VERB_CHALLENGES]));
  const [round, setRound] = useState(0);
  const [phase, setPhase] = useState<Phase>("ocean");
  const [options, setOptions] = useState<string[]>([]);
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [caught, setCaught] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [currentFish, setCurrentFish] = useState<FishType>(FISH_POOL.common[0]);
  const [timeLeft, setTimeLeft] = useState(ANSWER_TIME);
  const [collection, setCollection] = useState<FishType[]>([]);
  const [lastPoints, setLastPoints] = useState(0);
  const [comboMultiplier, setComboMultiplier] = useState(1);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);

  const current = allChallenges[round % allChallenges.length];

  // Timer
  useEffect(() => {
    if (phase === "reeling" && !selected) {
      setTimeLeft(ANSWER_TIME);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => {
          if (t <= 1) { clearInterval(timerRef.current!); return 0; }
          return t - 1;
        });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, selected]);

  // Timeout
  useEffect(() => {
    if (timeLeft === 0 && phase === "reeling" && !selected) {
      setPhase("timeout");
      setStreak(0);
      setComboMultiplier(1);
      setTimeout(() => {
        if (round + 1 >= TOTAL_ROUNDS) setPhase("done");
        else { setRound((r) => r + 1); setPhase("ocean"); }
      }, 2000);
    }
  }, [timeLeft, phase, selected, round]);

  const castLine = useCallback(() => {
    setPhase("casting");
    setSelected(null);
    setOptions(generateOptions(current));
    const rarity = rollRarity(round);
    const fish = pickFish(rarity);
    setCurrentFish(fish);

    // Casting -> bite -> reeling
    const castTime = 800;
    const biteTime = 1000 + Math.random() * 1500;
    setTimeout(() => setPhase("bite"), castTime);
    setTimeout(() => setPhase("reeling"), castTime + biteTime);
  }, [current, round]);

  const handleSelect = useCallback(
    (option: string) => {
      if (selected || phase !== "reeling") return;
      if (timerRef.current) clearInterval(timerRef.current);
      setSelected(option);
      const correct = option === current.answer;

      if (correct) {
        const newStreak = streak + 1;
        const newMultiplier = Math.min(1 + newStreak * 0.25, 4);
        const basePoints = currentFish.points;
        const timeBonus = Math.floor(timeLeft * 3);
        const total = Math.floor((basePoints + timeBonus) * newMultiplier);
        setLastPoints(total);
        setScore((s) => s + total);
        setStreak(newStreak);
        setComboMultiplier(newMultiplier);
        setBestStreak((b) => Math.max(b, newStreak));
        setCaught((c) => c + 1);
        setCollection((c) => [...c, currentFish]);
        setPhase("reveal");
        
        // Screen shake for epic+ catches
        if (["epic", "legendary", "mythic"].includes(currentFish.rarity)) {
          setShakeScreen(true);
          setTimeout(() => setShakeScreen(false), 500);
        }

        setTimeout(() => setPhase("caught"), 1200);
        setTimeout(() => {
          if (round + 1 >= TOTAL_ROUNDS) setPhase("done");
          else { setRound((r) => r + 1); setPhase("ocean"); }
        }, 2800);
      } else {
        setStreak(0);
        setComboMultiplier(1);
        setPhase("escaped");
        setTimeout(() => {
          if (round + 1 >= TOTAL_ROUNDS) setPhase("done");
          else { setRound((r) => r + 1); setPhase("ocean"); }
        }, 2000);
      }
    },
    [selected, phase, current, streak, round, currentFish, timeLeft]
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
  const totalWeight = collection.reduce((sum, f) => {
    const w = parseFloat(f.weight);
    return sum + (isNaN(w) ? 0 : w);
  }, 0);

  return (
    <div className={`min-h-screen bg-background flex flex-col overflow-hidden relative ${shakeScreen ? "tile-shake" : ""}`}>
      {/* Ocean background gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-background via-[hsl(210,40%,8%)] to-[hsl(210,60%,6%)] pointer-events-none" />
      
      {/* Ambient bubbles */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {[...Array(8)].map((_, i) => (
          <Bubble key={i} delay={i * 0.8} left={10 + i * 12} size={6 + Math.random() * 10} />
        ))}
        {[...Array(4)].map((_, i) => (
          <SwimmingFish key={`fish-${i}`} delay={i * 3} y={40 + i * 12} direction={i % 2 === 0 ? 1 : -1} />
        ))}
      </div>

      {/* Header */}
      <header className="border-b border-border/20 px-4 py-3 relative z-20 backdrop-blur-sm bg-background/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            🎣 Verb Fishing
          </h1>
          <div className="flex items-center gap-2">
            <Coins className="h-4 w-4 text-secondary" />
            <span className="font-display font-bold text-secondary">{score}</span>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-2xl mx-auto w-full relative z-10">
        {phase !== "done" ? (
          <>
            {/* Top Stats */}
            <div className="w-full flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card/80 border border-border/50 rounded-full backdrop-blur-sm">
                  <span className="text-sm">🐟</span>
                  <span className="font-display font-bold text-sm text-success">{caught}</span>
                </div>
                {streak > 1 && (
                  <motion.div
                    initial={{ scale: 0, rotate: -10 }}
                    animate={{ scale: 1, rotate: 0 }}
                    className="flex items-center gap-1 px-3 py-1.5 bg-accent/20 border border-accent/40 rounded-full"
                  >
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    <span className="font-display font-bold text-sm text-accent">{streak}x</span>
                  </motion.div>
                )}
                {comboMultiplier > 1 && (
                  <motion.span
                    key={comboMultiplier}
                    initial={{ scale: 1.5, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="text-xs font-bold text-secondary"
                  >
                    ×{comboMultiplier.toFixed(1)}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card/80 border border-border/50 rounded-full backdrop-blur-sm">
                <span className="text-xs text-muted-foreground">Round</span>
                <span className="font-display font-bold text-sm text-foreground">{round + 1}/{TOTAL_ROUNDS}</span>
              </div>
            </div>

            {/* Progress */}
            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mb-5">
              <motion.div
                className="h-full bg-gradient-to-r from-accent via-primary to-secondary rounded-full"
                animate={{ width: `${((round + (selected ? 1 : 0)) / TOTAL_ROUNDS) * 100}%` }}
                transition={{ duration: 0.4 }}
              />
            </div>

            {/* Main Scene */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[400px]">
              
              {/* OCEAN - Ready to cast */}
              {phase === "ocean" && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center"
                >
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                    className="text-7xl mb-6"
                  >
                    🎣
                  </motion.div>
                  <button
                    onClick={castLine}
                    className="group relative px-10 py-5 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-2xl font-display font-bold text-xl transition-all hover:scale-105 active:scale-95 glow-warning"
                  >
                    <span className="relative z-10">Cast Line!</span>
                    <motion.div
                      className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary to-accent opacity-0 group-hover:opacity-100 transition-opacity"
                    />
                  </button>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 justify-center">
                    <Sparkles className="h-3 w-3" />
                    Deeper waters ahead... better fish await
                  </p>
                </motion.div>
              )}

              {/* CASTING - Line going out */}
              {phase === "casting" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <motion.div
                    animate={{ rotate: [0, -30, 15, -5, 0] }}
                    transition={{ duration: 0.8 }}
                    className="text-7xl"
                  >
                    🎣
                  </motion.div>
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 80, opacity: 1 }}
                    transition={{ duration: 0.6, delay: 0.3 }}
                    className="w-[2px] bg-gradient-to-b from-muted-foreground/50 to-transparent mx-auto mt-2"
                  />
                  <motion.p
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="text-muted-foreground font-display mt-4 text-sm"
                  >
                    Waiting for a bite...
                  </motion.p>
                </motion.div>
              )}

              {/* BITE - Something's biting! */}
              {phase === "bite" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <motion.div
                    animate={{ rotate: [0, -5, 5, -3, 3, 0], y: [0, -3, 3, -2, 0] }}
                    transition={{ duration: 0.4, repeat: Infinity }}
                    className="text-7xl"
                  >
                    🎣
                  </motion.div>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: [1, 1.3, 1] }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                    className="mt-4"
                  >
                    <span className="text-3xl font-display font-black text-accent animate-pulse">❗ BITE ❗</span>
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, scale: 0 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.3 }}
                    className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${RARITY_CONFIG[currentFish.rarity].bg} border-border/50`}
                  >
                    <span className="text-xl">{currentFish.emoji}</span>
                    <span className={`font-display font-bold text-sm ${RARITY_CONFIG[currentFish.rarity].color}`}>
                      {RARITY_CONFIG[currentFish.rarity].label} spotted!
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {/* REELING - Answer the question */}
              {phase === "reeling" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                  {/* Timer */}
                  <div className="w-full mb-3 flex items-center gap-2">
                    <Timer className={`h-4 w-4 ${timeLeft <= 3 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                    <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div
                        className={`h-full rounded-full transition-colors ${
                          timeLeft <= 3 ? "bg-destructive" : timeLeft <= 5 ? "bg-accent" : "bg-success"
                        }`}
                        animate={{ width: `${(timeLeft / ANSWER_TIME) * 100}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                    <span className={`text-sm font-bold font-display min-w-[28px] text-right ${timeLeft <= 3 ? "text-destructive" : "text-muted-foreground"}`}>
                      {timeLeft}
                    </span>
                  </div>

                  {/* Fish rarity + points */}
                  <div className="flex justify-center mb-3">
                    <motion.div
                      initial={{ y: -10, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${RARITY_CONFIG[currentFish.rarity].bg} border-border/50 ${RARITY_CONFIG[currentFish.rarity].glow}`}
                    >
                      <span className="text-lg">{currentFish.emoji}</span>
                      <span className={`font-display font-bold text-sm ${RARITY_CONFIG[currentFish.rarity].color}`}>
                        {currentFish.name}
                      </span>
                      <span className="text-xs text-muted-foreground">• {currentFish.points}pts</span>
                    </motion.div>
                  </div>

                  {/* Question */}
                  <div className="bg-card/90 backdrop-blur-sm border border-border/50 rounded-2xl p-5 text-center mb-4">
                    <p className="text-muted-foreground text-xs mb-1 uppercase tracking-wider">
                      Conjugate • <span className="text-accent font-bold">{current.tense}</span>
                    </p>
                    <h2 className="font-display font-bold text-2xl text-foreground">{current.infinitive}</h2>
                    <p className="text-muted-foreground text-xs">({current.english})</p>
                    <div className="mt-3 inline-block px-4 py-1.5 bg-muted/50 rounded-full border border-border/30">
                      <span className="font-display font-bold text-secondary text-lg">{current.pronoun}</span>
                    </div>
                  </div>

                  {/* Options */}
                  <div className="grid grid-cols-2 gap-3">
                    {options.map((option, i) => {
                      let style = "bg-card/80 backdrop-blur-sm border-border/50 hover:border-accent hover:bg-accent/10 hover:scale-[1.02] active:scale-[0.98]";
                      if (selected) {
                        if (option === current.answer) {
                          style = "bg-success/20 border-success text-success ring-2 ring-success/40 scale-[1.02]";
                        } else if (option === selected) {
                          style = "bg-destructive/20 border-destructive text-destructive ring-2 ring-destructive/40";
                        } else {
                          style = "bg-muted/30 border-border/30 opacity-40";
                        }
                      }
                      return (
                        <motion.button
                          key={option}
                          initial={{ opacity: 0, y: 15 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: i * 0.06 }}
                          onClick={() => handleSelect(option)}
                          disabled={!!selected}
                          className={`border-2 rounded-xl px-4 py-3.5 font-display font-bold text-base transition-all duration-200 ${style}`}
                        >
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {/* REVEAL - Dramatic fish reveal */}
              {phase === "reveal" && (
                <motion.div className="text-center">
                  {/* Flash effect for rare+ */}
                  {["rare", "epic", "legendary", "mythic"].includes(currentFish.rarity) && (
                    <motion.div
                      initial={{ opacity: 0.8 }}
                      animate={{ opacity: 0 }}
                      transition={{ duration: 0.6 }}
                      className="fixed inset-0 z-50 bg-white/20 pointer-events-none"
                    />
                  )}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    className="relative"
                  >
                    <motion.span
                      animate={{ scale: [1, 1.15, 1] }}
                      transition={{ duration: 0.6, repeat: Infinity }}
                      className="text-8xl block"
                    >
                      {currentFish.emoji}
                    </motion.span>
                    {/* Sparkle particles */}
                    {["legendary", "mythic"].includes(currentFish.rarity) && (
                      <>
                        {[...Array(6)].map((_, i) => (
                          <motion.div
                            key={i}
                            initial={{ scale: 0, x: 0, y: 0 }}
                            animate={{
                              scale: [0, 1, 0],
                              x: Math.cos(i * 60 * Math.PI / 180) * 60,
                              y: Math.sin(i * 60 * Math.PI / 180) * 60,
                            }}
                            transition={{ duration: 0.8, delay: i * 0.1 }}
                            className="absolute top-1/2 left-1/2 text-secondary text-lg"
                          >
                            ✨
                          </motion.div>
                        ))}
                      </>
                    )}
                  </motion.div>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <p className={`font-display font-black text-2xl mt-3 ${RARITY_CONFIG[currentFish.rarity].color}`}>
                      {currentFish.name}!
                    </p>
                    <p className={`font-display font-bold text-sm ${RARITY_CONFIG[currentFish.rarity].color}`}>
                      {RARITY_CONFIG[currentFish.rarity].label} • {currentFish.weight}
                    </p>
                  </motion.div>
                </motion.div>
              )}

              {/* CAUGHT - Points summary */}
              {phase === "caught" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <span className="text-6xl block mb-2">{currentFish.emoji}</span>
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", stiffness: 300 }}
                  >
                    <p className="font-display font-black text-4xl text-secondary">+{lastPoints}</p>
                  </motion.div>
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{currentFish.points} base</span>
                    <span>•</span>
                    <span>+{Math.floor(timeLeft * 3)} time</span>
                    {comboMultiplier > 1 && (
                      <>
                        <span>•</span>
                        <span className="text-accent font-bold">×{comboMultiplier.toFixed(1)} combo</span>
                      </>
                    )}
                  </div>
                  <p className="text-success font-display font-bold text-sm mt-2">Added to collection!</p>
                </motion.div>
              )}

              {/* ESCAPED */}
              {phase === "escaped" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <motion.div
                    animate={{ x: [0, 50, 120], opacity: [1, 0.5, 0], rotate: [0, 10, 20] }}
                    transition={{ duration: 1.2 }}
                    className="text-6xl"
                  >
                    {currentFish.emoji}
                  </motion.div>
                  <p className="font-display font-bold text-xl text-destructive mt-4">The {currentFish.name} escaped!</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Answer: <span className="font-bold text-foreground">{current.answer}</span>
                  </p>
                  <p className="text-xs text-destructive/60 mt-1">Streak lost 💔</p>
                </motion.div>
              )}

              {/* TIMEOUT */}
              {phase === "timeout" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <Timer className="h-16 w-16 text-destructive mx-auto" />
                  </motion.div>
                  <p className="font-display font-bold text-xl text-destructive mt-3">Time's up!</p>
                  <p className="text-muted-foreground text-sm mt-2">
                    Answer: <span className="font-bold text-foreground">{current.answer}</span>
                  </p>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          /* === RESULTS SCREEN === */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center w-full"
          >
            <motion.div
              initial={{ y: -30, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              <Trophy className="h-16 w-16 text-secondary mx-auto mb-2" />
              <h2 className="font-display font-black text-4xl text-foreground mb-1">Expedition Over!</h2>
              <p className="text-muted-foreground mb-6">Here's your haul, captain</p>
            </motion.div>

            {/* Big score */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.4 }}
              className="mb-6"
            >
              <div className="font-display font-black text-6xl text-gradient-gold">{score}</div>
              <div className="text-sm text-muted-foreground">Total Points</div>
            </motion.div>

            <div className="flex gap-6 mb-6">
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.5 }}>
                <div className="font-display font-bold text-2xl text-success">{caught}/{TOTAL_ROUNDS}</div>
                <div className="text-xs text-muted-foreground">Caught</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.6 }}>
                <div className="font-display font-bold text-2xl text-accent">{bestStreak}</div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </motion.div>
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.7 }}>
                <div className="font-display font-bold text-2xl text-foreground">{totalWeight.toFixed(1)}kg</div>
                <div className="text-xs text-muted-foreground">Total Weight</div>
              </motion.div>
            </div>

            {/* Collection */}
            {collection.length > 0 && (
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.8 }}
                className="w-full max-w-sm bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 mb-6"
              >
                <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2 justify-center">
                  <Sparkles className="h-4 w-4 text-secondary" /> Your Catch
                </h3>
                <div className="space-y-2">
                  {(["mythic", "legendary", "epic", "rare", "uncommon", "common"] as Rarity[]).map((r) => {
                    const count = rarityCount(r);
                    if (count === 0) return null;
                    const fishNames = collection.filter((f) => f.rarity === r).map((f) => f.name);
                    const uniqueNames = [...new Set(fishNames)];
                    return (
                      <motion.div
                        key={r}
                        initial={{ x: -10, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        className={`flex items-center gap-3 px-3 py-2 rounded-lg ${RARITY_CONFIG[r].bg}`}
                      >
                        <span className="text-lg">{FISH_POOL[r][0].emoji}</span>
                        <div className="flex-1 text-left">
                          <span className={`font-display font-bold text-sm ${RARITY_CONFIG[r].color}`}>
                            {count}× {RARITY_CONFIG[r].label}
                          </span>
                          <p className="text-xs text-muted-foreground">{uniqueNames.join(", ")}</p>
                        </div>
                        <span className="text-xs font-bold text-muted-foreground">
                          {collection.filter((f) => f.rarity === r).reduce((s, f) => s + f.points, 0)}pts
                        </span>
                      </motion.div>
                    );
                  })}
                </div>
              </motion.div>
            )}

            <motion.button
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1 }}
              onClick={restart}
              className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-2xl font-display font-bold text-lg hover:scale-105 active:scale-95 transition-transform glow-warning"
            >
              <RotateCcw className="h-5 w-5" />
              Fish Again
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
