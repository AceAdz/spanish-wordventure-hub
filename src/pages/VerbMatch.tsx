import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, RotateCcw, Trophy, CheckCircle, XCircle } from "lucide-react";
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

function getShuffledChallenges() {
  return shuffle([...VERB_CHALLENGES]);
}

export default function VerbMatch() {
  const [challenges] = useState(getShuffledChallenges);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [options, setOptions] = useState(() => generateOptions(challenges[0]));
  const [score, setScore] = useState(0);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [selected, setSelected] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [finished, setFinished] = useState(false);
  const [answered, setAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const { saveScore } = useGameScore();
  const savedRef = useRef(false);

  const current = challenges[currentIdx];

  const handleSelect = useCallback(
    (option: string) => {
      if (selected) return;
      setSelected(option);
      const correct = option === current.answer;
      setIsCorrect(correct);
      setAnswered((a) => a + 1);

      if (correct) {
        const newStreak = streak + 1;
        setScore((s) => s + 10 + streak * 2);
        setStreak(newStreak);
        setBestStreak((b) => Math.max(b, newStreak));
      } else {
        setStreak(0);
      }

      setTimeout(() => {
        if (currentIdx + 1 >= challenges.length) {
          setFinished(true);
        } else {
          const nextIdx = currentIdx + 1;
          setCurrentIdx(nextIdx);
          setOptions(generateOptions(challenges[nextIdx]));
          setSelected(null);
          setIsCorrect(null);
        }
      }, 1200);
    },
    [selected, current, streak, currentIdx, challenges]
  );

  const restart = () => {
    const newChallenges = getShuffledChallenges();
    // We can't setState on challenges since it's from useState initializer,
    // so we reload by remounting
    window.location.reload();
  };

  const progress = ((currentIdx + (selected ? 1 : 0)) / challenges.length) * 100;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link
            to="/"
            className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">
            🎯 Verb Match
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex flex-col items-center px-4 py-6 max-w-2xl mx-auto w-full">
        {!finished ? (
          <>
            {/* Progress & Stats */}
            <div className="w-full mb-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground">
                    {currentIdx + 1}/{challenges.length}
                  </span>
                  {streak > 1 && (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      className="text-sm font-bold text-accent"
                    >
                      🔥 {streak} streak
                    </motion.span>
                  )}
                </div>
                <span className="font-display font-bold text-xl text-foreground">
                  {score}
                </span>
              </div>
              <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.4 }}
                />
              </div>
            </div>

            {/* Question Card */}
            <AnimatePresence mode="wait">
              <motion.div
                key={currentIdx}
                initial={{ opacity: 0, x: 40 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -40 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <div className="bg-card border border-border rounded-2xl p-8 text-center mb-6">
                  <p className="text-muted-foreground text-sm mb-1">
                    Conjugate in the{" "}
                    <span className="text-accent font-bold">{current.tense}</span>{" "}
                    tense
                  </p>
                  <h2 className="font-display font-bold text-3xl text-foreground mb-2">
                    {current.infinitive}
                  </h2>
                  <p className="text-muted-foreground text-sm mb-4">
                    ({current.english})
                  </p>
                  <div className="inline-block px-4 py-1.5 bg-muted rounded-full">
                    <span className="font-display font-bold text-secondary text-lg">
                      {current.pronoun}
                    </span>
                  </div>
                </div>

                {/* Options */}
                <div className="grid grid-cols-2 gap-3">
                  {options.map((option) => {
                    let style =
                      "bg-card border-border hover:border-primary hover:bg-primary/5";
                    if (selected) {
                      if (option === current.answer) {
                        style =
                          "bg-success/15 border-success text-success ring-2 ring-success/30";
                      } else if (option === selected && !isCorrect) {
                        style =
                          "bg-destructive/15 border-destructive text-destructive ring-2 ring-destructive/30";
                      } else {
                        style = "bg-muted/50 border-border opacity-50";
                      }
                    }

                    return (
                      <button
                        key={option}
                        onClick={() => handleSelect(option)}
                        disabled={!!selected}
                        className={`border-2 rounded-xl px-4 py-4 font-display font-bold text-lg transition-all duration-200 ${style}`}
                      >
                        {option}
                      </button>
                    );
                  })}
                </div>

                {/* Feedback */}
                <AnimatePresence>
                  {selected && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex items-center justify-center gap-2 mt-4"
                    >
                      {isCorrect ? (
                        <>
                          <CheckCircle className="h-5 w-5 text-success" />
                          <span className="font-display font-bold text-success">
                            ¡Correcto!
                          </span>
                        </>
                      ) : (
                        <>
                          <XCircle className="h-5 w-5 text-destructive" />
                          <span className="font-display text-destructive">
                            It was{" "}
                            <span className="font-bold">{current.answer}</span>
                          </span>
                        </>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </AnimatePresence>
          </>
        ) : (
          /* Results Screen */
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex-1 flex flex-col items-center justify-center text-center"
          >
            <Trophy className="h-16 w-16 text-secondary mb-4" />
            <h2 className="font-display font-bold text-3xl text-foreground mb-2">
              ¡Terminado!
            </h2>
            <p className="text-muted-foreground mb-8">Quiz Complete</p>

            <div className="flex gap-8 mb-8">
              <div>
                <div className="font-display font-bold text-4xl text-foreground">
                  {score}
                </div>
                <div className="text-xs text-muted-foreground">Score</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-success">
                  {Math.round((score / (answered * 10)) * 100) || 0}%
                </div>
                <div className="text-xs text-muted-foreground">Accuracy</div>
              </div>
              <div>
                <div className="font-display font-bold text-4xl text-accent">
                  {bestStreak}
                </div>
                <div className="text-xs text-muted-foreground">Best Streak</div>
              </div>
            </div>

            <button
              onClick={restart}
              className="flex items-center gap-2 px-8 py-3 bg-primary text-primary-foreground rounded-xl font-display font-bold text-lg hover:opacity-90 transition-opacity glow-primary"
            >
              <RotateCcw className="h-5 w-5" />
              Play Again
            </button>
          </motion.div>
        )}
      </main>
    </div>
  );
}
