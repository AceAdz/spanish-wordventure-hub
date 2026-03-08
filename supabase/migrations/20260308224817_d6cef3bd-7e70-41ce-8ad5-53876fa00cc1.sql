
-- Remove the policy that lets anyone read admin codes
DROP POLICY IF EXISTS "Authenticated can read admin codes" ON public.admin_codes;

-- No SELECT policy = nobody can read codes from client side
-- The claim_admin_code function uses SECURITY DEFINER so it bypasses RLS
