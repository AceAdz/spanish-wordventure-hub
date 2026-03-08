import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, LogOut, Trophy, Gamepad2, Flame, Pencil, Check, X,
  UserPlus, Users, Search, UserCheck, Clock, UserMinus,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { validateUsername } from "@/lib/profanityFilter";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";

type Badge = {
  id: string; name: string; description: string; icon: string;
  unlocked: boolean; unlocked_at?: string;
};

type FriendEntry = {
  friendship_id: string;
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_score: number;
  status: string;
  is_sender: boolean;
};

type SearchResult = {
  user_id: string;
  display_name: string | null;
  avatar_url: string | null;
  total_score: number;
};

export default function Profile() {
  const { user, signOut, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<any>(null);
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);

  // Username editing
  const [editing, setEditing] = useState(false);
  const [newName, setNewName] = useState("");
  const [nameError, setNameError] = useState("");
  const [saving, setSaving] = useState(false);

  // Friends
  const [friends, setFriends] = useState<FriendEntry[]>([]);
  const [pendingIn, setPendingIn] = useState<FriendEntry[]>([]);
  const [pendingOut, setPendingOut] = useState<FriendEntry[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendTab, setFriendTab] = useState<"friends" | "pending">("friends");

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth");
  }, [user, authLoading, navigate]);

  useEffect(() => {
    if (user) { fetchProfile(); fetchFriends(); }
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

  async function fetchFriends() {
    if (!user) return;
    const { data: raw } = await supabase
      .from("friendships")
      .select("id, user_id, friend_id, status")
      .or(`user_id.eq.${user.id},friend_id.eq.${user.id}`);

    if (!raw || raw.length === 0) { setFriends([]); setPendingIn([]); setPendingOut([]); return; }

    const otherIds = raw.map(f => f.user_id === user.id ? f.friend_id : f.user_id);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("user_id, display_name, avatar_url, total_score")
      .in("user_id", otherIds);

    const profileMap = new Map((profiles ?? []).map(p => [p.user_id, p]));

    const entries: FriendEntry[] = raw.map(f => {
      const otherId = f.user_id === user.id ? f.friend_id : f.user_id;
      const p = profileMap.get(otherId);
      return {
        friendship_id: f.id,
        user_id: otherId,
        display_name: p?.display_name ?? null,
        avatar_url: p?.avatar_url ?? null,
        total_score: p?.total_score ?? 0,
        status: f.status,
        is_sender: f.user_id === user.id,
      };
    });

    setFriends(entries.filter(e => e.status === "accepted"));
    setPendingIn(entries.filter(e => e.status === "pending" && !e.is_sender));
    setPendingOut(entries.filter(e => e.status === "pending" && e.is_sender));
  }

  const handleSaveName = async () => {
    const validation = validateUsername(newName);
    if (!validation.valid) { setNameError(validation.error!); return; }
    setSaving(true);
    const { error } = await supabase.from("profiles").update({ display_name: newName.trim() }).eq("user_id", user!.id);
    if (!error) {
      setProfile((p: any) => ({ ...p, display_name: newName.trim() }));
      setEditing(false);
      setNameError("");
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

  const sendFriendRequest = async (targetUserId: string) => {
    if (!user) return;
    await supabase.from("friendships").insert({ user_id: user.id, friend_id: targetUserId });
    fetchFriends();
    setSearchResults(prev => prev.filter(r => r.user_id !== targetUserId));
  };

  const acceptRequest = async (friendshipId: string) => {
    await supabase.from("friendships").update({ status: "accepted" }).eq("id", friendshipId);
    fetchFriends();
  };

  const removeFriend = async (friendshipId: string) => {
    await supabase.from("friendships").delete().eq("id", friendshipId);
    fetchFriends();
  };

  const handleSignOut = async () => { await signOut(); navigate("/"); };

  if (authLoading || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const unlockedCount = badges.filter((b) => b.unlocked).length;
  const allFriendIds = new Set([
    ...friends.map(f => f.user_id),
    ...pendingIn.map(f => f.user_id),
    ...pendingOut.map(f => f.user_id),
  ]);

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

          {/* Editable username */}
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
              <button
                onClick={() => { setNewName(profile?.display_name || ""); setEditing(true); }}
                className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 rounded-lg transition-colors"
              >
                <Pencil className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
          {nameError && <p className="text-destructive text-xs mb-2">{nameError}</p>}

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

        {/* Friends Section */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <Users className="h-5 w-5 text-primary" /> Friends
            </h3>
            <button
              onClick={() => { setShowAddFriend(true); setSearchQuery(""); setSearchResults([]); }}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary/10 border border-primary/20 text-primary rounded-lg text-xs font-display font-bold hover:bg-primary/20 transition-colors"
            >
              <UserPlus className="h-3.5 w-3.5" /> Add Friend
            </button>
          </div>

          {/* Friend tabs */}
          <div className="flex gap-1 bg-muted rounded-xl p-1 mb-4">
            <button
              onClick={() => setFriendTab("friends")}
              className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-all ${friendTab === "friends" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Friends ({friends.length})
            </button>
            <button
              onClick={() => setFriendTab("pending")}
              className={`flex-1 py-2 rounded-lg text-xs font-display font-bold transition-all relative ${friendTab === "pending" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground"}`}
            >
              Pending ({pendingIn.length + pendingOut.length})
              {pendingIn.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-primary text-primary-foreground rounded-full text-[10px] flex items-center justify-center font-bold">
                  {pendingIn.length}
                </span>
              )}
            </button>
          </div>

          {friendTab === "friends" && (
            <div className="space-y-2">
              {friends.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  <Users className="h-10 w-10 mx-auto mb-2 opacity-20" />
                  No friends yet. Add some!
                </div>
              ) : (
                friends.map((f) => (
                  <div key={f.friendship_id} className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl">
                    <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                      {f.avatar_url ? <img src={f.avatar_url} alt="" className="h-full w-full object-cover" /> :
                        <span className="font-display font-bold text-sm text-muted-foreground">{(f.display_name || "?")[0].toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-display font-bold text-sm text-foreground truncate">{f.display_name || "Player"}</p>
                      <p className="text-[10px] text-muted-foreground">{f.total_score.toLocaleString()} pts</p>
                    </div>
                    <button onClick={() => removeFriend(f.friendship_id)}
                      className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                      <UserMinus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          )}

          {friendTab === "pending" && (
            <div className="space-y-2">
              {pendingIn.length > 0 && (
                <div className="mb-3">
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Incoming Requests</p>
                  {pendingIn.map((f) => (
                    <div key={f.friendship_id} className="flex items-center gap-3 p-3 bg-card border border-primary/20 rounded-xl mb-2">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {f.avatar_url ? <img src={f.avatar_url} alt="" className="h-full w-full object-cover" /> :
                          <span className="font-display font-bold text-sm text-muted-foreground">{(f.display_name || "?")[0].toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate">{f.display_name || "Player"}</p>
                      </div>
                      <button onClick={() => acceptRequest(f.friendship_id)}
                        className="p-1.5 text-success hover:bg-success/10 rounded-lg transition-colors">
                        <UserCheck className="h-4 w-4" />
                      </button>
                      <button onClick={() => removeFriend(f.friendship_id)}
                        className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {pendingOut.length > 0 && (
                <div>
                  <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider mb-2">Sent Requests</p>
                  {pendingOut.map((f) => (
                    <div key={f.friendship_id} className="flex items-center gap-3 p-3 bg-card border border-border/50 rounded-xl mb-2">
                      <div className="h-9 w-9 rounded-full bg-muted flex items-center justify-center overflow-hidden">
                        {f.avatar_url ? <img src={f.avatar_url} alt="" className="h-full w-full object-cover" /> :
                          <span className="font-display font-bold text-sm text-muted-foreground">{(f.display_name || "?")[0].toUpperCase()}</span>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-display font-bold text-sm text-foreground truncate">{f.display_name || "Player"}</p>
                        <p className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-2.5 w-2.5" /> Pending</p>
                      </div>
                      <button onClick={() => removeFriend(f.friendship_id)}
                        className="p-1.5 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-xs font-bold">
                        Cancel
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {pendingIn.length === 0 && pendingOut.length === 0 && (
                <div className="text-center py-8 text-muted-foreground text-sm">No pending requests</div>
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
      </main>

      {/* Add Friend Dialog */}
      <Dialog open={showAddFriend} onOpenChange={setShowAddFriend}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <UserPlus className="h-5 w-5 text-primary" /> Add Friend
            </DialogTitle>
            <DialogDescription>Search by username to send a friend request</DialogDescription>
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
                  {allFriendIds.has(r.user_id) ? (
                    <span className="text-[10px] text-muted-foreground font-bold px-2 py-1 bg-muted rounded-full">Already added</span>
                  ) : (
                    <button onClick={() => sendFriendRequest(r.user_id)}
                      className="flex items-center gap-1 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-bold hover:opacity-90 transition-opacity">
                      <UserPlus className="h-3 w-3" /> Add
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
