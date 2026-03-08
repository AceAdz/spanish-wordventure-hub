
-- Insert Admin badge
INSERT INTO public.badges (id, name, description, icon, requirement_type, requirement_value)
VALUES ('a1b2c3d4-e5f6-7890-abcd-ef1234567890', 'Admin', 'Granted administrator privileges', '🛡️', 'admin', 1)
ON CONFLICT DO NOTHING;

-- Update claim_admin_code to also grant the admin badge
CREATE OR REPLACE FUNCTION public.claim_admin_code(code_input text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  code_record record;
  admin_badge_id uuid;
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

  -- Grant Admin badge
  SELECT id INTO admin_badge_id FROM public.badges WHERE name = 'Admin' LIMIT 1;
  IF admin_badge_id IS NOT NULL THEN
    INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (auth.uid(), admin_badge_id)
      ON CONFLICT DO NOTHING;
  END IF;

  RETURN true;
END;
$$;

-- Also grant existing admins the badge
INSERT INTO public.user_badges (user_id, badge_id)
SELECT ur.user_id, b.id
FROM public.user_roles ur
CROSS JOIN public.badges b
WHERE ur.role = 'admin' AND b.name = 'Admin'
ON CONFLICT DO NOTHING;
