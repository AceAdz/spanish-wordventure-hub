import { motion, useMotionValue, useTransform, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Trophy, Star, User, LogIn, Crown, GraduationCap, ArrowRight, Gamepad2, Zap, Swords, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useRef } from "react";

const games = [
  {
    title: "Spanish Wordle",
    description: "Guess the 5-letter Spanish word in 5 tries",
    path: "/wordle",
    emoji: "🇪🇸",
    stats: "56+ words",
    color: "primary" as const,
    icon: Gamepad2,
  },
  {
    title: "Verb Match",
    description: "Pick the correct conjugation across 5 difficulty levels",
    path: "/verb-match",
    emoji: "🎯",
    stats: "120+ verbs",
    color: "secondary" as const,
    icon: Layers,
  },
  {
    title: "Verb Fishing",
    description: "Cast your line and catch conjugations. Collect rare fish!",
    path: "/verb-fishing",
    emoji: "🎣",
    stats: "22 species",
    color: "accent" as const,
    icon: Gamepad2,
  },
  {
    title: "Palabra Surge",
    description: "Words rise from below — type translations before they escape!",
    path: "/palabra-surge",
    emoji: "⚡",
    stats: "Survival",
    color: "primary" as const,
    icon: Zap,
  },
  {
    title: "Duelo de Palabras",
    description: "Lightning reaction! Smash the correct translation fast.",
    path: "/duelo",
    emoji: "⚔️",
    stats: "Speed duel",
    color: "secondary" as const,
    icon: Swords,
  },
  {
    title: "Memoria Mágica",
    description: "Flip cards to match Spanish-English pairs. Combo chain!",
    path: "/memoria",
    emoji: "🃏",
    stats: "3 modes",
    color: "accent" as const,
    icon: Layers,
  },
];

const colorMap = {
  primary: {
    gradient: "from-primary/20 to-primary/5",
    border: "border-primary/20 hover:border-primary/50",
    glow: "hover:shadow-[0_0_50px_-12px_hsl(var(--primary)/0.5)]",
    badge: "bg-primary/15 text-primary",
    accent: "text-primary",
    ring: "group-hover:ring-primary/30",
    dot: "bg-primary",
  },
  secondary: {
    gradient: "from-secondary/20 to-secondary/5",
    border: "border-secondary/20 hover:border-secondary/50",
    glow: "hover:shadow-[0_0_50px_-12px_hsl(var(--secondary)/0.5)]",
    badge: "bg-secondary/15 text-secondary",
    accent: "text-secondary",
    ring: "group-hover:ring-secondary/30",
    dot: "bg-secondary",
  },
  accent: {
    gradient: "from-accent/20 to-accent/5",
    border: "border-accent/20 hover:border-accent/50",
    glow: "hover:shadow-[0_0_50px_-12px_hsl(var(--accent)/0.5)]",
    badge: "bg-accent/15 text-accent",
    accent: "text-accent",
    ring: "group-hover:ring-accent/30",
    dot: "bg-accent",
  },
};

// Animated counter
const AnimatedNumber = ({ value, duration = 2 }: { value: number; duration?: number }) => {
  const [display, setDisplay] = useState(0);
  useEffect(() => {
    let start = 0;
    const step = value / (duration * 60);
    const id = setInterval(() => {
      start += step;
      if (start >= value) { setDisplay(value); clearInterval(id); }
      else setDisplay(Math.floor(start));
    }, 1000 / 60);
    return () => clearInterval(id);
  }, [value, duration]);
  return <span>{display}</span>;
};

// Particle system
const Particles = () => {
  const particles = Array.from({ length: 30 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    y: Math.random() * 100,
    size: Math.random() * 3 + 1,
    duration: Math.random() * 20 + 10,
    delay: Math.random() * 10,
  }));

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-primary/20"
          style={{ width: p.size, height: p.size, left: `${p.x}%`, top: `${p.y}%` }}
          animate={{
            y: [-20, 20, -20],
            x: [-10, 10, -10],
            opacity: [0.2, 0.6, 0.2],
          }}
          transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: "easeInOut" }}
        />
      ))}
    </div>
  );
};

