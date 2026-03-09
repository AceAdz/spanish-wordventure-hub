import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

export function useStreak() {
  const { user } = useAuth();
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  useEffect(() => {
    if (user) recordLogin();
  }, [user]);

  async function recordLogin() {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0]; // YYYY-MM-DD

    const { data: profile } = await supabase
      .from("profiles")
      .select("current_streak, best_streak_days, last_login_date")
      .eq("user_id", user.id)
      .single();

    if (!profile) return;

    const lastLogin = profile.last_login_date;

    // Already logged in today
    if (lastLogin === today) {
      setCurrentStreak(profile.current_streak);
      setBestStreak(profile.best_streak_days);
      return;
    }

    // Calculate new streak
    let newStreak = 1;
    if (lastLogin) {
      const lastDate = new Date(lastLogin);
      const todayDate = new Date(today);
      const diffMs = todayDate.getTime() - lastDate.getTime();
      const diffDays = Math.round(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        // Consecutive day
        newStreak = profile.current_streak + 1;
      }
      // If diffDays > 1, streak resets to 1
    }

    const newBest = Math.max(profile.best_streak_days, newStreak);

    await supabase
      .from("profiles")
      .update({
        current_streak: newStreak,
        best_streak_days: newBest,
        last_login_date: today,
      })
      .eq("user_id", user.id);

    setCurrentStreak(newStreak);
    setBestStreak(newBest);
  }

  return { currentStreak, bestStreak };
}
