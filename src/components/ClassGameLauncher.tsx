import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Gamepad2, BookOpen } from "lucide-react";
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
}

const GAMES = [
  { id: "wordle", name: "Spanish Wordle", path: "/wordle", icon: "🔤" },
  { id: "verb-match", name: "Verb Match", path: "/verb-match", icon: "🎯" },
  { id: "verb-fishing", name: "Verb Fishing", path: "/verb-fishing", icon: "🎣" },
  { id: "palabra-surge", name: "Palabra Surge", path: "/palabra-surge", icon: "⚡" },
  { id: "duelo", name: "Duelo de Palabras", path: "/duelo", icon: "⚔️" },
  { id: "memoria", name: "Memoria Mágica", path: "/memoria", icon: "🧠" },
];

interface Props {
  classId: string;
}

export default function ClassGameLauncher({ classId }: Props) {
  const navigate = useNavigate();
  const [wordSets, setWordSets] = useState<WordSet[]>([]);
  const [showPicker, setShowPicker] = useState(false);
  const [selectedGame, setSelectedGame] = useState<typeof GAMES[0] | null>(null);

  useEffect(() => {
    supabase
      .from("custom_word_sets")
      .select("id, name, word_type")
      .eq("class_id", classId)
      .then(({ data }) => { if (data) setWordSets(data as WordSet[]); });
  }, [classId]);

  function pickGame(game: typeof GAMES[0]) {
    if (wordSets.length === 0) {
      // No custom sets, just go to game
      navigate(game.path);
      return;
    }
    setSelectedGame(game);
    setShowPicker(true);
  }

  function launchWithSet(setId: string) {
    if (!selectedGame) return;
    navigate(`${selectedGame.path}?classWordSet=${setId}`);
    setShowPicker(false);
  }

  function launchDefault() {
    if (!selectedGame) return;
    navigate(selectedGame.path);
    setShowPicker(false);
  }

  return (
    <div>
      <h3 className="font-display font-bold text-sm text-muted-foreground uppercase tracking-wider mb-3 flex items-center gap-2">
        <Gamepad2 className="h-4 w-4 text-accent" /> Play Games
      </h3>
      <div className="grid grid-cols-2 gap-2">
        {GAMES.map((game) => (
          <button
            key={game.id}
            onClick={() => pickGame(game)}
            className="flex items-center gap-2 p-3 bg-muted/20 border border-border/20 rounded-lg text-left hover:border-accent/30 hover:bg-accent/5 transition-all"
          >
            <span className="text-lg">{game.icon}</span>
            <span className="font-display font-bold text-xs text-foreground">{game.name}</span>
          </button>
        ))}
      </div>

      {/* Word set picker dialog */}
      <Dialog open={showPicker} onOpenChange={setShowPicker}>
        <DialogContent className="sm:max-w-md bg-card/95 backdrop-blur-lg border-border/50">
          <DialogHeader>
            <DialogTitle className="font-display text-lg flex items-center gap-2">
              {selectedGame?.icon} {selectedGame?.name}
            </DialogTitle>
            <DialogDescription>Choose a word set or play with default words</DialogDescription>
          </DialogHeader>
          <div className="space-y-2 pt-2">
            <button
              onClick={launchDefault}
              className="w-full flex items-center gap-3 p-3 bg-muted/20 border border-border/30 rounded-lg hover:border-accent/30 hover:bg-accent/5 transition-all"
            >
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
              <span className="font-display font-bold text-sm text-foreground">Default Words</span>
            </button>
            {wordSets.map((ws) => (
              <button
                key={ws.id}
                onClick={() => launchWithSet(ws.id)}
                className="w-full flex items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg hover:border-primary/40 hover:bg-primary/10 transition-all"
              >
                <BookOpen className="h-4 w-4 text-primary" />
                <div className="text-left">
                  <span className="font-display font-bold text-sm text-foreground block">{ws.name}</span>
                  <span className="text-[10px] text-muted-foreground capitalize">{ws.word_type}</span>
                </div>
              </button>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
