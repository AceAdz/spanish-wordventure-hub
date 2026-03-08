import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowLeft, Trophy, Gamepad2, Heart, Users, Eye, UserPlus, UserMinus, Shield, Flame } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

type Badge = {
  id: string; name: string; description: string; icon: string;
  unlocked: boolean;
};

export default function UserProfile() {
  const { userId } = useParams<{ userId: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followsMe, setFollowsMe] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [friendCount, setFriendCount] = useState(0);

  // Redirect to own profile
  useEffect(() => {
    if (user && userId === user.id) navigate("/profile", { replace: true });
  }, [user, userId, navigate]);

  useEffect(() => {
    if (userId) { fetchProfile(); fetchSocial(); fetchAdminStatus(); }
  }, [userId, user]);

  async function fetchProfile() {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", userId!).single();
    setProfile(p);

    const { data: allBadges } = await supabase.from("badges").select("*");
    const { data: userBadges } = await supabase.from("user_badges").select("badge_id").eq("user_id", userId!);
    const ubSet = new Set(userBadges?.map(ub => ub.badge_id) ?? []);
    setBadges(
      (allBadges ?? []).map(b => ({
        id: b.id, name: b.name, description: b.description, icon: b.icon,
        unlocked: ubSet.has(b.id),
      }))
    );
    setLoading(false);
  }

  async function fetchAdminStatus() {
    const { data } = await supabase.from("user_roles").select("role").eq("user_id", userId!).eq("role", "admin").maybeSingle();
    setIsAdmin(!!data);
  }

  async function fetchSocial() {
    if (!userId) return;

    // Get all friendships for this user
    const { data: raw } = await supabase
      .from("friendships")
      .select("user_id, friend_id, status")
      .or(`user_id.eq.${userId},friend_id.eq.${userId}`)
      .eq("status", "accepted");

    const theyFollow = (raw ?? []).filter(f => f.user_id === userId);
    const followThem = (raw ?? []).filter(f => f.friend_id === userId);
    const theyFollowSet = new Set(theyFollow.map(f => f.friend_id));
    const followThemSet = new Set(followThem.map(f => f.user_id));

    const mutuals = [...theyFollowSet].filter(id => followThemSet.has(id));
    setFriendCount(mutuals.length);
    setFollowerCount(followThemSet.size);
    setFollowingCount(theyFollowSet.size);

    // Check if I follow them / they follow me
    if (user) {
      setIsFollowing(
        (raw ?? []).some(f => f.user_id === user.id && f.friend_id === userId)
      );
      setFollowsMe(
        (raw ?? []).some(f => f.user_id === userId && f.friend_id === user.id)
      );
    }
  }

  const handleFollow = async () => {
    if (!user || !userId) return;
    await supabase.from("friendships").insert({ user_id: user.id, friend_id: userId, status: "accepted" });
    setIsFollowing(true);
    fetchSocial();
  };

  const handleUnfollow = async () => {
    if (!user || !userId) return;
    await supabase.from("friendships").delete().eq("user_id", user.id).eq("friend_id", userId);
    setIsFollowing(false);
    fetchSocial();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <p className="text-muted-foreground mb-4">User not found</p>
          <Link to="/leaderboard" className="text-primary font-bold hover:underline">Back to Leaderboard</Link>
        </div>
      </div>
    );
  }

  const unlockedBadges = badges.filter(b => b.unlocked);
  const isMutual = isFollowing && followsMe;

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm">Back</span>
          </button>
          <h1 className="font-display font-bold text-lg text-foreground">Player Profile</h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 text-center">
          <div className="h-20 w-20 rounded-full bg-muted mx-auto mb-3 overflow-hidden">
            {profile.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="h-full w-full flex items-center justify-center">
                <span className="font-display font-bold text-2xl text-muted-foreground">
                  {(profile.display_name || "?")[0].toUpperCase()}
                </span>
              </div>
            )}
          </div>

          <div className="flex items-center justify-center gap-2 mb-1">
            <h2 className="font-display font-bold text-2xl text-foreground">
              {profile.display_name || "Player"}
            </h2>
            {isAdmin && (
              <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/25 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                <Shield className="h-3 w-3" /> Admin
              </span>
            )}
          </div>

          {isMutual && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-primary/10 rounded-full text-[10px] font-bold text-primary mb-2">
              <Heart className="h-2.5 w-2.5 fill-primary" /> Friends
            </span>
          )}

          <p className="text-muted-foreground text-sm mb-4">
            Joined {new Date(profile.created_at).toLocaleDateString()}
          </p>

          {/* Follow / Unfollow */}
          {user && user.id !== userId && (
            <div className="mb-4">
              {isFollowing ? (
                <button onClick={handleUnfollow}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-muted border border-border text-muted-foreground rounded-xl text-sm font-display font-bold hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-colors">
                  <UserMinus className="h-4 w-4" /> Unfollow
                </button>
              ) : (
                <button onClick={handleFollow}
                  className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:opacity-90 transition-opacity">
                  <UserPlus className="h-4 w-4" /> Follow
                </button>
              )}
            </div>
          )}

          {!user && (
            <div className="mb-4">
              <Link to="/auth" className="inline-flex items-center gap-2 px-5 py-2 bg-primary text-primary-foreground rounded-xl text-sm font-display font-bold hover:opacity-90 transition-opacity">
                <UserPlus className="h-4 w-4" /> Sign in to follow
              </Link>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-5 gap-2">
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Trophy className="h-4 w-4 text-secondary mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{profile.total_score ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Score</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Gamepad2 className="h-4 w-4 text-primary mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{profile.games_played ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Games</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Heart className="h-4 w-4 text-primary mx-auto mb-0.5 fill-primary" />
              <div className="font-display font-bold text-lg text-foreground">{friendCount}</div>
              <div className="text-[10px] text-muted-foreground">Friends</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Eye className="h-4 w-4 text-accent mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{followerCount}</div>
              <div className="text-[10px] text-muted-foreground">Followers</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Flame className="h-4 w-4 text-accent mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{unlockedBadges.length}</div>
              <div className="text-[10px] text-muted-foreground">Badges</div>
            </div>
          </div>
        </motion.div>

        {/* Badges */}
        {unlockedBadges.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
            <h3 className="font-display font-bold text-lg text-foreground mb-3">Badges</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {unlockedBadges.map((badge, i) => (
                <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                  className="relative bg-card border border-secondary/50 shadow-md rounded-xl p-4 text-center">
                  <span className="text-3xl block mb-2">{badge.icon}</span>
                  <p className="font-display font-bold text-sm text-foreground">{badge.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  <div className="absolute -top-1 -right-1 h-5 w-5 bg-secondary rounded-full flex items-center justify-center">
                    <span className="text-xs">✓</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        )}
      </main>
    </div>
  );
}
