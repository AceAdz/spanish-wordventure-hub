
-- Admin codes table
CREATE TABLE public.admin_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_by uuid DEFAULT NULL,
  used_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_codes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated can read admin codes"
ON public.admin_codes
FOR SELECT
TO authenticated
USING (true);

CREATE POLICY "Users can claim unused admin codes"
ON public.admin_codes
FOR UPDATE
TO authenticated
USING (used = false)
WITH CHECK (used_by = auth.uid() AND used = true);

-- Function to claim admin code and grant admin role
CREATE OR REPLACE FUNCTION public.claim_admin_code(code_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record record;
BEGIN
  SELECT * INTO code_record FROM public.admin_codes
    WHERE code = code_input AND used = false;
  
  IF NOT FOUND THEN
    RETURN false;
  END IF;

  UPDATE public.admin_codes
    SET used = true, used_by = auth.uid(), used_at = now()
    WHERE id = code_record.id;

  INSERT INTO public.user_roles (user_id, role)
    VALUES (auth.uid(), 'admin')
    ON CONFLICT (user_id, role) DO NOTHING;

  RETURN true;
END;
$$;