const GameCard = ({ game, index, featured = false }: { game: typeof games[0]; index: number; featured?: boolean }) => {
  const colors = colorMap[game.color];
  const [isHovered, setIsHovered] = useState(false);

  if (featured) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 40, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, delay: 0.2, type: "spring", stiffness: 100 }}
        onHoverStart={() => setIsHovered(true)}
        onHoverEnd={() => setIsHovered(false)}
      >
        <Link to={game.path} className="block">
          <div className={`group relative bg-card/60 backdrop-blur-xl border ${colors.border} rounded-3xl p-6 sm:p-8 overflow-hidden transition-all duration-500 ${colors.glow} ring-1 ring-transparent ${colors.ring}`}>
            {/* Animated gradient bg */}
            <motion.div
              className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-50`}
              animate={{ opacity: isHovered ? 0.8 : 0.5 }}
            />
            {/* Scan line effect */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-b from-transparent via-foreground/[0.02] to-transparent"
              animate={{ y: ["-100%", "200%"] }}
              transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
            />
            {/* Corner accents */}
            <div className={`absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 ${colors.border} rounded-tl-3xl opacity-50`} />
            <div className={`absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 ${colors.border} rounded-br-3xl opacity-50`} />
            
            {/* Floating emoji */}
            <motion.div
              className="absolute top-4 right-4 sm:top-6 sm:right-6 text-6xl sm:text-8xl opacity-10"
              animate={{ rotate: [0, 5, -5, 0], y: [0, -5, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
            >
              {game.emoji}
            </motion.div>

            <div className="relative z-10">
              <div className="flex items-center gap-3 mb-4">
                <motion.span
                  className="text-4xl sm:text-5xl"
                  animate={isHovered ? { scale: [1, 1.2, 1], rotate: [0, 10, -10, 0] } : {}}
                  transition={{ duration: 0.5 }}
                >
                  {game.emoji}
                </motion.span>
                <span className={`text-[10px] font-bold ${colors.badge} px-3 py-1 rounded-full uppercase tracking-wider`}>
                  {game.stats}
                </span>
                <span className="text-[10px] font-bold bg-foreground/10 text-foreground/60 px-3 py-1 rounded-full uppercase tracking-wider">
                  Featured
                </span>
              </div>
              <h2 className="font-display font-black text-2xl sm:text-4xl text-foreground mb-2">
                {game.title}
              </h2>
              <p className="text-muted-foreground text-sm sm:text-base leading-relaxed mb-5 max-w-md">
                {game.description}
              </p>
              <motion.div
                className={`inline-flex items-center gap-2 ${colors.accent} font-display font-bold text-base sm:text-lg`}
                whileHover={{ x: 5 }}
              >
                <span>Play Now</span>
                <motion.div animate={isHovered ? { x: [0, 5, 0] } : {}} transition={{ duration: 0.8, repeat: Infinity }}>
                  <ArrowRight className="h-5 w-5" />
                </motion.div>
              </motion.div>
            </div>
          </div>
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.15 + index * 0.08, type: "spring", stiffness: 120 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Link to={game.path} className="block h-full">
        <div className={`group relative bg-card/40 backdrop-blur-sm border ${colors.border} rounded-2xl p-4 sm:p-5 overflow-hidden transition-all duration-500 hover:scale-[1.04] hover:-translate-y-2 ${colors.glow} h-full ring-1 ring-transparent ${colors.ring}`}>
          {/* Subtle gradient */}
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-0 group-hover:opacity-60 transition-opacity duration-500`} />
          {/* Top shimmer */}
          <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-foreground/10 to-transparent group-hover:via-foreground/25 transition-all" />
          {/* Animated dot */}
          <motion.div
            className={`absolute top-3 right-3 w-2 h-2 rounded-full ${colors.dot}`}
            animate={{ opacity: [0.3, 1, 0.3], scale: [0.8, 1.2, 0.8] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-3">
              <motion.span
                className="text-3xl lg:text-4xl"
                animate={isHovered ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {game.emoji}
              </motion.span>
              <span className={`text-[10px] font-bold ${colors.badge} px-2.5 py-1 rounded-full uppercase tracking-wider`}>
                {game.stats}
              </span>
            </div>
            <h2 className="font-display font-black text-base lg:text-lg text-foreground mb-1">
              {game.title}
            </h2>
            <p className="text-muted-foreground text-[11px] sm:text-xs leading-relaxed mb-3 line-clamp-2">
              {game.description}
            </p>
            <div className={`flex items-center gap-1.5 ${colors.accent} font-display font-bold text-sm`}>
              <span>Play</span>
              <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

// Mobile compact card
const MobileGameCard = ({ game, index }: { game: typeof games[0]; index: number }) => {
  const colors = colorMap[game.color];
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.4, delay: 0.25 + index * 0.06, type: "spring" }}
    >
      <Link to={game.path} className="block h-full">
        <div className={`group relative bg-card/50 backdrop-blur-sm border ${colors.border} rounded-xl p-3.5 overflow-hidden transition-all duration-300 active:scale-[0.96] h-full`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${colors.gradient} opacity-30`} />
          <motion.div
            className={`absolute top-2 right-2 w-1.5 h-1.5 rounded-full ${colors.dot}`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.2 }}
          />
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2">
              <span className="text-2xl">{game.emoji}</span>
              <span className={`text-[8px] font-bold ${colors.badge} px-2 py-0.5 rounded-full uppercase tracking-wider`}>
                {game.stats}
              </span>
            </div>
            <h3 className="font-display font-black text-[13px] text-foreground mb-0.5 leading-tight">
              {game.title}
            </h3>
            <p className="text-muted-foreground text-[10px] leading-snug line-clamp-2 mb-2">
              {game.description}
            </p>
            <div className={`flex items-center gap-1 ${colors.accent} font-display font-bold text-[11px]`}>
              <span>Play</span>
              <ArrowRight className="h-3 w-3" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

const Index = () => {
  const { user } = useAuth();
  const [heroText, setHeroText] = useState("");
  const fullText = "¡Vamos a jugar!";

  // Typewriter effect
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setHeroText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(id);
    }, 70);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <Particles />

      {/* Radial glows */}
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_50%_at_50%_-10%,hsl(var(--primary)/0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_40%_at_80%_80%,hsl(var(--accent)/0.08),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_40%_30%_at_10%_70%,hsl(var(--secondary)/0.06),transparent)]" />
        {/* Noise overlay */}
        <div className="absolute inset-0 opacity-[0.015]" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }} />
      </div>

      {/* Top banner */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        className="bg-gradient-to-r from-primary/90 via-accent/90 to-secondary/90 px-4 py-2 relative z-10"
      >
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
      </motion.div>

      {/* Header */}
      <header className="border-b border-border/10 px-4 sm:px-6 py-3 relative z-10 backdrop-blur-2xl bg-background/40">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <motion.div animate={{ rotate: [0, 5, -5, 0] }} transition={{ duration: 4, repeat: Infinity }}>
                <Flame className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
              </motion.div>
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full group-hover:bg-primary/50 transition-colors" />
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
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-8 sm:pt-14 pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.7 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-4 py-1.5 bg-card/60 border border-border/20 rounded-full mb-5 sm:mb-6 backdrop-blur-sm"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
            >
              <Gamepad2 className="h-3.5 w-3.5 text-secondary" />
            </motion.div>
            <span className="text-[11px] sm:text-xs font-bold text-muted-foreground">
              <span className="text-secondary"><AnimatedNumber value={6} duration={1} /></span> game modes •{" "}
              <span className="text-primary"><AnimatedNumber value={120} duration={1.5} /></span>+ challenges
            </span>
          </motion.div>

          <h1 className="font-display font-black text-5xl sm:text-7xl md:text-[5.5rem] mb-3 sm:mb-4 leading-[0.9] relative">
            <span className="text-gradient-primary">{heroText.split(" ").slice(0, 1).join(" ")}</span>
            {heroText.length > 6 && (
              <>
                <br />
                <span className="text-foreground">{heroText.split(" ").slice(1).join(" ")}</span>
              </>
            )}
            <motion.span
              className="inline-block w-[3px] h-[0.8em] bg-primary ml-1 align-middle"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.6, repeat: Infinity }}
            />
          </h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-muted-foreground text-sm sm:text-base md:text-lg max-w-md mx-auto mt-3 sm:mt-4 leading-relaxed"
          >
            Master Spanish through <span className="text-primary font-semibold">addictive games</span>. Track scores, earn badges, compete with friends.
          </motion.p>
        </motion.div>

        {/* Game Cards — Desktop */}
        <div className="w-full max-w-6xl">
          <div className="hidden sm:block space-y-4">
            {/* Featured card */}
            <GameCard game={games[0]} index={0} featured />
            {/* Grid of remaining */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
              {games.slice(1).map((game, i) => (
                <GameCard key={game.title} game={game} index={i + 1} />
              ))}
            </div>
          </div>

          {/* Mobile layout */}
          <div className="sm:hidden space-y-3">
            <GameCard game={games[0]} index={0} featured />
            <div className="grid grid-cols-2 gap-2.5">
              {games.slice(1).map((game, i) => (
                <MobileGameCard key={game.title} game={game} index={i} />
              ))}
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex items-center gap-6 sm:gap-10 mt-8 sm:mt-12 px-6 py-3 bg-card/30 backdrop-blur-sm border border-border/10 rounded-2xl"
        >
          {[
            { label: "Games", value: "6", color: "text-primary" },
            { label: "Words", value: "200+", color: "text-secondary" },
            { label: "Players", value: "∞", color: "text-accent" },
          ].map((stat) => (
            <div key={stat.label} className="text-center">
              <div className={`font-display font-black text-lg sm:text-xl ${stat.color}`}>{stat.value}</div>
              <div className="text-[10px] sm:text-xs text-muted-foreground font-medium">{stat.label}</div>
            </div>
          ))}
        </motion.div>

        {/* Bottom actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.9 }}
          className="flex flex-wrap justify-center gap-2.5 sm:gap-3 mt-6 sm:mt-8"
        >
          <Link
            to="/leaderboard"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-card/40 backdrop-blur-sm border border-border/20 rounded-xl text-muted-foreground hover:text-secondary hover:border-secondary/30 transition-all font-display font-bold text-xs sm:text-sm"
          >
            <Trophy className="h-4 w-4" />
            Leaderboard
          </Link>
          <Link
            to="/classroom"
            className="flex items-center gap-2 px-4 sm:px-5 py-2.5 bg-card/40 backdrop-blur-sm border border-border/20 rounded-xl text-muted-foreground hover:text-accent hover:border-accent/30 transition-all font-display font-bold text-xs sm:text-sm"
          >
            <GraduationCap className="h-4 w-4" />
            Create Class
          </Link>
        </motion.div>

        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
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
