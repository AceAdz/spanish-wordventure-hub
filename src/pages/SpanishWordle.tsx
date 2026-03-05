import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, BookOpen, X, PartyPopper, Frown } from "lucide-react";
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
  present: "bg-warning border-warning text-warning-foreground",
  absent: "bg-muted border-muted text-muted-foreground",
  empty: "border-border/40 bg-transparent",
  tbd: "border-foreground/20 bg-card text-foreground",
};

const keyColors: Record<LetterState, string> = {
  correct: "bg-success text-success-foreground",
  present: "bg-warning text-warning-foreground",
  absent: "bg-muted/60 text-muted-foreground/60",
  empty: "bg-card text-foreground border border-border/50 hover:bg-muted/50",
  tbd: "bg-card text-foreground border border-border/50 hover:bg-muted/50",
};

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
        setStats((s) => ({ ...s, streak: s.streak + 1, wins: s.wins + 1, played: s.played + 1 }));
        setTimeout(() => setShowResultDialog(true), 400);
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        setStats((s) => ({ ...s, streak: 0, played: s.played + 1 }));
        setTimeout(() => setShowResultDialog(true), 400);
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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/30 px-4 py-3">
        <div className="max-w-lg mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">🇪🇸 Spanish Wordle</h1>
          <div className="flex items-center gap-2">
            <button onClick={() => setShowDictionary(!showDictionary)} className="text-muted-foreground hover:text-foreground transition-colors">
              <BookOpen className="h-5 w-5" />
            </button>
            <button onClick={newGame} className="text-muted-foreground hover:text-foreground transition-colors">
              <RotateCcw className="h-5 w-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Dictionary Panel */}
      <AnimatePresence>
        {showDictionary && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.3 }} className="overflow-hidden border-b border-border/30">
            <div className="max-w-lg mx-auto px-4 py-3">
              <div className="flex items-center justify-between mb-2">
                <h2 className="font-display font-bold text-sm text-foreground flex items-center gap-2">
                  <BookOpen className="h-4 w-4 text-primary" /> Word Dictionary
                </h2>
                <button onClick={() => setShowDictionary(false)} className="text-muted-foreground hover:text-foreground">
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="max-h-48 overflow-y-auto scrollbar-thin space-y-1">
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

      <main className="flex-1 flex flex-col items-center justify-between py-4 px-4 max-w-lg mx-auto w-full">
        {/* Stats bar */}
        <div className="flex gap-6 text-center mb-4">
          <div><div className="font-display font-bold text-2xl text-foreground">{stats.streak}</div><div className="text-xs text-muted-foreground">Streak</div></div>
          <div><div className="font-display font-bold text-2xl text-foreground">{stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%</div><div className="text-xs text-muted-foreground">Win Rate</div></div>
          <div><div className="font-display font-bold text-2xl text-foreground">{stats.played}</div><div className="text-xs text-muted-foreground">Played</div></div>
        </div>

        {/* Legend */}
        <div className="flex gap-3 mb-3 text-xs">
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-success" /><span className="text-muted-foreground">Correct</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-warning" /><span className="text-muted-foreground">Wrong spot</span></div>
          <div className="flex items-center gap-1.5"><div className="w-4 h-4 rounded bg-muted" /><span className="text-muted-foreground">Not in word</span></div>
        </div>

        {/* Grid */}
        <div className="flex flex-col gap-1.5 mb-4">
          {displayRows.map((row, rowIdx) => (
            <div key={rowIdx} className={`flex gap-1.5 ${shakeRow && rowIdx === guesses.length ? "tile-shake" : ""}`}>
              {row.map((tile, colIdx) => {
                const isRevealing = rowIdx === revealingRow;
                const delay = isRevealing ? colIdx * 0.3 : 0;
                const hasLetter = tile.letter !== "";

                return (
                  <motion.div
                    key={colIdx}
                    animate={hasLetter && tile.state === "tbd" ? { scale: [1, 1.08, 1] } : {}}
                    transition={{ duration: 0.1 }}
                    className={`w-14 h-14 md:w-16 md:h-16 flex items-center justify-center border-2 rounded-lg font-display font-bold text-2xl uppercase transition-colors ${tileColors[tile.state]} ${isRevealing ? "tile-flip" : ""}`}
                    style={isRevealing ? { animationDelay: `${delay}s` } : {}}
                  >
                    {tile.letter}
                  </motion.div>
                );
              })}
            </div>
          ))}
        </div>

        {/* Keyboard */}
        <div className="flex flex-col items-center gap-1.5 w-full max-w-md">
          {KEYBOARD_ROWS.map((row, rowIdx) => (
            <div key={rowIdx} className="flex gap-1 justify-center w-full">
              {row.map((key) => {
                const state = keyStates[key] || "empty";
                const isWide = key === "ENTER" || key === "⌫";
                return (
                  <button key={key} onClick={() => handleKey(key)} className={`${isWide ? "px-3 md:px-4 text-xs" : "w-8 md:w-10"} h-12 md:h-14 rounded-md font-bold text-sm transition-colors ${keyColors[state]}`}>
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>

      {/* Result Dialog */}
      <Dialog open={showResultDialog} onOpenChange={setShowResultDialog}>
        <DialogContent className="sm:max-w-md bg-card border-border">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 font-display text-2xl">
              {won ? (
                <><PartyPopper className="h-7 w-7 text-success" /> ¡Correcto!</>
              ) : (
                <><Frown className="h-7 w-7 text-primary" /> ¡Casi!</>
              )}
            </DialogTitle>
            <DialogDescription className="sr-only">Game result</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="bg-muted/50 rounded-xl p-5 text-center">
              <p className="text-muted-foreground text-sm mb-1">The word was</p>
              <p className="font-display font-bold text-3xl text-foreground tracking-wider">{targetWord.word}</p>
              <p className="text-accent font-medium text-lg mt-1">"{targetWord.english}"</p>
            </div>

            {won && (
              <div className="flex justify-center gap-6 text-center">
                <div><div className="font-display font-bold text-xl text-foreground">{guesses.length}/{MAX_GUESSES}</div><div className="text-xs text-muted-foreground">Guesses</div></div>
                <div><div className="font-display font-bold text-xl text-secondary">{stats.streak}</div><div className="text-xs text-muted-foreground">Streak</div></div>
              </div>
            )}

            <button onClick={newGame} className="w-full py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg hover:opacity-90 transition-opacity glow-primary">
              Play Again
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
