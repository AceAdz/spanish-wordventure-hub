import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Zap, BookOpen, Trophy, Star, User, LogIn, Crown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";

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
    title: "Verb Match",
    description: "Pick the correct conjugation from four choices. Test your verb knowledge!",
    icon: Zap,
    path: "/verb-match",
    gradient: "from-secondary to-accent",
    emoji: "🎯",
    stats: "50+ verbs",
  },
  {
    title: "Verb Fishing",
    description: "Cast your line and catch the right conjugation! A fun fishing twist on verbs.",
    icon: Zap,
    path: "/verb-fishing",
    gradient: "from-accent to-primary",
    emoji: "🐟",
    stats: "50+ verbs",
  },
];

const Index = () => {
  const { user } = useAuth();

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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-muted-foreground text-sm hover:text-foreground transition-colors">
                <span>made by </span>
                <span className="text-primary font-bold">@aceadxm</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="center" className="min-w-[160px]">
              <DropdownMenuItem asChild>
                <a href="https://www.tiktok.com/@aceadxm" target="_blank" rel="noopener noreferrer" className="cursor-pointer">TikTok</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="https://www.instagram.com/adxm.fr" target="_blank" rel="noopener noreferrer" className="cursor-pointer">Instagram</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="https://x.com/AceAdz_" target="_blank" rel="noopener noreferrer" className="cursor-pointer">X (Twitter)</a>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <a href="https://github.com/AceAdz" target="_blank" rel="noopener noreferrer" className="cursor-pointer">GitHub</a>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <div className="flex items-center gap-3">
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 text-muted-foreground hover:text-secondary transition-colors text-sm font-medium"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors text-sm font-medium"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-4 py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-bold hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-4 w-4" />
                Sign Up
              </Link>
            )}
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

        {/* Leaderboard CTA */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="mt-12"
        >
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 px-6 py-3 bg-card border border-border rounded-xl text-muted-foreground hover:text-secondary hover:border-secondary/50 transition-all font-display font-bold"
          >
            <Trophy className="h-5 w-5" />
            View Leaderboard
          </Link>
        </motion.div>

        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.8 }}
            className="mt-4 text-sm text-muted-foreground"
          >
            <Link to="/auth" className="text-primary hover:underline font-medium">
              Sign up
            </Link>{" "}
            to track your progress and earn badges!
          </motion.p>
        )}
      </main>
    </div>
  );
};

export default Index;
