import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, BookOpen, Star, X } from "lucide-react";
import { SPANISH_WORDS } from "@/data/spanishWords";

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

// Filter to only 5-letter words
const FIVE_LETTER_WORDS = SPANISH_WORDS.filter((w) => w.word.length === WORD_LENGTH);

function getRandomWord() {
  return FIVE_LETTER_WORDS[Math.floor(Math.random() * FIVE_LETTER_WORDS.length)];
}

function evaluateGuess(guess: string, answer: string): LetterState[] {
  const result: LetterState[] = Array(WORD_LENGTH).fill("absent");
  const answerArr = answer.split("");
  const guessArr = guess.split("");
  const used = Array(WORD_LENGTH).fill(false);

  // First pass: correct positions
  for (let i = 0; i < WORD_LENGTH; i++) {
    if (guessArr[i] === answerArr[i]) {
      result[i] = "correct";
      used[i] = true;
    }
  }

  // Second pass: present but wrong position
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
  empty: "border-border bg-transparent",
  tbd: "border-foreground/30 bg-transparent text-foreground",
};

const keyColors: Record<LetterState, string> = {
  correct: "bg-success text-success-foreground",
  present: "bg-warning text-warning-foreground",
  absent: "bg-muted/80 text-muted-foreground",
  empty: "bg-card text-foreground border border-border hover:bg-muted",
  tbd: "bg-card text-foreground border border-border hover:bg-muted",
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

    // Update key states
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
      } else if (newGuesses.length >= MAX_GUESSES) {
        setGameOver(true);
        setStats((s) => ({ ...s, streak: 0, played: s.played + 1 }));
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
    const handler = (e: KeyboardEvent) => {
      handleKey(e.key.toUpperCase());
    };
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
  };

  // Build display grid
  const displayRows: TileData[][] = [];
  for (let i = 0; i < MAX_GUESSES; i++) {
    if (i < guesses.length) {
      displayRows.push(guesses[i]);
    } else if (i === guesses.length) {
      // Current row
      const row: TileData[] = [];
      for (let j = 0; j < WORD_LENGTH; j++) {
        row.push({
          letter: currentGuess[j] || "",
          state: currentGuess[j] ? "tbd" : "empty",
        });
      }
      displayRows.push(row);
    } else {
      displayRows.push(
        Array(WORD_LENGTH)
          .fill(null)
          .map(() => ({ letter: "", state: "empty" as LetterState }))
      );
    }
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* GitHub Star Banner */}
      <div className="bg-primary/10 border-b border-primary/20 px-4 py-2">
        <div className="max-w-lg mx-auto flex items-center justify-center gap-2">
          <Star className="h-4 w-4 text-primary" />
          <a
            href="https://github.com/AceAdz/spanish-wordventure-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-medium text-primary hover:text-primary/80 transition-colors"
          >
            ⭐ Star us on GitHub
          </a>
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border/50 px-4 py-3">
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
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="overflow-hidden border-b border-border/50"
          >
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
          <div>
            <div className="font-display font-bold text-2xl text-foreground">{stats.streak}</div>
            <div className="text-xs text-muted-foreground">Streak</div>
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-foreground">
              {stats.played > 0 ? Math.round((stats.wins / stats.played) * 100) : 0}%
            </div>
            <div className="text-xs text-muted-foreground">Win Rate</div>
          </div>
          <div>
            <div className="font-display font-bold text-2xl text-foreground">{stats.played}</div>
            <div className="text-xs text-muted-foreground">Played</div>
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
                const delay = isRevealing ? colIdx * 0.3 : 0;
                const hasLetter = tile.letter !== "";

                return (
                  <motion.div
                    key={colIdx}
                    animate={
                      hasLetter && tile.state === "tbd"
                        ? { scale: [1, 1.08, 1] }
                        : {}
                    }
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

        {/* Game over message */}
        <AnimatePresence>
          {gameOver && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center mb-4"
            >
              {won ? (
                <div className="text-success font-display font-bold text-xl">
                  🎉 ¡Correcto! — "{targetWord.word}" means "{targetWord.english}"
                </div>
              ) : (
                <div className="text-primary font-display font-bold text-xl">
                  The word was: <span className="text-foreground">{targetWord.word}</span>{" "}
                  <span className="text-muted-foreground font-normal text-base">({targetWord.english})</span>
                </div>
              )}
              <button
                onClick={newGame}
                className="mt-3 px-6 py-2 bg-primary text-primary-foreground rounded-lg font-medium hover:opacity-90 transition-opacity"
              >
                Play Again
              </button>
            </motion.div>
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
                  <button
                    key={key}
                    onClick={() => handleKey(key)}
                    className={`${isWide ? "px-3 md:px-4 text-xs" : "w-8 md:w-10"} h-12 md:h-14 rounded-md font-bold text-sm transition-colors ${keyColors[state]}`}
                  >
                    {key}
                  </button>
                );
              })}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
