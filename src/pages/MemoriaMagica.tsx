import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Star, Timer, Sparkles, Flame, Trophy, Eye, Zap } from "lucide-react";
import { SPANISH_WORDS } from "@/data/spanishWords";
import { useGameScore } from "@/hooks/useGameScore";

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ── Types ──
interface Card {
  id: number;
  content: string;
  pairId: number;
  type: "spanish" | "english";
  matched: boolean;
  flipped: boolean;
}

type Phase = "menu" | "preview" | "playing" | "levelcomplete" | "gameover";
type Difficulty = "easy" | "medium" | "hard";

const DIFFICULTY_CONFIG: Record<Difficulty, { pairs: number; previewTime: number; timeLimit: number; label: string; emoji: string; cols: string }> = {
  easy:   { pairs: 6,  previewTime: 4000, timeLimit: 60,  label: "Fácil",    emoji: "🌱", cols: "grid-cols-3 sm:grid-cols-4" },
  medium: { pairs: 8,  previewTime: 3000, timeLimit: 75,  label: "Normal",   emoji: "🔥", cols: "grid-cols-4" },
  hard:   { pairs: 10, previewTime: 2500, timeLimit: 80,  label: "Difícil",  emoji: "💀", cols: "grid-cols-4 sm:grid-cols-5" },
};

const CARD_BACKS = ["🟪", "🟦", "🟩", "🟧", "🟥"];
const COMBO_EMOJIS = ["", "", "🔥", "⚡", "💎", "👑", "🌟", "💫"];

