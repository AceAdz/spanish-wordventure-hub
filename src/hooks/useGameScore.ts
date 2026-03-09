import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";
import { useCallback } from "react";

export function useGameScore() {
  const { user } = useAuth();

  const saveScore = useCallback(
    async (gameType: "wordle" | "verb_match" | "verb_fishing" | "duelo_palabras", score: number, accuracy?: number, bestStreak?: number) => {
      if (!user) return;

      try {
        // Insert score
        const { error: scoreError } = await supabase.from("game_scores").insert({
          user_id: user.id,
          game_type: gameType,
          score,
          accuracy: accuracy ?? null,
          best_streak: bestStreak ?? null,
        });

        if (scoreError) {
          console.error("Error inserting score:", scoreError);
          return;
        }

        // Update profile totals
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("total_score, games_played")
          .eq("user_id", user.id)
          .single();

        if (profileError) {
          console.error("Error fetching profile:", profileError);
          return;
        }

        if (profile) {
          const { error: updateError } = await supabase
            .from("profiles")
            .update({
              total_score: profile.total_score + score,
              games_played: profile.games_played + 1,
            })
            .eq("user_id", user.id);

          if (updateError) {
            console.error("Error updating profile:", updateError);
            return;
          }
        }

        // Check and award badges
        await checkBadges(user.id, profile ? profile.total_score + score : score, profile ? profile.games_played + 1 : 1, bestStreak);
      } catch (error) {
        console.error("Error in saveScore:", error);
      }
    },
    [user]
  );

  return { saveScore };
}

async function checkBadges(userId: string, totalScore: number, gamesPlayed: number, bestStreak?: number) {
  const { data: badges } = await supabase.from("badges").select("*");
  const { data: userBadges } = await supabase
    .from("user_badges")
    .select("badge_id")
    .eq("user_id", userId);

  if (!badges) return;
  const ownedIds = new Set(userBadges?.map((ub) => ub.badge_id) ?? []);

  for (const badge of badges) {
    if (ownedIds.has(badge.id)) continue;

    let earned = false;
    switch (badge.requirement_type) {
      case "games_played":
        earned = gamesPlayed >= badge.requirement_value;
        break;
      case "total_score":
        earned = totalScore >= badge.requirement_value;
        break;
      case "best_streak":
        earned = (bestStreak ?? 0) >= badge.requirement_value;
        break;
    }

    if (earned) {
      await supabase.from("user_badges").insert({ user_id: userId, badge_id: badge.id });
    }
  }
}
