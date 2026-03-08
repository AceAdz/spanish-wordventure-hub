import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Trophy, Star, User, LogIn, Crown, GraduationCap, ArrowRight, Sparkles, Zap, Gamepad2 } from "lucide-react";
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
    gradient: "from-[hsl(0,78%,55%)] to-[hsl(25,95%,55%)]",
    glow: "shadow-[0_0_40px_-8px_hsl(0,78%,55%,0.4)]",
    border: "border-[hsl(0,78%,55%,0.3)]",
    badge: "bg-[hsl(0,78%,55%,0.15)] text-primary",
  },
  {
    title: "Verb Match",
    description: "Pick the correct conjugation across 5 difficulty levels",
    path: "/verb-match",
    emoji: "🎯",
    stats: "120+ verbs",
    gradient: "from-[hsl(40,90%,55%)] to-[hsl(25,95%,55%)]",
    glow: "shadow-[0_0_40px_-8px_hsl(40,90%,55%,0.4)]",
    border: "border-[hsl(40,90%,55%,0.3)]",
    badge: "bg-[hsl(40,90%,55%,0.15)] text-secondary",
  },
  {
    title: "Verb Fishing",
    description: "Cast your line and catch conjugations. Collect rare fish!",
    path: "/verb-fishing",
    emoji: "🎣",
    stats: "22 species",
    gradient: "from-[hsl(25,95%,55%)] to-[hsl(0,78%,55%)]",
    glow: "shadow-[0_0_40px_-8px_hsl(25,95%,55%,0.4)]",
    border: "border-[hsl(25,95%,55%,0.3)]",
    badge: "bg-[hsl(25,95%,55%,0.15)] text-accent",
  },
  {
    title: "Palabra Surge",
    description: "Words rise from below — type translations before they escape!",
    path: "/palabra-surge",
    emoji: "⚡",
    stats: "Survival",
    gradient: "from-[hsl(0,78%,55%)] to-[hsl(40,90%,55%)]",
    glow: "shadow-[0_0_40px_-8px_hsl(0,78%,55%,0.3)]",
    border: "border-[hsl(0,78%,55%,0.25)]",
    badge: "bg-[hsl(0,78%,55%,0.15)] text-primary",
  },
  {
    title: "Duelo de Palabras",
    description: "Lightning reaction! Smash the correct translation fast.",
    path: "/duelo",
    emoji: "⚔️",
    stats: "Speed duel",
    gradient: "from-[hsl(40,90%,55%)] to-[hsl(0,78%,55%)]",
    glow: "shadow-[0_0_40px_-8px_hsl(40,90%,55%,0.3)]",
    border: "border-[hsl(40,90%,55%,0.25)]",
    badge: "bg-[hsl(40,90%,55%,0.15)] text-secondary",
  },
  {
    title: "Memoria Mágica",
    description: "Flip cards to match Spanish-English pairs. Combo chain!",
    path: "/memoria",
    emoji: "🃏",
    stats: "3 modes",
    gradient: "from-[hsl(25,95%,55%)] to-[hsl(40,90%,55%)]",
    glow: "shadow-[0_0_40px_-8px_hsl(25,95%,55%,0.3)]",
    border: "border-[hsl(25,95%,55%,0.25)]",
    badge: "bg-[hsl(25,95%,55%,0.15)] text-accent",
  },
];

const FloatingOrb = ({ delay, size, x, color }: { delay: number; size: number; x: string; color: string }) => (
  <motion.div
    className="absolute rounded-full pointer-events-none blur-2xl"
    style={{ width: size, height: size, left: x, background: color }}
    animate={{ y: [600, -200], opacity: [0, 0.4, 0] }}
    transition={{ duration: 10 + delay * 2, repeat: Infinity, delay, ease: "linear" }}
  />
);

