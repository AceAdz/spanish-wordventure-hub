import { motion, AnimatePresence } from "framer-motion";
import { Link } from "react-router-dom";
import { Flame, Trophy, Star, User, LogIn, Crown, GraduationCap, ArrowRight, Gamepad2, Zap, Swords, Layers } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/useAuth";
import { useState, useEffect, useCallback } from "react";

const games = [
  {
    title: "Spanish Wordle",
    description: "Guess the 5-letter Spanish word in 5 tries",
    path: "/wordle",
    emoji: "🇪🇸",
    stats: "56+ words",
    color: "primary" as const,
  },
  {
    title: "Verb Match",
    description: "Pick the correct conjugation across 5 difficulty levels",
    path: "/verb-match",
    emoji: "🎯",
    stats: "120+ verbs",
    color: "secondary" as const,
  },
  {
    title: "Verb Fishing",
    description: "Cast your line and catch conjugations. Collect rare fish!",
    path: "/verb-fishing",
    emoji: "🎣",
    stats: "22 species",
    color: "accent" as const,
  },
  {
    title: "Palabra Surge",
    description: "Words rise from below — type translations before they escape!",
    path: "/palabra-surge",
    emoji: "⚡",
    stats: "Survival",
    color: "primary" as const,
  },
  {
    title: "Duelo de Palabras",
    description: "Lightning reaction! Smash the correct translation fast.",
    path: "/duelo",
    emoji: "⚔️",
    stats: "Speed duel",
    color: "secondary" as const,
  },
  {
    title: "Memoria Mágica",
    description: "Flip cards to match Spanish-English pairs. Combo chain!",
    path: "/memoria",
    emoji: "🃏",
    stats: "3 modes",
    color: "accent" as const,
  },
];

const colorMap = {
  primary: {
    gradient: "from-primary/25 to-primary/5",
    hoverGradient: "from-primary/40 to-primary/10",
    border: "border-primary/15",
    hoverBorder: "hover:border-primary/50",
    glow: "hover:shadow-[0_0_60px_-10px_hsl(var(--primary)/0.4)]",
    mobileGlow: "shadow-[0_0_40px_-10px_hsl(var(--primary)/0.25)]",
    badge: "bg-primary/15 text-primary",
    text: "text-primary",
    dot: "bg-primary",
    line: "via-primary/40",
  },
  secondary: {
    gradient: "from-secondary/25 to-secondary/5",
    hoverGradient: "from-secondary/40 to-secondary/10",
    border: "border-secondary/15",
    hoverBorder: "hover:border-secondary/50",
    glow: "hover:shadow-[0_0_60px_-10px_hsl(var(--secondary)/0.4)]",
    mobileGlow: "shadow-[0_0_40px_-10px_hsl(var(--secondary)/0.25)]",
    badge: "bg-secondary/15 text-secondary",
    text: "text-secondary",
    dot: "bg-secondary",
    line: "via-secondary/40",
  },
  accent: {
    gradient: "from-accent/25 to-accent/5",
    hoverGradient: "from-accent/40 to-accent/10",
    border: "border-accent/15",
    hoverBorder: "hover:border-accent/50",
    glow: "hover:shadow-[0_0_60px_-10px_hsl(var(--accent)/0.4)]",
    mobileGlow: "shadow-[0_0_40px_-10px_hsl(var(--accent)/0.25)]",
    badge: "bg-accent/15 text-accent",
    text: "text-accent",
    dot: "bg-accent",
    line: "via-accent/40",
  },
};

