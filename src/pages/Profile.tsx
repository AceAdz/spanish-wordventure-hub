import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, LogOut, Trophy, Gamepad2, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Badge = {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlocked_at?: string;
};

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) fetchProfile();
  }, [user]);

  async function fetchProfile() {
    setLoading(true);
    const { data: p } = await supabase
      .from("profiles")
      .select("*")
      .eq("user_id", user!.id)
      .single();
    setProfile(p);

    const { data: allBadges } = await supabase.from("badges").select("*");
    const { data: userBadges } = await supabase
      .from("user_badges")
      .select("badge_id, unlocked_at")
      .eq("user_id", user!.id);

    const ubMap = new Map(userBadges?.map((ub) => [ub.badge_id, ub.unlocked_at]) ?? []);
    setBadges(
      (allBadges ?? []).map((b) => ({
        id: b.id,
        name: b.name,
        description: b.description,
        icon: b.icon,
        unlocked: ubMap.has(b.id),
        unlocked_at: ubMap.get(b.id) ?? undefined,
      }))
    );
    setLoading(false);
  }

  const handleSignOut = async () => {
    await signOut();
    navigate("/");
  };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" />
            <span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">Profile</h1>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 mb-6 text-center"
        >
          <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-3 overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="font-display font-bold text-2xl text-muted-foreground">
                  {(profile?.display_name || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>
          <h2 className="font-display font-bold text-2xl text-foreground mb-1">
            {profile?.display_name || "Player"}
          </h2>
          <p className="text-muted-foreground text-sm mb-6">
            Joined {new Date(profile?.created_at).toLocaleDateString()}
          </p>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-muted/50 rounded-xl p-3">
              <Trophy className="h-5 w-5 text-secondary mx-auto mb-1" />
              <div className="font-display font-bold text-xl text-foreground">{profile?.total_score ?? 0}</div>
              <div className="text-xs text-muted-foreground">Total Score</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <Gamepad2 className="h-5 w-5 text-primary mx-auto mb-1" />
              <div className="font-display font-bold text-xl text-foreground">{profile?.games_played ?? 0}</div>
              <div className="text-xs text-muted-foreground">Games</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-3">
              <Flame className="h-5 w-5 text-accent mx-auto mb-1" />
              <div className="font-display font-bold text-xl text-foreground">{unlockedCount}/{badges.length}</div>
              <div className="text-xs text-muted-foreground">Badges</div>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        <h3 className="font-display font-bold text-lg text-foreground mb-3">Badges</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {badges.map((badge, i) => (
            <motion.div
              key={badge.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.05 }}
              className={`relative bg-card border rounded-xl p-4 text-center transition-all ${
                badge.unlocked
                  ? "border-secondary/50 shadow-md"
                  : "border-border opacity-40 grayscale"
              }`}
            >
              <span className="text-3xl block mb-2">{badge.icon}</span>
              <p className="font-display font-bold text-sm text-foreground">{badge.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
              {badge.unlocked && (
                <div className="absolute -top-1 -right-1 h-5 w-5 bg-secondary rounded-full flex items-center justify-center">
                  <span className="text-xs">✓</span>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      </main>
    </div>
  );
}
