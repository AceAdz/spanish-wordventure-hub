import { useState, useEffect, useCallback } from "react";
import { motion } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, LogOut, Trophy, Gamepad2, Flame, Pencil, Check, X,
  UserPlus, Users, Search, UserMinus, Shield, Heart, Eye, Camera, Loader2,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useAdmin } from "@/hooks/useAdmin";
import { validateUsername } from "@/lib/profanityFilter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

type Badge = {
  id: string; name: string; description: string; icon: string;
  unlocked: boolean; unlocked_at?: string;
};

type FollowEntry = {
  friendship_id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_score: number;
  i_follow_them: boolean;
  they_follow_me: boolean;
};

type SearchResult = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_score: number;
};

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const { isAdmin, claimAdminCode } = useAdmin();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Username editing
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  // Follow system
  const [followers, setFollowers] = useState<FollowEntry[]>([]);
  const [following, setFollowing] = useState<FollowEntry[]>([]);
  const [mutualFriends, setMutualFriends] = useState<FollowEntry[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [socialTab, setSocialTab] = useState<"friends" | "followers" | "following">("friends");

  // Admin code
  const [adminCode, setAdminCode] = useState("");
  const [adminError, setAdminError] = useState("");
  const [adminSuccess, setAdminSuccess] = useState(false);
  const [claimingAdmin, setClaimingAdmin] = useState(false);

  // Avatar upload
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [avatarError, setAvatarError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) { fetchProfile(); fetchFollows(); }
  }, [user]);

  async function fetchProfile() {
    setLoading(true);
    const { data: p } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    setProfile(p);
    const { data: allBadges } = await supabase.from("badges").select("*");
    const { data: userBadges } = await supabase.from("user_badges").select("badge_id, unlocked_at").eq("user_id", user!.id);
    const ubMap = new Map(userBadges?.map((ub) => [ub.badge_id, ub.unlocked_at]) ?? []);
    setBadges(
      (allBadges ?? []).map((b) => ({
        id: b.id, name: b.name, description: b.description, icon: b.icon,
        unlocked: ubMap.has(b.id), unlocked_at: ubMap.get(b.id) ?? undefined,
      }))
    );
    setLoading(false);
  }

  async function fetchFollows() {
    if (!user) return;

    // Get all friendships involving me
    const { data: raw } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (!raw || raw.length === 0) {
      setFollowers([]); setFollowing([]); setMutualFriends([]);
      return;
    }

    // user_id = follower, friend_id = who they follow
    // I follow them: user_id = me
    // They follow me: friend_id = me
    const iFollow = raw.filter(f => f.user_id === user.id && f.status === "accepted");
    const theyFollowMe = raw.filter(f => f.friend_id === user.id && f.status === "accepted");

    const iFollowSet = new Set(iFollow.map(f => f.friend_id));
    const theyFollowSet = new Set(theyFollowMe.map(f => f.user_id));

    const allUserIds = new Set([...iFollowSet, ...theyFollowSet]);
    if (allUserIds.size === 0) {
      setFollowers([]); setFollowing([]); setMutualFriends([]);
      return;
    }

    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, total_score")
      .in("user_id", Array.from(allUserIds));

    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

    const buildEntry = (uid: string): FollowEntry => {
      const p = profileMap.get(uid);
      const rel = raw.find(f =>
        (f.user_id === user.id && f.friend_id === uid) ||
        (f.friend_id === user.id && f.user_id === uid)
      );
      return {
        friendship_id: rel?.id ?? "",
        user_id: uid,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        total_score: p?.total_score ?? 0,
        i_follow_them: iFollowSet.has(uid),
        they_follow_me: theyFollowSet.has(uid),
      };
    };

    const mutual: FollowEntry[] = [];
    const followingOnly: FollowEntry[] = [];
    const followersOnly: FollowEntry[] = [];

    allUserIds.forEach(uid => {
      const entry = buildEntry(uid);
      if (entry.i_follow_them && entry.they_follow_me) {
        mutual.push(entry);
      } else if (entry.i_follow_them) {
        followingOnly.push(entry);
      } else {
        followersOnly.push(entry);
      }
    });

    setMutualFriends(mutual);
    setFollowing(followingOnly);
    setFollowers(followersOnly);
  }

  const handleSaveName = async () => {
    const validation = validateUsername(newName);
    if (!validation.valid) { setNameError(validation.error!); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: newName.trim() }).eq("user_id", user!.id);
    if (!error) {
      setProfile((p: any) => ({ ...p, display_name: newName.trim() }));
      setEditing(false); setNameError("");
    }
    setSaving(false);
  };

  const searchUsers = async () => {
    if (!searchQuery.trim() || searchQuery.trim().length < 2) return;
    setSearching(true);
    const { data } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, total_score")
      .ilike("display_name", `%${searchQuery.trim()}%`)
      .neq("user_id", user!.id)
      .limit(10);
    setSearchResults(data ?? []);
    setSearching(false);
  };

  const followUser = async (targetUserId: string) => {
    if (!user) return;
    // user_id = follower (me), friend_id = who I'm following, status = accepted immediately
    await supabase.from("friendships").insert({
      user_id: user.id,
      friend_id: targetUserId,
      status: "accepted",
    });
    fetchFollows();
    setSearchResults(prev => prev.filter(r => r.user_id !== targetUserId));
  };

  const unfollowUser = async (targetUserId: string) => {
    if (!user) return;
    await supabase.from("friendships").delete()
      .eq("user_id", user.id).eq("friend_id", targetUserId);
    fetchFollows();
  };

  const handleClaimAdmin = async () => {
    if (!adminCode.trim()) return;
    setClaimingAdmin(true);
    setAdminError("");
    const success = await claimAdminCode(adminCode.trim());
    if (success) {
      setAdminSuccess(true);
      setAdminCode("");
    } else {
      setAdminError("Invalid code");
    }
    setClaimingAdmin(false);
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    if (!file.type.startsWith("image/")) { setAvatarError("Please select an image file"); return; }
    if (file.size > 2 * 1024 * 1024) { setAvatarError("Image must be under 2MB"); return; }

    setUploadingAvatar(true);
    setAvatarError("");

    try {
      // Convert to base64 for AI moderation
      const reader = new FileReader();
      const base64 = await new Promise<string>((resolve, reject) => {
        reader.onload = () => {
          const result = reader.result as string;
          resolve(result.split(",")[1]); // strip data:image/...;base64,
        };
        reader.onerror = reject;
        reader.readAsDataURL(file);
      });

      // AI moderation check
      const { data: modResult, error: modError } = await supabase.functions.invoke("moderate-avatar", {
        body: { imageBase64: base64 },
      });

      if (modError) throw new Error("Moderation check failed");
      if (!modResult?.safe) {
        setAvatarError(modResult?.reason || "Image rejected by moderation");
        setUploadingAvatar(false);
        return;
      }

      // Upload to storage
      const ext = file.name.split(".").pop() || "jpg";
      const path = `${user.id}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`; // cache bust

      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      setProfile((p: any) => ({ ...p, avatar_url: avatarUrl }));
    } catch (err: any) {
      setAvatarError(err?.message || "Upload failed");
    }
    setUploadingAvatar(false);
  };



  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const allFollowedIds = new Set([
    ...mutualFriends.map(f => f.user_id),
    ...following.map(f => f.user_id),
  ]);

  const PersonRow = ({ entry, showFollowBack = false }: { entry: FollowEntry; showFollowBack?: boolean }) => (
    <div className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl">
      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden shrink-0">
        {entry.avatar_url ? <img src={entry.avatar_url} alt="" className="h-full w-full object-cover" /> :
          <span className="font-display font-bold text-sm text-muted-foreground">{(entry.display_name || "?")[0].toUpperCase()}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-display font-bold text-sm text-foreground truncate">{entry.display_name || "Player"}</p>
        <p className="text-[10px] text-muted-foreground">{entry.total_score.toLocaleString()} pts</p>
      </div>
      {entry.i_follow_them && entry.they_follow_me && (
        <span className="text-[9px] font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full flex items-center gap-1">
          <Heart className="h-2.5 w-2.5 fill-primary" /> Friends
        </span>
      )}
      {showFollowBack && !entry.i_follow_them && (
        <button onClick={() => followUser(entry.user_id)}
          className="flex items-center gap-1 px-2.5 py-1 bg-primary text-primary-foreground rounded-lg text-[10px] font-bold hover:opacity-90 transition-opacity">
          <UserPlus className="h-3 w-3" /> Follow back
        </button>
      )}
      {entry.i_follow_them && (
        <button onClick={() => unfollowUser(entry.user_id)}
          className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
          <UserMinus className="h-3.5 w-3.5" />
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="border-b border-border/50 px-4 py-3">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground">Profile</h1>
          <button onClick={handleSignOut} className="text-muted-foreground hover:text-destructive transition-colors">
            <LogOut className="h-5 w-5" />
          </button>
        </div>
      </header>

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-6 space-y-6">
        {/* Profile Card */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-2xl p-6 text-center">
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

          {/* Username + Admin badge */}
          {editing ? (
            <div className="flex items-center justify-center gap-2 mb-1">
              <input
                value={newName}
                onChange={(e) => { setNewName(e.target.value); setNameError(""); }}
                maxLength={20}
                className="px-3 py-1.5 bg-muted/50 border border-border rounded-lg text-foreground text-center font-display font-bold text-lg w-48 focus:outline-none focus:border-primary"
                autoFocus
              />
              <button onClick={handleSaveName} disabled={saving}
                className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors">
                <Check className="h-4 w-4" />
              </button>
              <button onClick={() => { setEditing(false); setNameError(""); }}
                className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 mb-1">
              <h2 className="font-display font-bold text-2xl text-foreground">
                {profile?.display_name || "Player"}
              </h2>
              {isAdmin && (
                <span className="flex items-center gap-1 px-2 py-0.5 bg-primary/15 border border-primary/25 rounded-full text-[10px] font-bold text-primary uppercase tracking-wider">
                  <Shield className="h-3 w-3" /> Admin
                </span>
              )}
              <button
                onClick={() => { setNewName(profile?.display_name || ""); setEditing(true); }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {nameError && <p className="text-destructive text-xs mb-2">{nameError}</p>}

          <p className="text-muted-foreground text-sm mb-4">
            Joined {new Date(profile?.created_at).toLocaleDateString()}
          </p>

          {/* Stats row */}
          <div className="grid grid-cols-5 gap-2 mb-2">
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Trophy className="h-4 w-4 text-secondary mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{profile?.total_score ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Score</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Gamepad2 className="h-4 w-4 text-primary mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{profile?.games_played ?? 0}</div>
              <div className="text-[10px] text-muted-foreground">Games</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Heart className="h-4 w-4 text-primary mx-auto mb-0.5 fill-primary" />
              <div className="font-display font-bold text-lg text-foreground">{mutualFriends.length}</div>
              <div className="text-[10px] text-muted-foreground">Friends</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Eye className="h-4 w-4 text-accent mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{followers.length + mutualFriends.length}</div>
              <div className="text-[10px] text-muted-foreground">Followers</div>
            </div>
            <div className="bg-muted/50 rounded-xl p-2.5">
              <Flame className="h-4 w-4 text-accent mx-auto mb-0.5" />
              <div className="font-display font-bold text-lg text-foreground">{unlockedCount}/{badges.length}</div>
              <div className="text-[10px] text-muted-foreground">Badges</div>
            </div>
          </div>
        </motion.div>

        {/* Social Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Social
            </h3>
            <button
              onClick={() => { setShowAddFriend(true); setSearchQuery(""); setSearchResults([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-display font-bold hover:bg-primary/20 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" /> Find People
            </button>
          </div>

          {/* Social tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
            {[
              { id: "friends" as const, label: `Friends (${mutualFriends.length})` },
              { id: "followers" as const, label: `Followers (${followers.length})` },
              { id: "following" as const, label: `Following (${following.length + mutualFriends.length})` },
            ].map(t => (
              <button key={t.id} onClick={() => setSocialTab(t.id)}
                className={`flex-1 py-2 rounded-lg text-[11px] font-display font-bold transition-all ${socialTab === t.id ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}>
                {t.label}
              </button>
            ))}
          </div>

          {socialTab === "friends" && (
            <div className="space-y-2">
              {mutualFriends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Heart className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  Follow people and when they follow back, you become friends!
                </div>
              ) : mutualFriends.map(f => <PersonRow key={f.user_id} entry={f} />)}
            </div>
          )}

          {socialTab === "followers" && (
            <div className="space-y-2">
              {followers.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  No followers yet
                </div>
              ) : followers.map(f => <PersonRow key={f.user_id} entry={f} showFollowBack />)}
            </div>
          )}

          {socialTab === "following" && (
            <div className="space-y-2">
              {(following.length + mutualFriends.length) === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Eye className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  Not following anyone yet
                </div>
              ) : (
                <>
                  {mutualFriends.map(f => <PersonRow key={f.user_id} entry={f} />)}
                  {following.map(f => <PersonRow key={f.user_id} entry={f} />)}
                </>
              )}
            </div>
          )}
        </motion.div>

        {/* Badges */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <h3 className="font-display font-bold text-lg text-foreground mb-3">Badges</h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {badges.map((badge, i) => (
              <motion.div key={badge.id} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}
                className={`relative bg-card border rounded-xl p-4 text-center transition-all ${badge.unlocked ? "border-secondary/50 shadow-md" : "border-border opacity-40 grayscale"}`}>
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
        </motion.div>

        {/* Admin Code Entry — bottom of profile */}
        {!isAdmin && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }}
            className="border-t border-border/20 pt-6">
            <div className="flex items-center gap-2">
              <input
                value={adminCode}
                onChange={(e) => { setAdminCode(e.target.value); setAdminError(""); setAdminSuccess(false); }}
                placeholder="Enter admin code"
                className="flex-1 px-4 py-2.5 bg-muted/30 border border-border/30 rounded-lg text-foreground text-sm placeholder:text-muted-foreground/50 focus:outline-none focus:border-primary/50"
              />
              <button
                onClick={handleClaimAdmin}
                disabled={claimingAdmin || !adminCode.trim()}
                className="px-4 py-2.5 bg-muted/30 border border-border/30 text-muted-foreground rounded-lg text-sm font-display font-bold hover:bg-muted/50 transition-colors disabled:opacity-50"
              >
                {claimingAdmin ? "..." : "Submit"}
              </button>
            </div>
            {adminError && <p className="text-destructive text-xs mt-1.5">{adminError}</p>}
            {adminSuccess && <p className="text-success text-xs mt-1.5">Admin access granted!</p>}
          </motion.div>
        )}
      </main>

      {/* Find People Dialog */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Find People
            </DialogTitle>
            <DialogDescription>Search by username to follow someone</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div className="flex gap-2">
              <input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && searchUsers()}
                placeholder="Search username..."
                className="flex-1 px-4 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary text-sm"
              />
              <button onClick={searchUsers} disabled={searching || searchQuery.trim().length < 2}
                className="px-4 py-2.5 bg-primary text-primary-foreground rounded-lg font-display font-bold text-sm hover:opacity-90 transition-opacity disabled:opacity-50">
                <Search className="h-4 w-4" />
              </button>
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto">
              {searching && <div className="text-center py-4 text-muted-foreground text-sm">Searching...</div>}
              {!searching && searchResults.length === 0 && searchQuery.length >= 2 && (
                <div className="text-center py-4 text-muted-foreground text-sm">No users found</div>
              )}
              {searchResults.map((r) => (
                <div key={r.user_id} className="flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-xl">
                  <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                    {r.avatar_url ? <img src={r.avatar_url} alt="" className="h-full w-full object-cover" /> :
                      <span className="font-display font-bold text-sm text-muted-foreground">{(r.display_name || "?")[0].toUpperCase()}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-sm text-foreground truncate">{r.display_name || "Player"}</p>
                    <p className="text-[10px] text-muted-foreground">{r.total_score.toLocaleString()} pts</p>
                  </div>
                  {allFollowedIds.has(r.user_id) ? (
                    <span className="text-[10px] text-muted-foreground font-bold px-2 py-1 bg-muted rounded-full">Following</span>
                  ) : (
                    <button onClick={() => followUser(r.user_id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                      <UserPlus className="h-3 w-3" /> Follow
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