const MemoriaMagica = () => {
  const { saveScore } = useGameScore();

  const [phase, setPhase] = useState<Phase>("menu");
  const [difficulty, setDifficulty] = useState<Difficulty>("easy");
  const [cards, setCards] = useState<Card[]>([]);
  const [selected, setSelected] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [moves, setMoves] = useState(0);
  const [matchedCount, setMatchedCount] = useState(0);
  const [timeLeft, setTimeLeft] = useState(60);
  const [level, setLevel] = useState(1);
  const [totalScore, setTotalScore] = useState(0);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; emoji: string }[]>([]);
  const [flashCard, setFlashCard] = useState<number | null>(null);

  const lockRef = useRef(false);
  const timerRef = useRef<number>();
  const particleIdRef = useRef(0);

  const config = DIFFICULTY_CONFIG[difficulty];

  // ── Generate cards ──
  const generateCards = useCallback(
    (diff: Difficulty) => {
      const cfg = DIFFICULTY_CONFIG[diff];
      const pool = shuffle(SPANISH_WORDS).slice(0, cfg.pairs);
      const cardPairs: Card[] = [];
      let id = 0;

      pool.forEach((word, pairIdx) => {
        cardPairs.push({
          id: id++,
          content: word.word.toLowerCase(),
          pairId: pairIdx,
          type: "spanish",
          matched: false,
          flipped: false,
        });
        cardPairs.push({
          id: id++,
          content: word.english.toLowerCase(),
          pairId: pairIdx,
          type: "english",
          matched: false,
          flipped: false,
        });
      });

      return shuffle(cardPairs);
    },
    []
  );

  // ── Start game ──
  const startGame = (diff: Difficulty) => {
    setDifficulty(diff);
    setLevel(1);
    setTotalScore(0);
    startLevel(diff, 1);
  };

  const startLevel = (diff: Difficulty, lvl: number) => {
    const newCards = generateCards(diff);
    setCards(newCards.map((c) => ({ ...c, flipped: true }))); // Show all during preview
    setSelected([]);
    setScore(0);
    setCombo(0);
    setBestCombo(0);
    setMoves(0);
    setMatchedCount(0);
    setTimeLeft(DIFFICULTY_CONFIG[diff].timeLimit);
    setPhase("preview");
    lockRef.current = true;

    // Hide cards after preview
    setTimeout(() => {
      setCards((prev) => prev.map((c) => ({ ...c, flipped: false })));
      setPhase("playing");
      lockRef.current = false;
    }, DIFFICULTY_CONFIG[diff].previewTime);
  };

  // ── Timer ──
  useEffect(() => {
    if (phase !== "playing") return;

    timerRef.current = window.setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timerRef.current);
          setPhase("gameover");
          return 0;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timerRef.current);
  }, [phase]);

  // ── Burst particles ──
  const burst = useCallback((cardIdx: number, emoji: string) => {
    const col = cards.length > 0 ? cardIdx % 5 : 0;
    const row = cards.length > 0 ? Math.floor(cardIdx / 5) : 0;
    const newP = Array.from({ length: 5 }, () => ({
      id: ++particleIdRef.current,
      x: 10 + col * 18 + Math.random() * 10,
      y: 15 + row * 20 + Math.random() * 10,
      emoji,
    }));
    setParticles((prev) => [...prev, ...newP]);
    setTimeout(() => setParticles((prev) => prev.filter((p) => !newP.find((n) => n.id === p.id))), 800);
  }, [cards.length]);

  // ── Flip card ──
  const flipCard = useCallback(
    (cardId: number) => {
      if (lockRef.current || phase !== "playing") return;

      const card = cards.find((c) => c.id === cardId);
      if (!card || card.matched || card.flipped) return;
      if (selected.length >= 2) return;

      const newSelected = [...selected, cardId];
      setCards((prev) => prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)));
      setSelected(newSelected);

      if (newSelected.length === 2) {
        lockRef.current = true;
        setMoves((m) => m + 1);

        const [first, second] = newSelected.map((id) => cards.find((c) => c.id === id)!);

        if (first.pairId === second.pairId) {
          // Match!
          const newCombo = combo + 1;
          setCombo(newCombo);
          setBestCombo((b) => Math.max(b, newCombo));
          const comboBonus = Math.min(newCombo, 8) * 5;
          const timeBonus = Math.floor(timeLeft / 5);
          const earned = 20 + comboBonus + timeBonus;
          setScore((s) => s + earned);
          setMatchedCount((m) => {
            const next = m + 1;
            return next;
          });

          burst(cards.indexOf(first), newCombo >= 3 ? "⚡" : "✨");
          setFlashCard(first.pairId);
          setTimeout(() => setFlashCard(null), 400);

          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) => (c.pairId === first.pairId ? { ...c, matched: true } : c))
            );
            setSelected([]);
            lockRef.current = false;
          }, 400);
        } else {
          // No match
          setCombo(0);
          setTimeout(() => {
            setCards((prev) =>
              prev.map((c) =>
                newSelected.includes(c.id) ? { ...c, flipped: false } : c
              )
            );
            setSelected([]);
            lockRef.current = false;
          }, 700);
        }
      }
    },
    [cards, selected, phase, combo, timeLeft, burst]
  );

  // ── Check level complete ──
  useEffect(() => {
    if (phase !== "playing") return;
    const allMatched = cards.length > 0 && cards.every((c) => c.matched);
    if (allMatched) {
      if (timerRef.current) clearInterval(timerRef.current);
      const timeBonus = timeLeft * 3;
      const movePenalty = Math.max(0, (moves - config.pairs) * 2);
      const levelScore = score + timeBonus - movePenalty;
      setTotalScore((t) => t + Math.max(0, levelScore));
      setPhase("levelcomplete");
    }
  }, [cards, phase, score, timeLeft, moves, config.pairs]);

  // ── Save score on game over ──
  useEffect(() => {
    if (phase === "gameover" && totalScore + score > 0) {
      saveScore("verb_match", totalScore + score, undefined, bestCombo);
    }
  }, [phase, totalScore, score, bestCombo, saveScore]);

  // ── Next level ──
  const nextLevel = () => {
    const newLevel = level + 1;
    setLevel(newLevel);
    // Escalate difficulty every 2 levels
    const newDiff: Difficulty =
      newLevel >= 5 ? "hard" : newLevel >= 3 ? "medium" : difficulty;
    setDifficulty(newDiff);
    startLevel(newDiff, newLevel);
  };

  // Timer color
  const timerColor = timeLeft > 30 ? "text-primary" : timeLeft > 15 ? "text-accent" : "text-destructive";

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden select-none">
      {/* Background */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-secondary/5" />
        <div className="absolute top-1/3 right-1/3 w-[500px] h-[500px] bg-accent/6 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 left-1/3 w-[400px] h-[400px] bg-secondary/6 rounded-full blur-[100px]" />
      </div>

      {/* Particles */}
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.5, y: 0 }}
            animate={{ opacity: 0, scale: 1.5, y: -60 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.7 }}
            className="fixed z-50 pointer-events-none text-xl"
            style={{ left: `${p.x}%`, top: `${p.y}%` }}
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
            <Eye className="h-5 w-5 text-accent" />
            <span className="font-display font-black text-lg text-foreground">Memoria Mágica</span>
          </div>
          {(phase === "playing" || phase === "preview") ? (
            <div className="flex items-center gap-3 text-sm">
              <div className="flex items-center gap-1 text-accent font-bold">
                <Star className="h-4 w-4" />
                {score}
              </div>
              <div className={`flex items-center gap-1 font-bold ${timerColor}`}>
                <Timer className="h-4 w-4" />
                {timeLeft}s
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
              animate={{ rotateY: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
              className="text-7xl mb-6 inline-block"
            >
              🃏
            </motion.div>
            <h1 className="font-display font-black text-5xl mb-3">
              <span className="text-gradient-primary">Memoria</span>{" "}
              <span className="text-foreground">Mágica</span>
            </h1>
            <p className="text-muted-foreground mb-2">
              Flip cards to match <strong className="text-foreground">Spanish words with English translations</strong>
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Memorize during preview • Build match combos • Beat the clock
            </p>

            <div className="space-y-3 mb-6">
              {(["easy", "medium", "hard"] as Difficulty[]).map((diff) => {
                const cfg = DIFFICULTY_CONFIG[diff];
                return (
                  <motion.button
                    key={diff}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    onClick={() => startGame(diff)}
                    className="w-full flex items-center justify-between px-6 py-4 bg-card/60 border border-border/40 rounded-2xl hover:border-primary/40 transition-all group"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">{cfg.emoji}</span>
                      <div className="text-left">
                        <div className="font-display font-black text-foreground group-hover:text-primary transition-colors">
                          {cfg.label}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {cfg.pairs} pairs • {cfg.timeLimit}s • {cfg.previewTime / 1000}s preview
                        </div>
                      </div>
                    </div>
                    <Zap className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                  </motion.button>
                );
              })}
            </div>
          </motion.div>
        </div>
      )}

      {/* PREVIEW */}
      {phase === "preview" && (
        <div className="flex-1 flex flex-col items-center relative z-10 px-4 py-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-2 mb-4 bg-accent/20 border border-accent/30 rounded-full px-5 py-2"
          >
            <Eye className="h-4 w-4 text-accent" />
            <span className="text-sm font-black text-accent">MEMORIZE! Level {level}</span>
          </motion.div>
          <div className={`grid ${config.cols} gap-2 sm:gap-3 max-w-2xl w-full`}>
            {cards.map((card) => (
              <motion.div
                key={card.id}
                initial={{ scale: 0, rotateY: 180 }}
                animate={{ scale: 1, rotateY: 0 }}
                transition={{ delay: card.id * 0.03, type: "spring", damping: 12 }}
                className="aspect-[3/4] rounded-xl border border-primary/30 bg-gradient-to-br from-primary/20 to-accent/20 backdrop-blur-sm flex items-center justify-center p-1.5"
              >
                <span className="font-display font-bold text-foreground text-[10px] sm:text-xs text-center leading-tight">
                  {card.content}
                </span>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* PLAYING */}
      {phase === "playing" && (
        <div className="flex-1 flex flex-col items-center relative z-10 px-4 py-4">
          {/* HUD */}
          <div className="flex items-center gap-4 mb-4 w-full max-w-2xl justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-muted-foreground bg-card/50 border border-border/30 rounded-lg px-3 py-1.5">
                Level {level}
              </span>
              {combo >= 2 && (
                <motion.span
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="text-xs font-black text-accent bg-accent/20 border border-accent/30 rounded-lg px-3 py-1.5"
                >
                  {COMBO_EMOJIS[Math.min(combo, COMBO_EMOJIS.length - 1)]} {combo}x COMBO
                </motion.span>
              )}
            </div>
            <span className="text-xs text-muted-foreground font-medium">
              {matchedCount}/{config.pairs} matched
            </span>
          </div>

          {/* Card grid */}
          <div className={`grid ${config.cols} gap-2 sm:gap-3 max-w-2xl w-full`}>
            {cards.map((card) => (
              <motion.button
                key={card.id}
                onClick={() => flipCard(card.id)}
                whileTap={{ scale: 0.92 }}
                className={`aspect-[3/4] rounded-xl border-2 transition-all duration-200 relative overflow-hidden ${
                  card.matched
                    ? "border-primary/40 bg-primary/10 opacity-50 pointer-events-none"
                    : card.flipped
                    ? "border-accent/50 bg-gradient-to-br from-card/80 to-card/60 shadow-lg shadow-accent/10"
                    : "border-border/40 bg-card/60 hover:border-primary/40 hover:shadow-md cursor-pointer"
                }`}
              >
                <AnimatePresence mode="wait">
                  {card.flipped || card.matched ? (
                    <motion.div
                      key="front"
                      initial={{ rotateY: 90 }}
                      animate={{ rotateY: 0 }}
                      exit={{ rotateY: 90 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex flex-col items-center justify-center p-1.5"
                    >
                      <span
                        className={`font-display font-bold text-center leading-tight ${
                          card.type === "spanish"
                            ? "text-primary text-[10px] sm:text-xs"
                            : "text-accent text-[10px] sm:text-xs"
                        }`}
                      >
                        {card.content}
                      </span>
                      <span className="text-[8px] text-muted-foreground mt-1 uppercase">
                        {card.type === "spanish" ? "ES" : "EN"}
                      </span>
                    </motion.div>
                  ) : (
                    <motion.div
                      key="back"
                      initial={{ rotateY: -90 }}
                      animate={{ rotateY: 0 }}
                      exit={{ rotateY: -90 }}
                      transition={{ duration: 0.2 }}
                      className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-muted/40 to-muted/20"
                    >
                      <span className="text-2xl opacity-30">?</span>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Match glow */}
                {flashCard === card.pairId && (
                  <motion.div
                    initial={{ opacity: 0.8 }}
                    animate={{ opacity: 0 }}
                    transition={{ duration: 0.4 }}
                    className="absolute inset-0 bg-primary/30 rounded-xl"
                  />
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

      {/* LEVEL COMPLETE */}
      {phase === "levelcomplete" && (
        <div className="flex-1 flex items-center justify-center relative z-10 px-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="text-center max-w-sm"
          >
            <motion.div
              animate={{ rotate: [0, 10, -10, 0] }}
              transition={{ duration: 0.5, repeat: 3 }}
              className="text-6xl mb-4"
            >
              🎉
            </motion.div>
            <h2 className="font-display font-black text-3xl text-foreground mb-2">
              Level {level} Complete!
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              {moves} moves • {timeLeft}s remaining • {bestCombo}x best combo
            </p>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-xl font-display font-black text-accent">{score}</div>
                <div className="text-[10px] text-muted-foreground font-bold">LEVEL SCORE</div>
              </div>
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-xl font-display font-black text-primary">{totalScore + score}</div>
                <div className="text-[10px] text-muted-foreground font-bold">TOTAL</div>
              </div>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={nextLevel}
              className="px-10 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-xl font-display font-black text-sm shadow-lg"
            >
              Next Level →
            </motion.button>
          </motion.div>
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
              {totalScore + score >= 300 ? "🧠" : totalScore + score >= 150 ? "🃏" : "⏰"}
            </motion.div>
            <h2 className="font-display font-black text-4xl text-foreground mb-2">
              {totalScore + score >= 300 ? "GENIUS!" : totalScore + score >= 150 ? "GREAT MEMORY!" : "TIME'S UP!"}
            </h2>
            <p className="text-muted-foreground text-sm mb-6">
              You reached level {level}
            </p>

            <div className="grid grid-cols-3 gap-3 mb-8">
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-accent">{totalScore + score}</div>
                <div className="text-[10px] text-muted-foreground font-bold">SCORE</div>
              </div>
              <div className="bg-card/60 border border-border/30 rounded-xl p-3">
                <div className="text-2xl font-display font-black text-primary">{level}</div>
                <div className="text-[10px] text-muted-foreground font-bold">LEVEL</div>
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
                onClick={() => setPhase("menu")}
                className="flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-accent to-primary text-primary-foreground rounded-xl font-display font-black text-sm shadow-lg"
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

export default MemoriaMagica;
