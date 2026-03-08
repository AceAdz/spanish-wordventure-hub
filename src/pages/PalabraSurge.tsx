import { useState, useCallback, useEffect, useRef, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Zap, Flame, Shield, Clock, RotateCcw, Trophy, Star, Sparkles } from "lucide-react";
import { SPANISH_WORDS } from "@/data/spanishWords";
import { useGameScore } from "@/hooks/useGameScore";

// ── Word pool with translations ──
const WORD_POOL = SPANISH_WORDS.map((w) => ({
  spanish: w.word.toLowerCase(),
  english: w.english.toLowerCase(),
}));

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

// ── Types ──
interface FloatingWord {
  id: number;
  spanish: string;
  english: string;
  x: number; // 0-100 percent
  y: number; // starts ~110, floats up to -10
  speed: number;
  size: "sm" | "md" | "lg";
  hue: number;
  spawnedAt: number;
}

interface Particle {
  id: number;
  x: number;
  y: number;
  emoji: string;
  angle: number;
  speed: number;
  life: number;
}

type PowerUp = "freeze" | "shield" | "nuke" | "double";

interface ActivePower {
  type: PowerUp;
  expiresAt: number;
}

// ── Constants ──
const INITIAL_LIVES = 5;
const BASE_SPAWN_INTERVAL = 2800;
const MIN_SPAWN_INTERVAL = 800;
const BASE_SPEED = 0.25;
const MAX_SPEED = 0.7;
const POWERUP_DURATION = 6000;
const POWERUP_CHANCE = 0.12;

const POWER_CONFIG: Record<PowerUp, { emoji: string; label: string; color: string; desc: string }> = {
  freeze:  { emoji: "❄️",  label: "Freeze",      color: "from-blue-400 to-cyan-400",    desc: "Slows all words for 6s" },
  shield:  { emoji: "🛡️", label: "Shield",      color: "from-emerald-400 to-green-400", desc: "Blocks next miss" },
  nuke:    { emoji: "💥",  label: "Nuke",        color: "from-red-400 to-orange-400",    desc: "Clears all words" },
  double:  { emoji: "⚡",  label: "Double XP",   color: "from-yellow-400 to-amber-400",  desc: "2x points for 6s" },
};

