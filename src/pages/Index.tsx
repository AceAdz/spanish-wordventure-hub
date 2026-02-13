import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Zap, BookOpen, Trophy, Star } from "lucide-react";

const games = [
  {
    title: "Spanish Wordle",
    description: "Guess the 5-letter Spanish word in 5 tries. Test your vocabulary!",
    icon: BookOpen,
    path: "/wordle",
    gradient: "from-primary to-accent",
    emoji: "🇪🇸",
    stats: "56+ words",
  },
  {
    title: "Verb Runner",
    description: "Conjugate falling verbs before time runs out. How long can you survive?",
    icon: Zap,
    path: "/verb-runner",
    gradient: "from-secondary to-accent",
    emoji: "🏃",
    stats: "50+ verbs",
  },
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* GitHub Star Banner */}
      <div className="bg-[hsl(270,60%,50%)] px-4 py-2.5">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Star className="h-4 w-4 text-white fill-white" />
          <a
            href="https://github.com/AceAdz/spanish-wordventure-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-sm font-bold text-white hover:text-white/80 transition-colors"
          >
            Star us on GitHub
          </a>
          <Star className="h-4 w-4 text-white fill-white" />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border/50 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <Flame className="h-7 w-7 text-primary" />
            <span className="font-display font-bold text-xl text-foreground">
              Spanish Revision Hub
            </span>
          </Link>
          <div className="flex items-center gap-2 text-muted-foreground text-sm">
            <Trophy className="h-4 w-4" />
            <span>Learn & Play</span>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          <h1 className="font-display font-900 text-5xl md:text-7xl mb-4 text-gradient-primary">
            ¡Vamos a jugar!
          </h1>
          <p className="text-muted-foreground text-lg md:text-xl max-w-md mx-auto">
            Master Spanish vocabulary through fun, interactive games
          </p>
        </motion.div>

        {/* Game Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-3xl w-full">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 + i * 0.15 }}
            >
              <Link to={game.path}>
                <div className="group relative bg-card border border-border rounded-xl p-8 card-hover cursor-pointer overflow-hidden">
                  {/* Glow background */}
                  <div
                    className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`}
                  />

                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">{game.emoji}</span>
                      <span className="text-xs font-medium text-muted-foreground bg-muted px-3 py-1 rounded-full">
                        {game.stats}
                      </span>
                    </div>

                    <h2 className="font-display font-bold text-2xl text-foreground mb-2 group-hover:text-gradient-primary transition-colors">
                      {game.title}
                    </h2>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {game.description}
                    </p>

                    <div className="mt-6 flex items-center gap-2 text-primary font-medium text-sm">
                      <span>Play now</span>
                      <span className="group-hover:translate-x-1 transition-transform">→</span>
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
};

export default Index;
