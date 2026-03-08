import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setIsAdmin(false);
      setLoading(false);
      return;
    }
    
    supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle()
      .then(({ data }) => {
        setIsAdmin(!!data);
        setLoading(false);
      });
  }, [user]);

  const deleteUserData = useCallback(async (targetUserId: string) => {
    if (!isAdmin) return false;
    const { error } = await supabase.rpc("admin_delete_user_data", {
      target_user_id: targetUserId,
    });
    return !error;
  }, [isAdmin]);

  return { isAdmin, loading, deleteUserData };
}