/* ─── Animated background ─── */
const BackgroundEffects = () => (
  <div className="fixed inset-0 pointer-events-none overflow-hidden">
    {/* Radial glows */}
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,hsl(var(--primary)/0.15),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_50%_at_100%_100%,hsl(var(--accent)/0.1),transparent_70%)]" />
    <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_40%_at_0%_80%,hsl(var(--secondary)/0.08),transparent_70%)]" />

    {/* Animated orbs */}
    {[
      { x: "15%", y: "20%", size: 300, color: "primary", delay: 0 },
      { x: "75%", y: "60%", size: 250, color: "accent", delay: 2 },
      { x: "50%", y: "80%", size: 200, color: "secondary", delay: 4 },
    ].map((orb, i) => (
      <motion.div
        key={i}
        className="absolute rounded-full blur-[100px] opacity-[0.07]"
        style={{
          width: orb.size,
          height: orb.size,
          left: orb.x,
          top: orb.y,
          background: `hsl(var(--${orb.color}))`,
        }}
        animate={{
          x: [0, 40, -30, 0],
          y: [0, -30, 20, 0],
          scale: [1, 1.2, 0.9, 1],
        }}
        transition={{ duration: 15 + i * 3, repeat: Infinity, delay: orb.delay, ease: "easeInOut" }}
      />
    ))}

    {/* Grid */}
    <div
      className="absolute inset-0 opacity-[0.025]"
      style={{
        backgroundImage: `linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)`,
        backgroundSize: "80px 80px",
      }}
    />

    {/* Floating particles */}
    {Array.from({ length: 20 }).map((_, i) => (
      <motion.div
        key={`p-${i}`}
        className="absolute w-1 h-1 rounded-full bg-foreground/10"
        style={{ left: `${Math.random() * 100}%`, top: `${Math.random() * 100}%` }}
        animate={{
          y: [0, -30 - Math.random() * 40, 0],
          opacity: [0, 0.5, 0],
        }}
        transition={{
          duration: 6 + Math.random() * 8,
          repeat: Infinity,
          delay: Math.random() * 8,
          ease: "easeInOut",
        }}
      />
    ))}
  </div>
);

