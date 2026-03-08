import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Crown, Medal, Users, Calendar, Globe, Gamepad2, Award, Trash2, Shield, UserPlus } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";


type LeaderboardEntry = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  score: number;
  games: number;
  rank: number;
  best_game?: string | null;
  roles?: string[];
};

type Tab = "global" | "weekly" | "friends";

type UserStats = {
  total_score: number;
  games_played: number;
  best_game: string | null;
  best_game_score: number;
  badges: { name: string; icon: string; description: string; unlocked_at: string }[];
} | null;

export default function Leaderboard() {
  const { user } = useAuth();
  const { isAdmin, deleteUserData } = useAdmin();
  const [tab, setTab] = useState<Tab>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userStats, setUserStats] = useState<UserStats>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => { fetchLeaderboard(); }, [tab, user]);
  useEffect(() => { if (user) fetchUserStats(); }, [user]);

  async function fetchUserStats() {
    if (!user) return;
    const [{ data: profile }, { data: scores }, { data: userBadges }] = await Promise.all([
      supabase.from("profiles").select("total_score, games_played").eq("user_id", user.id).single(),
      supabase.from("game_scores").select("game_type, score").eq("user_id", user.id).order("score", { ascending: false }).limit(1),
      supabase.from("user_badges").select("badge_id, unlocked_at").eq("user_id", user.id),
    ]);

    let badges: UserStats["badges"] = [];
    if (userBadges && userBadges.length > 0) {
      const { data: badgeDetails } = await supabase.from("badges").select("name, icon, description").in("id", userBadges.map(b => b.badge_id));
      badges = (badgeDetails ?? []).map((b, i) => ({ ...b, unlocked_at: userBadges[i]?.unlocked_at ?? "" }));
    }

    setUserStats({
      total_score: profile?.total_score ?? 0,
      games_played: profile?.games_played ?? 0,
      best_game: scores?.[0]?.game_type ?? null,
      best_game_score: scores?.[0]?.score ?? 0,
      badges: badges ?? [],
    });
  }

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      if (tab === "global") {
        const { data } = await supabase.from("profiles").select("user_id, display_name, avatar_url, total_score, games_played").order("total_score", { ascending: false }).limit(100);
        const userIds = (data ?? []).map(p => p.user_id);
        let bestGames: Record<string, string> = {};
        let rolesMap: Record<string, string[]> = {};
        if (userIds.length > 0) {
          const [{ data: scores }, { data: roles }] = await Promise.all([
            supabase.from("game_scores").select("user_id, game_type, score").in("user_id", userIds).order("score", { ascending: false }),
            supabase.from("user_roles").select("user_id, role").in("user_id", userIds),
          ]);
          const seen = new Set<string>();
          (scores ?? []).forEach(s => { if (!seen.has(s.user_id)) { bestGames[s.user_id] = s.game_type; seen.add(s.user_id); } });
          (roles ?? []).forEach(r => { if (!rolesMap[r.user_id]) rolesMap[r.user_id] = []; rolesMap[r.user_id].push(r.role); });
        }
        setEntries((data ?? []).map((p, i) => ({ user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url, score: p.total_score, games: p.games_played, rank: i + 1, best_game: bestGames[p.user_id] ?? null, roles: rolesMap[p.user_id] ?? [] })));
      } else if (tab === "weekly") {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);
        const { data } = await supabase.from("game_scores").select("user_id, score").gte("created_at", weekStart.toISOString());
        const userScores: Record<string, number> = {};
        (data ?? []).forEach((s) => { userScores[s.user_id] = (userScores[s.user_id] || 0) + s.score; });
        const userIds = Object.keys(userScores);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, games_played").in("user_id", userIds);
          const sorted = userIds.map((uid) => { const p = profiles?.find((pr) => pr.user_id === uid); return { user_id: uid, display_name: p?.display_name ?? null, avatar_url: p?.avatar_url ?? null, score: userScores[uid], games: p?.games_played ?? 0, rank: 0 }; }).sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
          setEntries(sorted.slice(0, 50));
        } else { setEntries([]); }
      } else if (tab === "friends" && user) {
        const { data: friendships } = await supabase.from("friendships").select("user_id, friend_id, status").or(`user_id.eq.${user.id},friend_id.eq.${user.id}`).eq("status", "accepted");
        const friendIds = new Set<string>([user.id]);
        (friendships ?? []).forEach((f) => { friendIds.add(f.user_id === user.id ? f.friend_id : f.user_id); });
        const { data: profiles } = await supabase.from("profiles").select("user_id, display_name, avatar_url, total_score, games_played").in("user_id", Array.from(friendIds)).order("total_score", { ascending: false });
        setEntries((profiles ?? []).map((p, i) => ({ user_id: p.user_id, display_name: p.display_name, avatar_url: p.avatar_url, score: p.total_score, games: p.games_played, rank: i + 1 })));
      } else { setEntries([]); }
    } finally { setLoading(false); }
  }

  const handleAdminDelete = async (targetUserId: string, displayName: string | null) => {
    if (!confirm(`Remove ${displayName || "this user"} from leaderboard? This wipes their scores, badges, and sets their name to [Deleted].`)) return;
    setDeletingId(targetUserId);
    const success = await deleteUserData(targetUserId);
    if (success) {
      fetchLeaderboard();
      if (user) fetchUserStats();
    }
    setDeletingId(null);
  };

  const tabs: { id: Tab; label: string; icon: typeof Globe }[] = [
    { id: "global", label: "All Time", icon: Globe },
    { id: "weekly", label: "Weekly", icon: Calendar },
    { id: "friends", label: "Friends", icon: Users },
  ];

  const rankIcon = (rank: number) => {
    if (rank === 1) return <Crown className="h-5 w-5 text-secondary" />;
    if (rank === 2) return <Medal className="h-5 w-5 text-muted-foreground" />;
    if (rank === 3) return <Medal className="h-5 w-5 text-accent" />;
    return <span className="text-sm font-bold text-muted-foreground w-5 text-center">{rank}</span>;
  };

  const gameLabel = (g: string | null | undefined) => {
    if (!g) return null;
    const map: Record<string, string> = { wordle: "🇪🇸 Wordle", verb_match: "🎯 Verb Match", verb_fishing: "🐟 Verb Fishing", palabra_surge: "⚡ Palabra Surge", duelo: "⚔️ Duelo", memoria: "🃏 Memoria" };
    return map[g] ?? g;
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/30 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" /> Leaderboard
            {isAdmin && <Shield className="h-4 w-4 text-primary" />}
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Admin banner */}
        {isAdmin && (
          <div className="flex items-center gap-2 p-3 bg-primary/10 border border-primary/20 rounded-xl mb-4 text-xs">
            <Shield className="h-4 w-4 text-primary shrink-0" />
            <span className="text-primary font-bold">Admin mode</span>
            <span className="text-muted-foreground">— click the trash icon to remove inappropriate users</span>
          </div>
        )}

        {/* Your Stats Card */}
        {user && userStats && (
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-primary/20 rounded-xl p-5 mb-6">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-display font-bold text-foreground flex items-center gap-2"><Gamepad2 className="h-4 w-4 text-primary" /> Your Stats</h2>
              <Link to="/profile" className="text-xs text-primary hover:underline">View Profile →</Link>
            </div>
            <div className="grid grid-cols-3 gap-4 mb-3">
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-foreground">{userStats.total_score.toLocaleString()}</div>
                <div className="text-xs text-muted-foreground">Total Points</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-2xl text-foreground">{userStats.games_played}</div>
                <div className="text-xs text-muted-foreground">Games</div>
              </div>
              <div className="text-center">
                <div className="font-display font-bold text-lg text-accent">{gameLabel(userStats.best_game) ?? "—"}</div>
                <div className="text-xs text-muted-foreground">Top Game</div>
              </div>
            </div>
            {userStats.badges.length > 0 && (
              <div className="flex items-center gap-2 pt-2 border-t border-border/30">
                <Award className="h-4 w-4 text-secondary" />
                <div className="flex gap-1.5 flex-wrap">
                  {userStats.badges.slice(0, 5).map((b, i) => (
                    <span key={i} className="text-lg" title={b.name}>{b.icon}</span>
                  ))}
                  {userStats.badges.length > 5 && <span className="text-xs text-muted-foreground self-center">+{userStats.badges.length - 5}</span>}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
          {tabs.map((t) => (
            <button key={t.id} onClick={() => setTab(t.id)} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${tab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              <t.icon className="h-4 w-4" />{t.label}
            </button>
          ))}
        </div>

        {tab === "friends" && !user && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Sign in to see your friends</p>
            <Link to="/auth" className="text-primary font-bold hover:underline">Sign in</Link>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />)}</div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" /><p>No scores yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <motion.div key={entry.user_id} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${entry.user_id === user?.id ? "bg-primary/10 border-primary/30" : "bg-card border-border/50"}`}>
                <div className="w-8 flex justify-center">{rankIcon(entry.rank)}</div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" /> : <span className="font-display font-bold text-muted-foreground">{(entry.display_name || "?")[0].toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <Link to={`/user/${entry.user_id}`} className="font-display font-bold text-foreground truncate hover:text-primary transition-colors">
                      {entry.display_name || "Anonymous"}
                    </Link>
                    {entry.roles?.includes("owner") && (
                      <span className="px-1.5 py-0.5 bg-secondary/20 border border-secondary/30 rounded text-[9px] font-bold text-secondary uppercase tracking-wider">Owner</span>
                    )}
                    {entry.roles?.includes("admin") && (
                      <span className="px-1.5 py-0.5 bg-primary/15 border border-primary/25 rounded text-[9px] font-bold text-primary uppercase tracking-wider">Admin</span>
                    )}
                    {entry.user_id === user?.id && <span className="text-primary text-[10px]">(you)</span>}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{entry.games} games</span>
                    {entry.best_game && <><span>·</span><span>{gameLabel(entry.best_game)}</span></>}
                  </div>
                </div>
                <div className="font-display font-bold text-xl text-foreground">{entry.score.toLocaleString()}</div>
                {/* Admin delete button */}
                {isAdmin && entry.user_id !== user?.id && (
                  <button
                    onClick={() => handleAdminDelete(entry.user_id, entry.display_name)}
                    disabled={deletingId === entry.user_id}
                    className="p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors disabled:opacity-50"
                    title="Remove user (admin)"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