const Index = () => {
  const { user } = useAuth();

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        {/* Base gradient */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(0,78%,55%,0.08)_0%,transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(40,90%,55%,0.06)_0%,transparent_60%)]" />
        
        {/* Grid pattern overlay */}
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
            backgroundSize: "60px 60px",
          }}
        />

        {/* Floating orbs */}
        <FloatingOrb delay={0} size={120} x="10%" color="hsl(0,78%,55%,0.08)" />
        <FloatingOrb delay={3} size={80} x="60%" color="hsl(40,90%,55%,0.06)" />
        <FloatingOrb delay={6} size={100} x="80%" color="hsl(25,95%,55%,0.07)" />
        <FloatingOrb delay={2} size={60} x="35%" color="hsl(0,78%,55%,0.05)" />
        <FloatingOrb delay={5} size={90} x="90%" color="hsl(40,90%,55%,0.05)" />
      </div>

      {/* Top banner */}
      <div className="bg-gradient-to-r from-primary/90 to-accent/90 px-4 py-2 relative z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
          <a
            href="https://github.com/AceAdz/spanish-wordventure-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[11px] font-bold text-primary-foreground hover:text-primary-foreground/80 transition-colors"
          >
            Star us on GitHub
          </a>
          <Star className="h-3 w-3 text-primary-foreground fill-primary-foreground" />
        </div>
      </div>

      {/* Header */}
      <header className="border-b border-border/15 px-4 sm:px-6 py-3 relative z-10 backdrop-blur-xl bg-background/60">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <div className="relative">
              <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              <div className="absolute inset-0 bg-primary/25 blur-lg rounded-full" />
            </div>
            <span className="font-display font-black text-lg sm:text-xl text-foreground">
              Jugar
            </span>
          </Link>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="hidden sm:flex items-center gap-1 text-muted-foreground text-xs hover:text-foreground transition-colors">
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

          <div className="flex items-center gap-1.5 sm:gap-2">
            <Link
              to="/classroom"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-all text-xs sm:text-sm font-medium"
            >
              <GraduationCap className="h-4 w-4" />
              <span className="hidden sm:inline">Classroom</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all text-xs sm:text-sm font-medium"
            >
              <Crown className="h-4 w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-1.5 px-2.5 py-1.5 sm:px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all text-xs sm:text-sm font-medium"
              >
                <User className="h-4 w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-2 sm:px-4 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-xs sm:text-sm font-display font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <LogIn className="h-3.5 w-3.5" />
                <span>Sign Up</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-12 pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 sm:mb-10"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-secondary/10 border border-secondary/20 rounded-full mb-4 sm:mb-5"
          >
            <Gamepad2 className="h-3.5 w-3.5 text-secondary" />
            <span className="text-[11px] sm:text-xs font-bold text-secondary">6 game modes • 120+ challenges</span>
          </motion.div>

          <h1 className="font-display font-black text-5xl sm:text-6xl md:text-8xl mb-3 sm:mb-4 leading-[0.9]">
            <span className="text-gradient-primary">¡Vamos</span>
            <br />
            <span className="text-foreground">a jugar!</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-sm mx-auto mt-3 sm:mt-4 leading-relaxed">
            Master Spanish through games. Track scores, earn badges, compete with friends.
          </p>
        </motion.div>

        {/* Game Cards */}
        <div className="w-full max-w-6xl">
          {/* Mobile: scrollable horizontal cards + stacked list */}
          {/* Desktop: 3x2 grid */}
          <div className="hidden sm:grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {games.map((game, i) => (
              <motion.div
                key={game.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 + i * 0.08 }}
              >
                <Link to={game.path}>
                  <div
                    className={`group relative bg-card/50 backdrop-blur-sm border ${game.border} rounded-2xl p-5 lg:p-6 cursor-pointer overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1.5 hover:${game.glow} h-full`}
                  >
                    <div
                      className={`absolute inset-0 bg-gradient-to-br ${game.gradient} opacity-0 group-hover:opacity-[0.06] transition-opacity duration-500`}
                    />
                    {/* Top shimmer line */}
                    <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent group-hover:via-foreground/20 transition-all" />

                    <div className="relative z-10">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-3xl lg:text-4xl">{game.emoji}</span>
                        <span className={`text-[10px] font-bold ${game.badge} px-2.5 py-1 rounded-full`}>
                          {game.stats}
                        </span>
                      </div>
                      <h2 className="font-display font-black text-lg lg:text-xl text-foreground mb-1">
                        {game.title}
                      </h2>
                      <p className="text-muted-foreground text-xs leading-relaxed mb-3 line-clamp-2">
                        {game.description}
                      </p>
                      <div className="flex items-center gap-1.5 text-primary font-display font-bold text-sm">
                        <span>Play</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
                      </div>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </div>

          {/* Mobile layout: Featured card + compact list */}
          <div className="sm:hidden space-y-3">
            {/* Featured first game - big card */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
            >
              <Link to={games[0].path}>
                <div
                  className={`relative bg-gradient-to-br ${games[0].gradient} rounded-2xl p-5 overflow-hidden ${games[0].glow}`}
                >
                  <div className="absolute inset-0 bg-background/60 backdrop-blur-sm" />
                  <div className="absolute top-0 right-0 text-[80px] leading-none opacity-20 -mt-2 -mr-2">
                    {games[0].emoji}
                  </div>
                  <div className="relative z-10">
                    <span className={`text-[10px] font-bold ${games[0].badge} px-2.5 py-1 rounded-full`}>
                      {games[0].stats}
                    </span>
                    <h2 className="font-display font-black text-2xl text-foreground mt-3 mb-1">
                      {games[0].title}
                    </h2>
                    <p className="text-muted-foreground text-xs leading-relaxed mb-4">
                      {games[0].description}
                    </p>
                    <div className="flex items-center gap-2 text-primary font-display font-bold text-sm">
                      <span>Play Now</span>
                      <ArrowRight className="h-4 w-4" />
                    </div>
                  </div>
                </div>
              </Link>
            </motion.div>

            {/* Rest as compact horizontal cards */}
            <div className="grid grid-cols-2 gap-2.5">
              {games.slice(1).map((game, i) => (
                <motion.div
                  key={game.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: 0.3 + i * 0.06 }}
                >
                  <Link to={game.path}>
                    <div
                      className={`relative bg-card/60 backdrop-blur-sm border ${game.border} rounded-xl p-3.5 overflow-hidden transition-all duration-300 active:scale-[0.97] h-full`}
                    >
                      <div className="relative z-10">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-2xl">{game.emoji}</span>
                          <span className={`text-[8px] font-bold ${game.badge} px-2 py-0.5 rounded-full`}>
                            {game.stats}
                          </span>
                        </div>
                        <h3 className="font-display font-black text-sm text-foreground mb-0.5 leading-tight">
                          {game.title}
                        </h3>
                        <p className="text-muted-foreground text-[10px] leading-snug line-clamp-2 mb-2">
                          {game.description}
                        </p>
                        <div className="flex items-center gap-1 text-primary font-display font-bold text-[11px]">
                          <span>Play</span>
                          <ArrowRight className="h-3 w-3" />
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-8 sm:mt-10"
        >
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl text-muted-foreground hover:text-secondary hover:border-secondary/30 transition-all font-display font-bold text-xs sm:text-sm"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link
            to="/classroom"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-card/50 backdrop-blur-sm border border-border/30 rounded-xl text-muted-foreground hover:text-accent hover:border-accent/30 transition-all font-display font-bold text-xs sm:text-sm"
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
            className="mt-5 sm:mt-6 text-xs sm:text-sm text-muted-foreground text-center"
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
