import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";

export function useAdmin() {
  const { user } = useAuth();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);

  const checkAdmin = useCallback(async () => {
    if (!user) { setIsAdmin(false); setLoading(false); return; }
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .maybeSingle();
    setIsAdmin(!!data);
    setLoading(false);
  }, [user]);

  useEffect(() => { checkAdmin(); }, [checkAdmin]);

  const deleteUserData = useCallback(async (targetUserId: string) => {
    if (!isAdmin) return false;
    const { error } = await supabase.rpc("admin_delete_user_data", { target_user_id: targetUserId });
    return !error;
  }, [isAdmin]);

  const claimAdminCode = useCallback(async (code: string): Promise<boolean> => {
    if (!user) return false;
    const { data, error } = await supabase.rpc("claim_admin_code", { code_input: code });
    if (!error && data) {
      setIsAdmin(true);
      return true;
    }
    return false;
  }, [user]);

  return { isAdmin, loading, deleteUserData, claimAdminCode, recheckAdmin: checkAdmin };
}
