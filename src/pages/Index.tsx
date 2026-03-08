import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Trophy, Star, User, LogIn, Crown, GraduationCap, Fish, Zap, BookOpen, Sparkles, ArrowRight } from "lucide-react";
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
    description: "Guess the 5-letter Spanish word in 5 tries",
    path: "/wordle",
    emoji: "🇪🇸",
    stats: "56+ words",
    color: "from-primary to-accent",
    iconColor: "text-primary",
  },
  {
    title: "Verb Match",
    description: "Pick the correct conjugation. 5 levels of difficulty!",
    path: "/verb-match",
    emoji: "🎯",
    stats: "120+ verbs",
    color: "from-secondary to-accent",
    iconColor: "text-secondary",
  },
  {
    title: "Verb Fishing",
    description: "Cast your line and catch conjugations. Collect rare fish!",
    path: "/verb-fishing",
    emoji: "🎣",
    stats: "22 fish species",
    color: "from-accent to-primary",
    iconColor: "text-accent",
  },
  {
    title: "Palabra Surge",
    description: "Words rise from the deep — type translations before they escape! Power-ups & combos.",
    path: "/palabra-surge",
    emoji: "⚡",
    stats: "Survival mode",
    color: "from-primary to-secondary",
    iconColor: "text-primary",
  },
  {
    title: "Duelo de Palabras",
    description: "Lightning-fast reaction game! Smash the correct translation before time runs out.",
    path: "/duelo",
    emoji: "⚔️",
    stats: "Speed duel",
    color: "from-secondary to-accent",
    iconColor: "text-secondary",
  },
  {
    title: "Memoria Mágica",
    description: "Flip cards to match Spanish-English pairs. Memorize, match, combo!",
    path: "/memoria",
    emoji: "🃏",
    stats: "3 difficulties",
    color: "from-accent to-secondary",
    iconColor: "text-accent",
  },
];

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Background effects */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/4 via-transparent to-accent/4" />
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-accent/5 rounded-full blur-3xl" />
      </div>

      {/* GitHub Star Banner */}
      <div className="bg-gradient-to-r from-[hsl(270,60%,45%)] to-[hsl(300,50%,45%)] px-4 py-2 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Star className="h-3.5 w-3.5 text-white fill-white" />
          <a
            href="https://github.com/AceAdz/spanish-wordventure-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-bold text-white hover:text-white/80 transition-colors"
          >
            Star us on GitHub
          </a>
          <Star className="h-3.5 w-3.5 text-white fill-white" />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border/20 px-6 py-3.5 relative z-10 backdrop-blur-sm bg-background/80">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2.5">
            <div className="relative">
              <Flame className="h-7 w-7 text-primary" />
              <div className="absolute inset-0 bg-primary/20 blur-lg rounded-full" />
            </div>
            <span className="font-display font-black text-xl text-foreground">
              Jugar
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors">
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

          <div className="flex items-center gap-2">
            <Link
              to="/classroom"
              className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-all text-sm font-medium"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Classroom</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all text-sm font-medium"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-3 py-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all text-sm font-medium"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-sm font-display font-bold hover:opacity-90 transition-opacity"
              >
                <LogIn className="h-4 w-4" />
                Sign Up
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-6 py-12 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full mb-5"
          >
            <Sparkles className="h-3.5 w-3.5 text-secondary" />
            <span className="text-xs font-bold text-secondary">120+ verb challenges</span>
          </motion.div>
          
          <h1 className="font-display font-black text-6xl md:text-8xl mb-4 leading-[0.9]">
            <span className="text-gradient-primary">¡Vamos</span>
            <br />
            <span className="text-foreground">a jugar!</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg max-w-sm mx-auto mt-4">
            Master Spanish through games. Track scores, earn badges, compete with friends.
          </p>
        </motion.div>

        {/* Game Cards - 3 column */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl w-full mb-10">
          {games.map((game, i) => (
            <motion.div
              key={game.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.3 + i * 0.12 }}
            >
              <Link to={game.path}>
                <div className="group relative bg-card/70 backdrop-blur-sm border border-border/40 rounded-2xl p-6 cursor-pointer overflow-hidden transition-all duration-300 hover:scale-[1.03] hover:-translate-y-1 hover:border-border/80 h-full">
                  <div className={`absolute inset-0 bg-gradient-to-br ${game.color} opacity-0 group-hover:opacity-[0.08] transition-opacity duration-500`} />
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-4">
                      <span className="text-4xl">{game.emoji}</span>
                      <span className="text-[10px] font-bold text-muted-foreground bg-muted/50 px-2.5 py-1 rounded-full">
                        {game.stats}
                      </span>
                    </div>
                    <h2 className="font-display font-black text-xl text-foreground mb-1.5">
                      {game.title}
                    </h2>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                      {game.description}
                    </p>
                    <div className="flex items-center gap-1.5 text-primary font-display font-bold text-sm">
                      <span>Play</span>
                      <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </div>

        {/* Bottom actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-3"
        >
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 px-5 py-2.5 bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl text-muted-foreground hover:text-secondary hover:border-secondary/40 transition-all font-display font-bold text-sm"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link
            to="/classroom"
            className="flex items-center gap-2 px-5 py-2.5 bg-card/60 backdrop-blur-sm border border-border/40 rounded-xl text-muted-foreground hover:text-accent hover:border-accent/40 transition-all font-display font-bold text-sm"
          >
            <GraduationCap className="h-4 w-4" />
            Create Class
          </Link>
        </motion.div>

        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.9 }}
            className="mt-6 text-sm text-muted-foreground"
          >
            <Link to="/auth" className="text-primary hover:underline font-medium">
              Sign up
            </Link>{" "}
            to track your progress, earn badges & join classes!
          </motion.p>
        )}
      </main>
    </div>
  );
};

export default Index;
