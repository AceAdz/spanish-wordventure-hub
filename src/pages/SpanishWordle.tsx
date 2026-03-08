import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, BookOpen, X, PartyPopper, Frown, Flame, Sparkles, Zap } from "lucide-react";
import { SPANISH_WORDS } from "@/data/spanishWords";
import { useGameScore } from "@/hooks/useGameScore";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

type LetterState = "correct" | "present" | "absent" | "empty" | "tbd";

interface TileData {
  letter: string;
  state: LetterState;
}

const WORD_LENGTH = 5;
const MAX_GUESSES = 5;

const KEYBOARD_ROWS = [
  ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"],
  ["A", "S", "D", "F", "G", "H", "J", "K", "L", "Ñ"],
  ["ENTER", "Z", "X", "C", "V", "B", "N", "M", "⌫"],
];

const FIVE_LETTER_WORDS = SPANISH_WORDS.filter((w) => w.word.length === WORD_LENGTH);
const VALID_WORDS_SET = new Set(FIVE_LETTER_WORDS.map((w) => w.word.toUpperCase()));

function getRandomWord() {
  return FIVE_LETTER_WORDS[Math.floor(Math.random() * FIVE_LETTER_WORDS.length)];
}

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill("absent");
  const answerArr = answer.split("");
  const guessArr = guess.split("");
  const used = Array(WORD_LENGTH).fill(false);

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  for (let i = 0; i < WORD_LENGTH; i++) {
    if (result[i] === "correct") continue;
    for (let j = 0; j < WORD_LENGTH; j++) {
      if (!used[j] && guessArr[i] === answerArr[j]) {
        result[i] = "present";
        used[j] = true;
        break;
      }
    }
  }

  return result;
}

const tileColors: Record<LetterState, string> = {
  correct: "bg-success border-success text-success-foreground",
  present: "bg-secondary border-secondary text-secondary-foreground",
  absent: "bg-muted/80 border-muted text-muted-foreground",
  empty: "border-border/30 bg-card/30",
  tbd: "border-foreground/30 bg-card text-foreground",
};

const keyColors: Record<LetterState, string> = {
  correct: "bg-success text-success-foreground border-success/50",
  present: "bg-secondary text-secondary-foreground border-secondary/50",
  absent: "bg-muted/40 text-muted-foreground/40 border-transparent",
  empty: "bg-card/80 text-foreground border-border/30 hover:bg-muted/50 hover:border-border",
  tbd: "bg-card/80 text-foreground border-border/30 hover:bg-muted/50 hover:border-border",
};

// Confetti particles for winning
function Confetti() {
  const colors = [
    "hsl(var(--success))",
    "hsl(var(--secondary))",
    "hsl(var(--accent))",
    "hsl(var(--primary))",
  ];
  return (
    <div className="fixed inset-0 pointer-events-none z-50 overflow-hidden">
      {[...Array(40)].map((_, i) => (
        <motion.div
          key={i}
          initial={{
            x: Math.random() * window.innerWidth,
            y: -20,
            rotate: 0,
            scale: 0.5 + Math.random() * 0.8,
          }}
          animate={{
            y: window.innerHeight + 20,
            rotate: 360 * (Math.random() > 0.5 ? 1 : -1),
            x: Math.random() * window.innerWidth,
          }}
          transition={{
            duration: 2 + Math.random() * 2,
            delay: Math.random() * 0.5,
            ease: "linear",
          }}
          className="absolute"
        >
          <div
            className="w-2 h-3 rounded-sm"
            style={{ backgroundColor: colors[i % colors.length] }}
          />
        </motion.div>
      ))}
    </div>
  );
}