const PalabraSurge = () => {
  const { saveScore } = useGameScore();

  // ── Game state ──
  const [phase, setPhase] = useState<"menu" | "playing" | "gameover">("menu");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [words, setWords] = useState<FloatingWord[]>([]);
  const [input, setInput] = useState("");
  const [particles, setParticles] = useState<Particle[]>([]);
  const [wave, setWave] = useState(1);
  const [wordsCleared, setWordsCleared] = useState(0);
  const [shakeScreen, setShakeScreen] = useState(false);
  const [flashColor, setFlashColor] = useState<string | null>(null);
  const [activePowers, setActivePowers] = useState<ActivePower[]>([]);
  const [pendingPowerUp, setPendingPowerUp] = useState<PowerUp | null>(null);
  const [totalAnswered, setTotalAnswered] = useState(0);

  const inputRef = useRef<HTMLInputElement>(null);
  const wordIdRef = useRef(0);
  const particleIdRef = useRef(0);
  const gameLoopRef = useRef<number>();
  const spawnTimerRef = useRef<number>();
  const containerRef = useRef<HTMLDivElement>(null);

  // ── Derived ──
  const hasPower = useCallback(
    (type: PowerUp) => activePowers.some((p) => p.type === type && p.expiresAt > Date.now()),
    [activePowers]
  );

  const speedMultiplier = useMemo(() => {
    const frozen = hasPower("freeze");
    return frozen ? 0.3 : 1;
  }, [hasPower]);

  const pointMultiplier = useMemo(() => {
    return hasPower("double") ? 2 : 1;
  }, [hasPower]);

  // ── Spawn words ──
  const spawnWord = useCallback(() => {
    const entry = pick(WORD_POOL);
    const sizes: FloatingWord["size"][] = ["sm", "md", "lg"];
    const waveSpeed = Math.min(BASE_SPEED + (wave - 1) * 0.03, MAX_SPEED);
    const newWord: FloatingWord = {
      id: ++wordIdRef.current,
      spanish: entry.spanish,
      english: entry.english,
      x: 10 + Math.random() * 80,
      y: 105,
      speed: (waveSpeed + Math.random() * 0.1) * (Math.random() > 0.5 ? 1 : 0.85),
      size: pick(sizes),
      hue: Math.floor(Math.random() * 360),
      spawnedAt: Date.now(),
    };
    setWords((prev) => [...prev, newWord]);
  }, [wave]);

  // ── Burst particles ──
  const burst = useCallback((x: number, y: number, emoji: string, count = 8) => {
    const newParticles: Particle[] = [];
    for (let i = 0; i < count; i++) {
      newParticles.push({
        id: ++particleIdRef.current,
        x,
        y,
        emoji,
        angle: (Math.PI * 2 * i) / count + Math.random() * 0.5,
        speed: 2 + Math.random() * 3,
        life: 1,
      });
    }
    setParticles((prev) => [...prev, ...newParticles]);
  }, []);

  // ── Flash & shake ──
  const triggerFlash = useCallback((color: string) => {
    setFlashColor(color);
    setTimeout(() => setFlashColor(null), 200);
  }, []);

  const triggerShake = useCallback(() => {
    setShakeScreen(true);
    setTimeout(() => setShakeScreen(false), 300);
  }, []);

  // ── Activate power-up ──
  const activatePower = useCallback(
    (type: PowerUp) => {
      if (type === "nuke") {
        // Clear all words, give points
        setWords((prev) => {
          prev.forEach((w) => burst(w.x, w.y, "💥", 4));
          return [];
        });
        triggerFlash("hsl(var(--destructive))");
        setScore((s) => s + 50 * pointMultiplier);
      } else {
        setActivePowers((prev) => [
          ...prev.filter((p) => p.type !== type),
          { type, expiresAt: Date.now() + POWERUP_DURATION },
        ]);
      }
      setPendingPowerUp(null);
    },
    [burst, triggerFlash, pointMultiplier]
  );

  // ── Submit answer ──
  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      if (!input.trim() || phase !== "playing") return;

      const guess = input.trim().toLowerCase();
      setInput("");

      // Find matching word (prioritize closest to top)
      const sorted = [...words].sort((a, b) => a.y - b.y);
      const match = sorted.find(
        (w) => w.english === guess || w.spanish === guess
      );

      if (match) {
        // Correct!
        const basePoints = match.size === "lg" ? 15 : match.size === "md" ? 10 : 8;
        const comboBonus = Math.min(combo, 10);
        const earned = (basePoints + comboBonus * 2) * pointMultiplier;

        setScore((s) => s + earned);
        setCombo((c) => {
          const next = c + 1;
          setBestCombo((b) => Math.max(b, next));
          return next;
        });
        setWordsCleared((c) => c + 1);
        setTotalAnswered((c) => c + 1);
        setWords((prev) => prev.filter((w) => w.id !== match.id));

        burst(match.x, match.y, "✨", 10);
        triggerFlash("hsl(var(--primary) / 0.3)");

        // Power-up chance
        if (Math.random() < POWERUP_CHANCE && !pendingPowerUp) {
          const powers: PowerUp[] = ["freeze", "shield", "nuke", "double"];
          setPendingPowerUp(pick(powers));
        }
      } else {
        // Wrong — shake
        triggerShake();
        setCombo(0);
      }
    },
    [input, words, phase, combo, pointMultiplier, burst, triggerFlash, triggerShake, pendingPowerUp]
  );

  // ── Game loop ──
  useEffect(() => {
    if (phase !== "playing") return;

    const loop = () => {
      const now = Date.now();

      // Move words up
      setWords((prev) => {
        const remaining: FloatingWord[] = [];
        let missed = 0;

        for (const w of prev) {
          const newY = w.y - w.speed * speedMultiplier;
          if (newY < -5) {
            missed++;
          } else {
            remaining.push({ ...w, y: newY });
          }
        }

        if (missed > 0) {
          const shielded = activePowers.some(
            (p) => p.type === "shield" && p.expiresAt > now
          );
          if (shielded) {
            setActivePowers((ap) => ap.filter((p) => p.type !== "shield"));
          } else {
            setLives((l) => {
              const next = l - missed;
              if (next <= 0) setPhase("gameover");
              return Math.max(0, next);
            });
            setCombo(0);
          }
          triggerShake();
          triggerFlash("hsl(var(--destructive) / 0.3)");
        }

        return remaining;
      });

      // Decay particles
      setParticles((prev) =>
        prev
          .map((p) => ({ ...p, life: p.life - 0.03 }))
          .filter((p) => p.life > 0)
      );

      // Clean expired powers
      setActivePowers((prev) => prev.filter((p) => p.expiresAt > now));

      gameLoopRef.current = requestAnimationFrame(loop);
    };

    gameLoopRef.current = requestAnimationFrame(loop);
    return () => {
      if (gameLoopRef.current) cancelAnimationFrame(gameLoopRef.current);
    };
  }, [phase, speedMultiplier, activePowers, triggerShake, triggerFlash]);

  // ── Spawn timer ──
  useEffect(() => {
    if (phase !== "playing") return;

    const interval = Math.max(
      BASE_SPAWN_INTERVAL - (wave - 1) * 200,
      MIN_SPAWN_INTERVAL
    );

    const spawn = () => {
      spawnWord();
      spawnTimerRef.current = window.setTimeout(spawn, interval + Math.random() * 400);
    };

    spawnTimerRef.current = window.setTimeout(spawn, 500);
    return () => {
      if (spawnTimerRef.current) clearTimeout(spawnTimerRef.current);
    };
  }, [phase, wave, spawnWord]);

  // ── Wave progression ──
  useEffect(() => {
    if (wordsCleared > 0 && wordsCleared % 10 === 0) {
      setWave(Math.floor(wordsCleared / 10) + 1);
    }
  }, [wordsCleared]);

  // ── Focus input ──
  useEffect(() => {
    if (phase === "playing") inputRef.current?.focus();
  }, [phase]);

  // ── Save score on game over ──
  useEffect(() => {
    if (phase === "gameover" && score > 0) {
      saveScore("wordle", score, undefined, bestCombo);
    }
  }, [phase, score, bestCombo, saveScore]);

  // ── Start game ──
  const startGame = () => {
    setPhase("playing");
    setScore(0);
    setLives(INITIAL_LIVES);
    setCombo(0);
    setBestCombo(0);
    setWords([]);
    setParticles([]);
    setWave(1);
    setWordsCleared(0);
    setTotalAnswered(0);
    setActivePowers([]);
    setPendingPowerUp(null);
    setInput("");
    wordIdRef.current = 0;
  };

  // ── Size classes ──
  const sizeClass = (s: FloatingWord["size"]) =>
    s === "lg" ? "text-lg px-5 py-3" : s === "md" ? "text-base px-4 py-2.5" : "text-sm px-3 py-2";

  return (
    <div
      ref={containerRef}
      className={`min-h-screen bg-background flex flex-col relative overflow-hidden select-none transition-transform duration-100 ${
        shakeScreen ? "translate-x-1" : ""
      }`}
    >
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-t from-primary/6 via-transparent to-accent/6" />
        <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] bg-primary/8 rounded-full blur-[120px]" />
        <div className="absolute top-0 right-1/4 w-[400px] h-[400px] bg-accent/8 rounded-full blur-[100px]" />
        {/* Rising ambient particles */}
        {phase === "playing" && (
          <>
            {[...Array(12)].map((_, i) => (
              <motion.div
                key={`ambient-${i}`}
                className="absolute w-1 h-1 rounded-full bg-primary/20"
                style={{ left: `${8 + i * 8}%` }}
                animate={{ y: [800, -100], opacity: [0, 0.6, 0] }}
                transition={{ duration: 6 + i * 0.5, repeat: Infinity, delay: i * 0.8, ease: "linear" }}
              />
            ))}
          </>
        )}
      </div>

      {/* Flash overlay */}
      <AnimatePresence>
        {flashColor && (
          <motion.div
            initial={{ opacity: 0.5 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-50 pointer-events-none"
            style={{ backgroundColor: flashColor }}
          />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="border-b border-border/20 px-4 py-3 relative z-20 backdrop-blur-sm bg-background/80">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
            <span className="text-sm font-medium">Back</span>
          </Link>
          <div className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-accent" />
            <span className="font-display font-black text-lg text-foreground">Palabra Surge</span>
          </div>
          {phase === "playing" ? (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-primary font-bold">
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
              animate={{ y: [0, -8, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-7xl mb-6"
            >
              ⚡
            </motion.div>
            <h1 className="font-display font-black text-5xl mb-3">
              <span className="text-gradient-primary">Palabra</span>{" "}
              <span className="text-foreground">Surge</span>
            </h1>
            <p className="text-muted-foreground mb-2">
              Spanish words rise from below. Type their <strong className="text-foreground">English translation</strong> before they escape!
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Build combos • Collect power-ups • Survive the surge
            </p>

            <div className="grid grid-cols-2 gap-3 mb-8 text-left">
              {(["freeze", "shield", "nuke", "double"] as PowerUp[]).map((p) => (
                <div
                  key={p}
                  className="flex items-center gap-2 bg-card/50 border border-border/30 rounded-xl px-3 py-2"
                >
                  <span className="text-xl">{POWER_CONFIG[p].emoji}</span>
                  <div>
                    <div className="text-xs font-bold text-foreground">{POWER_CONFIG[p].label}</div>
                    <div className="text-[10px] text-muted-foreground">{POWER_CONFIG[p].desc}</div>
                  </div>
                </div>
              ))}
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={startGame}
              className="px-10 py-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-2xl font-display font-black text-xl shadow-lg shadow-primary/25"
            >
              Start Surge ⚡
            </motion.button>
          </motion.div>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="flex-1 relative z-10 flex flex-col">
          {/* HUD */}
          <div className="px-4 py-2 flex items-center justify-between max-w-4xl mx-auto w-full">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1.5 bg-card/50 border border-border/30 rounded-lg px-3 py-1.5">
                <Flame className="h-3.5 w-3.5 text-accent" />
                <span className="text-xs font-bold text-foreground">Wave {wave}</span>
              </div>
              {combo >= 3 && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  className="flex items-center gap-1 bg-accent/20 border border-accent/30 rounded-lg px-3 py-1.5"
                >
                  <Zap className="h-3.5 w-3.5 text-accent" />
                  <span className="text-xs font-black text-accent">{combo}x COMBO</span>
                </motion.div>
              )}
            </div>
            <div className="flex items-center gap-2">
              {/* Active power indicators */}
              <AnimatePresence>
                {activePowers
                  .filter((p) => p.expiresAt > Date.now())
                  .map((p) => (
                    <motion.div
                      key={p.type}
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      exit={{ scale: 0 }}
                      className="flex items-center gap-1 bg-card/60 border border-border/40 rounded-lg px-2 py-1"
                    >
                      <span className="text-sm">{POWER_CONFIG[p.type].emoji}</span>
                      <span className="text-[10px] font-bold text-muted-foreground">
                        {Math.max(0, Math.ceil((p.expiresAt - Date.now()) / 1000))}s
                      </span>
                    </motion.div>
                  ))}
              </AnimatePresence>
              <div className="text-xs text-muted-foreground font-medium">
                {wordsCleared} cleared
              </div>
            </div>
          </div>

          {/* Game arena */}
          <div className="flex-1 relative overflow-hidden">
            {/* Escape zone indicator */}
            <div className="absolute top-0 left-0 right-0 h-8 bg-gradient-to-b from-destructive/10 to-transparent z-10" />

            {/* Floating words */}
            <AnimatePresence>
              {words.map((w) => (
                <motion.div
                  key={w.id}
                  initial={{ opacity: 0, scale: 0.5 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 1.5 }}
                  transition={{ duration: 0.2 }}
                  className={`absolute z-10 ${sizeClass(w.size)}`}
                  style={{
                    left: `${w.x}%`,
                    top: `${w.y}%`,
                    transform: "translate(-50%, -50%)",
                  }}
                >
                  <div
                    className="relative rounded-2xl border backdrop-blur-md font-display font-black text-center cursor-default"
                    style={{
                      background: `linear-gradient(135deg, hsl(${w.hue} 60% 20% / 0.8), hsl(${w.hue + 40} 50% 15% / 0.8))`,
                      borderColor: `hsl(${w.hue} 60% 50% / 0.4)`,
                      color: `hsl(${w.hue} 70% 80%)`,
                      boxShadow: `0 0 20px hsl(${w.hue} 60% 50% / 0.2), inset 0 1px 0 hsl(${w.hue} 60% 80% / 0.1)`,
                    }}
                  >
                    {w.spanish}
                    {/* Glow pulse */}
                    <div
                      className="absolute inset-0 rounded-2xl animate-pulse"
                      style={{
                        background: `radial-gradient(ellipse at center, hsl(${w.hue} 60% 50% / 0.15), transparent 70%)`,
                      }}
                    />
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>

            {/* Particles */}
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute z-20 pointer-events-none text-lg"
                style={{
                  left: `${p.x + Math.cos(p.angle) * p.speed * (1 - p.life) * 40}%`,
                  top: `${p.y + Math.sin(p.angle) * p.speed * (1 - p.life) * 40}%`,
                  opacity: p.life,
                  transform: `scale(${0.5 + p.life})`,
                }}
              >
                {p.emoji}
              </div>
            ))}

            {/* Power-up pickup */}
            <AnimatePresence>
              {pendingPowerUp && (
                <motion.div
                  initial={{ scale: 0, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0, opacity: 0 }}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30"
                >
                  <motion.button
                    animate={{ y: [0, -6, 0], rotate: [0, 3, -3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                    onClick={() => activatePower(pendingPowerUp)}
                    className={`flex flex-col items-center gap-1 px-8 py-5 rounded-2xl border-2 bg-gradient-to-br ${POWER_CONFIG[pendingPowerUp].color} border-white/20 shadow-2xl`}
                  >
                    <span className="text-4xl">{POWER_CONFIG[pendingPowerUp].emoji}</span>
                    <span className="text-white font-display font-black text-sm">
                      {POWER_CONFIG[pendingPowerUp].label}
                    </span>
                    <span className="text-white/70 text-[10px]">TAP TO USE</span>
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Input area */}
          <div className="relative z-20 px-4 pb-6 pt-2">
            <form onSubmit={handleSubmit} className="max-w-lg mx-auto">
              <div className="relative">
                <input
                  ref={inputRef}
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Type the English translation..."
                  autoComplete="off"
                  autoCorrect="off"
                  autoCapitalize="off"
                  spellCheck={false}
                  className="w-full px-6 py-4 bg-card/80 backdrop-blur-md border-2 border-border/40 rounded-2xl text-foreground font-display font-bold text-lg text-center placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/60 focus:shadow-lg focus:shadow-primary/10 transition-all"
                />
                {combo >= 3 && (
                  <div className="absolute -top-2 right-4 bg-accent text-accent-foreground text-[10px] font-black px-2 py-0.5 rounded-full">
                    {combo}x
                  </div>
                )}
              </div>
            </form>
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
            <motion.div
              initial={{ y: -20 }}
              animate={{ y: 0 }}
              className="text-6xl mb-4"
            >
              {score >= 500 ? "🏆" : score >= 200 ? "🔥" : score >= 100 ? "⚡" : "💀"}
            </motion.div>
            <h2 className="font-display font-black text-4xl text-foreground mb-2">
              {score >= 500 ? "LEGENDARY!" : score >= 200 ? "AMAZING!" : score >= 100 ? "NICE!" : "GAME OVER"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              You survived {wave} wave{wave > 1 ? "s" : ""} of the surge
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-primary">{score}</div>
                <div className="text-[10px] text-muted-foreground font-bold">SCORE</div>
              </div>
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-accent">{wordsCleared}</div>
                <div className="text-[10px] text-muted-foreground font-bold">CLEARED</div>
              </div>
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-secondary">{bestCombo}x</div>
                <div className="text-[10px] text-muted-foreground font-bold">BEST COMBO</div>
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={startGame}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-black text-sm shadow-lg shadow-primary/20"
              >
                <RotateCcw className="h-4 w-4" />
                Play Again
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

export default PalabraSurge;
