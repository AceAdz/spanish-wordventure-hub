
-- Table to store admin-issued teacher codes
CREATE TABLE public.teacher_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text UNIQUE NOT NULL,
  used boolean NOT NULL DEFAULT false,
  used_by uuid DEFAULT NULL,
  used_at timestamp with time zone DEFAULT NULL,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.teacher_codes ENABLE ROW LEVEL SECURITY;

-- Anyone can check if a code exists (needed for validation)
CREATE POLICY "Anyone can read teacher codes"
ON public.teacher_codes
FOR SELECT
TO authenticated
USING (true);

-- Only the system can insert (we'll insert via the insert tool)
-- Users can update a code to mark it as used (only unused codes, only setting their own user_id)
CREATE POLICY "Users can claim unused codes"
ON public.teacher_codes
FOR UPDATE
TO authenticated
USING (used = false)
WITH CHECK (used_by = auth.uid() AND used = true);