export default function SpanishWordle() {
  const [targetWord, setTargetWord] = useState(getRandomWord);
  const [guesses, setGuesses] = useState<TileData[][]>([]);
  const [currentGuess, setCurrentGuess] = useState("");
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const [shakeRow, setShakeRow] = useState(false);
  const [revealingRow, setRevealingRow] = useState(-1);
  const [keyStates, setKeyStates] = useState<Record<string, LetterState>>({});
  const [stats, setStats] = useState({ streak: 0, wins: 0, played: 0 });
  const [showDictionary, setShowDictionary] = useState(false);
  const [showResultDialog, setShowResultDialog] = useState(false);
  const [showConfetti, setShowConfetti] = useState(false);
  const [bounceRow, setBounceRow] = useState(-1);
  const [invalidWord, setInvalidWord] = useState(false);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);

  useEffect(() => {
    if (gameOver && !savedRef.current) {
      savedRef.current = true;
      const score = won ? Math.max(1, (MAX_GUESSES - guesses.length + 1) * 20) : 5;
      saveScore("wordle", score, won ? 1 : 0, stats.streak);
    }
  }, [gameOver, won, guesses.length, stats.streak, saveScore]);

  const submitGuess = useCallback(() => {
    if (currentGuess.length !== WORD_LENGTH || gameOver) return;

    const guess = currentGuess.toUpperCase();

    if (!VALID_WORDS_SET.has(guess)) {
      setShakeRow(true);
      setInvalidWord(true);
      setTimeout(() => { setShakeRow(false); setInvalidWord(false); }, 1500);
      return;
    }
    const states = evaluateGuess(guess, targetWord.word);

    const newTiles: TileData[] = guess.split("").map((letter, i) => ({
      letter,
      state: states[i],
    }));

    const newGuesses = [...guesses, newTiles];
    setGuesses(newGuesses);
    setRevealingRow(newGuesses.length - 1);
    setCurrentGuess("");

    const newKeyStates = { ...keyStates };
    guess.split("").forEach((letter, i) => {
      const current = newKeyStates[letter];
      const newState = states[i];
      if (!current || newState === "correct" || (newState === "present" && current !== "correct")) {
        newKeyStates[letter] = newState;
      }
    });
    setKeyStates(newKeyStates);

    setTimeout(() => {
      setRevealingRow(-1);
      if (guess === targetWord.word) {
        setWon(true);
        setGameOver(true);
        setBounceRow(newGuesses.length - 1);
        setShowConfetti(true);
        setStats((s) => ({ ...s, streak: s.streak + 1, wins: s.wins + 1, played: s.played + 1 }));
        setTimeout(() => setShowResultDialog(true), 1200);
        setTimeout(() => setShowConfetti(false), 4000);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        setStats((s) => ({ ...s, streak: 0, played: s.played + 1 }));
        setTimeout(() => setShowResultDialog(true), 600);
      }
    }, WORD_LENGTH * 300 + 200);
  }, [currentGuess, gameOver, guesses, keyStates, targetWord.word]);

  const handleKey = useCallback(
    (key: string) => {
      if (gameOver) return;
      if (key === "ENTER") {
        if (currentGuess.length === WORD_LENGTH) {
          submitGuess();
        } else {
          setShakeRow(true);
          setTimeout(() => setShakeRow(false), 500);
        }
      } else if (key === "⌫" || key === "BACKSPACE") {
        setCurrentGuess((prev) => prev.slice(0, -1));
      } else if (/^[A-ZÑ]$/.test(key) && currentGuess.length < WORD_LENGTH) {
        setCurrentGuess((prev) => prev + key);
      }
    },
    [currentGuess, gameOver, submitGuess]
  );

  useEffect(() => {
    const handler = (e: KeyboardEvent) => handleKey(e.key.toUpperCase());
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleKey]);

  const newGame = () => {
    setTargetWord(getRandomWord());
    setGuesses([]);
    setCurrentGuess("");
    setGameOver(false);
    setWon(false);
    setShakeRow(false);
    setRevealingRow(-1);
    setKeyStates({});
    setShowResultDialog(false);
    setShowConfetti(false);
    setBounceRow(-1);
    savedRef.current = false;
  };

  // Build display grid
  const displayRows: TileData[][] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      displayRows.push(guesses[i]);
    } else if (i === guesses.length) {
      const row: TileData[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        row.push({ letter: currentGuess[j] || "", state: currentGuess[j] ? "tbd" : "empty" });
      }
      displayRows.push(row);
    } else {
      displayRows.push(Array(WORD_LENGTH).fill(null).map(() => ({ letter: "", state: "empty" as LetterState })));
    }
  }

  const correctCount = guesses.length > 0
    ? guesses[guesses.length - 1].filter((t) => t.state === "correct").length
    : 0;

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background effect */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/3 via-transparent to-secondary/3" />
      </div>

      {showConfetti && <Confetti />}

      {/* Header */}
      <header className="border-b border-border/20 px-4 py-3 relative z-10 backdrop-blur-sm bg-background/80">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            🇪🇸 <span className="text-gradient-primary">Spanish Wordle</span>
          </h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDictionary(!showDictionary)} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
              <BookOpen className="h-5 w-5" />
            </button>
            <button onClick={newGame} className="text-muted-foreground hover:text-foreground transition-colors p-1 rounded-lg hover:bg-muted/50">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Dictionary Panel */}
      <AnimatePresence>
        {showDictionary && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden border-b border-border/20 relative z-10 backdrop-blur-sm bg-background/80">
            <div className="max-w-lg mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Word Dictionary
                </h2>
                <button onClick={() => setShowDictionary(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto space-y-1">
                {FIVE_LETTER_WORDS.map((w, i) => (
                  <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded-md bg-card/50 text-sm">
                    <span className="font-display font-bold text-foreground tracking-wide">{w.word}</span>
                    <span className="text-muted-foreground italic">{w.english}</span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="flex-1 flex flex-col items-center justify-between py-4 px-4 max-w-lg mx-auto w-full relative z-10">
        {/* Stats bar */}
        <div className="flex gap-4 text-center mb-4">
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 border border-border/30 rounded-full backdrop-blur-sm">
            <Flame className={`h-4 w-4 ${stats.streak > 0 ? "text-accent" : "text-muted-foreground/30"}`} />
            <span className="font-display font-bold text-foreground">{stats.streak}</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 border border-border/30 rounded-full backdrop-blur-sm">
            <Zap className="h-4 w-4 text-success" />
            <span className="font-display font-bold text-foreground">{stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 bg-card/60 border border-border/30 rounded-full backdrop-blur-sm">
            <Sparkles className="h-4 w-4 text-secondary" />
            <span className="font-display font-bold text-foreground">{stats.played}</span>
          </div>
        </div>

        {/* Legend */}
        <div className="flex gap-4 mb-4 text-xs">
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-success border border-success/50 flex items-center justify-center text-[10px] font-bold text-success-foreground">A</div>
            <span className="text-muted-foreground">Correct</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-secondary border border-secondary/50 flex items-center justify-center text-[10px] font-bold text-secondary-foreground">B</div>
            <span className="text-muted-foreground">Wrong spot</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-md bg-muted/80 border border-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground">C</div>
            <span className="text-muted-foreground">Not in word</span>
          </div>
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-1.5 mb-4">
          {displayRows.map((row, rowIdx) => (
            <div
              key={rowIdx}
              className={`flex gap-1.5 ${shakeRow && rowIdx === guesses.length ? "tile-shake" : ""}`}
            >
              {row.map((tile, colIdx) => {
                const isRevealing = rowIdx === revealingRow;
                const isBouncing = rowIdx === bounceRow;
                const delay = isRevealing ? colIdx * 0.3 : 0;
                const hasLetter = tile.letter !== "";
                const isCurrentRow = rowIdx === guesses.length && !gameOver;

                return (
                  <motion.div
                    key={colIdx}
                    animate={
                      hasLetter && tile.state === "tbd"
                        ? { scale: [1, 1.1, 1] }
                        : isBouncing
                        ? { y: [0, -12, 0], transition: { delay: colIdx * 0.1, duration: 0.4 } }
                        : {}
                    }
                    transition={{ duration: 0.1 }}
                    className={`relative w-[60px] h-[60px] md:w-[64px] md:h-[64px] flex items-center justify-center border-2 rounded-lg font-display font-black text-2xl uppercase transition-all duration-300 ${tileColors[tile.state]} ${isRevealing ? "tile-flip" : ""} ${
                      isCurrentRow && !hasLetter ? "border-dashed" : ""
                    }`}
                    style={isRevealing ? { animationDelay: `${delay}s` } : {}}
                  >
                    {tile.letter}
                    {/* Glow effect for correct tiles */}
                    {tile.state === "correct" && !isRevealing && (
                      <div className="absolute inset-0 rounded-lg bg-success/20 animate-pulse pointer-events-none" />
                    )}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Game over hint */}
        <AnimatePresence>
          {gameOver && !showResultDialog && (
            <motion.button
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => setShowResultDialog(true)}
              className="mb-3 text-sm text-primary font-display font-bold hover:underline"
            >
              View Results →
            </motion.button>
          )}
        </AnimatePresence>

        {/* Keyboard */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-md">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center w-full">
              {row.map((key) => {
                const state = keyStates[key] || "empty";
                const isWide = key === "ENTER" || key === "⌫";
                return (
                  <motion.button
                    key={key}
                    whileTap={{ scale: 0.92 }}
                    onClick={() => handleKey(key)}
                    className={`${isWide ? "px-3 md:px-4 text-xs" : "w-[34px] md:w-[40px]"} h-[48px] md:h-[52px] rounded-lg font-bold text-sm transition-all duration-200 border ${keyColors[state]}`}
                  >
                    {key}
                  </motion.button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              {won ? (
                <><PartyPopper className="h-7 w-7 text-success" /> <span className="text-gradient-primary">¡Correcto!</span></>
              ) : (
                <><Frown className="h-7 w-7 text-primary" /> ¡Casi!</>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">Game result</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/30 rounded-xl p-6 text-center border border-border/30">
              <p className="text-muted-foreground text-sm mb-2">The word was</p>
              <motion.p
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: "spring" }}
                className="font-display font-black text-4xl text-foreground tracking-[0.2em]"
              >
                {targetWord.word}
              </motion.p>
              <motion.p
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-accent font-display font-bold text-lg mt-2"
              >
                "{targetWord.english}"
              </motion.p>
            </div>

            {won && (
              <motion.div
                initial={{ y: 10, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
                className="flex justify-center gap-6 text-center"
              >
                <div className="px-4 py-2 bg-success/10 border border-success/20 rounded-xl">
                  <div className="font-display font-bold text-xl text-success">{guesses.length}/{MAX_GUESSES}</div>
                  <div className="text-xs text-muted-foreground">Guesses</div>
                </div>
                <div className="px-4 py-2 bg-secondary/10 border border-secondary/20 rounded-xl">
                  <div className="font-display font-bold text-xl text-secondary">{stats.streak} 🔥</div>
                  <div className="text-xs text-muted-foreground">Streak</div>
                </div>
              </motion.div>
            )}

            {/* Guess visualization */}
            <div className="flex justify-center gap-1">
              {guesses.map((row, i) => (
                <div key={i} className="flex flex-col gap-0.5">
                  {row.map((tile, j) => (
                    <div
                      key={j}
                      className={`w-3 h-3 rounded-sm ${
                        tile.state === "correct" ? "bg-success" : tile.state === "present" ? "bg-secondary" : "bg-muted/60"
                      }`}
                    />
                  ))}
                </div>
              ))}
            </div>

            <button onClick={newGame} className="w-full py-3.5 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-bold text-lg hover:opacity-90 transition-opacity glow-primary">
              {won ? "Play Again 🎉" : "Try Again"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
