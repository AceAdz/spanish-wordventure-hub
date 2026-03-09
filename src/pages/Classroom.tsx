import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Link, useNavigate } from "react-router-dom";
import {
  ArrowLeft, Plus, Users, Copy, Check, Trophy, LogIn, Trash2,
  GraduationCap, Hash, Crown, ChevronRight, DoorOpen
} from "lucide-react";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface ClassData {
  id: string;
  name: string;
  code: string;
  description: string;
  teacher_id: string;
  created_at: string;
}

interface MemberWithProfile {
  user_id: string;
  display_name: string | null;
  total_score: number;
  games_played: number;
}

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export default function Classroom() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [myClasses, setMyClasses] = useState<ClassData[]>([]);
  const [joinedClasses, setJoinedClasses] = useState<ClassData[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [showJoin, setShowJoin] = useState(false);
  const [selectedClass, setSelectedClass] = useState<ClassData | null>(null);
  const [className, setClassName] = useState("");
  const [classDesc, setClassDesc] = useState("");
  const [joinCode, setJoinCode] = useState("");
  const [adminCode, setAdminCode] = useState("");
  const [adminVerified, setAdminVerified] = useState(false);
  const [adminStep, setAdminStep] = useState(true); // true = show admin code input first
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [copied, setCopied] = useState(false);
  const [members, setMembers] = useState<MemberWithProfile[]>([]);
  const [memberCount, setMemberCount] = useState<Record<string, number>>({});

  const fetchClasses = useCallback(async () => {
    if (!user) return;
    
    // Classes I created
    const { data: created } = await supabase
      .from("classes")
      .select("*")
      .eq("teacher_id", user.id)
      .order("created_at", { ascending: false });
    
    if (created) setMyClasses(created as ClassData[]);

    // Classes I joined
    const { data: memberships } = await supabase
      .from("class_members")
      .select("class_id")
      .eq("user_id", user.id);

    if (memberships && memberships.length > 0) {
      const classIds = memberships.map((m) => m.class_id);
      const { data: joined } = await supabase
        .from("classes")
        .select("*")
        .in("id", classIds)
        .neq("teacher_id", user.id);
      if (joined) setJoinedClasses(joined as ClassData[]);
    }

    // Get member counts
    const allClassIds = [...(created || []).map(c => c.id)];
    if (memberships) {
      memberships.forEach(m => { if (!allClassIds.includes(m.class_id)) allClassIds.push(m.class_id); });
    }
    
    const counts: Record<string, number> = {};
    for (const cid of allClassIds) {
      const { count } = await supabase
        .from("class_members")
        .select("*", { count: "exact", head: true })
        .eq("class_id", cid);
      counts[cid] = count || 0;
    }
    setMemberCount(counts);
  }, [user]);

  useEffect(() => {
    fetchClasses();
  }, [fetchClasses]);

  const verifyAdminCode = async () => {
    if (!user || !adminCode.trim()) return;
    setLoading(true);
    setError("");

    const { data } = await supabase
      .from("teacher_codes")
      .select("*")
      .eq("code", adminCode.trim().toUpperCase())
      .eq("used", false)
      .single();

    if (!data) {
      setError("Invalid or already used teacher code.");
      setLoading(false);
      return;
    }

    // Mark code as used
    await supabase
      .from("teacher_codes")
      .update({ used: true, used_by: user.id, used_at: new Date().toISOString() })
      .eq("id", data.id);

    setAdminVerified(true);
    setAdminStep(false);
    setError("");
    setLoading(false);
  };

  const createClass = async () => {
    if (!user || !className.trim() || !adminVerified) return;
    setLoading(true);
    setError("");
    
    const code = generateCode();
    const { error: err } = await supabase.from("classes").insert({
      name: className.trim(),
      description: classDesc.trim(),
      code,
      teacher_id: user.id,
    });

    if (err) {
      setError(err.message);
    } else {
      setClassName("");
      setClassDesc("");
      setAdminCode("");
      setAdminVerified(false);
      setAdminStep(true);
      setShowCreate(false);
      fetchClasses();
    }
    setLoading(false);
  };

  const joinClass = async () => {
    if (!user || !joinCode.trim()) return;
    setLoading(true);
    setError("");

    const { data: classData } = await supabase
      .from("classes")
      .select("*")
      .eq("code", joinCode.trim().toUpperCase())
      .single();

    if (!classData) {
      setError("Class not found. Check the code and try again.");
      setLoading(false);
      return;
    }

    const { error: err } = await supabase.from("class_members").insert({
      class_id: classData.id,
      user_id: user.id,
    });

    if (err) {
      if (err.message.includes("duplicate")) setError("You're already in this class!");
      else setError(err.message);
    } else {
      setJoinCode("");
      setShowJoin(false);
      fetchClasses();
    }
    setLoading(false);
  };

  const deleteClass = async (classId: string) => {
    await supabase.from("classes").delete().eq("id", classId);
    setSelectedClass(null);
    fetchClasses();
  };

  const leaveClass = async (classId: string) => {
    if (!user) return;
    await supabase.from("class_members").delete().eq("class_id", classId).eq("user_id", user.id);
    setSelectedClass(null);
    fetchClasses();
  };

  const openClass = async (cls: ClassData) => {
    setSelectedClass(cls);
    // Fetch members with profiles and scores
    const { data: memberData } = await supabase
      .from("class_members")
      .select("user_id")
      .eq("class_id", cls.id);

    if (memberData) {
      const userIds = memberData.map((m) => m.user_id);
      // Also include teacher
      if (!userIds.includes(cls.teacher_id)) userIds.push(cls.teacher_id);
      
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, display_name, total_score, games_played")
        .in("user_id", userIds)
        .order("total_score", { ascending: false });

      if (profiles) setMembers(profiles as MemberWithProfile[]);
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex flex-col">
        <header className="border-b border-border/20 px-4 py-3 backdrop-blur-sm bg-background/80">
          <div className="max-w-2xl mx-auto flex items-center justify-between">
            <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-5 w-5" /><span className="text-sm">Hub</span>
            </Link>
            <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
              <GraduationCap className="h-5 w-5 text-accent" /> Classroom
            </h1>
            <div className="w-16" />
          </div>
        </header>
        <main className="flex-1 flex flex-col items-center justify-center px-4 text-center">
          <GraduationCap className="h-16 w-16 text-muted-foreground/30 mb-4" />
          <h2 className="font-display font-bold text-2xl text-foreground mb-2">Sign in to continue</h2>
          <p className="text-muted-foreground text-sm mb-6">Create or join a classroom to compete with your class</p>
          <Link to="/auth" className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity">
            <LogIn className="h-5 w-5" /> Sign In
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col relative overflow-hidden">
      <div className="fixed inset-0 pointer-events-none">
        <div className="absolute inset-0 bg-gradient-to-b from-accent/3 via-transparent to-primary/3" />
      </div>

      <header className="border-b border-border/20 px-4 py-3 relative z-10 backdrop-blur-sm bg-background/80">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-5 w-5" /><span className="text-sm">Hub</span>
          </Link>
          <h1 className="font-display font-bold text-lg text-foreground flex items-center gap-2">
            <GraduationCap className="h-5 w-5 text-accent" /> Classroom
          </h1>
          <div className="w-16" />
        </div>
      </header>

      <main className="flex-1 flex flex-col px-4 py-6 max-w-2xl mx-auto w-full relative z-10">
        {/* Actions */}
        <div className="flex gap-3 mb-6">
          <button
            onClick={() => setShowCreate(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity"
          >
            <Plus className="h-5 w-5" /> Create Class
          </button>
          <button
            onClick={() => setShowJoin(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-card/80 border border-border/40 text-foreground rounded-xl font-display font-bold hover:bg-muted/50 transition-colors"
          >
            <DoorOpen className="h-5 w-5" /> Join Class
          </button>
        </div>

        {/* My Classes */}
        {myClasses.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">My Classes (Teacher)</h2>
            <div className="space-y-2">
              {myClasses.map((cls) => (
                <motion.button
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => openClass(cls)}
                  className="w-full flex items-center gap-4 p-4 bg-card/70 backdrop-blur-sm border border-border/40 rounded-xl text-left hover:border-accent/40 hover:bg-accent/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-accent/10 border border-accent/20 flex items-center justify-center">
                    <GraduationCap className="h-5 w-5 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground truncate">{cls.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{cls.code}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{memberCount[cls.id] || 0} students</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {/* Joined Classes */}
        {joinedClasses.length > 0 && (
          <div className="mb-6">
            <h2 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3">Joined Classes</h2>
            <div className="space-y-2">
              {joinedClasses.map((cls) => (
                <motion.button
                  key={cls.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  onClick={() => openClass(cls)}
                  className="w-full flex items-center gap-4 p-4 bg-card/70 backdrop-blur-sm border border-border/40 rounded-xl text-left hover:border-primary/40 hover:bg-primary/5 transition-all"
                >
                  <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-display font-bold text-foreground truncate">{cls.name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Hash className="h-3 w-3" />{cls.code}</span>
                      <span>•</span>
                      <span className="flex items-center gap-1"><Users className="h-3 w-3" />{memberCount[cls.id] || 0} members</span>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </motion.button>
              ))}
            </div>
          </div>
        )}

        {myClasses.length === 0 && joinedClasses.length === 0 && (
          <div className="flex-1 flex flex-col items-center justify-center text-center py-12">
            <GraduationCap className="h-16 w-16 text-muted-foreground/20 mb-4" />
            <h2 className="font-display font-bold text-xl text-foreground mb-2">No classes yet</h2>
            <p className="text-muted-foreground text-sm max-w-xs">
              Create a class to share with your students, or join one with a code from your teacher.
            </p>
          </div>
        )}
      </main>

      {/* Create Class Dialog */}
      <Dialog open={showCreate} onOpenChange={(open) => {
        setShowCreate(open);
        if (!open) {
          setAdminCode("");
          setAdminVerified(false);
          setAdminStep(true);
          setError("");
        }
      }}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <Plus className="h-5 w-5 text-accent" /> Create Class
            </DialogTitle>
            <DialogDescription>
              {adminStep ? "Enter a teacher code to create a class" : "Set up your classroom"}
            </DialogDescription>
          </DialogHeader>

          {adminStep && !adminVerified ? (
            <div className="space-y-4 pt-2">
              <div className="p-4 bg-accent/5 border border-accent/15 rounded-xl">
                <p className="text-xs text-muted-foreground leading-relaxed">
                  To create a class, you need a <span className="text-accent font-bold">teacher code</span>. 
                  Email aceadxm at <a href="mailto:itxwadz@gmail.com" className="text-primary font-bold hover:underline">itxwadz@gmail.com</a> to 
                  request a code. He will provide you with a teacher code to set up your class.
                </p>
              </div>
              <div>
                <label className="text-sm font-display font-bold text-foreground mb-1 block">Teacher Code</label>
                <input
                  value={adminCode}
                  onChange={(e) => setAdminCode(e.target.value.toUpperCase())}
                  placeholder="e.g. TEACH-XXXXXX"
                  className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-lg text-foreground text-center font-display font-bold text-lg tracking-wider placeholder:text-muted-foreground placeholder:text-sm placeholder:tracking-normal focus:outline-none focus:border-accent"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <button
                onClick={verifyAdminCode}
                disabled={loading || !adminCode.trim()}
                className="w-full py-3 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Verifying..." : "Verify Code"}
              </button>
            </div>
          ) : (
            <div className="space-y-4 pt-2">
              <div className="flex items-center gap-2 p-2.5 bg-success/10 border border-success/20 rounded-lg">
                <Check className="h-4 w-4 text-success" />
                <span className="text-xs font-bold text-success">Teacher code verified!</span>
              </div>
              <div>
                <label className="text-sm font-display font-bold text-foreground mb-1 block">Class Name</label>
                <input
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g. Spanish Period 3"
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>
              <div>
                <label className="text-sm font-display font-bold text-foreground mb-1 block">Description (optional)</label>
                <input
                  value={classDesc}
                  onChange={(e) => setClassDesc(e.target.value)}
                  placeholder="e.g. Mrs. Garcia's class"
                  className="w-full px-4 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent"
                />
              </div>
              {error && <p className="text-destructive text-sm">{error}</p>}
              <button
                onClick={createClass}
                disabled={loading || !className.trim()}
                className="w-full py-3 bg-gradient-to-r from-accent to-primary text-accent-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
              >
                {loading ? "Creating..." : "Create Class"}
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Join Class Dialog */}
      <Dialog open={showJoin} onOpenChange={setShowJoin}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-xl flex items-center gap-2">
              <DoorOpen className="h-5 w-5 text-primary" /> Join Class
            </DialogTitle>
            <DialogDescription>Enter the 6-letter code from your teacher</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <input
              value={joinCode}
              onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
              placeholder="Enter class code"
              maxLength={6}
              className="w-full px-4 py-3 bg-muted/50 border border-border/50 rounded-lg text-foreground text-center font-display font-bold text-2xl tracking-[0.3em] placeholder:text-muted-foreground placeholder:text-base placeholder:tracking-normal focus:outline-none focus:border-primary"
            />
            {error && <p className="text-destructive text-sm">{error}</p>}
            <button
              onClick={joinClass}
              disabled={loading || joinCode.length < 6}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "Joining..." : "Join Class"}
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Class Detail Dialog */}
      <Dialog open={!!selectedClass} onOpenChange={() => setSelectedClass(null)}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-lg border-border/50 max-h-[80vh] overflow-y-auto">
          {selectedClass && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-xl flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-accent" />
                  {selectedClass.name}
                </DialogTitle>
                <DialogDescription>{selectedClass.description || "Class leaderboard"}</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 pt-2">
                {/* Class code */}
                <div className="flex items-center gap-3 p-3 bg-muted/30 border border-border/30 rounded-lg">
                  <Hash className="h-4 w-4 text-muted-foreground" />
                  <span className="font-display font-bold text-foreground tracking-widest">{selectedClass.code}</span>
                  <button
                    onClick={() => copyCode(selectedClass.code)}
                    className="ml-auto flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-success" /> : <Copy className="h-3.5 w-3.5" />}
                    {copied ? "Copied!" : "Copy"}
                  </button>
                </div>

                {/* Leaderboard */}
                <div>
                  <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
                    <Trophy className="h-4 w-4 text-secondary" /> Class Leaderboard
                  </h3>
                  <div className="space-y-2">
                    {members.map((m, i) => (
                      <motion.div
                        key={m.user_id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        className={`flex items-center gap-3 p-3 rounded-lg ${
                          i === 0 ? "bg-secondary/10 border border-secondary/20" :
                          i === 1 ? "bg-accent/5 border border-accent/10" :
                          i === 2 ? "bg-primary/5 border border-primary/10" :
                          "bg-muted/20 border border-border/20"
                        }`}
                      >
                        <span className={`font-display font-black text-lg w-8 text-center ${
                          i === 0 ? "text-secondary" : i === 1 ? "text-accent" : i === 2 ? "text-primary" : "text-muted-foreground"
                        }`}>
                          {i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : `#${i + 1}`}
                        </span>
                        <div className="flex-1 min-w-0">
                          <p className="font-display font-bold text-sm text-foreground truncate">
                            {m.display_name || "Anonymous"}
                            {m.user_id === selectedClass.teacher_id && (
                              <span className="ml-1.5 text-[10px] px-1.5 py-0.5 bg-accent/20 text-accent rounded-full font-bold">Teacher</span>
                            )}
                          </p>
                          <p className="text-xs text-muted-foreground">{m.games_played} games played</p>
                        </div>
                        <span className="font-display font-bold text-foreground">{m.total_score}</span>
                      </motion.div>
                    ))}
                    {members.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-4">No members yet. Share the code!</p>
                    )}
                  </div>
                </div>

                {/* Actions */}
                {selectedClass.teacher_id === user?.id ? (
                  <button
                    onClick={() => deleteClass(selectedClass.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm font-display font-bold"
                  >
                    <Trash2 className="h-4 w-4" /> Delete Class
                  </button>
                ) : (
                  <button
                    onClick={() => leaveClass(selectedClass.id)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm font-display font-bold"
                  >
                    <DoorOpen className="h-4 w-4" /> Leave Class
                  </button>
                )}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
