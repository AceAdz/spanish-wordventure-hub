import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, Timer, Sparkles, Coins, Zap, ChevronRight, X, Fish } from "lucide-react";
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
  desc: string;
}

const FISH_POOL: Record<Rarity, FishType[]> = {
  common: [
    { name: "Sardine", emoji: "🐟", rarity: "common", weight: "0.2kg", points: 10, desc: "A tiny silver fish" },
    { name: "Anchovy", emoji: "🐟", rarity: "common", weight: "0.1kg", points: 8, desc: "Small but flavorful" },
    { name: "Herring", emoji: "🐟", rarity: "common", weight: "0.3kg", points: 12, desc: "Swims in large schools" },
    { name: "Minnow", emoji: "🐟", rarity: "common", weight: "0.05kg", points: 6, desc: "The smallest catch" },
  ],
  uncommon: [
    { name: "Bass", emoji: "🐠", rarity: "uncommon", weight: "1.5kg", points: 20, desc: "A popular game fish" },
    { name: "Trout", emoji: "🐠", rarity: "uncommon", weight: "2.0kg", points: 22, desc: "Loves cold streams" },
    { name: "Perch", emoji: "🐠", rarity: "uncommon", weight: "1.2kg", points: 18, desc: "Striped and steady" },
    { name: "Catfish", emoji: "🐱🐟", rarity: "uncommon", weight: "3.0kg", points: 25, desc: "Bottom dweller with whiskers" },
  ],
  rare: [
    { name: "Swordfish", emoji: "⚔️🐟", rarity: "rare", weight: "45kg", points: 40, desc: "Fast and fearsome" },
    { name: "Tuna", emoji: "🐟✨", rarity: "rare", weight: "30kg", points: 35, desc: "The ocean sprinter" },
    { name: "Marlin", emoji: "🎣", rarity: "rare", weight: "50kg", points: 45, desc: "A legendary game fish" },
    { name: "Barracuda", emoji: "🦈", rarity: "rare", weight: "25kg", points: 38, desc: "Silver torpedo" },
  ],
  epic: [
    { name: "Giant Squid", emoji: "🦑", rarity: "epic", weight: "150kg", points: 75, desc: "From the deep abyss" },
    { name: "Manta Ray", emoji: "🦈✨", rarity: "epic", weight: "200kg", points: 80, desc: "Graceful ocean glider" },
    { name: "Hammerhead", emoji: "🔨🦈", rarity: "epic", weight: "180kg", points: 85, desc: "Nature's oddest predator" },
    { name: "Electric Eel", emoji: "⚡🐍", rarity: "epic", weight: "20kg", points: 90, desc: "Shockingly powerful" },
  ],
  legendary: [
    { name: "Golden Whale", emoji: "🐋✨", rarity: "legendary", weight: "500kg", points: 150, desc: "Touched by Midas" },
    { name: "Kraken Jr.", emoji: "🐙👑", rarity: "legendary", weight: "???", points: 200, desc: "Baby of the sea monster" },
    { name: "Ghost Shark", emoji: "👻🦈", rarity: "legendary", weight: "300kg", points: 175, desc: "From the phantom depths" },
  ],
  mythic: [
    { name: "Leviathan", emoji: "🐉🌊", rarity: "mythic", weight: "∞", points: 500, desc: "THE sea monster itself" },
    { name: "Poseidon's Pet", emoji: "🔱🐟", rarity: "mythic", weight: "∞", points: 600, desc: "Blessed by the god of sea" },
  ],
};

const ALL_FISH = Object.values(FISH_POOL).flat();

