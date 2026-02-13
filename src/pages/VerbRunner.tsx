import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Heart, Zap, RotateCcw } from "lucide-react";
import { VERB_CHALLENGES, VerbChallenge } from "@/data/spanishWords";

interface FallingVerb {
  id: number;
  challenge: VerbChallenge;
  y: number;
  speed: number;
}

function getRandomChallenge(): VerbChallenge {
  return VERB_CHALLENGES[Math.floor(Math.random() * VERB_CHALLENGES.length)];
}

export default function VerbRunner() {
  const [gameState, setGameState] = useState<"idle" | "playing" | "over">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [verbs, setVerbs] = useState<FallingVerb[]>([]);
  const [input, setInput] = useState("");
  const [combo, setCombo] = useState(0);
  const [flash, setFlash] = useState<"correct" | "wrong" | null>(null);
  const [highScore, setHighScore] = useState(0);
  const nextId = useRef(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const animFrameRef = useRef<number>();
  const lastTimeRef = useRef<number>(0);
  const spawnTimerRef = useRef<number>(0);

  const startGame = () => {
    setGameState("playing");
    setScore(0);
    setLives(3);
    setVerbs([]);
    setInput("");
    setCombo(0);
    nextId.current = 0;
    lastTimeRef.current = 0;
    spawnTimerRef.current = 0;
    inputRef.current?.focus();
  };

  const spawnVerb = useCallback(() => {
    const challenge = getRandomChallenge();
    const verb: FallingVerb = {
      id: nextId.current++,
      challenge,
      y: 0,
      speed: 0.4 + Math.min(score * 0.01, 0.8),
    };
    setVerbs((prev) => [...prev, verb]);
  }, [score]);

  // Game loop
  useEffect(() => {
    if (gameState !== "playing") return;

    const loop = (time: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = time;
      const dt = time - lastTimeRef.current;
      lastTimeRef.current = time;

      spawnTimerRef.current += dt;
      if (spawnTimerRef.current > Math.max(2000 - score * 30, 800)) {
        spawnTimerRef.current = 0;
        spawnVerb();
      }

      setVerbs((prev) => {
        const updated: FallingVerb[] = [];
        let lostLife = false;
        for (const v of prev) {
          const newY = v.y + v.speed * (dt / 16);
          if (newY >= 100) {
            lostLife = true;
          } else {
            updated.push({ ...v, y: newY });
          }
        }
        if (lostLife) {
          setLives((l) => l - 1);
          setCombo(0);
        }
        return updated;
      });

      animFrameRef.current = requestAnimationFrame(loop);
    };

    animFrameRef.current = requestAnimationFrame(loop);
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    };
  }, [gameState, spawnVerb, score]);

  // Check game over
  useEffect(() => {
    if (lives <= 0 && gameState === "playing") {
      setGameState("over");
      setHighScore((h) => Math.max(h, score));
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
    }
  }, [lives, gameState, score]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || gameState !== "playing") return;

    const answer = input.trim().toLowerCase();
    const matchIdx = verbs.findIndex(
      (v) => v.challenge.answer.toLowerCase() === answer
    );

    if (matchIdx !== -1) {
      setVerbs((prev) => prev.filter((_, i) => i !== matchIdx));
      const points = 10 + combo * 5;
      setScore((s) => s + points);
      setCombo((c) => c + 1);
      setFlash("correct");
    } else {
      setFlash("wrong");
      setCombo(0);
    }
    setInput("");
    setTimeout(() => setFlash(null), 400);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">🏃 Verb Runner</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-2xl mx-auto w-full">
        {gameState === "idle" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="text-6xl mb-6 animate-float">🏃‍♂️</div>
            <h2 className="font-display font-bold text-3xl text-foreground mb-3">
              Verb Conjugation Runner
            </h2>
            <p className="text-muted-foreground mb-2 max-w-sm">
              Spanish verbs fall from the sky. Type the correct conjugation before they hit the ground!
            </p>
            <p className="text-muted-foreground text-sm mb-8">
              Each verb shows: <span className="text-secondary">infinitive</span> + <span className="text-accent">pronoun</span> → type the conjugated form
            </p>
            <button
              onClick={startGame}
              className="px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg hover:opacity-90 transition-opacity glow-primary"
            >
              Start Running
            </button>
            {highScore > 0 && (
              <p className="mt-4 text-muted-foreground text-sm">
                High Score: <span className="text-secondary font-bold">{highScore}</span>
              </p>
            )}
          </motion.div>
        )}

        {gameState === "playing" && (
          <>
            {/* HUD */}
            <div className="flex items-center justify-between w-full mb-4">
              <div className="flex items-center gap-1">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Heart
                    key={i}
                    className={`h-6 w-6 ${i < lives ? "text-primary fill-primary" : "text-muted"}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4">
                {combo > 1 && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="flex items-center gap-1 text-secondary font-bold text-sm"
                  >
                    <Zap className="h-4 w-4" />
                    x{combo}
                  </motion.div>
                )}
                <div className="font-display font-bold text-2xl text-foreground">{score}</div>
              </div>
            </div>

            {/* Game area */}
            <div
              className={`relative w-full flex-1 min-h-[400px] rounded-xl border-2 overflow-hidden transition-colors duration-200 ${
                flash === "correct"
                  ? "border-success bg-success/5"
                  : flash === "wrong"
                  ? "border-primary bg-primary/5"
                  : "border-border bg-card/30"
              }`}
            >
              {/* Danger zone */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary opacity-60" />

              <AnimatePresence>
                {verbs.map((verb) => (
                  <motion.div
                    key={verb.id}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.3 }}
                    className="absolute left-1/2 -translate-x-1/2 px-4 py-3 bg-card border border-border rounded-lg text-center whitespace-nowrap"
                    style={{ top: `${verb.y}%` }}
                  >
                    <div className="text-secondary font-bold text-sm">{verb.challenge.infinitive}</div>
                    <div className="text-accent text-xs">{verb.challenge.pronoun} • {verb.challenge.tense}</div>
                    <div className="text-muted-foreground text-xs mt-0.5">({verb.challenge.english})</div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="w-full mt-4">
              <input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Type the conjugation..."
                autoFocus
                className="w-full px-4 py-3 bg-card border-2 border-border rounded-xl text-foreground text-center font-display text-lg focus:outline-none focus:border-primary transition-colors placeholder:text-muted-foreground"
              />
            </form>
          </>
        )}

        {gameState === "over" && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <div className="text-6xl mb-4">💀</div>
            <h2 className="font-display font-bold text-3xl text-foreground mb-2">¡Se acabó!</h2>
            <p className="text-muted-foreground mb-6">Game Over</p>

            <div className="flex gap-8 mb-8">
              <div>
                <div className="font-display font-bold text-4xl text-foreground">{score}</div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-secondary">{highScore}</div>
                <div className="text-xs text-muted-foreground">Best</div>
              </div>
            </div>

            <button
              onClick={startGame}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg hover:opacity-90 transition-opacity glow-primary"
            >
              <RotateCcw className="h-5 w-5" />
              Try Again
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
