
-- Update has_role to treat 'owner' as having 'admin' privileges too
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND (
      role = _role
      OR (role = 'owner' AND _role = 'admin')
    )
  )
$$;

-- Allow everyone to read roles (needed for leaderboard tags)
DROP POLICY IF EXISTS "Users can read own roles" ON public.user_roles;
CREATE POLICY "Anyone can read roles"
ON public.user_roles FOR SELECT
USING (true);