const RARITY_CONFIG: Record<Rarity, { label: string; color: string; textColor: string; bg: string; border: string; glow: string }> = {
  common:    { label: "Common",    color: "hsl(var(--muted-foreground))", textColor: "text-muted-foreground", bg: "bg-muted/30",       border: "border-border/50",       glow: "" },
  uncommon:  { label: "Uncommon",  color: "hsl(var(--success))",         textColor: "text-success",          bg: "bg-success/10",      border: "border-success/30",      glow: "glow-success" },
  rare:      { label: "Rare",      color: "hsl(var(--accent))",          textColor: "text-accent",           bg: "bg-accent/10",       border: "border-accent/30",       glow: "glow-warning" },
  epic:      { label: "Epic",      color: "hsl(var(--primary))",         textColor: "text-primary",          bg: "bg-primary/10",      border: "border-primary/30",      glow: "glow-primary" },
  legendary: { label: "Legendary", color: "hsl(var(--secondary))",       textColor: "text-secondary",        bg: "bg-secondary/10",    border: "border-secondary/30",    glow: "glow-warning" },
  mythic:    { label: "MYTHIC",    color: "hsl(var(--secondary))",       textColor: "text-secondary",        bg: "bg-secondary/20",    border: "border-secondary/50",    glow: "glow-warning" },
};

function rollRarity(round: number): Rarity {
  const luck = round * 2;
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

// Particle burst
function ParticleBurst({ color, count = 12 }: { color: string; count?: number }) {
  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
      {[...Array(count)].map((_, i) => {
        const angle = (i / count) * 360;
        const dist = 40 + Math.random() * 40;
        return (
          <motion.div
            key={i}
            initial={{ scale: 1, x: 0, y: 0, opacity: 1 }}
            animate={{
              x: Math.cos((angle * Math.PI) / 180) * dist,
              y: Math.sin((angle * Math.PI) / 180) * dist,
              scale: 0,
              opacity: 0,
            }}
            transition={{ duration: 0.6, delay: i * 0.02 }}
            className="absolute w-2 h-2 rounded-full"
            style={{ backgroundColor: color }}
          />
        );
      })}
    </div>
  );
}

