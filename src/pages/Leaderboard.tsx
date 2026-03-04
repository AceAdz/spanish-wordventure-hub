import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { ArrowLeft, Trophy, Crown, Medal, Users, Calendar, Globe } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type LeaderboardEntry = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  score: number;
  games: number;
  rank: number;
};

type Tab = "global" | "weekly" | "friends";

export default function Leaderboard() {
  const { user } = useAuth();
  const [tab, setTab] = useState<Tab>("global");
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchLeaderboard();
  }, [tab, user]);

  async function fetchLeaderboard() {
    setLoading(true);
    try {
      if (tab === "global") {
        const { data } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, total_score, games_played")
          .gt("total_score", 0)
          .order("total_score", { ascending: false })
          .limit(50);
        setEntries(
          (data ?? []).map((p, i) => ({
            user_id: p.user_id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            score: p.total_score,
            games: p.games_played,
            rank: i + 1,
          }))
        );
      } else if (tab === "weekly") {
        const weekStart = new Date();
        weekStart.setDate(weekStart.getDate() - weekStart.getDay());
        weekStart.setHours(0, 0, 0, 0);

        const { data } = await supabase
          .from("game_scores")
          .select("user_id, score")
          .gte("created_at", weekStart.toISOString());

        // Aggregate by user
        const userScores: Record<string, number> = {};
        (data ?? []).forEach((s) => {
          userScores[s.user_id] = (userScores[s.user_id] || 0) + s.score;
        });

        const userIds = Object.keys(userScores);
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from("profiles")
            .select("user_id, display_name, avatar_url, games_played")
            .in("user_id", userIds);

          const sorted = userIds
            .map((uid) => {
              const p = profiles?.find((pr) => pr.user_id === uid);
              return {
                user_id: uid,
                display_name: p?.display_name ?? null,
                avatar_url: p?.avatar_url ?? null,
                score: userScores[uid],
                games: p?.games_played ?? 0,
                rank: 0,
              };
            })
            .sort((a, b) => b.score - a.score)
            .map((e, i) => ({ ...e, rank: i + 1 }));

          setEntries(sorted.slice(0, 50));
        } else {
          setEntries([]);
        }
      } else if (tab === "friends" && user) {
        const { data: friendships } = await supabase
          .from("friendships")
          .select("user_id, friend_id, status")
          .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`)
          .eq("status", "accepted");

        const friendIds = new Set<string>();
        friendIds.add(user.id);
        (friendships ?? []).forEach((f) => {
          friendIds.add(f.user_id === user.id ? f.friend_id : f.user_id);
        });

        const { data: profiles } = await supabase
          .from("profiles")
          .select("user_id, display_name, avatar_url, total_score, games_played")
          .in("user_id", Array.from(friendIds))
          .order("total_score", { ascending: false });

        setEntries(
          (profiles ?? []).map((p, i) => ({
            user_id: p.user_id,
            display_name: p.display_name,
            avatar_url: p.avatar_url,
            score: p.total_score,
            games: p.games_played,
            rank: i + 1,
          }))
        );
      } else {
        setEntries([]);
      }
    } finally {
      setLoading(false);
    }
  }

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

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <Trophy className="h-5 w-5 text-secondary" /> Leaderboard
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Tabs */}
        <div className="flex gap-1 bg-muted rounded-xl p-1 mb-6">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-display font-bold transition-all ${
                tab === t.id
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <t.icon className="h-4 w-4" />
              {t.label}
            </button>
          ))}
        </div>

        {tab === "friends" && !user && (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">Sign in to see your friends</p>
            <Link to="/auth" className="text-primary font-bold hover:underline">
              Sign in
            </Link>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-card rounded-xl animate-pulse" />
            ))}
          </div>
        ) : entries.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground">
            <Trophy className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>No scores yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {entries.map((entry, i) => (
              <motion.div
                key={entry.user_id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className={`flex items-center gap-4 p-4 rounded-xl border transition-colors ${
                  entry.user_id === user?.id
                    ? "bg-primary/10 border-primary/30"
                    : "bg-card border-border"
                }`}
              >
                <div className="w-8 flex justify-center">{rankIcon(entry.rank)}</div>
                <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                  {entry.avatar_url ? (
                    <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <span className="font-display font-bold text-muted-foreground">
                      {(entry.display_name || "?")[0].toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-display font-bold text-foreground truncate">
                    {entry.display_name || "Anonymous"}
                    {entry.user_id === user?.id && (
                      <span className="text-primary text-xs ml-2">(you)</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground">{entry.games} games</p>
                </div>
                <div className="font-display font-bold text-xl text-foreground">
                  {entry.score.toLocaleString()}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