/* ─── Featured hero card (desktop + mobile) ─── */
const FeaturedCard = ({ game }: { game: typeof games[0] }) => {
  const c = colorMap[game.color];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, delay: 0.15, type: "spring", stiffness: 80 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
    >
      <Link to={game.path} className="block">
        <div className={`group relative bg-card/50 backdrop-blur-xl border ${c.border} ${c.hoverBorder} rounded-3xl p-5 sm:p-8 overflow-hidden transition-all duration-500 ${c.glow}`}>
          {/* Gradient fill */}
          <motion.div
            className={`absolute inset-0 bg-gradient-to-br ${c.gradient}`}
            animate={{ opacity: hovered ? 0.9 : 0.6 }}
            transition={{ duration: 0.4 }}
          />
          {/* Scan line */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-b from-transparent via-foreground/[0.015] to-transparent"
            animate={{ y: ["-100%", "200%"] }}
            transition={{ duration: 5, repeat: Infinity, ease: "linear" }}
          />
          {/* Corner brackets */}
          <div className="absolute top-0 left-0 w-10 h-10 sm:w-14 sm:h-14 border-t-2 border-l-2 border-primary/20 rounded-tl-3xl" />
          <div className="absolute bottom-0 right-0 w-10 h-10 sm:w-14 sm:h-14 border-b-2 border-r-2 border-primary/20 rounded-br-3xl" />
          {/* Giant floating emoji */}
          <motion.div
            className="absolute -top-2 -right-2 sm:top-2 sm:right-4 text-[80px] sm:text-[120px] opacity-[0.06] select-none"
            animate={{ rotate: [0, 8, -8, 0], y: [0, -8, 0] }}
            transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          >
            {game.emoji}
          </motion.div>
          {/* Shimmer line top */}
          <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${c.line} to-transparent`} />

          <div className="relative z-10">
            <div className="flex items-center gap-2.5 sm:gap-3 mb-3 sm:mb-4 flex-wrap">
              <motion.span
                className="text-3xl sm:text-5xl"
                animate={hovered ? { scale: [1, 1.2, 1], rotate: [0, 12, -12, 0] } : {}}
                transition={{ duration: 0.5 }}
              >
                {game.emoji}
              </motion.span>
              <span className={`text-[9px] sm:text-[10px] font-bold ${c.badge} px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest`}>
                {game.stats}
              </span>
              <span className="text-[9px] sm:text-[10px] font-bold bg-foreground/5 text-foreground/40 px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full uppercase tracking-widest border border-foreground/5">
                ★ Featured
              </span>
            </div>
            <h2 className="font-display font-black text-xl sm:text-4xl text-foreground mb-1.5 sm:mb-2">
              {game.title}
            </h2>
            <p className="text-muted-foreground text-xs sm:text-base leading-relaxed mb-4 sm:mb-5 max-w-md">
              {game.description}
            </p>
            <motion.div
              className={`inline-flex items-center gap-2 ${c.text} font-display font-bold text-sm sm:text-lg`}
              whileHover={{ x: 5 }}
            >
              <span>Play Now</span>
              <motion.div animate={hovered ? { x: [0, 6, 0] } : {}} transition={{ duration: 0.7, repeat: Infinity }}>
                <ArrowRight className="h-4 w-4 sm:h-5 sm:w-5" />
              </motion.div>
            </motion.div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Regular game card ─── */
const GameCard = ({ game, index }: { game: typeof games[0]; index: number }) => {
  const c = colorMap[game.color];
  const [hovered, setHovered] = useState(false);

  return (
    <motion.div
      initial={{ opacity: 0, y: 25 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 + index * 0.07, type: "spring", stiffness: 120 }}
      onHoverStart={() => setHovered(true)}
      onHoverEnd={() => setHovered(false)}
      className="h-full"
    >
      <Link to={game.path} className="block h-full">
        <div className={`group relative bg-card/40 backdrop-blur-sm border ${c.border} ${c.hoverBorder} rounded-2xl p-4 sm:p-5 overflow-hidden transition-all duration-500 hover:scale-[1.03] hover:-translate-y-1.5 ${c.glow} h-full`}>
          {/* Gradient bg */}
          <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-0 group-hover:opacity-70 transition-opacity duration-500`} />
          {/* Top shimmer */}
          <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${c.line} to-transparent opacity-0 group-hover:opacity-100 transition-opacity`} />
          {/* Pulsing dot */}
          <motion.div
            className={`absolute top-3 right-3 w-1.5 h-1.5 rounded-full ${c.dot}`}
            animate={{ opacity: [0.2, 0.8, 0.2], scale: [0.8, 1.3, 0.8] }}
            transition={{ duration: 2.5, repeat: Infinity, delay: index * 0.4 }}
          />

          <div className="relative z-10">
            <div className="flex items-center justify-between mb-2.5">
              <motion.span
                className="text-2xl sm:text-3xl lg:text-4xl"
                animate={hovered ? { scale: [1, 1.15, 1] } : {}}
                transition={{ duration: 0.3 }}
              >
                {game.emoji}
              </motion.span>
              <span className={`text-[9px] sm:text-[10px] font-bold ${c.badge} px-2 sm:px-2.5 py-0.5 sm:py-1 rounded-full uppercase tracking-wider`}>
                {game.stats}
              </span>
            </div>
            <h2 className="font-display font-black text-sm sm:text-base lg:text-lg text-foreground mb-1">
              {game.title}
            </h2>
            <p className="text-muted-foreground text-[10px] sm:text-[11px] leading-relaxed mb-2.5 line-clamp-2">
              {game.description}
            </p>
            <div className={`flex items-center gap-1.5 ${c.text} font-display font-bold text-[11px] sm:text-sm`}>
              <span>Play</span>
              <ArrowRight className="h-3 w-3 sm:h-3.5 sm:w-3.5 group-hover:translate-x-1.5 transition-transform duration-300" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Mobile swipeable card (horizontal scroll item) ─── */
const MobileScrollCard = ({ game, index }: { game: typeof games[0]; index: number }) => {
  const c = colorMap[game.color];
  return (
    <motion.div
      initial={{ opacity: 0, x: 30 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.4, delay: 0.2 + index * 0.06 }}
      className="snap-center shrink-0 w-[160px]"
    >
      <Link to={game.path} className="block">
        <div className={`relative bg-card/50 backdrop-blur-sm border ${c.border} rounded-2xl p-4 overflow-hidden active:scale-[0.96] transition-transform ${c.mobileGlow}`}>
          <div className={`absolute inset-0 bg-gradient-to-br ${c.gradient} opacity-40`} />
          <div className={`absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent ${c.line} to-transparent`} />
          <motion.div
            className={`absolute top-2.5 right-2.5 w-1.5 h-1.5 rounded-full ${c.dot}`}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
          />
          <div className="relative z-10">
            <span className="text-3xl block mb-2">{game.emoji}</span>
            <span className={`text-[8px] font-bold ${c.badge} px-2 py-0.5 rounded-full uppercase tracking-wider`}>
              {game.stats}
            </span>
            <h3 className="font-display font-black text-[13px] text-foreground mt-2 mb-0.5 leading-tight">
              {game.title}
            </h3>
            <p className="text-muted-foreground text-[9px] leading-snug line-clamp-2 mb-2.5">
              {game.description}
            </p>
            <div className={`flex items-center gap-1 ${c.text} font-display font-bold text-[10px]`}>
              <span>Play</span>
              <ArrowRight className="h-2.5 w-2.5" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
};

/* ─── Main Page ─── */
const Index = () => {
  const { user } = useAuth();
  const [heroText, setHeroText] = useState("");
  const fullText = "¡Vamos a jugar!";

  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      setHeroText(fullText.slice(0, i + 1));
      i++;
      if (i >= fullText.length) clearInterval(id);
    }, 65);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <BackgroundEffects />

      {/* Top banner */}
      <motion.div
        initial={{ y: -40 }}
        animate={{ y: 0 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="bg-gradient-to-r from-primary/90 via-accent/90 to-secondary/90 px-4 py-1.5 sm:py-2 relative z-10"
      >
        <div className="max-w-5xl mx-auto flex items-center justify-center gap-2">
          <motion.div animate={{ rotate: [0, 360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground fill-primary-foreground" />
          </motion.div>
          <a
            href="https://github.com/AceAdz/spanish-wordventure-hub"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] sm:text-[11px] font-bold text-primary-foreground hover:text-primary-foreground/80 transition-colors"
          >
            Star us on GitHub
          </a>
          <motion.div animate={{ rotate: [0, -360] }} transition={{ duration: 4, repeat: Infinity, ease: "linear" }}>
            <Star className="h-2.5 w-2.5 sm:h-3 sm:w-3 text-primary-foreground fill-primary-foreground" />
          </motion.div>
        </div>
      </motion.div>

      {/* Header */}
      <header className="border-b border-border/8 px-4 sm:px-6 py-2.5 sm:py-3 relative z-10 backdrop-blur-2xl bg-background/30">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 group">
            <div className="relative">
              <motion.div
                animate={{ rotate: [0, 5, -5, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <Flame className="h-5 w-5 sm:h-7 sm:w-7 text-primary" />
              </motion.div>
              <div className="absolute inset-0 bg-primary/30 blur-xl rounded-full" />
            </div>
            <span className="font-display font-black text-base sm:text-xl text-foreground">Jugar</span>
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

          <div className="flex items-center gap-1 sm:gap-2">
            <Link
              to="/classroom"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 text-muted-foreground hover:text-accent hover:bg-accent/10 rounded-lg transition-all text-[11px] sm:text-sm font-medium"
            >
              <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Classroom</span>
            </Link>
            <Link
              to="/leaderboard"
              className="flex items-center gap-1 px-2 py-1.5 sm:px-3 text-muted-foreground hover:text-secondary hover:bg-secondary/10 rounded-lg transition-all text-[11px] sm:text-sm font-medium"
            >
              <Crown className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
              <span className="hidden sm:inline">Leaderboard</span>
            </Link>
            {user ? (
              <Link
                to="/profile"
                className="flex items-center gap-1 px-2 py-1.5 sm:px-3 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-all text-[11px] sm:text-sm font-medium"
              >
                <User className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Profile</span>
              </Link>
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 px-3 py-1.5 sm:px-4 sm:py-2 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-lg text-[11px] sm:text-sm font-display font-bold hover:opacity-90 transition-opacity shadow-lg shadow-primary/20"
              >
                <LogIn className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
                <span>Sign Up</span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center px-4 sm:px-6 pt-6 sm:pt-14 pb-8 sm:pb-10 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 25 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-6 sm:mb-12"
        >
          {/* Badge */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.1, type: "spring" }}
            className="inline-flex items-center gap-2 px-3.5 sm:px-4 py-1 sm:py-1.5 bg-card/50 border border-border/15 rounded-full mb-4 sm:mb-6 backdrop-blur-sm"
          >
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 6, repeat: Infinity, ease: "linear" }}>
              <Gamepad2 className="h-3 w-3 sm:h-3.5 sm:w-3.5 text-secondary" />
            </motion.div>
            <span className="text-[10px] sm:text-xs font-bold text-muted-foreground">
              <span className="text-secondary">6</span> games • <span className="text-primary">120</span>+ challenges
            </span>
          </motion.div>

          {/* Title with typewriter */}
          <h1 className="font-display font-black text-[2.75rem] leading-[0.9] sm:text-7xl md:text-[5.5rem] mb-2 sm:mb-4 relative">
            <span className="text-gradient-primary">{heroText.split(" ").slice(0, 1).join(" ")}</span>
            {heroText.length > 6 && (
              <>
                <br />
                <span className="text-foreground">{heroText.split(" ").slice(1).join(" ")}</span>
              </>
            )}
            <motion.span
              className="inline-block w-[2px] sm:w-[3px] h-[0.75em] bg-primary ml-0.5 sm:ml-1 align-middle rounded-full"
              animate={{ opacity: [1, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.2 }}
            className="text-muted-foreground text-xs sm:text-base md:text-lg max-w-sm sm:max-w-md mx-auto mt-2 sm:mt-4 leading-relaxed"
          >
            Master Spanish through <span className="text-primary font-semibold">addictive games</span>.
            <br className="hidden sm:block" />{" "}
            Track scores, earn badges, compete with friends.
          </motion.p>
        </motion.div>

        {/* ═══ DESKTOP LAYOUT ═══ */}
        <div className="w-full max-w-6xl hidden sm:block space-y-4">
          <FeaturedCard game={games[0]} />
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-3">
            {games.slice(1).map((g, i) => (
              <GameCard key={g.title} game={g} index={i} />
            ))}
          </div>
        </div>

        {/* ═══ MOBILE LAYOUT ═══ */}
        <div className="w-full sm:hidden space-y-4">
          {/* Featured */}
          <FeaturedCard game={games[0]} />

          {/* Horizontal scroll strip — swipe through remaining games */}
          <div className="-mx-4">
            <div className="flex gap-3 px-4 overflow-x-auto snap-x snap-mandatory scrollbar-none pb-2" style={{ WebkitOverflowScrolling: "touch" }}>
              {games.slice(1).map((g, i) => (
                <MobileScrollCard key={g.title} game={g} index={i} />
              ))}
              {/* Spacer so last card isn't flush with edge */}
              <div className="shrink-0 w-2" />
            </div>
            {/* Scroll hint dots */}
            <div className="flex justify-center gap-1.5 mt-3">
              {games.slice(1).map((g, i) => (
                <div key={i} className={`w-1.5 h-1.5 rounded-full ${colorMap[g.color].dot} opacity-30`} />
              ))}
            </div>
          </div>
        </div>

        {/* Bottom actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
          className="flex flex-wrap justify-center gap-2 sm:gap-3 mt-6 sm:mt-10"
        >
          <Link
            to="/leaderboard"
            className="group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-card/30 backdrop-blur-sm border border-secondary/15 rounded-xl text-muted-foreground hover:text-secondary hover:border-secondary/40 hover:shadow-[0_0_30px_-8px_hsl(var(--secondary)/0.3)] transition-all font-display font-bold text-[11px] sm:text-sm"
          >
            <Trophy className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
            Leaderboard
          </Link>
          <Link
            to="/classroom"
            className="group flex items-center gap-1.5 sm:gap-2 px-4 sm:px-5 py-2 sm:py-2.5 bg-card/30 backdrop-blur-sm border border-accent/15 rounded-xl text-muted-foreground hover:text-accent hover:border-accent/40 hover:shadow-[0_0_30px_-8px_hsl(var(--accent)/0.3)] transition-all font-display font-bold text-[11px] sm:text-sm"
          >
            <GraduationCap className="h-3.5 w-3.5 sm:h-4 sm:w-4 group-hover:scale-110 transition-transform" />
            Create Class
          </Link>
        </motion.div>

        {!user && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.1 }}
            className="mt-4 sm:mt-6 text-[11px] sm:text-sm text-muted-foreground text-center"
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
