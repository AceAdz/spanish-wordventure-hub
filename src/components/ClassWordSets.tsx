import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Plus, Trash2, Upload, FileText, BookOpen, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

interface WordSet {
  id: string;
  name: string;
  word_type: string;
  created_at: string;
}

interface CustomWord {
  id: string;
  spanish: string;
  english: string;
  verb_infinitive: string | null;
  tense: string | null;
  conjugated_form: string | null;
}

interface Props {
  classId: string;
  isTeacher: boolean;
}

export default function ClassWordSets({ classId, isTeacher }: Props) {
  const { user } = useAuth();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [selectedSet, setSelectedSet] = useState<WordSet | null>(null);
  const [words, setWords] = useState<CustomWord[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [setName, setSetName] = useState("");
  const [wordType, setWordType] = useState<"vocabulary" | "conjugation">("vocabulary");
  const [loading, setLoading] = useState(false);

  // Add word form
  const [spanish, setSpanish] = useState("");
  const [english, setEnglish] = useState("");
  const [verbInf, setVerbInf] = useState("");
  const [tense, setTense] = useState("");
  const [conjugated, setConjugated] = useState("");

  useEffect(() => {
    fetchWordSets();
  }, [classId]);

  async function fetchWordSets() {
    const { data } = await supabase
      .from("custom_word_sets")
      .select("*")
      .eq("class_id", classId)
      .order("created_at", { ascending: false });
    if (data) setWordSets(data as WordSet[]);
  }

  async function fetchWords(setId: string) {
    const { data } = await supabase
      .from("custom_words")
      .select("*")
      .eq("word_set_id", setId)
      .order("created_at", { ascending: true });
    if (data) setWords(data as CustomWord[]);
  }

  async function createWordSet() {
    if (!setName.trim()) return;
    setLoading(true);
    await supabase.from("custom_word_sets").insert({
      class_id: classId,
      name: setName.trim(),
      word_type: wordType,
    });
    setSetName("");
    setShowCreate(false);
    setLoading(false);
    fetchWordSets();
  }

  async function deleteWordSet(id: string) {
    await supabase.from("custom_word_sets").delete().eq("id", id);
    setSelectedSet(null);
    fetchWordSets();
  }

  async function addWord() {
    if (!selectedSet || !spanish.trim() || !english.trim()) return;
    await supabase.from("custom_words").insert({
      word_set_id: selectedSet.id,
      spanish: spanish.trim(),
      english: english.trim(),
      verb_infinitive: verbInf.trim() || null,
      tense: tense.trim() || null,
      conjugated_form: conjugated.trim() || null,
    });
    setSpanish("");
    setEnglish("");
    setVerbInf("");
    setTense("");
    setConjugated("");
    fetchWords(selectedSet.id);
  }

  async function deleteWord(id: string) {
    if (!selectedSet) return;
    await supabase.from("custom_words").delete().eq("id", id);
    fetchWords(selectedSet.id);
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    if (!selectedSet || !e.target.files?.[0]) return;
    const file = e.target.files[0];
    const text = await file.text();
    const lines = text.split("\n").filter(l => l.trim());
    
    const newWords: Array<{
      word_set_id: string;
      spanish: string;
      english: string;
      verb_infinitive: string | null;
      tense: string | null;
      conjugated_form: string | null;
    }> = [];

    for (const line of lines) {
      // Support CSV or tab-separated: spanish, english[, infinitive, tense, conjugated]
      const parts = line.split(/[,\t]/).map(p => p.trim());
      if (parts.length >= 2) {
        newWords.push({
          word_set_id: selectedSet.id,
          spanish: parts[0],
          english: parts[1],
          verb_infinitive: parts[2] || null,
          tense: parts[3] || null,
          conjugated_form: parts[4] || null,
        });
      }
    }

    if (newWords.length > 0) {
      await supabase.from("custom_words").insert(newWords);
      fetchWords(selectedSet.id);
    }
    e.target.value = "";
  }

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider flex items-center gap-2">
          <BookOpen className="h-4 w-4 text-primary" /> Word Sets
        </h3>
        {isTeacher && (
          <button
            onClick={() => setShowCreate(true)}
            className="flex items-center gap-1 text-xs text-primary hover:text-primary/80 font-bold transition-colors"
          >
            <Plus className="h-3.5 w-3.5" /> New Set
          </button>
        )}
      </div>

      {wordSets.length === 0 ? (
        <p className="text-xs text-muted-foreground text-center py-4">
          {isTeacher ? "Create a word set for your students" : "No custom word sets yet"}
        </p>
      ) : (
        <div className="space-y-2">
          {wordSets.map((ws) => (
            <motion.button
              key={ws.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              onClick={() => { setSelectedSet(ws); fetchWords(ws.id); }}
              className="w-full flex items-center gap-3 p-3 bg-muted/20 border border-border/20 rounded-lg text-left hover:border-primary/30 hover:bg-primary/5 transition-all"
            >
              <FileText className="h-4 w-4 text-primary" />
              <div className="flex-1 min-w-0">
                <p className="font-display font-bold text-sm text-foreground truncate">{ws.name}</p>
                <p className="text-[10px] text-muted-foreground capitalize">{ws.word_type}</p>
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {/* Create Word Set Dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-lg">New Word Set</DialogTitle>
            <DialogDescription>Create a custom word set for your class</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <div>
              <label className="text-sm font-display font-bold text-foreground mb-1 block">Set Name</label>
              <input
                value={setName}
                onChange={(e) => setSetName(e.target.value)}
                placeholder="e.g. Chapter 5 Vocabulary"
                className="w-full px-4 py-2.5 bg-muted/50 border border-border/50 rounded-lg text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-sm font-display font-bold text-foreground mb-1 block">Type</label>
              <div className="flex gap-2">
                <button
                  onClick={() => setWordType("vocabulary")}
                  className={`flex-1 py-2 rounded-lg text-sm font-display font-bold transition-colors ${
                    wordType === "vocabulary" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  Vocabulary
                </button>
                <button
                  onClick={() => setWordType("conjugation")}
                  className={`flex-1 py-2 rounded-lg text-sm font-display font-bold transition-colors ${
                    wordType === "conjugation" ? "bg-primary text-primary-foreground" : "bg-muted/30 text-muted-foreground hover:bg-muted/50"
                  }`}
                >
                  Conjugation
                </button>
              </div>
            </div>
            <button
              onClick={createWordSet}
              disabled={loading || !setName.trim()}
              className="w-full py-3 bg-gradient-to-r from-primary to-accent text-primary-foreground rounded-xl font-display font-bold hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              Create Set
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Word Set Detail Dialog */}
      <Dialog open={!!selectedSet} onOpenChange={() => setSelectedSet(null)}>
        <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-lg border-border/50 max-h-[85vh] overflow-y-auto">
          {selectedSet && (
            <>
              <DialogHeader>
                <DialogTitle className="font-display text-lg flex items-center gap-2">
                  <FileText className="h-4 w-4 text-primary" /> {selectedSet.name}
                </DialogTitle>
                <DialogDescription className="capitalize">{selectedSet.word_type} set • {words.length} words</DialogDescription>
              </DialogHeader>

              {isTeacher && (
                <div className="space-y-3 pt-2">
                  {/* File upload */}
                  <div className="flex items-center gap-2">
                    <label className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-muted/30 border border-dashed border-border/50 rounded-lg text-sm text-muted-foreground hover:border-primary/40 hover:text-foreground cursor-pointer transition-all">
                      <Upload className="h-4 w-4" /> Upload CSV / TXT
                      <input type="file" accept=".csv,.txt,.tsv" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  <p className="text-[10px] text-muted-foreground">
                    Format: spanish, english{selectedSet.word_type === "conjugation" ? ", infinitive, tense, conjugated" : ""} (one per line)
                  </p>

                  {/* Manual add */}
                  <div className="p-3 bg-muted/10 border border-border/20 rounded-lg space-y-2">
                    <p className="text-xs font-display font-bold text-foreground">Add Word</p>
                    <div className="grid grid-cols-2 gap-2">
                      <input value={spanish} onChange={e => setSpanish(e.target.value)} placeholder="Spanish" className="px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                      <input value={english} onChange={e => setEnglish(e.target.value)} placeholder="English" className="px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                    </div>
                    {selectedSet.word_type === "conjugation" && (
                      <div className="grid grid-cols-3 gap-2">
                        <input value={verbInf} onChange={e => setVerbInf(e.target.value)} placeholder="Infinitive" className="px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                        <input value={tense} onChange={e => setTense(e.target.value)} placeholder="Tense" className="px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                        <input value={conjugated} onChange={e => setConjugated(e.target.value)} placeholder="Conjugated" className="px-3 py-2 bg-muted/50 border border-border/50 rounded-lg text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary" />
                      </div>
                    )}
                    <button
                      onClick={addWord}
                      disabled={!spanish.trim() || !english.trim()}
                      className="w-full py-2 bg-primary text-primary-foreground rounded-lg text-sm font-display font-bold hover:opacity-90 disabled:opacity-50 transition-opacity"
                    >
                      <Plus className="h-3.5 w-3.5 inline mr-1" /> Add
                    </button>
                  </div>
                </div>
              )}

              {/* Word list */}
              <div className="space-y-1 max-h-48 overflow-y-auto">
                <AnimatePresence>
                  {words.map((w) => (
                    <motion.div
                      key={w.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center gap-2 p-2 bg-muted/10 rounded-lg text-sm"
                    >
                      <span className="font-bold text-foreground">{w.spanish}</span>
                      <span className="text-muted-foreground">→</span>
                      <span className="text-muted-foreground flex-1">{w.english}</span>
                      {w.conjugated_form && (
                        <span className="text-[10px] text-primary bg-primary/10 px-1.5 py-0.5 rounded">{w.tense}: {w.conjugated_form}</span>
                      )}
                      {isTeacher && (
                        <button onClick={() => deleteWord(w.id)} className="text-destructive/60 hover:text-destructive transition-colors">
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </motion.div>
                  ))}
                </AnimatePresence>
                {words.length === 0 && (
                  <p className="text-xs text-muted-foreground text-center py-4">No words yet. Add some above!</p>
                )}
              </div>

              {isTeacher && (
                <button
                  onClick={() => deleteWordSet(selectedSet.id)}
                  className="w-full flex items-center justify-center gap-2 py-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors text-sm font-display font-bold"
                >
                  <Trash2 className="h-3.5 w-3.5" /> Delete Word Set
                </button>
              )}
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