// Floating bubbles
function Bubbles() {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
      {[...Array(12)].map((_, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-accent/8 border border-accent/10"
          style={{
            width: 4 + Math.random() * 12,
            height: 4 + Math.random() * 12,
            left: `${Math.random() * 100}%`,
            bottom: -20,
          }}
          initial={{ y: 0, opacity: 0.4 }}
          animate={{ y: -(window.innerHeight + 40), opacity: 0 }}
          transition={{
            duration: 5 + Math.random() * 5,
            delay: i * 0.7,
            repeat: Infinity,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}

// ========== AQUARIUM / COLLECTION VIEW ==========
function AquariumView({ collection, onClose }: { collection: FishType[]; onClose: () => void }) {
  const rarityOrder: Rarity[] = ["mythic", "legendary", "epic", "rare", "uncommon", "common"];
  const grouped = rarityOrder
    .map((r) => ({ rarity: r, fish: collection.filter((f) => f.rarity === r) }))
    .filter((g) => g.fish.length > 0);

  // Count unique
  const uniqueCaught = new Set(collection.map((f) => f.name)).size;
  const totalPossible = ALL_FISH.length;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-background/95 backdrop-blur-md flex flex-col"
    >
      {/* Header */}
      <div className="border-b border-border/30 px-4 py-3 flex items-center justify-between">
        <h2 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
          <Fish className="h-5 w-5 text-accent" />
          My Aquarium
        </h2>
        <div className="flex items-center gap-4">
          <span className="text-xs text-muted-foreground font-display">
            {uniqueCaught}/{totalPossible} species
          </span>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="px-4 pt-3">
        <div className="w-full h-2 bg-muted/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${(uniqueCaught / totalPossible) * 100}%` }}
            transition={{ duration: 1, delay: 0.3 }}
            className="h-full bg-gradient-to-r from-accent via-primary to-secondary rounded-full"
          />
        </div>
      </div>

      {/* Fish grid */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-6">
        {/* Show all fish as a collection grid - caught ones highlighted, uncaught ones silhouetted */}
        {rarityOrder.map((rarity) => {
          const allOfRarity = FISH_POOL[rarity];
          const caughtNames = new Set(collection.filter((f) => f.rarity === rarity).map((f) => f.name));
          const caughtCount = (r: string) => collection.filter((f) => f.name === r).length;

          return (
            <motion.div
              key={rarity}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <div className="flex items-center gap-2 mb-3">
                <span className={`font-display font-bold text-sm ${RARITY_CONFIG[rarity].textColor}`}>
                  {RARITY_CONFIG[rarity].label}
                </span>
                <span className="text-xs text-muted-foreground">
                  {caughtNames.size}/{allOfRarity.length}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                {allOfRarity.map((fish) => {
                  const caught = caughtNames.has(fish.name);
                  const count = caughtCount(fish.name);
                  return (
                    <motion.div
                      key={fish.name}
                      whileHover={caught ? { scale: 1.03 } : {}}
                      className={`relative rounded-xl border-2 p-3 transition-all ${
                        caught
                          ? `${RARITY_CONFIG[rarity].bg} ${RARITY_CONFIG[rarity].border}`
                          : "bg-muted/10 border-border/20 opacity-40"
                      }`}
                    >
                      {caught && rarity === "mythic" && (
                        <motion.div
                          animate={{ rotate: 360 }}
                          transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                          className="absolute inset-0 rounded-xl bg-gradient-conic from-secondary/20 via-transparent to-secondary/20 pointer-events-none"
                        />
                      )}
                      <div className="relative z-10 flex items-start gap-3">
                        <motion.span
                          animate={caught ? { y: [0, -3, 0] } : {}}
                          transition={{ duration: 2, repeat: Infinity, delay: Math.random() * 2 }}
                          className="text-3xl"
                        >
                          {caught ? fish.emoji : "❓"}
                        </motion.span>
                        <div className="flex-1 min-w-0">
                          <p className={`font-display font-bold text-sm truncate ${caught ? "text-foreground" : "text-muted-foreground"}`}>
                            {caught ? fish.name : "???"}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {caught ? fish.desc : "Not yet caught"}
                          </p>
                          {caught && (
                            <div className="flex items-center gap-2 mt-1">
                              <span className="text-xs text-muted-foreground">{fish.weight}</span>
                              <span className="text-xs text-muted-foreground">•</span>
                              <span className={`text-xs font-bold ${RARITY_CONFIG[rarity].textColor}`}>×{count}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ========== MAIN GAME ==========
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
  const [showAquarium, setShowAquarium] = useState(false);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [shakeScreen, setShakeScreen] = useState(false);

  const current = allChallenges[round % allChallenges.length];

  useEffect(() => {
    if (phase === "reeling" && !selected) {
      setTimeLeft(ANSWER_TIME);
      timerRef.current = setInterval(() => {
        setTimeLeft((t) => { if (t <= 1) { clearInterval(timerRef.current!); return 0; } return t - 1; });
      }, 1000);
      return () => { if (timerRef.current) clearInterval(timerRef.current); };
    }
  }, [phase, selected]);

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
        const newMult = Math.min(1 + newStreak * 0.25, 4);
        const base = currentFish.points;
        const timeBonus = Math.floor(timeLeft * 3);
        const total = Math.floor((base + timeBonus) * newMult);
        setLastPoints(total);
        setScore((s) => s + total);
        setStreak(newStreak);
        setComboMultiplier(newMult);
        setBestStreak((b) => Math.max(b, newStreak));
        setCaught((c) => c + 1);
        setCollection((c) => [...c, currentFish]);
        setPhase("reveal");
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
  const totalWeight = collection.reduce((sum, f) => { const w = parseFloat(f.weight); return sum + (isNaN(w) ? 0 : w); }, 0);

  return (
    <div className={`min-h-screen bg-background flex flex-col overflow-hidden relative ${shakeScreen ? "tile-shake" : ""}`}>
      <div className="fixed inset-0 bg-gradient-to-b from-background via-[hsl(210,40%,8%)] to-[hsl(210,60%,6%)] pointer-events-none" />
      <Bubbles />

      {/* Aquarium overlay */}
      <AnimatePresence>
        {showAquarium && <AquariumView collection={collection} onClose={() => setShowAquarium(false)} />}
      </AnimatePresence>

      <header className="border-b border-border/20 px-4 py-3 relative z-20 backdrop-blur-sm bg-background/50">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            🎣 Verb Fishing
          </h1>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAquarium(true)}
              className="flex items-center gap-1 text-accent hover:text-foreground transition-colors text-sm font-display font-bold"
            >
              <Fish className="h-4 w-4" />
              <span className="hidden sm:inline">{collection.length}</span>
            </button>
            <div className="flex items-center gap-1">
              <Coins className="h-4 w-4 text-secondary" />
              <span className="font-display font-bold text-secondary">{score}</span>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-4 max-w-2xl mx-auto w-full relative z-10">
        {phase !== "done" ? (
          <>
            {/* Stats */}
            <div className="w-full flex items-center justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card/80 border border-border/50 rounded-full backdrop-blur-sm">
                  <span className="text-sm">🐟</span>
                  <span className="font-display font-bold text-sm text-success">{caught}</span>
                </div>
                {streak > 1 && (
                  <motion.div initial={{ scale: 0, rotate: -10 }} animate={{ scale: 1, rotate: 0 }} className="flex items-center gap-1 px-3 py-1.5 bg-accent/20 border border-accent/40 rounded-full">
                    <Zap className="h-3.5 w-3.5 text-accent" />
                    <span className="font-display font-bold text-sm text-accent">{streak}x</span>
                  </motion.div>
                )}
                {comboMultiplier > 1 && (
                  <motion.span key={comboMultiplier} initial={{ scale: 1.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="text-xs font-bold text-secondary">
                    ×{comboMultiplier.toFixed(1)}
                  </motion.span>
                )}
              </div>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-card/80 border border-border/50 rounded-full backdrop-blur-sm">
                <span className="text-xs text-muted-foreground">Round</span>
                <span className="font-display font-bold text-sm text-foreground">{round + 1}/{TOTAL_ROUNDS}</span>
              </div>
            </div>

            <div className="w-full h-1.5 bg-muted/50 rounded-full overflow-hidden mb-5">
              <motion.div className="h-full bg-gradient-to-r from-accent via-primary to-secondary rounded-full" animate={{ width: `${((round + (selected ? 1 : 0)) / TOTAL_ROUNDS) * 100}%` }} transition={{ duration: 0.4 }} />
            </div>

            {/* Main Scene */}
            <div className="w-full flex-1 flex flex-col items-center justify-center relative min-h-[400px]">

              {phase === "ocean" && (
                <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="text-7xl mb-6">
                    🎣
                  </motion.div>
                  <button onClick={castLine} className="group relative px-10 py-5 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-2xl font-display font-bold text-xl transition-all hover:scale-105 active:scale-95 glow-warning">
                    Cast Line!
                  </button>
                  <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1 justify-center">
                    <Sparkles className="h-3 w-3" />
                    Deeper waters ahead... better fish await
                  </p>
                </motion.div>
              )}

              {phase === "casting" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <motion.div animate={{ rotate: [0, -30, 15, -5, 0] }} transition={{ duration: 0.8 }} className="text-7xl">🎣</motion.div>
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 80, opacity: 1 }} transition={{ duration: 0.6, delay: 0.3 }} className="w-[2px] bg-gradient-to-b from-muted-foreground/50 to-transparent mx-auto mt-2" />
                  <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-muted-foreground font-display mt-4 text-sm">
                    Waiting for a bite...
                  </motion.p>
                </motion.div>
              )}

              {phase === "bite" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <motion.div animate={{ rotate: [0, -5, 5, -3, 3, 0], y: [0, -3, 3, -2, 0] }} transition={{ duration: 0.4, repeat: Infinity }} className="text-7xl">🎣</motion.div>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: [1, 1.3, 1] }} transition={{ duration: 0.5, repeat: Infinity }} className="mt-4">
                    <span className="text-3xl font-display font-black text-accent animate-pulse">❗ BITE ❗</span>
                  </motion.div>
                  <motion.div initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.3 }} className={`mt-3 inline-flex items-center gap-2 px-4 py-2 rounded-full border ${RARITY_CONFIG[currentFish.rarity].bg} ${RARITY_CONFIG[currentFish.rarity].border}`}>
                    <span className="text-xl">{currentFish.emoji}</span>
                    <span className={`font-display font-bold text-sm ${RARITY_CONFIG[currentFish.rarity].textColor}`}>
                      {RARITY_CONFIG[currentFish.rarity].label} spotted!
                    </span>
                  </motion.div>
                </motion.div>
              )}

              {phase === "reeling" && (
                <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="w-full">
                  <div className="w-full mb-3 flex items-center gap-2">
                    <Timer className={`h-4 w-4 ${timeLeft <= 3 ? "text-destructive animate-pulse" : "text-muted-foreground"}`} />
                    <div className="flex-1 h-3 bg-muted/50 rounded-full overflow-hidden">
                      <motion.div className={`h-full rounded-full transition-colors ${timeLeft <= 3 ? "bg-destructive" : timeLeft <= 5 ? "bg-accent" : "bg-success"}`} animate={{ width: `${(timeLeft / ANSWER_TIME) * 100}%` }} transition={{ duration: 0.5 }} />
                    </div>
                    <span className={`text-sm font-bold font-display min-w-[28px] text-right ${timeLeft <= 3 ? "text-destructive" : "text-muted-foreground"}`}>{timeLeft}</span>
                  </div>

                  <div className="flex justify-center mb-3">
                    <motion.div initial={{ y: -10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full border ${RARITY_CONFIG[currentFish.rarity].bg} ${RARITY_CONFIG[currentFish.rarity].border} ${RARITY_CONFIG[currentFish.rarity].glow}`}>
                      <span className="text-lg">{currentFish.emoji}</span>
                      <span className={`font-display font-bold text-sm ${RARITY_CONFIG[currentFish.rarity].textColor}`}>{currentFish.name}</span>
                      <span className="text-xs text-muted-foreground">• {currentFish.points}pts</span>
                    </motion.div>
                  </div>

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

                  <div className="grid grid-cols-2 gap-3">
                    {options.map((option, i) => {
                      let style = "bg-card/80 backdrop-blur-sm border-border/50 hover:border-accent hover:bg-accent/10 hover:scale-[1.02] active:scale-[0.98]";
                      if (selected) {
                        if (option === current.answer) style = "bg-success/20 border-success text-success ring-2 ring-success/40 scale-[1.02]";
                        else if (option === selected) style = "bg-destructive/20 border-destructive text-destructive ring-2 ring-destructive/40";
                        else style = "bg-muted/30 border-border/30 opacity-40";
                      }
                      return (
                        <motion.button key={option} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }} onClick={() => handleSelect(option)} disabled={!!selected} className={`border-2 rounded-xl px-4 py-3.5 font-display font-bold text-base transition-all duration-200 ${style}`}>
                          {option}
                        </motion.button>
                      );
                    })}
                  </div>
                </motion.div>
              )}

              {phase === "reveal" && (
                <motion.div className="text-center relative">
                  {["rare", "epic", "legendary", "mythic"].includes(currentFish.rarity) && (
                    <motion.div initial={{ opacity: 0.8 }} animate={{ opacity: 0 }} transition={{ duration: 0.6 }} className="fixed inset-0 z-50 bg-white/20 pointer-events-none" />
                  )}
                  <div className="relative inline-block">
                    <motion.span initial={{ scale: 0, rotate: -180 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: "spring", stiffness: 200, damping: 15 }} className="text-8xl block">
                      {currentFish.emoji}
                    </motion.span>
                    <ParticleBurst color={RARITY_CONFIG[currentFish.rarity].color} count={["legendary", "mythic"].includes(currentFish.rarity) ? 20 : 10} />
                  </div>
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
                    <p className={`font-display font-black text-2xl mt-3 ${RARITY_CONFIG[currentFish.rarity].textColor}`}>{currentFish.name}!</p>
                    <p className={`font-display font-bold text-sm ${RARITY_CONFIG[currentFish.rarity].textColor}`}>{RARITY_CONFIG[currentFish.rarity].label} • {currentFish.weight}</p>
                    <p className="text-xs text-muted-foreground mt-1 italic">{currentFish.desc}</p>
                  </motion.div>
                </motion.div>
              )}

              {phase === "caught" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <span className="text-6xl block mb-2">{currentFish.emoji}</span>
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300 }}>
                    <p className="font-display font-black text-4xl text-secondary">+{lastPoints}</p>
                  </motion.div>
                  <div className="flex items-center justify-center gap-3 mt-2 text-xs text-muted-foreground">
                    <span>{currentFish.points} base</span>
                    <span>•</span>
                    <span>+{Math.floor(timeLeft * 3)} time</span>
                    {comboMultiplier > 1 && <><span>•</span><span className="text-accent font-bold">×{comboMultiplier.toFixed(1)} combo</span></>}
                  </div>
                  <p className="text-success font-display font-bold text-sm mt-2">Added to aquarium! 🐠</p>
                </motion.div>
              )}

              {phase === "escaped" && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
                  <motion.div animate={{ x: [0, 50, 120], opacity: [1, 0.5, 0], rotate: [0, 10, 20] }} transition={{ duration: 1.2 }} className="text-6xl">
                    {currentFish.emoji}
                  </motion.div>
                  <p className="font-display font-bold text-xl text-destructive mt-4">The {currentFish.name} escaped!</p>
                  <p className="text-muted-foreground text-sm mt-2">Answer: <span className="font-bold text-foreground">{current.answer}</span></p>
                  <p className="text-xs text-destructive/60 mt-1">Streak lost 💔</p>
                </motion.div>
              )}

              {phase === "timeout" && (
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="text-center">
                  <motion.div animate={{ rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                    <Timer className="h-16 w-16 text-destructive mx-auto" />
                  </motion.div>
                  <p className="font-display font-bold text-xl text-destructive mt-3">Time's up!</p>
                  <p className="text-muted-foreground text-sm mt-2">Answer: <span className="font-bold text-foreground">{current.answer}</span></p>
                </motion.div>
              )}
            </div>
          </>
        ) : (
          /* RESULTS */
          <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="flex-1 flex flex-col items-center justify-center text-center w-full">
            <motion.div initial={{ y: -30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.2 }}>
              <Trophy className="h-16 w-16 text-secondary mx-auto mb-2" />
              <h2 className="font-display font-black text-4xl text-foreground mb-1">Expedition Over!</h2>
              <p className="text-muted-foreground mb-6">Here's your haul, captain</p>
            </motion.div>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.4 }} className="mb-6">
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
              <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.8 }} className="w-full max-w-sm bg-card/80 backdrop-blur-sm border border-border/50 rounded-2xl p-5 mb-6">
                <h3 className="font-display font-bold text-foreground mb-3 flex items-center gap-2 justify-center">
                  <Sparkles className="h-4 w-4 text-secondary" /> Your Catch
                </h3>
                <div className="space-y-2">
                  {(["mythic", "legendary", "epic", "rare", "uncommon", "common"] as Rarity[]).map((r) => {
                    const count = rarityCount(r);
                    if (count === 0) return null;
                    const fishNames = [...new Set(collection.filter((f) => f.rarity === r).map((f) => f.name))];
                    return (
                      <motion.div key={r} initial={{ x: -10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className={`flex items-center gap-3 px-3 py-2 rounded-lg ${RARITY_CONFIG[r].bg}`}>
                        <span className="text-lg">{FISH_POOL[r][0].emoji}</span>
                        <div className="flex-1 text-left">
                          <span className={`font-display font-bold text-sm ${RARITY_CONFIG[r].textColor}`}>{count}× {RARITY_CONFIG[r].label}</span>
                          <p className="text-xs text-muted-foreground">{fishNames.join(", ")}</p>
                        </div>
                      </motion.div>
                    );
                  })}
                </div>
                <button
                  onClick={() => setShowAquarium(true)}
                  className="w-full mt-3 flex items-center justify-center gap-2 px-4 py-2 bg-accent/10 border border-accent/30 rounded-lg text-accent font-display font-bold text-sm hover:bg-accent/20 transition-colors"
                >
                  <Fish className="h-4 w-4" />
                  View Full Aquarium
                  <ChevronRight className="h-4 w-4" />
                </button>
              </motion.div>
            )}

            <motion.button initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 1 }} onClick={restart} className="flex items-center gap-2 px-10 py-4 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-2xl font-display font-bold text-lg hover:scale-105 active:scale-95 transition-transform glow-warning">
              <RotateCcw className="h-5 w-5" />
              Fish Again
            </motion.button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
